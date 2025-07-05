import React, { useState, useEffect } from "react";
import { Row, Col, Spin, Alert, Form, Badge } from "antd";
import {
  useGetProfileQuery,
  useUpdateProfileMutation,
} from "../../api/userApi";
import { useGetRolesQuery } from "../../api/rolesApi";
import { useForgotPasswordMutation } from "../../api/authApi";
import { useGetAllQuotationsQuery } from "../../api/quotationApi";
import { useGetAllTeamsQuery } from "../../api/teamApi";
import { useGetAllInvoicesQuery } from "../../api/invoiceApi";
import { useGetAllOrdersQuery } from "../../api/orderApi";
import moment from "moment";
import { toast } from "sonner";
import ProfileSidebar from "./ProfileSidebar";
import ProfileForm from "./ProfileForm";
import ProfileDetails from "./ProfileDetails";
import DataTable from "./DataTable";
import "./profile.css";

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

  const userId = profile?.user?.userId;

  const {
    data: quotationsData,
    isLoading: isQuotationsLoading,
    error: quotationsError,
  } = useGetAllQuotationsQuery({ userId }, { skip: !userId });
  const {
    data: invoicesData,
    isLoading: isInvoicesLoading,
    error: invoicesError,
  } = useGetAllInvoicesQuery({ userId }, { skip: !userId });
  const {
    data: ordersData,
    isLoading: isOrdersLoading,
    error: ordersError,
  } = useGetAllOrdersQuery({ userId }, { skip: !userId });
  const {
    data: teamsData,
    isLoading: isTeamsLoading,
    error: teamsError,
  } = useGetAllTeamsQuery({ userId }, { skip: !userId });

  const [isEditing, setIsEditing] = useState(false);
  const [form] = Form.useForm();
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [activeTab, setActiveTab] = useState("profile");

  useEffect(() => {
    const token =
      localStorage.getItem("token") || sessionStorage.getItem("token");
    if (!token) {
      toast.error("No authentication token found. Redirecting to login...");
      window.location.href = "/login";
    }
  }, []);

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

  const handleAvatarUpload = ({ file }) => {
    if (file.status === "done") {
      setAvatarUrl(file.response.url);
      localStorage.setItem(`avatar_${profile.user.userId}`, file.response.url);
      toast.success("Avatar uploaded successfully!");
    } else if (file.status === "error") {
      toast.error("Failed to upload avatar.");
    }
  };

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

  const quotationColumns = [
    { title: "Title", dataIndex: "document_title", key: "document_title" },
    {
      title: "Amount",
      dataIndex: "finalAmount",
      key: "finalAmount",
      render: (text) => `₹${text}`,
    },
    {
      title: "Date",
      dataIndex: "quotation_date",
      key: "quotation_date",
      render: (text) => moment(text).format("DD MMM YYYY"),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (text) => <Badge status="processing" text={text || "Pending"} />,
    },
  ];

  const invoiceColumns = [
    { title: "Invoice No", dataIndex: "invoiceNo", key: "invoiceNo" },
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
    {
      title: "Invoice Date",
      dataIndex: "invoiceDate",
      key: "invoiceDate",
      render: (text) => moment(text).format("DD MMM YYYY"),
    },
  ];

  const teamColumns = [
    { title: "Team Name", dataIndex: "teamName", key: "teamName" },
    { title: "Admin Name", dataIndex: "adminName", key: "adminName" },
    { title: "User Role", dataIndex: "roleName", key: "roleName" },
    {
      title: "Created At",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (text) => moment(text).format("DD MMM YYYY"),
    },
  ];

  const orderColumns = [
    { title: "Title", dataIndex: "title", key: "title" },
    {
      title: "Total",
      dataIndex: "totalAmount",
      key: "totalAmount",
      render: (text) => `₹${text || "N/A"}`,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (text) => <Badge status="warning" text={text} />,
    },
    {
      title: "Due Date",
      dataIndex: "dueDate",
      key: "dueDate",
      render: (text) => (text ? moment(text).format("DD MMM YYYY") : "N/A"),
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
  if (!userId)
    return <Alert message="No user ID available" type="warning" showIcon />;

  const user = profile.user;

  return (
    <div className="page-wrapper">
      <div className="content">
        <div className="ecommerce-profile-wrapper">
          <Row gutter={[16, 16]}>
            <Col xs={24} md={6}>
              <ProfileSidebar
                user={user}
                avatarUrl={avatarUrl}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                handleAvatarUpload={handleAvatarUpload}
                handleForgotPassword={handleForgotPassword}
                isResetting={isResetting}
              />
            </Col>
            <Col xs={24} md={18}>
              <div className="content-card card">
                {activeTab === "profile" &&
                  (isEditing ? (
                    <ProfileForm
                      form={form}
                      handleSave={handleSave}
                      isUpdating={isUpdating}
                      setIsEditing={setIsEditing}
                    />
                  ) : (
                    <ProfileDetails user={user} setIsEditing={setIsEditing} />
                  ))}
                {activeTab === "quotations" && (
                  <DataTable
                    title="My Quotations"
                    columns={quotationColumns}
                    dataSource={quotationsData}
                    isLoading={isQuotationsLoading}
                    error={quotationsError}
                    rowKey="quotationId"
                  />
                )}
                {activeTab === "invoices" && (
                  <DataTable
                    title="My Invoices"
                    columns={invoiceColumns}
                    dataSource={invoicesData?.data}
                    isLoading={isInvoicesLoading}
                    error={invoicesError}
                    rowKey="invoiceId"
                  />
                )}
                {activeTab === "teams" && (
                  <DataTable
                    title="My Teams"
                    columns={teamColumns}
                    dataSource={teamsData?.teams}
                    isLoading={isTeamsLoading}
                    error={teamsError}
                    rowKey="id"
                  />
                )}
                {activeTab === "orders" && (
                  <DataTable
                    title="My Orders"
                    columns={orderColumns}
                    dataSource={ordersData?.orders}
                    isLoading={isOrdersLoading}
                    error={ordersError}
                    rowKey="id"
                  />
                )}
              </div>
            </Col>
          </Row>
        </div>
      </div>
    </div>
  );
};

export default Profile;
