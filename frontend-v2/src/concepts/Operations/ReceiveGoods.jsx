import { Link, useSearchParams } from 'react-router-dom';
import { Button, Card, Drawer, Empty, Spin, Table, Tag, Typography } from 'antd';
import { InboxOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useGetReceivablePosQuery } from '../../api/stockApi';
import { useGetPurchaseOrderByIdQuery } from '../../api/poApi';
import PoReceivingPanel from '../../components/Stock/PoReceivingPanel';
import './operations.css';

const { Title, Text } = Typography;

function PoDrawer({ id, onClose }) {
  const { data, isFetching } = useGetPurchaseOrderByIdQuery(id, { skip: !id });
  const po = data?.purchaseOrder || data?.data || data;
  return (
    <Drawer
      open={!!id}
      onClose={onClose}
      width="min(820px, 100vw)"
      title={po?.poNumber ? `Receive goods · ${po.poNumber}` : 'Receive goods'}
      extra={po?.id && <Link to={`/po/${po.id}`}>Open purchase order</Link>}
      destroyOnClose
    >
      {isFetching || !po?.id ? <Spin /> : <PoReceivingPanel po={po} />}
    </Drawer>
  );
}

/** Operations → Receive goods: purchase orders still to arrive; receiving puts stock on the shelf and fills waiting orders. */
export default function ReceiveGoods() {
  const [params, setParams] = useSearchParams();
  const open = params.get('po');
  const { data, isFetching } = useGetReceivablePosQuery();
  const rows = data?.data || [];

  return (
    <div className="page-wrapper">
      <div className="content">
        <div className="ops-head">
          <div>
            <Title level={4} style={{ margin: 0 }}>
              Receive goods
            </Title>
            <Text type="secondary">
              Confirmed purchase orders still to arrive. Receiving adds stock and fills orders
              waiting for it.
            </Text>
          </div>
        </div>
        <Card className="ops-panel">
          <Table
            rowKey="id"
            loading={isFetching}
            dataSource={rows}
            pagination={false}
            locale={{
              emptyText: (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description="Nothing on the way. Confirm a purchase order to see it here."
                />
              ),
            }}
            onRow={(r) => ({
              onClick: () => setParams({ po: r.id }),
              style: { cursor: 'pointer' },
            })}
            columns={[
              { title: 'PO', dataIndex: 'poNumber', render: (v) => <Text strong>{v}</Text> },
              { title: 'Vendor', dataIndex: 'vendor', render: (v) => v || '—' },
              {
                title: 'Expected',
                dataIndex: 'expectDeliveryDate',
                render: (v, r) =>
                  v ? (
                    <Text type={r.late ? 'danger' : undefined}>
                      {dayjs(v).format('D MMM YYYY')}
                      {r.late ? ' · late' : ''}
                    </Text>
                  ) : (
                    <Text type="secondary">no date</Text>
                  ),
              },
              {
                title: 'Status',
                dataIndex: 'status',
                render: (s) =>
                  s === 'partial_delivered' ? (
                    <Tag color="gold">Part received</Tag>
                  ) : (
                    <Tag color="blue">Confirmed</Tag>
                  ),
              },
              {
                title: '',
                width: 120,
                render: (_, r) => (
                  <Button
                    size="small"
                    type="primary"
                    icon={<InboxOutlined />}
                    onClick={(e) => {
                      e.stopPropagation();
                      setParams({ po: r.id });
                    }}
                  >
                    Receive
                  </Button>
                ),
              },
            ]}
          />
        </Card>
      </div>
      <PoDrawer id={open} onClose={() => setParams({})} />
    </div>
  );
}
