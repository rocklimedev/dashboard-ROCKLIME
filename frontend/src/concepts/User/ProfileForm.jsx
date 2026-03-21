import React, { useState, useMemo, useEffect, useCallback } from "react";
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
  Slider,
  Card,
  Spin,
} from "antd";
import {
  UploadOutlined,
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  CalendarOutlined,
  HomeOutlined,
  SafetyCertificateOutlined,
} from "@ant-design/icons";
import moment from "moment";
import Cropper from "react-easy-crop";
import {
  useUpdateProfileMutation,
  useUploadPhotoMutation,
  useGetProfileQuery,
} from "../../api/userApi";

import "./profileform.css";

const { Title, Text } = Typography;
const { Option } = Select;

const getCroppedImg = (imageSrc, pixelCrop) => {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.src = imageSrc;
    image.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("Canvas context not available"));

      canvas.width = 400;
      canvas.height = 400;

      ctx.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        400,
        400,
      );

      canvas.toBlob(
        (blob) =>
          blob ? resolve(blob) : reject(new Error("Blob creation failed")),
        "image/jpeg",
        0.92,
      );
    };
    image.onerror = reject;
  });
};

const ProfileForm = ({ onSuccess, onCancel }) => {
  const [form] = Form.useForm();
  const { data: profileData, isLoading: profileLoading } = useGetProfileQuery();
  const [updateProfile, { isLoading: isUpdating }] = useUpdateProfileMutation();
  const [uploadPhoto, { isLoading: isUploading }] = useUploadPhotoMutation();

  const [avatarUrl, setAvatarUrl] = useState("");
  const [cropModalVisible, setCropModalVisible] = useState(false);
  const [cropImage, setCropImage] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const user = profileData?.user;

  useEffect(() => {
    if (user) {
      form.setFieldsValue({
        username: user.username || "",
        name: user.name || "",
        email: user.email || "",
        mobileNumber: user.mobileNumber || "",
        dateOfBirth: user.dateOfBirth ? moment(user.dateOfBirth) : null,
        bloodGroup: user.bloodGroup || undefined,
        emergencyNumber: user.emergencyNumber || "",
        shiftFrom: user.shiftFrom ? moment(user.shiftFrom, "HH:mm:ss") : null,
        shiftTo: user.shiftTo ? moment(user.shiftTo, "HH:mm:ss") : null,
        street: user.address?.street || "",
        city: user.address?.city || "",
        state: user.address?.state || "",
        postalCode: user.address?.postalCode || "",
        country: user.address?.country || "India",
      });
      setAvatarUrl(user.photo_thumbnail || "");
    }
  }, [user, form]);

  const beforeUpload = (file) => {
    const isValidType = /image\/(jpeg|png|webp)/.test(file.type);
    const isLt5M = file.size / 1024 / 1024 < 5;

    if (!isValidType) {
      message.error("Only JPG, PNG, or WebP files are allowed");
      return Upload.LIST_IGNORE;
    }
    if (!isLt5M) {
      message.error("Image must be smaller than 5MB");
      return Upload.LIST_IGNORE;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setCropImage(e.target.result);
      setCropModalVisible(true);
      setZoom(1);
      setCrop({ x: 0, y: 0 });
    };
    reader.readAsDataURL(file);
    return false;
  };

  const onCropComplete = useCallback((_, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleCropSave = async () => {
    if (!croppedAreaPixels) return;

    try {
      const croppedBlob = await getCroppedImg(cropImage, croppedAreaPixels);
      const result = await uploadPhoto(croppedBlob).unwrap();

      setAvatarUrl(result.photo_thumbnail);
      message.success("Profile photo updated");
      setCropModalVisible(false);
      setCropImage(null);
    } catch (err) {
      message.error("Failed to upload photo");
    }
  };

  const onFinish = async (values) => {
    const payload = {
      ...values,
      dateOfBirth: values.dateOfBirth?.format("YYYY-MM-DD") || null,
      shiftFrom: values.shiftFrom?.format("HH:mm:ss") || null,
      shiftTo: values.shiftTo?.format("HH:mm:ss") || null,
      photo_thumbnail: avatarUrl || null,
      address: {
        street: values.street?.trim() || "",
        city: values.city?.trim() || "",
        state: values.state?.trim() || "",
        postalCode: values.postalCode?.trim() || "",
        country: values.country?.trim() || "India",
      },
    };

    try {
      await updateProfile(payload).unwrap();
      message.success("Profile updated successfully");
      onSuccess?.();
    } catch (err) {
      message.error(err?.data?.message || "Failed to update profile");
    }
  };

  if (profileLoading) {
    return (
      <div className="profile-loading">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      <div className="content">
        <div className="profile-form-page">
          <Card className="profile-form-card">
            <div className="form-header">
              <Title level={3}>Edit Your Profile</Title>
              <Text type="secondary">Keep your information up to date</Text>
            </div>

            <Row gutter={[32, 32]}>
              {/* Avatar Column */}
              <Col xs={24} md={8}>
                <Card className="avatar-card">
                  <div className="avatar-preview">
                    <Avatar
                      size={180}
                      src={avatarUrl}
                      icon={<UserOutlined />}
                      className="avatar-main"
                    />
                  </div>

                  <Upload showUploadList={false} beforeUpload={beforeUpload}>
                    <Button
                      type="primary"
                      icon={<UploadOutlined />}
                      loading={isUploading}
                      block
                      size="large"
                      className="upload-btn"
                    >
                      Change Photo
                    </Button>
                  </Upload>

                  <Text type="secondary" className="upload-hint">
                    JPG, PNG, WebP • Max 5 MB
                  </Text>
                </Card>
              </Col>

              {/* Form Column */}
              <Col xs={24} md={16}>
                <Form form={form} layout="vertical" onFinish={onFinish}>
                  {/* Personal Information */}
                  <Divider orientation="left" plain>
                    <Space>
                      <UserOutlined className="section-icon" />
                      Personal Information
                    </Space>
                  </Divider>

                  <Row gutter={16}>
                    <Col xs={24} sm={12}>
                      <Form.Item
                        label="Full Name"
                        name="name"
                        rules={[
                          { required: true, message: "Please enter your name" },
                        ]}
                      >
                        <Input size="large" placeholder="John Doe" />
                      </Form.Item>
                    </Col>

                    <Col xs={24} sm={12}>
                      <Form.Item
                        label="Username"
                        name="username"
                        rules={[
                          { required: true, message: "Username is required" },
                        ]}
                      >
                        <Input size="large" placeholder="@johndoe" />
                      </Form.Item>
                    </Col>

                    <Col xs={24} sm={12}>
                      <Form.Item
                        label="Email Address"
                        name="email"
                        rules={[
                          { required: true, message: "Email is required" },
                          { type: "email", message: "Invalid email format" },
                        ]}
                      >
                        <Input
                          size="large"
                          prefix={<MailOutlined />}
                          disabled
                        />
                      </Form.Item>
                    </Col>

                    <Col xs={24} sm={12}>
                      <Form.Item
                        label="Phone Number"
                        name="mobileNumber"
                        rules={[
                          {
                            pattern: /^[0-9]{10}$/,
                            message: "Enter a valid 10-digit number",
                          },
                        ]}
                      >
                        <Input
                          size="large"
                          prefix={<PhoneOutlined />}
                          placeholder="9876543210"
                        />
                      </Form.Item>
                    </Col>

                    <Col xs={24} sm={12}>
                      <Form.Item label="Date of Birth" name="dateOfBirth">
                        <DatePicker size="large" style={{ width: "100%" }} />
                      </Form.Item>
                    </Col>

                    <Col xs={24} sm={12}>
                      <Form.Item label="Blood Group" name="bloodGroup">
                        <Select
                          size="large"
                          allowClear
                          placeholder="Select blood group"
                        >
                          {[
                            "A+",
                            "A-",
                            "B+",
                            "B-",
                            "AB+",
                            "AB-",
                            "O+",
                            "O-",
                          ].map((g) => (
                            <Option key={g} value={g}>
                              {g}
                            </Option>
                          ))}
                        </Select>
                      </Form.Item>
                    </Col>

                    <Col xs={24} sm={12}>
                      <Form.Item
                        label="Emergency Contact"
                        name="emergencyNumber"
                      >
                        <Input size="large" placeholder="9876543210" />
                      </Form.Item>
                    </Col>
                  </Row>

                  {/* Address Section */}
                  <Divider orientation="left" plain>
                    <Space>
                      <HomeOutlined className="section-icon" />
                      Address Information
                    </Space>
                  </Divider>

                  <Row gutter={16}>
                    <Col span={24}>
                      <Form.Item label="Street Address" name="street">
                        <Input
                          size="large"
                          placeholder="123 Main Street, Apt 4B"
                        />
                      </Form.Item>
                    </Col>

                    <Col xs={24} sm={12}>
                      <Form.Item label="City" name="city">
                        <Input size="large" placeholder="Mumbai" />
                      </Form.Item>
                    </Col>

                    <Col xs={24} sm={12}>
                      <Form.Item label="State / Province" name="state">
                        <Input size="large" placeholder="Maharashtra" />
                      </Form.Item>
                    </Col>

                    <Col xs={24} sm={12}>
                      <Form.Item label="Postal Code" name="postalCode">
                        <Input size="large" placeholder="400001" />
                      </Form.Item>
                    </Col>

                    <Col xs={24} sm={12}>
                      <Form.Item label="Country" name="country">
                        <Input size="large" placeholder="India" />
                      </Form.Item>
                    </Col>
                  </Row>

                  {/* Form Actions */}
                  <div className="form-actions">
                    <Button size="large" onClick={onCancel}>
                      Cancel
                    </Button>
                    <Button
                      type="primary"
                      size="large"
                      htmlType="submit"
                      loading={isUpdating}
                      className="submit-btn"
                    >
                      Save Changes
                    </Button>
                  </div>
                </Form>
              </Col>
            </Row>
          </Card>

          {/* Crop Modal */}
          <Modal
            title={<Title level={4}>Crop & Adjust Avatar</Title>}
            open={cropModalVisible}
            onCancel={() => {
              setCropModalVisible(false);
              setCropImage(null);
            }}
            footer={null}
            width={640}
            destroyOnClose
            className="crop-modal"
          >
            <div className="crop-container">
              <Cropper
                image={cropImage}
                crop={crop}
                zoom={zoom}
                aspect={1}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
                cropShape="round"
                showGrid={false}
              />
            </div>

            <div className="crop-controls">
              <Text strong>Zoom</Text>
              <Slider
                min={1}
                max={3}
                step={0.05}
                value={zoom}
                onChange={setZoom}
                tooltip={{ open: false }}
              />
            </div>

            <div className="crop-actions">
              <Button onClick={() => setCropModalVisible(false)}>Cancel</Button>
              <Button
                type="primary"
                loading={isUploading}
                onClick={handleCropSave}
              >
                Apply Photo
              </Button>
            </div>
          </Modal>
        </div>
      </div>
    </div>
  );
};

export default ProfileForm;
