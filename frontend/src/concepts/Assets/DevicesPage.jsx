import React, { useState } from 'react';
import { Table, Button, Typography, Space, Dropdown, message, Modal } from 'antd';
import { PlusOutlined, MoreOutlined, ReloadOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { useGetDevicesQuery, useRotateSecretMutation } from '../api/deviceManagementApi';
import StatusTag from '../components/StatusTag';
import DeviceFilters from '../components/DeviceFilters';
import RegisterDeviceModal from '../components/RegisterDeviceModal';
import '../styles/deviceManagement.css';

dayjs.extend(relativeTime);

export default function DevicesPage() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState({});
  const [registerOpen, setRegisterOpen] = useState(false);
  const { data: devices = [], isLoading, isFetching, refetch } = useGetDevicesQuery(filters);
  const [rotateSecret] = useRotateSecretMutation();

  const handleRotateSecret = async (deviceId) => {
    try {
      const result = await rotateSecret(deviceId).unwrap();
      // Imperative modal keeps this a single click from the row menu rather
      // than opening a full modal component for one field.
      Modal.warning({
        title: `New secret for ${deviceId}`,
        content: (
          <div>
            <p>This secret is shown once — copy it into the terminal's config now.</p>
            <div className="dm-mono" style={{ wordBreak: 'break-all', marginTop: 8 }}>
              {result.secret}
            </div>
          </div>
        ),
      });
    } catch (err) {
      if (err?.data?.message) message.error(err.data.message);
    }
  };

  const columns = [
    {
      title: 'Device ID',
      dataIndex: 'deviceId',
      key: 'deviceId',
      render: (value) => <span className="dm-mono">{value}</span>,
    },
    {
      title: 'Warehouse',
      dataIndex: 'warehouseId',
      key: 'warehouseId',
      render: (_, record) => record.Warehouse?.name || <Typography.Text type="secondary">—</Typography.Text>,
    },
    {
      title: 'Function',
      dataIndex: 'function',
      key: 'function',
      render: (value) => value || <Typography.Text type="secondary">—</Typography.Text>,
    },
    {
      title: 'Screen',
      dataIndex: 'screen',
      key: 'screen',
      render: (value) => value || <Typography.Text type="secondary">—</Typography.Text>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => <StatusTag status={status} />,
    },
    {
      title: 'Last heartbeat',
      dataIndex: 'lastHeartbeatAt',
      key: 'lastHeartbeatAt',
      render: (value) =>
        value ? (
          <span title={dayjs(value).format('YYYY-MM-DD HH:mm:ss')}>{dayjs(value).fromNow()}</span>
        ) : (
          <Typography.Text type="secondary">Never</Typography.Text>
        ),
    },
    {
      title: 'App version',
      dataIndex: 'appVersion',
      key: 'appVersion',
      render: (value) => value || <Typography.Text type="secondary">—</Typography.Text>,
    },
    {
      title: '',
      key: 'actions',
      width: 48,
      render: (_, record) => (
        <Dropdown
          menu={{
            items: [
              { key: 'view', label: 'View details' },
              { key: 'rotate', label: 'Rotate secret' },
            ],
            onClick: ({ key, domEvent }) => {
              domEvent.stopPropagation();
              if (key === 'view') navigate(`/devices/${record.deviceId}`);
              if (key === 'rotate') handleRotateSecret(record.deviceId);
            },
          }}
        >
          <Button type="text" icon={<MoreOutlined />} onClick={(e) => e.stopPropagation()} />
        </Dropdown>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Typography.Title level={4} style={{ margin: 0 }}>
          Warehouse terminals
        </Typography.Title>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={refetch} loading={isFetching}>
            Refresh
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setRegisterOpen(true)}>
            Register terminal
          </Button>
        </Space>
      </div>

      <div style={{ marginBottom: 16 }}>
        <DeviceFilters filters={filters} onChange={setFilters} />
      </div>

      <Table
        rowKey="deviceId"
        columns={columns}
        dataSource={devices}
        loading={isLoading}
        onRow={(record) => ({
          onClick: () => navigate(`/devices/${record.deviceId}`),
          style: { cursor: 'pointer' },
        })}
        locale={{
          emptyText: (
            <div className="dm-empty-state">
              No terminals registered yet. Register one to get started.
            </div>
          ),
        }}
      />

      <RegisterDeviceModal open={registerOpen} onClose={() => setRegisterOpen(false)} />
    </div>
  );
}
