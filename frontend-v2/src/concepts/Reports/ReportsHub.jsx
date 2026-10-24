import './ReportsHub.styles.css';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Card, Col, DatePicker, Empty, InputNumber, List, Row, Segmented, Space, Statistic, Table, Typography } from 'antd';
import { toast } from 'sonner';
import { DownloadOutlined, FilePdfOutlined } from '@ant-design/icons';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as RTooltip,
  XAxis,
  YAxis,
} from 'recharts';
import dayjs from 'dayjs';
import * as XLSX from 'xlsx';
import { useGetReportListQuery, useRunReportQuery } from '../../api/dashboardApi';

const { Title, Text } = Typography;
const inr = (n) => `₹${Math.round(Number(n) || 0).toLocaleString('en-IN')}`;
const fmt = (v, type) => {
  if (v == null || v === '') return '—';
  if (type === 'money') return inr(v);
  if (type === 'percent')
    return `${Number(v).toLocaleString('en-IN', { maximumFractionDigits: 1 })}%`;
  if (type === 'number') return Number(v).toLocaleString('en-IN');
  if (type === 'date') return dayjs(v).format('D MMM YYYY');
  return String(v);
};
const PRESETS = [
  { label: 'This month', value: () => [dayjs().startOf('month'), dayjs()] },
  {
    label: 'Last month',
    value: () => [
      dayjs().subtract(1, 'month').startOf('month'),
      dayjs().subtract(1, 'month').endOf('month'),
    ],
  },
  {
    label: 'This quarter',
    value: () => [
      dayjs()
        .month(Math.floor(dayjs().month() / 3) * 3)
        .startOf('month'),
      dayjs(),
    ],
  },
  {
    label: 'This financial year',
    value: () => [
      dayjs().month() >= 3
        ? dayjs().month(3).startOf('month')
        : dayjs().subtract(1, 'year').month(3).startOf('month'),
      dayjs(),
    ],
  },
];
const NO_DATES = ['stock-value', 'dead-stock', 'reservation-age'];

