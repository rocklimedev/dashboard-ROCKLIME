import React, { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Avatar,
  Card,
  Tabs,
  Tag,
  Space,
  Row,
  Col,
  Statistic,
  Divider,
  Button,
  Empty,
  Spin,
  Skeleton,
  Badge,
} from "antd";
import {
  EditOutlined,
  PlusOutlined,
  TeamOutlined,
  CalendarOutlined,
  EnvironmentOutlined,
  MailOutlined,
  PhoneOutlined,
  FileTextOutlined,
  ShoppingCartOutlined,
  DollarCircleOutlined,
  UserOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import moment from "moment";
import DataTable from "./DataTable";
import AddAddress from "../Address/AddAddressModal";
import { useGetProfileQuery } from "../../api/userApi";
import { useGetAllQuotationsQuery } from "../../api/quotationApi";
import { useGetAllOrdersQuery } from "../../api/orderApi";
import { useGetPurchaseOrdersQuery } from "../../api/poApi";
import { useGetAllUserAddressesQuery } from "../../api/addressApi";

import "./profile.css";

const Profile = () => {
  const navigate = useNavigate();
  const [addressModalOpen, setAddressModalOpen] = useState(false);

  const { data: profile, isLoading: isProfileLoading } = useGetProfileQuery();
  const user = profile?.user;
  const userId = user?.userId;

  const skip = !userId;

  const { data: quotationsData, isLoading: quotationsLoading } =
    useGetAllQuotationsQuery({ userId }, { skip });
  const { data: ordersData, isLoading: ordersLoading } = useGetAllOrdersQuery(
    { userId },
    { skip },
  );
  const { data: purchaseOrdersData, isLoading: posLoading } =
    useGetPurchaseOrdersQuery({ userId }, { skip });
  const {
    data: addressesData,
    isLoading: addressesLoading,
    refetch: refetchAddresses,
  } = useGetAllUserAddressesQuery(undefined, { skip });

  const myAddresses = useMemo(() => {
    if (!addressesData?.data || !userId) return [];
    const currentUser = addressesData.data.find((u) => u.userId === userId);
    return currentUser?.addresses || [];
  }, [addressesData, userId]);

  const myQuotations = useMemo(
    () => quotationsData?.data?.filter((q) => q.createdBy === userId) || [],
    [quotationsData],
  );
  const myOrders = useMemo(
    () =>
      ordersData?.orders?.filter(
        (o) => o.createdBy === userId || o.assignedUserId === userId,
      ) || [],
    [ordersData],
  );
  const myPOs = useMemo(
    () =>
      purchaseOrdersData?.data?.filter((po) => po.createdBy === userId) || [],
    [purchaseOrdersData],
  );

  const formatDate = (date) =>
    date ? moment(date).format("DD MMM YYYY") : "—";

  const primaryAddress =
    myAddresses.find((a) => a.status === "PRIMARY") || myAddresses[0];

  const tabItems = [
    {
      key: "overview",
      label: (
        <Badge count={myQuotations.length} showZero overflowCount={99}>
          Overview
        </Badge>
      ),
      children: quotationsLoading ? (
        <Skeleton active paragraph={{ rows: 6 }} />
      ) : myQuotations.length === 0 ? (
        <Empty
          description="No quotations created yet"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      ) : (
        <div className="quotation-grid">
          {myQuotations.slice(0, 6).map((q) => (
            <Card
              key={q.quotationId}
              hoverable
              className="quotation-card"
              bodyStyle={{ padding: "16px" }}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="quotation-title">
                    {q.document_title || "Quotation"}
                  </h4>
                  <p className="quotation-ref">
                    Ref: {q.reference_number || "—"}
                  </p>
                  <p className="quotation-due">Due: {formatDate(q.due_date)}</p>
                </div>
                <div className="quotation-amount">
                  ₹{Number(q.finalAmount || 0).toLocaleString("en-IN")}
                </div>
              </div>
            </Card>
          ))}
        </div>
      ),
    },
    {
      key: "orders",
      label: (
        <Badge count={myOrders.length} showZero overflowCount={99}>
          Orders
        </Badge>
      ),
      children: ordersLoading ? (
        <Skeleton active />
      ) : (
        <DataTable
          dataSource={myOrders}
          columns={[
            {
              title: "Order #",
              dataIndex: "orderNo",
              render: (text) => <strong>{text}</strong>,
            },
            { title: "Customer", render: (r) => r.customers?.name || "—" },
            {
              title: "Status",
              render: (r) => (
                <Tag
                  color={
                    r.status === "DELIVERED"
                      ? "success"
                      : r.status === "CANCELED"
                        ? "error"
                        : "processing"
                  }
                >
                  {r.status}
                </Tag>
              ),
            },
            {
              title: "Total",
              render: (r) =>
                `₹${Number(r.finalAmount || 0).toLocaleString("en-IN")}`,
            },
            {
              title: "Date",
              render: (r) => formatDate(r.orderDate || r.createdAt),
            },
          ]}
          rowKey="id"
          pagination={{ pageSize: 8 }}
        />
      ),
    },
    {
      key: "purchaseorders",
      label: (
        <Badge count={myPOs.length} showZero overflowCount={99}>
          Purchase Orders
        </Badge>
      ),
      children: posLoading ? (
        <Skeleton active />
      ) : (
        <DataTable
          dataSource={myPOs}
          columns={[
            { title: "PO #", dataIndex: "poNumber" },
            { title: "Vendor", render: (r) => r.Vendor?.vendorName || "—" },
            {
              title: "Status",
              dataIndex: "status",
              render: (t) => <Tag color="default">{t}</Tag>,
            },
            {
              title: "Amount",
              render: (r) =>
                `₹${Number(r.totalAmount || 0).toLocaleString("en-IN")}`,
            },
          ]}
          rowKey="id"
          pagination={{ pageSize: 8 }}
        />
      ),
    },
  ];

  if (isProfileLoading) {
    return (
      <div className="profile-loading">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      <div className="content">
        <div className="profile-page">
          <div className="profile-container">
            {/* Hero Header */}
            <Card className="profile-hero">
              <div className="hero-content">
                <Avatar
                  size={140}
                  src={user?.avatarUrl || user?.photo_thumbnail}
                  icon={<UserOutlined />}
                  className="hero-avatar"
                />

                <div className="hero-info">
                  <h1 className="hero-name">{user?.name || "User"}</h1>
                  <p className="hero-username">@{user?.username || "—"}</p>

                  <Space wrap size="small" className="hero-roles">
                    {user?.roles?.map((role) => (
                      <Tag key={role} className="role-tag">
                        {role.replace(/_/g, " ")}
                      </Tag>
                    ))}
                  </Space>
                </div>

                <Button
                  type="primary"
                  icon={<EditOutlined />}
                  onClick={() => navigate(`/u/${userId}/edit`)}
                  className="edit-profile-btn"
                >
                  Edit Profile
                </Button>
              </div>

              <Divider />

              <Row gutter={[16, 16]} className="hero-stats">
                <Col xs={12} sm={6}>
                  <Statistic
                    title="Quotations"
                    value={myQuotations.length}
                    prefix={<FileTextOutlined />}
                  />
                </Col>
                <Col xs={12} sm={6}>
                  <Statistic
                    title="Active Orders"
                    value={
                      myOrders.filter((o) => o.status !== "DELIVERED").length
                    }
                    prefix={<ShoppingCartOutlined />}
                  />
                </Col>
                <Col xs={12} sm={6}>
                  <Statistic
                    title="Purchase Orders"
                    value={myPOs.length}
                    prefix={<DollarCircleOutlined />}
                  />
                </Col>
                <Col xs={12} sm={6}>
                  <Statistic
                    title="Team"
                    value={user?.team || "Individual"}
                    prefix={<TeamOutlined />}
                  />
                </Col>
              </Row>
            </Card>

            <Row gutter={[24, 24]}>
              {/* Left Column – Personal Info + Address */}
              <Col xs={24} lg={8}>
                <Card title="Personal Information" className="info-card">
                  <Space direction="vertical" size="middle" className="w-full">
                    <div className="info-row">
                      <MailOutlined className="info-icon" />
                      <div>
                        <div className="info-label">Email</div>
                        <a
                          href={`mailto:${user?.email}`}
                          className="info-value"
                        >
                          {user?.email || "—"}
                        </a>
                      </div>
                    </div>

                    <div className="info-row">
                      <PhoneOutlined className="info-icon" />
                      <div>
                        <div className="info-label">Phone</div>
                        <div className="info-value">
                          {user?.mobileNumber || "Not added"}
                        </div>
                      </div>
                    </div>

                    <div className="info-row">
                      <CalendarOutlined className="info-icon" />
                      <div>
                        <div className="info-label">Birthday</div>
                        <div className="info-value">
                          {formatDate(user?.dateOfBirth)}
                        </div>
                      </div>
                    </div>

                    <div className="info-row">
                      <ClockCircleOutlined className="info-icon" />
                      <div>
                        <div className="info-label">Joined</div>
                        <div className="info-value">
                          {formatDate(user?.createdAt)}
                        </div>
                      </div>
                    </div>
                  </Space>
                </Card>

                <Card
                  title="Primary Address"
                  className="address-card mt-6"
                  loading={addressesLoading}
                  extra={
                    <Button
                      type="text"
                      icon={<PlusOutlined />}
                      onClick={() => setAddressModalOpen(true)}
                    >
                      {myAddresses.length > 0 ? "Manage" : "Add"}
                    </Button>
                  }
                >
                  {primaryAddress ? (
                    <div className="address-content">
                      <EnvironmentOutlined className="address-icon" />
                      <div>
                        <div className="address-street">
                          {primaryAddress.street}
                        </div>
                        <div className="address-city">
                          {primaryAddress.city}, {primaryAddress.state}{" "}
                          {primaryAddress.postalCode &&
                            `(${primaryAddress.postalCode})`}
                        </div>
                        <div className="address-country">
                          {primaryAddress.country || "India"}
                        </div>
                        {primaryAddress.status === "PRIMARY" && (
                          <Tag color="blue" className="mt-2">
                            Primary
                          </Tag>
                        )}
                      </div>
                    </div>
                  ) : (
                    <Empty description="No address added yet" />
                  )}
                </Card>
              </Col>

              {/* Right Column – Tabs */}
              <Col xs={24} lg={16}>
                <Card className="tabs-card">
                  <Tabs items={tabItems} size="large" />
                </Card>
              </Col>
            </Row>

            <AddAddress
              visible={addressModalOpen}
              onClose={() => setAddressModalOpen(false)}
              onSave={() => {
                refetchAddresses();
                setAddressModalOpen(false);
              }}
              selectedCustomer={null}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
