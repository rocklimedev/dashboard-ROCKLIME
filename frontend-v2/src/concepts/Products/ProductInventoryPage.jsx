import './ProductInventoryPage.styles.css';
import React, { useMemo } from 'react';
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
} from 'antd';
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
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import dayjs from 'dayjs';

import { useGetHistoryByProductIdQuery, useGetProductByIdQuery } from '../../api/productApi';

import { useGetAllUsersQuery } from '../../api/userApi';

const { Title, Text } = Typography;

const actionMap = {
  'add-stock': {
    label: 'Stock In',
    type: 'in',
  },
  'remove-stock': {
    label: 'Stock Out',
    type: 'out',
  },
  sale: {
    label: 'Sale',
    type: 'out',
  },
  return: {
    label: 'Return',
    type: 'in',
  },
  adjustment: {
    label: 'Adjustment',
    type: 'neutral',
  },
  correction: {
    label: 'Correction',
    type: 'neutral',
  },
};

const formatDateTime = (date) => {
  if (!date || !dayjs(date).isValid()) return '—';
  return dayjs(date).format('DD MMM YYYY, hh:mm A');
};

const formatDate = (date) => {
  if (!date || !dayjs(date).isValid()) return '—';
  return dayjs(date).format('DD MMM YYYY');
};

const formatCurrency = (value) => Number(value || 0).toLocaleString('en-IN');