/** Reports: pick one, set the dates, see it on screen, export to Excel. */
export default function ReportsHub() {
  const { data: list } = useGetReportListQuery();
  const reports = list?.data || [];
  const [key, setKey] = useState('sales-by-period');
  const [range, setRange] = useState(PRESETS[0].value());
  const [group, setGroup] = useState('month');
  const [days, setDays] = useState(90);
  const active = reports.find((r) => r.key === key) || reports[0];
  const params = {
    key: active?.key,
    from: range[0].format('YYYY-MM-DD'),
    to: range[1].format('YYYY-MM-DD'),
    ...(active?.key === 'sales-by-period' ? { group } : {}),
    ...(active?.key === 'dead-stock' ? { days } : {}),
  };
  const { data, isFetching, error } = useRunReportQuery(params, { skip: !active });

  const columns = useMemo(
    () =>
      (data?.columns || []).map((c) => ({
        title: c.title,
        dataIndex: c.key,
        key: c.key,
        align: ['money', 'number', 'percent'].includes(c.type) ? 'right' : 'left',
        sorter: (a, b) =>
          ['money', 'number', 'percent'].includes(c.type)
            ? (a[c.key] || 0) - (b[c.key] || 0)
            : String(a[c.key] || '').localeCompare(String(b[c.key] || '')),
        render: (v, r) =>
          c.type === 'link' && r[c.linkKey] ? (
            <Link to={`${c.linkTo}${r[c.linkKey]}`}>{v}</Link>
          ) : (
            fmt(v, c.type)
          ),
      })),
    [data],
  );

  const exportExcel = () => {
    if (!data?.rows?.length) return toast.info('Nothing to export');
    const rows = data.rows.map((r) =>
      Object.fromEntries(
        data.columns.map((c) => [
          c.title,
          c.type === 'date' && r[c.key] ? dayjs(r[c.key]).format('YYYY-MM-DD') : r[c.key],
        ]),
      ),
    );
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, data.title.slice(0, 30));
    XLSX.writeFile(wb, `${data.title} ${data.from} to ${data.to}.xlsx`);
  };

  const chartRows = data?.chart ? (data.rows || []).slice(0, data.chart.limit || 40) : [];
  const summary = data?.summary || {};

  return (
    <div className="page-wrapper">
      <div className="content">
        <div className="d-flex justify-content-between align-items-start flex-wrap gap-2">
          <div>
            <Title className="fv2-reportshub-4e5cc84964" level={3}>
              Reports
            </Title>
            <Text type="secondary">See any report on screen first, then export it.</Text>
          </div>
          <Link to="/reports/pdf">
            <Button icon={<FilePdfOutlined />}>Printable PDF reports</Button>
          </Link>
        </div>
        <Row className="fv2-reportshub-768efb6258" gutter={16}>
          <Col xs={24} lg={6}>
            <Card size="small" styles={{ body: { padding: 0 } }}>
              <List
                dataSource={reports}
                renderItem={(r) => (
                  <List.Item
                    className="fv2-reportshub-1670fefcad"
                    onClick={() => setKey(r.key)}
                    style={{
                      background: r.key === active?.key ? '#fff1f0' : undefined,
                      borderLeft:
                        r.key === active?.key ? '3px solid #e31e24' : '3px solid transparent',
                    }}
                  >
                    <List.Item.Meta
                      title={r.title}
                      description={
                        <span className="fv2-reportshub-62014547ed">{r.description}</span>
                      }
                    />
                  </List.Item>
                )}
              />
            </Card>
          </Col>
          <Col xs={24} lg={18}>
            <Card
              title={data?.title || active?.title}
              extra={
                <Button
                  icon={<DownloadOutlined />}
                  onClick={exportExcel}
                  disabled={!data?.rows?.length}
                >
                  Excel
                </Button>
              }
            >
              <Space wrap className="mb-3">
                {!NO_DATES.includes(active?.key) && (
                  <>
                    <DatePicker.RangePicker
                      value={range}
                      onChange={(v) => v && setRange(v)}
                      format="D MMM YYYY"
                      allowClear={false}
                    />
                    {PRESETS.map((p) => (
                      <Button key={p.label} size="small" onClick={() => setRange(p.value())}>
                        {p.label}
                      </Button>
                    ))}
                  </>
                )}
                {active?.key === 'sales-by-period' && (
                  <Segmented
                    value={group}
                    onChange={setGroup}
                    options={[
                      { value: 'day', label: 'Daily' },
                      { value: 'week', label: 'Weekly' },
                      { value: 'month', label: 'Monthly' },
                    ]}
                  />
                )}
                {active?.key === 'dead-stock' && (
                  <span>
                    No order in the last{' '}
                    <InputNumber
                      className="fv2-reportshub-e393d833ff"
                      min={15}
                      max={730}
                      value={days}
                      onChange={(v) => v && setDays(v)}
                    />{' '}
                    days
                  </span>
                )}
              </Space>
              {error && <Text type="danger">{error?.data?.message || 'Report failed'}</Text>}
              {Object.keys(summary).length > 0 && (
                <Row gutter={16} className="mb-3">
                  {summary.orderValue != null && (
                    <Col>
                      <Statistic title="Order value" value={inr(summary.orderValue)} />
                    </Col>
                  )}
                  {summary.orders != null && (
                    <Col>
                      <Statistic title="Orders" value={summary.orders} />
                    </Col>
                  )}
                  {summary.quotationValue != null && (
                    <Col>
                      <Statistic title="Quoted" value={inr(summary.quotationValue)} />
                    </Col>
                  )}
                  {summary.value != null && (
                    <Col>
                      <Statistic
                        title={
                          active?.key === 'stock-value' ? 'Stock value (selling price)' : 'Value'
                        }
                        value={inr(summary.value)}
                      />
                    </Col>
                  )}
                  {summary.products != null && (
                    <Col>
                      <Statistic title="Products" value={summary.products} />
                    </Col>
                  )}
                  {summary.missingPrice > 0 && (
                    <Col>
                      <Statistic
                        title="Without a selling price"
                        value={summary.missingPrice}
                        valueStyle={{ color: '#cf1322' }}
                      />
                    </Col>
                  )}
                </Row>
              )}
              {data?.chart && chartRows.length > 0 && (
                <div className="fv2-reportshub-ae307273b0">
                  <ResponsiveContainer>
                    <BarChart data={chartRows} margin={{ left: 10, right: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis
                        dataKey={data.chart.x}
                        tick={{ fontSize: 11 }}
                        interval={0}
                        angle={chartRows.length > 8 ? -30 : 0}
                        textAnchor={chartRows.length > 8 ? 'end' : 'middle'}
                        height={chartRows.length > 8 ? 70 : 30}
                      />
                      <YAxis
                        tickFormatter={(v) =>
                          v >= 100000
                            ? `${Math.round(v / 100000)}L`
                            : v >= 1000
                              ? `${Math.round(v / 1000)}k`
                              : v
                        }
                        tick={{ fontSize: 11 }}
                      />
                      <RTooltip formatter={(v) => inr(v)} />
                      {data.chart.y.map((y, i) => (
                        <Bar
                          key={y}
                          dataKey={y}
                          name={(data.columns.find((c) => c.key === y) || {}).title}
                          fill={i ? '#bfbfbf' : '#e31e24'}
                          radius={[3, 3, 0, 0]}
                        />
                      ))}
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
              <Table
                size="small"
                rowKey={(r, i) =>
                  r.productId ||
                  r.orderId ||
                  r.customerId ||
                  r.period ||
                  r.brand ||
                  r.person ||
                  r.reason ||
                  i
                }
                loading={isFetching}
                dataSource={data?.rows || []}
                columns={columns}
                scroll={{ x: 'max-content' }}
                pagination={{ pageSize: 50, showSizeChanger: false }}
                locale={{ emptyText: <Empty description="Nothing for this period" /> }}
              />
            </Card>
          </Col>
        </Row>
      </div>
    </div>
  );
}
