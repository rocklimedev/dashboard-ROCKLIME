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
import { useGetPurchaseOrdersQuery } from "../../api/poApi";
import {
  useGetAllAddressesQuery,
  useCreateAddressMutation,
  useUpdateAddressMutation,
  useDeleteAddressMutation,
} from "../../api/addressApi";
import {
  useGetAllSignaturesQuery,
  useCreateSignatureMutation,
  useUpdateSignatureMutation,
  useDeleteSignatureMutation,
} from "../../api/signatureApi";
import moment from "moment";
import { toast } from "react-toastify";
import ProfileForm from "./ProfileForm";
import DataTable from "./DataTable";
import Avatar from "react-avatar";
import "./profile.css";
import {
  LeftOutlined,
  TeamOutlined,
  CalendarOutlined,
  EnvironmentOutlined,
} from "@ant-design/icons";
import { Button, Modal, Input, Form as AntdForm, Switch, Image } from "antd";

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
  const {
    data: purchaseOrdersData,
    isLoading: isPurchaseOrdersLoading,
    error: purchaseOrdersError,
  } = useGetPurchaseOrdersQuery(
    { userId, page: 1, limit: 10 },
    { skip: !userId }
  );
  const {
    data: addressesData,
    isLoading: isAddressesLoading,
    error: addressesError,
    refetch: refetchAddresses,
  } = useGetAllAddressesQuery({}, { skip: !userId });
  const [createAddress, { isLoading: isCreatingAddress }] =
    useCreateAddressMutation();
  const [updateAddress, { isLoading: isUpdatingAddress }] =
    useUpdateAddressMutation();
  const [deleteAddress, { isLoading: isDeletingAddress }] =
    useDeleteAddressMutation();
  const {
    data: signaturesData,
    isLoading: isSignaturesLoading,
    error: signaturesError,
    refetch: refetchSignatures,
  } = useGetAllSignaturesQuery({}, { skip: !userId });
  const [createSignature, { isLoading: isCreatingSignature }] =
    useCreateSignatureMutation();
  const [updateSignature, { isLoading: isUpdatingSignature }] =
    useUpdateSignatureMutation();
  const [deleteSignature, { isLoading: isDeletingSignature }] =
    useDeleteSignatureMutation();

  // State management
  const [isEditing, setIsEditing] = useState(false);
  const [form] = AntdForm.useForm();
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [activeTab, setActiveTab] = useState("profile");
  const [isAddressModalVisible, setIsAddressModalVisible] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [addressForm] = AntdForm.useForm();
  const [isSignatureModalVisible, setIsSignatureModalVisible] = useState(false);
  const [editingSignature, setEditingSignature] = useState(null);
  const [signatureForm] = AntdForm.useForm();

  // Check if user is SUPER_ADMIN
  const isSuperAdmin = profile?.user?.roles?.includes("SUPER_ADMIN");

  // Format roles
  const roles = Array.isArray(profile?.user?.roles)
    ? profile?.user?.roles.join(", ")
    : profile?.user?.roles || "User";

  // Handle address display
  const address =
    addressesData?.length > 0
      ? `${addressesData[0].street || ""}, ${addressesData[0].city || ""}, ${
          addressesData[0].state || ""
        }, ${addressesData[0].country || ""} ${
          addressesData[0].postalCode || ""
        }`.trim()
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
      setIsEditing(false);
    } catch (error) {
      toast.error(
        `Failed to update profile: ${error.data?.message || "Unknown error"}`
      );
    }
  };

  // Address Modal Handlers
  const showAddressModal = (address = null) => {
    setEditingAddress(address);
    if (address) {
      addressForm.setFieldsValue({
        street: address.street || "",
        city: address.city || "",
        state: address.state || "",
        postalCode: address.postalCode || "",
        country: address.country || "",
      });
    } else {
      addressForm.resetFields();
    }
    setIsAddressModalVisible(true);
  };

  const handleAddressSubmit = async (values) => {
    try {
      if (editingAddress) {
        await updateAddress({
          addressId: editingAddress.addressId,
          updatedData: { ...values, userId },
        }).unwrap();
      } else {
        await createAddress({ ...values, userId }).unwrap();
      }
      setIsAddressModalVisible(false);
      addressForm.resetFields();
      refetchAddresses();
    } catch (error) {
      toast.error(
        `Failed to ${editingAddress ? "update" : "add"} address: ${
          error.data?.message || "Unknown error"
        }`
      );
    }
  };

  const handleDeleteAddress = async (addressId) => {
    try {
      await deleteAddress(addressId).unwrap();

      refetchAddresses();
    } catch (error) {
      toast.error(
        `Failed to delete address: ${error.data?.message || "Unknown error"}`
      );
    }
  };

  // Signature Modal Handlers
  const showSignatureModal = (signature = null) => {
    setEditingSignature(signature);
    if (signature) {
      signatureForm.setFieldsValue({
        signature_name: signature.signature_name || "",
        signature_image: signature.signature_image || "",
        mark_as_default: signature.mark_as_default || false,
      });
    } else {
      signatureForm.resetFields();
    }
    setIsSignatureModalVisible(true);
  };

  const handleSignatureSubmit = async (values) => {
    try {
      if (editingSignature) {
        await updateSignature({
          id: editingSignature.signatureId,
          body: { ...values, userId },
        }).unwrap();
      } else {
        await createSignature({ ...values, userId }).unwrap();
      }
      setIsSignatureModalVisible(false);
      signatureForm.resetFields();
      refetchSignatures();
    } catch (error) {
      toast.error(
        `Failed to ${editingSignature ? "update" : "add"} signature: ${
          error.data?.message || "Unknown error"
        }`
      );
    }
  };

  const handleDeleteSignature = async (signatureId) => {
    try {
      await deleteSignature(signatureId).unwrap();

      refetchSignatures();
    } catch (error) {
      toast.error(
        `Failed to delete signature: ${error.data?.message || "Unknown error"}`
      );
    }
  };

  // Table columns
  const quotationColumns = [
    {
      title: "Document Title",
      dataIndex: "document_title",
      key: "document_title",
      render: (text) => text || "N/A",
    },
    {
      title: "Quotation Date",
      dataIndex: "quotation_date",
      key: "quotation_date",
      render: (text) => formatDate(text),
    },
    {
      title: "Due Date",
      dataIndex: "due_date",
      key: "due_date",
      render: (text) => formatDate(text),
    },
    {
      title: "Reference Number",
      dataIndex: "reference_number",
      key: "reference_number",
      render: (text) => text || "N/A",
    },
    {
      title: "Final Amount",
      dataIndex: "finalAmount",
      key: "finalAmount",
      render: (text) => `₹${parseFloat(text).toFixed(2)}` || "N/A",
    },
    {
      title: "Signature Name",
      dataIndex: "signature_name",
      key: "signature_name",
      render: (text) => text || "N/A",
    },
    {
      title: "Created At",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (text) => formatDate(text),
    },
  ];

  const teamColumns = [
    {
      title: "Team Name",
      dataIndex: "teamName",
      key: "teamName",
      render: (text) => text || "N/A",
    },
    {
      title: "Admin Name",
      dataIndex: "adminName",
      key: "adminName",
      render: (text) => text || "N/A",
    },
    {
      title: "Members",
      dataIndex: "teammembers",
      key: "teammembers",
      render: (members) =>
        members?.map((member) => member.userName).join(", ") || "N/A",
    },
    {
      title: "Created At",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (text) => formatDate(text),
    },
    {
      title: "Updated At",
      dataIndex: "updatedAt",
      key: "updatedAt",
      render: (text) => formatDate(text),
    },
  ];

  const orderColumns = [
    {
      title: "Order Number",
      dataIndex: "orderNo",
      key: "orderNo",
      render: (text) => text || "N/A",
    },
    {
      title: "Customer",
      dataIndex: "customers",
      key: "customers",
      render: (customers) => customers?.name || "N/A",
    },
    {
      title: "Source",
      dataIndex: "source",
      key: "source",
      render: (text) => text || "N/A",
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (text) => text || "N/A",
    },
    {
      title: "Due Date",
      dataIndex: "dueDate",
      key: "dueDate",
      render: (text) => formatDate(text),
    },
    {
      title: "Priority",
      dataIndex: "priority",
      key: "priority",
      render: (text) => text || "N/A",
    },
    {
      title: "Created By",
      dataIndex: "users",
      key: "users",
      render: (users) => users?.name || "N/A",
    },
    {
      title: "Created At",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (text) => formatDate(text),
    },
  ];

  const purchaseOrderColumns = [
    {
      title: "PO Number",
      dataIndex: "poNumber",
      key: "poNumber",
      render: (text) => text || "N/A",
    },
    {
      title: "Vendor",
      dataIndex: "Vendor",
      key: "Vendor",
      render: (vendor) => vendor?.vendorName || "N/A",
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (text) => text || "N/A",
    },
    {
      title: "Order Date",
      dataIndex: "orderDate",
      key: "orderDate",
      render: (text) => formatDate(text),
    },
    {
      title: "Expected Delivery",
      dataIndex: "expectDeliveryDate",
      key: "expectDeliveryDate",
      render: (text) => formatDate(text),
    },
    {
      title: "Total Amount",
      dataIndex: "totalAmount",
      key: "totalAmount",
      render: (text) => `₹${parseFloat(text).toFixed(2)}` || "N/A",
    },
    {
      title: "Created At",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (text) => formatDate(text),
    },
  ];
  const addressColumns = [
    {
      title: "Street",
      dataIndex: "street",
      key: "street",
      render: (text) => text || "N/A",
    },
    {
      title: "City",
      dataIndex: "city",
      key: "city",
      render: (text) => text || "N/A",
    },
    {
      title: "State",
      dataIndex: "state",
      key: "state",
      render: (text) => text || "N/A",
    },
    {
      title: "Postal Code",
      dataIndex: "postalCode",
      key: "postalCode",
      render: (text) => text || "N/A",
    },
    {
      title: "Country",
      dataIndex: "country",
      key: "country",
      render: (text) => text || "N/A",
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <div>
          <Button type="link" onClick={() => showAddressModal(record)}>
            Edit
          </Button>
          <Button
            type="link"
            danger
            onClick={() => handleDeleteAddress(record.addressId)}
            disabled={isDeletingAddress}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ];

  const signatureColumns = [
    {
      title: "Signature Name",
      dataIndex: "signature_name",
      key: "signature_name",
      render: (text) => text || "N/A",
    },
    {
      title: "Signature Image",
      dataIndex: "signature_image",
      key: "signature_image",
      render: (text) =>
        text ? (
          <Image src={text} alt="Signature" width={100} preview={true} />
        ) : (
          "N/A"
        ),
    },
    {
      title: "Default",
      dataIndex: "mark_as_default",
      key: "mark_as_default",
      render: (value) => (value ? "Yes" : "No"),
    },
    {
      title: "Created At",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (text) => formatDate(text),
    },
    {
      title: "Updated At",
      dataIndex: "updatedAt",
      key: "updatedAt",
      render: (text) => formatDate(text),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <div>
          <Button type="link" onClick={() => showSignatureModal(record)}>
            Edit
          </Button>
          <Button
            type="link"
            danger
            onClick={() => handleDeleteSignature(record.signatureId)}
            disabled={isDeletingSignature}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ];

  // Loading and error states
  if (
    isProfileLoading ||
    isRolesLoading ||
    isAddressesLoading ||
    (isSuperAdmin && isSignaturesLoading)
  ) {
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

  if (profileError || addressesError || (isSuperAdmin && signaturesError)) {
    return (
      <div className="page-wrapper">
        <div className="content">
          <div className="alert alert-danger" role="alert">
            Error loading data:{" "}
            {profileError?.data?.message ||
              addressesError?.data?.message ||
              signaturesError?.data?.message ||
              "Unknown error"}
            <button
              className="btn btn-link"
              onClick={() => {
                refetchProfile();
                refetchAddresses();
                if (isSuperAdmin) refetchSignatures();
              }}
            >
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
              <LeftOutlined />
              Back to List
            </Link>
          </div>
        </div>
        <div className="row">
          <div className="col-xl-4 theiaStickySidebar">
            <div className="card rounded-0 border-0">
              <div className="card-header rounded-0 bg-primary d-flex align-items-center">
                <span className="avatar avatar-xl avatar-rounded flex-shrink-0 border border-white border-3 me-3">
                  <Avatar
                    src={avatarUrl || undefined}
                    name={user.name || "User"}
                    size="60"
                    round={true}
                    textSizeRatio={2.5}
                    alt="User Avatar"
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
                    <TeamOutlined />
                    Team
                  </span>
                  <p className="text-dark">{team}</p>
                </div>
                <div className="d-flex align-items-center justify-content-between">
                  <span className="d-inline-flex align-items-center">
                    <CalendarOutlined />
                    Date Of Join
                  </span>
                  <p className="text-dark">{formatDate(user.createdAt)}</p>
                </div>
                <div className="d-flex align-items-center justify-content-between">
                  <span className="d-inline-flex align-items-center">
                    <EnvironmentOutlined />
                    Primary Address
                  </span>
                  <p className="text-dark">{address}</p>
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
                      {[
                        "Quotations",
                        "Teams",
                        "Orders",
                        "Purchase Orders",
                        "Addresses",
                        ...(isSuperAdmin ? ["Signatures"] : []),
                      ].map((tab) => (
                        <li className="nav-item" role="presentation" key={tab}>
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
                      ))}
                    </ul>
                    {activeTab === "addresses" && (
                      <Button
                        type="primary"
                        className="float-end"
                        onClick={() => showAddressModal()}
                      >
                        Add Address
                      </Button>
                    )}
                    {activeTab === "signatures" && isSuperAdmin && (
                      <Button
                        type="primary"
                        className="float-end"
                        onClick={() => showSignatureModal()}
                      >
                        Add Signature
                      </Button>
                    )}
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
                          dataSource={quotationsData || []}
                          isLoading={isQuotationsLoading}
                          error={quotationsError}
                          rowKey="quotationId"
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
                      <div
                        className={`tab-pane fade ${
                          activeTab === "purchase orders" ? "show active" : ""
                        }`}
                        id="pills-Purchase Orders"
                        role="tabpanel"
                        aria-labelledby="tab-Purchase Orders"
                      >
                        <DataTable
                          title="My Purchase Orders"
                          columns={purchaseOrderColumns}
                          dataSource={purchaseOrdersData?.purchaseOrders || []}
                          isLoading={isPurchaseOrdersLoading}
                          error={purchaseOrdersError}
                          rowKey="id"
                          className="table table-hover"
                        />
                      </div>
                      <div
                        className={`tab-pane fade ${
                          activeTab === "addresses" ? "show active" : ""
                        }`}
                        id="pills-Addresses"
                        role="tabpanel"
                        aria-labelledby="tab-Addresses"
                      >
                        <DataTable
                          title="My Addresses"
                          columns={addressColumns}
                          dataSource={addressesData || []}
                          isLoading={isAddressesLoading}
                          error={addressesError}
                          rowKey="addressId"
                          className="table table-hover"
                        />
                      </div>
                      {isSuperAdmin && (
                        <div
                          className={`tab-pane fade ${
                            activeTab === "signatures" ? "show active" : ""
                          }`}
                          id="pills-Signatures"
                          role="tabpanel"
                          aria-labelledby="tab-Signatures"
                        >
                          <DataTable
                            title="My Signatures"
                            columns={signatureColumns}
                            dataSource={signaturesData || []}
                            isLoading={isSignaturesLoading}
                            error={signaturesError}
                            rowKey="signatureId"
                            className="table table-hover"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Address Modal */}
      <Modal
        title={editingAddress ? "Edit Address" : "Add Address"}
        visible={isAddressModalVisible}
        onCancel={() => setIsAddressModalVisible(false)}
        footer={null}
      >
        <AntdForm
          form={addressForm}
          onFinish={handleAddressSubmit}
          layout="vertical"
        >
          <AntdForm.Item
            name="street"
            label="Street"
            rules={[{ required: true, message: "Please enter the street" }]}
          >
            <Input />
          </AntdForm.Item>
          <AntdForm.Item
            name="city"
            label="City"
            rules={[{ required: true, message: "Please enter the city" }]}
          >
            <Input />
          </AntdForm.Item>
          <AntdForm.Item
            name="state"
            label="State"
            rules={[{ required: true, message: "Please enter the state" }]}
          >
            <Input />
          </AntdForm.Item>
          <AntdForm.Item
            name="postalCode"
            label="Postal Code"
            rules={[
              { required: true, message: "Please enter the postal code" },
            ]}
          >
            <Input />
          </AntdForm.Item>
          <AntdForm.Item
            name="country"
            label="Country"
            rules={[{ required: true, message: "Please enter the country" }]}
          >
            <Input />
          </AntdForm.Item>
          <AntdForm.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={isCreatingAddress || isUpdatingAddress}
            >
              {editingAddress ? "Update Address" : "Add Address"}
            </Button>
            <Button
              className="ms-2"
              onClick={() => setIsAddressModalVisible(false)}
            >
              Cancel
            </Button>
          </AntdForm.Item>
        </AntdForm>
      </Modal>

      {/* Signature Modal */}
      <Modal
        title={editingSignature ? "Edit Signature" : "Add Signature"}
        visible={isSignatureModalVisible}
        onCancel={() => setIsSignatureModalVisible(false)}
        footer={null}
      >
        <AntdForm
          form={signatureForm}
          onFinish={handleSignatureSubmit}
          layout="vertical"
        >
          <AntdForm.Item
            name="signature_name"
            label="Signature Name"
            rules={[
              { required: true, message: "Please enter the signature name" },
            ]}
          >
            <Input />
          </AntdForm.Item>
          <AntdForm.Item
            name="signature_image"
            label="Signature Image URL"
            rules={[
              {
                required: true,
                message: "Please enter the signature image URL",
              },
            ]}
          >
            <Input />
          </AntdForm.Item>
          <AntdForm.Item
            name="mark_as_default"
            label="Mark as Default"
            valuePropName="checked"
          >
            <Switch />
          </AntdForm.Item>
          <AntdForm.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={isCreatingSignature || isUpdatingSignature}
            >
              {editingSignature ? "Update Signature" : "Add Signature"}
            </Button>
            <Button
              className="ms-2"
              onClick={() => setIsSignatureModalVisible(false)}
            >
              Cancel
            </Button>
          </AntdForm.Item>
        </AntdForm>
      </Modal>
    </div>
  );
};

export default Profile;
