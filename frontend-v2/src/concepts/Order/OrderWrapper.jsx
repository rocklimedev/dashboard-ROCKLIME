import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import {
  useGetAllOrdersQuery,
  useDeleteOrderMutation,
  useUpdateOrderStatusMutation,
  useLazyDownloadOrderSummaryQuery,
  useGetOrderStatusCountsQuery,
} from '../../api/orderApi';
import {
  message,
  Input,
  Button,
  Select,
  Dropdown,
  Table,
  Tabs,
  Tag,
  Badge,
  Progress,
  Tooltip,
  Typography,
  Space,
} from 'antd';
import {
  SearchOutlined,
  EditOutlined,
  FileTextOutlined,
  DeleteOutlined,
  MoreOutlined,
  DownloadOutlined,
  RollbackOutlined,
  CarOutlined,
  SwapOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import DispatchModal from '../../components/modals/DispatchModal';
import DeleteModal from '../../components/Common/DeleteModal';
import PageHeader from '../../components/Common/PageHeader';
import OrderCreditNoteModal from '../../components/modals/OrderCreditNoteModal';
import useCan from '../../utils/useCan';
import NewOrderModal from '../../components/Orders/QuotationPicker';

const { Text } = Typography;

// Statuses a person can pick by hand. DISPATCHED / PARTIALLY_DISPATCHED come
// only from recorded dispatches; DELIVERED from "Mark delivered".
const SETTABLE = [
  'DRAFT',
  'PREPARING',
  'CHECKING',
  'INVOICE',
  'ONHOLD',
  'DELIVERED',
  'PARTIALLY_DELIVERED',
  'RETURNED',
  'CANCELED',
  'CLOSED',
];

const STATUS_TAG = {
  DRAFT: 'default',
  PREPARING: 'processing',
  CHECKING: 'cyan',
  INVOICE: 'purple',
  PARTIALLY_DISPATCHED: 'gold',
  DISPATCHED: 'blue',
  PARTIALLY_DELIVERED: 'lime',
  DELIVERED: 'green',
  CLOSED: 'success',
  ONHOLD: 'orange',
  RETURNED: 'magenta',
  CANCELED: 'red',
};

const TABS = [
  { key: '', label: 'All', count: (c) => c.total },
  {
    key: 'ACTIVE',
    label: 'Active',
    statuses: 'PREPARING,CHECKING,INVOICE,PARTIALLY_DISPATCHED,ONHOLD',
    count: (c) => c.active,
  },
  {
    key: 'TODISPATCH',
    label: 'To dispatch',
    statuses: 'PREPARING,CHECKING,INVOICE,PARTIALLY_DISPATCHED',
    count: (c) => c.toDispatch,
  },
  { key: 'LATE', label: 'Late', late: true, count: (c) => c.late, danger: true },
  {
    key: 'TRANSIT',
    label: 'Dispatched',
    statuses: 'DISPATCHED,PARTIALLY_DELIVERED',
    count: (c) => c.inTransit,
  },
  { key: 'DONE', label: 'Delivered / closed', statuses: 'DELIVERED,CLOSED', count: (c) => c.done },
  { key: 'DRAFT', label: 'Draft', statuses: 'DRAFT', count: (c) => c.byStatus?.DRAFT || 0 },
  {
    key: 'CANCELED',
    label: 'Cancelled',
    statuses: 'CANCELED,RETURNED',
    count: (c) => (c.byStatus?.CANCELED || 0) + (c.byStatus?.RETURNED || 0),
  },
];

const inr = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
const label = (s) =>
  (s || '')
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/^\w/, (c) => c.toUpperCase());

