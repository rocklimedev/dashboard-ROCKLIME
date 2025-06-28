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
        <Row gutter={[24, 24]}>
          {/* Profile Details and Tabs */}
          <Col xs={24} lg={24}>
            <Card className="profile-details-card">
              <Tabs defaultActiveKey="1" className="profile-tabs">
                <TabPane
                  tab={
                    <span>
                      <UserOutlined /> Profile
                    </span>
                  }
                  key="1"
                >
                  {isEditing ? (
                    <Form
                      form={form}
                      layout="vertical"
                      onFinish={handleSave}
                      className="profile-form"
                    >
                      <div className="profile-body">
                        <Title level={5} className="section-title">
                          Personal Information
                        </Title>
                        <Row gutter={[16, 16]}>
                          <Col xs={24} sm={12}>
                            <Form.Item
                              label={
                                <span className="form-label">Username</span>
                              }
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
                              <Input className="form-control" />
                            </Form.Item>
                          </Col>
                          <Col xs={24} sm={12}>
                            <Form.Item
                              label={<span className="form-label">Name</span>}
                              name="name"
                              rules={[
                                { required: true, message: "Name is required" },
                                {
                                  max: 100,
                                  message: "Name cannot exceed 100 characters",
                                },
                              ]}
                            >
                              <Input className="form-control" />
                            </Form.Item>
                          </Col>
                          <Col xs={24} sm={12}>
                            <Form.Item
                              label={<span className="form-label">Email</span>}
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
                              <Input className="form-control" />
                            </Form.Item>
                          </Col>
                          <Col xs={24} sm={12}>
                            <Form.Item
                              label={
                                <span className="form-label">Phone Number</span>
                              }
                              name="mobileNumber"
                              rules={[
                                {
                                  pattern: /^[0-9]{10}$/,
                                  message: "Phone number must be 10 digits",
                                },
                              ]}
                            >
                              <Input className="form-control" />
                            </Form.Item>
                          </Col>
                          <Col xs={24} sm={12}>
                            <Form.Item
                              label={
                                <span className="form-label">
                                  Date of Birth
                                </span>
                              }
                              name="dateOfBirth"
                            >
                              <DatePicker
                                className="form-control"
                                style={{ width: "100%" }}
                              />
                            </Form.Item>
                          </Col>
                          <Col xs={24} sm={12}>
                            <Form.Item
                              label={
                                <span className="form-label">Blood Group</span>
                              }
                              name="bloodGroup"
                            >
                              <Select
                                allowClear
                                placeholder="Select blood group"
                                className="form-control"
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
                              label={
                                <span className="form-label">
                                  Emergency Contact
                                </span>
                              }
                              name="emergencyNumber"
                              rules={[
                                {
                                  pattern: /^[0-9]{10}$/,
                                  message: "Emergency number must be 10 digits",
                                },
                              ]}
                            >
                              <Input className="form-control" />
                            </Form.Item>
                          </Col>
                          <Col xs={24}>
                            <Title level={5} className="section-title">
                              Work Information
                            </Title>
                          </Col>
                          <Col xs={24} sm={12}>
                            <Form.Item
                              label={
                                <span className="form-label">Shift Start</span>
                              }
                              name="shiftFrom"
                            >
                              <TimePicker
                                format="HH:mm"
                                className="form-control"
                                style={{ width: "100%" }}
                              />
                            </Form.Item>
                          </Col>
                          <Col xs={24} sm={12}>
                            <Form.Item
                              label={
                                <span className="form-label">Shift End</span>
                              }
                              name="shiftTo"
                            >
                              <TimePicker
                                format="HH:mm"
                                className="form-control"
                                style={{ width: "100%" }}
                              />
                            </Form.Item>
                          </Col>
                          <Col xs={24}>
                            <Title level={5} className="section-title">
                              Address Information
                            </Title>
                          </Col>
                          <Col xs={24} sm={12}>
                            <Form.Item
                              label={<span className="form-label">Street</span>}
                              name="street"
                            >
                              <Input className="form-control" />
                            </Form.Item>
                          </Col>
                          <Col xs={24} sm={12}>
                            <Form.Item
                              label={<span className="form-label">City</span>}
                              name="city"
                            >
                              <Input className="form-control" />
                            </Form.Item>
                          </Col>
                          <Col xs={24} sm={12}>
                            <Form.Item
                              label={<span className="form-label">State</span>}
                              name="state"
                            >
                              <Input className="form-control" />
                            </Form.Item>
                          </Col>
                          <Col xs={24} sm={12}>
                            <Form.Item
                              label={
                                <span className="form-label">Postal Code</span>
                              }
                              name="postalCode"
                            >
                              <Input className="form-control" />
                            </Form.Item>
                          </Col>
                          <Col xs={24} sm={12}>
                            <Form.Item
                              label={
                                <span className="form-label">Country</span>
                              }
                              name="country"
                            >
                              <Input className="form-control" />
                            </Form.Item>
                          </Col>
                          <Col xs={24}>
                            <Space className="form-actions">
                              <Button
                                type="primary"
                                htmlType="submit"
                                loading={isUpdating}
                                className="btn btn-success"
                              >
                                Save Changes
                              </Button>
                              <Button
                                onClick={() => setIsEditing(false)}
                                className="btn btn-secondary"
                              >
                                Cancel
                              </Button>
                            </Space>
                          </Col>
                        </Row>
                      </div>
                    </Form>
                  ) : (
                    <div className="profile-body">
                      <Title level={5} className="section-title">
                        Personal Information
                      </Title>
                      <Row gutter={[16, 16]} className="info-section">
                        <Col xs={24} sm={12}>
                          <Text strong className="form-label">
                            Username:
                          </Text>
                          <div className="form-control-static">
                            {user.username}
                          </div>
                        </Col>
                        <Col xs={24} sm={12}>
                          <Text strong className="form-label">
                            Name:
                          </Text>
                          <div className="form-control-static">{user.name}</div>
                        </Col>
                        <Col xs={24} sm={12}>
                          <Text strong className="form-label">
                            Email:
                          </Text>
                          <div className="form-control-static">
                            {user.email}
                          </div>
                        </Col>
                        <Col xs={24} sm={12}>
                          <Text strong className="form-label">
                            Phone:
                          </Text>
                          <div className="form-control-static">
                            {user.mobileNumber || "N/A"}
                          </div>
                        </Col>
                        <Col xs={24} sm={12}>
                          <Text strong className="form-label">
                            Date of Birth:
                          </Text>
                          <div className="form-control-static">
                            {user.dateOfBirth
                              ? moment(user.dateOfBirth).format("DD MMM YYYY")
                              : "N/A"}
                          </div>
                        </Col>
                        <Col xs={24} sm={12}>
                          <Text strong className="form-label">
                            Blood Group:
                          </Text>
                          <div className="form-control-static">
                            {user.bloodGroup || "N/A"}
                          </div>
                        </Col>
                        <Col xs={24} sm={12}>
                          <Text strong className="form-label">
                            Emergency Contact:
                          </Text>
                          <div className="form-control-static">
                            {user.emergencyNumber || "N/A"}
                          </div>
                        </Col>
                      </Row>
                      <Title level={5} className="section-title">
                        Work Information
                      </Title>
                      <Row gutter={[16, 16]} className="info-section">
                        <Col xs={24} sm={12}>
                          <Text strong className="form-label">
                            Roles:
                          </Text>
                          <div className="form-control-static">{roleName}</div>
                        </Col>
                        <Col xs={24} sm={12}>
                          <Text strong className="form-label">
                            Shift:
                          </Text>
                          <div className="form-control-static">
                            {user.shiftFrom && user.shiftTo
                              ? `${moment(user.shiftFrom, "HH:mm:ss").format(
                                  "HH:mm"
                                )} - ${moment(user.shiftTo, "HH:mm:ss").format(
                                  "HH:mm"
                                )}`
                              : "N/A"}
                          </div>
                        </Col>
                      </Row>
                      <Title level={5} className="section-title">
                        Address Information
                      </Title>
                      <Row gutter={[16, 16]} className="info-section">
                        <Col xs={24} sm={12}>
                          <Text strong className="form-label">
                            Street:
                          </Text>
                          <div className="form-control-static">
                            {user.address?.street || "N/A"}
                          </div>
                        </Col>
                        <Col xs={24} sm={12}>
                          <Text strong className="form-label">
                            City:
                          </Text>
                          <div className="form-control-static">
                            {user.address?.city || "N/A"}
                          </div>
                        </Col>
                        <Col xs={24} sm={12}>
                          <Text strong className="form-label">
                            State:
                          </Text>
                          <div className="form-control-static">
                            {user.address?.state || "N/A"}
                          </div>
                        </Col>
                        <Col xs={24} sm={12}>
                          <Text strong className="form-label">
                            Postal Code:
                          </Text>
                          <div className="form-control-static">
                            {user.address?.postalCode || "N/A"}
                          </div>
                        </Col>
                        <Col xs={24} sm={12}>
                          <Text strong className="form-label">
                            Country:
                          </Text>
                          <div className="form-control-static">
                            {user.address?.country || "N/A"}
                          </div>
                        </Col>
                      </Row>
                    </div>
                  )}
                </TabPane>
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
                      className="profile-table"
                    />
                  )}
                </TabPane>
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
                      className="profile-table"
                    />
                  )}
                </TabPane>
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
                      className="profile-table"
                    />
                  )}
                </TabPane>
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
                      className="profile-table"
                    />
                  )}
                </TabPane>
              </Tabs>
            </Card>
          </Col>
        </Row>
      </div>
    </div>
  );
};

export default Profile;
