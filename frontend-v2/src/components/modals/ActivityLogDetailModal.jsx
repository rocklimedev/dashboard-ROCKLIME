import ModalShell from '../Common/ModalShell';
import './ActivityLogDetailModal.styles.css';
import React from 'react';
import { Tag, Typography, Divider, Space, Row, Col, Card, Avatar, Alert, Collapse } from 'antd';
import { UserOutlined, LoginOutlined, SafetyCertificateOutlined } from '@ant-design/icons';

const { Text, Title, Paragraph } = Typography;

const severityColors = {
  info: 'success',
  warning: 'warning',
  critical: 'error',
  error: 'error',
};

const contextTagColors = {
  AUTH: 'blue',
  SALES: 'green',
  CRM: 'gold',
  CATALOG: 'purple',
  INVENTORY: 'cyan',
  PROCUREMENT: 'orange',
  SYSTEM: 'default',
};

const actionColors = {
  CREATE: 'green',
  UPDATE: 'orange',
  DELETE: 'red',
  OTHER: 'blue',
};

const renderMetadata = (metadata) => {
  if (!metadata || Object.keys(metadata).length === 0) return null;

  return (
    <Card className="fv2-activitylogdetailmodal-642356d98a" title="Metadata" size="small">
      <Space wrap>
        {Object.entries(metadata).map(([key, value]) => {
          if (Array.isArray(value)) {
            return value.map((item) => (
              <Tag key={`${key}-${item}`} color="blue">
                {item}
              </Tag>
            ));
          }

          if (key === 'status') {
            return (
              <Tag key={key} color={value === 'active' ? 'success' : 'default'}>
                {String(value).toUpperCase()}
              </Tag>
            );
          }

          return (
            <Tag key={key}>
              {key}: {String(value)}
            </Tag>
          );
        })}
      </Space>
    </Card>
  );
};

const renderChanges = (oldValues, newValues) => {
  if (!oldValues && !newValues) return null;

  const keys = [...new Set([...Object.keys(oldValues || {}), ...Object.keys(newValues || {})])];

  return (
    <Card className="fv2-activitylogdetailmodal-642356d98a" title="Changes" size="small">
      <Space className="fv2-activitylogdetailmodal-917f0f9aa6" direction="vertical">
        {keys.map((key) => (
          <div className="fv2-activitylogdetailmodal-332257585b" key={key}>
            <Text strong>{key}</Text>

            <Space>
              <Tag color="red">{JSON.stringify(oldValues?.[key] ?? '—')}</Tag>

              <Text>→</Text>

              <Tag color="green">{JSON.stringify(newValues?.[key] ?? '—')}</Tag>
            </Space>
          </div>
        ))}
      </Space>
    </Card>
  );
};

const ActivityLogDetailModal = ({ log, onClose }) => {
  if (!log) return null;

  const ctxColor = contextTagColors[log.contextTag] || 'default';

  const actionColor = actionColors[log.actionType] || 'blue';

  const severityType = severityColors[log.severity] || 'info';

  return (
    <ModalShell
      open={!!log}
      onCancel={onClose}
      footer={null}
      width={900}
      destroyOnClose
      title={null}
    >
      {/* HERO HEADER */}
      <div className="fv2-activitylogdetailmodal-ed9e022d39">
        <Space align="start" size={16}>
          <Avatar
            className="fv2-activitylogdetailmodal-e3db8cf89d"
            size={60}
            icon={<UserOutlined />}
          />

          <div className="fv2-activitylogdetailmodal-c9e45a9116">
            <Space wrap>
              <Tag color={ctxColor}>
                {log.contextTag}
                {log.subContext ? ` / ${log.subContext}` : ''}
              </Tag>

              <Tag color={actionColor}>{log.action}</Tag>

              <Tag color="green">{(log.severity || 'info').toUpperCase()}</Tag>
            </Space>

            <Title className="fv2-activitylogdetailmodal-a620298a84" level={3}>
              {log.entityName}
            </Title>

            <Text type="secondary">{log.description}</Text>
          </div>
        </Space>
      </div>

      {/* ALERT */}
      <Alert
        className="fv2-activitylogdetailmodal-640812a17b"
        showIcon
        type={severityType}
        icon={<SafetyCertificateOutlined />}
        message={log.severity === 'critical' ? 'Critical Activity Detected' : log.action}
        description={log.description}
      />

      {/* SUMMARY CARDS */}
      <Row gutter={[12, 12]}>
        <Col xs={24} md={12}>
          <Card size="small">
            <Text type="secondary">User</Text>

            <div className="fv2-activitylogdetailmodal-4be0867cf0">
              {log.user?.name || log.userName || 'Unknown'}
            </div>

            <Text type="secondary">{log.user?.email || log.userEmail}</Text>
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card size="small">
            <Text type="secondary">IP Address</Text>

            <div className="fv2-activitylogdetailmodal-455ef72218">{log.ipAddress || '—'}</div>
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card size="small">
            <Text type="secondary">Entity ID</Text>

            <div className="fv2-activitylogdetailmodal-80932b0011">{log.entityId}</div>
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card size="small">
            <Text type="secondary">Timestamp</Text>

            <div className="fv2-activitylogdetailmodal-1c95e39d1f">
              {new Date(log.createdAt).toLocaleString()}
            </div>
          </Card>
        </Col>
      </Row>

      {/* CHANGES */}
      {renderChanges(log.oldValues, log.newValues)}

      {/* METADATA */}
      {renderMetadata(log.metadata)}

      {/* TECHNICAL DETAILS */}
      <Collapse
        className="fv2-activitylogdetailmodal-642356d98a"

        items={[
          {
            key: 'technical',
            label: 'Technical Details',
            children: (
              <Space className="fv2-activitylogdetailmodal-917f0f9aa6" direction="vertical">
                <div>
                  <Text strong>User Agent</Text>

                  <Paragraph className="fv2-activitylogdetailmodal-cb1923876f" copyable>
                    {log.userAgent || 'Unavailable'}
                  </Paragraph>
                </div>

                <Divider />

                <div>
                  <Text strong>Raw Metadata</Text>

                  <Paragraph className="fv2-activitylogdetailmodal-cb1923876f" copyable>
                    {JSON.stringify(log.metadata, null, 2)}
                  </Paragraph>
                </div>
              </Space>
            ),
          },
        ]}
      />
    </ModalShell>
  );
};

export default ActivityLogDetailModal;
