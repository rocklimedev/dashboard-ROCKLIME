import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AutoComplete,
  Button,
  Card,
  Col,
  Descriptions,
  Empty,
  Form,
  Input,
  InputNumber,
  List,
  Row,
  Segmented,
  Select,
  Space,
  Tag,
  Typography,
  message,
} from 'antd';
import dayjs from 'dayjs';
import {
  useGetStockOverviewQuery,
  useGetProductStockQuery,
  useGetWarehousesQuery,
  useGetStockLedgerQuery,
  useStockEntryMutation,
} from '../../api/stockApi';
import {
  ADJUST_REASONS,
  MOVEMENT_LABELS,
  fmtQty,
  signed,
} from '../../components/Stock/stockLabels';
import './operations.css';

const { Title, Text } = Typography;

const TYPES = [
  { value: 'IN', label: 'Add stock', help: 'Found extra, opening stock, return without an order' },
  { value: 'OUT', label: 'Remove stock', help: 'Lost, sample given, wrong entry' },
  { value: 'DAMAGE', label: 'Mark damaged', help: 'Moves pieces from good stock to damaged' },
  { value: 'REPAIR', label: 'Back to good', help: 'A damaged piece is usable again' },
  { value: 'WRITE_OFF', label: 'Write off damaged', help: 'Throw away damaged pieces' },
  { value: 'MOVE', label: 'Move godown', help: 'Shift pieces from one godown to another' },
];

function useDebounced(v, ms = 300) {
  const [d, setD] = useState(v);
  useEffect(() => {
    const t = setTimeout(() => setD(v), ms);
    return () => clearTimeout(t);
  }, [v, ms]);
  return d;
}

