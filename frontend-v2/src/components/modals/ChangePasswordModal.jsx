import ModalShell from '../Common/ModalShell';
import './ChangePasswordModal.styles.css';
// src/components/settings/ChangePasswordModal.jsx
import React from 'react';
import { Form, Input } from 'antd';
import { toast } from 'sonner';
import { useChangePasswordMutation } from '../../api/authApi';

const ChangePasswordModal = ({ visible, onClose }) => {
  const [form] = Form.useForm();
  const [changePassword, { isLoading }] = useChangePasswordMutation();

  const handleSubmit = async (values) => {
    try {
      await changePassword({
        password: values.currentPassword,
        newPassword: values.newPassword,
      }).unwrap();

      toast.success('Password changed successfully!');
      form.resetFields();
      onClose();
    } catch (error) {
      toast.error(error?.data?.message || 'Failed to change password');
    }
  };

  return (
    <ModalShell
      title="Change Password"
      open={visible}
      onCancel={() => {
        form.resetFields();
        onClose();
      }}
      onOk={() => form.submit()}
      okText={<>Save Changes</>}
      onCancelButton={() => {
        form.resetFields();
        onClose();
      }}
      confirmLoading={isLoading}
      okButtonProps={{ disabled: isLoading }}
      cancelButtonProps={{ className: 'fv2-changepasswordmodal-af7645dc97' }}
      width={500}
      destroyOnClose
    >
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Form.Item
          name="currentPassword"
          label="Current Password"
          rules={[{ required: true, message: 'Please enter your current password' }]}
        >
          <Input.Password placeholder="Enter current password" />
        </Form.Item>

        <Form.Item
          name="newPassword"
          label="New Password"
          rules={[
            { required: true, message: 'Please enter a new password' },
            { min: 6, message: 'Password must be at least 6 characters' },
          ]}
        >
          <Input.Password placeholder="Enter new password" />
        </Form.Item>
      </Form>
    </ModalShell>
  );
};

export default ChangePasswordModal;
