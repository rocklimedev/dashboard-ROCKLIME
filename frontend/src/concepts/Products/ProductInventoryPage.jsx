import React, { useMemo } from "react";
import {
  Card,
  Table,
  Typography,
  Tag,
  Spin,
  Alert,
  Button,
  Space,
  Row,
  Col,
  Image,
  Statistic,
} from "antd";
import { ArrowLeftOutlined, InboxOutlined } from "@ant-design/icons";
import { useNavigate, useParams } from "react-router-dom";
import dayjs from "dayjs";

import {
  useGetHistoryByProductIdQuery,
  useGetProductByIdQuery,
} from "../../api/productApi";

import { useGetAllUsersQuery } from "../../api/userApi";

const { Title, Text } = Typography;

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

  const sellingPrice =
    product?.metaDetails?.find((item) => item.slug === "sellingPrice")?.value ||
    0;

  const columns = [
    {
      title: "Date & Time",
      dataIndex: "timestamp",
      key: "timestamp",
      width: 180,
      sorter: (a, b) => new Date(a.timestamp) - new Date(b.timestamp),
      render: (date) => dayjs(date).format("DD MMM YYYY HH:mm"),
    },

    {
      title: "Action",
      dataIndex: "action",
      key: "action",
      width: 140,
      render: (action) => {
        const actionMap = {
          "add-stock": {
            color: "green",
            label: "Stock In",
          },
          "remove-stock": {
            color: "red",
            label: "Stock Out",
          },
          sale: {
            color: "volcano",
            label: "Sale",
          },
          return: {
            color: "blue",
            label: "Return",
          },
          adjustment: {
            color: "orange",
            label: "Adjustment",
          },
          correction: {
            color: "purple",
            label: "Correction",
          },
        };

        return (
          <Tag color={actionMap[action]?.color || "default"}>
            {actionMap[action]?.label || action}
          </Tag>
        );
      },
    },

    {
      title: "Stock Change",
      dataIndex: "change",
      key: "change",
      width: 120,
      align: "center",
      render: (change) => (
        <Tag color={change > 0 ? "success" : "error"}>
          {change > 0 ? `+${change}` : change}
        </Tag>
      ),
    },

    {
      title: "Quantity After",
      dataIndex: "quantityAfter",
      key: "quantityAfter",
      width: 130,
      align: "center",
      render: (qty) => <Text strong>{qty}</Text>,
    },

    {
      title: "Order No",
      dataIndex: "orderNo",
      key: "orderNo",
      width: 180,
      render: (orderNo) =>
        orderNo ? <Text code>{orderNo}</Text> : <Text type="secondary">—</Text>,
    },

    {
      title: "User",
      dataIndex: "userId",
      key: "userId",
      width: 180,
      render: (userId) =>
        userId ? userMap[userId] || "Unknown User" : "System",
    },

    {
      title: "Message",
      dataIndex: "message",
      key: "message",
      render: (msg) =>
        msg ? <Text>{msg}</Text> : <Text type="secondary">—</Text>,
    },
  ];

  if (productLoading || historyLoading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "60vh",
        }}
      >
        <Spin size="large" />
      </div>
    );
  }

  if (productError || historyError) {
    return (
      <Alert
        type="error"
        showIcon
        message="Failed to load inventory information"
      />
    );
  }

  return (
    <div className="page-wrapper">
      <div className="content">
        <Space
          style={{
            width: "100%",
            justifyContent: "space-between",
            marginBottom: 20,
          }}
        >
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
            Back
          </Button>

          <Title level={3} style={{ margin: 0 }}>
            Inventory History
          </Title>
        </Space>

        {/* Product Information */}
        <Card
          style={{
            marginBottom: 24,
            borderRadius: 12,
          }}
        >
          <Row gutter={[24, 24]} align="middle">
            <Col xs={24} md={5}>
              <div
                style={{
                  textAlign: "center",
                }}
              >
                <Image
                  src={product?.images?.[0]}
                  alt={product?.name}
                  width={180}
                  preview
                  style={{
                    objectFit: "contain",
                  }}
                />
              </div>
            </Col>

            <Col xs={24} md={19}>
              <Space direction="vertical" size={8} style={{ width: "100%" }}>
                <Title level={3} style={{ margin: 0 }}>
                  {product?.name}
                </Title>

                <Space wrap>
                  <Tag color="blue">{product?.product_code}</Tag>

                  <Tag color={product?.status === "active" ? "green" : "red"}>
                    {product?.status?.toUpperCase()}
                  </Tag>

                  {product?.isFeatured && <Tag color="gold">FEATURED</Tag>}
                </Space>

                <Text type="secondary">{product?.description}</Text>

                <Row gutter={24}>
                  <Col>
                    <Text>
                      <strong>Created:</strong>{" "}
                      {dayjs(product?.createdAt).format("DD MMM YYYY")}
                    </Text>
                  </Col>

                  <Col>
                    <Text>
                      <strong>Updated:</strong>{" "}
                      {dayjs(product?.updatedAt).format("DD MMM YYYY")}
                    </Text>
                  </Col>
                </Row>
              </Space>
            </Col>
          </Row>
        </Card>

        {/* Summary Cards */}
        <Row
          gutter={[16, 16]}
          style={{
            marginBottom: 24,
          }}
        >
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Current Stock"
                value={product?.quantity || 0}
                prefix={<InboxOutlined />}
                valueStyle={{
                  color:
                    product?.quantity <= product?.alert_quantity
                      ? "#cf1322"
                      : "#3f8600",
                }}
              />
            </Card>
          </Col>

          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Alert Quantity"
                value={product?.alert_quantity || 0}
              />
            </Card>
          </Col>

          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Selling Price"
                prefix="₹"
                value={sellingPrice}
              />
            </Card>
          </Col>

          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Inventory Events"
                value={historyResponse?.total || dataSource.length}
              />
            </Card>
          </Col>
        </Row>

        {/* Inventory History */}
        <Card title="Inventory Movement History">
          <Table
            rowKey="id"
            columns={columns}
            dataSource={dataSource}
            bordered
            size="middle"
            scroll={{ x: 1200 }}
            locale={{
              emptyText: "No inventory history found",
            }}
            pagination={{
              pageSize: 25,
              showSizeChanger: true,
              pageSizeOptions: ["25", "50", "100"],
              showTotal: (total) => `Total ${total} records`,
            }}
          />
        </Card>
      </div>
    </div>
  );
};

export default ProductInventoryPage;
