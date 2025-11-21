import React, { useState, useEffect, useMemo } from "react";
import { message } from "antd";
import { useGetProfileQuery } from "../../api/userApi";
import { useGetRolesQuery } from "../../api/rolesApi";
import { useGetAllQuotationsQuery } from "../../api/quotationApi";
import { useGetAllTeamsQuery } from "../../api/teamApi";
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

import {
  TeamOutlined,
  CalendarOutlined,
  EnvironmentOutlined,
  MailOutlined,
  PhoneOutlined,
  UserOutlined,
  EditOutlined,
  PlusOutlined,
  HeartOutlined,
  MessageOutlined,
  EyeOutlined,
  GlobalOutlined,
  ClockCircleOutlined,
  DollarCircleOutlined,
} from "@ant-design/icons";
import {
  Button,
  Image,
  Card,
  Badge,
  Tabs,
  Tag,
  Space,
  Divider,
  Row,
  Col,
} from "antd";
import { useNavigate } from "react-router-dom";

const { TabPane } = Tabs;

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
    data: usersWithAddresses = {},
    isLoading: isAddressesLoading,
    error: addressesError,
    refetch: refetchAddresses,
  } = useGetAllUserAddressesQuery(undefined, { skip: !userId });

  const myAddressesRaw = useMemo(() => {
    if (!Array.isArray(usersWithAddresses.data) || !userId) return [];
    const currentUser = usersWithAddresses.data.find(
      (u) => u.userId === userId
    );
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
  const primaryAddress = primaryAddressObj
    ? formatAddress(primaryAddressObj)
    : "No address added";

  const team = profile?.user?.roles?.includes("SALES")
    ? "Sales Team"
    : profile?.user?.team || "N/A";

  const formatDate = (date) =>
    date
      ? new Date(date).toLocaleDateString("en-US", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })
      : "N/A";

  /* ──────────────────────── EFFECTS ──────────────────────── */
  useEffect(() => {
    const token =
      localStorage.getItem("token") || sessionStorage.getItem("token");
    if (!token) {
      message.error("No authentication token found. Redirecting to login...");
      window.location.href = "/login";
    }
  }, []);

  /* ──────── MODAL HANDLERS ──────── */
  const openAddressModal = (address = null) => {
    setEditingAddress(address);
    setAddressModalOpen(true);
  };

  const closeAddressModal = () => {
    setAddressModalOpen(false);
    setEditingAddress(null);
  };

  const onAddressSaved = () => {
    refetchAddresses();
    closeAddressModal();
  };

  const handleDeleteAddress = async (addressId) => {
    try {
      await deleteAddress(addressId).unwrap();
      refetchAddresses();
    } catch (error) {
      message.error(
        `Failed to delete address: ${error.data?.message || "Unknown error"}`
      );
    }
  };

  const openSignatureModal = (signature = null) => {
    setEditingSignature(signature);
    setSignatureModalOpen(true);
  };

  const closeSignatureModal = () => {
    setSignatureModalOpen(false);
    setEditingSignature(null);
  };

  const onSignatureSuccess = () => {
    refetchSignatures();
    closeSignatureModal();
  };

  const handleDeleteSignature = async (signatureId) => {
    try {
      await deleteSignature(signatureId).unwrap();
      refetchSignatures();
    } catch (error) {
      message.error(
        `Failed to delete signature: ${error.data?.message || "Unknown error"}`
      );
    }
  };

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
  const avatarUrl = user.avatarUrl || user.photo_thumbnail;

  return (
    <div
      className="page-wrapper"
      style={{ background: "#f9f9fb", minHeight: "100vh" }}
    >
      <div className="content p-4">
        <Row gutter={[24, 24]}>
          {/* ────── LEFT SIDEBAR ────── */}
          <Col xs={24} lg={8}>
            <Card className="shadow-sm border-0 rounded-4 overflow-hidden">
              <div className="text-center pt-4 pb-3 px-3">
                <Avatar
                  src={avatarUrl}
                  name={user.name}
                  size="100"
                  round
                  className="border border-4 border-white shadow"
                  style={{ marginBottom: "-50px" }}
                />
                <div className="mt-5">
                  <h4 className="mb-1">{user.name}</h4>
                  <p className="text-muted mb-2">@{user.username || "user"}</p>
                  <Space size={6}>
                    {user.roles?.map((role) => (
                      <Tag key={role} color="purple" className="mb-2">
                        {role}
                      </Tag>
                    ))}
                  </Space>
                </div>
              </div>

              <div className="px-4 pb-4">
                <Space direction="vertical" size="middle" className="w-100">
                  <div className="d-flex justify-content-between">
                    <span className="text-muted">
                      <TeamOutlined className="me-2" />
                      Team
                    </span>
                    <strong>{team}</strong>
                  </div>
                  <div className="d-flex justify-content-between">
                    <span className="text-muted">
                      <CalendarOutlined className="me-2" />
                      Joined
                    </span>
                    <strong>{formatDate(user.createdAt)}</strong>
                  </div>
                  <div className="d-flex justify-content-between">
                    <span className="text-muted">
                      <EnvironmentOutlined className="me-2" />
                      Address
                    </span>
                    <strong className="text-end">{primaryAddress}</strong>
                  </div>
                </Space>

                <Divider className="my-3" />

                <Button
                  type="primary"
                  block
                  icon={<EditOutlined />}
                  onClick={() => navigate(`/u/${userId}/edit`)}
                  className="rounded-pill"
                >
                  Edit Profile
                </Button>
              </div>
            </Card>

            {/* Teams Section (Inspired by "Interested In") */}
            <Card className="mt-4 shadow-sm border-0 rounded-4">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h6 className="mb-0">Teams</h6>
                <Button type="text" size="small" icon={<PlusOutlined />} />
              </div>
              <div className="row g-3">
                {myTeams.length === 0 ? (
                  <p className="text-muted text-center mb-0">No teams yet.</p>
                ) : (
                  myTeams.slice(0, 4).map((team) => (
                    <div key={team.id} className="col-6">
                      <Card
                        hoverable
                        className="text-center p-3 rounded-3 border-0 shadow-sm"
                        cover={
                          <div
                            className="d-flex align-items-center justify-content-center"
                            style={{ height: 80 }}
                          >
                            <TeamOutlined
                              style={{ fontSize: 32, color: "#1890ff" }}
                            />
                          </div>
                        }
                      >
                        <Card.Meta
                          title={team.teamName}
                          description={
                            <small className="text-muted">
                              {team.teammembers?.length || 0} members
                            </small>
                          }
                        />
                        <div className="mt-2">
                          <Button
                            type="link"
                            size="small"
                            className="text-success"
                          >
                            View
                          </Button>
                        </div>
                      </Card>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </Col>

          {/* ────── MAIN CONTENT ────── */}
          <Col xs={24} lg={16}>
            <Card className="shadow-sm border-0 rounded-4 mb-4">
              <Tabs
                activeKey={activeTab}
                onChange={setActiveTab}
                tabBarExtraContent={
                  activeTab === "signatures" && isSuperAdmin ? (
                    <Button
                      type="primary"
                      size="small"
                      icon={<PlusOutlined />}
                      onClick={() => openSignatureModal()}
                    >
                      Add Signature
                    </Button>
                  ) : null
                }
              >
                <TabPane tab="Profile" key="profile">
                  <Row gutter={[16, 16]}>
                    <Col span={12}>
                      <Space direction="vertical">
                        <small className="text-muted">Phone</small>
                        <strong>{user.mobileNumber || "N/A"}</strong>
                      </Space>
                    </Col>
                    <Col span={12}>
                      <Space direction="vertical">
                        <small className="text-muted">Email</small>
                        <strong>
                          <a href={`mailto:${user.email}`}>{user.email}</a>
                        </strong>
                      </Space>
                    </Col>
                    <Col span={12}>
                      <Space direction="vertical">
                        <small className="text-muted">Birthday</small>
                        <strong>{formatDate(user.dateOfBirth)}</strong>
                      </Space>
                    </Col>
                    <Col span={12}>
                      <Space direction="vertical">
                        <small className="text-muted">Blood Group</small>
                        <strong>{user.bloodGroup || "N/A"}</strong>
                      </Space>
                    </Col>
                    <Col span={12}>
                      <Space direction="vertical">
                        <small className="text-muted">Emergency Contact</small>
                        <strong>{user.emergencyNumber || "N/A"}</strong>
                      </Space>
                    </Col>
                    <Col span={12}>
                      <Space direction="vertical">
                        <small className="text-muted">Status</small>
                        <strong>
                          <Badge
                            status="success"
                            text={user.status || "Active"}
                          />
                        </strong>
                      </Space>
                    </Col>
                  </Row>
                </TabPane>

                <TabPane tab="Quotations" key="quotations">
                  <div className="row g-3">
                    {myQuotations.length === 0 ? (
                      <p className="text-center text-muted">
                        No quotations created.
                      </p>
                    ) : (
                      myQuotations.slice(0, 6).map((q) => (
                        <div key={q.quotationId} className="col-md-6">
                          <Card
                            hoverable
                            className="h-100 rounded-3 border-0 shadow-sm"
                            actions={[
                              <Button
                                type="link"
                                size="small"
                                className="text-success"
                              >
                                View
                              </Button>,
                              <Button type="link" size="small">
                                Edit
                              </Button>,
                            ]}
                          >
                            <Space direction="vertical" className="w-100">
                              <div className="d-flex justify-content-between">
                                <h6 className="mb-0">{q.document_title}</h6>
                                <Tag color="blue">
                                  ₹{parseFloat(q.finalAmount).toFixed(0)}
                                </Tag>
                              </div>
                              <small className="text-muted">
                                Due: {formatDate(q.due_date)}
                              </small>
                            </Space>
                          </Card>
                        </div>
                      ))
                    )}
                  </div>
                </TabPane>

                <TabPane tab="Orders" key="orders">
                  <DataTable
                    title="My Orders"
                    columns={[
                      { title: "Order #", dataIndex: "orderNo" },
                      {
                        title: "Customer",
                        render: (r) => r.customers?.name || "N/A",
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
                    pagination={{ pageSize: 5 }}
                  />
                </TabPane>

                <TabPane tab="Purchase Orders" key="purchaseorders">
                  <DataTable
                    title="My POs"
                    columns={[
                      { title: "PO #", dataIndex: "poNumber" },
                      {
                        title: "Vendor",
                        render: (r) => r.Vendor?.vendorName || "N/A",
                      },
                      { title: "Status", dataIndex: "status" },
                      {
                        title: "Amount",
                        render: (r) =>
                          `₹${parseFloat(r.totalAmount).toFixed(2)}`,
                      },
                    ]}
                    dataSource={myPurchaseOrders}
                    isLoading={isPurchaseOrdersLoading}
                    rowKey="id"
                    pagination={{ pageSize: 5 }}
                  />
                </TabPane>

                {isSuperAdmin && (
                  <TabPane tab="Signatures" key="signatures">
                    <DataTable
                      title="My Signatures"
                      columns={[
                        { title: "Name", dataIndex: "signature_name" },
                        {
                          title: "Image",
                          dataIndex: "signature_image",
                          render: (url) =>
                            url ? (
                              <Image src={url} width={80} preview />
                            ) : (
                              "N/A"
                            ),
                        },
                        { title: "Default", render: (v) => (v ? "Yes" : "No") },
                        {
                          title: "Created",
                          dataIndex: "createdAt",
                          render: formatDate,
                        },
                        {
                          title: "Actions",
                          render: (_, record) => (
                            <Space>
                              <Button
                                size="small"
                                onClick={() => openSignatureModal(record)}
                              >
                                Edit
                              </Button>
                              <Button
                                size="small"
                                danger
                                onClick={() =>
                                  handleDeleteSignature(record.signatureId)
                                }
                                loading={isDeletingSignature}
                              >
                                Delete
                              </Button>
                            </Space>
                          ),
                        },
                      ]}
                      dataSource={signaturesData || []}
                      isLoading={isSignaturesLoading}
                      rowKey="signatureId"
                    />
                  </TabPane>
                )}
              </Tabs>
            </Card>
          </Col>
        </Row>

        {/* MODALS */}
        {addressModalOpen && (
          <AddAddress
            onClose={closeAddressModal}
            onSave={onAddressSaved}
            existingAddress={editingAddress}
            selectedCustomer={null}
          />
        )}
      </div>
    </div>
  );
};

export default Profile;
