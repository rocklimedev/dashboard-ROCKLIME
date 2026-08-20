import React, { useState, useMemo, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  useGetOrderDetailsQuery,
  useAddCommentMutation,
  useGetCommentsQuery,
  useDeleteCommentMutation,
  useDeleteOrderMutation,
  useUpdateOrderStatusMutation,
  useUploadInvoiceMutation,
  useLazyDownloadInvoiceQuery,
  useIssueGatePassMutation,
  useGetOrderDispatchesQuery,
  useGetOrderActivityQuery,
  useUploadReceivingDocumentMutation,
  useGetOrderCreditNotesQuery, // ← NEW
} from "../../api/orderApi";
import {
  useGetCustomerByIdQuery,
  useGetCustomersQuery,
} from "../../api/customerApi";
import { useGetQuotationByIdQuery } from "../../api/quotationApi";
import { useGetAllAddressesQuery } from "../../api/addressApi";
import { useGetAllTeamsQuery } from "../../api/teamApi";
import { useGetProfileQuery } from "../../api/userApi";
import {
  Button,
  Card,
  Table,
  Typography,
  Badge,
  Space,
  Dropdown,
  Menu,
  Row,
  Col,
  Spin,
  Alert,
  Input,
  Upload,
  message,
  Form,
  Timeline,
  Tag,
  Empty,
  Pagination,
} from "antd";
import {
  EllipsisOutlined,
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  EditOutlined,
  DownloadOutlined,
  FilePdfOutlined,
  SendOutlined,
  CarOutlined,
  HistoryOutlined,
  RollbackOutlined, // ← NEW
} from "@ant-design/icons";
import { Document, Page, pdfjs } from "react-pdf";
import noimg from "../../assets/img/noimg.jpg";
import useProductsData from "../../utils/useProductdata";
import AddAddress from "../../components/Address/AddAddressModal";
import CommentRow from "../../components/Orders/CommentRow";
import DispatchModal from "../../components/modals/DispatchModal";
import OrderCreditNoteModal from "../../components/modals/OrderCreditNoteModal"; // ← NEW
import { Helmet } from "react-helmet";
import "../../components/Orders/orderpage.css"; // ← new / updated stylesheet

pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js`;

const { Title, Text } = Typography;

// Maps order_activity "action" values to a Tag color so the timeline is
// scannable at a glance.
const ACTIVITY_TAG_COLOR = {
  DISPATCH_CREATED: "blue",
  CREDIT_NOTE_UPLOADED: "purple",
  RECEIVING_DOCUMENT_UPLOADED: "cyan",
  GATE_PASS_ISSUED: "geekblue",
  INVOICE_UPLOADED: "gold",
  ORDER_CREATED: "green",
  ORDER_UPDATED: "orange",
  ORDER_STATUS_UPDATE: "orange",
  ORDER_DELETED: "red",
};

const OrderPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // ── STATE ────────────────────────────────────────
  const [newComment, setNewComment] = useState("");
  const [commentPage, setCommentPage] = useState(1);
  const [invoiceFile, setInvoiceFile] = useState(null);
  const [gatePassFile, setGatePassFile] = useState(null);
  const [receivingDocFile, setReceivingDocFile] = useState(null); // ← NEW
  const [isBillingModalVisible, setIsBillingModalVisible] = useState(false);
  const [isShippingModalVisible, setIsShippingModalVisible] = useState(false);
  const [showDispatchModal, setShowDispatchModal] = useState(false); // ← NEW
  const [showCreditNoteModal, setShowCreditNoteModal] = useState(false); // ← NEW
  const [activityPage, setActivityPage] = useState(1); // ← NEW

  const commentLimit = 10;
  const activityLimit = 10;

  // ── RTK QUERIES & MUTATIONS ──────────────────────
  const { data: profileData } = useGetProfileQuery();
  const user = profileData?.user || {};

  const {
    data: orderData,
    isLoading: orderLoading,
    error: orderError,
    refetch: refetchOrder,
  } = useGetOrderDetailsQuery(id);
  const order = orderData?.order || {};

  const { data: commentData, isLoading: commentLoading } = useGetCommentsQuery(
    {
      resourceId: id,
      resourceType: "Order",
      page: commentPage,
      limit: commentLimit,
    },
    { skip: !id },
  );

  // ← NEW: dispatch history
  const {
    data: dispatchesData,
    isLoading: dispatchesLoading,
    refetch: refetchDispatches,
  } = useGetOrderDispatchesQuery(id, { skip: !id });
  const dispatches = dispatchesData?.dispatches || [];

  // ← NEW: credit note history
  const {
    data: creditNotesData,
    isLoading: creditNotesLoading,
    refetch: refetchCreditNotes,
  } = useGetOrderCreditNotesQuery(id, { skip: !id });
  const creditNotes = creditNotesData?.creditNotes || [];

  // ← NEW: order activity feed
  const { data: activityData, isLoading: activityLoading } =
    useGetOrderActivityQuery(
      { orderId: id, page: activityPage, limit: activityLimit },
      { skip: !id },
    );
  const activities = activityData?.activities || [];
  const activityTotal = activityData?.totalCount || 0;

  const { data: customerData } = useGetCustomerByIdQuery(order.createdFor, {
    skip: !order.createdFor,
  });
  const customer = customerData?.data || {};

  const { data: addressesData, refetch: refetchAddresses } =
    useGetAllAddressesQuery(
      { customerId: order.createdFor },
      { skip: !order.createdFor },
    );

  const quotationId = order.quotationId || order.quotation?.quotationId;
  const { data: fullQuotation } = useGetQuotationByIdQuery(quotationId, {
    skip: !quotationId,
  });

  const { data: customersData } = useGetCustomersQuery();

  const [deleteOrder] = useDeleteOrderMutation();
  const [addComment] = useAddCommentMutation();
  const [deleteComment] = useDeleteCommentMutation();
  const [uploadInvoice, { isLoading: isUploading }] =
    useUploadInvoiceMutation();
  const [issueGatePass, { isLoading: isGatePassUploading }] =
    useIssueGatePassMutation();
  const [uploadReceivingDocument, { isLoading: isReceivingDocUploading }] =
    useUploadReceivingDocumentMutation(); // ← NEW
  const [triggerInvoiceDownload] = useLazyDownloadInvoiceQuery();

  // ── PRODUCTS & MERGING LOGIC (unchanged) ─────────
  const products = useMemo(() => {
    if (fullQuotation?.products && Array.isArray(fullQuotation.products))
      return fullQuotation.products;
    if (
      order?.quotationData?.products &&
      Array.isArray(order.quotationData.products)
    )
      return order.quotationData.products;
    if (order?.quotationItems && Array.isArray(order.quotationItems))
      return order.quotationItems;
    if (order.quotation?.products) {
      try {
        const qp =
          typeof order.quotation.products === "string"
            ? JSON.parse(order.quotation.products)
            : order.quotation.products;
        if (Array.isArray(qp)) return qp;
      } catch {}
    }
    return order.products || [];
  }, [fullQuotation, order]);

  const { productsData, loading: productsLoading } = useProductsData(
    products.map((p) => ({
      productId: p.productId || p.id,
      price: p.price || 0,
      total: p.total || 0,
      discount: p.discount || 0,
      quantity: p.quantity || 1,
    })),
  );

  const mergedProducts = useMemo(() => {
    return products.map((original, index) => {
      const pd =
        productsData.find(
          (p) => p.productId === (original.productId || original.id),
        ) || {};
      let imageUrl = original.imageUrl || pd.images?.[0] || noimg;
      let code = String(
        original.companyCode || pd.product_code || original.sku || "N/A",
      ).trim();
      let brand = pd.brandName || "N/A";
      if (pd.metaDetails) {
        const brandMeta = pd.metaDetails.find(
          (m) => m.title === "brandName" || m.title === "brand",
        );
        brand = brandMeta?.value || brand;
      }
      if (/^[0-9a-fA-F-]{36}$/.test(brand)) brand = "N/A";

      return {
        productId: original.productId || original.id,
        name: pd.name || original.name || "Unnamed Product",
        sku: code,
        brand,
        image: imageUrl,
        price: parseFloat(
          pd.metaDetails?.find((m) => m.title === "Selling Price")?.value ||
            original.price ||
            0,
        ),
        quantity: original.quantity || 1,
        discount: parseFloat(original.discount || 0),
        discountType: original.discountType || "fixed", // ← added
        total: parseFloat(original.total || 0),
      };
    });
  }, [products, productsData]);
  const comments = useMemo(() => commentData?.comments || [], [commentData]);
  const totalComments = commentData?.totalCount || 0;

  const quotationDetails = useMemo(
    () => ({
      quotationId: quotationId,
      document_title: order.quotation?.document_title || "N/A",
      reference_number: order.quotation?.reference_number || "N/A",
      quotation_date: order.quotation?.quotation_date,
      due_date: order.quotation?.due_date,
      followupDates: order.quotation?.followupDates
        ? typeof order.quotation.followupDates === "string"
          ? JSON.parse(order.quotation.followupDates)
          : order.quotation.followupDates
        : [],
      finalAmount: parseFloat(order.quotation?.finalAmount || 0),
    }),
    [order, quotationId],
  );

  const billingAddress =
    addressesData?.find((a) => a.status === "BILLING") || null;
  const shippingAddress =
    addressesData?.find((a) => a.status === "ADDITIONAL") ||
    order.shippingAddress ||
    null;

  const invoiceUrl = order.invoiceLink ? `${order.invoiceLink}` : null;
  const gatePassUrl = order.gatePassLink ? `${order.gatePassLink}` : null;
  const receivingDocUrl = order.receivingDocumentLink // ← NEW
    ? `${order.receivingDocumentLink}`
    : null;

  const isDispatched = order.status === "DISPATCHED";

  // Dispatch is only meaningful once the order is past drafting/prep and
  // hasn't already been closed out or returned.
  const canDispatchThisOrder = ![
    "DRAFT",
    "CANCELED",
    "CLOSED",
    "RETURNED",
  ].includes(order.status); // ← NEW

  // Credit notes only make sense once the order has actually moved past
  // drafting and hasn't been canceled outright.
  const canCreateCreditNote = !["DRAFT", "CANCELED"].includes(order.status); // ← NEW

  // ── HANDLERS (mostly unchanged) ─────────────────
  const handleInvoiceChange = ({ file }) => {
    if (file.type === "application/pdf") setInvoiceFile(file);
    else message.error("Only PDF files allowed for invoice.");
  };

  const handleGatePassChange = ({ file }) => {
    const allowed = ["application/pdf", "image/png", "image/jpeg", "image/jpg"];
    if (allowed.includes(file.type)) setGatePassFile(file);
    else message.error("Only PDF, PNG, JPG allowed for gate pass.");
  };

  // ← NEW
  const handleReceivingDocChange = ({ file }) => {
    const allowed = ["application/pdf", "image/png", "image/jpeg", "image/jpg"];
    if (allowed.includes(file.type)) setReceivingDocFile(file);
    else message.error("Only PDF, PNG, JPG allowed for receiving document.");
  };

  const handleInvoiceSubmit = async () => {
    if (!invoiceFile) return message.error("Select a PDF file.");
    const formData = new FormData();
    formData.append("invoice", invoiceFile);
    try {
      await uploadInvoice({ orderId: id, formData }).unwrap();
      setInvoiceFile(null);
      refetchOrder();
      message.success("Invoice uploaded");
    } catch (err) {
      message.error(err.data?.message || "Upload failed");
    }
  };

  const handleGatePassSubmit = async () => {
    if (!gatePassFile) return message.error("Select a file.");
    const formData = new FormData();
    formData.append("gatepass", gatePassFile);
    try {
      await issueGatePass({ orderId: id, formData }).unwrap();
      setGatePassFile(null);
      refetchOrder();
      message.success("Gate pass issued");
    } catch (err) {
      message.error(err.data?.message || "Upload failed");
    }
  };

  // ← NEW
  const handleReceivingDocSubmit = async () => {
    if (!receivingDocFile) return message.error("Select a file.");
    const formData = new FormData();
    formData.append("file", receivingDocFile);
    try {
      await uploadReceivingDocument({ orderId: id, formData }).unwrap();
      setReceivingDocFile(null);
      refetchOrder();
      message.success("Receiving document uploaded");
    } catch (err) {
      message.error(err.data?.message || "Upload failed");
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return message.error("Comment cannot be empty");
    try {
      await addComment({
        resourceId: id,
        resourceType: "Order",
        userId: String(user.userId || "").trim(),
        comment: newComment,
      }).unwrap();
      setNewComment("");
      message.success("Comment added");
    } catch (err) {
      message.error(err.data?.message || "Failed to add comment");
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm("Delete this comment?")) return;
    try {
      await deleteComment({
        commentId,
        userId: String(user.userId || "").trim(),
      }).unwrap();
    } catch (err) {
      message.error(err.data?.message || "Delete failed");
    }
  };

  const handleDeleteOrder = async () => {
    if (!window.confirm("Delete this order?")) return;
    try {
      await deleteOrder(id).unwrap();
      navigate("/orders/list");
    } catch (err) {
      message.error(err.data?.message || "Delete failed");
    }
  };
  const handleDownloadFile = async (type) => {
    if (!id) return;
    try {
      // Retrieve token from localStorage/sessionStorage
      const token =
        localStorage.getItem("token") || sessionStorage.getItem("token");
      if (!token) throw new Error("Not authenticated");

      const res = await fetch(
        `https://api.cmtradingco.com/api/order/${id}/download?type=${type}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!res.ok) throw new Error(`Download failed: ${res.status}`);

      const blob = await res.blob();
      const blobUrl = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = blobUrl;
      const filename =
        type === "invoice"
          ? `Invoice-${order.orderNo}.pdf`
          : `GatePass-${order.orderNo}${order.gatePassLink?.endsWith(".pdf") ? ".pdf" : ".jpg"}`;
      a.download = filename;

      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      message.error(err.message || "Download failed");
    }
  };

  // ← NEW: dispatch modal success handler
  const handleDispatchSuccess = () => {
    refetchOrder();
    refetchDispatches();
  };

  // ← NEW: credit note modal success handler
  const handleCreditNoteSuccess = () => {
    refetchOrder();
    refetchCreditNotes();
  };

  const menu = (
    <Menu>
      <Menu.Item key="edit" onClick={() => navigate(`/order/${id}/edit`)}>
        Edit Order
      </Menu.Item>
      <Menu.Item key="delete" danger onClick={handleDeleteOrder}>
        Delete Order
      </Menu.Item>
    </Menu>
  );

  // ── CALCULATIONS (unchanged) ─────────────────────
  const lineItemsTotal = mergedProducts.reduce(
    (sum, p) => sum + (parseFloat(p.total) || 0),
    0,
  );
  const finalAmount = parseFloat(order.finalAmount || 0);

  if (orderLoading || productsLoading) {
    return (
      <div className="page-loading">
        <Spin size="large" />
        <Text>Loading order details...</Text>
      </div>
    );
  }

  if (orderError || !order.id) {
    return (
      <Alert
        message="Error"
        description={orderError?.data?.message || "Order not found"}
        type="error"
        showIcon
      />
    );
  }

  return (
    <div className="page-wrapper">
      <div className="content">
        <Helmet>
          <title>Order #{order.orderNo} | CM Trading</title>
        </Helmet>

        <Row gutter={[24, 24]}>
          {/* ── MAIN CONTENT ──────────────────────────────────────────────── */}
          <Col xs={24} lg={16} xl={18}>
            {/* Products Card */}
            <Card className="section-card products-card">
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: 12,
                }}
              >
                <Title level={3} style={{ margin: 0 }}>
                  Order #{order.orderNo}{" "}
                  <Badge
                    status={
                      order.status === "DRAFT"
                        ? "warning"
                        : order.status === "ONHOLD"
                          ? "error"
                          : "success"
                    }
                    text={order.status?.replace(/_/g, " ")}
                  />
                </Title>

                {/* ← NEW: Dispatch + Credit Note buttons */}
                <Space wrap>
                  {canDispatchThisOrder && (
                    <Button
                      type="primary"
                      icon={<CarOutlined />}
                      onClick={() => setShowDispatchModal(true)}
                    >
                      Dispatch
                    </Button>
                  )}
                  {canCreateCreditNote && (
                    <Button
                      icon={<RollbackOutlined />}
                      onClick={() => setShowCreditNoteModal(true)}
                    >
                      Add Credit Note
                    </Button>
                  )}
                </Space>
              </div>

              <Table
                dataSource={mergedProducts}
                rowKey="productId"
                pagination={false}
                scroll={{ x: "max-content" }}
                columns={[
                  {
                    title: "Product",
                    key: "product",
                    render: (_, record) => (
                      <div className="product-cell">
                        <img
                          src={record.image}
                          alt={record.name}
                          className="product-thumb"
                          onError={(e) => (e.target.src = { noimg })}
                        />
                        <div>
                          <div className="product-name">{record.name}</div>
                          <div className="product-meta">{record.sku}</div>
                        </div>
                      </div>
                    ),
                  },
                  {
                    title: "Qty",
                    dataIndex: "quantity",
                    width: 80,
                    align: "center",
                  },
                  {
                    title: "Price",
                    dataIndex: "price",
                    width: 100,
                    render: (v) => `₹${parseFloat(v).toFixed(2)}`,
                  },
                  {
                    title: "Discount",
                    key: "discount",
                    width: 110,
                    align: "center",
                    render: (_, record) => {
                      const discountVal = parseFloat(record.discount || 0);
                      if (!discountVal)
                        return <span className="no-discount">—</span>;
                      const isPercent = record.discountType === "percent";
                      return (
                        <span className="discount-tag">
                          {isPercent
                            ? `${discountVal}%`
                            : `₹${discountVal.toFixed(2)}`}
                        </span>
                      );
                    },
                  },
                  {
                    title: "Total",
                    key: "total",
                    width: 120,
                    align: "right",
                    render: (_, r) => (
                      <strong>₹{parseFloat(r.total).toFixed(2)}</strong>
                    ),
                  },
                ]}
                footer={() => {
                  const itemDiscountTotal = mergedProducts.reduce((sum, p) => {
                    if (!p.discount) return sum;
                    return (
                      sum +
                      (p.discountType === "percent"
                        ? (p.price * p.quantity * p.discount) / 100
                        : p.discount)
                    );
                  }, 0);

                  const globalDiscountValue = parseFloat(
                    order.extraDiscountValue || 0,
                  );
                  const globalDiscountFromQuotation = parseFloat(
                    order.quotation?.discountAmount ||
                      order.quotationDetails?.discountAmount ||
                      0,
                  );
                  const effectiveGlobalDiscount =
                    globalDiscountValue > 0
                      ? globalDiscountValue
                      : globalDiscountFromQuotation;
                  const globalDiscountLabel =
                    order.extraDiscountType === "percent" &&
                    globalDiscountValue > 0
                      ? `${order.extraDiscount || order.extraDiscountValue}%`
                      : `₹${effectiveGlobalDiscount.toFixed(2)}`;

                  return (
                    <div className="table-summary">
                      <div className="summary-row">
                        <span>Subtotal</span>
                        <strong>₹{lineItemsTotal.toFixed(2)}</strong>
                      </div>

                      {itemDiscountTotal > 0 && (
                        <div className="summary-row discount">
                          <span>Item Discounts</span>
                          <span className="negative">
                            -₹{itemDiscountTotal.toFixed(2)}
                          </span>
                        </div>
                      )}

                      {parseFloat(order.shipping || 0) > 0 && (
                        <div className="summary-row">
                          <span>Shipping</span>
                          <span>+₹{parseFloat(order.shipping).toFixed(2)}</span>
                        </div>
                      )}

                      {effectiveGlobalDiscount > 0 && (
                        <div className="summary-row discount">
                          <span>Global Discount</span>
                          <span className="negative">
                            -{globalDiscountLabel}
                          </span>
                        </div>
                      )}

                      <div className="summary-row final">
                        <span>Final Amount</span>
                        <strong className="final-amount">
                          ₹{finalAmount.toFixed(2)}
                        </strong>
                      </div>
                    </div>
                  );
                }}
              />
            </Card>

            {/* Dispatch History */}
            <Card
              title={
                <span>
                  <CarOutlined /> Dispatch History
                </span>
              }
              className="section-card"
              style={{ marginTop: 24 }}
            >
              {dispatchesLoading ? (
                <div style={{ textAlign: "center", padding: "20px 0" }}>
                  <Spin />
                </div>
              ) : dispatches.length === 0 ? (
                <Empty
                  description="No dispatches recorded yet"
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
              ) : (
                <Table
                  dataSource={dispatches}
                  rowKey="id"
                  pagination={false}
                  size="small"
                  scroll={{ x: "max-content" }}
                  expandable={{
                    defaultExpandAllRows: false,

                    expandedRowRender: (record) => (
                      <div
                        style={{
                          padding: "12px 16px",
                          background: "#fafafa",
                          borderRadius: 6,
                        }}
                      >
                        <Table
                          dataSource={record.items || []}
                          rowKey="productId"
                          pagination={false}
                          size="small"
                          bordered
                          columns={[
                            {
                              title: "Product",
                              dataIndex: "name",
                              key: "name",
                              width: 320,
                              render: (value) => (
                                <span style={{ fontWeight: 500 }}>{value}</span>
                              ),
                            },
                            {
                              title: "Product Code",
                              dataIndex: "productCode",
                              key: "productCode",
                              width: 160,
                              render: (value) => value || "—",
                            },
                            {
                              title: "Qty",
                              dataIndex: "quantity",
                              key: "quantity",
                              width: 80,
                              align: "center",
                            },
                            {
                              title: "Unit Price",
                              dataIndex: "price",
                              key: "price",
                              width: 120,
                              align: "right",
                              render: (value) =>
                                Number(value || 0).toLocaleString("en-IN", {
                                  style: "currency",
                                  currency: "INR",
                                  maximumFractionDigits: 2,
                                }),
                            },
                            {
                              title: "Total",
                              dataIndex: "total",
                              key: "total",
                              width: 130,
                              align: "right",
                              render: (value) =>
                                Number(value || 0).toLocaleString("en-IN", {
                                  style: "currency",
                                  currency: "INR",
                                  maximumFractionDigits: 2,
                                }),
                            },
                          ]}
                          summary={() => (
                            <Table.Summary>
                              <Table.Summary.Row>
                                <Table.Summary.Cell index={0} colSpan={2}>
                                  <strong>Dispatch Total</strong>
                                </Table.Summary.Cell>

                                <Table.Summary.Cell index={2} align="center">
                                  <strong>{record.totalQuantity || 0}</strong>
                                </Table.Summary.Cell>

                                <Table.Summary.Cell index={3} />

                                <Table.Summary.Cell index={4} align="right">
                                  <strong>
                                    {Number(
                                      record.totalAmount || 0,
                                    ).toLocaleString("en-IN", {
                                      style: "currency",
                                      currency: "INR",
                                      maximumFractionDigits: 2,
                                    })}
                                  </strong>
                                </Table.Summary.Cell>
                              </Table.Summary.Row>
                            </Table.Summary>
                          )}
                        />

                        {/* Dispatch metadata */}
                        <div
                          style={{
                            marginTop: 16,
                            display: "grid",
                            gridTemplateColumns:
                              "repeat(auto-fit, minmax(180px, 1fr))",
                            gap: 12,
                          }}
                        >
                          <div>
                            <div className="text-muted small">Carrier</div>
                            <div>{record.carrier || "—"}</div>
                          </div>

                          <div>
                            <div className="text-muted small">
                              Tracking Number
                            </div>
                            <div>{record.trackingNumber || "—"}</div>
                          </div>

                          <div>
                            <div className="text-muted small">
                              Dispatched On
                            </div>
                            <div>
                              {record.dispatchDate
                                ? new Date(record.dispatchDate).toLocaleString(
                                    "en-IN",
                                  )
                                : "—"}
                            </div>
                          </div>

                          <div>
                            <div className="text-muted small">Status</div>
                            <div>
                              <Tag
                                color={
                                  record.status === "DISPATCHED"
                                    ? "green"
                                    : record.status === "PARTIALLY_DISPATCHED"
                                      ? "orange"
                                      : "blue"
                                }
                              >
                                {record.status || "—"}
                              </Tag>
                            </div>
                          </div>

                          <div>
                            <div className="text-muted small">Gate-Pass</div>
                            <div>
                              {record.gatePassLink ? (
                                <a
                                  href={record.gatePassLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  View Gate-Pass
                                </a>
                              ) : (
                                "—"
                              )}
                            </div>
                          </div>

                          {record.remarks && (
                            <div>
                              <div className="text-muted small">Remarks</div>
                              <div>{record.remarks}</div>
                            </div>
                          )}
                        </div>
                      </div>
                    ),

                    rowExpandable: (record) =>
                      Array.isArray(record.items) && record.items.length > 0,
                  }}
                  columns={[
                    {
                      title: "Dispatch #",
                      dataIndex: "dispatchNumber",
                      key: "dispatchNumber",
                      width: 100,
                      render: (value) => <strong>#{value}</strong>,
                    },

                    {
                      title: "Date",
                      dataIndex: "dispatchDate",
                      key: "dispatchDate",
                      width: 170,
                      render: (value) =>
                        value
                          ? new Date(value).toLocaleString("en-IN", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "—",
                    },

                    {
                      title: "Products",
                      key: "productCount",
                      width: 100,
                      align: "center",
                      render: (_, record) => (
                        <Tag>
                          {(record.items || []).length}{" "}
                          {(record.items || []).length === 1
                            ? "Product"
                            : "Products"}
                        </Tag>
                      ),
                    },

                    {
                      title: "Qty",
                      dataIndex: "totalQuantity",
                      key: "totalQuantity",
                      width: 80,
                      align: "center",
                    },

                    {
                      title: "Amount",
                      dataIndex: "totalAmount",
                      key: "totalAmount",
                      width: 140,
                      align: "right",
                      render: (value) =>
                        Number(value || 0).toLocaleString("en-IN", {
                          style: "currency",
                          currency: "INR",
                          maximumFractionDigits: 2,
                        }),
                    },

                    {
                      title: "Carrier",
                      dataIndex: "carrier",
                      key: "carrier",
                      width: 130,
                      render: (value) => value || "—",
                    },

                    {
                      title: "Tracking",
                      dataIndex: "trackingNumber",
                      key: "trackingNumber",
                      width: 150,
                      render: (value) => value || "—",
                    },

                    {
                      title: "Status",
                      dataIndex: "status",
                      key: "status",
                      width: 140,
                      render: (value) => (
                        <Tag
                          color={
                            value === "DISPATCHED"
                              ? "green"
                              : value === "PARTIALLY_DISPATCHED"
                                ? "orange"
                                : "blue"
                          }
                        >
                          {value || "—"}
                        </Tag>
                      ),
                    },

                    {
                      title: "Gate-Pass",
                      key: "gatePass",
                      width: 110,
                      render: (_, record) =>
                        record.gatePassLink ? (
                          <a
                            href={record.gatePassLink}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            View
                          </a>
                        ) : (
                          "—"
                        ),
                    },
                  ]}
                />
              )}
            </Card>

            {/* Credit Note History */}
            <Card
              title={
                <span>
                  <RollbackOutlined /> Credit Notes
                </span>
              }
              className="section-card"
              style={{ marginTop: 24 }}
            >
              {creditNotesLoading ? (
                <div style={{ textAlign: "center", padding: "20px 0" }}>
                  <Spin />
                </div>
              ) : creditNotes.length === 0 ? (
                <Empty
                  description="No credit notes recorded yet"
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
              ) : (
                <Table
                  dataSource={creditNotes}
                  rowKey="id"
                  pagination={false}
                  size="small"
                  scroll={{ x: "max-content" }}
                  expandable={{
                    defaultExpandAllRows: false,

                    expandedRowRender: (record) => (
                      <div
                        style={{
                          padding: "12px 16px",
                          background: "#fafafa",
                          borderRadius: 6,
                        }}
                      >
                        <Table
                          dataSource={record.items || []}
                          rowKey="id"
                          pagination={false}
                          size="small"
                          bordered
                          columns={[
                            {
                              title: "Product",
                              dataIndex: "name",
                              key: "name",
                              render: (value, item) => (
                                <div>
                                  <div style={{ fontWeight: 500 }}>
                                    {value || "—"}
                                  </div>

                                  {item.productCode && (
                                    <div
                                      style={{
                                        fontSize: 12,
                                        color: "#8c8c8c",
                                        marginTop: 2,
                                      }}
                                    >
                                      {item.productCode}
                                    </div>
                                  )}
                                </div>
                              ),
                            },

                            {
                              title: "Qty Returned",
                              dataIndex: "quantity",
                              key: "quantity",
                              width: 130,
                              align: "center",
                              render: (value) => Number(value || 0).toFixed(2),
                            },

                            {
                              title: "Price",
                              dataIndex: "price",
                              key: "price",
                              width: 140,
                              align: "right",
                              render: (value) =>
                                Number(value || 0).toLocaleString("en-IN", {
                                  style: "currency",
                                  currency: "INR",
                                  maximumFractionDigits: 2,
                                }),
                            },

                            {
                              title: "Discount",
                              dataIndex: "discount",
                              key: "discount",
                              width: 110,
                              align: "right",
                              render: (value, item) => {
                                const discount = Number(value || 0);

                                return item.discountType === "percent"
                                  ? `${discount.toFixed(2)}%`
                                  : discount.toLocaleString("en-IN", {
                                      style: "currency",
                                      currency: "INR",
                                      maximumFractionDigits: 2,
                                    });
                              },
                            },

                            {
                              title: "Amount",
                              dataIndex: "total",
                              key: "total",
                              width: 140,
                              align: "right",
                              render: (value) =>
                                Number(value || 0).toLocaleString("en-IN", {
                                  style: "currency",
                                  currency: "INR",
                                  maximumFractionDigits: 2,
                                }),
                            },
                          ]}
                        />

                        {/* Credit note metadata */}
                        <div
                          style={{
                            marginTop: 16,
                            display: "grid",
                            gridTemplateColumns:
                              "repeat(auto-fit, minmax(180px, 1fr))",
                            gap: 12,
                          }}
                        >
                          <div>
                            <div className="text-muted small">
                              Credit Note Date
                            </div>
                            <div>
                              {record.creditNoteDate
                                ? new Date(
                                    record.creditNoteDate,
                                  ).toLocaleString("en-IN", {
                                    day: "2-digit",
                                    month: "short",
                                    year: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })
                                : "—"}
                            </div>
                          </div>

                          <div>
                            <div className="text-muted small">Issued On</div>
                            <div>
                              {record.createdAt
                                ? new Date(record.createdAt).toLocaleString(
                                    "en-IN",
                                    {
                                      day: "2-digit",
                                      month: "short",
                                      year: "numeric",
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    },
                                  )
                                : "—"}
                            </div>
                          </div>

                          <div>
                            <div className="text-muted small">Status</div>
                            <div>
                              <Tag
                                color={
                                  record.status === "CANCELED"
                                    ? "red"
                                    : record.status === "ISSUED"
                                      ? "purple"
                                      : "default"
                                }
                              >
                                {record.status || "ISSUED"}
                              </Tag>
                            </div>
                          </div>

                          <div>
                            <div className="text-muted small">
                              Total Quantity
                            </div>
                            <div>
                              {Number(record.totalQuantity || 0).toFixed(2)}
                            </div>
                          </div>

                          <div>
                            <div className="text-muted small">Total Amount</div>
                            <div style={{ fontWeight: 600 }}>
                              {Number(record.totalAmount || 0).toLocaleString(
                                "en-IN",
                                {
                                  style: "currency",
                                  currency: "INR",
                                  maximumFractionDigits: 2,
                                },
                              )}
                            </div>
                          </div>

                          <div>
                            <div className="text-muted small">Document</div>
                            <div>
                              {record.creditNoteLink ? (
                                <a
                                  href={record.creditNoteLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  View Credit Note
                                </a>
                              ) : (
                                "—"
                              )}
                            </div>
                          </div>

                          {record.reason && (
                            <div>
                              <div className="text-muted small">Reason</div>
                              <div>{record.reason}</div>
                            </div>
                          )}

                          {record.remarks && (
                            <div>
                              <div className="text-muted small">Remarks</div>
                              <div>{record.remarks}</div>
                            </div>
                          )}
                        </div>
                      </div>
                    ),

                    rowExpandable: (record) =>
                      Array.isArray(record.items) && record.items.length > 0,
                  }}
                  columns={[
                    {
                      title: "Credit Note #",
                      dataIndex: "creditNoteNumber",
                      key: "creditNoteNumber",
                      width: 180,
                      render: (value) => <strong>#{value || "—"}</strong>,
                    },

                    {
                      title: "Date",
                      dataIndex: "creditNoteDate",
                      key: "creditNoteDate",
                      width: 170,
                      render: (value) =>
                        value
                          ? new Date(value).toLocaleString("en-IN", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "—",
                    },

                    {
                      title: "Items",
                      key: "itemCount",
                      width: 90,
                      align: "center",
                      render: (_, record) => (
                        <Tag>{(record.items || []).length}</Tag>
                      ),
                    },

                    {
                      title: "Qty Returned",
                      dataIndex: "totalQuantity",
                      key: "totalQuantity",
                      width: 120,
                      align: "center",
                      render: (value) => Number(value || 0).toFixed(2),
                    },

                    {
                      title: "Amount",
                      dataIndex: "totalAmount",
                      key: "totalAmount",
                      width: 140,
                      align: "right",
                      render: (value) =>
                        Number(value || 0).toLocaleString("en-IN", {
                          style: "currency",
                          currency: "INR",
                          maximumFractionDigits: 2,
                        }),
                    },

                    {
                      title: "Status",
                      dataIndex: "status",
                      key: "status",
                      width: 120,
                      render: (value) => (
                        <Tag
                          color={
                            value === "CANCELED"
                              ? "red"
                              : value === "ISSUED"
                                ? "purple"
                                : "default"
                          }
                        >
                          {value || "ISSUED"}
                        </Tag>
                      ),
                    },

                    {
                      title: "Document",
                      key: "document",
                      width: 140,
                      render: (_, record) =>
                        record.creditNoteLink ? (
                          <a
                            href={record.creditNoteLink}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            View
                          </a>
                        ) : (
                          "—"
                        ),
                    },
                  ]}
                />
              )}
            </Card>

            {/* Addresses */}
            <Row gutter={16} style={{ marginTop: 24 }}>
              <Col xs={24} md={12}>
                <Card
                  title="Billing Address"
                  extra={
                    <Button
                      type="link"
                      icon={<EditOutlined />}
                      onClick={() => setIsBillingModalVisible(true)}
                    >
                      {billingAddress ? "Edit" : "Add"}
                    </Button>
                  }
                  className="address-card"
                >
                  {billingAddress ? (
                    <div className="address-content">
                      <div className="address-name">{customer.name || "—"}</div>
                      <div>{billingAddress.street || "—"}</div>
                      <div>
                        {billingAddress.city}, {billingAddress.state}{" "}
                        {billingAddress.postalCode}
                      </div>
                      <div>{billingAddress.country || "India"}</div>
                    </div>
                  ) : (
                    <Text type="secondary">No billing address set</Text>
                  )}
                </Card>
              </Col>

              <Col xs={24} md={12}>
                <Card
                  title="Shipping Address"
                  extra={
                    <Button
                      type="link"
                      icon={<EditOutlined />}
                      onClick={() => setIsShippingModalVisible(true)}
                    >
                      {shippingAddress ? "Edit" : "Add"}
                    </Button>
                  }
                  className="address-card"
                >
                  {shippingAddress ? (
                    <div className="address-content">
                      <div className="address-name">{customer.name || "—"}</div>
                      <div>
                        {shippingAddress.street ||
                          shippingAddress.address ||
                          "—"}
                      </div>
                      <div>
                        {shippingAddress.city}, {shippingAddress.state}{" "}
                        {shippingAddress.postalCode}
                      </div>
                      <div>{shippingAddress.country || "India"}</div>
                    </div>
                  ) : (
                    <Text type="secondary">No shipping address set</Text>
                  )}
                </Card>
              </Col>
            </Row>
          </Col>

          {/* ── SIDEBAR ───────────────────────────────────────────────────── */}
          <Col xs={24} lg={8} xl={6}>
            <Space direction="vertical" size={20} style={{ width: "100%" }}>
              {/* Customer */}
              <Card className="info-card">
                <div className="customer-info">
                  <div className="avatar-circle">
                    {customer.name?.[0]?.toUpperCase() || "?"}
                  </div>
                  <div>
                    <div className="customer-name">{customer.name || "—"}</div>
                    <div className="customer-contact">
                      {customer.email || "—"}
                    </div>
                    <div className="customer-contact">
                      {customer.mobileNumber || "—"}
                    </div>
                  </div>
                </div>
              </Card>

              {/* Order Summary */}
              <Card title="Order Summary" className="info-card">
                <dl className="summary-list">
                  <dt>Order No</dt>
                  <dd>{order.orderNo}</dd>
                  <dt>Created</dt>
                  <dd>{new Date(order.createdAt).toLocaleDateString()}</dd>
                  <dt>Final Amount</dt>
                  <dd className="highlight">₹{finalAmount.toFixed(2)}</dd>
                </dl>
              </Card>

              {/* Documents */}
              <Card title="Documents" className="documents-card">
                <div className="document-item">
                  <div className="document-label">
                    <FilePdfOutlined /> Invoice
                  </div>
                  {invoiceUrl ? (
                    <Space>
                      <a
                        href={invoiceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        View
                      </a>
                      <Button
                        icon={<DownloadOutlined />}
                        size="small"
                        onClick={() => handleDownloadFile("invoice")}
                      >
                        Download
                      </Button>
                    </Space>
                  ) : (
                    <Upload
                      accept="application/pdf"
                      beforeUpload={() => false}
                      onChange={handleInvoiceChange}
                      fileList={
                        invoiceFile
                          ? [{ name: invoiceFile.name, status: "done" }]
                          : []
                      }
                    >
                      <Button size="small">Upload Invoice</Button>
                    </Upload>
                  )}
                  {invoiceFile && (
                    <Button
                      type="primary"
                      size="small"
                      onClick={handleInvoiceSubmit}
                      loading={isUploading}
                      style={{ marginTop: 8 }}
                    >
                      Confirm Upload
                    </Button>
                  )}
                </div>

                <div className="document-item" style={{ marginTop: 16 }}>
                  <div className="document-label">
                    <FilePdfOutlined /> Gate Pass
                  </div>
                  {gatePassUrl ? (
                    <Space>
                      <a
                        href={gatePassUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        View
                      </a>
                      <Button
                        icon={<DownloadOutlined />}
                        size="small"
                        onClick={() => handleDownloadFile("gatepass")}
                      >
                        Download
                      </Button>
                    </Space>
                  ) : isDispatched ? (
                    <Text type="secondary">Dispatched – cannot modify</Text>
                  ) : (
                    <Upload
                      accept="application/pdf,image/*"
                      beforeUpload={() => false}
                      onChange={handleGatePassChange}
                      fileList={
                        gatePassFile
                          ? [{ name: gatePassFile.name, status: "done" }]
                          : []
                      }
                    >
                      <Button size="small">Upload Gate Pass</Button>
                    </Upload>
                  )}
                  {gatePassFile && !isDispatched && (
                    <Button
                      type="primary"
                      size="small"
                      onClick={handleGatePassSubmit}
                      loading={isGatePassUploading}
                      style={{ marginTop: 8 }}
                    >
                      Confirm Upload
                    </Button>
                  )}
                </div>

                {/* ← NEW: Receiving Document */}
                <div className="document-item" style={{ marginTop: 16 }}>
                  <div className="document-label">
                    <FilePdfOutlined /> Receiving Document
                  </div>
                  {receivingDocUrl ? (
                    <Space>
                      <a
                        href={receivingDocUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        View
                      </a>
                    </Space>
                  ) : (
                    <Upload
                      accept="application/pdf,image/*"
                      beforeUpload={() => false}
                      onChange={handleReceivingDocChange}
                      fileList={
                        receivingDocFile
                          ? [{ name: receivingDocFile.name, status: "done" }]
                          : []
                      }
                    >
                      <Button size="small">Upload Receiving Doc</Button>
                    </Upload>
                  )}
                  {receivingDocFile && (
                    <Button
                      type="primary"
                      size="small"
                      onClick={handleReceivingDocSubmit}
                      loading={isReceivingDocUploading}
                      style={{ marginTop: 8 }}
                    >
                      Confirm Upload
                    </Button>
                  )}
                </div>
              </Card>

              {/* ← NEW: Order Activity */}
              <Card
                title={
                  <span>
                    <HistoryOutlined /> Order Activity
                  </span>
                }
                className="info-card"
              >
                {activityLoading ? (
                  <div style={{ textAlign: "center", padding: "12px 0" }}>
                    <Spin size="small" />
                  </div>
                ) : activities.length === 0 ? (
                  <Empty
                    description="No activity yet"
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                  />
                ) : (
                  <>
                    <Timeline
                      items={activities.map((a) => ({
                        color: ACTIVITY_TAG_COLOR[a.action] || "gray",
                        children: (
                          <div key={a.id}>
                            <Tag
                              color={ACTIVITY_TAG_COLOR[a.action] || "default"}
                            >
                              {a.action?.replace(/_/g, " ")}
                            </Tag>
                            <div style={{ marginTop: 4 }}>{a.description}</div>
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              {new Date(a.createdAt).toLocaleString()}
                            </Text>
                          </div>
                        ),
                      }))}
                    />
                    {activityTotal > activityLimit && (
                      <div style={{ textAlign: "center", marginTop: 12 }}>
                        <Pagination
                          size="small"
                          current={activityPage}
                          pageSize={activityLimit}
                          total={activityTotal}
                          onChange={setActivityPage}
                          showSizeChanger={false}
                        />
                      </div>
                    )}
                  </>
                )}
              </Card>
            </Space>
          </Col>
        </Row>

        {/* ── COMMENTS ──────────────────────────────────────────────────── */}
        <Card
          title={
            <span style={{ fontSize: 16, fontWeight: 600 }}>Comments</span>
          }
          className="comments-section"
          style={{
            marginTop: 32,
            borderRadius: 12,
            boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
          }}
          bodyStyle={{ padding: 16 }}
        >
          {/* Input Section */}
          <div
            style={{
              display: "flex",
              gap: 12,
              marginBottom: 20,
              alignItems: "flex-start",
            }}
          >
            <Input.TextArea
              rows={2}
              placeholder="Write a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              style={{
                resize: "none",
                borderRadius: 10,
              }}
            />

            <Button
              type="primary"
              icon={<SendOutlined />}
              onClick={handleAddComment}
              disabled={!newComment.trim()}
              style={{
                height: "100%",
                borderRadius: 10,
                paddingInline: 20,
              }}
            >
              Send
            </Button>
          </div>

          {/* Content Section */}
          {commentLoading ? (
            <div style={{ textAlign: "center", padding: "20px 0" }}>
              <Spin />
            </div>
          ) : comments.length === 0 ? (
            <Text
              type="secondary"
              style={{
                display: "block",
                textAlign: "center",
                padding: "32px 0",
                fontSize: 14,
              }}
            >
              No comments yet.
            </Text>
          ) : (
            <div
              className="comments-list"
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 12,
                marginTop: 8,
              }}
            >
              {commentData?.comments?.map((c) => (
                <div
                  key={c._id}
                  style={{
                    padding: 12,
                    borderRadius: 10,
                    background: "#fafafa",
                    border: "1px solid #f0f0f0",
                  }}
                >
                  <CommentRow
                    comment={c}
                    onDelete={handleDeleteComment}
                    currentUserId={String(user.userId || "").trim()}
                  />
                </div>
              ))}
            </div>
          )}
        </Card>
        {/* MODALS */}
        {isBillingModalVisible && (
          <AddAddress
            visible={isBillingModalVisible}
            onClose={() => setIsBillingModalVisible(false)}
            onSave={refetchAddresses}
            existingAddress={billingAddress}
            selectedCustomer={order.createdFor}
          />
        )}
        {isShippingModalVisible && (
          <AddAddress
            visible={isShippingModalVisible}
            onClose={() => setIsShippingModalVisible(false)}
            onSave={refetchAddresses}
            existingAddress={shippingAddress}
            selectedCustomer={order.createdFor}
          />
        )}

        {/* ← NEW: Dispatch modal */}
        <DispatchModal
          visible={showDispatchModal}
          order={order}
          onClose={() => setShowDispatchModal(false)}
          onSuccess={handleDispatchSuccess}
        />

        {/* ← NEW: Credit Note modal */}
        <OrderCreditNoteModal
          visible={showCreditNoteModal}
          order={order}
          onClose={() => setShowCreditNoteModal(false)}
          onSuccess={handleCreditNoteSuccess}
        />
      </div>
    </div>
  );
};

export default OrderPage;
