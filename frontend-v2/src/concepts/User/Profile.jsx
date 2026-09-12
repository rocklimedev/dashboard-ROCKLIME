import React, { useState, useEffect, useCallback } from "react";
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
  HomeOutlined,
} from "@ant-design/icons";
import moment from "moment";
import Cropper from "react-easy-crop";

import {
  useUpdateProfileMutation,
  useUploadPhotoMutation,
  useGetProfileQuery,
} from "../../api/userApi";

const { Title, Text } = Typography;
const { Option } = Select;

const getCroppedImg = (imageSrc, pixelCrop) => {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.src = imageSrc;
    image.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("Canvas error"));

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
        (blob) => {
          blob ? resolve(blob) : reject(new Error("Failed to create blob"));
        },
        "image/jpeg",
        0.92,
      );
    };
    image.onerror = () => reject(new Error("Image load failed"));
  });
};

const Profile = ({ onSuccess, onCancel }) => {
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

  // Populate form
  useEffect(() => {
    if (user) {
      form.setFieldsValue({
        name: user.name || "",
        username: user.username || "",
        email: user.email || "",
        mobileNumber: user.mobileNumber || "",
        dateOfBirth: user.dateOfBirth ? moment(user.dateOfBirth) : null,
        bloodGroup: user.bloodGroup || undefined,
        emergencyNumber: user.emergencyNumber || "",
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
      message.error("Only JPG, PNG, WebP allowed");
      return Upload.LIST_IGNORE;
    }
    if (!isLt5M) {
      message.error("Image must be < 5MB");
      return Upload.LIST_IGNORE;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setCropImage(e.target.result);
      setCropModalVisible(true);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
    };
    reader.readAsDataURL(file);
    return false;
  };

  const onCropComplete = useCallback((_, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleCropSave = async () => {
    if (!croppedAreaPixels || !cropImage) return;

    try {
      const croppedBlob = await getCroppedImg(cropImage, croppedAreaPixels);
      const result = await uploadPhoto(croppedBlob).unwrap();

      setAvatarUrl(result.photo_thumbnail);
      message.success("Photo updated successfully");
      setCropModalVisible(false);
      setCropImage(null);
    } catch (err) {
      message.error("Failed to upload photo");
    }
  };

  const onFinish = async (values) => {
    const payload = {
      name: values.name,
      username: values.username,
      mobileNumber: values.mobileNumber,
      dateOfBirth: values.dateOfBirth?.format("YYYY-MM-DD") || null,
      bloodGroup: values.bloodGroup || null,
      emergencyNumber: values.emergencyNumber || null,
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
      message.error(err?.data?.message || "Update failed");
    }
  };

  if (profileLoading)
    return (
      <Spin size="large" style={{ display: "block", margin: "50px auto" }} />
    );

  return (
    <div className="page-wrapper">
      <div className="content">
        <div className="profile-form-page">
          <Card>
            <Row gutter={[32, 32]}>
              {/* Avatar Section */}
              <Col xs={24} md={8}>
                <Card className="avatar-card" style={{ textAlign: "center" }}>
                  <Avatar size={180} src={avatarUrl} icon={<UserOutlined />} />

                  <Upload showUploadList={false} beforeUpload={beforeUpload}>
                    <Button
                      type="primary"
                      icon={<UploadOutlined />}
                      loading={isUploading}
                      block
                      size="large"
                      style={{ marginTop: 16 }}
                    >
                      Change Photo
                    </Button>
                  </Upload>

                  <Text
                    type="secondary"
                    style={{ fontSize: "12px", marginTop: 8, display: "block" }}
                  >
                    JPG, PNG, WebP • Max 5MB
                  </Text>
                </Card>
              </Col>

              {/* Form Section */}
              <Col xs={24} md={16}>
                <Form form={form} layout="vertical" onFinish={onFinish}>
                  <Divider orientation="left">Personal Information</Divider>

                  <Row gutter={16}>
                    <Col xs={24} sm={12}>
                      <Form.Item
                        label="Full Name"
                        name="name"
                        rules={[{ required: true }]}
                      >
                        <Input size="large" placeholder="John Doe" />
                      </Form.Item>
                    </Col>

                    <Col xs={24} sm={12}>
                      <Form.Item
                        label="Username"
                        name="username"
                        rules={[{ required: true }]}
                      >
                        <Input size="large" placeholder="@johndoe" />
                      </Form.Item>
                    </Col>

                    <Col xs={24} sm={12}>
                      <Form.Item label="Email" name="email">
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
                            message: "10-digit number",
                          },
                        ]}
                      >
                        <Input size="large" prefix={<PhoneOutlined />} />
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

                  <Divider orientation="left">Address</Divider>

                  <Row gutter={16}>
                    <Col span={24}>
                      <Form.Item label="Street Address" name="street">
                        <Input size="large" placeholder="123 Main Street" />
                      </Form.Item>
                    </Col>

                    <Col xs={24} sm={12}>
                      <Form.Item label="City" name="city">
                        <Input size="large" />
                      </Form.Item>
                    </Col>

                    <Col xs={24} sm={12}>
                      <Form.Item label="State" name="state">
                        <Input size="large" />
                      </Form.Item>
                    </Col>

                    <Col xs={24} sm={12}>
                      <Form.Item label="Postal Code" name="postalCode">
                        <Input size="large" />
                      </Form.Item>
                    </Col>

                    <Col xs={24} sm={12}>
                      <Form.Item label="Country" name="country">
                        <Input size="large" defaultValue="India" />
                      </Form.Item>
                    </Col>
                  </Row>

                  <div style={{ marginTop: 24, textAlign: "right" }}>
                    <Space>
                      <Button size="large" onClick={onCancel}>
                        Cancel
                      </Button>
                      <Button
                        type="primary"
                        size="large"
                        htmlType="submit"
                        loading={isUpdating}
                      >
                        Save Changes
                      </Button>
                    </Space>
                  </div>
                </Form>
              </Col>
            </Row>
          </Card>

          {/* Crop Modal */}
          <Modal
            title="Crop Avatar"
            open={cropModalVisible}
            onCancel={() => {
              setCropModalVisible(false);
              setCropImage(null);
            }}
            footer={null}
            width={600}
            destroyOnClose
          >
            <div
              style={{
                position: "relative",
                height: 400,
                background: "#f0f0f0",
              }}
            >
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

            <div style={{ margin: "16px 0" }}>
              <Text strong>Zoom</Text>
              <Slider
                min={1}
                max={3}
                step={0.05}
                value={zoom}
                onChange={setZoom}
              />
            </div>

            <div style={{ textAlign: "right" }}>
              <Space>
                <Button onClick={() => setCropModalVisible(false)}>
                  Cancel
                </Button>
                <Button
                  type="primary"
                  loading={isUploading}
                  onClick={handleCropSave}
                >
                  Apply Photo
                </Button>
              </Space>
            </div>
          </Modal>
        </div>
      </div>
    </div>
  );
};

export default Profile;
