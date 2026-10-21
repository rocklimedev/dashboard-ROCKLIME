import { useMemo, useState } from 'react';
import TaxInvoices from '../../components/Accounts/TaxInvoices';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Alert,
  Button,
  Card,
  Col,
  DatePicker,
  Empty,
  Input,
  Row,
  Select,
  Space,
  Statistic,
  Table,
  Tabs,
  Tag,
  Tooltip,
  Typography,
} from 'antd';
import { ReloadOutlined, SearchOutlined, WhatsAppOutlined } from '@ant-design/icons';
import { useGetMoneyDueQuery, useGetPaymentsQuery } from '../../api/paymentsApi';
import RecordPaymentModal from '../../components/Accounts/RecordPaymentModal';
import { modeLabel } from '../../components/Accounts/paymentModes';
import { inr } from '../../utils/quotationMath';
import useCan from '../../utils/useCan';

const { Title, Text } = Typography;
const fmt = (d) =>
  d
    ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : '—';

function reminderLink(c) {
  const phone = String(c.customerPhone || '').replace(/\D/g, '');
  if (!phone) return null;
  const orders = c.orders.map((o) => `${o.orderNo}: ${inr(o.due)}`).join(', ');
  const msg = `Dear ${c.customerName}, a friendly reminder that ${inr(c.due)} is due on your order(s) ${orders}. Kindly arrange the payment. — CM Trading Co.`;
  return `https://wa.me/${phone.length === 10 ? `91${phone}` : phone}?text=${encodeURIComponent(msg)}`;
}

function MoneyDue({ onRecord }) {
  const { data, isFetching, error, refetch } = useGetMoneyDueQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });
  const [search, setSearch] = useState('');
  const [age, setAge] = useState('all');
  const t = data?.totals || {};
  const rows = useMemo(() => {
    let r = data?.customers || [];
    if (search)
      r = r.filter((c) =>
        `${c.customerName} ${c.customerPhone || ''}`.toLowerCase().includes(search.toLowerCase()),
      );
    if (age === '30') r = r.filter((c) => c.oldestDays > 30);
    if (age === '90') r = r.filter((c) => c.oldestDays > 90);
    return r;
  }, [data, search, age]);

  return (
    <>
      <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
        <Col xs={12} md={6}>
          <Card size="small">
            <Statistic
              title="Money due"
              value={inr(t.due || 0)}
              valueStyle={{ color: '#cf1322' }}
            />
            <Text type="secondary" style={{ fontSize: 12 }}>
              {t.orders || 0} orders · {t.customers || 0} customers
            </Text>
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card size="small">
            <Statistic
              title="Due over 30 days"
              value={inr(t.over30 || 0)}
              valueStyle={{ color: '#d48806' }}
            />
            <Text type="secondary" style={{ fontSize: 12 }}>
              counted from the order date
            </Text>
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card size="small">
            <Statistic title="Due over 90 days" value={inr(t.over90 || 0)} />
            <Text type="secondary" style={{ fontSize: 12 }}>
              follow up first
            </Text>
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card size="small">
            <Statistic
              title="Collected this month"
              value={inr(t.collectedThisMonth || 0)}
              valueStyle={{ color: '#389e0d' }}
            />
            <Text type="secondary" style={{ fontSize: 12 }}>
              {t.paymentsThisMonth || 0} payments
            </Text>
          </Card>
        </Col>
      </Row>
      <Space wrap style={{ marginBottom: 12, width: '100%', justifyContent: 'space-between' }}>
        <Space wrap>
          <Input
            allowClear
            prefix={<SearchOutlined />}
            placeholder="Customer or phone"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: 240 }}
          />
          <Select
            value={age}
            onChange={setAge}
            style={{ width: 170 }}
            options={[
              { value: 'all', label: 'Any age' },
              { value: '30', label: 'Older than 30 days' },
              { value: '90', label: 'Older than 90 days' },
            ]}
          />
        </Space>
        <Button icon={<ReloadOutlined />} onClick={refetch} />
      </Space>
      {error && (
        <Alert
          type="error"
          showIcon
          message={error?.data?.message || 'Could not load'}
          style={{ marginBottom: 12 }}
        />
      )}
      <Table
        rowKey={(c) => c.customerId || 'none'}
        loading={isFetching}
        dataSource={rows}
        scroll={{ x: 900 }}
        locale={{ emptyText: <Empty description="Nothing is due" /> }}
        expandable={{
          expandedRowRender: (c) => (
            <Table
              size="small"
              rowKey="id"
              pagination={false}
              dataSource={c.orders}
              columns={[
                {
                  title: 'Order',
                  dataIndex: 'orderNo',
                  render: (v, o) => <Link to={`/order/${o.id}`}>{v}</Link>,
                },
                { title: 'Status', dataIndex: 'status', render: (s) => <Tag>{s}</Tag> },
                { title: 'Ordered', dataIndex: 'createdAt', render: fmt },
                { title: 'Age', dataIndex: 'ageDays', render: (d) => `${d} days` },
                { title: 'Billed', dataIndex: 'billed', align: 'right', render: (v) => inr(v) },
                { title: 'Paid', dataIndex: 'paid', align: 'right', render: (v) => inr(v) },
                {
                  title: 'Due',
                  dataIndex: 'due',
                  align: 'right',
                  render: (v) => (
                    <Text strong type="danger">
                      {inr(v)}
                    </Text>
                  ),
                },
                {
                  title: '',
                  render: (_, o) =>
                    onRecord && (
                      <Button
                        size="small"
                        onClick={() => onRecord([{ ...o, customerName: c.customerName }], o.id)}
                      >
                        Record payment
                      </Button>
                    ),
                },
              ]}
            />
          ),
        }}
        columns={[
          {
            title: 'Customer',
            dataIndex: 'customerName',
            render: (v, c) =>
              c.customerId ? (
                <Space direction="vertical" size={0}>
                  <Link to={`/customer/${c.customerId}`}>{v}</Link>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {c.customerPhone}
                  </Text>
                </Space>
              ) : (
                v
              ),
          },
          { title: 'Orders', render: (_, c) => c.orders.length, width: 80 },
          {
            title: 'Due',
            dataIndex: 'due',
            align: 'right',
            sorter: (a, b) => a.due - b.due,
            defaultSortOrder: 'descend',
            render: (v) => (
              <Text strong type="danger">
                {inr(v)}
              </Text>
            ),
          },
          {
            title: '0–30 d',
            align: 'right',
            render: (_, c) => (c.ageing.d0_30 ? inr(c.ageing.d0_30) : '—'),
          },
          {
            title: '31–60 d',
            align: 'right',
            render: (_, c) => (c.ageing.d31_60 ? inr(c.ageing.d31_60) : '—'),
          },
          {
            title: '61–90 d',
            align: 'right',
            render: (_, c) => (c.ageing.d61_90 ? inr(c.ageing.d61_90) : '—'),
          },
          {
            title: '90+ d',
            align: 'right',
            render: (_, c) => (c.ageing.d90 ? <Text type="danger">{inr(c.ageing.d90)}</Text> : '—'),
          },
          {
            title: '',
            width: 200,
            render: (_, c) => {
              const wa = reminderLink(c);
              return (
                <Space>
                  {onRecord && (
                    <Button
                      size="small"
                      onClick={() =>
                        onRecord(c.orders.map((o) => ({ ...o, customerName: c.customerName })))
                      }
                    >
                      Record payment
                    </Button>
                  )}
                  {wa && (
                    <Tooltip title="Send a WhatsApp reminder">
                      <Button
                        size="small"
                        icon={<WhatsAppOutlined />}
                        href={wa}
                        target="_blank"
                        rel="noreferrer"
                      />
                    </Tooltip>
                  )}
                </Space>
              );
            },
          },
        ]}
      />
    </>
  );
}

