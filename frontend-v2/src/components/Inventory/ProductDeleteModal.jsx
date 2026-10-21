import { useEffect, useState } from 'react';
import { Alert, Button, Modal, Spin, Table, Typography } from 'antd';
import { usePreviewProductDeletionMutation } from '../../api/inventoryBulkApi';

export default function ProductDeleteModal({ products, onConfirm, onCancel, isLoading = false }) {
  const [loadPreview] = usePreviewProductDeletionMutation();
  const [report, setReport] = useState(null);
  const [failure, setFailure] = useState('');
  const [attempt, setAttempt] = useState(0);
  const ids = JSON.stringify(products.map((product) => product.productId).sort());
  useEffect(() => {
    let active = true;
    const request = loadPreview(JSON.parse(ids));
    request
      .unwrap()
      .then((data) => {
        if (active) setReport(data);
      })
      .catch((error) => {
        if (active)
          setFailure(error?.data?.message || 'Reference checks failed. Retry before deleting.');
      });
    return () => {
      active = false;
      request.abort();
    };
  }, [ids, attempt, loadPreview]);
  const retry = () => {
    setReport(null);
    setFailure('');
    setAttempt((value) => value + 1);
  };
  const names = new Map(products.map((product) => [product.productId, product.name]));
  return (
    <Modal
      open
      title={`Delete ${products.length === 1 ? products[0].name : `${products.length} selected products`}?`}
      width={850}
      onCancel={onCancel}
      onOk={onConfirm}
      confirmLoading={isLoading}
      okText="Delete permanently"
      okButtonProps={{ danger: true, disabled: !report?.canDelete || !!failure }}
      cancelButtonProps={{ disabled: isLoading }}
      closable={!isLoading}
      maskClosable={!isLoading}
      keyboard={!isLoading}
    >
      {!report && !failure && (
        <Spin tip="Checking all product references…">
          <div style={{ height: 70 }} />
        </Spin>
      )}
      {failure && (
        <Alert
          type="error"
          showIcon
          message={failure}
          action={<Button onClick={retry}>Retry</Button>}
        />
      )}
      {report && (
        <>
          <Alert
            type={report.canDelete ? 'warning' : 'error'}
            showIcon
            message={
              report.canDelete
                ? 'No references found. Deletion is permanent.'
                : 'Deletion blocked: these products are still referenced.'
            }
            description={report.impact}
            style={{ marginBottom: 16 }}
          />
          <Typography.Paragraph>
            Counts are unique records across all selected products. A quotation with several
            versions is counted once. Expand a row to see every matching record and the products
            mentioned.
          </Typography.Paragraph>
          <Table
            size="small"
            rowKey="category"
            pagination={false}
            dataSource={report.references}
            columns={[
              { title: 'Referenced in', dataIndex: 'label' },
              { title: 'Number of records', dataIndex: 'count' },
              {
                title: 'Effect',
                render: (_, row) => (row.count ? 'Preserved — prevents deletion' : 'None'),
              },
            ]}
            expandable={{
              rowExpandable: (row) => row.count > 0,
              expandedRowRender: (row) => (
                <div style={{ maxHeight: 260, overflow: 'auto' }}>
                  {row.records.map((record) => (
                    <div key={record.id} style={{ marginBottom: 8 }}>
                      <Typography.Text strong>{record.label}</Typography.Text>
                      {record.label !== record.id && (
                        <Typography.Text type="secondary"> · {record.id}</Typography.Text>
                      )}
                      <div>{record.productIds.map((id) => names.get(id) || id).join(', ')}</div>
                    </div>
                  ))}
                </div>
              ),
            }}
          />
          <Typography.Paragraph type="secondary" style={{ marginTop: 12 }}>
            References are checked again when you confirm.
          </Typography.Paragraph>
          <Button disabled={isLoading} onClick={retry}>
            Refresh references
          </Button>
        </>
      )}
    </Modal>
  );
}
