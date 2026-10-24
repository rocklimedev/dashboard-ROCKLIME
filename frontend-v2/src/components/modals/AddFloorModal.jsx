import ModalShell from '../Common/ModalShell';
import React from 'react';
import { Form, Input } from 'antd';

export default function AddFloorModal({ visible, onCancel, onFinish, form }) {
  return (
    <ModalShell
      title="Add New Floor"
      open={visible}
      onOk={() => form.submit()}
      onCancel={onCancel}
      okText="Add Floor"
    >
      <Form form={form} onFinish={onFinish} layout="vertical">
        <Form.Item
          name="name"
          label="Floor Name"
          rules={[{ required: true, message: 'Please enter floor name' }]}
        >
          <Input placeholder="e.g. First Floor, Terrace, Basement" />
        </Form.Item>
      </Form>
    </ModalShell>
  );
}
