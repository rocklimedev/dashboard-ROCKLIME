import ModalShell from '../../components/Common/ModalShell';
import './StockPage.styles.css';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Alert, Button, Card, Col, Empty, Form, Input, InputNumber, Modal, Row, Segmented, Select, Space, Statistic, Switch, Table, Tabs, Tag, Typography } from 'antd';
import { toast } from 'sonner';
import { ReloadOutlined, SearchOutlined, EditOutlined } from '@ant-design/icons';
import {
  useApproveStockCountMutation,
  useCreateStockCountMutation,
  useGetBackordersQuery,
  useGetStockCountQuery,
  useGetStockCountsQuery,
  useGetStockLedgerQuery,
  useGetStockOverviewQuery,
  useGetWarehousesQuery,
  useSaveStockCountLinesMutation,
  useSaveWarehouseMutation,
} from '../../api/stockApi';
import { useGetProductsByIdsQuery } from '../../api/productApi';
import { productCompanyCode } from '../../components/Quotation/productSyncHelpers';
import useStockCountDraft from '../../components/Stock/useStockCountDraft';
import { useGetProfileQuery } from '../../api/userApi';
import ProductStockDrawer from '../../components/Stock/ProductStockDrawer';
import StockBadge from '../../components/Stock/StockBadge';
import {
  MOVEMENT_LABELS,
  fmtDate,
  fmtDateTime,
  fmtQty,
  signed,
} from '../../components/Stock/stockLabels';
import useCan from '../../utils/useCan';

const { Title, Text } = Typography;

const useDebounced = (value, ms = 300) => {
  const [v, setV] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setV(value), ms);
    return () => clearTimeout(id);
  }, [value, ms]);
  return v;
};

