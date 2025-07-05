import React from "react";
import {
  Form,
  Input,
  Button,
  DatePicker,
  Select,
  Row,
  Col,
  Space,
  Typography,
} from "antd";
import moment from "moment";

const { Title } = Typography;
const { Option } = Select;

const ProfileForm = ({ form, handleSave, isUpdating, setIsEditing }) => {
  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleSave}
      className="profile-form"
    >
      <Title level={4}>Edit Profile</Title>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12}>
          <Form.Item
            label="Username"
            name="username"
            rules={[
              { required: true, message: "Username is required" },
              { max: 50, message: "Username cannot exceed 50 characters" },
            ]}
          >
            <Input />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12}>
          <Form.Item
            label="Name"
            name="name"
            rules={[
              { required: true, message: "Name is required" },
              { max: 100, message: "Name cannot exceed 100 characters" },
            ]}
          >
            <Input />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12}>
          <Form.Item
            label="Email"
            name="email"
            rules={[
              { required: true, message: "Email is required" },
              { type: "email", message: "Invalid email format" },
              { max: 100, message: "Email cannot exceed 100 characters" },
            ]}
          >
            <Input />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12}>
          <Form.Item
            label="Phone Number"
            name="mobileNumber"
            rules={[
              {
                pattern: /^[0-9]{10}$/,
                message: "Phone number must be 10 digits",
              },
            ]}
          >
            <Input />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12}>
          <Form.Item label="Date of Birth" name="dateOfBirth">
            <DatePicker style={{ width: "100%" }} />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12}>
          <Form.Item label="Blood Group" name="bloodGroup">
            <Select
              allowClear
              placeholder="Select blood group"
              style={{ width: "100%" }}
            >
              {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map(
                (group) => (
                  <Option key={group} value={group}>
                    {group}
                  </Option>
                )
              )}
            </Select>
          </Form.Item>
        </Col>
        <Col xs={24} sm={12}>
          <Form.Item
            label="Emergency Contact"
            name="emergencyNumber"
            rules={[
              {
                pattern: /^[0-9]{10}$/,
                message: "Emergency number must be 10 digits",
              },
            ]}
          >
            <Input />
          </Form.Item>
        </Col>
        <Col xs={24}>
          <Title level={5}>Address Information</Title>
        </Col>
        <Col xs={24} sm={12}>
          <Form.Item label="Street" name="street">
            <Input />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12}>
          <Form.Item label="City" name="city">
            <Input />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12}>
          <Form.Item label="State" name="state">
            <Input />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12}>
          <Form.Item label="Postal Code" name="postalCode">
            <Input />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12}>
          <Form.Item label="Country" name="country">
            <Input />
          </Form.Item>
        </Col>
        <Col xs={24}>
          <Space>
            <Button type="primary" htmlType="submit" loading={isUpdating}>
              Save Changes
            </Button>
            <Button onClick={() => setIsEditing(false)}>Cancel</Button>
          </Space>
        </Col>
      </Row>
    </Form>
  );
};

export default ProfileForm;
