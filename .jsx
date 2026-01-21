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
import {
  // ... your existing imports
  useGetQuotationByIdQuery,
} from "../../api/quotationApi"; // adjust path if needed
import { useGetAllAddressesQuery } from "../../api/addressApi";
import { useGetAllTeamsQuery } from "../../api/teamApi";
import { useGetProfileQuery } from "../../api/userApi";
import {
  Button,
  Form,
  Input,
  Spin,
  Alert,
  Dropdown,
  Menu,
  Row,
  Col,
  Card,
  Table,
  Space,
  Typography,
  Upload,
  Badge,
  message,
} from "antd";
import {
  EllipsisOutlined,
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  EditOutlined,
  FilePdfOutlined,
  DownloadOutlined,
  FileImageOutlined,
} from "@ant-design/icons";
import { Document, Page, pdfjs } from "react-pdf";
import useProductsData from "../../data/useProductdata";
import AddAddress from "../Address/AddAddressModal";
import "./orderpage.css";
import { SendOutlined } from "@ant-design/icons";
import { Helmet } from "react-helmet";

// PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js`;

const { Text, Title } = Typography;

// ──────────────────────────────────────────────
// Comment Row Component
// ──────────────────────────────────────────────
const CommentRow = ({ comment, onDelete, currentUserId }) => {
  const isCurrentUser = comment.userId === currentUserId;
  const userInitial = comment.user?.name?.[0]?.toUpperCase() || "U";

  return (
    <div
      className={`comment-row ${isCurrentUser ? "comment-row--own" : ""}`}
      style={{
        display: "flex",
        marginBottom: 12,
        justifyContent: isCurrentUser ? "flex-end" : "flex-start",
        padding: "0 8px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          maxWidth: "80%",
          flexDirection: isCurrentUser ? "row-reverse" : "row",
        }}
      >
        <div className="avatar">{userInitial}</div>
        <div
          className="comment-bubble"
          style={{
            background: isCurrentUser ? "#1890ff" : "#f0f2f5",
            color: isCurrentUser ? "#fff" : "#000",
            borderRadius: 12,
            padding: "8px 12px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 4,
            }}
          >
            <Text strong>{comment.user?.name || "Unknown User"}</Text>
            {isCurrentUser && (
              <Button
                type="link"
                danger
                style={{
                  color: isCurrentUser ? "#fff" : "#ff4d4f",
                  padding: 0,
                  fontSize: "0.85rem",
                }}
                onClick={() => onDelete(comment._id)}
              >
                Delete
              </Button>
            )}
          </div>
          <Text>{comment.comment}</Text>
          <div>
            <Text
              type={isCurrentUser ? "secondary" : "default"}
              style={{ fontSize: "0.75rem", display: "block", marginTop: 4 }}
            >
              {new Date(comment.createdAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}{" "}
              • {new Date(comment.createdAt).toLocaleDateString()}
            </Text>
          </div>
        </div>
      </div>
    </div>
  );
};

// ──────────────────────────────────────────────
// Main OrderPage Component
// ──────────────────────────────────────────────
const OrderPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // ── STATE ──
  const [newComment, setNewComment] = useState("");
  const [commentPage, setCommentPage] = useState(1);
  const [invoiceFile, setInvoiceFile] = useState(null);
  const [gatePassFile, setGatePassFile] = useState(null);
  const [pdfPageNum, setPdfPageNum] = useState(1);
  const [numPages, setNumPages] = useState(null);
  const [isBillingModalVisible, setIsBillingModalVisible] = useState(false);
  const [isShippingModalVisible, setIsShippingModalVisible] = useState(false);
  const commentLimit = 10;

  // ── RTK QUERY ──
  const [deleteOrder] = useDeleteOrderMutation();
  const [updateOrderStatus] = useUpdateOrderStatusMutation();
  const [addComment] = useAddCommentMutation();
  const [deleteComment] = useDeleteCommentMutation();
  const [uploadInvoice, { isLoading: isUploading }] =
    useUploadInvoiceMutation();
  const [issueGatePass, { isLoading: isGatePassUploading }] =
    useIssueGatePassMutation();
  const [triggerInvoiceDownload] = useLazyDownloadInvoiceQuery();
  const { data: profileData, isLoading: profileLoading } = useGetProfileQuery();
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

  const {
    data: fullQuotation,
    isLoading: quotationLoading,
    error: quotationError,
  } = useGetQuotationByIdQuery(quotationId, {
    skip: !quotationId,
  });
  const { data: teamData } = useGetAllTeamsQuery();
  const { data: customersData } = useGetCustomersQuery();
  const totalOrders = useMemo(() => {
    if (!customersData?.data || !order.createdFor) return 0;

    const customer = customersData.data.find(
      (c) => c.customerId === order.createdFor,
    );

    // Try multiple possible shapes
    return (
      customer?.orders?.length ||
      customer?.orderCount ||
      customer?.totalOrders ||
      0
    );
  }, [customersData, order.createdFor]);
  // ── PRODUCTS & QUOTATION ──
  const quotationDetails = useMemo(() => {
    const details = order.quotationDetails || order.quotation || {};
    return {
      quotationId: details.quotationId || null,
      document_title: details.document_title || "N/A",
      quotation_date: details.quotation_date || null,
      due_date: details.due_date || null,
      followupDates: details.followupDates
        ? typeof details.followupDates === "string"
          ? JSON.parse(details.followupDates)
          : details.followupDates
        : [],
      reference_number: details.reference_number || "N/A",
      discountAmount: parseFloat(details.discountAmount || 0),
      roundOff: parseFloat(details.roundOff || 0),
      finalAmount: parseFloat(details.finalAmount || 0),
    };
  }, [order.quotationDetails, order.quotation]);
  const products = useMemo(() => {
    // HIGHEST PRIORITY: Full quotation fetch — this ALWAYS has correct imageUrl
    if (fullQuotation?.products && Array.isArray(fullQuotation.products)) {
      return fullQuotation.products;
    }

    // SECOND: quotationData inside order (your sample has this)
    if (
      order?.quotationData?.products &&
      Array.isArray(order.quotationData.products)
    ) {
      return order.quotationData.products;
    }

    // THIRD: quotationItems array
    if (order?.quotationItems && Array.isArray(order.quotationItems)) {
      return order.quotationItems;
    }

    // FOURTH: embedded quotation.products (string or object)
    if (order.quotation?.products) {
      try {
        const qp =
          typeof order.quotation.products === "string"
            ? JSON.parse(order.quotation.products)
            : order.quotation.products;
        if (Array.isArray(qp)) return qp;
      } catch (e) {
        console.error("Failed to parse embedded quotation products", e);
      }
    }

    // LAST: order.products (usually empty)
    if (
      order.products &&
      Array.isArray(order.products) &&
      order.products.length > 0
    ) {
      return order.products;
    }

    return [];
  }, [
    fullQuotation,
    order.quotationData,
    order.quotationItems,
    order.quotation,
    order.products,
  ]);
  const productInputs = useMemo(
    () =>
      products.map((p) => ({
        productId: p.productId || p.id,
        price: p.price || 0,
        total: p.total || 0,
        discount: p.discount || 0,
        quantity: p.quantity || 1,
      })),
    [products],
  );

  const { productsData, loading: productsLoading } =
    useProductsData(productInputs);

  const mergedProducts = useMemo(() => {
    return productInputs.map((op, index) => {
      const originalProduct = products[index]; // ← This is the raw item from quotation
      const pd = productsData.find((p) => p.productId === op.productId) || {};

      // PRIORITIZE quotation's imageUrl (it's always there and correct)
      let imageUrl =
        originalProduct.imageUrl || "https://via.placeholder.com/60";

      // Fallback to catalog images only if quotation has none
      if (!originalProduct.imageUrl && pd.images) {
        try {
          const imgs = JSON.parse(pd.images);
          imageUrl =
            Array.isArray(imgs) && imgs.length > 0 ? imgs[0] : imageUrl;
        } catch {}
      }

      let brandName = pd.brandName || "N/A";
      if (pd.metaDetails) {
        const brandMeta = pd.metaDetails.find(
          (m) => m.title === "brandName" || m.title === "brand",
        );
        brandName = brandMeta?.value || brandName;
      }
      if (/^[0-9a-fA-F-]{36}$/.test(brandName)) brandName = "N/A";

      const productCode =
        pd.product_code ||
        pd.meta?.d11da9f9_3f2e_4536_8236_9671200cca4a ||
        "N/A";

      const sellingPrice =
        pd.metaDetails?.find((m) => m.title === "Selling Price")?.value ||
        op.price ||
        0;

      return {
        productId: op.productId,
        price: parseFloat(sellingPrice),
        total: parseFloat(op.total) || sellingPrice * op.quantity,
        discount: parseFloat(op.discount) || 0,
        quantity: op.quantity || 1,
        name: pd.name || originalProduct.name || "Unnamed Product", // ← also prioritize quotation name
        brand: brandName,
        sku: productCode,
        image: imageUrl, // ← now uses quotation imageUrl first
      };
    });
  }, [productsData, productInputs, products]); // ← add 'products' to deps
  const comments = useMemo(() => commentData?.comments || [], [commentData]);
  const totalComments = commentData?.totalCount || 0;

  // ── ADDRESSES ──
  const billingAddress = useMemo(
    () =>
      addressesData?.find(
        (a) => a.status === "BILLING" && a.customerId === order.createdFor,
      ) || null,
    [addressesData, order.createdFor],
  );

  const shippingAddress = useMemo(
    () =>
      addressesData?.find(
        (a) => a.status === "ADDITIONAL" && a.customerId === order.createdFor,
      ) ||
      order.shippingAddress ||
      null,
    [addressesData, order.createdFor, order.shippingAddress],
  );

  // ── FILE HANDLERS ──
  const handleInvoiceChange = ({ file }) => {
    if (file && file.type === "application/pdf") {
      setInvoiceFile(file);
    } else {
      message.error("Only PDF files are allowed for invoice.");
    }
  };

  const handleGatePassChange = ({ file }) => {
    const allowed = ["application/pdf", "image/png", "image/jpeg", "image/jpg"];
    if (file && allowed.includes(file.type)) {
      setGatePassFile(file);
    } else {
      message.error("Only PDF, PNG, JPG allowed for gate-pass.");
    }
  };
  // Helper to generate clean filename
  const generateFileName = (type, orderNo, customerName) => {
    const cleanName = (customerName || "Customer")
      .replace(/[^a-zA-Z0-9]/g, "_") // Replace special chars with _
      .substring(0, 30); // Limit length

    return `${type} #${orderNo} for ${cleanName}.pdf`;
  };
  const handleInvoiceSubmit = async () => {
    if (!invoiceFile) return message.error("Select a PDF file.");
    const formData = new FormData();
    formData.append("invoice", invoiceFile);
    try {
      await uploadInvoice({ orderId: id, formData }).unwrap();
      setInvoiceFile(null);
      refetchOrder();
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
    } catch (err) {
      message.error(err.data?.message || "Gate-pass upload failed");
    }
  };

  // ── URL HELPERS ──
  const getFileUrl = (link) => {
    if (!link) return null;
    return link.startsWith("http")
      ? link
      : `${process.env.REACT_APP_FTP_BASE_URL}${link}`;
  };

  const invoiceUrl = getFileUrl(order.invoiceLink);
  const gatePassUrl = getFileUrl(order.gatePassLink);

  const isDispatched = order.status === "DISPATCHED";

  // ── ACTION HANDLERS ──
  const handleEditOrder = () =>
    navigate(`/order/${order.id}/edit`, { state: { order } });
  const handleDeleteOrder = async () => {
    if (!window.confirm("Delete this order?")) return;
    try {
      await deleteOrder(id).unwrap();
      navigate("/orders/list");
    } catch (err) {
      message.error(err?.data?.message || "Delete failed");
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return message.error("Comment cannot be empty");
    if (!user.userId) return navigate("/login");

    try {
      await addComment({
        resourceId: id,
        resourceType: "Order",
        userId: String(user.userId || "").trim(),
        comment: newComment,
      }).unwrap();
      setNewComment("");
    } catch (err) {
      message.error(err?.data?.message || "Failed to add comment");
    }
  };
  const handleDeleteComment = async (commentId) => {
    if (!window.confirm("Delete comment?")) return;
    try {
      await deleteComment({
        commentId,
        userId: String(user.userId || "").trim(),
      }).unwrap();
    } catch (err) {
      message.error(err?.data?.message || "Delete failed");
    }
  };

  const handlePageChange = (page) => {
    if (page >= 1 && page <= Math.ceil(totalComments / commentLimit)) {
      setCommentPage(page);
    }
  };
  // ── CALCULATIONS ──
  // ── CALCULATIONS (FINAL & CORRECT) ──
  const lineItemsTotal = useMemo(() => {
    return mergedProducts.reduce(
      (sum, p) => sum + (parseFloat(p.total) || 0),
      0,
    );
  }, [mergedProducts]);

  const gstRate = order.gst ? parseFloat(order.gst) : 18;
  const gstAmount = order.gstValue
    ? parseFloat(order.gstValue)
    : (lineItemsTotal * gstRate) / 100;

  const extraDiscountAmount = order.extraDiscountValue
    ? parseFloat(order.extraDiscountValue)
    : 0;

  const finalAmount = parseFloat(order.finalAmount || 0);

  // For display: actual ₹ discount per item
  const getItemDiscountAmount = (item) => {
    if (!item.discount || item.discount === 0) return 0;
    if (item.discountType === "fixed") return item.discount;
    return (item.price * item.quantity * item.discount) / 100;
  };

  // ── LOADING / ERROR ──
  if (profileLoading || orderLoading || productsLoading) {
    return (
      <div className="loading-container">
        <Spin /> <Text style={{ marginLeft: 8 }}>Loading...</Text>
      </div>
    );
  }

  if (orderError || !order.id) {
    return (
      <div className="error-container">
        <Alert
          message={orderError?.data?.message || "Order not found"}
          type="error"
        />
      </div>
    );
  }

  // ── MENU ──
  const menu = (
    <Menu>
      <Menu.Item key="edit" onClick={handleEditOrder}>
        Edit Order
      </Menu.Item>
      <Menu.Item key="delete" danger onClick={handleDeleteOrder}>
        Delete
      </Menu.Item>
    </Menu>
  );

  const columns = [
    {
      title: "Product",
      key: "product",
      render: (_, r) => (
        <div className="product-cell">
          <img
            src={r.image || r.imageUrl || "https://via.placeholder.com/60"}
            alt={r.name}
            className="product-image"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = "https://via.placeholder.com/60";
            }}
          />
          <div>
            <Text strong>{r.name}</Text>
          </div>
        </div>
      ),
    },
    {
      title: "Code",
      dataIndex: "sku",
      key: "sku",
      render: (s) => <Text type="secondary">{s}</Text>,
    },
    { title: "Qty", dataIndex: "quantity", key: "quantity", align: "center" },
    {
      title: "Price",
      dataIndex: "price",
      key: "price",
      render: (p) => `₹${parseFloat(p).toFixed(2)}`,
    },
    {
      title: "Disc",
      key: "discount",
      render: (_, r) => {
        const discAmt = getItemDiscountAmount(r);
        return discAmt > 0 ? (
          <Text type="danger">-₹{discAmt.toFixed(2)}</Text>
        ) : (
          <Text type="secondary">—</Text>
        );
      },
    },
    {
      title: "Total",
      key: "total",
      align: "right",
      render: (_, r) => (
        <Text strong>₹{parseFloat(r.total || 0).toFixed(2)}</Text>
      ),
    },
  ];

  return (
    <div className="page-wrapper">
      <Helmet>
        <title>ORDER #{order.orderNo}</title>
      </Helmet>
      <div className="content">
        {/* MAIN GRID */}
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={16} xxl={18}>
            <Row gutter={[16, 16]}>
              <Col xs={24}>
                <Card
                  title={
                    <Space>
                      <Title level={5} style={{ margin: 0 }}>
                        Order #{order.orderNo}
                      </Title>
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
                      <Dropdown overlay={menu} trigger={["click"]}>
                        <Button type="text" icon={<EllipsisOutlined />} />
                      </Dropdown>
                    </Space>
                  }
                  className="order-card"
                >
                  <Table
                    columns={columns}
                    dataSource={mergedProducts}
                    pagination={false}
                    rowKey="productId"
                    scroll={{ x: "max-content" }}
                    footer={() => {
                      const lineItemsTotal = mergedProducts.reduce(
                        (sum, p) => sum + (parseFloat(p.total) || 0),
                        0,
                      );

                      const shippingAmount = order.shipping
                        ? parseFloat(order.shipping)
                        : 0;
                      const extraDiscountAmount = order.extraDiscountValue
                        ? parseFloat(order.extraDiscountValue)
                        : 0;

                      // Use the authoritative finalAmount from the order itself
                      const displayedFinal = parseFloat(order.finalAmount || 0);

                      return (
                        <div
                          className="table-footer"
                          style={{
                            padding: "16px 24px",
                            background: "#fafafa",
                          }}
                        >
                          <table
                            style={{
                              width: "100%",
                              borderCollapse: "collapse",
                            }}
                          >
                            <tbody>
                              <tr>
                                <td style={{ padding: "6px 0" }}>Sub Total:</td>
                                <td align="right">
                                  ₹{lineItemsTotal.toFixed(2)}
                                </td>
                              </tr>

                              {shippingAmount > 0 && (
                                <tr>
                                  <td style={{ padding: "6px 0" }}>
                                    Shipping Charges:
                                  </td>
                                  <td align="right">
                                    +₹{shippingAmount.toFixed(2)}
                                  </td>
                                </tr>
                              )}

                              {extraDiscountAmount > 0 && (
                                <tr>
                                  <td
                                    style={{
                                      padding: "6px 0",
                                      color: "#d9363e",
                                    }}
                                  >
                                    Extra Discount{" "}
                                    {order.extraDiscountType === "percent"
                                      ? `(${order.extraDiscount}%)`
                                      : ""}
                                  </td>
                                  <td
                                    align="right"
                                    style={{ color: "#d9363e" }}
                                  >
                                    -₹{extraDiscountAmount.toFixed(2)}
                                  </td>
                                </tr>
                              )}
                              {/* Optional: show quotation round-off for context */}
                              {quotationDetails.roundOff !== 0 && (
                                <tr>
                                  <td
                                    style={{ padding: "6px 0", color: "#888" }}
                                  >
                                    Round-off (from quotation)
                                  </td>
                                  <td align="right" style={{ color: "#888" }}>
                                    +₹{quotationDetails.roundOff.toFixed(2)}
                                  </td>
                                </tr>
                              )}
                              <tr
                                style={{
                                  borderTop: "2px solid #ddd",
                                  fontSize: "1.1em",
                                }}
                              >
                                <td style={{ padding: "12px 0" }}>
                                  <Text strong>Final Amount:</Text>
                                </td>
                                <td align="right">
                                  <Text
                                    strong
                                    type="danger"
                                    style={{ fontSize: "1.3em" }}
                                  >
                                    ₹{displayedFinal.toFixed(2)}
                                  </Text>
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      );
                    }}
                  />
                </Card>
              </Col>
            </Row>
            <Row>
              <Col xs={4} md={12} xl={14}>
                <Card title="Order Activity" className="activity-card">
                  <ul className="activity-list">
                    <li>
                      <Row justify="space-between">
                        <Col xs={24} sm={12}>
                          <Text strong>Order Placed</Text>
                          <div>
                            <Text type="secondary">
                              Order successfully placed and awaiting processing.
                            </Text>
                          </div>
                        </Col>
                        <Col xs={24} sm={12} className="activity-time">
                          <Text>
                            {new Date(order.createdAt).toLocaleDateString()}
                          </Text>
                          <br />
                          <Text type="secondary">
                            {new Date(order.createdAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </Text>
                        </Col>
                      </Row>
                    </li>
                    {order.status === "CREATED" && (
                      <li className="activity-pending">
                        <Row justify="space-between">
                          <Col xs={24} sm={12}>
                            <Text strong>Payment Confirmed</Text>
                            <div style={{ display: "none" }}>
                              <Text type="secondary">
                                Payment successfully processed.
                              </Text>
                            </div>
                          </Col>
                          <Col
                            xs={24}
                            sm={12}
                            className="activity-time"
                            style={{ display: "none" }}
                          >
                            <Text>-</Text>
                            <br />
                            <Text type="secondary">-</Text>
                          </Col>
                        </Row>
                      </li>
                    )}
                  </ul>
                </Card>
              </Col>

              <Col xs={4} md={12} xl={14}>
                <Card
                  title="Billing Address"
                  extra={
                    <Button
                      type="primary"
                      ghost
                      icon={<EditOutlined />}
                      onClick={() => setIsBillingModalVisible(true)}
                    >
                      {billingAddress ? "Edit" : "Add"}
                    </Button>
                  }
                  className="address-card"
                >
                  {billingAddress ? (
                    <>
                      <Text strong className="address-name">
                        {customer.name || "N/A"}
                      </Text>
                      <ul className="address-list">
                        <li>{billingAddress.street || "N/A"}</li>
                        <li>
                          {billingAddress.city}, {billingAddress.state}{" "}
                          {billingAddress.postalCode || billingAddress.zip}
                        </li>
                        <li>{billingAddress.country || "India"}</li>
                        <li>{customer.mobileNumber || "N/A"}</li>
                      </ul>
                    </>
                  ) : (
                    <Text type="secondary">No billing address available</Text>
                  )}
                </Card>
              </Col>
              <Col xs={4} md={12} xl={14}>
                <Card
                  title="Shipping Address"
                  extra={
                    <Button
                      type="primary"
                      ghost
                      icon={<EditOutlined />}
                      onClick={() => setIsShippingModalVisible(true)}
                    >
                      {shippingAddress ? "Edit" : "Add"}
                    </Button>
                  }
                  className="address-card"
                >
                  {shippingAddress ? (
                    <>
                      <Text strong className="address-name">
                        {customer.name || "N/A"}
                      </Text>
                      <ul className="address-list">
                        <li>
                          {shippingAddress.street ||
                            shippingAddress.address ||
                            "N/A"}
                        </li>
                        <li>
                          {shippingAddress.city}, {shippingAddress.state}{" "}
                          {shippingAddress.postalCode || shippingAddress.zip}
                        </li>
                        <li>{shippingAddress.country || "India"}</li>
                        <li>{customer.mobileNumber || "N/A"}</li>
                      </ul>
                    </>
                  ) : (
                    <Text type="secondary">No shipping address available</Text>
                  )}
                </Card>
              </Col>
            </Row>
          </Col>

          <Col xs={24} lg={8} xxl={6}>
            <Row gutter={[16, 16]}>
              <Col xs={24}>
                <Card title="Customer Details" className="customer-card">
                  <ul className="customer-details">
                    <li>
                      <Text type="secondary">
                        <UserOutlined className="icon" />
                        Full Name
                      </Text>
                      <Space>
                        <div
                          className="avatar small"
                          style={{ backgroundColor: "#333333" }}
                        >
                          {customer.name?.[0]?.toUpperCase() || "N/A"}
                        </div>
                        <Text strong>{customer.name || "N/A"}</Text>
                      </Space>
                    </li>
                    <li>
                      <Text type="secondary">
                        <MailOutlined className="icon" />
                        Email
                      </Text>
                      <Text strong>
                        <a
                          href={`mailto:${customer.email || "N/A"}`}
                          style={{ color: "#333333" }}
                        >
                          {customer.email || "N/A"}
                        </a>
                      </Text>
                    </li>
                    <li>
                      <Text type="secondary">
                        <PhoneOutlined className="icon" />
                        Phone
                      </Text>
                      <Text strong>{customer.mobileNumber || "N/A"}</Text>
                    </li>
                  </ul>
                </Card>
              </Col>
              <Col xs={24}>
                <Card title="Payment Details" className="payment-card">
                  <ul className="payment-details">
                    <li>
                      <Text type="secondary">Order ID</Text>
                      <Text strong>{order.orderNo || "N/A"}</Text>
                    </li>

                    <li>
                      <Text type="secondary">Final Amount</Text>
                      <Text strong>₹{finalAmount.toFixed(2)}</Text>
                    </li>
                    <li>
                      <Text type="secondary">Order Date</Text>
                      <Text strong>
                        {order.createdAt
                          ? new Date(order.createdAt).toLocaleString()
                          : "N/A"}
                      </Text>
                    </li>
                  </ul>
                </Card>
              </Col>
              <Col xs={24}>
                <Card>
                  {(quotationDetails.quotationId || order.quotation) && (
                    <div style={{ marginBottom: 16 }}>
                      <Text strong>Quotation Details:</Text>
                      <ul className="quotation-details">
                        <li>
                          <Text type="secondary">Reference Number:</Text>{" "}
                          <Text>{quotationDetails.reference_number}</Text>
                        </li>
                        <li>
                          <Text type="secondary">Document Title:</Text>{" "}
                          <Text>{quotationDetails.document_title}</Text>
                        </li>
                        <li>
                          <Text type="secondary">Quotation Date:</Text>{" "}
                          <Text>
                            {quotationDetails.quotation_date
                              ? new Date(
                                  quotationDetails.quotation_date,
                                ).toLocaleDateString()
                              : "N/A"}
                          </Text>
                        </li>
                        <li>
                          <Text type="secondary">Due Date:</Text>{" "}
                          <Text>
                            {quotationDetails.due_date
                              ? new Date(
                                  quotationDetails.due_date,
                                ).toLocaleDateString()
                              : "N/A"}
                          </Text>
                        </li>
                        <li>
                          <Text type="secondary">Follow-up Dates:</Text>{" "}
                          <Text>
                            {quotationDetails.followupDates.length > 0
                              ? quotationDetails.followupDates
                                  .map((date) =>
                                    new Date(date).toLocaleDateString(),
                                  )
                                  .join(", ")
                              : "N/A"}
                          </Text>
                        </li>
                        <li>
                          <Text type="secondary">Status:</Text>{" "}
                          <Text>{quotationDetails.status}</Text>
                        </li>
                        <li>
                          <Text type="secondary">Final Amount:</Text>{" "}
                          <Text>
                            ₹
                            {parseFloat(quotationDetails.finalAmount).toFixed(
                              2,
                            )}
                          </Text>
                        </li>
                      </ul>
                    </div>
                  )}
                </Card>
              </Col>
            </Row>
          </Col>
        </Row>

        {/* INVOICE + GATE-PASS */}
        <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
          <Col xs={24} md={12}>
            <Card title="Invoice">
              <Form onFinish={handleInvoiceSubmit} layout="vertical">
                <Form.Item label="Upload PDF">
                  <Upload
                    accept="application/pdf"
                    beforeUpload={() => false}
                    onChange={handleInvoiceChange}
                    fileList={
                      invoiceFile
                        ? [
                            {
                              uid: "-1",
                              name: invoiceFile.name,
                              status: "done",
                            },
                          ]
                        : []
                    }
                    disabled={isUploading}
                  >
                    <Button>Choose File</Button>
                  </Upload>
                </Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  disabled={!invoiceFile || isUploading}
                  loading={isUploading}
                >
                  Upload
                </Button>
              </Form>

              {/* INVOICE DOWNLOAD - FIXED */}
              {/* INVOICE DOWNLOAD - NOW SAME AS GATE PASS (WORKING) */}
              {invoiceUrl && (
                <div style={{ marginTop: 16 }}>
                  <a
                    href={invoiceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ marginRight: 12 }}
                  >
                    <FilePdfOutlined /> View Invoice
                  </a>

                  <Button
                    icon={<DownloadOutlined />}
                    size="small"
                    onClick={async () => {
                      try {
                        const response = await fetch(
                          `https://api.cmtrading.com/api/order/${order.id}/download-invoice`,
                          {
                            credentials: "include", // Critical: sends cookies/session
                          },
                        );

                        if (!response.ok) {
                          throw new Error(
                            `Download failed: ${response.status}`,
                          );
                        }

                        const blob = await response.blob();

                        // Extract filename from header (your backend already sets it!)
                        const contentDisposition = response.headers.get(
                          "Content-Disposition",
                        );
                        let filename = generateFileName(
                          "INVOICE",
                          order.orderNo,
                          customer.name,
                        );
                        if (contentDisposition) {
                          const match =
                            contentDisposition.match(/filename="(.*?)"/);
                          if (match?.[1]) filename = match[1];
                        }

                        const blobUrl = window.URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = blobUrl;
                        a.download = filename;
                        document.body.appendChild(a);
                        a.click();
                        a.remove();
                        window.URL.revokeObjectURL(blobUrl);

                        message.success("Invoice downloaded successfully");
                      } catch (err) {
                        console.error(err);
                        message.error(
                          "Failed to download invoice. Please try again.",
                        );
                      }
                    }}
                  >
                    Download Invoice
                  </Button>
                </div>
              )}
            </Card>
          </Col>

          <Col xs={24} md={12}>
            <Card
              title="Gate-Pass"
              extra={
                isDispatched && <Badge status="success" text="Dispatched" />
              }
            >
              {isDispatched ? (
                <Alert
                  message="Cannot modify gate-pass after dispatch"
                  type="info"
                />
              ) : (
                <Form onFinish={handleGatePassSubmit} layout="vertical">
                  <Form.Item label="Upload (PDF/PNG/JPG)">
                    <Upload
                      accept="application/pdf,image/*"
                      beforeUpload={() => false}
                      onChange={handleGatePassChange}
                      fileList={
                        gatePassFile
                          ? [
                              {
                                uid: "-1",
                                name: gatePassFile.name,
                                status: "done",
                              },
                            ]
                          : []
                      }
                      disabled={isGatePassUploading}
                    >
                      <Button>Choose File</Button>
                    </Upload>
                  </Form.Item>
                  <Button
                    type="primary"
                    htmlType="submit"
                    disabled={!gatePassFile || isGatePassUploading}
                    loading={isGatePassUploading}
                  >
                    Upload
                  </Button>
                </Form>
              )}
              {/* GATE-PASS DOWNLOAD - FIXED */}
              {gatePassUrl && (
                <div style={{ marginTop: 16, textAlign: "center" }}>
                  {/* Preview remains the same */}
                  {gatePassUrl.endsWith(".pdf") ? (
                    <Document
                      file={gatePassUrl}
                      onLoadSuccess={({ numPages }) => setNumPages(numPages)}
                    >
                      <Page pageNumber={1} width={300} />
                    </Document>
                  ) : (
                    <img
                      src={gatePassUrl}
                      alt="Gate Pass"
                      style={{
                        maxWidth: "100%",
                        maxHeight: 300,
                        borderRadius: 8,
                      }}
                    />
                  )}

                  <br />
                  <Button
                    icon={<DownloadOutlined />}
                    size="small"
                    style={{ marginTop: 8 }}
                    onClick={async (e) => {
                      e.preventDefault();
                      try {
                        const response = await fetch(gatePassUrl);
                        if (!response.ok) throw new Error("Download failed");

                        const blob = await response.blob();

                        // Detect actual file extension
                        const urlPath = new URL(gatePassUrl).pathname;
                        const originalFilename = urlPath.split("/").pop();
                        const extMatch = originalFilename.match(/\.([^.]+)$/);
                        const actualExt = extMatch
                          ? extMatch[1].toLowerCase()
                          : "pdf";

                        const blobUrl = window.URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = blobUrl;

                        let downloadName = generateFileName(
                          "GATEPASS",
                          order.orderNo,
                          customer.name,
                        );
                        downloadName = downloadName.replace(
                          /\.pdf$/,
                          `.${actualExt}`,
                        );

                        a.download = downloadName;
                        document.body.appendChild(a);
                        a.click();
                        a.remove();
                        window.URL.revokeObjectURL(blobUrl);
                      } catch (err) {
                        message.error("Failed to download gate-pass");
                        window.open(gatePassUrl, "_blank");
                      }
                    }}
                  >
                    Download
                  </Button>
                </div>
              )}
            </Card>
          </Col>
        </Row>

        {/* COMMENTS */}
        <Row style={{ marginTop: 24 }}>
          <Col xs={24}>
            <Card title="Comments">
              <Form
                onFinish={handleAddComment}
                layout="inline"
                style={{ marginBottom: 16 }}
              >
                <Form.Item style={{ flex: 1 }}>
                  <Input.TextArea
                    rows={2}
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment..."
                  />
                </Form.Item>
                <Form.Item>
                  <Button
                    type="primary"
                    htmlType="submit"
                    disabled={!newComment.trim()}
                  >
                    <SendOutlined />
                  </Button>
                </Form.Item>
              </Form>

              {commentLoading ? (
                <Spin />
              ) : comments.length > 0 ? (
                <div>
                  {comments.map((c) => (
                    <CommentRow
                      key={c._id}
                      comment={c}
                      onDelete={handleDeleteComment}
                      currentUserId={String(user.userId || "").trim()}
                    />
                  ))}
                </div>
              ) : (
                <Text type="secondary">No comments yet.</Text>
              )}

              {totalComments > commentLimit && (
                <div style={{ marginTop: 16, textAlign: "center" }}>
                  <Button
                    disabled={commentPage === 1}
                    onClick={() => handlePageChange(commentPage - 1)}
                  >
                    Prev
                  </Button>
                  <Text style={{ margin: "0 8px" }}>
                    Page {commentPage} of{" "}
                    {Math.ceil(totalComments / commentLimit)}
                  </Text>
                  <Button
                    disabled={
                      commentPage >= Math.ceil(totalComments / commentLimit)
                    }
                    onClick={() => handlePageChange(commentPage + 1)}
                  >
                    Next
                  </Button>
                </div>
              )}
            </Card>
          </Col>
        </Row>

        {/* MODALS */}
        {isBillingModalVisible && (
          <AddAddress
            onClose={() => setIsBillingModalVisible(false)}
            onSave={refetchAddresses}
            existingAddress={billingAddress}
            selectedCustomer={order.createdFor}
          />
        )}
        {isShippingModalVisible && (
          <AddAddress
            onClose={() => setIsShippingModalVisible(false)}
            onSave={refetchAddresses}
            existingAddress={shippingAddress}
            selectedCustomer={order.createdFor}
          />
        )}
      </div>
    </div>
  );
};

export default OrderPage;