// ---------------------------------------------------------------------------
// Live stock
// ---------------------------------------------------------------------------
function LiveStock({ warehouseId, onOpen, initialFilter = '' }) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState(initialFilter);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const q = useDebounced(search);
  const { data, isFetching, error, refetch } = useGetStockOverviewQuery(
    { search: q, filter, warehouseId, page, limit: pageSize },
    { refetchOnMountOrArgChange: true },
  );
  const t = data?.totals || {};
  return (
    <>
      <Row className="fv2-stockpage-825070f00b" gutter={[12, 12]}>
        {[
          ['On hand', t.onHand, 'Good stock in the godown'],
          ['Reserved', t.reserved, 'Held for confirmed orders'],
          ['Available', t.available, 'What sales can still promise'],
          ['Incoming', t.incoming, 'On confirmed purchase orders'],
          ['Damaged', t.damaged, 'Kept apart'],
        ].map(([label, value, hint]) => (
          <Col xs={12} md={8} lg={4} key={label} flex="1">
            <Card size="small">
              <Statistic title={label} value={fmtQty(value)} />
              <Text className="fv2-stockpage-c188fee3a1" type="secondary">
                {hint}
              </Text>
            </Card>
          </Col>
        ))}
      </Row>
      <Space className="fv2-stockpage-5346a92030" wrap>
        <Input
          className="fv2-stockpage-d716cc6be0"
          allowClear
          prefix={<SearchOutlined />}
          placeholder="Search name, code or field"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
        <Space wrap>
          <Segmented
            value={filter}
            onChange={(v) => {
              setFilter(v);
              setPage(1);
            }}
            options={[
              { label: 'All', value: '' },
              { label: 'Low', value: 'low' },
              { label: 'Out', value: 'out' },
              { label: 'Reserved', value: 'reserved' },
              { label: 'Incoming', value: 'incoming' },
              { label: 'Damaged', value: 'damaged' },
            ]}
          />
          <Button icon={<ReloadOutlined />} onClick={refetch} />
        </Space>
      </Space>
      {error && (
        <Alert
          className="fv2-stockpage-f34f27c7a2"
          type="error"
          showIcon
          message={error?.data?.message || 'Could not load stock'}
        />
      )}
      <Table
        rowKey="productId"
        size="middle"
        loading={isFetching}
        dataSource={data?.data || []}
        onRow={(r) => ({ onClick: () => onOpen(r.productId), style: { cursor: 'pointer' } })}
        scroll={{ x: 900 }}
        pagination={{
          current: page,
          pageSize,
          total: data?.pagination?.total || 0,
          showSizeChanger: true,
          pageSizeOptions: [25, 50, 100, 200],
          showTotal: (n) => `${fmtQty(n)} products`,
          onChange: (p, s) => {
            setPage(p);
            setPageSize(s);
          },
        }}
        locale={{ emptyText: <Empty description="No products match" /> }}
        columns={[
          {
            title: 'Product',
            dataIndex: 'name',
            render: (v, r) => (
              <Space direction="vertical" size={0}>
                <span className="fv2-stockpage-b74b5d958e">{v}</span>
                <Text className="fv2-stockpage-c188fee3a1" type="secondary">
                  {[r.product_code, r.brandName].filter(Boolean).join(' · ')}
                </Text>
              </Space>
            ),
          },
          { title: 'On hand', dataIndex: 'onHand', align: 'right', width: 100, render: fmtQty },
          {
            title: 'Reserved',
            dataIndex: 'reserved',
            align: 'right',
            width: 100,
            render: (v) => (v ? fmtQty(v) : <Text type="secondary">0</Text>),
          },
          {
            title: 'Available',
            dataIndex: 'available',
            align: 'right',
            width: 110,
            render: (v, r) => (
              <Text
                strong
                style={{ color: v <= 0 ? '#cf1322' : v <= r.lowAt ? '#d48806' : undefined }}
              >
                {fmtQty(v)}
              </Text>
            ),
          },
          {
            title: 'Incoming',
            dataIndex: 'incoming',
            align: 'right',
            width: 100,
            render: (v) => (v ? fmtQty(v) : <Text type="secondary">0</Text>),
          },
          {
            title: 'Damaged',
            dataIndex: 'damaged',
            align: 'right',
            width: 100,
            render: (v) => (v ? fmtQty(v) : <Text type="secondary">0</Text>),
          },
          {
            title: 'Status',
            width: 170,
            render: (_, r) => (
              <StockBadge
                available={r.available}
                reserved={r.reserved}
                incoming={r.incoming}
                lowAt={r.lowAt}
                compact
              />
            ),
          },
        ]}
      />
    </>
  );
}

// ---------------------------------------------------------------------------
// Backorders: confirmed order lines waiting for stock
// ---------------------------------------------------------------------------
function Backorders({ onOpen }) {
  const { data, isFetching, refetch } = useGetBackordersQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });
  const rows = data?.data || [];
  return (
    <>
      <Space className="fv2-stockpage-5346a92030">
        <Text type="secondary">
          Order lines that could not be fully reserved. They fill automatically, oldest order first,
          when goods arrive.
        </Text>
        <Button icon={<ReloadOutlined />} onClick={refetch} />
      </Space>
      <Table
        rowKey={(r) => `${r.orderId}-${r.productId}`}
        loading={isFetching}
        dataSource={rows}
        scroll={{ x: 800 }}
        locale={{ emptyText: <Empty description="Nothing is waiting for stock" /> }}
        columns={[
          {
            title: 'Order',
            dataIndex: 'orderNo',
            render: (v, r) => <Link to={`/order/${r.orderId}`}>{v}</Link>,
          },
          { title: 'Customer', dataIndex: 'customer' },
          {
            title: 'Product',
            dataIndex: 'name',
            render: (v, r) => <a onClick={() => onOpen(r.productId)}>{v}</a>,
          },
          { title: 'Needed', dataIndex: 'needed', align: 'right', render: fmtQty },
          { title: 'Reserved', dataIndex: 'reserved', align: 'right', render: fmtQty },
          {
            title: 'Waiting',
            dataIndex: 'backordered',
            align: 'right',
            render: (v) => (
              <Text strong type="danger">
                {fmtQty(v)}
              </Text>
            ),
          },
          {
            title: 'Priority',
            dataIndex: 'priority',
            render: (p) => (
              <Tag color={p === 'high' ? 'red' : p === 'medium' ? 'orange' : 'default'}>{p}</Tag>
            ),
          },
          { title: 'Ordered', dataIndex: 'createdAt', render: fmtDate },
          { title: 'Due', dataIndex: 'dueDate', render: fmtDate },
        ]}
      />
    </>
  );
}

