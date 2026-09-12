import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Descriptions, Tabs, Button, Spin, Typography, Space, Modal, message } from 'antd';
import { ArrowLeftOutlined, ReloadOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { useGetDeviceQuery, useRotateSecretMutation } from '../api/deviceManagementApi';
import StatusTag from '../components/StatusTag';
import AssignDeviceForm from '../components/AssignDeviceForm';
import ConfigEditor from '../components/ConfigEditor';
import DeviceHistoryTimeline from '../components/DeviceHistoryTimeline';
import '../styles/deviceManagement.css';

dayjs.extend(relativeTime);

export default function DeviceDetailPage() {
  const { deviceId } = useParams();
  const navigate = useNavigate();
  const { data: device, isLoading, refetch } = useGetDeviceQuery(deviceId);
  const [rotateSecret, { isLoading: isRotating }] = useRotateSecretMutation();

  const handleRotateSecret = () => {
    Modal.confirm({
      title: 'Rotate this terminal\u2019s secret?',
      content:
        'The current secret stops working immediately. Use this after replacing the physical Pi, or if the secret may have leaked.',
      okText: 'Rotate secret',
      onOk: async () => {
        try {
          const result = await rotateSecret(deviceId).unwrap();
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
      },
    });
  };

  if (isLoading) {
    return <Spin style={{ marginTop: 48 }} />;
  }

  if (!device) {
    return (
      <div className="dm-empty-state">
        Terminal not found. It may have been removed.
      </div>
    );
  }

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} type="text" onClick={() => navigate('/devices')}>
          Back to terminals
        </Button>
      </Space>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Typography.Title level={4} className="dm-mono" style={{ margin: 0 }}>
          {device.deviceId}
        </Typography.Title>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={refetch}>
            Refresh
          </Button>
          <Button danger loading={isRotating} onClick={handleRotateSecret}>
            Rotate secret
          </Button>
        </Space>
      </div>

      <Descriptions column={2} style={{ margin: '20px 0' }} bordered size="small">
        <Descriptions.Item label="Status">
          <StatusTag status={device.status} />
        </Descriptions.Item>
        <Descriptions.Item label="Last heartbeat">
          {device.lastHeartbeatAt
            ? `${dayjs(device.lastHeartbeatAt).fromNow()} (${dayjs(device.lastHeartbeatAt).format(
                'YYYY-MM-DD HH:mm:ss'
              )})`
            : 'Never'}
        </Descriptions.Item>
        <Descriptions.Item label="Warehouse">
          {device.Warehouse?.name || '—'}
        </Descriptions.Item>
        <Descriptions.Item label="Function">{device.function || '—'}</Descriptions.Item>
        <Descriptions.Item label="Screen">{device.screen || '—'}</Descriptions.Item>
        <Descriptions.Item label="Route">
          <span className="dm-mono">{device.route || '—'}</span>
        </Descriptions.Item>
        <Descriptions.Item label="App version">{device.appVersion || '—'}</Descriptions.Item>
        <Descriptions.Item label="Asset tag">{device.assetTag || '—'}</Descriptions.Item>
      </Descriptions>

      <Tabs
        items={[
          {
            key: 'assignment',
            label: 'Assignment',
            children: <AssignDeviceForm device={device} />,
          },
          {
            key: 'config',
            label: 'Configuration',
            children: <ConfigEditor device={device} />,
          },
          {
            key: 'history',
            label: 'History',
            children: <DeviceHistoryTimeline deviceId={device.deviceId} />,
          },
        ]}
      />
    </div>
  );
}
