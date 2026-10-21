import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Alert,
  Button,
  Card,
  Col,
  InputNumber,
  Row,
  Space,
  Table,
  Typography,
  message,
} from 'antd';
import { useAuth } from '../../context/AuthContext';
import {
  useGetOperationsQuery,
  useRunOperationMutation,
  useDownloadOperationMutation,
} from '../../api/operationsApi';

export default function Operations() {
  const { auth } = useAuth();
  const roles = [...(auth?.user?.roles || []), auth?.role].filter(Boolean);
  const allowed = roles.some((role) => ['ADMIN', 'SUPER_ADMIN', 'DEVELOPER'].includes(role));
  const [threshold, setThreshold] = useState(90);
  const { data, isLoading, error, refetch } = useGetOperationsQuery(undefined, { skip: !allowed });
  const [run, { isLoading: running }] = useRunOperationMutation();
  const [download, { isLoading: downloading }] = useDownloadOperationMutation();
  const showError = (error) =>
    message.error(
      error?.data?.message || error?.data?.error || 'Operation failed. Please try again.',
    );
  const execute = async (service) => {
    try {
      await run({ service, threshold: threshold / 100 }).unwrap();
      message.success('Operation completed. Download the result below.');
      refetch();
    } catch (failure) {
      showError(failure);
    }
  };
  const save = async (artifact, part) => {
    try {
      const content = await download({ id: artifact.id, part }).unwrap();
      const url = URL.createObjectURL(
        new Blob([JSON.stringify(content, null, 2)], { type: 'application/json' }),
      );
      const link = document.createElement('a');
      link.href = url;
      link.download = `${artifact.type}-${artifact.id}${part ? '-' + part : ''}.json`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (failure) {
      showError(failure);
    }
  };
  if (!allowed)
    return (
      <div className="page-wrapper">
        <div className="content">
          <Alert type="warning" showIcon message="Operations requires an administrator role." />
        </div>
      </div>
    );
  return (
    <div className="page-wrapper">
      <div className="content">
        <Typography.Title level={2}>Operations</Typography.Title>
        <Link to="/inventory/onboard-new-brand">
          <Button type="primary" style={{ marginBottom: 20 }}>
            Onboard New Brand Workspace
          </Button>
        </Link>
        <Typography.Paragraph>
          Back up product data and review possible duplicates. More maintenance services can be
          added here later.
        </Typography.Paragraph>
        <Alert
          type="info"
          showIcon
          message="Product snapshots include products and metadata definitions. Duplicate scans never change data; review candidates before any cleanup."
          style={{ marginBottom: 24 }}
        />
        {error && (
          <Alert
            type="error"
            showIcon
            message={error?.data?.message || 'Unable to load operations.'}
            action={<Button onClick={refetch}>Retry</Button>}
            style={{ marginBottom: 16 }}
          />
        )}
        <Row gutter={[16, 16]}>
          {(data?.services || []).map((service) => (
            <Col xs={24} md={12} key={service.id}>
              <Card title={service.name}>
                <Typography.Paragraph>{service.description}</Typography.Paragraph>
                {service.id === 'duplicate-scan' && (
                  <Space style={{ marginBottom: 16 }}>
                    <span>Minimum name match (%)</span>
                    <InputNumber
                      min={90}
                      max={100}
                      value={threshold}
                      onChange={(value) => setThreshold(value ?? 90)}
                    />
                  </Space>
                )}
                <div>
                  <Button
                    type="primary"
                    loading={running}
                    disabled={running || data?.busy}
                    onClick={() => execute(service.id)}
                  >
                    {service.id === 'product-backup'
                      ? 'Create product backup'
                      : 'Scan for duplicates'}
                  </Button>
                </div>
              </Card>
            </Col>
          ))}
          <Col span={24}>
            <Card title="Future services">
              <Typography.Text type="secondary">
                Database backups, scheduled maintenance and additional tools can extend this module.
              </Typography.Text>
            </Card>
          </Col>
        </Row>
        <Card
          title="Backups and reports"
          style={{ marginTop: 24 }}
          extra={
            <Button onClick={refetch} disabled={running}>
              Refresh
            </Button>
          }
        >
          <Table
            rowKey="id"
            loading={isLoading}
            dataSource={data?.artifacts || []}
            scroll={{ x: 800 }}
            columns={[
              {
                title: 'Service',
                dataIndex: 'type',
                render: (type) => (type === 'product-backup' ? 'Product backup' : 'Duplicate scan'),
              },
              {
                title: 'Created',
                dataIndex: 'createdAt',
                render: (date) => new Date(date).toLocaleString(),
              },
              {
                title: 'Result',
                dataIndex: 'summary',
                render: (summary) =>
                  summary?.scannedProducts !== undefined
                    ? `${summary.scannedProducts} scanned · ${summary.exactPairs} exact pairs · ${summary.reviewPairs} review pairs · ${summary.skippedProducts} skipped`
                    : `${summary?.products ?? 0} products`,
              },
              {
                title: 'Download JSON',
                render: (_, artifact) => (
                  <Space wrap>
                    <Button disabled={downloading} onClick={() => save(artifact)}>
                      Full export
                    </Button>
                    {artifact.type === 'duplicate-scan' &&
                      ['exact', 'review', 'skipped'].map((part) => (
                        <Button
                          key={part}
                          disabled={downloading}
                          onClick={() => save(artifact, part)}
                        >
                          {part === 'exact'
                            ? 'Exact duplicates'
                            : part === 'review'
                              ? 'Differences review'
                              : 'Skipped products'}
                        </Button>
                      ))}
                  </Space>
                ),
              },
            ]}
          />
        </Card>
      </div>
    </div>
  );
}