// ---------------------------------------------------------------------------
// Movements (stock ledger)
// ---------------------------------------------------------------------------
function Movements({ onOpen, entriesOnly = false }) {
  const [search, setSearch] = useState('');
  const [movement, setMovement] = useState();
  const [page, setPage] = useState(1);
  const q = useDebounced(search);
  const { data, isFetching } = useGetStockLedgerQuery(
    { search: q, movement, page, limit: 50, ...(entriesOnly ? { refType: 'STOCK_ENTRY' } : {}) },
    { refetchOnMountOrArgChange: true },
  );
  return (
    <>
      <Space className="fv2-stockpage-f34f27c7a2" wrap>
        <Input
          className="fv2-stockpage-6a9abfc04f"
          allowClear
          prefix={<SearchOutlined />}
          placeholder="Product name or code"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
        <Select
          className="fv2-stockpage-d152b9f0fc"
          allowClear
          placeholder="All movements"
          value={movement}
          onChange={(v) => {
            setMovement(v);
            setPage(1);
          }}

          options={Object.entries(MOVEMENT_LABELS).map(([value, label]) => ({ value, label }))}
        />
      </Space>
      <Table
        rowKey="id"
        size="small"
        loading={isFetching}
        dataSource={data?.data || []}
        scroll={{ x: 1000 }}
        pagination={{
          current: page,
          pageSize: 50,
          total: data?.pagination?.total || 0,
          showSizeChanger: false,
          onChange: setPage,
        }}
        columns={[
          { title: 'When', dataIndex: 'createdAt', render: fmtDateTime, width: 130 },
          {
            title: 'Product',
            dataIndex: 'productName',
            render: (v, r) => (
              <a onClick={() => onOpen(r.productId)}>
                {v}
                {r.productCode ? <Text type="secondary"> · {r.productCode}</Text> : null}
              </a>
            ),
          },
          { title: 'Movement', dataIndex: 'movement', render: (m) => MOVEMENT_LABELS[m] || m },
          { title: 'Document', dataIndex: 'refNo' },
          {
            title: 'On hand',
            dataIndex: 'onHandChange',
            align: 'right',
            render: (v, r) => (v ? `${signed(v)} → ${fmtQty(r.onHandAfter)}` : ''),
          },
          {
            title: 'Reserved',
            dataIndex: 'reservedChange',
            align: 'right',
            render: (v, r) => (v ? `${signed(v)} → ${fmtQty(r.reservedAfter)}` : ''),
          },
          { title: 'Incoming', dataIndex: 'incomingChange', align: 'right', render: signed },
          { title: 'Godown', dataIndex: 'warehouse' },
          { title: 'By', dataIndex: 'user' },
          { title: 'Reason', dataIndex: 'reason', ellipsis: true },
        ]}
      />
    </>
  );
}

