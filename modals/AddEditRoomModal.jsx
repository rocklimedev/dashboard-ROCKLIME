import React from "react";
import { Modal, Form, Input, Select } from "antd";

const { Option } = Select;

export default function AddEditRoomModal({
  visible,
  isEdit = false,
  initialValues = {},
  onCancel,
  onFinish,
  form,
}) {
  React.useEffect(() => {
    if (visible) {
      form.setFieldsValue(initialValues);
    } else {
      form.resetFields();
    }
  }, [visible, initialValues, form]);

  return (
    <Modal
      title={isEdit ? "Edit Room" : "Add Room"}
      open={visible}
      onOk={() => form.submit()}
      onCancel={onCancel}
      okText={isEdit ? "Save" : "Add Room"}
    >
      <Form form={form} onFinish={onFinish} layout="vertical">
        <Form.Item
          name="name"
          label="Room Name"
          rules={[{ required: true, message: "Please enter room name" }]}
        >
          <Input placeholder="e.g. Master Bathroom, Guest Bedroom" />
        </Form.Item>

        <Form.Item name="type" label="Room Type (optional)">
          <Select placeholder="Select type" allowClear>
            <Option value="Bedroom">Bedroom</Option>
            <Option value="Living">Living Room</Option>
            <Option value="Kitchen">Kitchen</Option>
            <Option value="Bathroom">Bathroom</Option>
            <Option value="Store">Store</Option>
            <Option value="Other">Other</Option>
          </Select>
        </Form.Item>
      </Form>
    </Modal>
  );
}