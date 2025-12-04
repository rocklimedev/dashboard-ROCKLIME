import React, { useState, useEffect } from "react";
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
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  LeftOutlined,
  CalendarOutlined,
  PhoneOutlined,
  MailOutlined,
  EnvironmentOutlined,
  ShopOutlined,
  DollarCircleOutlined,
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
  Spin,
  Alert,
  Tabs,
  Tooltip,
  Divider,
  Row,
  Col,
  Statistic,
  Empty,
} from "antd";
import { Helmet } from "react-helmet";
import moment from "moment";
import styled from "styled-components";

const { Title, Text } = Typography;

const StyledPage = styled.div`
  padding: 24px;
  background: #f5f7fa;
  min-height: 100vh;
`;

const CustomerDetails = () => {
  const { id } = useParams();
  const [form] = Form.useForm();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [activeTab, setActiveTab] = useState("quotations");

  // Queries
  const {
    data: customerData,
    isLoading: isCustomerLoading,
    error: customerError,
  } = useGetCustomerByIdQuery(id);

  const customer = customerData?.data || {};

  const { data: invoicesData, isLoading: isInvoiceLoading } =
    useGetInvoicesByCustomerIdQuery(customer?.customerId, {
      skip: !customer?.customerId,
    });

  const { data: usersData } = useGetAllUsersQuery();
  const users = usersData?.users || [];

  const {
    data: addressesData,
    isLoading: isAddressesLoading,
    refetch: refetchAddresses,
  } = useGetAllAddressesQuery(
    { customerId: customer?.customerId },
    { skip: !customer?.customerId }
  );

  const { data: quotationsData, isLoading: isQuotationsLoading } =
    useGetAllQuotationsQuery(
      { customerId: customer?.customerId },
      { skip: !customer?.customerId }
    );

  const { data: ordersData, isLoading: isOrdersLoading } =
    useGetAllOrdersQuery();

  const [createAddress, { isLoading: isCreating }] = useCreateAddressMutation();
  const [updateAddress, { isLoading: isUpdating }] = useUpdateAddressMutation();
  const [deleteAddress] = useDeleteAddressMutation();

  // Derived data
  const customerAddresses =
    addressesData?.filter((a) => a.customerId === customer.customerId) || [];
  const quotations = quotationsData?.data || [];
  const orders = (ordersData?.orders || []).filter(
    (o) => o.createdFor === customer.customerId
  );
  const invoices = invoicesData?.data || [];

  const totalAmount = quotations
    .reduce((sum, q) => sum + (Number(q.finalAmount) || 0), 0)
    .toFixed(2);
  const paidAmount = "0.00"; // Placeholder
  const balance = totalAmount;

  const formatDate = (date) =>
    date ? moment(date).format("DD MMM YYYY") : "N/A";
  const formatAddress = (addr) => {
    if (!addr) return "N/A";
    const parts = [
      addr.street,
      addr.city,
      addr.state,
      addr.postalCode,
      addr.country,
    ];
    return parts.filter(Boolean).join(", ") || "N/A";
  };

  const getUsername = (userId) => {
    const user = users.find((u) => u.userId === userId);
    return user ? user.name || user.email || "Unknown" : "Unknown";
  };

  // Address Modal
  const showAddressModal = (address = null) => {
    setEditingAddress(address);
    if (address) {
      form.setFieldsValue({
        street: address.street,
        city: address.city,
        state: address.state,
        postalCode: address.postalCode,
        country: address.country || "India",
      });
    } else {
      form.resetFields();
    }
    setIsModalOpen(true);
  };

  const handleAddressSubmit = async (values) => {
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
          status: "ADDITIONAL",
        }).unwrap();
        message.success("Address added");
      }
      setIsModalOpen(false);
      form.resetFields();
      refetchAddresses();
    } catch (err) {
      message.error(err?.data?.message || "Failed to save address");
    }
  };

  const handleDeleteAddress = (addressId) => {
    Modal.confirm({
      title: "Delete Address?",
      content: "This action cannot be undone.",
      onOk: async () => {
        try {
          await deleteAddress(addressId).unwrap();
          message.success("Address deleted");
          refetchAddresses();
        } catch {
          message.error("Failed to delete address");
        }
      },
    });
  };

  // Loading & Error States
  if (
    isCustomerLoading ||
    isInvoiceLoading ||
    isAddressesLoading ||
    isQuotationsLoading ||
    isOrdersLoading
  ) {
    return (
      <StyledPage>
        <div style={{ textAlign: "center", padding: "100px 0" }}>
          <Spin size="large" />
        </div>
      </StyledPage>
    );
  }

  if (customerError) {
    return (
      <StyledPage>
        <Alert
          message="Error"
          description={
            customerError?.data?.message || "Failed to load customer"
          }
          type="error"
          showIcon
          action={
            <Button
              size="small"
              danger
              onClick={() => window.location.reload()}
            >
              Retry
            </Button>
          }
        />
      </StyledPage>
    );
  }

  if (!customer?.customerId) {
    return (
      <StyledPage>
        <Alert message="Customer not found" type="warning" showIcon />
      </StyledPage>
    );
  }

  const tabItems = [
    {
      key: "quotations",
      label: "Quotations",
      children:
        quotations.length === 0 ? (
          <Empty description="No quotations found" />
        ) : (
          <Table
            dataSource={quotations}
            rowKey="quotationId"
            pagination={false}
            columns={[
              {
                title: "Quotation No",
                dataIndex: "reference_number",
                render: (text, record) => (
                  <Link to={`/quotation/${record.quotationId}`}>
                    {text || "N/A"}
                  </Link>
                ),
              },
              { title: "Title", dataIndex: "document_title" },
              { title: "Ship To", render: (_, r) => formatAddress(r.shipTo) },
              {
                title: "Date",
                dataIndex: "quotation_date",
                render: formatDate,
              },
              { title: "Due Date", dataIndex: "due_date", render: formatDate },
              {
                title: "Amount",
                render: (_, r) => `₹${(r.finalAmount || 0).toFixed(2)}`,
              },
              {
                title: "Created By",
                render: (_, r) => getUsername(r.createdBy),
              },
              {
                title: "Actions",
                render: (_, record) => (
                  <Space>
                    <Button
                      type="link"
                      icon={<EyeOutlined />}
                      href={`/quotation/${record.quotationId}`}
                    />
                  </Space>
                ),
              },
            ]}
          />
        ),
    },
    {
      key: "orders",
      label: "Orders",
      children:
        orders.length === 0 ? (
          <Empty description="No orders found" />
        ) : (
          <Table
            dataSource={orders}
            rowKey="id"
            pagination={false}
            columns={[
              { title: "Order No", dataIndex: "orderNo" },
              {
                title: "Status",
                dataIndex: "status",
                render: (status) => {
                  const color =
                    status === "DELIVERED"
                      ? "success"
                      : status === "CANCELED"
                      ? "error"
                      : "processing";
                  return <Tag color={color}>{status}</Tag>;
                },
              },
              { title: "Due Date", dataIndex: "dueDate", render: formatDate },
              {
                title: "Priority",
                dataIndex: "priority",
                render: (p) => (
                  <Tag
                    color={
                      p === "high" ? "red" : p === "low" ? "default" : "orange"
                    }
                  >
                    {p?.toUpperCase()}
                  </Tag>
                ),
              },
              {
                title: "Actions",
                render: (_, record) => (
                  <Button
                    type="link"
                    icon={<EyeOutlined />}
                    href={`/order/${record.id}`}
                  />
                ),
              },
            ]}
          />
        ),
    },
    {
      key: "addresses",
      label: (
        <Space>
          Addresses
          <Button
            type="primary"
            size="small"
            onClick={() => showAddressModal()}
          >
            Add Address
          </Button>
        </Space>
      ),
      children:
        customerAddresses.length === 0 ? (
          <Empty description="No addresses found" />
        ) : (
          <Table
            dataSource={customerAddresses}
            rowKey="addressId"
            pagination={false}
            columns={[
              { title: "Street", dataIndex: "street", render: (t) => t || "—" },
              { title: "City", dataIndex: "city", render: (t) => t || "—" },
              { title: "State", dataIndex: "state", render: (t) => t || "—" },
              {
                title: "PIN",
                dataIndex: "postalCode",
                render: (t) => t || "—",
              },
              {
                title: "Country",
                dataIndex: "country",
                render: (t) => t || "India",
              },
              {
                title: "Actions",
                render: (_, record) => (
                  <Space>
                    <Button
                      type="link"
                      size="small"
                      onClick={() => showAddressModal(record)}
                    >
                      <EditOutlined />
                    </Button>
                    <Button
                      type="link"
                      danger
                      size="small"
                      onClick={() => handleDeleteAddress(record.addressId)}
                    >
                      <DeleteOutlined />
                    </Button>
                  </Space>
                ),
              },
            ]}
          />
        ),
    },
  ];

  return (
    <div className="page-wrapper">
      <div className="content">
        <StyledPage>
          <Helmet>
            <title>{customer.name} | Customer Details</title>
          </Helmet>

          <Space direction="vertical" size="large" style={{ width: "100%" }}>
            <Link to="/customers/list">
              <LeftOutlined /> Back to Customers
            </Link>

            <Row gutter={24}>
              {/* Left Sidebar */}
              <Col xs={24} lg={8}>
                <Card>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 16,
                      marginBottom: 16,
                    }}
                  >
                    <Avatar
                      size={80}
                      src={customer.avatar}
                      style={{ backgroundColor: "#4A90E2" }}
                    >
                      {customer.name?.[0] || "C"}
                    </Avatar>
                    <div>
                      <Title level={4} style={{ margin: 0 }}>
                        {customer.name}
                      </Title>
                      <Tag color={customer.isVendor ? "purple" : "blue"}>
                        {customer.isVendor ? "Vendor/Customer" : "Customer"}
                      </Tag>
                    </div>
                    <div style={{ marginLeft: "auto" }}>
                      <Link
                        to={`/customer/edit/${customer.customerId}`}
                        state={{ customer }}
                      >
                        <Button type="primary">Edit Customer</Button>
                      </Link>
                    </div>
                  </div>

                  <Divider />

                  <Space direction="vertical" style={{ width: "100%" }}>
                    <div>
                      <ShopOutlined /> <Text strong>Company:</Text>{" "}
                      {customer.companyName || "N/A"}
                    </div>
                    <div>
                      <CalendarOutlined /> <Text strong>Joined:</Text>{" "}
                      {formatDate(customer.createdAt)}
                    </div>
                    <div>
                      <EnvironmentOutlined /> <Text strong>Address:</Text>{" "}
                      {formatAddress(customerAddresses[0])}
                    </div>
                  </Space>

                  <Divider>
                    <Tooltip title="Based on quotations only">
                      <Text strong>Financial Summary</Text>
                    </Tooltip>
                  </Divider>

                  <Row gutter={16}>
                    <Col span={12}>
                      <Statistic
                        title="Total Amount"
                        value={totalAmount}
                        prefix="₹"
                      />
                    </Col>
                    <Col span={12}>
                      <Statistic
                        title="Balance"
                        value={balance}
                        prefix="₹"
                        valueStyle={{ color: "#cf1322" }}
                      />
                    </Col>
                  </Row>
                </Card>
              </Col>

              {/* Right Content */}
              <Col xs={24} lg={16}>
                <Card>
                  <Title level={5}>Basic Information</Title>
                  <Row gutter={[16, 16]}>
                    <Col span={12}>
                      <Text strong>
                        <PhoneOutlined /> Phone:
                      </Text>
                      <br />
                      <Text>{customer.mobileNumber || "N/A"}</Text>
                    </Col>
                    <Col span={12}>
                      <Text strong>
                        <MailOutlined /> Email:
                      </Text>
                      <br />
                      <a href={`mailto:${customer.email}`}>
                        {customer.email || "N/A"}
                      </a>
                    </Col>
                    <Col span={24}>
                      <Text strong>
                        <EnvironmentOutlined /> Address:
                      </Text>
                      <br />
                      <Text>{formatAddress(customerAddresses[0])}</Text>
                    </Col>
                  </Row>
                </Card>

                <Card style={{ marginTop: 24 }}>
                  <Tabs
                    activeKey={activeTab}
                    onChange={setActiveTab}
                    items={tabItems}
                  />
                </Card>
              </Col>
            </Row>
          </Space>

          {/* Address Modal */}
          <Modal
            title={editingAddress ? "Edit Address" : "Add New Address"}
            open={isModalOpen}
            onCancel={() => {
              setIsModalOpen(false);
              form.resetFields();
            }}
            footer={null}
          >
            <Form form={form} onFinish={handleAddressSubmit} layout="vertical">
              <Form.Item
                name="street"
                label="Street"
                rules={[{ required: true }]}
              >
                <Input.TextArea rows={2} />
              </Form.Item>
              <Form.Item name="city" label="City" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
              <Form.Item
                name="state"
                label="State"
                rules={[{ required: true }]}
              >
                <Input />
              </Form.Item>
              <Form.Item name="postalCode" label="Postal Code">
                <Input />
              </Form.Item>
              <Form.Item name="country" label="Country" initialValue="India">
                <Input />
              </Form.Item>
              <Form.Item style={{ marginBottom: 0, textAlign: "right" }}>
                <Button
                  onClick={() => setIsModalOpen(false)}
                  style={{ marginRight: 8 }}
                >
                  Cancel
                </Button>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={isCreating || isUpdating}
                >
                  {editingAddress ? "Update" : "Add"} Address
                </Button>
              </Form.Item>
            </Form>
          </Modal>
        </StyledPage>
      </div>
    </div>
  );
};

export default CustomerDetails;
