// src/components/settings/ChangePasswordModal.jsx
import React from "react";
import { Modal, Form, Input, Button, message } from "antd";
import { useChangePasswordMutation } from "../../api/authApi";

const ChangePasswordModal = ({ visible, onClose }) => {
  const [form] = Form.useForm();
  const [changePassword, { isLoading }] = useChangePasswordMutation();

  const handleSubmit = async (values) => {
    try {
      await changePassword({
        password: values.currentPassword,
        newPassword: values.newPassword,
      }).unwrap();

      message.success("Password changed successfully!");
      form.resetFields();
      onClose();
    } catch (error) {
      message.error(error?.data?.message || "Failed to change password");
    }
  };

  return (
    <Modal
      title="Change Password"
      open={visible}
      onCancel={() => {
        form.resetFields();
        onClose();
      }}
      footer={null}
      width={500}
      destroyOnClose
    >
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Form.Item
          name="currentPassword"
          label="Current Password"
          rules={[
            { required: true, message: "Please enter your current password" },
          ]}
        >
          <Input.Password placeholder="Enter current password" />
        </Form.Item>

        <Form.Item
          name="newPassword"
          label="New Password"
          rules={[
            { required: true, message: "Please enter a new password" },
            { min: 6, message: "Password must be at least 6 characters" },
          ]}
        >
          <Input.Password placeholder="Enter new password" />
        </Form.Item>

        <Form.Item style={{ marginBottom: 0, textAlign: "right" }}>
          <Button
            onClick={() => {
              form.resetFields();
              onClose();
            }}
            style={{ marginRight: 8 }}
          >
            Cancel
          </Button>
          <Button
            type="primary"
            htmlType="submit"
            loading={isLoading}
            disabled={isLoading}
          >
            Save Changes
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default ChangePasswordModal;