const OrderWrapper = () => {
  const navigate = useNavigate();
  const [params0] = useSearchParams();
  const [newOrderOpen, setNewOrderOpen] = useState(params0.get('new') === '1');
  const can = useCan();
  const [params, setParams] = useSearchParams();
  const [downloadOrderSummary] = useLazyDownloadOrderSummaryQuery();

  const canEdit = can('orders', 'edit');
  const canDelete = can('orders', 'delete');
  const canWrite = can('orders', 'write');

  const tab = params.get('tab') || '';
  const tabDef = TABS.find((t) => t.key === tab) || TABS[0];

  const [searchTerm, setSearchTerm] = useState('');
  const [search, setSearch] = useState('');
  const [priority, setPriority] = useState('');
  const [sort, setSort] = useState('createdAt_desc');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  const [orderToDelete, setOrderToDelete] = useState(null);
  const [orderToDispatch, setOrderToDispatch] = useState(null);
  const [orderForCreditNote, setOrderForCreditNote] = useState(null);

  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchTerm.trim());
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [searchTerm]);

  const {
    data: response,
    error,
    isLoading,
    isFetching,
  } = useGetAllOrdersQuery({
    search,
    status: tabDef.statuses || '',
    late: !!tabDef.late,
    priority,
    sort,
    page,
    limit,
  });
  const { data: counts } = useGetOrderStatusCountsQuery();

  const orders = response?.data || [];
  const total = response?.pagination?.total || 0;

  const [deleteOrder] = useDeleteOrderMutation();
  const [updateOrderStatus] = useUpdateOrderStatusMutation();

  const setTab = (key) => {
    const next = new URLSearchParams(params);
    if (key) next.set('tab', key);
    else next.delete('tab');
    setParams(next, { replace: true });
    setPage(1);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setPriority('');
    setSort('createdAt_desc');
    setPage(1);
  };

  const handleDelete = async () => {
    if (!orderToDelete) return;
    try {
      await deleteOrder(orderToDelete).unwrap();
      message.success('Order deleted');
    } catch (err) {
      message.error(err?.data?.message || 'Failed to delete order');
    } finally {
      setOrderToDelete(null);
    }
  };

  const changeStatus = async (order, status) => {
    try {
      await updateOrderStatus({ orderId: order.id, status }).unwrap();
      message.success(`Order #${order.orderNo} → ${label(status)}`);
    } catch (err) {
      message.error(err?.data?.message || 'Could not change the status');
    }
  };

  const downloadSummary = async (order) => {
    try {
      const blob = await downloadOrderSummary(order.id).unwrap();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Order-${order.orderNo}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      message.error('Failed to download the order summary');
    }
  };

  const assigned = (o) =>
    [
      o.assignedTeam?.teamName,
      o.assignedUser?.name || o.assignedUser?.username,
      o.secondaryUser?.name || o.secondaryUser?.username,
    ]
      .filter(Boolean)
      .join(', ') || '—';

  const columns = [
    {
      title: 'Order',
      key: 'order',
      render: (_, o) => (
        <div>
          <Link to={`/order/${o.id}`} className="fw-medium">
            #{o.orderNo}
          </Link>
          {o.priority === 'high' && (
            <Tag color="red" style={{ marginInlineStart: 6 }}>
              High
            </Tag>
          )}
          <div>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {dayjs(o.createdAt).format('D MMM YYYY')}
              {o.quotation?.reference_number && (
                <>
                  {' · '}
                  <Link to={`/quotation/${o.quotationId}`}>{o.quotation.reference_number}</Link>
                </>
              )}
            </Text>
          </div>
        </div>
      ),
    },
    {
      title: 'Customer',
      key: 'customer',
      render: (_, o) =>
        o.customer ? (
          <Link to={`/customer/${o.customer.customerId}`}>{o.customer.name}</Link>
        ) : (
          <Text type="secondary">—</Text>
        ),
    },
    {
      title: 'Status',
      key: 'status',
      render: (_, o) => {
        const tag = <Tag color={STATUS_TAG[o.status] || 'default'}>{label(o.status)}</Tag>;
        if (!canWrite) return tag;
        return (
          <Dropdown
            trigger={['click']}
            menu={{
              items: SETTABLE.map((s) => ({ key: s, label: label(s), disabled: s === o.status })),
              onClick: ({ key }) => changeStatus(o, key),
            }}
          >
            <span style={{ cursor: 'pointer' }}>
              {tag}
              <SwapOutlined style={{ fontSize: 11, color: '#8c8c8c' }} />
            </span>
          </Dropdown>
        );
      },
    },
    {
      title: 'Amount',
      key: 'amount',
      align: 'right',
      render: (_, o) => inr(o.finalAmount),
    },
    {
      title: 'Paid / due',
      key: 'due',
      align: 'right',
      render: (_, o) =>
        ['DRAFT', 'CANCELED'].includes(o.status) ? (
          <Text type="secondary">—</Text>
        ) : o.due > 0.5 ? (
          <Tooltip title={`Paid ${inr(o.paid)} of ${inr(o.billed)}`}>
            <Text type="danger">{inr(o.due)} due</Text>
          </Tooltip>
        ) : (
          <Text type="success">Paid</Text>
        ),
    },
    {
      title: 'Dispatched',
      key: 'dispatched',
      width: 130,
      render: (_, o) =>
        o.orderedQty ? (
          <Tooltip title={`${o.dispatchedQty} of ${o.orderedQty} items sent`}>
            <Progress
              percent={Math.round((o.dispatchedQty / o.orderedQty) * 100)}
              size="small"
              format={() => `${o.dispatchedQty}/${o.orderedQty}`}
              status={o.dispatchedQty >= o.orderedQty ? 'success' : 'active'}
            />
          </Tooltip>
        ) : (
          <Text type="secondary">—</Text>
        ),
    },
    {
      title: 'Due date',
      key: 'dueDate',
      render: (_, o) =>
        o.dueDate ? (
          <Text type={o.isLate ? 'danger' : undefined} strong={o.isLate}>
            {dayjs(o.dueDate).format('D MMM')}
            {o.isLate ? ' · late' : ''}
          </Text>
        ) : (
          '—'
        ),
    },
    {
      title: 'Assigned to',
      key: 'assigned',
      render: (_, o) => <Text type="secondary">{assigned(o)}</Text>,
    },
    {
      title: '',
      key: 'actions',
      fixed: 'right',
      width: 110,
      render: (_, o) => {
        const dispatchable =
          canWrite &&
          ['PREPARING', 'CHECKING', 'INVOICE', 'PARTIALLY_DISPATCHED'].includes(o.status);
        const shipped = [
          'DISPATCHED',
          'PARTIALLY_DISPATCHED',
          'DELIVERED',
          'PARTIALLY_DELIVERED',
        ].includes(o.status);
        const items = [
          canEdit && { key: 'edit', icon: <EditOutlined />, label: 'Edit' },
          { key: 'summary', icon: <DownloadOutlined />, label: 'Download order summary' },
          o.invoiceLink && { key: 'invoice', icon: <FileTextOutlined />, label: 'View invoice' },
          canWrite &&
            shipped && { key: 'credit', icon: <RollbackOutlined />, label: 'Credit note (return)' },
          canDelete && { type: 'divider' },
          canDelete && { key: 'delete', icon: <DeleteOutlined />, label: 'Delete', danger: true },
        ].filter(Boolean);
        const onMenu = ({ key }) => {
          if (key === 'edit') navigate(`/order/${o.id}/edit`, { state: { order: o } });
          if (key === 'summary') downloadSummary(o);
          if (key === 'invoice') window.open(o.invoiceLink, '_blank', 'noopener,noreferrer');
          if (key === 'credit') setOrderForCreditNote(o);
          if (key === 'delete') setOrderToDelete(o.id);
        };
        return (
          <Space size={2}>
            {dispatchable && (
              <Tooltip title="Dispatch">
                <Button type="text" icon={<CarOutlined />} onClick={() => setOrderToDispatch(o)} />
              </Tooltip>
            )}
            <Dropdown menu={{ items, onClick: onMenu }} trigger={['click']}>
              <Button type="text" icon={<MoreOutlined />} />
            </Dropdown>
          </Space>
        );
      },
    },
  ];

  return (
    <div className="page-wrapper">
      <div className="content">
        <PageHeader
          title="Orders"
          subtitle={
            counts
              ? `${counts.toDispatch} to dispatch${counts.late ? ` · ${counts.late} late` : ''}`
              : 'Confirm orders, reserve stock, track status'
          }
          onAdd={canWrite ? () => setNewOrderOpen(true) : undefined}
          addLabel="+ New order"
        />

        <div className="card-body">
          <Tabs
            activeKey={tab}
            onChange={setTab}
            items={TABS.map((t) => {
              const n = counts ? t.count(counts) : null;
              return {
                key: t.key,
                label: (
                  <span>
                    {t.label}{' '}
                    {n != null && (
                      <Badge
                        count={n}
                        showZero
                        overflowCount={9999}
                        color={t.danger && n ? '#cf1322' : undefined}
                        style={
                          t.danger && n ? undefined : { background: '#f0f0f0', color: '#595959' }
                        }
                      />
                    )}
                  </span>
                ),
              };
            })}
          />

          <div className="d-flex flex-wrap gap-2 mb-3 align-items-center">
            <Input
              prefix={<SearchOutlined />}
              placeholder="Search order no. or customer"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              allowClear
              style={{ width: 280 }}
            />
            <Select
              placeholder="Priority"
              value={priority || undefined}
              onChange={(v) => {
                setPriority(v || '');
                setPage(1);
              }}
              allowClear
              style={{ width: 130 }}
              options={[
                { value: 'high', label: 'High' },
                { value: 'medium', label: 'Medium' },
                { value: 'low', label: 'Low' },
              ]}
            />
            <Select
              value={sort}
              onChange={(v) => {
                setSort(v);
                setPage(1);
              }}
              style={{ width: 190 }}
              options={[
                { value: 'createdAt_desc', label: 'Newest first' },
                { value: 'dueDate_asc', label: 'Due date (soonest)' },
                { value: 'dueDate_desc', label: 'Due date (latest)' },
                { value: 'amount_desc', label: 'Amount (highest)' },
              ]}
            />
            <Button onClick={clearFilters}>Clear</Button>
          </div>

          {error ? (
            <div className="alert alert-danger">
              {error?.data?.message || 'Failed to load orders'}
            </div>
          ) : (
            <Table
              columns={columns}
              dataSource={orders}
              rowKey="id"
              loading={isLoading || isFetching}
              size="middle"
              scroll={{ x: 'max-content' }}
              rowClassName={(o) => (o.isLate ? 'order-row-late' : '')}
              locale={{
                emptyText: tab === 'LATE' ? 'No late orders' : 'No orders match these filters',
              }}
              pagination={{
                current: page,
                pageSize: limit,
                total,
                showSizeChanger: true,
                pageSizeOptions: ['10', '20', '50', '100'],
                showTotal: (t, r) => `${r[0]}–${r[1]} of ${t}`,
                onChange: (p, s) => {
                  setPage(s !== limit ? 1 : p);
                  setLimit(s);
                },
              }}
            />
          )}
        </div>

        <DeleteModal
          isVisible={!!orderToDelete}
          onConfirm={handleDelete}
          onCancel={() => setOrderToDelete(null)}
          itemType="Order"
        />
        <OrderCreditNoteModal
          visible={!!orderForCreditNote}
          order={orderForCreditNote}
          onClose={() => setOrderForCreditNote(null)}
        />
        <DispatchModal
          visible={!!orderToDispatch}
          order={orderToDispatch}
          onClose={() => setOrderToDispatch(null)}
        />
        <NewOrderModal open={newOrderOpen} onClose={() => setNewOrderOpen(false)} />
      </div>
    </div>
  );
};

export default OrderWrapper;
