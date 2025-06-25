import React, { useState, useEffect } from "react";
import {
  Card,
  Tabs,
  Button,
  Input,
  Form,
  Row,
  Col,
  Avatar as AntAvatar,
  Spin,
  Alert,
  Table,
  Badge,
  Collapse,
  Space,
  Typography,
} from "antd";
import {
  UserOutlined,
  EditOutlined,
  LockOutlined,
  FileTextOutlined,
  ShoppingCartOutlined,
  TeamOutlined,
  FileDoneOutlined,
} from "@ant-design/icons";
import {
  useGetProfileQuery,
  useUpdateProfileMutation,
} from "../../api/userApi";
import { useGetRolesQuery } from "../../api/rolesApi";
import { useForgotPasswordMutation } from "../../api/authApi";
import { toast } from "sonner";
import Avatar from "react-avatar";
import { useGetQuotationByIdQuery } from "../../api/quotationApi";
import { useGetInvoicesByCustomerIdQuery } from "../../api/customerApi";
import { useGetTeamByIdQuery } from "../../api/teamApi";
import { useGetInvoiceByIdQuery } from "../../api/invoiceApi";
// Placeholder API hooks (replace with actual implementations)

const { Title, Text } = Typography;
const { TabPane } = Tabs;
const { Panel } = Collapse;

