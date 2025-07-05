import React from "react";
import { Button, Row, Col, Typography } from "antd";
import { EditOutlined } from "@ant-design/icons";
import moment from "moment";

const { Title, Text } = Typography;

const ProfileDetails = ({ user, setIsEditing }) => {
  return (
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
  );
};

export default ProfileDetails;
