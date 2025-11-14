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
  useIssueGatePassMutation,
} from "../../api/orderApi";
import {
  useGetCustomerByIdQuery,
  useGetCustomersQuery,
} from "../../api/customerApi";
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
import { toast } from "sonner";
import { Document, Page, pdfjs } from "react-pdf";
import useProductsData from "../../data/useProductdata";
import AddAddress from "../Address/AddAddressModal";
import "./orderpage.css";
import { PiPaperPlaneTiltFill } from "react-icons/pi";
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
    { skip: !id }
  );

  const { data: customerData } = useGetCustomerByIdQuery(order.createdFor, {
    skip: !order.createdFor,
  });
  const customer = customerData?.data || {};

  const { data: addressesData, refetch: refetchAddresses } =
    useGetAllAddressesQuery(
      { customerId: order.createdFor },
      { skip: !order.createdFor }
    );

  const { data: teamData } = useGetAllTeamsQuery();
  const { data: customersData } = useGetCustomersQuery();

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
    if (
      order.products &&
      Array.isArray(order.products) &&
      order.products.length > 0
    )
      return order.products;
    if (order.quotation?.products) {
      try {
        const qp =
          typeof order.quotation.products === "string"
            ? JSON.parse(order.quotation.products)
            : order.quotation.products;
        if (Array.isArray(qp)) return qp;
      } catch {}
    }
    return [];
  }, [order.products, order.quotation]);

  const productInputs = useMemo(
    () =>
      products.map((p) => ({
        productId: p.productId || p.id,
        price: p.price || 0,
        total: p.total || 0,
        discount: p.discount || 0,
        quantity: p.quantity || 1,
      })),
    [products]
  );

  const { productsData, loading: productsLoading } =
    useProductsData(productInputs);

  const mergedProducts = useMemo(() => {
    return productInputs.map((op) => {
      const pd = productsData.find((p) => p.productId === op.productId) || {};
      let imageUrl = "https://via.placeholder.com/60";
      try {
        if (pd.images) {
          const imgs = JSON.parse(pd.images);
          imageUrl =
            Array.isArray(imgs) && imgs.length > 0 ? imgs[0] : imageUrl;
        }
      } catch {}

      let brandName = pd.brandName || "N/A";
      if (pd.metaDetails) {
        const brandMeta = pd.metaDetails.find(
          (m) => m.title === "brandName" || m.title === "brand"
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
        name: pd.name || op.name || "Unnamed Product",
        brand: brandName,
        sku: productCode,
        image: imageUrl,
      };
    });
  }, [productsData, productInputs]);

  const comments = useMemo(() => commentData?.comments || [], [commentData]);
  const totalComments = commentData?.totalCount || 0;

  // ── ADDRESSES ──
  const billingAddress = useMemo(
    () =>
      addressesData?.find(
        (a) => a.status === "BILLING" && a.customerId === order.createdFor
      ) || null,
    [addressesData, order.createdFor]
  );

  const shippingAddress = useMemo(
    () =>
      addressesData?.find(
        (a) => a.status === "SHIPPING" && a.customerId === order.createdFor
      ) ||
      order.shippingAddress ||
      null,
    [addressesData, order.createdFor, order.shippingAddress]
  );

  // ── FILE HANDLERS ──
  const handleInvoiceChange = ({ file }) => {
    if (file && file.type === "application/pdf") {
      setInvoiceFile(file);
    } else {
      toast.error("Only PDF files are allowed for invoice.");
    }
  };

  const handleGatePassChange = ({ file }) => {
    const allowed = ["application/pdf", "image/png", "image/jpeg", "image/jpg"];
    if (file && allowed.includes(file.type)) {
      setGatePassFile(file);
    } else {
      toast.error("Only PDF, PNG, JPG allowed for gate-pass.");
    }
  };

  const handleInvoiceSubmit = async () => {
    if (!invoiceFile) return toast.error("Select a PDF file.");
    const formData = new FormData();
    formData.append("invoice", invoiceFile);
    try {
      await uploadInvoice({ orderId: id, formData }).unwrap();
      setInvoiceFile(null);
      refetchOrder();
      toast.success("Invoice uploaded");
    } catch (err) {
      toast.error(err.data?.message || "Upload failed");
    }
  };

  const handleGatePassSubmit = async () => {
    if (!gatePassFile) return toast.error("Select a file.");
    const formData = new FormData();
    formData.append("gatepass", gatePassFile);
    try {
      await issueGatePass({ orderId: id, formData }).unwrap();
      setGatePassFile(null);
      refetchOrder();
      toast.success("Gate-pass uploaded");
    } catch (err) {
      toast.error(err.data?.message || "Gate-pass upload failed");
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
      toast.error(err?.data?.message || "Delete failed");
    }
  };
  const handleHoldOrder = async () => {
    try {
      await updateOrderStatus({ id, status: "ONHOLD" }).unwrap();
      refetchOrder();
    } catch (err) {
      toast.error(err?.data?.message || "Failed to hold order");
    }
  };
  const handleAddComment = async () => {
    if (!newComment.trim()) return toast.error("Comment cannot be empty");
    if (!user.userId) return navigate("/login");

    try {
      await addComment({
        resourceId: id,
        resourceType: "Order",
        userId: user.userId,
        comment: newComment,
      }).unwrap();
      setNewComment("");
    } catch (err) {
      toast.error(err?.data?.message || "Failed to add comment");
    }
  };
  const handleDeleteComment = async (commentId) => {
    if (!window.confirm("Delete comment?")) return;
    try {
      await deleteComment({ commentId, userId: user.userId }).unwrap();
    } catch (err) {
      toast.error(err?.data?.message || "Delete failed");
    }
  };

  const handlePageChange = (page) => {
    if (page >= 1 && page <= Math.ceil(totalComments / commentLimit)) {
      setCommentPage(page);
    }
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

  // ── CALCULATIONS ──
  const subTotal = mergedProducts.reduce(
    (a, p) => a + (p.total || p.price * p.quantity),
    0
  );
  const discount = mergedProducts.reduce((a, p) => a + (p.discount || 0), 0);
  const vat = subTotal * 0.1;
  const total = subTotal - discount + vat;

  // ── MENU ──
  const menu = (
    <Menu>
      <Menu.Item key="edit" onClick={handleEditOrder}>
        Edit Order
      </Menu.Item>
      <Menu.Item key="delete" danger onClick={handleDeleteOrder}>
        Delete
      </Menu.Item>
      <Menu.Item key="hold" onClick={handleHoldOrder}>
        Put on Hold
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
            src={r.image}
            alt={r.name}
            className="product-image"
            onError={(e) => (e.target.src = "https://via.placeholder.com/60")}
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
      dataIndex: "discount",
      key: "discount",
      render: (d) => `₹${parseFloat(d || 0).toFixed(2)}`,
    },
    {
      title: "Total",
      key: "total",
      align: "right",
      render: (_, r) =>
        `₹${parseFloat(r.total || r.price * r.quantity).toFixed(2)}`,
    },
  ];

  return (
    <div className="page-wrapper">
      <Helmet>
        <title>ORDER #{order.orderNo}</title>
      </Helmet>
      <div className="content">
        <div className="container-fluid">
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
                      footer={() => (
                        <div className="table-footer">
                          <table>
                            <tbody>
                              <tr>
                                <td>Sub Total:</td>
                                <td>
                                  <Text strong>₹{subTotal.toFixed(2)}</Text>
                                </td>
                              </tr>
                              <tr>
                                <td>Discount:</td>
                                <td>
                                  <Text strong>-₹{discount.toFixed(2)}</Text>
                                </td>
                              </tr>
                              <tr>
                                <td>Tax:</td>
                                <td>
                                  <Text strong>₹{vat.toFixed(2)}</Text>
                                </td>
                              </tr>
                              <tr>
                                <td>Total:</td>
                                <td>
                                  <Text strong className="total-amount">
                                    ₹{total.toFixed(2)}
                                  </Text>
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      )}
                    />
                  </Card>
                </Col>

                <Col xs={24} md={12} xl={14}>
                  <Card title="Order Activity" className="activity-card">
                    <ul className="activity-list">
                      <li>
                        <Row justify="space-between">
                          <Col xs={24} sm={12}>
                            <Text strong>Order Placed</Text>
                            <div>
                              <Text type="secondary">
                                Order successfully placed and awaiting
                                processing.
                              </Text>
                            </div>
                          </Col>
                          <Col xs={24} sm={12} className="activity-time">
                            <Text>
                              {new Date(order.createdAt).toLocaleDateString()}
                            </Text>
                            <br />
                            <Text type="secondary">
                              {new Date(order.createdAt).toLocaleTimeString(
                                [],
                                {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                }
                              )}
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

                <Col xs={24} md={12} xl={10}>
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
                      <Text type="secondary">
                        No shipping address available
                      </Text>
                    )}
                  </Card>
                </Col>
              </Row>
            </Col>

            <Col xs={24} lg={8} xxl={6}>
              <Row gutter={[16, 16]}>
                <Col xs={24}>
                  <Card
                    title="Customer Details"
                    extra={
                      <Badge
                        count={`${totalOrders} Orders`}
                        style={{ backgroundColor: "#1890ff" }}
                      />
                    }
                    className="customer-card"
                  >
                    <ul className="customer-details">
                      <li>
                        <Text type="secondary">
                          <UserOutlined className="icon" />
                          Full Name
                        </Text>
                        <Space>
                          <div className="avatar small">
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
                          <a href={`mailto:${customer.email || "N/A"}`}>
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
                        <Text type="secondary">Amount Paid</Text>
                        <Text strong>
                          ₹{(parseFloat(order.finalAmount) || 0).toFixed(2)}
                        </Text>
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
                                    quotationDetails.quotation_date
                                  ).toLocaleDateString()
                                : "N/A"}
                            </Text>
                          </li>
                          <li>
                            <Text type="secondary">Due Date:</Text>{" "}
                            <Text>
                              {quotationDetails.due_date
                                ? new Date(
                                    quotationDetails.due_date
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
                                      new Date(date).toLocaleDateString()
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
                                2
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

                {invoiceUrl && (
                  <div style={{ marginTop: 16 }}>
                    <a
                      href={invoiceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <FilePdfOutlined /> {order.invoiceLink.split("/").pop()}
                    </a>
                    <Button
                      icon={<DownloadOutlined />}
                      size="small"
                      style={{ marginLeft: 8 }}
                      onClick={() => {
                        const a = document.createElement("a");
                        a.href = invoiceUrl;
                        a.download = order.invoiceLink.split("/").pop();
                        a.click();
                      }}
                    >
                      Download
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

                {gatePassUrl && (
                  <div style={{ marginTop: 16, textAlign: "center" }}>
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
                      onClick={() => {
                        const a = document.createElement("a");
                        a.href = gatePassUrl;
                        a.download = order.gatePassLink.split("/").pop();
                        a.click();
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
                      <PiPaperPlaneTiltFill />
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
                        currentUserId={user.userId}
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
    </div>
  );
};

export default OrderPage;
