import Loader from '../Common/Loader';
import './ProductStockDrawer.styles.css';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Alert, AutoComplete, Button, Card, Col, Drawer, Empty, Form, InputNumber, Row, Segmented, Select, Space, Statistic, Table, Tabs, Tag, Typography } from 'antd';
import { toast } from 'sonner';
import {
  useAdjustStockMutation,
  useGetProductStockQuery,
  useGetWarehousesQuery,
  useTransferStockMutation,
} from '../../api/stockApi';
import useCan from '../../utils/useCan';
import {
  ADJUST_REASONS,
  MOVEMENT_LABELS,
  fmtDate,
  fmtDateTime,
  fmtQty,
  signed,
} from './stockLabels';

const { Text } = Typography;

function AdjustForm({ productId, warehouses, onDone }) {
  const [form] = Form.useForm();
  const [adjust, { isLoading }] = useAdjustStockMutation();
  const [direction, setDirection] = useState('add');
  const submit = async (v) => {
    try {
      const change = (direction === 'add' ? 1 : -1) * Number(v.quantity);
      const res = await adjust({
        productId,
        warehouseId: v.warehouseId,
        change,
        reason: v.reason,
      }).unwrap();
      toast.success(res?.message || 'Stock adjusted');
      form.resetFields(['quantity', 'reason']);
      onDone?.();
    } catch (e) {
      toast.error(e?.data?.message || 'Could not adjust stock');
    }
  };
  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={submit}
      initialValues={{ warehouseId: warehouses[0]?.id }}
    >
      <Segmented
        className="fv2-productstockdrawer-d523a678ba"
        block
        value={direction}
        onChange={setDirection}
        options={[
          { label: 'Add stock', value: 'add' },
          { label: 'Remove stock', value: 'remove' },
        ]}
      />
      <Row gutter={12}>
        <Col span={12}>
          <Form.Item
            name="quantity"
            label="Quantity"
            rules={[{ required: true, message: 'Enter a quantity' }]}
          >
            <InputNumber className="fv2-productstockdrawer-193b4c2608" min={1} precision={0} />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name="warehouseId" label="Godown">
            <Select options={warehouses.map((w) => ({ value: w.id, label: w.name }))} />
          </Form.Item>
        </Col>
      </Row>
      <Form.Item
        name="reason"
        label="Reason"
        rules={[{ required: true, message: 'A reason is required for every stock change' }]}
      >
        <AutoComplete
          options={ADJUST_REASONS.map((r) => ({ value: r }))}
          placeholder="Pick or type a reason"
          filterOption={(input, o) => o.value.toLowerCase().includes(input.toLowerCase())}
        />
      </Form.Item>
      <Text className="fv2-productstockdrawer-5764c85a7e" type="secondary">
        Use this only for corrections. Receipts come from purchase orders, and stock leaves through
        dispatch.
      </Text>
      <Button type="primary" htmlType="submit" loading={isLoading} block>
        {direction === 'add' ? 'Add to stock' : 'Remove from stock'}
      </Button>
    </Form>
  );
}

function TransferForm({ productId, warehouses, onDone }) {
  const [form] = Form.useForm();
  const [transfer, { isLoading }] = useTransferStockMutation();
  if (warehouses.length < 2)
    return (
      <Alert
        type="info"
        showIcon
        message="Add a second godown (Inventory → Godowns) to move stock between godowns."
      />
    );
  const submit = async (v) => {
    try {
      await transfer({ productId, ...v }).unwrap();
      toast.success('Stock moved');
      form.resetFields(['quantity', 'reason']);
      onDone?.();
    } catch (e) {
      toast.error(e?.data?.message || 'Could not move stock');
    }
  };
  const opts = warehouses.map((w) => ({ value: w.id, label: w.name }));
  return (
    <Form form={form} layout="vertical" onFinish={submit}>
      <Row gutter={12}>
        <Col span={12}>
          <Form.Item name="fromWarehouseId" label="From" rules={[{ required: true }]}>
            <Select options={opts} />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name="toWarehouseId" label="To" rules={[{ required: true }]}>
            <Select options={opts} />
          </Form.Item>
        </Col>
      </Row>
      <Form.Item name="quantity" label="Quantity" rules={[{ required: true }]}>
        <InputNumber className="fv2-productstockdrawer-193b4c2608" min={1} precision={0} />
      </Form.Item>
      <Form.Item name="reason" label="Note">
        <AutoComplete options={[{ value: 'Showroom display' }, { value: 'Site delivery stock' }]} />
      </Form.Item>
      <Button type="primary" htmlType="submit" loading={isLoading} block>
        Move stock
      </Button>
    </Form>
  );
}

