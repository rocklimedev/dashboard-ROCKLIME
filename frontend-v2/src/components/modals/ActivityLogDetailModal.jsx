import React from "react";
import {
  Modal,
  Tag,
  Typography,
  Divider,
  Space,
  Row,
  Col,
  Card,
  Avatar,
  Alert,
  Collapse,
} from "antd";
import {
  UserOutlined,
  LoginOutlined,
  SafetyCertificateOutlined,
} from "@ant-design/icons";

const { Text, Title, Paragraph } = Typography;

const severityColors = {
  info: "success",
  warning: "warning",
  critical: "error",
  error: "error",
};

const contextTagColors = {
  AUTH: "blue",
  SALES: "green",
  CRM: "gold",
  CATALOG: "purple",
  INVENTORY: "cyan",
  PROCUREMENT: "orange",
  SYSTEM: "default",
};

const actionColors = {
  CREATE: "green",
  UPDATE: "orange",
  DELETE: "red",
  OTHER: "blue",
};

const renderMetadata = (metadata) => {
  if (!metadata || Object.keys(metadata).length === 0) return null;

  return (
    <Card title="Metadata" size="small" style={{ marginTop: 16 }}>
      <Space wrap>
        {Object.entries(metadata).map(([key, value]) => {
          if (Array.isArray(value)) {
            return value.map((item) => (
              <Tag key={`${key}-${item}`} color="blue">
                {item}
              </Tag>
            ));
          }

          if (key === "status") {
            return (
              <Tag key={key} color={value === "active" ? "success" : "default"}>
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

  const keys = [
    ...new Set([
      ...Object.keys(oldValues || {}),
      ...Object.keys(newValues || {}),
    ]),
  ];

  return (
    <Card title="Changes" size="small" style={{ marginTop: 16 }}>
      <Space direction="vertical" style={{ width: "100%" }}>
        {keys.map((key) => (
          <div
            key={key}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "10px 12px",
              border: "1px solid #f0f0f0",
              borderRadius: 8,
            }}
          >
            <Text strong>{key}</Text>

            <Space>
              <Tag color="red">{JSON.stringify(oldValues?.[key] ?? "—")}</Tag>

              <Text>→</Text>

              <Tag color="green">{JSON.stringify(newValues?.[key] ?? "—")}</Tag>
            </Space>
          </div>
        ))}
      </Space>
    </Card>
  );
};

const ActivityLogDetailModal = ({ log, onClose }) => {
  if (!log) return null;

  const ctxColor = contextTagColors[log.contextTag] || "default";

  const actionColor = actionColors[log.actionType] || "blue";

  const severityType = severityColors[log.severity] || "info";

  return (
    <Modal
      open={!!log}
      onCancel={onClose}
      footer={null}
      width={900}
      destroyOnClose
      title={null}
    >
      {/* HERO HEADER */}
      <div
        style={{
          padding: 20,
          borderRadius: 12,
          border: "1px solid #f0f0f0",
          background: "linear-gradient(135deg,#fafafa,#ffffff)",
          marginBottom: 16,
        }}
      >
        <Space align="start" size={16}>
          <Avatar
            size={60}
            icon={<UserOutlined />}
            style={{
              background: "#1677ff",
            }}
          />

          <div style={{ flex: 1 }}>
            <Space wrap>
              <Tag color={ctxColor}>
                {log.contextTag}
                {log.subContext ? ` / ${log.subContext}` : ""}
              </Tag>

              <Tag color={actionColor}>{log.action}</Tag>

              <Tag color="green">{(log.severity || "info").toUpperCase()}</Tag>
            </Space>

            <Title
              level={3}
              style={{
                marginTop: 10,
                marginBottom: 4,
              }}
            >
              {log.entityName}
            </Title>

            <Text type="secondary">{log.description}</Text>
          </div>
        </Space>
      </div>

      {/* ALERT */}
      <Alert
        showIcon
        type={severityType}
        icon={<SafetyCertificateOutlined />}
        message={
          log.severity === "critical"
            ? "Critical Activity Detected"
            : log.action
        }
        description={log.description}
        style={{ marginBottom: 16 }}
      />

      {/* SUMMARY CARDS */}
      <Row gutter={[12, 12]}>
        <Col xs={24} md={12}>
          <Card size="small">
            <Text type="secondary">User</Text>

            <div
              style={{
                fontWeight: 600,
                fontSize: 16,
                marginTop: 4,
              }}
            >
              {log.user?.name || log.userName || "Unknown"}
            </div>

            <Text type="secondary">{log.user?.email || log.userEmail}</Text>
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card size="small">
            <Text type="secondary">IP Address</Text>

            <div
              style={{
                marginTop: 4,
                fontFamily: "monospace",
                fontSize: 15,
              }}
            >
              {log.ipAddress || "—"}
            </div>
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card size="small">
            <Text type="secondary">Entity ID</Text>

            <div
              style={{
                marginTop: 4,
                fontFamily: "monospace",
                wordBreak: "break-all",
              }}
            >
              {log.entityId}
            </div>
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card size="small">
            <Text type="secondary">Timestamp</Text>

            <div
              style={{
                marginTop: 4,
                fontWeight: 500,
              }}
            >
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
        style={{ marginTop: 16 }}
        items={[
          {
            key: "technical",
            label: "Technical Details",
            children: (
              <Space direction="vertical" style={{ width: "100%" }}>
                <div>
                  <Text strong>User Agent</Text>

                  <Paragraph
                    copyable
                    style={{
                      marginTop: 6,
                      fontFamily: "monospace",
                    }}
                  >
                    {log.userAgent || "Unavailable"}
                  </Paragraph>
                </div>

                <Divider />

                <div>
                  <Text strong>Raw Metadata</Text>

                  <Paragraph
                    copyable
                    style={{
                      marginTop: 6,
                      fontFamily: "monospace",
                    }}
                  >
                    {JSON.stringify(log.metadata, null, 2)}
                  </Paragraph>
                </div>
              </Space>
            ),
          },
        ]}
      />
    </Modal>
  );
};

export default ActivityLogDetailModal;
