import React, { useState, useEffect, useMemo } from "react";
import { toast } from "react-toastify";
import { useGetProfileQuery } from "../../api/userApi";
import { useGetRolesQuery } from "../../api/rolesApi";
import { useGetAllQuotationsQuery } from "../../api/quotationApi";
import { useGetAllTeamsQuery } from "../../api/teamApi";
import { useGetAllInvoicesQuery } from "../../api/invoiceApi";
import { useGetAllOrdersQuery } from "../../api/orderApi";
import { useGetPurchaseOrdersQuery } from "../../api/poApi";
import {
  useGetAllUserAddressesQuery,
  useDeleteAddressMutation,
} from "../../api/addressApi";
import {
  useGetAllSignaturesQuery,
  useDeleteSignatureMutation,
} from "../../api/signatureApi";
import moment from "moment";
import DataTable from "./DataTable";
import Avatar from "react-avatar";
import AddAddress from "../Address/AddAddressModal";
import AddSignature from "../Signature/AddSignature";
import "./profile.css";
import {
  TeamOutlined,
  CalendarOutlined,
  EnvironmentOutlined,
} from "@ant-design/icons";
import { Button, Image } from "antd";
import { useNavigate } from "react-router-dom";

const Profile = () => {
  /* ──────────────────────── QUERIES ──────────────────────── */
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
  const navigate = useNavigate();
  const userId = profile?.user?.userId;

  const { data: quotationsData, isLoading: isQuotationsLoading } =
    useGetAllQuotationsQuery({ userId }, { skip: !userId });

  const { data: teamsData, isLoading: isTeamsLoading } = useGetAllTeamsQuery(
    { userId },
    { skip: !userId }
  );

  const { data: ordersData, isLoading: isOrdersLoading } = useGetAllOrdersQuery(
    { userId },
    { skip: !userId }
  );

  const { data: purchaseOrdersData, isLoading: isPurchaseOrdersLoading } =
    useGetPurchaseOrdersQuery(
      { userId, page: 1, limit: 10 },
      { skip: !userId }
    );

  const {
    data: usersWithAddresses = [],
    isLoading: isAddressesLoading,
    error: addressesError,
    refetch: refetchAddresses,
  } = useGetAllUserAddressesQuery(undefined, { skip: !userId });

  const myAddressesRaw = useMemo(() => {
    if (!Array.isArray(usersWithAddresses) || !userId) return [];
    const currentUser = usersWithAddresses.find((u) => u.userId === userId);
    return currentUser?.addresses || [];
  }, [usersWithAddresses, userId]);

  const {
    data: signaturesData,
    isLoading: isSignaturesLoading,
    error: signaturesError,
    refetch: refetchSignatures,
  } = useGetAllSignaturesQuery({}, { skip: !userId });

  const [deleteAddress, { isLoading: isDeletingAddress }] =
    useDeleteAddressMutation();
  const [deleteSignature, { isLoading: isDeletingSignature }] =
    useDeleteSignatureMutation();

  /* ──────────────────────── STATE ──────────────────────── */
  const [activeTab, setActiveTab] = useState("profile");

  // Modal states
  const [addressModalOpen, setAddressModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);

  const [signatureModalOpen, setSignatureModalOpen] = useState(false);
  const [editingSignature, setEditingSignature] = useState(null);

  const isSuperAdmin = profile?.user?.roles?.includes("SUPER_ADMIN");

  /* ──────────────────────── HELPERS ──────────────────────── */
  const formatAddress = (addr) => {
    if (!addr) return "N/A";
    const parts = [
      addr.street,
      addr.city,
      addr.state,
      addr.country,
      addr.postalCode,
    ].filter(Boolean);
    return parts.length ? parts.join(", ") : "N/A";
  };

  const PRIORITY = { PRIMARY: 3, BILLING: 2, ADDITIONAL: 1 };
  const getPrimaryAddress = (list = []) => {
    if (!Array.isArray(list) || list.length === 0) return null;
    return list.reduce((best, cur) => {
      const bestScore = best ? PRIORITY[best.status] ?? 0 : 0;
      const curScore = PRIORITY[cur.status] ?? 0;
      return curScore > bestScore ? cur : best;
    }, null);
  };

  const embedded = profile?.user?.address;
  const primaryFromTable = getPrimaryAddress(myAddressesRaw);
  const primaryAddressObj = embedded ?? primaryFromTable;
  const primaryAddress = primaryAddressObj ? (
    formatAddress(primaryAddressObj)
  ) : (
    <em style={{ color: "#999" }}>No address added</em>
  );

  const team = profile?.user?.roles?.includes("SALES")
    ? "Sales Team"
    : profile?.user?.team || "N/A";

  const formatTime = (time) => {
    if (!time) return "N/A";
    const date = new Date(`1970-01-01T${time}`);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const formatDate = (date) => {
    return date
      ? new Date(date).toLocaleDateString("en-US", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : "N/A";
  };

  /* ──────────────────────── EFFECTS ──────────────────────── */
  useEffect(() => {
    const token =
      localStorage.getItem("token") || sessionStorage.getItem("token");
    if (!token) {
      toast.error("No authentication token found. Redirecting to login...");
      window.location.href = "/login";
    }
  }, []);

  /* ──────── ADDRESS MODAL HANDLERS ──────── */
  const openAddressModal = (address = null) => {
    setEditingAddress(address);
    setAddressModalOpen(true);
  };

  const closeAddressModal = () => {
    setAddressModalOpen(false);
    setEditingAddress(null);
  };

  const onAddressSaved = () => {
    toast.success(editingAddress ? "Address updated!" : "Address added!");
    refetchAddresses();
    closeAddressModal();
  };

  const handleDeleteAddress = async (addressId) => {
    try {
      await deleteAddress(addressId).unwrap();
      toast.success("Address deleted");
      refetchAddresses();
    } catch (error) {
      toast.error(
        `Failed to delete address: ${error.data?.message || "Unknown error"}`
      );
    }
  };

  /* ──────── SIGNATURE MODAL HANDLERS ──────── */
  const openSignatureModal = (signature = null) => {
    setEditingSignature(signature);
    setSignatureModalOpen(true);
  };

  const closeSignatureModal = () => {
    setSignatureModalOpen(false);
    setEditingSignature(null);
  };

  const onSignatureSuccess = () => {
    toast.success(editingSignature ? "Signature updated!" : "Signature added!");
    refetchSignatures();
    closeSignatureModal();
  };

  const handleDeleteSignature = async (signatureId) => {
    try {
      await deleteSignature(signatureId).unwrap();
      toast.success("Signature deleted");
      refetchSignatures();
    } catch (error) {
      toast.error(
        `Failed to delete signature: ${error.data?.message || "Unknown error"}`
      );
    }
  };

  /* ──────────────────────── TABLE COLUMNS ──────────────────────── */
  const addressColumns = [
    { title: "Street", dataIndex: "street", key: "street" },
    { title: "City", dataIndex: "city", key: "city" },
    { title: "State", dataIndex: "state", key: "state" },
    { title: "Postal Code", dataIndex: "postalCode", key: "postalCode" },
    { title: "Country", dataIndex: "country", key: "country" },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <div>
          <Button type="link" onClick={() => openAddressModal(record)}>
            Edit
          </Button>
          <Button
            type="link"
            danger
            onClick={() => handleDeleteAddress(record.addressId)}
            loading={isDeletingAddress}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ];

  const signatureColumns = [
    { title: "Name", dataIndex: "signature_name", key: "signature_name" },
    {
      title: "Image",
      dataIndex: "signature_image",
      key: "signature_image",
      render: (url) => (url ? <Image src={url} width={100} preview /> : "N/A"),
    },
    {
      title: "Default",
      dataIndex: "mark_as_default",
      key: "mark_as_default",
      render: (v) => (v ? "Yes" : "No"),
    },
    {
      title: "Created",
      dataIndex: "createdAt",
      key: "createdAt",
      render: formatDate,
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <div>
          <Button type="link" onClick={() => openSignatureModal(record)}>
            Edit
          </Button>
          <Button
            type="link"
            danger
            onClick={() => handleDeleteSignature(record.signatureId)}
            loading={isDeletingSignature}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ];

  /* ──────────────────────── FILTERED DATA ──────────────────────── */
  const myQuotations = useMemo(
    () => quotationsData?.filter((q) => q.createdBy === userId) ?? [],
    [quotationsData, userId]
  );
  const myTeams = useMemo(
    () =>
      teamsData?.teams?.filter(
        (t) =>
          t.adminId === userId ||
          t.teammembers?.some((m) => m.userId === userId)
      ) ?? [],
    [teamsData, userId]
  );
  const myOrders = useMemo(
    () =>
      ordersData?.orders?.filter(
        (o) =>
          o.createdBy === userId ||
          o.assignedUserId === userId ||
          o.secondaryUserId === userId
      ) ?? [],
    [ordersData, userId]
  );
  const myPurchaseOrders = useMemo(
    () =>
      purchaseOrdersData?.purchaseOrders?.filter(
        (po) => po.createdBy === userId
      ) ?? [],
    [purchaseOrdersData, userId]
  );

  /* ──────────────────────── RENDER ──────────────────────── */
  if (
    isProfileLoading ||
    isRolesLoading ||
    isAddressesLoading ||
    (isSuperAdmin && isSignaturesLoading)
  ) {
    return (
      <div className="page-wrapper">
        <div className="content text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  if (profileError || addressesError || (isSuperAdmin && signaturesError)) {
    return (
      <div className="page-wrapper">
        <div className="content">
          <div className="alert alert-danger">
            Error loading data.{" "}
            <button
              className="btn btn-link p-0"
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

  const user = profile.user;
  const avatarUrl = user.avatarUrl;

  return (
    <div className="page-wrapper">
      <div className="content">
        <div className="row">
          {/* ────── LEFT SIDEBAR ────── */}
          <div className="col-xl-4 theiaStickySidebar">
            <div className="card rounded-0 border-0">
              <div className="card-header rounded-0 bg-primary d-flex align-items-center">
                <span className="avatar avatar-xl avatar-rounded flex-shrink-0 border border-white border-3 me-3">
                  <Avatar
                    src={avatarUrl || undefined}
                    name={user.name || "User"}
                    size="60"
                    round
                    textSizeRatio={2.5}
                  />
                </span>
                <div className="me-3">
                  <h6 className="text-white mb-1">{user.name || "N/A"}</h6>
                  <span className="badge bg-purple-transparent text-purple">
                    {Array.isArray(user.roles)
                      ? user.roles.join(", ")
                      : user.roles || "User"}
                  </span>
                </div>
                <div>
                  <button className="btn btn-white">Edit Profile</button>
                </div>
              </div>

              <div className="card-body">
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <span className="d-inline-flex align-items-center">
                    <TeamOutlined /> Team
                  </span>
                  <p className="text-dark">{team}</p>
                </div>
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <span className="d-inline-flex align-items-center">
                    <CalendarOutlined /> Date Of Join
                  </span>
                  <p className="text-dark">{formatDate(user.createdAt)}</p>
                </div>
                <div className="d-flex align-items-center justify-content-between">
                  <span className="d-inline-flex align-items-center">
                    <EnvironmentOutlined /> Primary Address
                  </span>
                  <p className="text-dark">{primaryAddress}</p>
                </div>
              </div>
            </div>
          </div>

          {/* ────── MAIN CONTENT ────── */}
          <div className="col-xl-8">
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
                      <span className="text-gray-900 fs-13">
                        {primaryAddress}
                      </span>
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
            {/* ────── TABS ────── */}
            <div className="card rounded-0 border-0">
              <div className="card-header bg-light d-flex align-items-center justify-content-between">
                <ul
                  className="nav nav-pills border d-inline-flex p-1 rounded bg-light"
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
                    <li className="nav-item" key={tab}>
                      <button
                        className={`nav-link btn btn-sm py-3 ${
                          activeTab === tab.toLowerCase() ? "active" : ""
                        }`}
                        onClick={() => setActiveTab(tab.toLowerCase())}
                      >
                        {tab}
                      </button>
                    </li>
                  ))}
                </ul>

                {activeTab === "addresses" && (
                  <Button type="primary" onClick={() => openAddressModal()}>
                    Add Address
                  </Button>
                )}
                {activeTab === "signatures" && isSuperAdmin && (
                  <Button type="primary" onClick={() => openSignatureModal()}>
                    Add Signature
                  </Button>
                )}
              </div>

              <div className="card-body">
                <div className="tab-content">
                  {/* QUOTATIONS */}
                  <div
                    className={`tab-pane fade ${
                      activeTab === "quotations" ? "show active" : ""
                    }`}
                  >
                    <DataTable
                      title="My Quotations"
                      columns={[
                        { title: "Title", dataIndex: "document_title" },
                        {
                          title: "Date",
                          dataIndex: "quotation_date",
                          render: formatDate,
                        },
                        {
                          title: "Due",
                          dataIndex: "due_date",
                          render: formatDate,
                        },
                        { title: "Ref", dataIndex: "reference_number" },
                        {
                          title: "Amount",
                          dataIndex: "finalAmount",
                          render: (t) => `₹${parseFloat(t).toFixed(2)}`,
                        },
                      ]}
                      dataSource={myQuotations}
                      isLoading={isQuotationsLoading}
                      rowKey="quotationId"
                    />
                  </div>

                  {/* TEAMS */}
                  <div
                    className={`tab-pane fade ${
                      activeTab === "teams" ? "show active" : ""
                    }`}
                  >
                    <DataTable
                      title="My Teams"
                      columns={[
                        { title: "Name", dataIndex: "teamName" },
                        { title: "Admin", dataIndex: "adminName" },
                        {
                          title: "Members",
                          dataIndex: "teammembers",
                          render: (m) =>
                            m?.map((x) => x.userName).join(", ") || "N/A",
                        },
                      ]}
                      dataSource={myTeams}
                      isLoading={isTeamsLoading}
                      rowKey="id"
                    />
                  </div>

                  {/* ORDERS */}
                  <div
                    className={`tab-pane fade ${
                      activeTab === "orders" ? "show active" : ""
                    }`}
                  >
                    <DataTable
                      title="My Orders"
                      columns={[
                        { title: "Order #", dataIndex: "orderNo" },
                        {
                          title: "Customer",
                          dataIndex: "customers",
                          render: (c) => c?.name,
                        },
                        { title: "Status", dataIndex: "status" },
                        {
                          title: "Due",
                          dataIndex: "dueDate",
                          render: formatDate,
                        },
                      ]}
                      dataSource={myOrders}
                      isLoading={isOrdersLoading}
                      rowKey="id"
                    />
                  </div>

                  {/* PURCHASE ORDERS */}
                  <div
                    className={`tab-pane fade ${
                      activeTab === "purchase orders" ? "show active" : ""
                    }`}
                  >
                    <DataTable
                      title="My POs"
                      columns={[
                        { title: "PO #", dataIndex: "poNumber" },
                        {
                          title: "Vendor",
                          dataIndex: "Vendor",
                          render: (v) => v?.vendorName,
                        },
                        { title: "Status", dataIndex: "status" },
                        {
                          title: "Amount",
                          dataIndex: "totalAmount",
                          render: (t) => `₹${parseFloat(t).toFixed(2)}`,
                        },
                      ]}
                      dataSource={myPurchaseOrders}
                      isLoading={isPurchaseOrdersLoading}
                      rowKey="id"
                    />
                  </div>

                  {/* ADDRESSES */}
                  <div
                    className={`tab-pane fade ${
                      activeTab === "addresses" ? "show active" : ""
                    }`}
                  >
                    <DataTable
                      title="My Addresses"
                      columns={addressColumns}
                      dataSource={myAddressesRaw}
                      isLoading={isAddressesLoading}
                      rowKey="addressId"
                    />
                  </div>

                  {/* SIGNATURES */}
                  {isSuperAdmin && (
                    <div
                      className={`tab-pane fade ${
                        activeTab === "signatures" ? "show active" : ""
                      }`}
                    >
                      <DataTable
                        title="My Signatures"
                        columns={signatureColumns}
                        dataSource={signaturesData || []}
                        isLoading={isSignaturesLoading}
                        rowKey="signatureId"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ────── ADDRESS MODAL ────── */}
      {addressModalOpen && (
        <AddAddress
          onClose={closeAddressModal}
          onSave={onAddressSaved}
          existingAddress={editingAddress}
          selectedCustomer={null}
        />
      )}

      {/* ────── SIGNATURE MODAL ────── */}
      {signatureModalOpen && (
        <AddSignature
          signatureId={editingSignature?.signatureId}
          existingSignature={editingSignature}
          entityType="user"
          entityId={userId}
          onClose={closeSignatureModal}
          onSuccess={onSignatureSuccess}
        />
      )}
    </div>
  );
};

export default Profile;