function Payments() {
  const [range, setRange] = useState(null);
  const [page, setPage] = useState(1);
  const { data, isFetching } = useGetPaymentsQuery(
    {
      page,
      limit: 50,
      from: range?.[0]?.format('YYYY-MM-DD'),
      to: range?.[1]?.format('YYYY-MM-DD'),
    },
    { refetchOnMountOrArgChange: true },
  );
  const total = (data?.data || [])
    .filter((p) => p.status === 'RECEIVED')
    .reduce((s, p) => s + p.amount, 0);
  return (
    <>
      <Space wrap style={{ marginBottom: 12 }}>
        <DatePicker.RangePicker
          value={range}
          onChange={(v) => {
            setRange(v);
            setPage(1);
          }}
          format="DD MMM YYYY"
        />
        <Text type="secondary">
          Received on this page: <b>{inr(total)}</b>
        </Text>
      </Space>
      <Table
        rowKey="id"
        size="middle"
        loading={isFetching}
        dataSource={data?.data || []}
        scroll={{ x: 900 }}
        pagination={{
          current: page,
          pageSize: 50,
          total: data?.pagination?.total || 0,
          onChange: setPage,
          showSizeChanger: false,
        }}
        columns={[
          { title: 'Receipt', dataIndex: 'receiptNo' },
          { title: 'Date', dataIndex: 'receivedAt', render: fmt },
          { title: 'Customer', dataIndex: 'customerName' },
          {
            title: 'Order',
            dataIndex: 'orderNo',
            render: (v, p) => <Link to={`/order/${p.orderId}`}>{v}</Link>,
          },
          { title: 'Mode', dataIndex: 'mode', render: (m) => modeLabel[m] || m },
          { title: 'Reference', dataIndex: 'reference' },
          {
            title: 'Amount',
            dataIndex: 'amount',
            align: 'right',
            render: (v, p) =>
              p.status === 'RECEIVED' ? (
                inr(v)
              ) : (
                <Tooltip title={p.cancelReason}>
                  <Text delete type="secondary">
                    {inr(v)}
                  </Text>
                </Tooltip>
              ),
          },
          { title: 'Recorded by', dataIndex: 'recordedBy' },
        ]}
      />
    </>
  );
}

/** Accounts app: who owes what (with ageing), payments received, WhatsApp reminders. */
export default function AccountsPage() {
  const can = useCan();
  const [params, setParams] = useSearchParams();
  const tab = params.get('tab') || 'due';
  const [modal, setModal] = useState(null); // { orders, defaultOrderId }
  const canRecord = can('orders', 'edit');
  return (
    <div className="page-wrapper">
      <div className="content">
        <Title level={3} style={{ marginBottom: 0 }}>
          Accounts
        </Title>
        <Text type="secondary">Money due, payments received and GST invoices</Text>
        <Card style={{ marginTop: 16 }}>
          <Tabs
            activeKey={tab}
            onChange={(k) => setParams(k === 'due' ? {} : { tab: k })}
            items={[
              {
                key: 'due',
                label: 'Money due',
                children: (
                  <MoneyDue
                    onRecord={
                      canRecord
                        ? (orders, defaultOrderId) => setModal({ orders, defaultOrderId })
                        : null
                    }
                  />
                ),
              },
              { key: 'payments', label: 'Payments received', children: <Payments /> },
              { key: 'invoices', label: 'Tax invoices', children: <TaxInvoices /> },
            ]}
          />
        </Card>
      </div>
      <RecordPaymentModal
        open={!!modal}
        onClose={() => setModal(null)}
        orders={modal?.orders || []}
        defaultOrderId={modal?.defaultOrderId}
      />
    </div>
  );
}