// ---------------------------------------------------------------------------
// Physical stock counts
// ---------------------------------------------------------------------------
function CountSheet({ id, onBack }) {
  const can = useCan();
  const [searchParams, setSearchParams] = useSearchParams();
  const { data, isFetching, refetch } = useGetStockCountQuery(id, {
    refetchOnMountOrArgChange: true,
  });
  const [save, { isLoading: saving }] = useSaveStockCountLinesMutation();
  const [approve, { isLoading: approving }] = useApproveStockCountMutation();
  const { data: profile, error: profileError } = useGetProfileQuery();
  const [approvalPending, setApprovalPending] = useState(false);
  const [onlyCounted, setOnlyCounted] = useState(false);
  const [search, setSearch] = useState('');
  const count = data?.data;
  // Hydrate missing company codes from the catalog, including older count responses.
  const missingCodeIds = (data?.lines || [])
    .filter((line) => !productCompanyCode(line))
    .map((line) => line.productId);
  const { data: catalogResponse, isFetching: loadingCodes } = useGetProductsByIdsQuery(
    missingCodeIds,
    {
      skip: !missingCodeIds.length || !can('products', 'view'),
    },
  );
  const catalog = Array.isArray(catalogResponse) ? catalogResponse : catalogResponse?.data || [];
  const companyCodes = new Map(
    catalog.map((product) => [product.productId, productCompanyCode(product)]),
  );
  const draft = count?.status === 'DRAFT';
  const {
    edits,
    pendingCount,
    status: draftStatus,
    ready: draftReady,
    edit: editCount,
    flush: flushDraft,
  } = useStockCountDraft({
    countId: id,
    userId: profile?.user?.userId,
    data,
    enabled: draft && can('inventory', 'edit'),
    save,
  });
  const lines = (data?.lines || []).map((l) => {
    const counted = edits[l.productId] !== undefined ? edits[l.productId] : l.countedQty;
    return {
      ...l,
      companyCode: productCompanyCode(l) || companyCodes.get(l.productId) || '',
      counted,
      variance: counted == null || counted === '' ? null : Number(counted) - l.systemQty,
    };
  });
  const shown = lines.filter(
    (l) =>
      (!onlyCounted || l.counted != null) &&
      (!search ||
        `${l.name || ''} ${l.companyCode || ''}`.toLowerCase().includes(search.toLowerCase())),
  );
  const rawPage = searchParams.get('page');
  const parsedPage = Number(rawPage);
  const requestedPage = Number.isSafeInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1;
  const pageSize = 100;
  const page =
    data && !isFetching && !loadingCodes
      ? Math.min(requestedPage, Math.max(1, Math.ceil(shown.length / pageSize)))
      : requestedPage;
  const changePage = (nextPage) => {
    if (searchParams.get('page') === String(nextPage)) return;
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      next.set('page', String(nextPage));
      return next;
    });
  };
  useEffect(() => {
    if (rawPage === String(page)) return;
    setSearchParams(
      (current) => {
        const next = new URLSearchParams(current);
        next.set('page', String(page));
        return next;
      },
      { replace: true },
    );
  }, [rawPage, page, setSearchParams]);
  const countedN = lines.filter((l) => l.counted != null && l.counted !== '').length;
  const diffN = lines.filter((l) => l.variance).length;
  const doSave = async (silent = false) => {
    if (!draftReady) {
      toast.error('Please wait for the draft to load');
      return false;
    }
    if (!(await flushDraft())) {
      toast.error('Could not save the draft. Keep this page open and retry Save.');
      return false;
    }
    await refetch();
    if (!silent) toast.success('Counts saved');
    return true;
  };
  const doApprove = () =>
    Modal.confirm({
      title: `Approve count ${count?.countNo}?`,
      content: `On hand will be set to the counted figure for ${countedN} product(s); ${diffN} differ from the system. Products left blank are not changed.`,
      okText: 'Approve and update stock',
      onOk: async () => {
        setApprovalPending(true);
        try {
          if (!(await doSave(true))) throw new Error('Save the draft before approving');
          const r = await approve(id).unwrap();
          toast.success(r?.message || 'Count approved');
          refetch();
        } catch (e) {
          toast.error(e?.data?.message || e?.message || 'Could not approve');
          throw e;
        } finally {
          setApprovalPending(false);
        }
      },
    });
  return (
    <>
      <Space className="fv2-stockpage-5346a92030" wrap>
        <Space wrap>
          <Button onClick={onBack}>← All counts</Button>
          <Title className="fv2-stockpage-053af1dc0a" level={5}>
            {count?.countNo}
          </Title>
          {count && (
            <Tag color={draft ? 'blue' : 'green'}>{draft ? 'In progress' : 'Approved'}</Tag>
          )}
          {draft && can('inventory', 'edit') && (
            <Text type="secondary" role="status">
              {profileError ? 'Account unavailable. Reload to enable draft autosave.' : draftStatus}
            </Text>
          )}
          <Text type="secondary">
            {countedN} of {lines.length} counted · {diffN} different
          </Text>
        </Space>
        <Space wrap>
          <Input
            className="fv2-stockpage-67aa029c13"
            allowClear
            placeholder="Product name or company code"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              changePage(1);
            }}
          />
          <Space>
            <Switch
              size="small"
              checked={onlyCounted}
              onChange={(value) => {
                setOnlyCounted(value);
                changePage(1);
              }}
            />
            <Text>Counted only</Text>
          </Space>
          {draft && can('inventory', 'edit') && (
            <>
              <Button
                onClick={() => doSave()}
                loading={saving}
                disabled={!pendingCount || !draftReady || approvalPending}
              >
                Save
              </Button>
              <Button
                type="primary"
                onClick={doApprove}
                loading={approving || approvalPending}
                disabled={!countedN || !draftReady || approvalPending}
              >
                Approve count
              </Button>
            </>
          )}
        </Space>
      </Space>
      <Table
        rowKey="productId"
        size="small"
        loading={isFetching}
        dataSource={shown}
        pagination={{ current: page, pageSize, showSizeChanger: false, onChange: changePage }}
        columns={[
          { title: 'Product', dataIndex: 'name' },
          {
            title: 'Company code',
            dataIndex: 'companyCode',
            render: (value) => value || (loadingCodes ? 'Loading…' : '—'),
          },
          { title: 'System', dataIndex: 'systemQty', align: 'right', width: 100, render: fmtQty },
          {
            title: 'Counted',
            dataIndex: 'counted',
            width: 140,
            render: (v, r) =>
              draft ? (
                <InputNumber
                  className="fv2-stockpage-b568bbfe40"
                  min={0}
                  precision={0}
                  value={v}
                  disabled={!draftReady || approvalPending || !can('inventory', 'edit')}
                  onChange={(val) => editCount(r.productId, val)}
                />
              ) : v == null ? (
                '—'
              ) : (
                fmtQty(v)
              ),
          },
          {
            title: 'Difference',
            dataIndex: 'variance',
            align: 'right',
            width: 110,
            render: (v) =>
              v == null ? (
                ''
              ) : v === 0 ? (
                <Text type="success">matches</Text>
              ) : (
                <Text type="danger">{signed(v)}</Text>
              ),
          },
        ]}
      />
    </>
  );
}

