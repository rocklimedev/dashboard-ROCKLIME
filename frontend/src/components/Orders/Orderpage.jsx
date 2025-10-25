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
} from "antd";
import {
  EllipsisOutlined,
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  EditOutlined,
} from "@ant-design/icons";
import { toast } from "sonner";
import { Document, Page, pdfjs } from "react-pdf";
import useProductsData from "../../data/useProductdata";
import AddAddress from "../Address/AddAddressModal";
import "./orderpage.css";
import { PiPaperPlaneTiltFill } from "react-icons/pi";

// Set PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js`;

const { Text, Title } = Typography;

// CommentRow Component (unchanged)
const CommentRow = ({ comment, onDelete, currentUserId }) => {
  const isCurrentUser = comment.userId === currentUserId;
  const userInitial = comment.user?.name
    ? comment.user.name[0].toUpperCase()
    : "U";

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

const OrderPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [customerMap, setCustomerMap] = useState({});
  const [deleteOrder] = useDeleteOrderMutation();
  const [updateOrderStatus] = useUpdateOrderStatusMutation();
  const [addComment] = useAddCommentMutation();
  const [deleteComment] = useDeleteCommentMutation();
  const [uploadInvoice, { isLoading: isUploading }] =
    useUploadInvoiceMutation();
  const [teamMap, setTeamMap] = useState({});
  const [newComment, setNewComment] = useState("");
  const [commentPage, setCommentPage] = useState(1);
  const [invoiceFile, setInvoiceFile] = useState(null);
  const [pdfPageNum, setPdfPageNum] = useState(1);
  const [numPages, setNumPages] = useState(null);
  const [isBillingModalVisible, setIsBillingModalVisible] = useState(false);
  const [isShippingModalVisible, setIsShippingModalVisible] = useState(false);
  const commentLimit = 10;

  // Fetch data
  const {
    data: profileData,
    isLoading: profileLoading,
    error: profileError,
  } = useGetProfileQuery();
  const user = profileData?.user || {};

  const {
    data: orderData,
    isLoading: orderLoading,
    error: orderError,
    refetch: refetchOrder,
  } = useGetOrderDetailsQuery(id);
  const order = orderData?.order || {};

  const {
    data: commentData,
    isLoading: commentLoading,
    error: commentError,
  } = useGetCommentsQuery(
    {
      resourceId: id,
      resourceType: "Order",
      page: commentPage,
      limit: commentLimit,
    },
    { skip: !id }
  );

  const {
    data: customerData,
    isLoading: customerLoading,
    error: customerError,
  } = useGetCustomerByIdQuery(order.createdFor, {
    skip: !order.createdFor,
  });
  const customer = customerData?.data || customerData || {};

  const {
    data: addressesData,
    isLoading: addressesLoading,
    error: addressesError,
    refetch: refetchAddresses,
  } = useGetAllAddressesQuery(
    { customerId: order.createdFor },
    { skip: !order.createdFor }
  );

  const {
    data: teamData,
    isLoading: teamLoading,
    error: teamError,
  } = useGetAllTeamsQuery();
  const { data: customersData } = useGetCustomersQuery();

  // Process quotation details with fallback to order.quotation
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
      signature_name: details.signature_name || null,
      signature_image: details.signature_image || null,
      createdBy: details.createdBy || null,
      customerId: details.customerId || null,
      shipTo: details.shipTo || null,
      status: details.status || "N/A",
    };
  }, [order.quotationDetails, order.quotation]);

  // Product data processing
  const products = useMemo(() => {
    try {
      // First, try to use order.products if it exists and is an array
      if (
        order.products &&
        Array.isArray(order.products) &&
        order.products.length > 0
      ) {
        return order.products;
      }
      // Fallback to order.quotation.products if available
      if (order.quotation?.products) {
        try {
          const quotationProducts =
            typeof order.quotation.products === "string"
              ? JSON.parse(order.quotation.products)
              : order.quotation.products;

          if (Array.isArray(quotationProducts)) {
            return quotationProducts;
          }
        } catch (error) {
          toast.error("Error parsing quotation products:", error);
        }
      }
      return [];
    } catch (error) {
      toast.error("Error processing order products:", error);
      return [];
    }
  }, [order.products, order.quotation]);
  const productInputs = useMemo(
    () =>
      products.map((product) => ({
        productId: product.productId || product.id,
        price: product.price || 0,
        total: product.total || 0,
        discount: product.discount || 0,
        quantity: product.quantity || 1,
      })),
    [products]
  );

  const {
    productsData,
    errors: productErrors,
    loading: productsLoading,
  } = useProductsData(productInputs);

  useEffect(() => {
    if (productErrors.length > 0) {
      productErrors.forEach(({ productId, error }) => {
        toast.error(`Failed to fetch product ${productId}: ${error}`);
      });
    }
  }, [productErrors]);

  const mergedProducts = useMemo(() => {
    return productInputs.map((orderProduct) => {
      const productDetail =
        productsData.find((p) => p.productId === orderProduct.productId) || {};

      let imageUrl = "https://via.placeholder.com/60";
      try {
        if (productDetail.images) {
          const imgs = JSON.parse(productDetail.images);
          imageUrl =
            Array.isArray(imgs) && imgs.length > 0 ? imgs[0] : imageUrl;
        }
      } catch {
        // Fallback to placeholder
      }

      let brandName = "N/A";
      if (productDetail.brandName) {
        brandName = productDetail.brandName;
      } else if (productDetail.metaDetails) {
        const brandMeta = productDetail.metaDetails.find(
          (m) => m.title === "brandName" || m.title === "brand"
        );
        brandName = brandMeta?.value || "N/A";
      }

      if (
        /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(
          brandName
        )
      ) {
        brandName = "N/A";
      }

      const productCode =
        productDetail?.product_code ||
        productDetail?.meta?.d11da9f9_3f2e_4536_8236_9671200cca4a ||
        "N/A";

      const sellingPrice =
        productDetail.metaDetails?.find((m) => m.title === "Selling Price")
          ?.value ||
        orderProduct.price ||
        productDetail.price ||
        0;

      return {
        productId: orderProduct.productId,
        price: parseFloat(sellingPrice),
        total:
          parseFloat(orderProduct.total) ||
          sellingPrice * orderProduct.quantity,
        discount: parseFloat(orderProduct.discount) || 0,
        quantity: orderProduct.quantity || 1,
        name: productDetail?.name || orderProduct.name || "Unnamed Product",
        brand: brandName,
        sku: productCode,
        image: imageUrl,
      };
    });
  }, [productsData, productInputs]);

  const comments = useMemo(() => commentData?.comments || [], [commentData]);
  const totalComments = commentData?.totalCount || 0;

  useEffect(() => {
    if (customersData?.data) {
      const map = customersData.data.reduce((acc, customer) => {
        acc[customer.customerId] = customer.name || "—";
        return acc;
      }, {});
      setCustomerMap(map);
    }
  }, [customersData]);

  useEffect(() => {
    if (teamData?.teams) {
      const map = teamData.teams.reduce((acc, team) => {
        acc[team.id] = team.teamName || "—";
        return acc;
      }, {});
      setTeamMap(map);
    }
  }, [teamData]);

  const userMap = useMemo(() => {
    const map = {};
    if (teamData?.teams) {
      teamData.teams.forEach((team) => {
        team.teammembers.forEach((member) => {
          map[member.userId] = member.userName;
        });
      });
    }
    return map;
  }, [teamData]);

  const billingAddress = useMemo(
    () =>
      addressesData?.find(
        (addr) =>
          addr.status === "BILLING" && addr.customerId === order.createdFor
      ) || null,
    [addressesData, order.createdFor]
  );

  const shippingAddress = useMemo(
    () =>
      addressesData?.find(
        (addr) =>
          addr.status === "SHIPPING" && addr.customerId === order.createdFor
      ) ||
      order.shippingAddress ||
      null,
    [addressesData, order.createdFor, order.shippingAddress]
  );

  const handleFileChange = ({ file }) => {
    if (file && file.type === "application/pdf") {
      setInvoiceFile(file);
    } else {
      toast.error("Please upload a valid PDF file.");
    }
  };

  const handleInvoiceFormSubmit = async () => {
    if (!invoiceFile) {
      toast.error("Please select a PDF file to upload.");
      return;
    }
    if (!id) {
      toast.error("Order ID is missing.");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("invoice", invoiceFile);
      await uploadInvoice({ orderId: id, formData }).unwrap();
      setInvoiceFile(null);
      await refetchOrder();
    } catch (err) {
      toast.error(
        `Upload error: ${err.data?.message || "Failed to upload invoice"}`
      );
    }
  };

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
    setPdfPageNum(1);
  };

  const handleEditOrder = () => {
    navigate(`/order/${order.id}/edit`, { state: { order } });
  };

  const handleDeleteOrder = async () => {
    if (window.confirm("Are you sure you want to delete this order?")) {
      try {
        await deleteOrder(id).unwrap();
        navigate("/orders/list");
      } catch (err) {
        toast.error(
          `Failed to delete order: ${err?.data?.message || "Unknown error"}`
        );
      }
    }
  };

  const handleHoldOrder = async () => {
    try {
      await updateOrderStatus({ id, status: "ONHOLD" }).unwrap();
      refetchOrder();
    } catch (err) {
      toast.error(
        `Failed to update order status: ${
          err?.data?.message || "Unknown error"
        }`
      );
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) {
      toast.error("Comment cannot be empty");
      return;
    }
    if (!user.userId) {
      toast.error("User profile not loaded. Please log in again.");
      navigate("/login");
      return;
    }

    try {
      await addComment({
        resourceId: id,
        resourceType: "Order",
        userId: user.userId,
        comment: newComment,
      }).unwrap();
      setNewComment("");
    } catch (err) {
      const errorMessage =
        err?.data?.message || "Failed to add comment. Please try again.";
      if (errorMessage.includes("maximum of 3 comments")) {
        toast.error(
          "You have reached the maximum of 3 comments for this order."
        );
      } else {
        toast.error(errorMessage);
      }
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!user.userId) {
      toast.error("User profile not loaded. Please log in again.");
      navigate("/login");
      return;
    }
    if (window.confirm("Are you sure you want to delete this comment?")) {
      try {
        await deleteComment({ commentId, userId: user.userId }).unwrap();
      } catch (err) {
        toast.error(
          `Failed to delete comment: ${err?.data?.message || "Unknown error"}`
        );
      }
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= Math.ceil(totalComments / commentLimit)) {
      setCommentPage(newPage);
    }
  };

  const handleAddressSave = async () => {
    await refetchAddresses();
  };

  const handleBillingModalClose = () => {
    setIsBillingModalVisible(false);
  };

  const handleShippingModalClose = () => {
    setIsShippingModalVisible(false);
  };

  const pdfUrl =
    order.invoiceLink && order.invoiceLink !== ""
      ? order.invoiceLink.startsWith("http")
        ? order.invoiceLink
        : `${process.env.REACT_APP_FTP_BASE_URL}${order.invoiceLink}`
      : null;

  if (profileError && profileError.status === 401) {
    toast.error("Please log in to access this page.");
    navigate("/login");
    return null;
  }

  if (
    profileLoading ||
    orderLoading ||
    teamLoading ||
    productsLoading ||
    customerLoading ||
    addressesLoading
  ) {
    return (
      <div className="loading-container">
        <Spin /> <Text style={{ marginLeft: 8 }}>Loading...</Text>
      </div>
    );
  }

  if (
    profileError ||
    orderError ||
    teamError ||
    customerError ||
    addressesError ||
    productErrors.length > 0
  ) {
    return (
      <div className="error-container">
        <Alert
          message={
            profileError?.data?.message ||
            orderError?.data?.message ||
            teamError?.data?.message ||
            customerError?.data?.message ||
            addressesError?.data?.message ||
            productErrors.map((err) => err.error).join(", ") ||
            "Error loading data. Please try again."
          }
          type="error"
        />
      </div>
    );
  }

  // Financial calculations
  const subTotal = mergedProducts.reduce(
    (acc, product) => acc + (product.total || product.price * product.quantity),
    0
  );
  const discount = mergedProducts.reduce(
    (acc, product) => acc + (product.discount || 0),
    0
  );
  const vat = subTotal * 0.1; // Assuming 10% VAT
  const total = subTotal - discount + vat;

  const totalOrders = customerData?.invoices?.length || 0;

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
      dataIndex: "product",
      key: "product",
      render: (_, record) => (
        <div className="product-cell">
          <img
            src={record.image}
            alt={record.name}
            className="product-image"
            onError={(e) => {
              e.target.src = "https://via.placeholder.com/60";
            }}
          />
          <div>
            <Text strong>{record.name}</Text>
          </div>
        </div>
      ),
    },
    {
      title: "Product Code",
      dataIndex: "sku",
      key: "sku",
      render: (sku) => <Text type="secondary">{sku}</Text>,
    },
    {
      title: "Quantity",
      dataIndex: "quantity",
      key: "quantity",
      align: "center",
      render: (quantity) => quantity || 1,
    },
    {
      title: "Price Per Unit",
      dataIndex: "price",
      key: "price",
      render: (price) => `₹${parseFloat(price).toFixed(2)}`,
    },
    {
      title: "Discount",
      dataIndex: "discount",
      key: "discount",
      render: (discount) => `₹${parseFloat(discount || 0).toFixed(2)}`,
    },
    {
      title: "Total",
      dataIndex: "total",
      key: "total",
      align: "right",
      render: (total, record) =>
        `₹${parseFloat(total || record.price * record.quantity).toFixed(2)}`,
    },
  ];

  return (
    <div className="page-wrapper">
      <div className="content">
        <div className="container-fluid">
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
                          <Button
                            type="text"
                            icon={<EllipsisOutlined />}
                            aria-label="Order actions"
                          />
                        </Dropdown>
                      </Space>
                    }
                    className="order-card"
                  >
                    <Table
                      columns={columns}
                      dataSource={mergedProducts}
                      pagination={false}
                      rowKey={(record) => record.productId}
                      className="product-table"
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
                                <td>Avail Discount:</td>
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
                              {(quotationDetails.quotationId ||
                                order.quotation) && (
                                <>
                                  <tr>
                                    <td>Quotation Discount:</td>
                                    <td>
                                      <Text strong>
                                        -₹
                                        {parseFloat(
                                          quotationDetails.discountAmount
                                        ).toFixed(2)}
                                      </Text>
                                    </td>
                                  </tr>
                                  <tr>
                                    <td>Round Off:</td>
                                    <td>
                                      <Text strong>
                                        ₹
                                        {parseFloat(
                                          quotationDetails.roundOff
                                        ).toFixed(2)}
                                      </Text>
                                    </td>
                                  </tr>
                                  <tr>
                                    <td>Final Quotation Total:</td>
                                    <td>
                                      <Text strong className="total-amount">
                                        ₹
                                        {parseFloat(
                                          quotationDetails.finalAmount
                                        ).toFixed(2)}
                                      </Text>
                                    </td>
                                  </tr>
                                </>
                              )}
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
                    <Text strong className="payment-method-title">
                      Payment Method
                    </Text>
                    <Text>{customer.paymentMode || "N/A"}</Text>
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
                        <Text type="secondary">Payment Method</Text>
                        <Text strong>{customer.paymentMode || "N/A"}</Text>
                      </li>
                      <li>
                        <Text type="secondary">Card Number</Text>
                        <Text strong>
                          {customer.paymentMode === "Credit Card"
                            ? "**** **** **** 1234"
                            : "N/A"}
                        </Text>
                      </li>
                      <li>
                        <Text type="secondary">Payment Status</Text>
                        <Badge
                          status={
                            order.status === "CREATED" ? "warning" : "success"
                          }
                          text={
                            order.status === "CREATED" ? "Pending" : "Completed"
                          }
                        />
                      </li>
                      <li>
                        <Text type="secondary">Amount Paid</Text>
                        <Text strong>
                          ₹{customer.paidAmount?.toFixed(2) || "0.00"}
                        </Text>
                      </li>
                      <li>
                        <Text type="secondary">Payment Date</Text>
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

          <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
            <Col xs={24}>
              <Card title="📄 Invoice" className="invoice-card">
                <Form onFinish={handleInvoiceFormSubmit} layout="vertical">
                  <Form.Item label="Upload Invoice (PDF only)" name="invoice">
                    <Upload
                      accept="application/pdf"
                      beforeUpload={() => false}
                      onChange={handleFileChange}
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
                    <Text type="secondary" className="upload-hint">
                      Upload a PDF invoice.
                    </Text>
                  </Form.Item>
                  <Button
                    type="primary"
                    htmlType="submit"
                    disabled={!invoiceFile || isUploading}
                    loading={isUploading}
                  >
                    Upload Invoice
                  </Button>
                </Form>
                {pdfUrl ? (
                  <div className="pdf-viewer">
                    <div className="pdf-header">
                      <span className="pdf-icon">📄</span>
                      <div>
                        <a
                          href={pdfUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Text strong>
                            {order.invoiceLink.split("/").pop() ||
                              "Invoice.pdf"}
                          </Text>
                        </a>
                        <Text type="secondary" className="pdf-type">
                          PDF Document
                        </Text>
                      </div>
                      <Button
                        type="default"
                        onClick={() => {
                          const link = document.createElement("a");
                          link.href = pdfUrl;
                          link.download =
                            order.invoiceLink.split("/").pop() || "invoice.pdf";
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                        }}
                      >
                        Download
                      </Button>
                    </div>
                    <div className="pdf-container">
                      <Document
                        file={pdfUrl}
                        onLoadSuccess={onDocumentLoadSuccess}
                        onLoadError={(error) => {
                          toast.error("Failed to load PDF invoice.");
                        }}
                      >
                        <Page pageNumber={pdfPageNum} width={600} />
                      </Document>
                      {numPages && (
                        <div className="pdf-controls">
                          <Button
                            disabled={pdfPageNum <= 1}
                            onClick={() => setPdfPageNum(pdfPageNum - 1)}
                          >
                            Previous
                          </Button>
                          <Text>
                            Page {pdfPageNum} of {numPages}
                          </Text>
                          <Button
                            disabled={pdfPageNum >= numPages}
                            onClick={() => setPdfPageNum(pdfPageNum + 1)}
                          >
                            Next
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <Alert
                    message="No invoice uploaded for this order."
                    type="warning"
                    style={{ marginTop: 16 }}
                  />
                )}
              </Card>
            </Col>
          </Row>

          <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
            <Col xs={24}>
              <Card className="comments-card">
                <div className="comments-container">
                  {!user.userId ? (
                    <Alert
                      message={
                        <span>
                          You must be logged in to add comments.{" "}
                          <Button
                            type="link"
                            onClick={() => navigate("/login")}
                            style={{ padding: 0 }}
                          >
                            Log in
                          </Button>
                        </span>
                      }
                      type="warning"
                      style={{ marginTop: 16 }}
                    />
                  ) : (
                    <Form
                      onFinish={handleAddComment}
                      className="comment-form"
                      layout="inline"
                    >
                      <Form.Item style={{ flex: 1 }}>
                        <Input.TextArea
                          rows={2}
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          placeholder="Type your comment here..."
                          maxLength={1000}
                          className="comment-input"
                        />
                      </Form.Item>
                      <Form.Item>
                        <Button
                          type="primary"
                          htmlType="submit"
                          disabled={!newComment.trim()}
                          className="comment-submit"
                        >
                          <PiPaperPlaneTiltFill />
                        </Button>
                      </Form.Item>
                    </Form>
                  )}
                  {commentLoading ? (
                    <div className="comments-loading">
                      <Spin /> Loading comments...
                    </div>
                  ) : commentError ? (
                    <Alert
                      message={`Unable to load comments: ${
                        commentError?.data?.message || "Please try again later."
                      }`}
                      type="error"
                    />
                  ) : comments.length > 0 ? (
                    <div className="comments-list">
                      {comments.map((comment) => (
                        <CommentRow
                          key={comment._id}
                          comment={comment}
                          onDelete={handleDeleteComment}
                          currentUserId={user.userId}
                        />
                      ))}
                    </div>
                  ) : (
                    <Text className="no-comments">
                      No comments found for this order.
                    </Text>
                  )}
                </div>

                {comments.length > 0 && (
                  <div className="comments-pagination">
                    <Button
                      disabled={commentPage === 1}
                      onClick={() => handlePageChange(commentPage - 1)}
                    >
                      Previous
                    </Button>
                    <Text>
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

          {isBillingModalVisible && (
            <AddAddress
              onClose={handleBillingModalClose}
              onSave={handleAddressSave}
              existingAddress={billingAddress}
              selectedCustomer={order.createdFor}
            />
          )}
          {isShippingModalVisible && (
            <AddAddress
              onClose={handleShippingModalClose}
              onSave={handleAddressSave}
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
