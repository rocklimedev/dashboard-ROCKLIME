import React from "react";
import { Modal, Form, Input } from "antd";

export default function EditFloorModal({
  visible,
  floorName,
  onCancel,
  onFinish,
  form,
}) {
  React.useEffect(() => {
    if (visible) {
      form.setFieldsValue({ name: floorName });
    }
  }, [visible, floorName, form]);

  return (
    <Modal
      title="Edit Floor Name"
      open={visible}
      onOk={() => form.submit()}
      onCancel={onCancel}
      okText="Save"
    >
      <Form form={form} onFinish={onFinish} layout="vertical">
        <Form.Item
          name="name"
          label="Floor Name"
          rules={[{ required: true, message: "Please enter floor name" }]}
        >
          <Input placeholder="e.g. First Floor" />
        </Form.Item>
      </Form>
    </Modal>
  );
}
