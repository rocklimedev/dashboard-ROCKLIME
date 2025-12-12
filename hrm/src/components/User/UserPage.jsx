import React from "react";
import { useParams, Link } from "react-router-dom";
import { useGetUserByIdQuery } from "../../api/userApi";
import {
  Avatar,
  Card,
  Tag,
  Space,
  Row,
  Col,
  Typography,
  Button,
  Divider,
  Badge,
  Empty,
} from "antd";
import {
  LeftOutlined,
  EditOutlined,
  MailOutlined,
  PhoneOutlined,
  CalendarOutlined,
  TeamOutlined,
  HomeOutlined,
  ClockCircleOutlined,
  HeartOutlined,
  UserOutlined,
} from "@ant-design/icons";
import moment from "moment";

const { Title, Text } = Typography;

const UserPage = () => {
  const { userId } = useParams();
  const { data, isLoading, isError, error, refetch } = useGetUserByIdQuery(
    userId,
    { skip: !userId }
  );
  const user = data?.user;

  const formatDate = (date) =>
    date ? moment(date).format("DD MMM YYYY") : "—";
  const formatTime = (time) =>
    time ? moment(time, "HH:mm:ss").format("hh:mm A") : "—";

  const address = user?.address
    ? [
        user.address.street,
        user.address.city,
        user.address.state,
        user.address.country,
        user.address.postalCode,
      ]
        .filter(Boolean)
        .join(", ") || "—"
    : "No address added";

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-blue-600"></div>
      </div>
    );
  }

  if (isError || !user) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card>
          <Empty
            description={
              error?.status === 404
                ? "User not found"
                : "Failed to load user profile"
            }
          >
            <Button type="primary" onClick={refetch}>
              Try Again
            </Button>
          </Empty>
        </Card>
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      <div className="content">
        <div
          style={{
            background: "#f8fafc",
            minHeight: "100vh",
            padding: "32px 16px",
          }}
        >
          <div style={{ maxWidth: 1200, margin: "0 auto" }}>
            {/* Header */}
            <div className="mb-8">
              <Link
                to="/users/list"
                className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium"
              >
                <LeftOutlined className="mr-2" /> Back to Users
              </Link>
            </div>

            <Row gutter={[32, 32]}>
              {/* Left Sidebar */}
              <Col xs={24} lg={8}>
                <Card className="shadow-xl rounded-2xl border-0 text-center">
                  <div className="relative -top-16">
                    <Avatar
                      size={140}
                      src={user.photo_thumbnail || user.avatarUrl}
                      icon={<UserOutlined />}
                      className="shadow-2xl border-8 border-white"
                      style={{ backgroundColor: "#e0f2fe" }}
                    />
                  </div>

                  <div className="mt-4">
                    <Title level={2} className="mb-1">
                      {user.name}
                    </Title>
                    <Text type="secondary" className="text-lg block">
                      @{user.username || "user"}
                    </Text>

                    <Space wrap className="mt-4">
                      {user.roles?.map((role) => (
                        <Tag
                          key={role}
                          color="purple"
                          className="text-sm font-medium py-1 px-3"
                        >
                          {role.replace(/_/g, " ")}
                        </Tag>
                      ))}
                    </Space>

                    <div className="mt-6">
                      <Button
                        type="primary"
                        size="large"
                        icon={<EditOutlined />}
                        className="rounded-xl font-medium w-full"
                        onClick={() =>
                          (window.location.href = `/user/${userId}/edit`)
                        }
                      >
                        Edit Profile
                      </Button>
                    </div>
                  </div>

                  <Divider>Details</Divider>

                  <Space
                    direction="vertical"
                    size="large"
                    className="w-full text-left"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 flex items-center gap-3">
                        <TeamOutlined className="text-blue-600" /> Team
                      </span>
                      <strong>
                        {user.team ||
                          (user.roles?.includes("SALES")
                            ? "Sales Team"
                            : "Individual")}
                      </strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 flex items-center gap-3">
                        <CalendarOutlined className="text-green-600" /> Joined
                      </span>
                      <strong>{formatDate(user.createdAt)}</strong>
                    </div>
                    {user.shiftFrom && user.shiftTo && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600 flex items-center gap-3">
                          <ClockCircleOutlined className="text-purple-600" />{" "}
                          Shift
                        </span>
                        <strong>
                          {formatTime(user.shiftFrom)} –{" "}
                          {formatTime(user.shiftTo)}
                        </strong>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 flex items-center gap-3">
                        <Badge
                          status={
                            user.status === "ACTIVE" ? "success" : "default"
                          }
                        />{" "}
                        Status
                      </span>
                      <strong>
                        <Badge
                          status={
                            user.status === "ACTIVE" ? "success" : "error"
                          }
                          text={user.status || "Unknown"}
                        />
                      </strong>
                    </div>
                  </Space>
                </Card>
              </Col>

              {/* Right Content */}
              <Col xs={24} lg={16}>
                {/* Basic Information */}
                <Card
                  title={
                    <Title level={4} className="flex items-center gap-2">
                      <UserOutlined className="text-blue-600" /> Personal
                      Information
                    </Title>
                  }
                  className="shadow-lg rounded-2xl mb-6"
                >
                  <Row gutter={[32, 24]}>
                    <Col xs={24} md={12}>
                      <Space direction="vertical">
                        <Text type="secondary">Email</Text>
                        <Text strong className="flex items-center gap-2">
                          <MailOutlined className="text-blue-500" />
                          <a href={`mailto:${user.email}`}>{user.email}</a>
                        </Text>
                      </Space>
                    </Col>
                    <Col xs={24} md={12}>
                      <Space direction="vertical">
                        <Text type="secondary">Phone</Text>
                        <Text strong className="flex items-center gap-2">
                          <PhoneOutlined className="text-green-500" />
                          {user.mobileNumber || "—"}
                        </Text>
                      </Space>
                    </Col>
                    <Col xs={24} md={12}>
                      <Space direction="vertical">
                        <Text type="secondary">Birthday</Text>
                        <Text strong className="flex items-center gap-2">
                          <CalendarOutlined className="text-purple-500" />
                          {formatDate(user.dateOfBirth)}
                        </Text>
                      </Space>
                    </Col>
                    <Col xs={24} md={12}>
                      <Space direction="vertical">
                        <Text type="secondary">Blood Group</Text>
                        <Text strong className="flex items-center gap-2">
                          <HeartOutlined className="text-red-500" />
                          {user.bloodGroup || "—"}
                        </Text>
                      </Space>
                    </Col>
                    <Col span={24}>
                      <Space direction="vertical">
                        <Text type="secondary">Address</Text>
                        <Text strong className="flex items-start gap-3">
                          <HomeOutlined className="text-orange-500 mt-1" />
                          <span>{address}</span>
                        </Text>
                      </Space>
                    </Col>
                  </Row>
                </Card>

                {/* Emergency Contact */}
                {user.emergencyNumber && (
                  <Card
                    title={
                      <Title level={4} className="flex items-center gap-2">
                        <PhoneOutlined className="text-red-600" /> Emergency
                        Contact
                      </Title>
                    }
                    className="shadow-lg rounded-2xl"
                  >
                    <Text strong className="text-lg flex items-center gap-3">
                      <PhoneOutlined className="text-red-500" />
                      {user.emergencyNumber}
                    </Text>
                  </Card>
                )}
              </Col>
            </Row>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserPage;
