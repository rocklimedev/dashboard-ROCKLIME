import React, { useEffect, useState } from 'react';
import { Form, Switch, Input, Button, message, Typography, Space } from 'antd';
import { useUpdateDeviceConfigMutation } from '../api/deviceManagementApi';

const KNOWN_KEYS = ['autoRefresh', 'showPendingOrders'];

export default function ConfigEditor({ device }) {
  const [form] = Form.useForm();
  const [updateConfig, { isLoading }] = useUpdateDeviceConfigMutation();
  const [jsonError, setJsonError] = useState(null);

  useEffect(() => {
    const config = device.config || {};
    const extra = Object.fromEntries(
      Object.entries(config).filter(([key]) => !KNOWN_KEYS.includes(key))
    );
    form.setFieldsValue({
      autoRefresh: !!config.autoRefresh,
      showPendingOrders: !!config.showPendingOrders,
      extraJson: Object.keys(extra).length ? JSON.stringify(extra, null, 2) : '',
    });
  }, [device, form]);

  const handleSubmit = async () => {
    setJsonError(null);
    const values = form.getFieldsValue();

    let extra = {};
    if (values.extraJson?.trim()) {
      try {
        extra = JSON.parse(values.extraJson);
      } catch (e) {
        setJsonError('Extra config must be valid JSON');
        return;
      }
    }

    const config = {
      autoRefresh: values.autoRefresh,
      showPendingOrders: values.showPendingOrders,
      ...extra,
    };

    try {
      await updateConfig({ deviceId: device.deviceId, config }).unwrap();
      message.success('Configuration pushed — the terminal picks it up on its next poll');
    } catch (err) {
      if (err?.data?.message) message.error(err.data.message);
    }
  };

  return (
    <Form form={form} layout="vertical" style={{ maxWidth: 480 }}>
      <Form.Item name="autoRefresh" label="Auto-refresh" valuePropName="checked">
        <Switch />
      </Form.Item>
      <Form.Item name="showPendingOrders" label="Show pending orders" valuePropName="checked">
        <Switch />
      </Form.Item>
      <Form.Item
        name="extraJson"
        label="Additional config (JSON)"
        validateStatus={jsonError ? 'error' : ''}
        help={jsonError || 'Any other feature flags or filters, merged with the toggles above'}
      >
        <Input.TextArea rows={6} className="dm-mono" placeholder="{}" />
      </Form.Item>
      <Space>
        <Button type="primary" loading={isLoading} onClick={handleSubmit}>
          Push configuration
        </Button>
        <Typography.Text type="secondary">
          Delivered on the terminal's next poll (polling only, no push)
        </Typography.Text>
      </Space>
    </Form>
  );
}
