import React, { useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
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
  DollarCircleOutlined,
  FileTextOutlined,
  ShoppingCartOutlined,
  HomeOutlined,
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  UserOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
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
  Badge,
  Empty,
  Tooltip,
  Divider,
} from "antd";
import { Helmet } from "react-helmet";
import moment from "moment";

const { Title, Text, Paragraph } = Typography;

const CustomerDetails = () => {
  const { id } = useParams();
  const [form] = Form.useForm();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);

  // Queries
  const { data: customerData } = useGetCustomerByIdQuery(id);
  const customer = customerData?.data || {};

  const { data: invoicesData } = useGetInvoicesByCustomerIdQuery(
    customer?.customerId,
    {
      skip: !customer?.customerId,
    }
  );

  const { data: usersData } = useGetAllUsersQuery();
  const users = usersData?.users || [];

  const { data: addressesData, refetch: refetchAddresses } =
    useGetAllAddressesQuery(
      { customerId: customer?.customerId },
      { skip: !customer?.customerId }
    );

  const { data: quotationsData } = useGetAllQuotationsQuery(
    { customerId: customer?.customerId },
    { skip: !customer?.customerId }
  );

  const { data: ordersData } = useGetAllOrdersQuery();

  const [createAddress] = useCreateAddressMutation();
  const [updateAddress] = useUpdateAddressMutation();
  const [deleteAddress] = useDeleteAddressMutation();

  // Derived Data
  const addresses = useMemo(
    () =>
      (addressesData || []).filter((a) => a.customerId === customer.customerId),
    [addressesData, customer.customerId]
  );

  const quotations = quotationsData?.data || [];
  const orders = (ordersData?.orders || []).filter(
    (o) => o.createdFor === customer.customerId
  );
  const invoices = invoicesData?.data || [];

  const totalQuoted = quotations.reduce(
    (sum, q) => sum + (Number(q.finalAmount) || 0),
    0
  );
  const totalInvoiced = invoices.reduce(
    (sum, i) => sum + (Number(i.finalAmount) || 0),
    0
  );
  const totalPaid = invoices.reduce(
    (sum, i) => sum + (Number(i.paidAmount) || 0),
    0
  );
  const balanceDue = totalInvoiced - totalPaid;

  const primaryAddress =
    addresses.find((a) => a.status === "PRIMARY") || addresses[0];

  const formatDate = (date) =>
    date ? moment(date).format("DD MMM YYYY") : "—";
  const formatCurrency = (amt) =>
    `₹${Number(amt || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
    })}`;

  const getUsername = (userId) => {
    const user = users.find((u) => u.userId === userId);
    return user ? user.name || user.email.split("@")[0] : "System";
  };

  // Address Handlers
  const openAddressModal = (addr = null) => {
    setEditingAddress(addr);
    if (addr) {
      form.setFieldsValue(addr);
    } else {
      form.resetFields();
    }
    setIsModalOpen(true);
  };

  const handleAddressSave = async (values) => {
    try {
      if (editingAddress) {
        await updateAddress({
          addressId: editingAddress.addressId,
          updatedData: { ...values, customerId: customer.customerId },
        }).unwrap();
        message.success("Address updated successfully");
      } else {
        await createAddress({
          ...values,
          customerId: customer.customerId,
          status: addresses.length === 0 ? "PRIMARY" : "ADDITIONAL",
        }).unwrap();
        message.success("Address added successfully");
      }
      setIsModalOpen(false);
      refetchAddresses();
    } catch (err) {
      message.error(err?.data?.message || "Failed to save address");
    }
  };

  const handleDelete = (addressId) => {
    Modal.confirm({
      title: "Delete Address",
      content: "This address will be permanently removed.",
      okText: "Delete",
      okType: "danger",
      onOk: async () => {
        try {
          await deleteAddress(addressId).unwrap();
          message.success("Address deleted");
          refetchAddresses();
        } catch {
          message.error("Failed to delete");
        }
      },
    });
  };

  const getInitials = (name) => {
    return name
      ? name
          .split(" ")
          .map((n) => n[0])
          .join("")
          .toUpperCase()
          .slice(0, 2)
      : "CU";
  };

  const tabItems = [
    {
      key: "overview",
      label: <span>Overview</span>,
      children: (
        <Row gutter={[16, 16]}>
          <Col span={24}>
            <Card title="Recent Activity" bordered={false}>
              <Timeline>
                {quotations.slice(0, 5).map((q) => (
                  <Timeline.Item
                    key={q.quotationId}
                    dot={<FileTextOutlined style={{ fontSize: "16px" }} />}
                    color="blue"
                  >
                    <Text strong>Quotation Created</Text> —{" "}
                    {q.document_title || "Quotation"}
                    <br />
                    <Text type="secondary">
                      {formatDate(q.quotation_date)} •{" "}
                      {formatCurrency(q.finalAmount)}
                    </Text>
                  </Timeline.Item>
                ))}
                {orders.slice(0, 3).map((o) => (
                  <Timeline.Item
                    key={o.id}
                    dot={<ShoppingCartOutlined style={{ fontSize: "16px" }} />}
                    color="green"
                  >
                    <Text strong>Order Placed</Text> — {o.orderNo}
                    <br />
                    <Text type="secondary">
                      {formatDate(o.createdAt)} • {o.status}
                    </Text>
                  </Timeline.Item>
                ))}
                {quotations.length === 0 && orders.length === 0 && (
                  <Timeline.Item>No activity yet</Timeline.Item>
                )}
              </Timeline>
            </Card>
          </Col>
        </Row>
      ),
    },
    {
      key: "quotations",
      label: <span>Quotations ({quotations.length})</span>,
      children:
        quotations.length === 0 ? (
          <Empty />
        ) : (
          <Table
            dataSource={quotations}
            rowKey="quotationId"
            pagination={{ pageSize: 8 }}
            columns={[
              {
                title: "Ref No",
                dataIndex: "reference_number",
                render: (text, r) => (
                  <Link
                    to={`/quotation/${r.quotationId}`}
                    style={{ fontWeight: 500 }}
                  >
                    {text || "—"}
                  </Link>
                ),
              },
              { title: "Title", dataIndex: "document_title", ellipsis: true },
              {
                title: "Amount",
                dataIndex: "finalAmount",
                render: (amt) => <Text strong>{formatCurrency(amt)}</Text>,
                align: "right",
              },
              {
                title: "Date",
                dataIndex: "quotation_date",
                render: formatDate,
              },
              {
                title: "Status",
                render: () => <Tag color="processing">Pending</Tag>,
              },
              {
                title: "",
                render: (_, r) => (
                  <Button
                    type="link"
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
      label: <span>Orders ({orders.length})</span>,
      children:
        orders.length === 0 ? (
          <Empty />
        ) : (
          <Table
            dataSource={orders}
            rowKey="id"
            pagination={{ pageSize: 8 }}
            columns={[
              {
                title: "Order No",
                dataIndex: "orderNo",
                render: (t) => <Text strong>{t}</Text>,
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
                        : "processing"
                    }
                  >
                    {s}
                  </Tag>
                ),
              },
              { title: "Date", dataIndex: "createdAt", render: formatDate },
              { title: "Due", dataIndex: "dueDate", render: formatDate },
              {
                title: "",
                render: (_, r) => (
                  <Button
                    type="link"
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
      label: <span>Addresses ({addresses.length})</span>,
      children: (
        <div>
          <div style={{ marginBottom: 16, textAlign: "right" }}>
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
                <Col xs={24} md={12} key={addr.addressId}>
                  <Card
                    hoverable
                    actions={[
                      <EditOutlined onClick={() => openAddressModal(addr)} />,
                      <DeleteOutlined
                        onClick={() => handleDelete(addr.addressId)}
                      />,
                    ]}
                  >
                    <Card.Meta
                      title={
                        <Space>
                          <HomeOutlined />
                          {addr.status === "PRIMARY" ? (
                            <Tag color="gold">Primary</Tag>
                          ) : (
                            <Tag>Additional</Tag>
                          )}
                        </Space>
                      }
                      description={
                        <div>
                          <Paragraph style={{ margin: 0 }}>
                            {addr.street}
                            <br />
                            {addr.city}, {addr.state}{" "}
                            {addr.postalCode && `- ${addr.postalCode}`}
                            <br />
                            {addr.country || "India"}
                          </Paragraph>
                        </div>
                      }
                    />
                  </Card>
                </Col>
              ))}
            </Row>
          )}
        </div>
      ),
    },
  ];

  return (
    <>
      <Helmet>
        <title>{customer.name || "Customer"} | CRM</title>
      </Helmet>
      <div className="page-wrapper">
        <div className="content">
          <div
            style={{
              padding: "24px 24px 0",
              background: "#f0f2f5",
              minHeight: "100vh",
            }}
          >
            {/* Header Stats Bar */}
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
              <Col xs={24} sm={12} lg={6}>
                <Card>
                  <Statistic
                    title="Total Quoted"
                    value={totalQuoted}
                    precision={2}
                    prefix="₹"
                    valueStyle={{ color: "#1890ff" }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Card>
                  <Statistic
                    title="Invoiced"
                    value={totalInvoiced}
                    precision={2}
                    prefix="₹"
                    valueStyle={{ color: "#722ed1" }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Card>
                  <Statistic
                    title="Paid"
                    value={totalPaid}
                    precision={2}
                    prefix="₹"
                    valueStyle={{ color: "#52c41a" }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Card>
                  <Statistic
                    title="Balance Due"
                    value={balanceDue}
                    precision={2}
                    prefix="₹"
                    valueStyle={{
                      color: balanceDue > 0 ? "#cf1322" : "#52c41a",
                    }}
                  />
                </Card>
              </Col>
            </Row>

            <Row gutter={[24, 24]}>
              {/* Left Column - Customer Info */}
              <Col xs={24} lg={8}>
                <Card
                  style={{ height: "fit-content" }}
                  bodyStyle={{ padding: "24px" }}
                >
                  <div style={{ textAlign: "center", marginBottom: 24 }}>
                    <Avatar
                      size={100}
                      src={customer.avatar}
                      style={{
                        backgroundColor: "#1890ff",
                        fontSize: "36px",
                        marginBottom: 16,
                      }}
                    >
                      {getInitials(customer.name)}
                    </Avatar>
                    <Title level={3} style={{ margin: "8px 0" }}>
                      {customer.name}
                    </Title>
                    <Space size={8}>
                      <Tag
                        color={customer.isVendor ? "purple" : "blue"}
                        icon={
                          customer.isVendor ? (
                            <ShopOutlined />
                          ) : (
                            <UserOutlined />
                          )
                        }
                      >
                        {customer.isVendor ? "Vendor" : "Customer"}
                      </Tag>
                      {customer.isActive === false && (
                        <Tag color="red">Inactive</Tag>
                      )}
                    </Space>
                  </div>

                  <Space
                    direction="vertical"
                    size="middle"
                    style={{ width: "100%" }}
                  >
                    <div>
                      <Text type="secondary">
                        <PhoneOutlined /> Phone
                      </Text>
                      <br />
                      <Text strong>{customer.mobileNumber || "—"}</Text>
                    </div>
                    <div>
                      <Text type="secondary">
                        <MailOutlined /> Email
                      </Text>
                      <br />
                      <a href={`mailto:${customer.email}`}>
                        <Text strong>{customer.email || "—"}</Text>
                      </a>
                    </div>
                    <div>
                      <Text type="secondary">
                        <ShopOutlined /> Company
                      </Text>
                      <br />
                      <Text strong>{customer.companyName || "—"}</Text>
                    </div>
                    <div>
                      <Text type="secondary">
                        <CalendarOutlined /> Member Since
                      </Text>
                      <br />
                      <Text strong>{formatDate(customer.createdAt)}</Text>
                    </div>
                  </Space>

                  <Divider />

                  <Button
                    type="primary"
                    block
                    icon={<EditOutlined />}
                    href={`/customer/edit/${customer.customerId}`}
                  >
                    Edit Customer
                  </Button>
                </Card>

                {primaryAddress && (
                  <Card
                    title={<span>Primary Address</span>}
                    style={{ marginTop: "24px 0" }}
                  >
                    <Text>
                      {primaryAddress.street}
                      <br />
                      {primaryAddress.city}, {primaryAddress.state}{" "}
                      {primaryAddress.postalCode}
                      <br />
                      {primaryAddress.country || "India"}
                    </Text>
                  </Card>
                )}
              </Col>

              {/* Right Column - Tabs */}
              <Col xs={24} lg={16}>
                <Card bodyStyle={{ padding: 0 }}>
                  <Tabs
                    defaultActiveKey="overview"
                    items={tabItems}
                    tabBarStyle={{ padding: "0 24px", margin: 0 }}
                    style={{ marginTop: 1 }}
                  />
                </Card>
              </Col>
            </Row>
          </div>

          {/* Address Modal */}
          <Modal
            title={editingAddress ? "Edit Address" : "Add New Address"}
            open={isModalOpen}
            onCancel={() => setIsModalOpen(false)}
            footer={null}
            width={600}
          >
            <Form form={form} onFinish={handleAddressSave} layout="vertical">
              <Form.Item
                name="street"
                label="Street Address"
                rules={[{ required: true }]}
              >
                <Input.TextArea
                  rows={3}
                  placeholder="Full street, building, landmark..."
                />
              </Form.Item>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="city"
                    label="City"
                    rules={[{ required: true }]}
                  >
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
                  <Form.Item
                    name="country"
                    label="Country"
                    initialValue="India"
                  >
                    <Input disabled />
                  </Form.Item>
                </Col>
              </Row>
              <Form.Item style={{ marginBottom: 0, textAlign: "right" }}>
                <Button
                  onClick={() => setIsModalOpen(false)}
                  style={{ marginRight: 8 }}
                >
                  Cancel
                </Button>
                <Button type="primary" htmlType="submit">
                  {editingAddress ? "Update" : "Add"} Address
                </Button>
              </Form.Item>
            </Form>
          </Modal>
        </div>
      </div>
    </>
  );
};

export default CustomerDetails;
