import React, { useState, useMemo } from "react";
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
import { useNavigate } from "react-router-dom";
import moment from "moment";
import DataTable from "./DataTable";
import AddAddress from "../Address/AddAddressModal";
import { useGetProfileQuery } from "../../api/userApi";
import { useGetAllQuotationsQuery } from "../../api/quotationApi";
import { useGetAllOrdersQuery } from "../../api/orderApi";
import { useGetPurchaseOrdersQuery } from "../../api/poApi";
import { useGetAllUserAddressesQuery } from "../../api/addressApi";

const Profile = () => {
  const navigate = useNavigate();
  const [addressModalOpen, setAddressModalOpen] = useState(false);

  const { data: profile, isLoading: isProfileLoading } = useGetProfileQuery();
  const user = profile?.user;
  const userId = user?.userId;

  // Skip all user-specific queries until we have userId
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
    [quotationsData, userId],
  );
  const myOrders = useMemo(
    () =>
      ordersData?.orders?.filter(
        (o) => o.createdBy === userId || o.assignedUserId === userId,
      ) || [],
    [ordersData, userId],
  );
  const myPOs = useMemo(
    () =>
      purchaseOrdersData?.data?.filter((po) => po.createdBy === userId) || [],
    [purchaseOrdersData, userId],
  );

  const formatDate = (date) =>
    date ? moment(date).format("DD MMM YYYY") : "—";

  const primaryAddress =
    myAddresses.find((a) => a.status === "PRIMARY") || myAddresses[0];

  if (isProfileLoading) {
    return (
      <div className="text-center py-10">
        <Spin size="large" />
      </div>
    );
  }

  const tabItems = [
    {
      key: "overview",
      label: "Overview",
      children: quotationsLoading ? (
        <Skeleton active paragraph={{ rows: 8 }} />
      ) : myQuotations.length === 0 ? (
        <Empty description="No quotations created yet" />
      ) : (
        <Row gutter={[16, 16]}>
          {myQuotations.slice(0, 6).map((q) => (
            <Col xs={24} sm={12} key={q.quotationId}>
              <Card hoverable className="rounded-xl">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium text-base">
                      {q.document_title}
                    </h4>
                    <p className="text-gray-500 text-sm">
                      Ref: {q.reference_number}
                    </p>
                    <p className="text-sm mt-2">
                      Due: {formatDate(q.due_date)}
                    </p>
                  </div>
                  <Tag color="blue" className="text-lg font-bold">
                    ₹{Number(q.finalAmount).toLocaleString()}
                  </Tag>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      ),
    },
    {
      key: "orders",
      label: "Orders",
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
            { title: "Status", render: (r) => <Tag>{r.status}</Tag> },
            {
              title: "Total",
              render: (r) => `₹${Number(r.finalAmount || 0).toFixed(2)}`,
            },
            { title: "Date", render: (r) => formatDate(r.orderDate) },
          ]}
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      ),
    },
    {
      key: "purchaseorders",
      label: "Purchase Orders",
      children: posLoading ? (
        <Skeleton active />
      ) : (
        <DataTable
          dataSource={myPOs}
          columns={[
            { title: "PO #", dataIndex: "poNumber" },
            {
              title: "Vendor",
              render: (r) => r.Vendor?.vendorName || "—",
            },
            {
              title: "Status",
              dataIndex: "status",
              render: (t) => <Tag>{t}</Tag>,
            },
            {
              title: "Amount",
              render: (r) => `₹${Number(r.totalAmount).toFixed(2)}`,
            },
          ]}
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      ),
    },
  ];

  return (
    <div className="page-wrapper">
      <div className="content">
        <div
          style={{
            background: "#f0f2f5",
            minHeight: "100vh",
            padding: "24px 16px",
          }}
        >
          <div style={{ maxWidth: 1400, margin: "0 auto" }}>
            {/* Header Hero Section */}
            <Card className="mb-6 shadow-lg rounded-2xl overflow-hidden border-0">
              <div className="grid md:grid-cols-4 gap-6 items-center">
                <div className="text-center md:text-left">
                  <Avatar
                    size={120}
                    src={user?.avatarUrl || user?.photo_thumbnail}
                    icon={<UserOutlined />}
                    className="shadow-xl border-4 border-white"
                  />
                </div>

                <div className="md:col-span-2">
                  <h2 className="text-3xl font-bold text-gray-800">
                    {user?.name}
                  </h2>
                  <p className="text-lg text-gray-600">
                    @{user?.username || "user"}
                  </p>
                  <Space wrap className="mt-3">
                    {user?.roles?.map((role) => (
                      <Tag
                        key={role}
                        color="purple"
                        className="text-sm font-medium py-1 px-3"
                      >
                        {role.replace(/_/g, " ")}
                      </Tag>
                    ))}
                  </Space>
                </div>

                <div className="text-center md:text-right">
                  <Button
                    type="primary"
                    size="large"
                    style={{ background: "#E31E24", color: "#fff" }}
                    icon={<EditOutlined />}
                    onClick={() => navigate(`/u/${userId}/edit`)}
                    className="rounded-xl font-medium"
                  >
                    Edit Profile
                  </Button>
                </div>
              </div>

              <Divider className="my-6" />

              <Row gutter={[16, 16]}>
                <Col xs={12} md={6}>
                  <Statistic
                    title="Total Quotations"
                    value={myQuotations.length} // This will now work correctly
                    prefix={<FileTextOutlined />}
                  />
                </Col>
                <Col xs={12} md={6}>
                  <Statistic
                    title="Active Orders"
                    value={
                      myOrders.filter((o) => o.status !== "DELIVERED").length
                    }
                    prefix={<ShoppingCartOutlined />}
                    valueStyle={{ color: "#52c41a" }}
                  />
                </Col>
                <Col xs={12} md={6}>
                  <Statistic
                    title="Purchase Orders"
                    value={myPOs.length}
                    prefix={<DollarCircleOutlined />}
                    valueStyle={{ color: "#fa8c16" }}
                  />
                </Col>
                <Col xs={12} md={6}>
                  <Statistic
                    title="Team"
                    value={user?.team || "Individual"}
                    prefix={<TeamOutlined />}
                  />
                </Col>
              </Row>
            </Card>

            <Row gutter={[24, 24]}>
              <Col xs={24} lg={8}>
                <Card
                  title="Personal Information"
                  className="shadow rounded-xl"
                >
                  <Space direction="vertical" size="large" className="w-full">
                    <div>
                      <div className="text-gray-500 text-sm">Email</div>
                      <div className="font-medium flex items-center gap-2">
                        <MailOutlined className="text-blue-500" />
                        <a href={`mailto:${user?.email}`}>{user?.email}</a>
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-500 text-sm">Phone</div>
                      <div className="font-medium flex items-center gap-2">
                        <PhoneOutlined className="text-green-500" />
                        {user?.mobileNumber || "Not added"}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-500 text-sm">Birthday</div>
                      <div className="font-medium flex items-center gap-2">
                        <CalendarOutlined className="text-purple-500" />
                        {formatDate(user?.dateOfBirth)}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-500 text-sm">Joined</div>
                      <div className="font-medium flex items-center gap-2">
                        <ClockCircleOutlined className="text-orange-500" />
                        {formatDate(user?.createdAt)}
                      </div>
                    </div>
                  </Space>

                  <Card
                    title="Primary Address"
                    className="shadow rounded-xl mt-6"
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
                      <div className="flex items-start gap-3">
                        <EnvironmentOutlined className="text-red-500 text-xl mt-1" />
                        <div>
                          <div className="font-medium">
                            {primaryAddress.street}
                          </div>
                          <div className="text-gray-600">
                            {primaryAddress.city}, {primaryAddress.state}{" "}
                            {primaryAddress.postalCode}
                          </div>
                          <div className="text-gray-600">
                            {primaryAddress.country}
                          </div>
                          {primaryAddress.status === "PRIMARY" && (
                            <Tag color="green" className="mt-2">
                              Primary
                            </Tag>
                          )}
                        </div>
                      </div>
                    ) : (
                      <Empty
                        description="No address added"
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                      />
                    )}
                  </Card>
                </Card>
              </Col>

              <Col xs={24} lg={16}>
                <Card className="shadow rounded-xl">
                  <Tabs
                    items={tabItems}
                    size="large"
                    defaultActiveKey="overview"
                  />
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