const getInitials = (name) => {
  if (!name || name === 'System') return 'SY';

  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
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
      map[user.userId] = user.name || user.username || user.email || 'Unknown User';
    });

    return map;
  }, [usersData]);

  const dataSource = historyResponse?.history || [];

  const sellingPrice = Number(
    product?.metaDetails?.find((item) => item.slug === 'sellingPrice')?.value || 0,
  );

  const currentStock = Number(product?.quantity || 0);
  const alertQuantity = Number(product?.alert_quantity || 0);
  const isLowStock = currentStock <= alertQuantity;

  const totalEvents = historyResponse?.total || dataSource.length;

  const latestMovement = dataSource?.[0]?.timestamp;

  const columns = [
    {
      title: 'Date & Time',
      dataIndex: 'timestamp',
      key: 'timestamp',
      width: 190,
      sorter: (a, b) => new Date(a.timestamp) - new Date(b.timestamp),
      render: (date) => (
        <Space direction="vertical" size={1}>
          <Text className="fv2-productinventorypage-9c473fb33e" strong>
            {formatDate(date)}
          </Text>

          <Text className="fv2-productinventorypage-78c2544b46" type="secondary">
            <ClockCircleOutlined />
            {date && dayjs(date).isValid() ? dayjs(date).format('hh:mm A') : '—'}
          </Text>
        </Space>
      ),
    },

    {
      title: 'Movement',
      dataIndex: 'action',
      key: 'action',
      width: 145,
      render: (action) => {
        const config = actionMap[action] || {
          label: action || 'Unknown',
          type: 'neutral',
        };

        const icon =
          config.type === 'in' ? (
            <ArrowDownOutlined />
          ) : config.type === 'out' ? (
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
      title: 'Stock Change',
      dataIndex: 'change',
      key: 'change',
      width: 135,
      align: 'center',
      sorter: (a, b) => Number(a.change || 0) - Number(b.change || 0),
      render: (change) => {
        const value = Number(change || 0);

        return (
          <span className={`change-value ${value >= 0 ? 'positive' : 'negative'}`}>
            {value >= 0 ? '+' : ''}
            {value}
          </span>
        );
      },
    },

    {
      title: 'Balance',
      dataIndex: 'quantityAfter',
      key: 'quantityAfter',
      width: 120,
      align: 'center',
      sorter: (a, b) => Number(a.quantityAfter || 0) - Number(b.quantityAfter || 0),
      render: (qty) => <span className="quantity-value">{Number(qty || 0)}</span>,
    },

    {
      title: 'Order',
      dataIndex: 'orderNo',
      key: 'orderNo',
      width: 165,
      render: (orderNo) =>
        orderNo ? <span className="order-code">{orderNo}</span> : <Text type="secondary">—</Text>,
    },

    {
      title: 'Updated By',
      dataIndex: 'userId',
      key: 'userId',
      width: 190,
      render: (userId) => {
        const name = userId ? userMap[userId] || 'Unknown User' : 'System';

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
      title: 'Note',
      dataIndex: 'message',
      key: 'message',
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
          <div className="product-inventory-page fv2-productinventorypage-820db72459">
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
                {product?.name || 'Product Inventory'}
              </Title>
            </div>

            <div className="header-meta">
              <Button onClick={() => navigate(`/inventory/${encodeURIComponent(id)}/references`)}>
                References
              </Button>
              <span className="product-code-tag">
                <BarcodeOutlined />
                {product?.product_code || 'No Code'}
              </span>

              <span className="status-pill">
                <Badge
                  status={product?.status === 'active' ? 'success' : 'error'}
                  text={product?.status ? product.status.toUpperCase() : 'UNKNOWN'}
                />
              </span>

              {product?.isFeatured && (
                <Tag className="fv2-productinventorypage-6ae1d79a8f" color="gold">
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
                    alt={product?.name || 'Product'}
                    preview
                    className="product-image"
                  />
                ) : (
                  <div className="product-image-empty">
                    <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No product image" />
                  </div>
                )}
              </div>

              {/* DETAILS */}

              <div className="product-details">
                <Title level={3} className="product-details-title">
                  {product?.name || '—'}
                </Title>

                <Text className="product-description">
                  {product?.description || 'No product description has been added for this item.'}
                </Text>

                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="detail-label">Product Code</span>

                    <span className="detail-value">{product?.product_code || '—'}</span>
                  </div>

                  <div className="detail-item">
                    <span className="detail-label">Selling Price</span>

                    <span className="detail-value">₹{formatCurrency(sellingPrice)}</span>
                  </div>

                  <div className="detail-item">
                    <span className="detail-label">Created On</span>

                    <span className="detail-value">
                      <CalendarOutlined className="fv2-productinventorypage-9566ed26c9" />
                      {formatDate(product?.createdAt)}
                    </span>
                  </div>

                  <div className="detail-item">
                    <span className="detail-label">Last Updated</span>

                    <span className="detail-value">
                      <CalendarOutlined className="fv2-productinventorypage-9566ed26c9" />
                      {formatDate(product?.updatedAt)}
                    </span>
                  </div>
                </div>
              </div>

              {/* STOCK */}

              <div className={`stock-overview ${isLowStock ? 'low-stock' : ''}`}>
                <div>
                  <div className="stock-label">
                    {isLowStock ? (
                      <WarningOutlined className="fv2-productinventorypage-ff3270399f" />
                    ) : (
                      <InboxOutlined className="fv2-productinventorypage-679d1d342b" />
                    )}
                    Current Stock
                  </div>

                  <div className="stock-value">{currentStock}</div>

                  <div className="stock-unit">units available</div>
                </div>

                <div className="stock-alert-line">
                  <Text className="fv2-productinventorypage-1edec17a8e" type="secondary">
                    Reorder alert at <Text strong>{alertQuantity}</Text> units
                  </Text>

                  <div className={`stock-status ${isLowStock ? 'low' : ''}`}>
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
                  <div className="history-title">Inventory Movement History</div>

                  <span className="history-subtitle">Complete audit trail of stock changes</span>
                </div>
              </div>
            }
            extra={
              latestMovement ? (
                <span className="latest-movement">
                  Latest movement: <strong>{formatDateTime(latestMovement)}</strong>
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
                    className="fv2-productinventorypage-f1b92c0e7e"
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description="No inventory movements recorded"
                  />
                ),
              }}
              pagination={{
                pageSize: 25,
                showSizeChanger: true,
                pageSizeOptions: ['25', '50', '100'],
                showTotal: (total) => `${total} movement${total === 1 ? '' : 's'}`,
              }}
            />
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ProductInventoryPage;