function Counts({ warehouses }) {
  const can = useCan();
  const navigate = useNavigate();
  const { data, isFetching } = useGetStockCountsQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });
  const [create, { isLoading }] = useCreateStockCountMutation();
  const [wh, setWh] = useState();
  const whName = Object.fromEntries(warehouses.map((w) => [w.id, w.name]));
  const start = async () => {
    try {
      const r = await create({ warehouseId: wh || warehouses[0]?.id }).unwrap();
      toast.success(`Count ${r.data.countNo} started with ${r.lines} products`);
      navigate(`/inventory/counts/${r.data.id}?page=1`);
    } catch (e) {
      toast.error(e?.data?.message || 'Could not start a count');
    }
  };
  return (
    <>
      <Alert
        className="fv2-stockpage-f34f27c7a2"
        type="info"
        showIcon

        message="Count what is physically on the shelf, enter it here, then approve. On hand is set to the counted figure and every difference is logged."
      />
      {can('inventory', 'edit') && (
        <Space className="fv2-stockpage-f34f27c7a2">
          <Select
            className="fv2-stockpage-67aa029c13"
            value={wh || warehouses[0]?.id}
            onChange={setWh}

            options={warehouses.map((w) => ({ value: w.id, label: w.name }))}
          />
          <Button type="primary" onClick={start} loading={isLoading}>
            Start a new count
          </Button>
        </Space>
      )}
      <Table
        rowKey="id"
        loading={isFetching}
        dataSource={data?.data || []}
        onRow={(r) => ({
          onClick: () => navigate(`/inventory/counts/${r.id}?page=1`),
          style: { cursor: 'pointer' },
        })}
        locale={{ emptyText: <Empty description="No stock counts yet" /> }}
        columns={[
          {
            title: 'Count',
            dataIndex: 'countNo',
            render: (value, row) => (
              <Link
                to={`/inventory/counts/${row.id}?page=1`}
                onClick={(event) => event.stopPropagation()}
              >
                {value}
              </Link>
            ),
          },
          { title: 'Godown', dataIndex: 'warehouseId', render: (v) => whName[v] || '—' },
          { title: 'Started', dataIndex: 'createdAt', render: fmtDateTime },
          {
            title: 'Status',
            dataIndex: 'status',
            render: (s) => (
              <Tag color={s === 'DRAFT' ? 'blue' : 'green'}>
                {s === 'DRAFT' ? 'In progress' : 'Approved'}
              </Tag>
            ),
          },
          { title: 'Approved', dataIndex: 'approvedAt', render: fmtDateTime },
        ]}
      />
    </>
  );
}

