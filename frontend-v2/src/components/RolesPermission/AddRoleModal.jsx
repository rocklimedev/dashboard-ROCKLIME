import ModalShell from '../Common/ModalShell';
import './AddRoleModal.styles.css';
import React, { useState } from 'react';
import { Input, Form, Typography } from 'antd';
import { toast } from 'sonner';
import { useCreateRoleMutation } from '../../api/rolesApi';

const { Title } = Typography;

const AddRoleModal = ({ show, onClose }) => {
  const [roleName, setRoleName] = useState('');
  const [createRole, { isLoading }] = useCreateRoleMutation();
  const [form] = Form.useForm();

  const handleSubmit = async () => {
    if (!roleName.trim()) {
      toast.error('Role name is required.');
      return;
    }

    try {
      await createRole({ roleName }).unwrap();
      toast.success('Role added successfully!');
      setRoleName('');
      form.resetFields();
      onClose();
    } catch (error) {
      toast.error(`Failed to add role: ${error.data?.message || 'Please try again.'}`);
    }
  };

  const handleCancel = () => {
    setRoleName('');
    form.resetFields();
    onClose();
  };

  return (
    <ModalShell
      open={show}
      onCancel={handleCancel}
      title={
        <Title className="fv2-addrolemodal-cbed51f617" level={4}>
          Add New Role
        </Title>
      }
      onOk={() => form.submit()}
      okText={<>Add Role</>}
      onCancelButton={handleCancel}
      confirmLoading={isLoading}
      cancelButtonProps={{ className: 'fv2-addrolemodal-0148e35b6b' }}
      centered
      width={500}
      confirmLoading={isLoading}
    >
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Form.Item
          label="Role Name"
          name="roleName"
          rules={[
            { required: true, message: 'Please enter a role name!' },
            { whitespace: true, message: 'Role name cannot be empty!' },
          ]}
        >
          <Input
            placeholder="Enter role name"
            value={roleName}
            onChange={(e) => setRoleName(e.target.value)}
            size="large"
          />
        </Form.Item>
      </Form>
    </ModalShell>
  );
};

export default AddRoleModal;
