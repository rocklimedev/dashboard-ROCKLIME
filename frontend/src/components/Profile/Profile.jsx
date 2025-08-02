import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
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
import { toast } from "react-toastify";
import ProfileForm from "./ProfileForm";
import DataTable from "./DataTable";
import "./profile.css";
import Form from "antd/es/form/Form";
const Profile = () => {
  // Queries
  const {
    data: profile,
    isLoading: isProfileLoading,
    error: profileError,
    refetch: refetchProfile,
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

  // State management
  const [isEditing, setIsEditing] = useState(false);
  const [form] = Form.useForm();
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [activeTab, setActiveTab] = useState("profile");

  // Format roles
  const roles = Array.isArray(profile?.user?.roles)
    ? profile?.user?.roles.join(", ")
    : profile?.user?.roles || "User";

  // Handle address
  const address = profile?.user?.address
    ? `${profile.user.address.street || ""}, ${
        profile.user.address.city || ""
      }, ${profile.user.address.state || ""}, ${
        profile.user.address.country || ""
      } ${profile.user.address.postalCode || ""}`.trim()
    : "N/A";

  // Derive team from roles
  const team = profile?.user?.roles?.includes("SALES")
    ? "Sales Team"
    : profile?.user?.team || "N/A";

  // Format time
  const formatTime = (time) => {
    if (!time) return "N/A";
    const date = new Date(`1970-01-01T${time}`);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  // Format date
  const formatDate = (date) => {
    return date
      ? new Date(date).toLocaleDateString("en-US", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : "N/A";
  };

  // Initialize form
  useEffect(() => {
    const token =
      localStorage.getItem("token") || sessionStorage.getItem("token");
    if (!token) {
      toast.error("No authentication token found. Redirecting to login...");
      window.location.href = "/login";
    }

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

  // Handlers
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

  // Table columns
  const quotationColumns = [
    { title: "Title", dataIndex: "document_title", key: "document_title" },
    {
      title: "Amount",
      dataIndex: "finalAmount",
      key: "finalAmount",
      render: (text) => `₹${text || "N/A"}`,
    },
    {
      title: "Date",
      dataIndex: "quotation_date",
      key: "quotation_date",
      render: (text) => (text ? moment(text).format("DD MMM YYYY") : "N/A"),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (text) => (
        <span
          className={`badge ${
            text?.toLowerCase() === "pending"
              ? "bg-warning"
              : text?.toLowerCase() === "approved"
              ? "bg-success"
              : "bg-secondary"
          }`}
        >
          {text || "Pending"}
        </span>
      ),
    },
  ];

  const invoiceColumns = [
    { title: "Invoice No", dataIndex: "invoiceNo", key: "invoiceNo" },
    {
      title: "Amount",
      dataIndex: "amount",
      key: "amount",
      render: (text) => `₹${text || "N/A"}`,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (text) => (
        <span
          className={`badge ${
            text?.toLowerCase() === "paid"
              ? "bg-success"
              : text?.toLowerCase() === "unpaid"
              ? "bg-warning"
              : "bg-danger"
          }`}
        >
          {text || "N/A"}
        </span>
      ),
    },
    {
      title: "Invoice Date",
      dataIndex: "invoiceDate",
      key: "invoiceDate",
      render: (text) => (text ? moment(text).format("DD MMM YYYY") : "N/A"),
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
      render: (text) => (text ? moment(text).format("DD MMM YYYY") : "N/A"),
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
      render: (text) => (
        <span
          className={`badge ${
            text?.toLowerCase() === "pending"
              ? "bg-warning"
              : text?.toLowerCase() === "completed"
              ? "bg-success"
              : "bg-danger"
          }`}
        >
          {text || "N/A"}
        </span>
      ),
    },
    {
      title: "Due Date",
      dataIndex: "dueDate",
      key: "dueDate",
      render: (text) => (text ? moment(text).format("DD MMM YYYY") : "N/A"),
    },
  ];

  // Loading and error states
  if (isProfileLoading || isRolesLoading) {
    return (
      <div className="page-wrapper">
        <div className="content">
          <div className="text-center">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (profileError) {
    return (
      <div className="page-wrapper">
        <div className="content">
          <div className="alert alert-danger" role="alert">
            Error loading profile:{" "}
            {profileError?.data?.message || "Unknown error"}
            <button className="btn btn-link" onClick={refetchProfile}>
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (rolesError) {
    return (
      <div className="page-wrapper">
        <div className="content">
          <div className="alert alert-danger" role="alert">
            Error loading roles: {rolesError?.message || "Unknown error"}
          </div>
        </div>
      </div>
    );
  }

  if (!profile?.user || !userId) {
    return (
      <div className="page-wrapper">
        <div className="content">
          <div className="alert alert-info">
            No user profile data available.
          </div>
        </div>
      </div>
    );
  }

  const user = profile.user;

  return (
    <div className="page-wrapper">
      <div className="content">
        <div className="page-header">
          <div>
            <Link to="/users/list" className="d-inline-flex align-items-center">
              <i className="ti ti-chevron-left me-2"></i>Back to List
            </Link>
          </div>
        </div>
        <div className="row">
          <div className="col-xl-4 theiaStickySidebar">
            <div className="card rounded-0 border-0">
              <div className="card-header rounded-0 bg-primary d-flex align-items-center">
                <span className="avatar avatar-xl avatar-rounded flex-shrink-0 border border-white border-3 me-3">
                  <img
                    src={avatarUrl || "/assets/img/users/user-32.jpg"}
                    alt="User"
                  />
                </span>
                <div className="me-3">
                  <h6 className="text-white mb-1">{user.name || "N/A"}</h6>
                  <span className="badge bg-purple-transparent text-purple">
                    {roles}
                  </span>
                </div>
                <div>
                  <button
                    className="btn btn-white"
                    onClick={() => setIsEditing(true)}
                    disabled={isEditing}
                  >
                    Edit Profile
                  </button>
                </div>
              </div>
              <div className="card-body">
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <span className="d-inline-flex align-items-center">
                    <i className="ti ti-id me-2"></i>
                    Employee ID
                  </span>
                  <p className="text-dark">{user.userId}</p>
                </div>
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <span className="d-inline-flex align-items-center">
                    <i className="ti ti-star me-2"></i>
                    Team
                  </span>
                  <p className="text-dark">{team}</p>
                </div>
                <div className="d-flex align-items-center justify-content-between">
                  <span className="d-inline-flex align-items-center">
                    <i className="ti ti-calendar-check me-2"></i>
                    Date Of Join
                  </span>
                  <p className="text-dark">{formatDate(user.createdAt)}</p>
                </div>
              </div>
            </div>
          </div>
          <div className="col-xl-8">
            {isEditing ? (
              <div className="card rounded-0 border-0">
                <div className="card-header border-0 rounded-0 bg-light d-flex align-items-center">
                  <h6>Edit Profile</h6>
                </div>
                <div className="card-body">
                  <ProfileForm
                    form={form}
                    handleSave={handleSave}
                    isUpdating={isUpdating}
                    setIsEditing={setIsEditing}
                    handleAvatarUpload={handleAvatarUpload}
                  />
                </div>
              </div>
            ) : (
              <>
                <div className="card rounded-0 border-0">
                  <div className="card-header border-0 rounded-0 bg-light d-flex align-items-center">
                    <h6>Basic Information</h6>
                  </div>
                  <div className="card-body pb-0">
                    <div className="row">
                      <div className="col-md-4">
                        <div className="mb-3">
                          <p className="fs-13 mb-2">Phone</p>
                          <span className="text-gray-900 fs-13">
                            {user.mobileNumber || "N/A"}
                          </span>
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="mb-3">
                          <p className="fs-13 mb-2">Email</p>
                          <span className="text-gray-900 fs-13">
                            <a href={`mailto:${user.email}`}>{user.email}</a>
                          </span>
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="mb-3">
                          <p className="fs-13 mb-2">Username</p>
                          <span className="text-gray-900 fs-13">
                            {user.username || "N/A"}
                          </span>
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="mb-3">
                          <p className="fs-13 mb-2">Birthday</p>
                          <span className="text-gray-900 fs-13">
                            {formatDate(user.dateOfBirth)}
                          </span>
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="mb-3">
                          <p className="fs-13 mb-2">Address</p>
                          <span className="text-gray-900 fs-13">{address}</span>
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="mb-3">
                          <p className="fs-13 mb-2">Blood Group</p>
                          <span className="text-gray-900 fs-13">
                            {user.bloodGroup || "N/A"}
                          </span>
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="mb-3">
                          <p className="fs-13 mb-2">Shift</p>
                          <span className="text-gray-900 fs-13">
                            {user.shiftFrom && user.shiftTo
                              ? `${formatTime(user.shiftFrom)} - ${formatTime(
                                  user.shiftTo
                                )}`
                              : "N/A"}
                          </span>
                        </div>
                      </div>

                      <div className="col-md-4">
                        <div className="mb-3">
                          <p className="fs-13 mb-2">Emergency Contact</p>
                          <span className="text-gray-900 fs-13">
                            {user.emergencyNumber || "N/A"}
                          </span>
                        </div>
                      </div>

                      <div className="col-md-4">
                        <div className="mb-3">
                          <p className="fs-13 mb-2">Status</p>
                          <span className="text-gray-900 fs-13">
                            {user.status || "N/A"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="card rounded-0 border-0">
                  <div className="card-header border-0 rounded-0 bg-light">
                    <ul
                      className="nav nav-pills border d-inline-flex p-1 rounded bg-light"
                      id="pills-tab"
                      role="tablist"
                    >
                      {["Quotations", "Invoices", "Teams", "Orders"].map(
                        (tab) => (
                          <li
                            className="nav-item"
                            role="presentation"
                            key={tab}
                          >
                            <button
                              className={`nav-link btn btn-sm btn-icon py-3 d-flex align-items-center justify-content-center w-auto ${
                                activeTab === tab.toLowerCase() ? "active" : ""
                              }`}
                              id={`tab-${tab}`}
                              data-bs-toggle="pill"
                              data-bs-target={`#pills-${tab}`}
                              type="button"
                              role="tab"
                              aria-selected={activeTab === tab.toLowerCase()}
                              onClick={() => setActiveTab(tab.toLowerCase())}
                            >
                              {tab}
                            </button>
                          </li>
                        )
                      )}
                    </ul>
                  </div>
                  <div className="card-body">
                    <div className="tab-content" id="pills-tabContent">
                      <div
                        className={`tab-pane fade ${
                          activeTab === "quotations" ? "show active" : ""
                        }`}
                        id="pills-Quotations"
                        role="tabpanel"
                        aria-labelledby="tab-Quotations"
                      >
                        <DataTable
                          title="My Quotations"
                          columns={quotationColumns}
                          dataSource={quotationsData?.data || []}
                          isLoading={isQuotationsLoading}
                          error={quotationsError}
                          rowKey="quotationId"
                          className="table table-hover"
                        />
                      </div>
                      <div
                        className={`tab-pane fade ${
                          activeTab === "invoices" ? "show active" : ""
                        }`}
                        id="pills-Invoices"
                        role="tabpanel"
                        aria-labelledby="tab-Invoices"
                      >
                        <DataTable
                          title="My Invoices"
                          columns={invoiceColumns}
                          dataSource={invoicesData?.data || []}
                          isLoading={isInvoicesLoading}
                          error={invoicesError}
                          rowKey="invoiceId"
                          className="table table-hover"
                        />
                      </div>
                      <div
                        className={`tab-pane fade ${
                          activeTab === "teams" ? "show active" : ""
                        }`}
                        id="pills-Teams"
                        role="tabpanel"
                        aria-labelledby="tab-Teams"
                      >
                        <DataTable
                          title="My Teams"
                          columns={teamColumns}
                          dataSource={teamsData?.teams || []}
                          isLoading={isTeamsLoading}
                          error={teamsError}
                          rowKey="id"
                          className="table table-hover"
                        />
                      </div>
                      <div
                        className={`tab-pane fade ${
                          activeTab === "orders" ? "show active" : ""
                        }`}
                        id="pills-Orders"
                        role="tabpanel"
                        aria-labelledby="tab-Orders"
                      >
                        <DataTable
                          title="My Orders"
                          columns={orderColumns}
                          dataSource={ordersData?.orders || []}
                          isLoading={isOrdersLoading}
                          error={ordersError}
                          rowKey="id"
                          className="table table-hover"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
