import React, { useMemo } from "react";
import {
  Alert,
  Avatar,
  Badge,
  Button,
  Card,
  Col,
  Empty,
  Image,
  Row,
  Skeleton,
  Space,
  Statistic,
  Table,
  Tag,
  Typography,
} from "antd";
import {
  ArrowDownOutlined,
  ArrowLeftOutlined,
  ArrowUpOutlined,
  BarcodeOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  HistoryOutlined,
  InboxOutlined,
  ShoppingOutlined,
  UserOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import { useNavigate, useParams } from "react-router-dom";
import dayjs from "dayjs";

import {
  useGetHistoryByProductIdQuery,
  useGetProductByIdQuery,
} from "../../api/productApi";

import { useGetAllUsersQuery } from "../../api/userApi";

const { Title, Text } = Typography;

const PAGE_CSS = `
  .product-inventory-page {
    min-height: 100vh;
    background:
      radial-gradient(circle at 90% 0%, rgba(22,119,255,.055), transparent 28%),
      #f5f7fa;
    padding: 24px 0 48px;
  }

  /* ---------------------------------------------------------
     PAGE HEADER
  --------------------------------------------------------- */

  .inventory-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 24px;
    margin-bottom: 22px;
  }

  .inventory-header-left {
    min-width: 0;
  }

  .back-button {
    height: 32px;
    padding: 0;
    margin-bottom: 10px;
    color: #64748b;
    font-weight: 600;
  }

  .back-button:hover {
    color: #1677ff !important;
    background: transparent !important;
  }

  .inventory-breadcrumb {
    display: flex;
    align-items: center;
    gap: 7px;
    margin-bottom: 7px;
    color: #94a3b8;
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: .06em;
  }

  .inventory-title {
    margin: 0 !important;
    color: #0f172a !important;
    font-size: clamp(24px, 3vw, 32px) !important;
    line-height: 1.15 !important;
    letter-spacing: -.025em;
  }

  .inventory-subtitle {
    display: block;
    max-width: 720px;
    margin-top: 7px;
    color: #64748b;
    font-size: 14px;
    line-height: 1.6;
  }

  .header-meta {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 8px;
    flex-wrap: wrap;
    padding-top: 35px;
  }

  .product-code-tag {
    height: 32px;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 0 11px;
    border: 1px solid #dbeafe;
    background: #eff6ff;
    color: #1d4ed8;
    border-radius: 8px;
    font-weight: 600;
  }

  .status-pill {
    height: 32px;
    display: inline-flex;
    align-items: center;
    padding: 0 11px;
    border: 1px solid #dcfce7;
    background: #f0fdf4;
    border-radius: 8px;
  }

  /* ---------------------------------------------------------
     MAIN PRODUCT CARD
  --------------------------------------------------------- */

  .overview-card {
    border: 1px solid #e7ebf0 !important;
    border-radius: 16px !important;
    box-shadow: 0 5px 20px rgba(15, 23, 42, .045) !important;
    overflow: hidden;
  }

  .overview-card .ant-card-body {
    padding: 0;
  }

  .product-overview {
    display: grid;
    grid-template-columns: 280px minmax(0, 1fr) 245px;
    min-height: 270px;
  }

  .product-visual {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 270px;
    padding: 24px;
    background:
      radial-gradient(circle at center, #ffffff 0%, #f8fafc 72%);
    border-right: 1px solid #eef1f5;
  }

  .product-image {
    max-width: 100%;
    max-height: 215px;
    object-fit: contain;
  }

  .product-image-empty {
    width: 100%;
    height: 215px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px dashed #dbe2ea;
    border-radius: 12px;
    background: #fafbfc;
  }

  .product-details {
    padding: 28px 30px;
    min-width: 0;
  }

  .product-details-title {
    margin: 0 0 7px !important;
    color: #0f172a !important;
    font-size: 22px !important;
  }

  .product-description {
    display: block;
    max-width: 680px;
    color: #64748b;
    line-height: 1.65;
    margin-bottom: 24px;
  }

  .detail-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
  }

  .detail-item {
    padding: 12px 14px;
    border: 1px solid #edf0f4;
    background: #fafbfc;
    border-radius: 10px;
  }

  .detail-label {
    display: block;
    margin-bottom: 4px;
    color: #94a3b8;
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: .045em;
  }

  .detail-value {
    color: #334155;
    font-size: 13px;
    font-weight: 600;
  }

  /* ---------------------------------------------------------
     STOCK PANEL
  --------------------------------------------------------- */

  .stock-overview {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 25px 22px;
    background: #f8fafc;
    border-left: 1px solid #eef1f5;
  }

  .stock-overview.low-stock {
    background: #fff8f7;
  }

  .stock-label {
    display: flex;
    align-items: center;
    gap: 7px;
    color: #64748b;
    font-size: 12px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: .04em;
  }

  .stock-value {
    margin: 14px 0 2px;
    color: #0f172a;
    font-size: 46px;
    line-height: 1;
    font-weight: 750;
    letter-spacing: -.04em;
  }

  .stock-unit {
    color: #64748b;
    font-size: 13px;
  }

  .stock-alert-line {
    margin-top: 20px;
    padding-top: 15px;
    border-top: 1px solid #e8edf2;
  }

  .stock-status {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    margin-top: 10px;
    padding: 6px 9px;
    border-radius: 7px;
    background: #ecfdf3;
    color: #15803d;
    font-size: 12px;
    font-weight: 700;
  }

  .stock-status.low {
    background: #fff1f0;
    color: #cf1322;
  }

  /* ---------------------------------------------------------
     METRICS
  --------------------------------------------------------- */

  .metrics-grid {
    margin-top: 18px;
  }

  .metric {
    height: 100%;
    min-height: 108px;
    padding: 17px 18px;
    border: 1px solid #e7ebf0;
    border-radius: 14px;
    background: #ffffff;
    box-shadow: 0 4px 14px rgba(15, 23, 42, .035);
  }

  .metric-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 9px;
  }

  .metric-icon {
    width: 32px;
    height: 32px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 9px;
    background: #f1f5f9;
    color: #475569;
  }

  .metric-label {
    color: #64748b;
    font-size: 12px;
    font-weight: 600;
  }

  .metric .ant-statistic {
    line-height: 1;
  }

  .metric .ant-statistic-content {
    color: #0f172a;
    font-size: 23px;
    font-weight: 700;
  }

  .metric .ant-statistic-content-prefix {
    font-size: 16px;
    margin-right: 3px;
  }

  /* ---------------------------------------------------------
     HISTORY
  --------------------------------------------------------- */

  .history-card {
    margin-top: 18px;
    border: 1px solid #e7ebf0 !important;
    border-radius: 16px !important;
    box-shadow: 0 5px 20px rgba(15, 23, 42, .045) !important;
    overflow: hidden;
  }

  .history-card .ant-card-head {
    min-height: 68px;
    padding: 0 20px;
    border-bottom: 1px solid #edf0f4;
  }

  .history-card .ant-card-body {
    padding: 0;
  }

  .history-heading {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .history-heading-icon {
    width: 34px;
    height: 34px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 9px;
    background: #eff6ff;
    color: #1677ff;
  }

  .history-title {
    color: #0f172a;
    font-size: 15px;
    font-weight: 700;
  }

  .history-subtitle {
    display: block;
    margin-top: 2px;
    color: #94a3b8;
    font-size: 11px;
    font-weight: 500;
  }

  .latest-movement {
    color: #94a3b8;
    font-size: 12px;
  }

  .inventory-table .ant-table {
    font-size: 13px;
  }

  .inventory-table .ant-table-container {
    border-inline: 0 !important;
  }

  .inventory-table .ant-table-thead > tr > th {
    padding: 13px 16px;
    background: #fafbfc !important;
    border-bottom: 1px solid #e8edf2;
    color: #64748b;
    font-size: 11px;
    font-weight: 750;
    text-transform: uppercase;
    letter-spacing: .045em;
  }

  .inventory-table .ant-table-tbody > tr > td {
    padding: 14px 16px;
    border-bottom: 1px solid #f1f4f7;
    color: #334155;
    vertical-align: middle;
  }

  .inventory-table .ant-table-tbody > tr:hover > td {
    background: #f8fbff !important;
  }

  .movement-cell {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    padding: 5px 9px;
    border-radius: 7px;
    font-size: 12px;
    font-weight: 700;
  }

  .movement-cell.in {
    background: #ecfdf3;
    color: #15803d;
  }

  .movement-cell.out {
    background: #fff1f0;
    color: #cf1322;
  }

  .movement-cell.neutral {
    background: #f1f5f9;
    color: #475569;
  }

  .change-value {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 58px;
    padding: 5px 8px;
    border-radius: 7px;
    font-size: 12px;
    font-weight: 750;
  }

  .change-value.positive {
    background: #ecfdf3;
    color: #15803d;
  }

  .change-value.negative {
    background: #fff1f0;
    color: #cf1322;
  }

  .quantity-value {
    color: #0f172a;
    font-size: 14px;
    font-weight: 750;
  }

  .order-code {
    padding: 4px 7px;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    background: #f8fafc;
    color: #475569;
    font-size: 12px;
  }

  .user-cell {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .user-avatar {
    background: #eef2ff !important;
    color: #4f46e5 !important;
    font-size: 11px;
    font-weight: 700;
  }

  .user-name {
    max-width: 135px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .message-cell {
    max-width: 250px;
  }

  /* ---------------------------------------------------------
     RESPONSIVE
  --------------------------------------------------------- */

  @media (max-width: 1100px) {
    .product-overview {
      grid-template-columns: 240px minmax(0, 1fr);
    }

    .stock-overview {
      grid-column: 1 / -1;
      border-left: 0;
      border-top: 1px solid #eef1f5;
      min-height: 170px;
    }

    .stock-value {
      font-size: 38px;
    }
  }

  @media (max-width: 768px) {
    .product-inventory-page {
      padding-top: 16px;
    }

    .inventory-header {
      flex-direction: column;
      gap: 8px;
    }

    .header-meta {
      justify-content: flex-start;
      padding-top: 0;
    }

    .product-overview {
      display: block;
    }

    .product-visual {
      min-height: 220px;
      border-right: 0;
      border-bottom: 1px solid #eef1f5;
    }

    .product-details {
      padding: 22px;
    }

    .stock-overview {
      border-top: 1px solid #eef1f5;
    }

    .detail-grid {
      grid-template-columns: 1fr;
    }

    .history-card .ant-card-extra {
      display: none;
    }
  }
`;

const actionMap = {
  "add-stock": {
    label: "Stock In",
    type: "in",
  },
  "remove-stock": {
    label: "Stock Out",
    type: "out",
  },
  sale: {
    label: "Sale",
    type: "out",
  },
  return: {
    label: "Return",
    type: "in",
  },
  adjustment: {
    label: "Adjustment",
    type: "neutral",
  },
  correction: {
    label: "Correction",
    type: "neutral",
  },
};

const formatDateTime = (date) => {
  if (!date || !dayjs(date).isValid()) return "—";
  return dayjs(date).format("DD MMM YYYY, hh:mm A");
};

const formatDate = (date) => {
  if (!date || !dayjs(date).isValid()) return "—";
  return dayjs(date).format("DD MMM YYYY");
};

const formatCurrency = (value) => Number(value || 0).toLocaleString("en-IN");

const getInitials = (name) => {
  if (!name || name === "System") return "SY";

  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
};

const ProductInventoryPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const {
    data: product,
    isLoading: productLoading,
    error: productError,
  } = useGetProductByIdQuery(id);

  const {
    data: historyResponse,
    isLoading: historyLoading,
    error: historyError,
  } = useGetHistoryByProductIdQuery(id);

  const { data: usersData } = useGetAllUsersQuery();

  const userMap = useMemo(() => {
    const map = {};

    usersData?.users?.forEach((user) => {
      map[user.userId] =
        user.name || user.username || user.email || "Unknown User";
    });

    return map;
  }, [usersData]);

  const dataSource = historyResponse?.history || [];

  const sellingPrice = Number(
    product?.metaDetails?.find((item) => item.slug === "sellingPrice")?.value ||
      0,
  );

  const currentStock = Number(product?.quantity || 0);
  const alertQuantity = Number(product?.alert_quantity || 0);
  const isLowStock = currentStock <= alertQuantity;

  const totalEvents = historyResponse?.total || dataSource.length;

  const latestMovement = dataSource?.[0]?.timestamp;

  const columns = [
    {
      title: "Date & Time",
      dataIndex: "timestamp",
      key: "timestamp",
      width: 190,
      sorter: (a, b) => new Date(a.timestamp) - new Date(b.timestamp),
      render: (date) => (
        <Space direction="vertical" size={1}>
          <Text strong style={{ color: "#334155" }}>
            {formatDate(date)}
          </Text>

          <Text
            type="secondary"
            style={{
              fontSize: 11,
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <ClockCircleOutlined />
            {date && dayjs(date).isValid()
              ? dayjs(date).format("hh:mm A")
              : "—"}
          </Text>
        </Space>
      ),
    },

    {
      title: "Movement",
      dataIndex: "action",
      key: "action",
      width: 145,
      render: (action) => {
        const config = actionMap[action] || {
          label: action || "Unknown",
          type: "neutral",
        };

        const icon =
          config.type === "in" ? (
            <ArrowDownOutlined />
          ) : config.type === "out" ? (
            <ArrowUpOutlined />
          ) : null;

        return (
          <span className={`movement-cell ${config.type}`}>
            {icon}
            {config.label}
          </span>
        );
      },
    },

    {
      title: "Stock Change",
      dataIndex: "change",
      key: "change",
      width: 135,
      align: "center",
      sorter: (a, b) => Number(a.change || 0) - Number(b.change || 0),
      render: (change) => {
        const value = Number(change || 0);

        return (
          <span
            className={`change-value ${value >= 0 ? "positive" : "negative"}`}
          >
            {value >= 0 ? "+" : ""}
            {value}
          </span>
        );
      },
    },

    {
      title: "Balance",
      dataIndex: "quantityAfter",
      key: "quantityAfter",
      width: 120,
      align: "center",
      sorter: (a, b) =>
        Number(a.quantityAfter || 0) - Number(b.quantityAfter || 0),
      render: (qty) => (
        <span className="quantity-value">{Number(qty || 0)}</span>
      ),
    },

    {
      title: "Order",
      dataIndex: "orderNo",
      key: "orderNo",
      width: 165,
      render: (orderNo) =>
        orderNo ? (
          <span className="order-code">{orderNo}</span>
        ) : (
          <Text type="secondary">—</Text>
        ),
    },

    {
      title: "Updated By",
      dataIndex: "userId",
      key: "userId",
      width: 190,
      render: (userId) => {
        const name = userId ? userMap[userId] || "Unknown User" : "System";

        return (
          <div className="user-cell">
            <Avatar size={28} className="user-avatar">
              {getInitials(name)}
            </Avatar>

            <Text className="user-name" title={name}>
              {name}
            </Text>
          </div>
        );
      },
    },

    {
      title: "Note",
      dataIndex: "message",
      key: "message",
      ellipsis: true,
      render: (message) =>
        message ? (
          <Text className="message-cell" ellipsis={{ tooltip: message }}>
            {message}
          </Text>
        ) : (
          <Text type="secondary">No note</Text>
        ),
    },
  ];

  if (productLoading || historyLoading) {
    return (
      <div className="page-wrapper">
        <div className="content">
          <style>{PAGE_CSS}</style>

          <div className="product-inventory-page">
            <Skeleton active paragraph={{ rows: 12 }} />
          </div>
        </div>
      </div>
    );
  }

  if (productError || historyError) {
    return (
      <div className="page-wrapper">
        <div className="content">
          <style>{PAGE_CSS}</style>

          <div className="product-inventory-page" style={{ paddingTop: 20 }}>
            <Alert
              type="error"
              showIcon
              message="Unable to load inventory"
              description="Please refresh the page or try again after checking the selected product."
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      <div className="content">
        <style>{PAGE_CSS}</style>

        <div className="product-inventory-page">
          {/* =====================================================
              HEADER
          ===================================================== */}

          <div className="inventory-header">
            <div className="inventory-header-left">
              <Button
                type="text"
                className="back-button"
                icon={<ArrowLeftOutlined />}
                onClick={() => navigate(-1)}
              >
                Back to Products
              </Button>

              <Title level={1} className="inventory-title">
                {product?.name || "Product Inventory"}
              </Title>
            </div>

            <div className="header-meta">
              <span className="product-code-tag">
                <BarcodeOutlined />
                {product?.product_code || "No Code"}
              </span>

              <span className="status-pill">
                <Badge
                  status={product?.status === "active" ? "success" : "error"}
                  text={
                    product?.status ? product.status.toUpperCase() : "UNKNOWN"
                  }
                />
              </span>

              {product?.isFeatured && (
                <Tag
                  color="gold"
                  style={{
                    height: 32,
                    display: "inline-flex",
                    alignItems: "center",
                    borderRadius: 8,
                    margin: 0,
                  }}
                >
                  Featured
                </Tag>
              )}
            </div>
          </div>

          {/* =====================================================
              PRODUCT OVERVIEW
          ===================================================== */}

          <Card bordered={false} className="overview-card">
            <div className="product-overview">
              {/* IMAGE */}

              <div className="product-visual">
                {product?.images?.[0] ? (
                  <Image
                    src={product.images[0]}
                    alt={product?.name || "Product"}
                    preview
                    className="product-image"
                  />
                ) : (
                  <div className="product-image-empty">
                    <Empty
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                      description="No product image"
                    />
                  </div>
                )}
              </div>

              {/* DETAILS */}

              <div className="product-details">
                <Title level={3} className="product-details-title">
                  {product?.name || "—"}
                </Title>

                <Text className="product-description">
                  {product?.description ||
                    "No product description has been added for this item."}
                </Text>

                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="detail-label">Product Code</span>

                    <span className="detail-value">
                      {product?.product_code || "—"}
                    </span>
                  </div>

                  <div className="detail-item">
                    <span className="detail-label">Selling Price</span>

                    <span className="detail-value">
                      ₹{formatCurrency(sellingPrice)}
                    </span>
                  </div>

                  <div className="detail-item">
                    <span className="detail-label">Created On</span>

                    <span className="detail-value">
                      <CalendarOutlined style={{ marginRight: 6 }} />
                      {formatDate(product?.createdAt)}
                    </span>
                  </div>

                  <div className="detail-item">
                    <span className="detail-label">Last Updated</span>

                    <span className="detail-value">
                      <CalendarOutlined style={{ marginRight: 6 }} />
                      {formatDate(product?.updatedAt)}
                    </span>
                  </div>
                </div>
              </div>

              {/* STOCK */}

              <div
                className={`stock-overview ${isLowStock ? "low-stock" : ""}`}
              >
                <div>
                  <div className="stock-label">
                    {isLowStock ? (
                      <WarningOutlined style={{ color: "#cf1322" }} />
                    ) : (
                      <InboxOutlined style={{ color: "#1677ff" }} />
                    )}
                    Current Stock
                  </div>

                  <div className="stock-value">{currentStock}</div>

                  <div className="stock-unit">units available</div>
                </div>

                <div className="stock-alert-line">
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Reorder alert at <Text strong>{alertQuantity}</Text> units
                  </Text>

                  <div className={`stock-status ${isLowStock ? "low" : ""}`}>
                    {isLowStock ? (
                      <>
                        <WarningOutlined />
                        Reorder recommended
                      </>
                    ) : (
                      <>
                        <InboxOutlined />
                        Stock level healthy
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* =====================================================
              METRICS
          ===================================================== */}

          <Row gutter={[14, 14]} className="metrics-grid">
            <Col xs={24} sm={12} lg={6}>
              <div className="metric">
                <div className="metric-top">
                  <span className="metric-label">Current Stock</span>

                  <span className="metric-icon">
                    <InboxOutlined />
                  </span>
                </div>

                <Statistic value={currentStock} />
              </div>
            </Col>

            <Col xs={24} sm={12} lg={6}>
              <div className="metric">
                <div className="metric-top">
                  <span className="metric-label">Alert Quantity</span>

                  <span className="metric-icon">
                    <WarningOutlined />
                  </span>
                </div>

                <Statistic value={alertQuantity} />
              </div>
            </Col>

            <Col xs={24} sm={12} lg={6}>
              <div className="metric">
                <div className="metric-top">
                  <span className="metric-label">Selling Price</span>

                  <span className="metric-icon">
                    <DollarOutlined />
                  </span>
                </div>

                <Statistic
                  prefix="₹"
                  value={sellingPrice}
                  formatter={(value) => formatCurrency(value)}
                />
              </div>
            </Col>

            <Col xs={24} sm={12} lg={6}>
              <div className="metric">
                <div className="metric-top">
                  <span className="metric-label">Inventory Events</span>

                  <span className="metric-icon">
                    <HistoryOutlined />
                  </span>
                </div>

                <Statistic value={totalEvents} />
              </div>
            </Col>
          </Row>

          {/* =====================================================
              MOVEMENT HISTORY
          ===================================================== */}

          <Card
            bordered={false}
            className="history-card"
            title={
              <div className="history-heading">
                <span className="history-heading-icon">
                  <HistoryOutlined />
                </span>

                <div>
                  <div className="history-title">
                    Inventory Movement History
                  </div>

                  <span className="history-subtitle">
                    Complete audit trail of stock changes
                  </span>
                </div>
              </div>
            }
            extra={
              latestMovement ? (
                <span className="latest-movement">
                  Latest movement:{" "}
                  <strong>{formatDateTime(latestMovement)}</strong>
                </span>
              ) : null
            }
          >
            <Table
              className="inventory-table"
              rowKey={(record, index) =>
                record.id || `${record.timestamp}-${record.action}-${index}`
              }
              columns={columns}
              dataSource={dataSource}
              bordered={false}
              size="middle"
              scroll={{ x: 1050 }}
              locale={{
                emptyText: (
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description="No inventory movements recorded"
                    style={{ padding: "36px 0" }}
                  />
                ),
              }}
              pagination={{
                pageSize: 25,
                showSizeChanger: true,
                pageSizeOptions: ["25", "50", "100"],
                showTotal: (total) =>
                  `${total} movement${total === 1 ? "" : "s"}`,
              }}
            />
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ProductInventoryPage;
