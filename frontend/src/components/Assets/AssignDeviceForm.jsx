import React, { useEffect } from 'react';
import { Form, Select, Input, Button, message } from 'antd';
import { useAssignDeviceMutation, useGetWarehousesQuery } from '../api/deviceManagementApi';

const FUNCTION_OPTIONS = [
  { value: 'ORDERS', label: 'Orders' },
  { value: 'PICKING', label: 'Picking' },
  { value: 'DISPATCH', label: 'Dispatch' },
  { value: 'INVENTORY', label: 'Inventory' },
];

export default function AssignDeviceForm({ device }) {
  const [form] = Form.useForm();
  const { data: warehouses = [] } = useGetWarehousesQuery();
  const [assignDevice, { isLoading }] = useAssignDeviceMutation();

  useEffect(() => {
    form.setFieldsValue({
      warehouseId: device.warehouseId,
      function: device.function,
      screen: device.screen,
      route: device.route,
    });
  }, [device, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      await assignDevice({ deviceId: device.deviceId, ...values }).unwrap();
      message.success('Assignment saved');
    } catch (err) {
      if (err?.data?.message) message.error(err.data.message);
    }
  };

  return (
    <Form form={form} layout="vertical" style={{ maxWidth: 480 }}>
      <Form.Item name="warehouseId" label="Warehouse">
        <Select
          allowClear
          placeholder="Unassigned"
          options={warehouses.map((w) => ({ value: w.id, label: w.name }))}
        />
      </Form.Item>
      <Form.Item name="function" label="Function">
        <Select allowClear placeholder="Unassigned" options={FUNCTION_OPTIONS} />
      </Form.Item>
      <Form.Item name="screen" label="Screen">
        <Input placeholder="e.g. Order Processing" />
      </Form.Item>
      <Form.Item name="route" label="Route">
        <Input placeholder="e.g. /order-processing" className="dm-mono" />
      </Form.Item>
      <Button type="primary" loading={isLoading} onClick={handleSubmit}>
        Save assignment
      </Button>
    </Form>
  );
}
