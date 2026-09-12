import React, { useState } from 'react';
import { Modal, Form, Input, Select, Button, Alert, message, Typography } from 'antd';
import { CopyOutlined } from '@ant-design/icons';
import { useRegisterDeviceMutation, useGetWarehousesQuery } from '../api/deviceManagementApi';

const FUNCTION_OPTIONS = [
  { value: 'ORDERS', label: 'Orders' },
  { value: 'PICKING', label: 'Picking' },
  { value: 'DISPATCH', label: 'Dispatch' },
  { value: 'INVENTORY', label: 'Inventory' },
];

export default function RegisterDeviceModal({ open, onClose }) {
  const [form] = Form.useForm();
  const [registerDevice, { isLoading }] = useRegisterDeviceMutation();
  const { data: warehouses = [] } = useGetWarehousesQuery();
  const [result, setResult] = useState(null); // { device, secret } once registered

  const handleClose = () => {
    form.resetFields();
    setResult(null);
    onClose();
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const response = await registerDevice(values).unwrap();
      setResult(response);
    } catch (err) {
      if (err?.data?.message) {
        message.error(err.data.message);
      }
      // validation errors are already shown inline by the form
    }
  };

  const copySecret = () => {
    navigator.clipboard.writeText(result.secret);
    message.success('Secret copied');
  };

  return (
    <Modal
      title={result ? 'Terminal registered' : 'Register a terminal'}
      open={open}
      onCancel={handleClose}
      footer={
        result ? (
          <Button type="primary" onClick={handleClose}>
            Done
          </Button>
        ) : (
          [
            <Button key="cancel" onClick={handleClose}>
              Cancel
            </Button>,
            <Button key="submit" type="primary" loading={isLoading} onClick={handleSubmit}>
              Register
            </Button>,
          ]
        )
      }
      destroyOnClose
    >
      {result ? (
        <>
          <Alert
            type="warning"
            showIcon
            message="This secret is shown once"
            description="Copy it into the terminal's provisioning config now — it can't be retrieved again. If it's lost, rotate the secret from the device detail page instead."
            style={{ marginBottom: 16 }}
          />
          <Typography.Text type="secondary">Device ID</Typography.Text>
          <div className="dm-mono" style={{ marginBottom: 12 }}>
            {result.device.deviceId}
          </div>
          <Typography.Text type="secondary">Device secret</Typography.Text>
          <div className="dm-secret-reveal">
            <span className="dm-mono" style={{ wordBreak: 'break-all' }}>
              {result.secret}
            </span>
            <Button icon={<CopyOutlined />} onClick={copySecret}>
              Copy
            </Button>
          </div>
        </>
      ) : (
        <Form form={form} layout="vertical">
          <Form.Item
            name="deviceId"
            label="Device ID"
            rules={[{ required: true, message: 'Device ID is required' }]}
            tooltip="Human-facing identifier, e.g. CM-PI-005"
          >
            <Input placeholder="CM-PI-005" className="dm-mono" />
          </Form.Item>
          <Form.Item name="assetTag" label="Asset tag">
            <Input placeholder="Optional" />
          </Form.Item>
          <Form.Item name="warehouseId" label="Warehouse">
            <Select
              allowClear
              placeholder="Assign later if unsure"
              options={warehouses.map((w) => ({ value: w.id, label: w.name }))}
            />
          </Form.Item>
          <Form.Item name="function" label="Function">
            <Select allowClear placeholder="Assign later if unsure" options={FUNCTION_OPTIONS} />
          </Form.Item>
          <Form.Item name="screen" label="Screen">
            <Input placeholder="e.g. Order Processing" />
          </Form.Item>
          <Form.Item name="route" label="Route">
            <Input placeholder="e.g. /order-processing" className="dm-mono" />
          </Form.Item>
        </Form>
      )}
    </Modal>
  );
}
