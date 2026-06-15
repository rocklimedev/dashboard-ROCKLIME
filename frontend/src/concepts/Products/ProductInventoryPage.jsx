import React, { useMemo } from "react";
import {
  Alert,
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
  ArrowLeftOutlined,
  BarcodeOutlined,
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
    background: #f6f8fb;
    padding-bottom: 40px;
  }

  .product-inventory-page .soft-card {
    border: 1px solid #eef1f5;
    border-radius: 20px;
    box-shadow: 0 12px 30px rgba(15, 23, 42, 0.045);
  }

  .product-inventory-page .hero-card {
    overflow: hidden;
    background: linear-gradient(135deg, #ffffff 0%, #f4f7ff 58%, #eef5ff 100%);
  }

  .product-inventory-page .hero-card::before {
    content: "";
    position: absolute;
    inset: 0;
    pointer-events: none;
    background: radial-gradient(circle at top right, rgba(22, 119, 255, 0.14), transparent 34%);
  }

  .product-inventory-page .product-image-shell {
    width: 100%;
    min-height: 210px;
    border-radius: 18px;
    border: 1px solid #edf0f4;
    background: #f8fafc;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 18px;
  }

  .product-inventory-page .metric-card {
    height: 100%;
    border-radius: 18px;
    border: 1px solid #edf0f4;
    box-shadow: 0 8px 22px rgba(15, 23, 42, 0.035);
  }

  .product-inventory-page .metric-icon {
    width: 36px;
    height: 36px;
    border-radius: 12px;
    background: #f0f5ff;
    color: #1677ff;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 12px;
  }

  .product-inventory-page .stock-panel {
    height: 100%;
    border-radius: 18px;
    padding: 18px;
    background: #f8fafc;
    border: 1px solid #edf0f4;
  }

  .product-inventory-page .stock-panel.low-stock {
    background: #fff7f6;
    border-color: #ffd8d2;
  }

  .product-inventory-page .info-tile {
    padding: 14px 16px;
    border-radius: 14px;
    background: #f8fafc;
    border: 1px solid #edf0f4;
    height: 100%;
  }

  .product-inventory-page .inventory-table .ant-table {
    border-radius: 14px;
    overflow: hidden;
  }

  .product-inventory-page .inventory-table .ant-table-thead > tr > th {
    background: #f8fafc;
    color: #475569;
    font-weight: 700;
  }

  .product-inventory-page .inventory-table .ant-table-tbody > tr > td {
    border-bottom: 1px solid #f1f5f9;
  }

  .product-inventory-page .inventory-table .ant-table-tbody > tr:hover > td {
    background: #f8fbff;
  }
`;

const actionMap = {
  "add-stock": {
    color: "success",
    label: "Stock In",
  },
  "remove-stock": {
    color: "error",
    label: "Stock Out",
  },
  sale: {
    color: "volcano",
    label: "Sale",
  },
  return: {
    color: "processing",
    label: "Return",
  },
  adjustment: {
    color: "warning",
    label: "Adjustment",
  },
  correction: {
    color: "purple",
    label: "Correction",
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
      width: 210,
      sorter: (a, b) => new Date(a.timestamp) - new Date(b.timestamp),
      render: (date) => (
        <Space direction="vertical" size={0}>
          <Text strong>{formatDate(date)}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            <ClockCircleOutlined />{" "}
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
      width: 150,
      render: (action) => {
        const config = actionMap[action] || {
          color: "default",
          label: action || "Unknown",
        };

        return (
          <Tag
            color={config.color}
            style={{ borderRadius: 999, padding: "2px 10px" }}
          >
            {config.label}
          </Tag>
        );
      },
    },
    {
      title: "Stock Change",
      dataIndex: "change",
      key: "change",
      width: 140,
      align: "center",
      sorter: (a, b) => Number(a.change || 0) - Number(b.change || 0),
      render: (change) => {
        const value = Number(change || 0);
        return (
          <Tag
            color={value >= 0 ? "success" : "error"}
            style={{ minWidth: 64, textAlign: "center", borderRadius: 999 }}
          >
            {value > 0 ? `+${value}` : value}
          </Tag>
        );
      },
    },
    {
      title: "Qty After",
      dataIndex: "quantityAfter",
      key: "quantityAfter",
      width: 130,
      align: "center",
      sorter: (a, b) =>
        Number(a.quantityAfter || 0) - Number(b.quantityAfter || 0),
      render: (qty) => <Text strong>{Number(qty || 0)}</Text>,
    },
    {
      title: "Order No",
      dataIndex: "orderNo",
      key: "orderNo",
      width: 180,
      render: (orderNo) =>
        orderNo ? (
          <Text code style={{ whiteSpace: "nowrap" }}>
            {orderNo}
          </Text>
        ) : (
          <Text type="secondary">—</Text>
        ),
    },
    {
      title: "Updated By",
      dataIndex: "userId",
      key: "userId",
      width: 190,
      render: (userId) => (
        <Space>
          <UserOutlined style={{ color: "#64748b" }} />
          <Text>{userId ? userMap[userId] || "Unknown User" : "System"}</Text>
        </Space>
      ),
    },
    {
      title: "Message",
      dataIndex: "message",
      key: "message",
      ellipsis: true,
      render: (msg) =>
        msg ? <Text>{msg}</Text> : <Text type="secondary">No note added</Text>,
    },
  ];

  if (productLoading || historyLoading) {
    return (
      <div className="page-wrapper">
        <div className="content">
          <style>{PAGE_CSS}</style>
          <div className="product-inventory-page">
            <Card bordered={false} className="soft-card">
              <Skeleton active paragraph={{ rows: 10 }} />
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (productError || historyError) {
    return (
      <div className="page-wrapper">
        <div className="content">
          <Alert
            type="error"
            showIcon
            message="Failed to load inventory information"
            description="Please refresh the page or try again after checking the selected product."
          />
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      <div className="content">
        <style>{PAGE_CSS}</style>

        <div className="product-inventory-page">
          <Space direction="vertical" size={20} style={{ width: "100%" }}>
            <Card
              bordered={false}
              className="soft-card hero-card"
              style={{ position: "relative" }}
            >
              <Row gutter={[20, 20]} align="middle" justify="space-between">
                <Col xs={24} lg={16}>
                  <Space direction="vertical" size={10}>
                    <Button
                      type="text"
                      icon={<ArrowLeftOutlined />}
                      onClick={() => navigate(-1)}
                      style={{ paddingLeft: 0, fontWeight: 600 }}
                    >
                      Back to Products
                    </Button>

                    <div>
                      <Text type="secondary" style={{ fontWeight: 600 }}>
                        Inventory Management
                      </Text>
                      <Title level={2} style={{ margin: "4px 0 0" }}>
                        {product?.name || "Product Inventory"}
                      </Title>
                      <Text type="secondary">
                        Track stock movement, product health, user activity, and
                        order-linked updates.
                      </Text>
                    </div>
                  </Space>
                </Col>

                <Col xs={24} lg={8} style={{ textAlign: "right" }}>
                  <Space wrap style={{ justifyContent: "flex-end" }}>
                    <Tag
                      icon={<BarcodeOutlined />}
                      color="blue"
                      style={{ borderRadius: 999 }}
                    >
                      {product?.product_code || "No Code"}
                    </Tag>

                    <Badge
                      status={
                        product?.status === "active" ? "success" : "error"
                      }
                      text={
                        product?.status
                          ? product.status.toUpperCase()
                          : "UNKNOWN"
                      }
                    />

                    {product?.isFeatured && (
                      <Tag color="gold" style={{ borderRadius: 999 }}>
                        Featured
                      </Tag>
                    )}
                  </Space>
                </Col>
              </Row>
            </Card>

            <Card bordered={false} className="soft-card">
              <Row gutter={[24, 24]} align="stretch">
                <Col xs={24} md={8} lg={6}>
                  <div className="product-image-shell">
                    {product?.images?.[0] ? (
                      <Image
                        src={product.images[0]}
                        alt={product?.name || "Product"}
                        width="100%"
                        preview
                        style={{ maxHeight: 190, objectFit: "contain" }}
                      />
                    ) : (
                      <Empty
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        description="No image"
                      />
                    )}
                  </div>
                </Col>

                <Col xs={24} md={16} lg={12}>
                  <Space
                    direction="vertical"
                    size={16}
                    style={{ width: "100%" }}
                  >
                    <div>
                      <Title level={3} style={{ marginBottom: 6 }}>
                        {product?.name || "—"}
                      </Title>
                      <Text type="secondary">
                        {product?.description ||
                          "No product description added."}
                      </Text>
                    </div>

                    <Row gutter={[12, 12]}>
                      <Col xs={24} sm={12}>
                        <div className="info-tile">
                          <Text type="secondary">Created On</Text>
                          <div>
                            <Text strong>{formatDate(product?.createdAt)}</Text>
                          </div>
                        </div>
                      </Col>

                      <Col xs={24} sm={12}>
                        <div className="info-tile">
                          <Text type="secondary">Last Updated</Text>
                          <div>
                            <Text strong>{formatDate(product?.updatedAt)}</Text>
                          </div>
                        </div>
                      </Col>
                    </Row>
                  </Space>
                </Col>

                <Col xs={24} lg={6}>
                  <div
                    className={`stock-panel ${isLowStock ? "low-stock" : ""}`}
                  >
                    <Space
                      direction="vertical"
                      size={10}
                      style={{ width: "100%" }}
                    >
                      <Space>
                        {isLowStock ? (
                          <WarningOutlined style={{ color: "#cf1322" }} />
                        ) : (
                          <InboxOutlined style={{ color: "#1677ff" }} />
                        )}
                        <Text strong>
                          {isLowStock ? "Low Stock Alert" : "Stock Healthy"}
                        </Text>
                      </Space>

                      <Title level={2} style={{ margin: 0 }}>
                        {currentStock}
                      </Title>

                      <Text type="secondary">
                        Alert level is set at{" "}
                        <Text strong>{alertQuantity}</Text> units.
                      </Text>

                      {isLowStock && (
                        <Alert
                          type="warning"
                          showIcon
                          message="Reorder recommended"
                          style={{ borderRadius: 12, marginTop: 8 }}
                        />
                      )}
                    </Space>
                  </div>
                </Col>
              </Row>
            </Card>

            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12} lg={6}>
                <Card bordered={false} className="metric-card">
                  <span className="metric-icon">
                    <InboxOutlined />
                  </span>
                  <Statistic title="Current Stock" value={currentStock} />
                </Card>
              </Col>

              <Col xs={24} sm={12} lg={6}>
                <Card bordered={false} className="metric-card">
                  <span className="metric-icon">
                    <WarningOutlined />
                  </span>
                  <Statistic title="Alert Quantity" value={alertQuantity} />
                </Card>
              </Col>

              <Col xs={24} sm={12} lg={6}>
                <Card bordered={false} className="metric-card">
                  <span className="metric-icon">
                    <DollarOutlined />
                  </span>
                  <Statistic
                    title="Selling Price"
                    prefix="₹"
                    value={sellingPrice}
                    formatter={(value) => formatCurrency(value)}
                  />
                </Card>
              </Col>

              <Col xs={24} sm={12} lg={6}>
                <Card bordered={false} className="metric-card">
                  <span className="metric-icon">
                    <HistoryOutlined />
                  </span>
                  <Statistic title="Inventory Events" value={totalEvents} />
                </Card>
              </Col>
            </Row>

            <Card
              bordered={false}
              className="soft-card"
              title={
                <Space>
                  <ShoppingOutlined />
                  <span>Inventory Movement History</span>
                </Space>
              }
              extra={
                latestMovement ? (
                  <Text type="secondary">
                    Latest: {formatDateTime(latestMovement)}
                  </Text>
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
                scroll={{ x: 1200 }}
                locale={{
                  emptyText: (
                    <Empty
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                      description="No inventory history found"
                    />
                  ),
                }}
                pagination={{
                  pageSize: 25,
                  showSizeChanger: true,
                  pageSizeOptions: ["25", "50", "100"],
                  showTotal: (total) => `Total ${total} records`,
                }}
              />
            </Card>
          </Space>
        </div>
      </div>
    </div>
  );
};

export default ProductInventoryPage;
