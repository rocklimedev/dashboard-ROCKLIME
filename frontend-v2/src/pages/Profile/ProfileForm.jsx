import React, { useEffect, useState, useCallback } from "react";
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
} from "antd";
import {
  UploadOutlined,
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  CalendarOutlined,
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
        400
      );

      canvas.toBlob(
        (blob) => {
          blob ? resolve(blob) : reject(new Error("Crop failed"));
        },
        "image/jpeg",
        0.95
      );
    };
    image.onerror = reject;
  });
};

const ProfileForm = ({ onSuccess, onCancel }) => {
  const [form] = Form.useForm();
  const { data: profileData, isLoading } = useGetProfileQuery();
  const [updateProfile, { isLoading: isUpdating }] = useUpdateProfileMutation();
  const [uploadPhoto, { isLoading: isUploading }] = useUploadPhotoMutation();

  const [avatarUrl, setAvatarUrl] = useState("");
  const [cropModalVisible, setCropModalVisible] = useState(false);
  const [cropImage, setCropImage] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  useEffect(() => {
    if (profileData?.user) {
      const u = profileData.user;
      form.setFieldsValue({
        username: u.username || "",
        name: u.name || "",
        email: u.email || "",
        mobileNumber: u.mobileNumber || "",
        dateOfBirth: u.dateOfBirth ? moment(u.dateOfBirth) : null,
        bloodGroup: u.bloodGroup || undefined,
        emergencyNumber: u.emergencyNumber || "",
        shiftFrom: u.shiftFrom ? moment(u.shiftFrom, "HH:mm:ss") : null,
        shiftTo: u.shiftTo ? moment(u.shiftTo, "HH:mm:ss") : null,
        street: u.address?.street || "",
        city: u.address?.city || "",
        state: u.address?.state || "",
        postalCode: u.address?.postalCode || "",
        country: u.address?.country || "",
      });
      setAvatarUrl(u.photo_thumbnail || "");
    }
  }, [profileData, form]);

  const beforeUpload = (file) => {
    const isImage = /image\/(jpeg|png|webp)/.test(file.type);
    const isLt5M = file.size / 1024 / 1024 < 5;

    if (!isImage) {
      message.error("Only JPG, PNG, or WebP images allowed!");
      return Upload.LIST_IGNORE;
    }
    if (!isLt5M) {
      message.error("Image must be smaller than 5MB!");
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
    try {
      const croppedBlob = await getCroppedImg(cropImage, croppedAreaPixels);
      const result = await uploadPhoto(croppedBlob).unwrap();

      setAvatarUrl(result.photo_thumbnail);
      message.success("Avatar updated successfully!");
      setCropModalVisible(false);
      setCropImage(null);
    } catch (err) {
      message.error("Failed to upload image");
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
        country: values.country?.trim() || "",
      },
    };

    try {
      await updateProfile(payload).unwrap();
      message.success("Profile updated successfully!");
      onSuccess?.();
    } catch (err) {
      message.error(err?.data?.message || "Failed to update profile");
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-blue-600"></div>
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
            padding: "24px 0",
          }}
        >
          <div style={{ maxWidth: 1000, margin: "0 auto", padding: "0 16px" }}>
            <Card className="shadow-xl rounded-2xl border-0">
              <div className="text-center mb-8">
                <Title level={2} className="text-gray-800">
                  Edit Profile
                </Title>
                <Text type="secondary">Update your personal information</Text>
              </div>

              <Row gutter={[32, 24]} align="top">
                {/* Avatar Section */}
                <Col xs={24} md={8}>
                  <Card className="text-center border-0 shadow-lg rounded-2xl">
                    <Avatar
                      size={160}
                      icon={<UserOutlined />}
                      src={avatarUrl}
                      className="shadow-2xl border-8 border-white"
                      style={{ backgroundColor: "#e6f7ff" }}
                    />
                    <div className="mt-6">
                      <Upload
                        showUploadList={false}
                        beforeUpload={beforeUpload}
                      >
                        <Button
                          type="primary"
                          size="large"
                          icon={<UploadOutlined />}
                          loading={isUploading}
                          className="rounded-xl font-medium"
                        >
                          Change Avatar
                        </Button>
                      </Upload>
                      <Text type="secondary" className="block mt-3 text-sm">
                        JPG, PNG or WebP • Max 5MB
                      </Text>
                    </div>
                  </Card>
                </Col>

                {/* Form Section */}
                <Col xs={24} md={16}>
                  <Form form={form} layout="vertical" onFinish={onFinish}>
                    {/* Personal Info */}
                    <Divider>
                      <Title level={4} className="flex items-center gap-2">
                        <UserOutlined className="text-blue-600" />
                        Personal Information
                      </Title>
                    </Divider>

                    <Row gutter={16}>
                      <Col xs={24} sm={12}>
                        <Form.Item
                          label="Full Name"
                          name="name"
                          rules={[
                            { required: true, message: "Name is required" },
                          ]}
                        >
                          <Input
                            size="large"
                            prefix={<UserOutlined />}
                            placeholder="John Doe"
                          />
                        </Form.Item>
                      </Col>
                      <Col xs={24} sm={12}>
                        <Form.Item
                          label="Username"
                          name="username"
                          rules={[
                            { required: true, message: "Username required" },
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
                            { required: true, message: "Email required" },
                            { type: "email", message: "Invalid email" },
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
                              message: "10 digits only",
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
                          <DatePicker
                            size="large"
                            style={{ width: "100%" }}
                            prefix={<CalendarOutlined />}
                          />
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

                    {/* Address */}
                    <Divider>
                      <Title level={4} className="flex items-center gap-2">
                        <HomeOutlined className="text-green-600" />
                        Address
                      </Title>
                    </Divider>

                    <Row gutter={16}>
                      <Col span={24}>
                        <Form.Item label="Street Address" name="street">
                          <Input size="large" placeholder="123 Main Street" />
                        </Form.Item>
                      </Col>
                      <Col xs={24} sm={12}>
                        <Form.Item label="City" name="city">
                          <Input size="large" placeholder="Mumbai" />
                        </Form.Item>
                      </Col>
                      <Col xs={24} sm={12}>
                        <Form.Item label="State" name="state">
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

                    {/* Actions */}
                    <div className="flex justify-end gap-4 mt-10">
                      <Button size="large" onClick={onCancel}>
                        Cancel
                      </Button>
                      <Button
                        type="primary"
                        size="large"
                        htmlType="submit"
                        loading={isUpdating}
                        className="px-8 font-medium"
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
              title={<Title level={4}>Crop Your Avatar</Title>}
              open={cropModalVisible}
              onCancel={() => {
                setCropModalVisible(false);
                setCropImage(null);
              }}
              footer={null}
              width={560}
              destroyOnClose
            >
              <div
                style={{
                  position: "relative",
                  height: 400,
                  background: "#000",
                  borderRadius: 12,
                  overflow: "hidden",
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
                  style={{ containerStyle: { borderRadius: 12 } }}
                />
              </div>
              <div className="mt-6">
                <Text>Zoom</Text>
                <Slider
                  min={1}
                  max={3}
                  step={0.1}
                  value={zoom}
                  onChange={setZoom}
                  className="mt-2"
                />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <Button onClick={() => setCropModalVisible(false)}>
                  Cancel
                </Button>
                <Button
                  type="primary"
                  loading={isUploading}
                  onClick={handleCropSave}
                >
                  Apply
                </Button>
              </div>
            </Modal>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileForm;
