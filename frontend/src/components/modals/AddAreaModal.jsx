import React from "react";
import { Modal, Form, Select } from "antd";

const { Option } = Select;

export const AREA_OPTIONS = [
  { value: "shower", label: "Shower Area" },
  { value: "basin", label: "Basin Area" },
  { value: "wc", label: "WC Area" },
];

export default function AddAreaModal({ visible, onCancel, onFinish, form }) {
  return (
    <Modal
      title="Add Area (choose from fixed options)"
      open={visible}
      onOk={() => form.submit()}
      onCancel={onCancel}
      okText="Add Area"
    >
      <Form form={form} onFinish={onFinish} layout="vertical">
        <Form.Item
          name="areaType"
          label="Area Type"
          rules={[{ required: true, message: "Please select an area type" }]}
        >
          <Select placeholder="Select one of the 3 standard areas">
            {AREA_OPTIONS.map((opt) => (
              <Option key={opt.value} value={opt.value}>
                {opt.label}
              </Option>
            ))}
          </Select>
        </Form.Item>
      </Form>
    </Modal>
  );
}