/** Operations → Stock entry: one quick form for every manual stock change. */
export default function StockEntry() {
  const [form] = Form.useForm();
  const [type, setType] = useState('IN');
  const [search, setSearch] = useState('');
  const [product, setProduct] = useState(null);
  const q = useDebounced(search);
  const { data: found, isFetching: searching } = useGetStockOverviewQuery(
    { search: q, limit: 15 },
    { skip: q.trim().length < 2 },
  );
  const { data: whData } = useGetWarehousesQuery();
  const warehouses = whData?.data || [];
  const { data: detail } = useGetProductStockQuery(product?.productId, { skip: !product });
  const { data: recent } = useGetStockLedgerQuery({ refType: 'STOCK_ENTRY', limit: 12 });
  const [save, { isLoading: saving }] = useStockEntryMutation();

  const options = useMemo(
    () =>
      (found?.data || []).map((p) => ({
        value: p.productId,
        label: (
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {p.name} <Text type="secondary">{p.product_code}</Text>
            </span>
            <Text type="secondary">{fmtQty(p.available)} avail.</Text>
          </div>
        ),
        product: p,
      })),
    [found],
  );

  const totals = detail?.totals || product || {};
  const typeMeta = TYPES.find((t) => t.value === type);

  const submit = async (v) => {
    if (!product) return message.error('Choose a product first.');
    try {
      const r = await save({ type, productId: product.productId, ...v }).unwrap();
      message.success(r.message || 'Saved');
      form.resetFields(['quantity', 'reason']);
    } catch (e) {
      message.error(e?.data?.message || 'Could not save the entry');
    }
  };

  return (
    <div className="page-wrapper">
      <div className="content">
        <div className="ops-head">
          <div>
            <Title level={4} style={{ margin: 0 }}>
              Stock entry
            </Title>
            <Text type="secondary">
              Every change needs a reason and shows in Movements with your name.
            </Text>
          </div>
          <Link to="/inventory/stock-workspace?tab=entries">
            <Button>← Stock entry & counts</Button>
          </Link>
        </div>
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={14}>
            <Card className="ops-panel">
              <Form
                form={form}
                layout="vertical"
                onFinish={submit}
                initialValues={{ warehouseId: undefined }}
              >
                <Form.Item label="What are you doing?">
                  <Segmented
                    block
                    value={type}
                    onChange={setType}
                    options={TYPES.map((t) => ({ value: t.value, label: t.label }))}
                  />
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {typeMeta?.help}
                  </Text>
                </Form.Item>
                <Form.Item label="Product" required>
                  <AutoComplete
                    value={search}
                    options={options}
                    onSearch={setSearch}
                    onChange={setSearch}
                    onSelect={(id, opt) => {
                      setProduct(opt.product);
                      setSearch(opt.product.name);
                    }}
                    notFoundContent={
                      q.trim().length < 2
                        ? 'Type 2 letters of the name or code'
                        : searching
                          ? 'Searching…'
                          : 'No product found'
                    }
                  >
                    <Input.Search
                      placeholder="Search by name or code"
                      allowClear
                      onChange={(e) => !e.target.value && setProduct(null)}
                    />
                  </AutoComplete>
                </Form.Item>
                <Row gutter={12}>
                  <Col xs={24} sm={type === 'MOVE' ? 8 : 12}>
                    <Form.Item
                      label={type === 'MOVE' ? 'From godown' : 'Godown'}
                      name="warehouseId"
                    >
                      <Select
                        allowClear
                        placeholder="Main godown"
                        options={warehouses.map((w) => ({ value: w.id, label: w.name }))}
                      />
                    </Form.Item>
                  </Col>
                  {type === 'MOVE' && (
                    <Col xs={24} sm={8}>
                      <Form.Item
                        label="To godown"
                        name="toWarehouseId"
                        rules={[{ required: true, message: 'Choose a godown' }]}
                      >
                        <Select options={warehouses.map((w) => ({ value: w.id, label: w.name }))} />
                      </Form.Item>
                    </Col>
                  )}
                  <Col xs={24} sm={type === 'MOVE' ? 8 : 12}>
                    <Form.Item
                      label="Pieces"
                      name="quantity"
                      rules={[{ required: true, message: 'How many?' }]}
                    >
                      <InputNumber min={1} style={{ width: '100%' }} />
                    </Form.Item>
                  </Col>
                </Row>
                <Form.Item
                  label="Reason"
                  name="reason"
                  rules={[{ required: true, message: 'Write a reason' }]}
                >
                  <AutoComplete
                    options={ADJUST_REASONS.map((r) => ({ value: r }))}
                    filterOption={(i, o) => o.value.toLowerCase().includes(i.toLowerCase())}
                  >
                    <Input placeholder="e.g. broken while unloading" />
                  </AutoComplete>
                </Form.Item>
                <Button type="primary" htmlType="submit" loading={saving} disabled={!product}>
                  Save {typeMeta?.label.toLowerCase()}
                </Button>
              </Form>
            </Card>
          </Col>
          <Col xs={24} lg={10}>
            <Space direction="vertical" size={16} style={{ width: '100%' }}>
              <Card className="ops-panel" size="small" title="Current stock">
                {product ? (
                  <>
                    <Text strong>{product.name}</Text>
                    <Descriptions size="small" column={2} style={{ marginTop: 8 }}>
                      <Descriptions.Item label="On hand">{fmtQty(totals.onHand)}</Descriptions.Item>
                      <Descriptions.Item label="Reserved">
                        {fmtQty(totals.reserved)}
                      </Descriptions.Item>
                      <Descriptions.Item label="Available">
                        <Text strong>{fmtQty((totals.onHand || 0) - (totals.reserved || 0))}</Text>
                      </Descriptions.Item>
                      <Descriptions.Item label="Damaged">
                        {fmtQty(totals.damaged)}
                      </Descriptions.Item>
                      <Descriptions.Item label="Incoming">
                        {fmtQty(totals.incoming)}
                      </Descriptions.Item>
                    </Descriptions>
                    {(detail?.balances || []).length > 1 && (
                      <div style={{ marginTop: 4 }}>
                        {detail.balances.map((w) => (
                          <Tag key={w.warehouseId}>
                            {w.warehouse}: {fmtQty(w.onHand)}
                          </Tag>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description="Choose a product to see its stock"
                  />
                )}
              </Card>
              <Card
                className="ops-panel"
                size="small"
                title="Recent entries"
                extra={<Link to="/inventory/list?tab=movements">All movements</Link>}
              >
                {(recent?.data || []).length ? (
                  <List
                    size="small"
                    dataSource={recent.data}
                    renderItem={(x) => {
                      const ch = x.onHandChange || x.damagedChange;
                      return (
                        <List.Item extra={<Text strong>{signed(ch)}</Text>}>
                          <div style={{ minWidth: 0 }}>
                            <Text>{x.productName}</Text>
                            <div>
                              <Text type="secondary" style={{ fontSize: 12 }}>
                                {[
                                  MOVEMENT_LABELS[x.movement] || x.movement,
                                  x.reason,
                                  x.user,
                                  dayjs(x.createdAt).format('D MMM, h:mm a'),
                                ]
                                  .filter(Boolean)
                                  .join(' · ')}
                              </Text>
                            </div>
                          </div>
                        </List.Item>
                      );
                    }}
                  />
                ) : (
                  <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No manual entries yet" />
                )}
              </Card>
            </Space>
          </Col>
        </Row>
      </div>
    </div>
  );
}