/** Everything about one product's stock: numbers, who it is held for, what is coming, every movement. */
export default function ProductStockDrawer({ productId, open, onClose }) {
  const can = useCan();
  const canEdit = can('inventory', 'edit');
  const { data, isFetching, error, refetch } = useGetProductStockQuery(productId, {
    skip: !productId || !open,
    refetchOnMountOrArgChange: true,
  });
  const { data: whData } = useGetWarehousesQuery(undefined, { skip: !open });
  const warehouses = (whData?.data || []).filter((w) => w.active !== false);
  const [tab, setTab] = useState('reserved');
  const close = () => {
    setTab('reserved');
    onClose?.();
  };

  const t = data?.totals || {};
  const p = data?.product;

  return (
    <Drawer
      open={open}
      onClose={close}
      width={Math.min(760, typeof window !== 'undefined' ? window.innerWidth : 760)}
      title={
        p ? (
          <Space direction="vertical" size={0}>
            <span>{p.name}</span>
            <Text className="fv2-productstockdrawer-1d5e3dbbfa" type="secondary">
              {p.product_code} ·{' '}
              <Link to={`/product/${p.productId}`} onClick={close}>
                Open product
              </Link>
            </Text>
          </Space>
        ) : (
          'Stock'
        )
      }
      destroyOnHidden
    >
      {error ? (
        <Alert type="error" showIcon message={error?.data?.message || 'Could not load stock'} />
      ) : !data ? (
        <div className="fv2-productstockdrawer-375e7abfd5">
          <Loader />
        </div>
      ) : (
        <Loader loading={isFetching}>
          <Row className="fv2-productstockdrawer-d523a678ba" gutter={[12, 12]}>
            {[
              [
                'Available',
                t.available,
                t.available <= 0 ? '#cf1322' : t.available <= t.lowAt ? '#d48806' : '#389e0d',
              ],
              ['On hand', t.onHand],
              ['Reserved', t.reserved],
              ['Incoming', t.incoming],
              ['Damaged', t.damaged],
            ].map(([label, value, color]) => (
              <Col xs={12} sm={8} md={label === 'Available' ? 8 : 4} key={label}>
                <Card size="small">
                  <Statistic
                    title={label}
                    value={fmtQty(value)}
                    valueStyle={{ fontSize: 20, color }}
                  />
                </Card>
              </Col>
            ))}
          </Row>
          <Text className="fv2-productstockdrawer-e6998e5f25" type="secondary">
            Available = On hand − Reserved. Low-stock alert at {fmtQty(t.lowAt)}.
          </Text>

          {data.balances?.length > 1 && (
            <Table
              className="fv2-productstockdrawer-d523a678ba"
              size="small"
              rowKey="warehouseId"
              pagination={false}

              dataSource={data.balances}
              columns={[
                { title: 'Godown', dataIndex: 'warehouse' },
                { title: 'On hand', dataIndex: 'onHand', align: 'right', render: fmtQty },
                { title: 'Reserved', dataIndex: 'reserved', align: 'right', render: fmtQty },
                { title: 'Available', dataIndex: 'available', align: 'right', render: fmtQty },
                { title: 'Damaged', dataIndex: 'damaged', align: 'right', render: fmtQty },
              ]}
            />
          )}

          <Tabs
            activeKey={tab}
            onChange={setTab}
            items={[
              {
                key: 'reserved',
                label: `Reserved for (${data.reservedFor?.length || 0})`,
                children: data.reservedFor?.length ? (
                  <Table
                    size="small"
                    rowKey={(r) => `${r.orderId}-${r.warehouse}`}
                    pagination={false}
                    dataSource={data.reservedFor}
                    columns={[
                      {
                        title: 'Order',
                        dataIndex: 'orderNo',
                        render: (v, r) => (
                          <Link to={`/order/${r.orderId}`} onClick={close}>
                            {v}
                          </Link>
                        ),
                      },
                      { title: 'Customer', dataIndex: 'customer' },
                      { title: 'Qty', dataIndex: 'quantity', align: 'right', render: fmtQty },
                      { title: 'Since', dataIndex: 'since', render: fmtDate },
                      { title: 'Salesperson', dataIndex: 'salesperson' },
                      { title: 'Status', dataIndex: 'status', render: (s) => <Tag>{s}</Tag> },
                    ]}
                  />
                ) : (
                  <Empty
                    description="Not reserved for any order"
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                  />
                ),
              },
              {
                key: 'incoming',
                label: `Incoming (${data.incoming?.length || 0})`,
                children: data.incoming?.length ? (
                  <Table
                    size="small"
                    rowKey="poId"
                    pagination={false}
                    dataSource={data.incoming}
                    columns={[
                      {
                        title: 'Purchase order',
                        dataIndex: 'poNumber',
                        render: (v, r) => (
                          <Link to={`/po/${r.poId}`} onClick={close}>
                            {v}
                          </Link>
                        ),
                      },
                      { title: 'Still due', dataIndex: 'quantity', align: 'right', render: fmtQty },
                      { title: 'Expected', dataIndex: 'expected', render: fmtDate },
                      { title: 'Status', dataIndex: 'status', render: (s) => <Tag>{s}</Tag> },
                    ]}
                  />
                ) : (
                  <Empty
                    description="Nothing on order from vendors"
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                  />
                ),
              },
              {
                key: 'ledger',
                label: 'Movements',
                children: (
                  <Table
                    size="small"
                    rowKey="id"
                    dataSource={data.ledger || []}
                    pagination={{ pageSize: 10, size: 'small' }}
                    scroll={{ x: 640 }}
                    columns={[
                      { title: 'When', dataIndex: 'createdAt', render: fmtDateTime, width: 120 },
                      {
                        title: 'What',
                        dataIndex: 'movement',
                        render: (m, r) => (
                          <Space direction="vertical" size={0}>
                            <span>{MOVEMENT_LABELS[m] || m}</span>
                            {r.refNo && (
                              <Text className="fv2-productstockdrawer-1d5e3dbbfa" type="secondary">
                                {r.refNo}
                              </Text>
                            )}
                          </Space>
                        ),
                      },
                      {
                        title: 'On hand',
                        dataIndex: 'onHandChange',
                        align: 'right',
                        render: (v, r) =>
                          v ? (
                            <span>
                              {signed(v)} → {fmtQty(r.onHandAfter)}
                            </span>
                          ) : (
                            ''
                          ),
                      },
                      {
                        title: 'Reserved',
                        dataIndex: 'reservedChange',
                        align: 'right',
                        render: (v, r) =>
                          v ? (
                            <span>
                              {signed(v)} → {fmtQty(r.reservedAfter)}
                            </span>
                          ) : (
                            ''
                          ),
                      },
                      {
                        title: 'Incoming',
                        dataIndex: 'incomingChange',
                        align: 'right',
                        render: signed,
                      },
                      { title: 'By', dataIndex: 'user' },
                      { title: 'Reason', dataIndex: 'reason', ellipsis: true },
                    ]}
                  />
                ),
              },
              ...(canEdit
                ? [
                    {
                      key: 'adjust',
                      label: 'Adjust',
                      children: (
                        <AdjustForm
                          productId={productId}
                          warehouses={warehouses}
                          onDone={refetch}
                        />
                      ),
                    },
                    {
                      key: 'transfer',
                      label: 'Move between godowns',
                      children: (
                        <TransferForm
                          productId={productId}
                          warehouses={warehouses}
                          onDone={refetch}
                        />
                      ),
                    },
                  ]
                : []),
            ]}
          />
        </Loader>
      )}
    </Drawer>
  );
}
