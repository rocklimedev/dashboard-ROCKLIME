import React, { useEffect, useState, useRef } from "react";
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
  Upload,
  Avatar,
  message,
  Divider,
  Modal,
} from "antd";
import moment from "moment";
import { UploadOutlined, UserOutlined } from "@ant-design/icons";
import Cropper from "react-cropper";
import {
  useUpdateProfileMutation,
  useUploadPhotoMutation,
  useGetProfileQuery,
} from "../../api/userApi";

const { Title, Text } = Typography;
const { Option } = Select;

const ProfileForm = ({ userId, onSuccess, onCancel }) => {
  const [form] = Form.useForm();
  const { data: profileData, isLoading, refetch } = useGetProfileQuery();
  const [updateProfile, { isLoading: isUpdating }] = useUpdateProfileMutation();
  const [uploadPhoto, { isLoading: isUploading }] = useUploadPhotoMutation();

  // Avatar URLs
  const [avatarUrl, setAvatarUrl] = useState(null); // thumbnail
  const [originalUrl, setOriginalUrl] = useState(null); // original (optional)

  // Crop modal
  const [cropModalVisible, setCropModalVisible] = useState(false);
  const [cropImage, setCropImage] = useState(null);
  const cropperRef = useRef(null);

  // -----------------------------------------------------------------
  // Load profile data
  // -----------------------------------------------------------------
  useEffect(() => {
    if (profileData?.user) {
      const u = profileData.user;
      form.setFieldsValue({
        username: u.username || "",
        name: u.name || "",
        email: u.email || "",
        mobileNumber: u.mobileNumber || "",
        dateOfBirth: u.dateOfBirth ? moment(u.dateOfBirth) : null,
        shiftFrom: u.shiftFrom ? moment(u.shiftFrom, "HH:mm:ss") : null,
        shiftTo: u.shiftTo ? moment(u.shiftTo, "HH:mm:ss") : null,
        bloodGroup: u.bloodGroup || null,
        emergencyNumber: u.emergencyNumber || "",
        street: u.address?.street || "",
        city: u.address?.city || "",
        state: u.address?.state || "",
        postalCode: u.address?.postalCode || "",
        country: u.address?.country || "",
      });

      setAvatarUrl(u.photo_thumbnail ?? null);
      setOriginalUrl(u.photo_original ?? null);
    }
  }, [profileData, form]);

  // -----------------------------------------------------------------
  // Upload + Crop flow
  // -----------------------------------------------------------------
  const beforeUpload = (file) => {
    const isImg = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
    ].includes(file.type);
    if (!isImg) {
      message.error("Only JPEG, PNG, or WEBP images are allowed");
      return Upload.LIST_IGNORE;
    }
    const isLt5M = file.size / 1024 / 1024 < 5;
    if (!isLt5M) {
      message.error("Image must be smaller than 5MB");
      return Upload.LIST_IGNORE;
    }

    // Open crop modal
    const reader = new FileReader();
    reader.onload = (e) => {
      setCropImage(e.target.result);
      setCropModalVisible(true);
    };
    reader.readAsDataURL(file);
    return false; // stop default upload
  };

  const handleCropSave = async () => {
    if (!cropperRef.current) return;

    const cropper = cropperRef.current.cropper;
    const canvas = cropper.getCroppedCanvas({ width: 400, height: 400 });

    canvas.toBlob(async (blob) => {
      if (!blob) return;

      try {
        const result = await uploadPhoto({ file: blob }).unwrap();

        // Backend must return { photo_thumbnail, photo_original }
        setAvatarUrl(result.photo_thumbnail);
        setOriginalUrl(result.photo_original);
        message.success("Avatar uploaded successfully!");

        setCropModalVisible(false);
        setCropImage(null);
      } catch (err) {
        message.error(err?.data?.message || "Upload failed");
      }
    }, "image/jpeg");
  };

  // -----------------------------------------------------------------
  // Save profile
  // -----------------------------------------------------------------
  const handleSave = async (values) => {
    if (!userId) return message.error("User ID not found.");

    const payload = {
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
      avatarUrl: avatarUrl || null, // thumbnail for UI
    };

    try {
      await updateProfile(payload).unwrap();
      message.success("Profile updated!");
      refetch?.();
      onSuccess?.();
    } catch (error) {
      message.error(
        `Failed to update profile: ${error.data?.message || "Unknown error"}`
      );
    }
  };

  // -----------------------------------------------------------------
  // Loading UI
  // -----------------------------------------------------------------
  if (isLoading) {
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

  // -----------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------
  return (
    <div className="page-wrapper">
      <div className="content">
        <Row gutter={[24, 24]}>
          {/* Avatar */}
          <Col xs={24} md={8} lg={6}>
            <div style={{ textAlign: "center" }}>
              <Avatar
                size={140}
                icon={<UserOutlined />}
                src={avatarUrl}
                style={{
                  border: "4px solid #f0f0f0",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                }}
              />
              <div style={{ marginTop: 16 }}>
                <Upload
                  name="photo"
                  showUploadList={false}
                  beforeUpload={beforeUpload}
                  disabled={isUploading}
                >
                  <Button
                    icon={<UploadOutlined />}
                    loading={isUploading}
                    block
                    type="default"
                    style={{ borderRadius: 8 }}
                  >
                    Change Avatar
                  </Button>
                </Upload>
                <Text
                  type="secondary"
                  style={{ display: "block", marginTop: 8, fontSize: 12 }}
                >
                  Max 5 MB (JPEG, PNG, WEBP)
                </Text>
              </div>
            </div>
          </Col>

          {/* Form */}
          <Col xs={24} md={16} lg={18}>
            <Form
              form={form}
              layout="vertical"
              onFinish={handleSave}
              style={{ width: "100%" }}
            >
              {/* Personal Information */}
              <Divider orientation="left">
                <Title level={5} style={{ margin: 0 }}>
                  Personal Information
                </Title>
              </Divider>

              <Row gutter={16}>
                <Col xs={24} sm={12}>
                  <Form.Item
                    label="Username"
                    name="username"
                    rules={[
                      { required: true, message: "Username is required" },
                      { max: 50, message: "Max 50 characters" },
                    ]}
                  >
                    <Input placeholder="Enter username" />
                  </Form.Item>
                </Col>

                <Col xs={24} sm={12}>
                  <Form.Item
                    label="Full Name"
                    name="name"
                    rules={[
                      { required: true, message: "Name is required" },
                      { max: 100, message: "Max 100 characters" },
                    ]}
                  >
                    <Input placeholder="Enter full name" />
                  </Form.Item>
                </Col>

                <Col xs={24} sm={12}>
                  <Form.Item
                    label="Email"
                    name="email"
                    rules={[
                      { required: true, message: "Email is required" },
                      { type: "email", message: "Invalid email" },
                      { max: 100, message: "Max 100 characters" },
                    ]}
                  >
                    <Input placeholder="example@domain.com" />
                  </Form.Item>
                </Col>

                <Col xs={24} sm={12}>
                  <Form.Item
                    label="Phone Number"
                    name="mobileNumber"
                    rules={[
                      {
                        pattern: /^[0-9]{10}$/,
                        message: "Must be 10 digits",
                      },
                    ]}
                  >
                    <Input placeholder="1234567890" />
                  </Form.Item>
                </Col>

                <Col xs={24} sm={12}>
                  <Form.Item label="Date of Birth" name="dateOfBirth">
                    <DatePicker
                      style={{ width: "100%" }}
                      format="YYYY-MM-DD"
                      placeholder="Select date"
                    />
                  </Form.Item>
                </Col>

                <Col xs={24} sm={12}>
                  <Form.Item label="Blood Group" name="bloodGroup">
                    <Select allowClear placeholder="Select blood group">
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
                        message: "Must be 10 digits",
                      },
                    ]}
                  >
                    <Input placeholder="Emergency contact number" />
                  </Form.Item>
                </Col>

                <Col xs={24} sm={12}>
                  <Form.Item label="Shift Start" name="shiftFrom">
                    <DatePicker
                      picker="time"
                      format="HH:mm:ss"
                      style={{ width: "100%" }}
                      placeholder="Shift Start"
                    />
                  </Form.Item>
                </Col>

                <Col xs={24} sm={12}>
                  <Form.Item label="Shift End" name="shiftTo">
                    <DatePicker
                      picker="time"
                      format="HH:mm:ss"
                      style={{ width: "100%" }}
                      placeholder="Shift End"
                    />
                  </Form.Item>
                </Col>
              </Row>

              {/* Address Information */}
              <Divider orientation="left" style={{ marginTop: 32 }}>
                <Title level={5} style={{ margin: 0 }}>
                  Address Information
                </Title>
              </Divider>

              <Row gutter={16}>
                <Col xs={24} sm={12}>
                  <Form.Item label="Street" name="street">
                    <Input placeholder="123 Main St" />
                  </Form.Item>
                </Col>

                <Col xs={24} sm={12}>
                  <Form.Item label="City" name="city">
                    <Input placeholder="Your City" />
                  </Form.Item>
                </Col>

                <Col xs={24} sm={12}>
                  <Form.Item label="State" name="state">
                    <Input placeholder="State" />
                  </Form.Item>
                </Col>

                <Col xs={24} sm={12}>
                  <Form.Item label="Postal Code" name="postalCode">
                    <Input placeholder="Postal Code" />
                  </Form.Item>
                </Col>

                <Col xs={24}>
                  <Form.Item label="Country" name="country">
                    <Input placeholder="Country" />
                  </Form.Item>
                </Col>
              </Row>

              {/* Action Buttons */}
              <Form.Item style={{ marginTop: 32, textAlign: "right" }}>
                <Space size="middle">
                  <Button
                    onClick={() => onCancel?.()}
                    size="large"
                    style={{ minWidth: 100 }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={isUpdating}
                    size="large"
                    style={{ minWidth: 140 }}
                  >
                    Save Changes
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </Col>
        </Row>

        {/* Crop Modal */}
        <Modal
          title="Crop Your Avatar"
          open={cropModalVisible}
          onCancel={() => {
            setCropModalVisible(false);
            setCropImage(null);
          }}
          footer={[
            <Button
              key="cancel"
              onClick={() => {
                setCropModalVisible(false);
                setCropImage(null);
              }}
            >
              Cancel
            </Button>,
            <Button
              key="save"
              type="primary"
              loading={isUploading}
              onClick={handleCropSave}
            >
              Save
            </Button>,
          ]}
          width={520}
        >
          {cropImage && (
            <Cropper
              src={cropImage}
              style={{ height: 350, width: "100%" }}
              initialAspectRatio={1}
              aspectRatio={1}
              guides={false}
              viewMode={1}
              ref={cropperRef}
              background={false}
              responsive
              autoCropArea={1}
              checkOrientation={false}
            />
          )}
        </Modal>
      </div>
    </div>
  );
};

export default ProfileForm;