// ---------------------------------------------------------------------------
// Godowns
// ---------------------------------------------------------------------------
function Godowns({ warehouses, loading }) {
  const can = useCan();
  const [save, { isLoading }] = useSaveWarehouseMutation();
  const [editing, setEditing] = useState(null);
  const [form] = Form.useForm();
  const open = (w) => {
    setEditing(w || {});
    form.setFieldsValue(w || { code: '', name: '', address: '', isDefault: false, active: true });
  };
  const submit = async (v) => {
    try {
      await save({ id: editing?.id, ...v }).unwrap();
      toast.success('Godown saved');
      setEditing(null);
    } catch (e) {
      toast.error(e?.data?.message || 'Could not save');
    }
  };
  return (
    <>
      {can('inventory', 'edit') && (
        <Button className="fv2-stockpage-f34f27c7a2" type="primary" onClick={() => open(null)}>
          Add godown
        </Button>
      )}
      <Table
        rowKey="id"
        loading={loading}
        dataSource={warehouses}
        pagination={false}
        columns={[
          { title: 'Code', dataIndex: 'code' },
          {
            title: 'Name',
            dataIndex: 'name',
            render: (v, r) => (
              <span>
                {v} {r.isDefault && <Tag color="blue">Default</Tag>}
              </span>
            ),
          },
          { title: 'Address', dataIndex: 'address' },
          {
            title: 'Active',
            dataIndex: 'active',
            render: (v) => (v === false ? <Tag>Inactive</Tag> : <Tag color="green">Active</Tag>),
          },
          ...(can('inventory', 'edit')
            ? [
                {
                  title: '',
                  render: (_, r) => (
                    <Button size="small" onClick={() => open(r)}>
                      Edit
                    </Button>
                  ),
                },
              ]
            : []),
        ]}
      />
      <ModalShell
        open={!!editing}
        title={editing?.id ? 'Edit godown' : 'Add godown'}
        onCancel={() => setEditing(null)}
        onOk={() => form.submit()}
        confirmLoading={isLoading}
        okText="Save"
      >
        <Form form={form} layout="vertical" onFinish={submit}>
          <Row gutter={12}>
            <Col span={8}>
              <Form.Item name="code" label="Code" rules={[{ required: true }]}>
                <Input maxLength={20} placeholder="MAIN" />
              </Form.Item>
            </Col>
            <Col span={16}>
              <Form.Item name="name" label="Name" rules={[{ required: true }]}>
                <Input placeholder="Peera Garhi godown" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="address" label="Address">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Space size="large">
            <Form.Item name="isDefault" label="Default for new stock" valuePropName="checked">
              <Switch />
            </Form.Item>
            <Form.Item name="active" label="Active" valuePropName="checked">
              <Switch />
            </Form.Item>
          </Space>
        </Form>
      </ModalShell>
    </>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function StockPage({ initialView = 'live' }) {
  const { id: countId } = useParams();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const tab = countId ? 'counts' : params.get('tab') || initialView;
  const [warehouseId, setWarehouseId] = useState();
  const [drawer, setDrawer] = useState(null);
  const { data: whData, isFetching: whLoading } = useGetWarehousesQuery();
  const warehouses = whData?.data || [];
  const can = useCan();
  const VIEWS = {
    live: {
      title: 'Live stock',
      help: 'What is on the shelf, what is promised, what is coming',
      body: (
        <LiveStock
          warehouseId={warehouseId}
          onOpen={setDrawer}
          initialFilter={params.get('filter') || ''}
        />
      ),
    },
    backorders: {
      title: 'Waiting for stock',
      help: 'Order lines that could not be reserved yet; they fill as goods arrive',
      body: <Backorders onOpen={setDrawer} />,
    },
    movements: {
      title: 'Stock movements',
      help: 'Every change to stock, with who made it and why',
      body: <Movements onOpen={setDrawer} />,
    },
    entries: {
      title: 'Stock entry & counts',
      help: 'Review manual entries, add stock changes, and open physical count workspaces',
    },
    counts: {
      title: 'Stock entry & counts',
      help: 'Review manual entries, add stock changes, and open physical count workspaces',
    },
    godowns: {
      title: 'Godowns',
      help: 'Where stock is kept',
      body: <Godowns warehouses={warehouses} loading={whLoading} />,
    },
  };
  const view = countId
    ? {
        title: 'Stock count',
        help: 'Count a godown and correct the system to match',
        body: (
          <CountSheet
            key={countId}
            id={countId}
            onBack={() => navigate('/inventory/stock-workspace?tab=counts')}
          />
        ),
      }
    : VIEWS[tab] || VIEWS.live;

  return (
    <div className="page-wrapper">
      <div className="content">
        <Space className="fv2-stockpage-d2d1da9b7d" wrap>
          <div>
            <Title className="fv2-stockpage-aa5edc0173" level={3}>
              {view.title}
            </Title>
            <Text type="secondary">{view.help}</Text>
          </div>
          <Space wrap>
            {warehouses.length > 1 && ['live', 'movements'].includes(tab) && (
              <Select
                className="fv2-stockpage-67aa029c13"
                allowClear
                placeholder="All godowns"
                value={warehouseId}
                onChange={setWarehouseId}

                options={warehouses.map((w) => ({ value: w.id, label: w.name }))}
              />
            )}
            {tab === 'live' && can('inventory', 'edit') && (
              <Link to="/inventory/stock-workspace">
                <Button icon={<EditOutlined />}>Stock entry & counts</Button>
              </Link>
            )}
          </Space>
        </Space>
        {/* the Operations sidebar is the menu for these views */}
        <Card>
          {!countId && ['entries', 'counts'].includes(tab) ? (
            <Tabs
              activeKey={tab}
              onChange={(key) => navigate(`/inventory/stock-workspace?tab=${key}`)}
              items={[
                {
                  key: 'entries',
                  label: 'Stock entries',
                  children: (
                    <>
                      {can('inventory', 'edit') && (
                        <Link to="/operations/stock-entry">
                          <Button
                            className="fv2-stockpage-825070f00b"
                            type="primary"
                            icon={<EditOutlined />}
                          >
                            New stock entry
                          </Button>
                        </Link>
                      )}
                      <Movements entriesOnly onOpen={setDrawer} />
                    </>
                  ),
                },
                {
                  key: 'counts',
                  label: 'Stock counts',
                  children: <Counts warehouses={warehouses} />,
                },
              ]}
            />
          ) : (
            view.body
          )}
        </Card>
      </div>
      <ProductStockDrawer productId={drawer} open={!!drawer} onClose={() => setDrawer(null)} />
    </div>
  );
}