const Profile = () => {
  const {
    data: profile,
    isLoading: isProfileLoading,
    error: profileError,
  } = useGetProfileQuery();
  const {
    data: rolesData,
    isLoading: isRolesLoading,
    error: rolesError,
  } = useGetRolesQuery();
  const [updateProfile, { isLoading: isUpdating }] = useUpdateProfileMutation();
  const [forgotPassword, { isLoading: isResetting }] =
    useForgotPasswordMutation();

  // Placeholder queries for new data
  const {
    data: quotationsData,
    isLoading: isQuotationsLoading,
    error: quotationsError,
  } = useGetQuotationByIdQuery(profile?.user?.userId, {
    skip: !profile?.user?.userId,
  });
  const {
    data: invoicesData,
    isLoading: isInvoicesLoading,
    error: invoicesError,
  } = useGetInvoiceByIdQuery(profile?.user?.userId, {
    skip: !profile?.user?.userId,
  });
  const {
    data: teamsData,
    isLoading: isTeamsLoading,
    error: teamsError,
  } = useGetTeamByIdQuery(profile?.user?.userId, {
    skip: !profile?.user?.userId,
  });
  const {
    data: ordersData,
    isLoading: isOrdersLoading,
    error: ordersError,
  } = useGetInvoicesByCustomerIdQuery(profile?.user?.userId, {
    skip: !profile?.user?.userId,
  });

  const [isEditing, setIsEditing] = useState(false);
  const [form] = Form.useForm();
  const [avatarUrl, setAvatarUrl] = useState("");
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);

  // Debug token
  useEffect(() => {
    const token =
      localStorage.getItem("token") || sessionStorage.getItem("token");
    if (!token) {
      toast.error("No authentication token found. Redirecting to login...");
      window.location.href = "/login";
    }
  }, []);

  // Initialize form data
  useEffect(() => {
    if (profile?.user) {
      const user = profile.user;
      form.setFieldsValue({
        username: user.username || "",
        name: user.name || "",
        email: user.email || "",
        mobileNumber: user.mobileNumber || "",
        street: user.address?.street || "",
        city: user.address?.city || "",
        state: user.address?.state || "",
        postalCode: user.address?.postalCode || "",
        country: user.address?.country || "",
      });
      const savedAvatar = localStorage.getItem(`avatar_${user.userId}`);
      setAvatarUrl(savedAvatar || user.name || user.email);
    }
  }, [profile, form]);

  // Handle avatar selection
  const handleAvatarSelect = (avatar) => {
    setAvatarUrl(avatar);
    if (profile?.user?.userId) {
      localStorage.setItem(`avatar_${profile.user.userId}`, avatar);
    }
    setShowAvatarPicker(false);
  };

  // Handle forgot password
  const handleForgotPassword = async () => {
    const email = form.getFieldValue("email");
    if (!email) return toast.error("Email is required to reset password.");

    try {
      await forgotPassword({ email }).unwrap();
      toast.success("Password reset link sent to your email!");
    } catch (error) {
      toast.error(
        `Failed to send reset link: ${error.data?.error || "Unknown error"}`
      );
    }
  };

  // Handle profile update
  const handleSave = async (values) => {
    if (!profile?.user?.userId) return toast.error("User ID not found.");

    const updatedData = {
      username: values.username,
      name: values.name,
      email: values.email,
      mobileNumber: values.mobileNumber,
      address: {
        street: values.street || "",
        city: values.city || "",
        state: values.state || "",
        postalCode: values.postalCode || "",
        country: values.country || "",
      },
    };

    try {
      await updateProfile(updatedData).unwrap();
      toast.success("Profile updated successfully!");
      setIsEditing(false);
      if (values.name !== profile.user.name) {
        const savedAvatar = localStorage.getItem(
          `avatar_${profile.user.userId}`
        );
        if (!savedAvatar) {
          setAvatarUrl(values.name);
          localStorage.setItem(`avatar_${profile.user.userId}`, values.name);
        }
      }
    } catch (error) {
      toast.error(
        `Failed to update profile: ${error.data?.message || "Unknown error"}`
      );
    }
  };

  // Table columns for quotations, invoices, teams, and orders
  const quotationColumns = [
    { title: "Quotation ID", dataIndex: "quotationId", key: "quotationId" },
    { title: "Customer", dataIndex: "customerName", key: "customerName" },
    {
      title: "Amount",
      dataIndex: "amount",
      key: "amount",
      render: (text) => `₹${text}`,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (text) => <Badge status="processing" text={text} />,
    },
  ];

  const invoiceColumns = [
    { title: "Invoice ID", dataIndex: "invoiceId", key: "invoiceId" },
    { title: "Customer", dataIndex: "customerName", key: "customerName" },
    {
      title: "Amount",
      dataIndex: "amount",
      key: "amount",
      render: (text) => `₹${text}`,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (text) => <Badge status="success" text={text} />,
    },
  ];

  const teamColumns = [
    { title: "Team Name", dataIndex: "teamName", key: "teamName" },
    { title: "Role", dataIndex: "role", key: "role" },
    { title: "Members", dataIndex: "memberCount", key: "memberCount" },
  ];

  const orderColumns = [
    { title: "Order ID", dataIndex: "orderId", key: "orderId" },
    { title: "Customer", dataIndex: "customerName", key: "customerName" },
    {
      title: "Total",
      dataIndex: "totalAmount",
      key: "totalAmount",
      render: (text) => `₹${text}`,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (text) => <Badge status="warning" text={text} />,
    },
  ];

  if (isProfileLoading || isRolesLoading)
    return (
      <Spin size="large" style={{ display: "block", margin: "50px auto" }} />
    );
  if (profileError)
    return (
      <Alert
        message="Error loading profile"
        description={profileError?.data?.message || "Unknown error"}
        type="error"
        showIcon
      />
    );
  if (rolesError)
    return (
      <Alert
        message="Error loading roles"
        description={rolesError.message}
        type="error"
        showIcon
      />
    );
  if (!profile?.user)
    return (
      <Alert message="No user profile data available" type="warning" showIcon />
    );

  const user = profile.user;
  const roleName =
    rolesData?.find((role) => role.roleId === user.roleId)?.roleName || "N/A";

  return (
    <div className="page-wrapper">
      <div className="content">
        <Row gutter={[16, 16]}>
          {/* Profile Card */}
          <Col xs={24} lg={8}>
            <Card
              style={{
                borderRadius: 8,
                boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
              }}
              bodyStyle={{ padding: 24 }}
            >
              <Space
                direction="vertical"
                size="large"
                style={{ width: "100%", textAlign: "center" }}
              >
                <AntAvatar
                  icon={<UserOutlined />}
                  size={100}
                  src={avatarUrl}
                  style={{ backgroundColor: "#1890ff" }}
                />
                {isEditing && (
                  <Button
                    type="link"
                    onClick={() => setShowAvatarPicker(!showAvatarPicker)}
                  >
                    Change Avatar
                  </Button>
                )}
                {isEditing && showAvatarPicker && (
                  <Space wrap>
                    {[
                      "User",
                      user.name,
                      user.email,
                      "John Doe",
                      "Jane Smith",
                    ].map((option, index) => (
                      <AntAvatar
                        key={index}
                        size={40}
                        style={{ cursor: "pointer" }}
                        onClick={() => handleAvatarSelect(option)}
                      >
                        {option}
                      </AntAvatar>
                    ))}
                  </Space>
                )}
                <Title level={4}>{user.name}</Title>
                <Text type="secondary">{user.email}</Text>
                <Badge
                  count={roleName}
                  style={{ backgroundColor: "#52c41a" }}
                />
                <Text>Status: {user.status || "N/A"}</Text>
                {!isEditing && (
                  <Space>
                    <Button
                      type="primary"
                      icon={<EditOutlined />}
                      onClick={() => setIsEditing(true)}
                    >
                      Edit Profile
                    </Button>
                    <Button
                      icon={<LockOutlined />}
                      onClick={handleForgotPassword}
                      loading={isResetting}
                    >
                      Reset Password
                    </Button>
                  </Space>
                )}
              </Space>
            </Card>
          </Col>

          {/* Profile Details and Tabs */}
          <Col xs={24} lg={16}>
            <Card
              style={{
                borderRadius: 8,
                boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
              }}
              bodyStyle={{ padding: 0 }}
            >
              <Tabs defaultActiveKey="1" style={{ padding: 24 }}>
                {/* Profile Information */}
                <TabPane tab="Profile" key="1">
                  {isEditing ? (
                    <Form
                      form={form}
                      layout="vertical"
                      onFinish={handleSave}
                      style={{ padding: 16 }}
                    >
                      <Row gutter={[16, 16]}>
                        <Col xs={24} sm={12}>
                          <Form.Item
                            label="Username"
                            name="username"
                            rules={[
                              {
                                required: true,
                                message: "Username is required",
                              },
                            ]}
                          >
                            <Input />
                          </Form.Item>
                        </Col>
                        <Col xs={24} sm={12}>
                          <Form.Item
                            label="Name"
                            name="name"
                            rules={[
                              { required: true, message: "Name is required" },
                            ]}
                          >
                            <Input />
                          </Form.Item>
                        </Col>
                        <Col xs={24} sm={12}>
                          <Form.Item
                            label="Email"
                            name="email"
                            rules={[
                              { required: true, message: "Email is required" },
                              {
                                type: "email",
                                message: "Invalid email format",
                              },
                            ]}
                          >
                            <Input />
                          </Form.Item>
                        </Col>
                        <Col xs={24} sm={12}>
                          <Form.Item
                            label="Phone Number"
                            name="mobileNumber"
                            rules={[
                              {
                                required: true,
                                message: "Phone number is required",
                              },
                              {
                                pattern: /^[0-9]{10}$/,
                                message: "Invalid phone number",
                              },
                            ]}
                          >
                            <Input />
                          </Form.Item>
                        </Col>
                        <Col xs={24}>
                          <Title level={5}>Address Information</Title>
                        </Col>
                        <Col xs={24} sm={12}>
                          <Form.Item label="Street" name="street">
                            <Input />
                          </Form.Item>
                        </Col>
                        <Col xs={24} sm={12}>
                          <Form.Item label="City" name="city">
                            <Input />
                          </Form.Item>
                        </Col>
                        <Col xs={24} sm={12}>
                          <Form.Item label="State" name="state">
                            <Input />
                          </Form.Item>
                        </Col>
                        <Col xs={24} sm={12}>
                          <Form.Item label="Postal Code" name="postalCode">
                            <Input />
                          </Form.Item>
                        </Col>
                        <Col xs={24} sm={12}>
                          <Form.Item label="Country" name="country">
                            <Input />
                          </Form.Item>
                        </Col>
                        <Col xs={24}>
                          <Space>
                            <Button
                              type="primary"
                              htmlType="submit"
                              loading={isUpdating}
                            >
                              Save
                            </Button>
                            <Button onClick={() => setIsEditing(false)}>
                              Cancel
                            </Button>
                          </Space>
                        </Col>
                      </Row>
                    </Form>
                  ) : (
                    <Row gutter={[16, 16]} style={{ padding: 16 }}>
                      <Col xs={24} sm={12}>
                        <Text strong>Username:</Text>{" "}
                        <Text>{user.username}</Text>
                      </Col>
                      <Col xs={24} sm={12}>
                        <Text strong>Name:</Text> <Text>{user.name}</Text>
                      </Col>
                      <Col xs={24} sm={12}>
                        <Text strong>Email:</Text> <Text>{user.email}</Text>
                      </Col>
                      <Col xs={24} sm={12}>
                        <Text strong>Phone:</Text>{" "}
                        <Text>{user.mobileNumber || "N/A"}</Text>
                      </Col>
                      <Col xs={24}>
                        <Title level={5}>Address Information</Title>
                      </Col>
                      <Col xs={24} sm={12}>
                        <Text strong>Street:</Text>{" "}
                        <Text>{user.address?.street || "N/A"}</Text>
                      </Col>
                      <Col xs={24} sm={12}>
                        <Text strong>City:</Text>{" "}
                        <Text>{user.address?.city || "N/A"}</Text>
                      </Col>
                      <Col xs={24} sm={12}>
                        <Text strong>State:</Text>{" "}
                        <Text>{user.address?.state || "N/A"}</Text>
                      </Col>
                      <Col xs={24} sm={12}>
                        <Text strong>Postal Code:</Text>{" "}
                        <Text>{user.address?.postalCode || "N/A"}</Text>
                      </Col>
                      <Col xs={24} sm={12}>
                        <Text strong>Country:</Text>{" "}
                        <Text>{user.address?.country || "N/A"}</Text>
                      </Col>
                    </Row>
                  )}
                </TabPane>

                {/* Quotations */}
                <TabPane
                  tab={
                    <span>
                      <FileTextOutlined /> Quotations
                    </span>
                  }
                  key="2"
                >
                  {isQuotationsLoading ? (
                    <Spin />
                  ) : quotationsError ? (
                    <Alert
                      message="Error loading quotations"
                      description={quotationsError.message}
                      type="error"
                    />
                  ) : (
                    <Table
                      columns={quotationColumns}
                      dataSource={quotationsData?.data || []}
                      rowKey="quotationId"
                      pagination={{ pageSize: 5 }}
                    />
                  )}
                </TabPane>

                {/* Invoices */}
                <TabPane
                  tab={
                    <span>
                      <FileDoneOutlined /> Invoices
                    </span>
                  }
                  key="3"
                >
                  {isInvoicesLoading ? (
                    <Spin />
                  ) : invoicesError ? (
                    <Alert
                      message="Error loading invoices"
                      description={invoicesError.message}
                      type="error"
                    />
                  ) : (
                    <Table
                      columns={invoiceColumns}
                      dataSource={invoicesData?.data || []}
                      rowKey="invoiceId"
                      pagination={{ pageSize: 5 }}
                    />
                  )}
                </TabPane>

                {/* Teams */}
                <TabPane
                  tab={
                    <span>
                      <TeamOutlined /> Teams
                    </span>
                  }
                  key="4"
                >
                  {isTeamsLoading ? (
                    <Spin />
                  ) : teamsError ? (
                    <Alert
                      message="Error loading teams"
                      description={teamsError.message}
                      type="error"
                    />
                  ) : (
                    <Table
                      columns={teamColumns}
                      dataSource={teamsData?.data || []}
                      rowKey="teamId"
                      pagination={{ pageSize: 5 }}
                    />
                  )}
                </TabPane>

                {/* Orders */}
                <TabPane
                  tab={
                    <span>
                      <ShoppingCartOutlined /> Orders
                    </span>
                  }
                  key="5"
                >
                  {isOrdersLoading ? (
                    <Spin />
                  ) : ordersError ? (
                    <Alert
                      message="Error loading orders"
                      description={ordersError.message}
                      type="error"
                    />
                  ) : (
                    <Table
                      columns={orderColumns}
                      dataSource={ordersData?.data || []}
                      rowKey="orderId"
                      pagination={{ pageSize: 5 }}
                    />
                  )}
                </TabPane>
              </Tabs>
            </Card>
          </Col>
        </Row>
      </div>

      {/* Custom CSS */}
      <style jsx>{`
        .page-wrapper {
          background: #f5f7fa;
          min-height: 100vh;
        }
        .ant-card {
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
        }
        .ant-tabs-nav {
          padding: 0 24px;
        }
        .ant-tabs-tab {
          font-weight: 500;
        }
        .ant-table {
          border-radius: 8px;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
};

// Placeholder API hooks (replace with actual API endpoints)
const placeholderApi = {
  useGetUserQuotationsQuery: () => ({
    data: {
      data: [
        {
          quotationId: "Q001",
          customerName: "John Doe",
          amount: 5000,
          status: "Pending",
        },
        {
          quotationId: "Q002",
          customerName: "Jane Smith",
          amount: 7500,
          status: "Approved",
        },
      ],
    },
    isLoading: false,
    error: null,
  }),
  useGetUserInvoicesQuery: () => ({
    data: {
      data: [
        {
          invoiceId: "INV001",
          customerName: "John Doe",
          amount: 4500,
          status: "Paid",
        },
        {
          invoiceId: "INV002",
          customerName: "Jane Smith",
          amount: 6000,
          status: "Unpaid",
        },
      ],
    },
    isLoading: false,
    error: null,
  }),
  useGetUserTeamsQuery: () => ({
    data: {
      data: [
        {
          teamId: "T001",
          teamName: "Sales Team",
          role: "Manager",
          memberCount: 5,
        },
        {
          teamId: "T002",
          teamName: "Support Team",
          role: "Member",
          memberCount: 8,
        },
      ],
    },
    isLoading: false,
    error: null,
  }),
  useGetAssignedOrdersQuery: () => ({
    data: {
      data: [
        {
          orderId: "ORD001",
          customerName: "John Doe",
          totalAmount: 3000,
          status: "Processing",
        },
        {
          orderId: "ORD002",
          customerName: "Jane Smith",
          totalAmount: 4000,
          status: "Delivered",
        },
      ],
    },
    isLoading: false,
    error: null,
  }),
};

export default Profile;
