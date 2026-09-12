import React from "react";
import { Modal, Form, Input, Select, message } from "antd";
import { useCreateWarehouseMutation } from "../../api/deviceManagementApi";

export default function WarehouseFormModal({ open, onClose }) {
  const [form] = Form.useForm();
  const [createWarehouse, { isLoading }] = useCreateWarehouseMutation();

  const handleClose = () => {
    form.resetFields();
    onClose();
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      await createWarehouse(values).unwrap();
      message.success("Warehouse added");
      handleClose();
    } catch (err) {
      if (err?.data?.message) message.error(err.data.message);
    }
  };

  return (
    <Modal
      title="Add warehouse"
      open={open}
      onCancel={handleClose}
      onOk={handleSubmit}
      confirmLoading={isLoading}
      destroyOnClose
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="name"
          label="Name"
          rules={[{ required: true, message: "Name is required" }]}
        >
          <Input placeholder="Godown A" />
        </Form.Item>
        <Form.Item
          name="code"
          label="Code"
          rules={[{ required: true, message: "Code is required" }]}
        >
          <Input placeholder="GDN-A" className="dm-mono" />
        </Form.Item>
        <Form.Item name="status" label="Status" initialValue="active">
          <Select
            options={[
              { value: "active", label: "Active" },
              { value: "inactive", label: "Inactive" },
            ]}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}
