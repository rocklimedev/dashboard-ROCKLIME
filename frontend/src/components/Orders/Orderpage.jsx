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
} from "@ant-design/icons";
import { Document, Page, pdfjs } from "react-pdf";
import useProductsData from "../../data/useProductdata";
import AddAddress from "../Address/AddAddressModal";
import CommentRow from "../Common/CommentRow";
import { Helmet } from "react-helmet";
import "./orderpage.css"; // ← new / updated stylesheet

pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js`;

const { Title, Text } = Typography;

const OrderPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // ── STATE ────────────────────────────────────────
  const [newComment, setNewComment] = useState("");
  const [commentPage, setCommentPage] = useState(1);
  const [invoiceFile, setInvoiceFile] = useState(null);
  const [gatePassFile, setGatePassFile] = useState(null);
  const [isBillingModalVisible, setIsBillingModalVisible] = useState(false);
  const [isShippingModalVisible, setIsShippingModalVisible] = useState(false);

  const commentLimit = 10;

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
      let imageUrl =
        original.imageUrl || pd.images?.[0] || "https://via.placeholder.com/64";
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

  const invoiceUrl = order.invoiceLink
    ? `${process.env.REACT_APP_FTP_BASE_URL}${order.invoiceLink}`
    : null;
  const gatePassUrl = order.gatePassLink
    ? `${process.env.REACT_APP_FTP_BASE_URL}${order.gatePassLink}`
    : null;

  const isDispatched = order.status === "DISPATCHED";

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
        <div className="order-page-modern">
          <Helmet>
            <title>Order #{order.orderNo} | CM Trading</title>
          </Helmet>

          <Row gutter={[24, 24]}>
            {/* ── MAIN CONTENT ──────────────────────────────────────────────── */}
            <Col xs={24} lg={16} xl={18}>
              {/* Products Card */}
              <Card className="section-card products-card">
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
                    text={order.status}
                  />
                </Title>

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
                            onError={(e) =>
                              (e.target.src = "https://via.placeholder.com/64")
                            }
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
                      title: "Total",
                      key: "total",
                      width: 120,
                      align: "right",
                      render: (_, r) => (
                        <strong>₹{parseFloat(r.total).toFixed(2)}</strong>
                      ),
                    },
                  ]}
                  footer={() => (
                    <div className="table-summary">
                      <div className="summary-row">
                        <span>Subtotal</span>
                        <strong>₹{lineItemsTotal.toFixed(2)}</strong>
                      </div>
                      {order.shipping > 0 && (
                        <div className="summary-row">
                          <span>Shipping</span>
                          <span>+₹{parseFloat(order.shipping).toFixed(2)}</span>
                        </div>
                      )}
                      {order.extraDiscountValue > 0 && (
                        <div className="summary-row discount">
                          <span>Extra Discount</span>
                          <span className="negative">
                            -₹{parseFloat(order.extraDiscountValue).toFixed(2)}
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
                  )}
                />
              </Card>

              {/* Addresses */}
              <Row gutter={16}>
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
                        <div className="address-name">
                          {customer.name || "—"}
                        </div>
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
                        <div className="address-name">
                          {customer.name || "—"}
                        </div>
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
                <Card title="Customer" className="info-card">
                  <div className="customer-info">
                    <div className="avatar-circle">
                      {customer.name?.[0]?.toUpperCase() || "?"}
                    </div>
                    <div>
                      <div className="customer-name">
                        {customer.name || "—"}
                      </div>
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
                          onClick={async () => {
                            try {
                              const res = await fetch(
                                `https://api.cmtrading.com/api/order/${id}/download-invoice`,
                                {
                                  credentials: "include",
                                },
                              );
                              if (!res.ok) throw new Error();
                              const blob = await res.blob();
                              const url = window.URL.createObjectURL(blob);
                              const a = document.createElement("a");
                              a.href = url;
                              a.download = `Invoice-${order.orderNo}.pdf`;
                              a.click();
                              window.URL.revokeObjectURL(url);
                            } catch {
                              message.error("Download failed");
                            }
                          }}
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
                        <Button icon={<DownloadOutlined />} size="small">
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
                </Card>
              </Space>
            </Col>
          </Row>

          {/* ── COMMENTS ──────────────────────────────────────────────────── */}
          <Card
            title="Comments"
            className="comments-section"
            style={{ marginTop: 32 }}
          >
            <Form layout="inline" style={{ marginBottom: 24 }}>
              <Form.Item style={{ flex: 1 }}>
                <Input.TextArea
                  rows={2}
                  placeholder="Write a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                />
              </Form.Item>
              <Form.Item>
                <Button
                  type="primary"
                  icon={<SendOutlined />}
                  onClick={handleAddComment}
                  disabled={!newComment.trim()}
                >
                  Send
                </Button>
              </Form.Item>
            </Form>

            {commentLoading ? (
              <Spin />
            ) : comments.length === 0 ? (
              <Text
                type="secondary"
                style={{
                  display: "block",
                  textAlign: "center",
                  padding: "32px 0",
                }}
              >
                No comments yet.
              </Text>
            ) : (
              <div className="comments-list">
                {commentData?.comments?.map((c) => (
                  <CommentRow
                    key={c._id}
                    comment={c}
                    onDelete={handleDeleteComment}
                    currentUserId={String(user.userId || "").trim()}
                  />
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
        </div>
      </div>
    </div>
  );
};

export default OrderPage;
