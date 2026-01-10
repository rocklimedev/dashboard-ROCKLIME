import React, { useState } from "react";
import { message, Modal, Input, Form, Button, Typography } from "antd";
import { useCreateRoleMutation } from "../../api/rolesApi";

const { Title } = Typography;

const AddRoleModal = ({ show, onClose }) => {
  const [roleName, setRoleName] = useState("");
  const [createRole, { isLoading }] = useCreateRoleMutation();
  const [form] = Form.useForm();

  const handleSubmit = async () => {
    if (!roleName.trim()) {
      message.error("Role name is required.");
      return;
    }

    try {
      await createRole({ roleName }).unwrap();
      message.success("Role added successfully!");
      setRoleName("");
      form.resetFields();
      onClose();
    } catch (error) {
      message.error(
        `Failed to add role: ${error.data?.message || "Please try again."}`
      );
    }
  };

  const handleCancel = () => {
    setRoleName("");
    form.resetFields();
    onClose();
  };

  return (
    <Modal
      open={show}
      onCancel={handleCancel}
      title={
        <Title level={4} style={{ margin: 0 }}>
          Add New Role
        </Title>
      }
      footer={null}
      centered
      width={500}
      confirmLoading={isLoading}
    >
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Form.Item
          label="Role Name"
          name="roleName"
          rules={[
            { required: true, message: "Please enter a role name!" },
            { whitespace: true, message: "Role name cannot be empty!" },
          ]}
        >
          <Input
            placeholder="Enter role name"
            value={roleName}
            onChange={(e) => setRoleName(e.target.value)}
            size="large"
          />
        </Form.Item>

        <Form.Item style={{ marginBottom: 0, textAlign: "right" }}>
          <Button onClick={handleCancel} style={{ marginRight: 8 }}>
            Cancel
          </Button>
          <Button type="primary" htmlType="submit" loading={isLoading}>
            Add Role
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default AddRoleModal;
