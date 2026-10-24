import Loader from '../Common/Loader';
import './ProductDeletionPreview.styles.css';
import { Alert, Button, Table, Typography } from 'antd';

export default function ProductDeletionPreview({ products, report, failure, onRetry, isLoading }) {
  const names = new Map(products.map((product) => [product.productId, product.name]));
  return (
    <>
      {!report && !failure && (
        <Loader tip="Checking all product references…">
          <div className="fv2-productdeletemodal-237c943ad8" />
        </Loader>
      )}
      {failure && (
        <Alert
          type="error"
          showIcon
          message={failure}
          action={<Button onClick={onRetry}>Retry</Button>}
        />
      )}
      {report && (
        <>
          <Alert
            className="fv2-productdeletemodal-e830f42839"
            type={report.canDelete ? 'warning' : 'error'}
            showIcon
            message={
              report.canDelete
                ? 'No references found. Deletion is permanent.'
                : 'Deletion blocked: these products are still referenced.'
            }
            description={report.impact}
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
                <div className="fv2-productdeletemodal-3a8f68a12e">
                  {row.records.map((record) => (
                    <div className="fv2-productdeletemodal-f0a14949a3" key={record.id}>
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
          <Typography.Paragraph className="fv2-productdeletemodal-28f7e7bb45" type="secondary">
            References are checked again when you confirm.
          </Typography.Paragraph>
          <Button disabled={isLoading} onClick={onRetry}>
            Refresh references
          </Button>
        </>
      )}
    </>
  );
}
