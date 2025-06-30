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
  Space,
  Typography,
  DatePicker,
  TimePicker,
  Select,
  Upload,
  Menu,
} from "antd";
import {
  UserOutlined,
  EditOutlined,
  LockOutlined,
  FileTextOutlined,
  ShoppingCartOutlined,
  TeamOutlined,
  FileDoneOutlined,
  UploadOutlined,
  HomeOutlined,
  DollarOutlined,
} from "@ant-design/icons";
import {
  useGetProfileQuery,
  useUpdateProfileMutation,
} from "../../api/userApi";
import { useGetRolesQuery } from "../../api/rolesApi";
import { useForgotPasswordMutation } from "../../api/authApi";
import { useGetQuotationByIdQuery } from "../../api/quotationApi";
import { useGetInvoicesByCustomerIdQuery } from "../../api/customerApi";
import { useGetTeamByIdQuery } from "../../api/teamApi";
import { useGetInvoiceByIdQuery } from "../../api/invoiceApi";
import moment from "moment";
import { toast } from "sonner";
import "./profile.css";

const { Title, Text } = Typography;
const { TabPane } = Tabs;
const { Option } = Select;

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
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [activeTab, setActiveTab] = useState("profile");

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
        dateOfBirth: user.dateOfBirth ? moment(user.dateOfBirth) : null,
        shiftFrom: user.shiftFrom ? moment(user.shiftFrom, "HH:mm:ss") : null,
        shiftTo: user.shiftTo ? moment(user.shiftTo, "HH:mm:ss") : null,
        bloodGroup: user.bloodGroup || null,
        emergencyNumber: user.emergencyNumber || "",
        street: user.address?.street || "",
        city: user.address?.city || "",
        state: user.address?.state || "",
        postalCode: user.address?.postalCode || "",
        country: user.address?.country || "",
      });
      setAvatarUrl(user.avatarUrl || null);
    }
  }, [profile, form]);

  // Handle avatar upload
  const handleAvatarUpload = ({ file }) => {
    if (file.status === "done") {
      setAvatarUrl(file.response.url);
      localStorage.setItem(`avatar_${profile.user.userId}`, file.response.url);
      toast.success("Avatar uploaded successfully!");
    } else if (file.status === "error") {
      toast.error("Failed to upload avatar.");
    }
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
      dateOfBirth: values.dateOfBirth
        ? moment(values.dateOfBirth).format("YYYY-MM-DD")
        : null,
      shiftFrom: values.shiftFrom
        ? moment(values.shiftFrom).format("HH:mm:ss")
        : null,
      shiftTo: values.shiftTo
        ? moment(values.shiftTo).format("HH:mm:ss")
        : null,
      bloodGroup: values.bloodGroup || null,
      emergencyNumber: values.emergencyNumber || null,
      address: {
        street: values.street || "",
        city: values.city || "",
        state: values.state || "",
        postalCode: values.postalCode || "",
        country: values.country || "",
      },
      avatarUrl: avatarUrl || null,
    };

    try {
      await updateProfile(updatedData).unwrap();
      toast.success("Profile updated successfully!");
      setIsEditing(false);
    } catch (error) {
      toast.error(
        `Failed to update profile: ${error.data?.message || "Unknown error"}`
      );
    }
  };

  // Table columns
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
        <div className="ecommerce-profile-wrapper">
          <Row gutter={[16, 16]}>
            {/* Sidebar */}
            <Col xs={24} md={6}>
              <Card className="sidebar-card">
                <div className="profile-summary">
                  <AntAvatar
                    size={100}
                    src={avatarUrl}
                    icon={<UserOutlined />}
                    className="profile-avatar"
                  />
                  <Upload
                    name="avatar"
                    showUploadList={false}
                    customRequest={handleAvatarUpload}
                  >
                    <Button
                      icon={<UploadOutlined />}
                      className="avatar-upload-btn"
                      type="link"
                    >
                      Change Avatar
                    </Button>
                  </Upload>
                  <Title level={4} className="profile-name">
                    {user.name}
                  </Title>
                  <Text className="profile-email">{user.email}</Text>
                </div>
                <Menu
                  mode="vertical"
                  selectedKeys={[activeTab]}
                  onClick={(e) => setActiveTab(e.key)}
                  className="profile-menu"
                >
                  <Menu.Item key="profile" icon={<UserOutlined />}>
                    My Profile
                  </Menu.Item>
                  <Menu.Item key="quotations" icon={<FileTextOutlined />}>
                    My Quotations
                  </Menu.Item>
                  <Menu.Item key="invoices" icon={<FileDoneOutlined />}>
                    My Invoices
                  </Menu.Item>
                  <Menu.Item key="teams" icon={<TeamOutlined />}>
                    My Teams
                  </Menu.Item>
                  <Menu.Item key="orders" icon={<ShoppingCartOutlined />}>
                    My Orders
                  </Menu.Item>
                  <Menu.Item
                    key="reset-password"
                    icon={<LockOutlined />}
                    onClick={handleForgotPassword}
                    disabled={isResetting}
                  >
                    Reset Password
                  </Menu.Item>
                </Menu>
              </Card>
            </Col>

            {/* Main Content */}
            <Col xs={24} md={18}>
              <Card className="content-card">
                {activeTab === "profile" && (
                  <div>
                    {isEditing ? (
                      <Form
                        form={form}
                        layout="vertical"
                        onFinish={handleSave}
                        className="profile-form"
                      >
                        <Title level={4}>Edit Profile</Title>
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
                                {
                                  max: 50,
                                  message:
                                    "Username cannot exceed 50 characters",
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
                                {
                                  max: 100,
                                  message: "Name cannot exceed 100 characters",
                                },
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
                                {
                                  required: true,
                                  message: "Email is required",
                                },
                                {
                                  type: "email",
                                  message: "Invalid email format",
                                },
                                {
                                  max: 100,
                                  message: "Email cannot exceed 100 characters",
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
                                  pattern: /^[0-9]{10}$/,
                                  message: "Phone number must be 10 digits",
                                },
                              ]}
                            >
                              <Input />
                            </Form.Item>
                          </Col>
                          <Col xs={24} sm={12}>
                            <Form.Item label="Date of Birth" name="dateOfBirth">
                              <DatePicker style={{ width: "100%" }} />
                            </Form.Item>
                          </Col>
                          <Col xs={24} sm={12}>
                            <Form.Item label="Blood Group" name="bloodGroup">
                              <Select
                                allowClear
                                placeholder="Select blood group"
                                style={{ width: "100%" }}
                              >
                                {[
                                  "A+",
                                  "A-",
                                  "B+",
                                  "B-",
                                  "AB+",
                                  "AB-",
                                  "O+",
                                  "O-",
                                ].map((group) => (
                                  <Option key={group} value={group}>
                                    {group}
                                  </Option>
                                ))}
                              </Select>
                            </Form.Item>
                          </Col>
                          <Col xs={24} sm={12}>
                            <Form.Item
                              label="Emergency Contact"
                              name="emergencyNumber"
                              rules={[
                                {
                                  pattern: /^[0-9]{10}$/,
                                  message: "Emergency number must be 10 digits",
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
                                Save Changes
                              </Button>
                              <Button onClick={() => setIsEditing(false)}>
                                Cancel
                              </Button>
                            </Space>
                          </Col>
                        </Row>
                      </Form>
                    ) : (
                      <div>
                        <div className="profile-header">
                          <Title level={4}>My Profile</Title>
                          <Button
                            type="primary"
                            icon={<EditOutlined />}
                            onClick={() => setIsEditing(true)}
                          >
                            Edit Profile
                          </Button>
                        </div>
                        <Row gutter={[16, 16]}>
                          <Col xs={24} sm={12}>
                            <Text strong>Username:</Text>
                            <div>{user.username}</div>
                          </Col>
                          <Col xs={24} sm={12}>
                            <Text strong>Name:</Text>
                            <div>{user.name}</div>
                          </Col>
                          <Col xs={24} sm={12}>
                            <Text strong>Email:</Text>
                            <div>{user.email}</div>
                          </Col>
                          <Col xs={24} sm={12}>
                            <Text strong>Phone:</Text>
                            <div>{user.mobileNumber || "N/A"}</div>
                          </Col>
                          <Col xs={24} sm={12}>
                            <Text strong>Date of Birth:</Text>
                            <div>
                              {user.dateOfBirth
                                ? moment(user.dateOfBirth).format("DD MMM YYYY")
                                : "N/A"}
                            </div>
                          </Col>
                          <Col xs={24} sm={12}>
                            <Text strong>Blood Group:</Text>
                            <div>{user.bloodGroup || "N/A"}</div>
                          </Col>
                          <Col xs={24} sm={12}>
                            <Text strong>Emergency Contact:</Text>
                            <div>{user.emergencyNumber || "N/A"}</div>
                          </Col>
                          <Col xs={24}>
                            <Title level={5}>Address Information</Title>
                          </Col>
                          <Col xs={24} sm={12}>
                            <Text strong>Street:</Text>
                            <div>{user.address?.street || "N/A"}</div>
                          </Col>
                          <Col xs={24} sm={12}>
                            <Text strong>City:</Text>
                            <div>{user.address?.city || "N/A"}</div>
                          </Col>
                          <Col xs={24} sm={12}>
                            <Text strong>State:</Text>
                            <div>{user.address?.state || "N/A"}</div>
                          </Col>
                          <Col xs={24} sm={12}>
                            <Text strong>Postal Code:</Text>
                            <div>{user.address?.postalCode || "N/A"}</div>
                          </Col>
                          <Col xs={24} sm={12}>
                            <Text strong>Country:</Text>
                            <div>{user.address?.country || "N/A"}</div>
                          </Col>
                        </Row>
                      </div>
                    )}
                  </div>
                )}
                {activeTab === "quotations" && (
                  <div>
                    <Title level={4}>My Quotations</Title>
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
                        className="profile-table"
                      />
                    )}
                  </div>
                )}
                {activeTab === "invoices" && (
                  <div>
                    <Title level={4}>My Invoices</Title>
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
                        className="profile-table"
                      />
                    )}
                  </div>
                )}
                {activeTab === "teams" && (
                  <div>
                    <Title level={4}>My Teams</Title>
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
                        className="profile-table"
                      />
                    )}
                  </div>
                )}
                {activeTab === "orders" && (
                  <div>
                    <Title level={4}>My Orders</Title>
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
                        className="profile-table"
                      />
                    )}
                  </div>
                )}
              </Card>
            </Col>
          </Row>
        </div>
      </div>
    </div>
  );
};

export default Profile;
