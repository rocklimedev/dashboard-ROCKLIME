import React, { useState, useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  useGetCustomerByIdQuery,
  useGetInvoicesByCustomerIdQuery,
} from "../../api/customerApi";
import { useGetAllUsersQuery } from "../../api/userApi";
import {
  useGetAllAddressesQuery,
  useCreateAddressMutation,
  useUpdateAddressMutation,
  useDeleteAddressMutation,
} from "../../api/addressApi";
import { useGetAllQuotationsQuery } from "../../api/quotationApi";
import { useGetAllOrdersQuery } from "../../api/orderApi";

import {
  PhoneOutlined,
  MailOutlined,
  EnvironmentOutlined,
  ShopOutlined,
  CalendarOutlined,
  FileTextOutlined,
  ShoppingCartOutlined,
  HomeOutlined,
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  UserOutlined,
  EyeOutlined,
} from "@ant-design/icons";

import {
  Card,
  Table,
  Tag,
  Space,
  Typography,
  Avatar,
  Button,
  Modal,
  Form,
  Input,
  message,
  Tabs,
  Statistic,
  Row,
  Col,
  Timeline,
  Empty,
  Divider,
} from "antd";
import { Helmet } from "react-helmet";
import moment from "moment";

import "./customerdetails.css";

const { Title, Text } = Typography;

const CustomerDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);

  // ── Data ───────────────────────────────────────────────
  const { data: customerData } = useGetCustomerByIdQuery(id);
  const customer = customerData?.data || {};

  const { data: invoicesData } = useGetInvoicesByCustomerIdQuery(
    customer?.customerId,
    {
      skip: !customer?.customerId,
    },
  );

  const { data: usersData } = useGetAllUsersQuery();
  const users = usersData?.users || [];

  const { data: addressesData, refetch: refetchAddresses } =
    useGetAllAddressesQuery(
      { customerId: customer?.customerId },
      { skip: !customer?.customerId },
    );

  const { data: quotationsData } = useGetAllQuotationsQuery(
    { customerId: customer?.customerId },
    { skip: !customer?.customerId },
  );

  const { data: ordersData } = useGetAllOrdersQuery();

  const [createAddress] = useCreateAddressMutation();
  const [updateAddress] = useUpdateAddressMutation();
  const [deleteAddress] = useDeleteAddressMutation();

  const addresses = useMemo(
    () =>
      (addressesData || []).filter((a) => a.customerId === customer.customerId),
    [addressesData, customer.customerId],
  );

  const quotations = quotationsData?.data || [];
  const orders = (ordersData?.orders || []).filter(
    (o) => o.createdFor === customer.customerId,
  );
  const invoices = invoicesData?.data || [];

  const totalQuoted = quotations.reduce(
    (sum, q) => sum + Number(q.finalAmount || 0),
    0,
  );
  const totalInvoiced = invoices.reduce(
    (sum, i) => sum + Number(i.finalAmount || 0),
    0,
  );
  const totalPaid = invoices.reduce(
    (sum, i) => sum + Number(i.paidAmount || 0),
    0,
  );
  const balanceDue = totalInvoiced - totalPaid;

  const primaryAddress =
    addresses.find((a) => a.status === "PRIMARY") || addresses[0];

  const formatDate = (date) =>
    date ? moment(date).format("DD MMM YYYY") : "—";
  const formatCurrency = (amt) =>
    `₹${Number(amt || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;

  const getUsername = (userId) => {
    const user = users.find((u) => u.userId === userId);
    return user ? user.name || user.email.split("@")[0] : "System";
  };

  const getInitials = (name) =>
    name
      ? name
          .split(" ")
          .map((n) => n[0])
          .join("")
          .toUpperCase()
          .slice(0, 2)
      : "CU";

  // ── Handlers ──────────────────────────────────────────
  const handleEditCustomer = () => {
    navigate(`/customer/edit/${customer.customerId}`, { state: { customer } });
  };

  const openAddressModal = (addr) => {
    setEditingAddress(addr);
    if (addr) form.setFieldsValue(addr);
    else form.resetFields();
    setIsModalOpen(true);
  };

  const handleAddressSave = async (values) => {
    try {
      if (editingAddress) {
        await updateAddress({
          addressId: editingAddress.addressId,
          updatedData: { ...values, customerId: customer.customerId },
        }).unwrap();
        message.success("Address updated");
      } else {
        await createAddress({
          ...values,
          customerId: customer.customerId,
          status: addresses.length === 0 ? "PRIMARY" : "ADDITIONAL",
        }).unwrap();
        message.success("Address added");
      }
      setIsModalOpen(false);
      refetchAddresses();
    } catch (err) {
      message.error(err?.data?.message || "Failed to save address");
    }
  };

  const handleDeleteAddress = (addressId) => {
    Modal.confirm({
      title: "Delete Address",
      content: "This action cannot be undone.",
      okText: "Delete",
      okType: "danger",
      onOk: async () => {
        try {
          await deleteAddress(addressId).unwrap();
          message.success("Address deleted");
          refetchAddresses();
        } catch {
          message.error("Delete failed");
        }
      },
    });
  };

  // ── Tabs Content ──────────────────────────────────────
  const tabItems = [
    {
      key: "overview",
      label: "Overview",
      children: (
        <Card className="section-card">
          <Title level={5} style={{ marginBottom: 20 }}>
            Recent Activity
          </Title>
          <Timeline mode="left">
            {quotations.slice(0, 5).map((q) => (
              <Timeline.Item
                key={q.quotationId}
                dot={<FileTextOutlined />}
                color="blue"
              >
                <div className="timeline-item">
                  <strong>Quotation Created</strong>
                  <div className="text-secondary">
                    {q.document_title || "Quotation"} •{" "}
                    {formatCurrency(q.finalAmount)}
                  </div>
                  <div className="text-tiny text-muted">
                    {formatDate(q.quotation_date)}
                  </div>
                </div>
              </Timeline.Item>
            ))}
            {orders.slice(0, 4).map((o) => (
              <Timeline.Item
                key={o.id}
                dot={<ShoppingCartOutlined />}
                color="green"
              >
                <div className="timeline-item">
                  <strong>Order Placed</strong>
                  <div className="text-secondary">
                    {o.orderNo} • <Tag>{o.status}</Tag>
                  </div>
                  <div className="text-tiny text-muted">
                    {formatDate(o.createdAt)}
                  </div>
                </div>
              </Timeline.Item>
            ))}
            {quotations.length === 0 && orders.length === 0 && (
              <div
                style={{
                  textAlign: "center",
                  padding: "40px 0",
                  color: "#aaa",
                }}
              >
                No activity recorded yet
              </div>
            )}
          </Timeline>
        </Card>
      ),
    },
    {
      key: "quotations",
      label: `Quotations (${quotations.length})`,
      children:
        quotations.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="No quotations yet"
          />
        ) : (
          <Table
            dataSource={quotations}
            rowKey="quotationId"
            pagination={{ pageSize: 10, size: "small" }}
            columns={[
              {
                title: "Ref No",
                dataIndex: "reference_number",
                render: (text, record) => (
                  <Link
                    to={`/quotation/${record.quotationId}`}
                    className="table-link"
                  >
                    {text || "—"}
                  </Link>
                ),
              },
              { title: "Title", dataIndex: "document_title", ellipsis: true },
              {
                title: "Amount",
                dataIndex: "finalAmount",
                align: "right",
                render: (v) => <strong>{formatCurrency(v)}</strong>,
              },
              {
                title: "Date",
                dataIndex: "quotation_date",
                render: formatDate,
                width: 120,
              },
              {
                title: "",
                width: 60,
                render: (_, r) => (
                  <Button
                    type="text"
                    icon={<EyeOutlined />}
                    href={`/quotation/${r.quotationId}`}
                  />
                ),
              },
            ]}
          />
        ),
    },
    {
      key: "orders",
      label: `Orders (${orders.length})`,
      children:
        orders.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="No orders yet"
          />
        ) : (
          <Table
            dataSource={orders}
            rowKey="id"
            pagination={{ pageSize: 10, size: "small" }}
            columns={[
              {
                title: "Order No",
                dataIndex: "orderNo",
                render: (t) => <strong>{t}</strong>,
              },
              {
                title: "Status",
                dataIndex: "status",
                render: (s) => (
                  <Tag
                    color={
                      s === "DELIVERED"
                        ? "success"
                        : s === "CANCELED"
                          ? "error"
                          : s === "ONHOLD"
                            ? "warning"
                            : "processing"
                    }
                  >
                    {s}
                  </Tag>
                ),
                width: 140,
              },
              {
                title: "Date",
                dataIndex: "createdAt",
                render: formatDate,
                width: 120,
              },
              {
                title: "Due",
                dataIndex: "dueDate",
                render: formatDate,
                width: 120,
              },
              {
                title: "",
                width: 60,
                render: (_, r) => (
                  <Button
                    type="text"
                    icon={<EyeOutlined />}
                    href={`/order/${r.id}`}
                  />
                ),
              },
            ]}
          />
        ),
    },
    {
      key: "addresses",
      label: `Addresses (${addresses.length})`,
      children: (
        <>
          <div style={{ marginBottom: 20, textAlign: "right" }}>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => openAddressModal()}
            >
              Add Address
            </Button>
          </div>

          {addresses.length === 0 ? (
            <Empty description="No addresses added yet" />
          ) : (
            <Row gutter={[16, 16]}>
              {addresses.map((addr) => (
                <Col xs={24} sm={12} lg={8} key={addr.addressId}>
                  <Card
                    hoverable
                    className="address-card"
                    actions={[
                      <EditOutlined
                        key="edit"
                        onClick={() => openAddressModal(addr)}
                      />,
                      <DeleteOutlined
                        key="delete"
                        onClick={() => handleDeleteAddress(addr.addressId)}
                      />,
                    ]}
                  >
                    <Card.Meta
                      avatar={
                        <EnvironmentOutlined
                          style={{ fontSize: 24, color: "#1890ff" }}
                        />
                      }
                      title={
                        <Space>
                          {addr.status === "PRIMARY" ? (
                            <Tag color="gold">Primary</Tag>
                          ) : (
                            <Tag color="default">Additional</Tag>
                          )}
                        </Space>
                      }
                      description={
                        <div className="address-text">
                          {addr.street}
                          <br />
                          {addr.city}, {addr.state}{" "}
                          {addr.postalCode && `(${addr.postalCode})`}
                          <br />
                          {addr.country || "India"}
                        </div>
                      }
                    />
                  </Card>
                </Col>
              ))}
            </Row>
          )}
        </>
      ),
    },
  ];

  return (
    <div className="page-wrapper">
      <div className="content">
  <div className="customer-details-modern">
      <Helmet>
        <title>{customer.name || "Customer Details"} | CRM</title>
      </Helmet>

      {/* Header */}
      <div className="page-header">
        <div className="header-content">
          <Avatar size={64} style={{ backgroundColor: "#1890ff" }}>
            {getInitials(customer.name)}
          </Avatar>
          <div className="header-info">
            <Title level={3} style={{ margin: 0 }}>
              {customer.name || "—"}
            </Title>
            <Space>
              <Tag
                icon={customer.isVendor ? <ShopOutlined /> : <UserOutlined />}
              >
                {customer.isVendor ? "Vendor" : "Customer"}
              </Tag>
              {!customer.isActive && <Tag color="red">Inactive</Tag>}
            </Space>
          </div>
        </div>
        <Button
          type="primary"
          icon={<EditOutlined />}
          onClick={handleEditCustomer}
        >
          Edit Customer
        </Button>
      </div>

      {/* Stats */}
      <Row gutter={[16, 16]} className="stats-row">
        <Col xs={12} sm={6}>
          <Card className="stat-card">
            <Statistic
              title="Total Quoted"
              value={totalQuoted}
              prefix="₹"
              precision={2}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card className="stat-card">
            <Statistic
              title="Invoiced"
              value={totalInvoiced}
              prefix="₹"
              precision={2}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card className="stat-card">
            <Statistic
              title="Paid"
              value={totalPaid}
              prefix="₹"
              precision={2}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card className="stat-card">
            <Statistic
              title="Balance Due"
              value={balanceDue}
              prefix="₹"
              precision={2}
              valueStyle={{ color: balanceDue > 0 ? "#cf1322" : "#52c41a" }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={24}>
        {/* Left – Customer Info */}
        <Col xs={24} lg={7} xl={6}>
          <Space direction="vertical" size={24} style={{ width: "100%" }}>
            <Card className="info-card">
              <div className="customer-meta">
                <div>
                  <Text type="secondary">
                    <PhoneOutlined /> Phone
                  </Text>
                  <div className="value">{customer.mobileNumber || "—"}</div>
                </div>
                <div>
                  <Text type="secondary">
                    <MailOutlined /> Email
                  </Text>
                  <div className="value">
                    <a href={`mailto:${customer.email}`}>
                      {customer.email || "—"}
                    </a>
                  </div>
                </div>
                <div>
                  <Text type="secondary">
                    <ShopOutlined /> Company
                  </Text>
                  <div className="value">{customer.companyName || "—"}</div>
                </div>
                <div>
                  <Text type="secondary">
                    <CalendarOutlined /> Since
                  </Text>
                  <div className="value">{formatDate(customer.createdAt)}</div>
                </div>
              </div>
            </Card>

            {primaryAddress && (
              <Card title="Primary Address" className="info-card">
                <div className="address-block">
                  <EnvironmentOutlined
                    style={{ marginRight: 8, color: "#1890ff" }}
                  />
                  <div>
                    {primaryAddress.street}
                    <br />
                    {primaryAddress.city}, {primaryAddress.state}{" "}
                    {primaryAddress.postalCode && primaryAddress.postalCode}
                    <br />
                    {primaryAddress.country || "India"}
                  </div>
                </div>
              </Card>
            )}
          </Space>
        </Col>

        {/* Right – Tabs */}
        <Col xs={24} lg={17} xl={18}>
          <Card className="tabs-card">
            <Tabs
              defaultActiveKey="overview"
              items={tabItems}
              size="large"
              tabBarStyle={{ padding: "0 16px" }}
            />
          </Card>
        </Col>
      </Row>

      {/* Address Modal */}
      <Modal
        title={editingAddress ? "Edit Address" : "Add New Address"}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        width={640}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleAddressSave}>
          <Form.Item
            name="street"
            label="Street Address"
            rules={[{ required: true }]}
          >
            <Input.TextArea
              rows={3}
              placeholder="House no, street, landmark..."
            />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="city" label="City" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="state"
                label="State"
                rules={[{ required: true }]}
              >
                <Input />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="postalCode" label="PIN Code">
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="country" label="Country" initialValue="India">
                <Input disabled />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item style={{ marginTop: 24, textAlign: "right" }}>
            <Button
              onClick={() => setIsModalOpen(false)}
              style={{ marginRight: 12 }}
            >
              Cancel
            </Button>
            <Button type="primary" htmlType="submit">
              {editingAddress ? "Update Address" : "Add Address"}
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
      </div>
    </div>
  
  );
};

export default CustomerDetails;
