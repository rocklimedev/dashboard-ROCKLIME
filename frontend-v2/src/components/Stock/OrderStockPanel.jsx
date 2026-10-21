import { useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Progress,
  Space,
  Table,
  Tag,
  Tooltip,
  Typography,
  message,
} from 'antd';
import { InboxOutlined, ReloadOutlined } from '@ant-design/icons';
import { useGetOrderStockQuery, useResyncOrderStockMutation } from '../../api/stockApi';
import ProductStockDrawer from './ProductStockDrawer';
import { fmtQty } from './stockLabels';
import useCan from '../../utils/useCan';

const { Text } = Typography;

/** Per line: ordered / dispatched / reserved / waiting, so everyone sees what is held for this order. */
export default function OrderStockPanel({ orderId, status }) {
  const can = useCan();
  const [drawer, setDrawer] = useState(null);
  const { data, isFetching, error, refetch } = useGetOrderStockQuery(orderId, {
    skip: !orderId,
    refetchOnMountOrArgChange: true,
  });
  const [resync, { isLoading }] = useResyncOrderStockMutation();
  const lines = data?.lines || [];
  const waiting = lines.reduce((a, l) => a + (l.backordered || 0), 0);
  const isDraft = status === 'DRAFT';

  const doResync = async () => {
    try {
      await resync(orderId).unwrap();
      await refetch();
      message.success('Reservations re-checked');
    } catch (e) {
      message.error(e?.data?.message || 'Could not re-check stock');
    }
  };

  return (
    <Card
      className="section-card"
      style={{ marginTop: 16 }}
      title={
        <span>
          <InboxOutlined /> Stock for this order
        </span>
      }
      extra={
        <Space>
          {waiting > 0 && <Tag color="red">{fmtQty(waiting)} waiting for stock</Tag>}
          {can('inventory', 'edit') && !isDraft && (
            <Tooltip title="Re-run reservations for this order (use after a stock correction)">
              <Button
                size="small"
                icon={<ReloadOutlined />}
                loading={isLoading}
                onClick={doResync}
              />
            </Tooltip>
          )}
        </Space>
      }
    >
      {error ? (
        <Alert
          type="warning"
          showIcon
          message={error?.data?.message || 'Stock details are not available'}
        />
      ) : (
        <>
          {isDraft && (
            <Alert
              type="info"
              showIcon
              style={{ marginBottom: 12 }}
              message="Draft orders don't hold stock. Stock is reserved when the order moves to Preparing."
            />
          )}
          <Table
            size="small"
            rowKey="productId"
            loading={isFetching}
            pagination={false}
            dataSource={lines}
            scroll={{ x: 640 }}
            columns={[
              {
                title: 'Product',
                dataIndex: 'name',
                render: (v, r) => <a onClick={() => setDrawer(r.productId)}>{v || r.productId}</a>,
              },
              { title: 'Ordered', dataIndex: 'ordered', align: 'right', render: fmtQty },
              { title: 'Dispatched', dataIndex: 'dispatched', align: 'right', render: fmtQty },
              { title: 'Reserved', dataIndex: 'reserved', align: 'right', render: fmtQty },
              {
                title: 'Waiting',
                dataIndex: 'backordered',
                align: 'right',
                render: (v) =>
                  v ? (
                    <Text type="danger" strong>
                      {fmtQty(v)}
                    </Text>
                  ) : (
                    <Text type="secondary">0</Text>
                  ),
              },
              {
                title: 'Progress',
                width: 150,
                render: (_, r) => {
                  const ordered = Number(r.ordered) || 0;
                  const done = Number(r.dispatched) || 0;
                  const held = Number(r.reserved) || 0;
                  if (!ordered) return null;
                  return (
                    <Tooltip
                      title={`${fmtQty(done)} dispatched, ${fmtQty(held)} reserved of ${fmtQty(ordered)}`}
                    >
                      <Progress
                        size="small"
                        percent={Math.round(((done + held) / ordered) * 100)}
                        success={{ percent: Math.round((done / ordered) * 100) }}
                        showInfo={false}
                      />
                    </Tooltip>
                  );
                },
              },
            ]}
          />
          <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 8 }}>
            Green = dispatched · blue = reserved in the godown · gap = waiting for stock (fills
            automatically when goods arrive).
          </Text>
        </>
      )}
      <ProductStockDrawer productId={drawer} open={!!drawer} onClose={() => setDrawer(null)} />
    </Card>
  );
}
