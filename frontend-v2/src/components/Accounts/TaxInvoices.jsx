import './TaxInvoices.styles.css';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Col, DatePicker, Input, Modal, Row, Select, Space, Statistic, Table, Tag, Tooltip, Typography } from 'antd';
import { toast } from 'sonner';
import { DownloadOutlined, FilePdfOutlined, StopOutlined, ExportOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useCancelInvoiceMutation, useGetInvoicesQuery } from '../../api/invoicesApi';
import useCan from '../../utils/useCan';
import { fetchFile } from './invoiceFiles';

const { Text } = Typography;
const inr = (n) =>
  `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

// Financial year that contains today: 1 Apr – 31 Mar
const fyStart = () => {
  const d = dayjs();
  return d.month() >= 3 ? d.month(3).date(1) : d.subtract(1, 'year').month(3).date(1);
};

/** Accounts → Tax invoices: the register, totals, PDFs, cancel, and exports for Tally / the accountant. */
export default function TaxInvoices() {
  const can = useCan();
  const [range, setRange] = useState([fyStart(), dayjs()]);
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const params = {
    from: range?.[0]?.format('YYYY-MM-DD'),
    to: range?.[1]?.format('YYYY-MM-DD'),
    status,
    search: search.trim(),
    page,
    limit: 50,
  };
  const { data, isFetching } = useGetInvoicesQuery(params);
  const [cancel] = useCancelInvoiceMutation();
  const [busy, setBusy] = useState(null);
  const t = data?.totals || {};

  const run = async (key, fn) => {
    setBusy(key);
    try {
      await fn();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusy(null);
    }
  };

  const doCancel = (inv) => {
    let reason = '';
    Modal.confirm({
      title: `Cancel invoice ${inv.invoiceNo}?`,
      content: (
        <div>
          <p className="mb-2">
            The number stays used (GST rules); its pieces can be invoiced again. File a credit note
            instead if the goods were already delivered and returned.
          </p>
          <Input.TextArea
            rows={2}
            placeholder="Reason (e.g. wrong customer GSTIN)"
            onChange={(e) => (reason = e.target.value)}
          />
        </div>
      ),
      okText: 'Cancel invoice',
      okButtonProps: { danger: true },
      zIndex: 2000,
      onOk: async () => {
        if (!reason.trim()) {
          toast.error('A reason is required');
          throw new Error('reason');
        }
        try {
          await cancel({ id: inv.id, reason }).unwrap();
          toast.success(`${inv.invoiceNo} cancelled`);
        } catch (e) {
          toast.error(e?.data?.message || 'Could not cancel');
        }
      },
    });
  };

  const q = `from=${params.from}&to=${params.to}`;

  return (
    <>
      <Row gutter={[16, 16]} className="mb-3">
        <Col xs={12} md={4}>
          <Statistic title="Invoices" value={t.count || 0} />
        </Col>
        <Col xs={12} md={5}>
          <Statistic title="Taxable value" value={inr(t.taxable)} />
        </Col>
        <Col xs={12} md={5}>
          <Statistic title="CGST + SGST" value={inr((t.cgst || 0) + (t.sgst || 0))} />
        </Col>
        <Col xs={12} md={4}>
          <Statistic title="IGST" value={inr(t.igst)} />
        </Col>
        <Col xs={24} md={6}>
          <Statistic title="Invoiced total" value={inr(t.total)} />
        </Col>
      </Row>
      <div className="d-flex flex-wrap gap-2 mb-3 align-items-center">
        <DatePicker.RangePicker
          value={range}
          onChange={(v) => {
            setRange(v);
            setPage(1);
          }}
          format="D MMM YYYY"
          allowClear={false}
        />
        <Select
          className="fv2-taxinvoices-f8f4c73be1"
          value={status}
          onChange={(v) => {
            setStatus(v);
            setPage(1);
          }}

          options={[
            { value: '', label: 'All' },
            { value: 'ISSUED', label: 'Issued' },
            { value: 'CANCELLED', label: 'Cancelled' },
          ]}
        />
        <Input.Search
          className="fv2-taxinvoices-4c95cbaf80"
          placeholder="Invoice no., customer, GSTIN, order"
          allowClear
          onSearch={(v) => {
            setSearch(v);
            setPage(1);
          }}
        />
        <div className="ms-auto d-flex gap-2">
          <Tooltip title="Sales and receipt vouchers for Tally (Gateway → Import → Vouchers)">
            <Button
              icon={<ExportOutlined />}
              loading={busy === 'tally'}
              onClick={() =>
                run('tally', () =>
                  fetchFile(`/invoices/export/tally?${q}`, { fallbackName: 'Tally-vouchers.xml' }),
                )
              }
            >
              Tally XML
            </Button>
          </Tooltip>
          <Tooltip title="Invoice register (CSV) for the accountant / GSTR-1">
            <Button
              icon={<DownloadOutlined />}
              loading={busy === 'csv'}
              onClick={() =>
                run('csv', () =>
                  fetchFile(`/invoices/export/register?${q}`, {
                    fallbackName: 'Invoice-register.csv',
                  }),
                )
              }
            >
              Register CSV
            </Button>
          </Tooltip>
        </div>
      </div>
      <Table
        rowKey="id"
        size="middle"
        loading={isFetching}
        dataSource={data?.data || []}
        scroll={{ x: 1000 }}
        locale={{
          emptyText: 'No invoices in this period. Make one from an order or while dispatching.',
        }}
        pagination={{
          current: page,
          pageSize: 50,
          total: data?.pagination?.total || 0,
          onChange: setPage,
          showSizeChanger: false,
        }}
        columns={[
          {
            title: 'Invoice',
            dataIndex: 'invoiceNo',
            render: (v, r) => (
              <Space size={4}>
                <Text strong={r.status === 'ISSUED'} delete={r.status === 'CANCELLED'}>
                  {v}
                </Text>
                {r.status === 'CANCELLED' && (
                  <Tooltip title={r.cancelReason}>
                    <Tag color="red">Cancelled</Tag>
                  </Tooltip>
                )}
              </Space>
            ),
          },
          { title: 'Date', dataIndex: 'invoiceDate', render: (d) => dayjs(d).format('D MMM YYYY') },
          {
            title: 'Customer',
            dataIndex: 'customerName',
            render: (v, r) => (
              <div>
                {r.customerId ? <Link to={`/customer/${r.customerId}`}>{v}</Link> : v}
                <div>
                  <Text className="fv2-taxinvoices-0428d6290f" type="secondary">
                    {r.customerGstin || 'Unregistered (B2C)'}
                  </Text>
                </div>
              </div>
            ),
          },
          {
            title: 'Order',
            dataIndex: 'orderNo',
            render: (v, r) => <Link to={`/order/${r.orderId}`}>#{v}</Link>,
          },
          { title: 'Taxable', dataIndex: 'taxableValue', align: 'right', render: inr },
          {
            title: 'GST',
            key: 'gst',
            align: 'right',
            render: (_, r) => (
              <Tooltip
                title={
                  r.interState
                    ? `IGST ${r.gstRate}%`
                    : `CGST ${r.gstRate / 2}% + SGST ${r.gstRate / 2}%`
                }
              >
                {inr(r.cgst + r.sgst + r.igst)}
              </Tooltip>
            ),
          },
          {
            title: 'Total',
            dataIndex: 'total',
            align: 'right',
            render: (v) => <Text strong>{inr(v)}</Text>,
          },
          {
            title: '',
            key: 'actions',
            fixed: 'right',
            width: 100,
            render: (_, r) => (
              <Space size={2}>
                <Tooltip title="Open PDF">
                  <Button
                    type="text"
                    icon={<FilePdfOutlined className="fv2-taxinvoices-f1f9e5aaa5" />}
                    loading={busy === r.id}
                    onClick={() =>
                      run(r.id, () => fetchFile(`/invoices/${r.id}/pdf`, { open: true }))
                    }
                  />
                </Tooltip>
                {r.status === 'ISSUED' && can('orders', 'edit') && (
                  <Tooltip title="Cancel invoice">
                    <Button
                      type="text"
                      danger
                      icon={<StopOutlined />}
                      onClick={() => doCancel(r)}
                    />
                  </Tooltip>
                )}
              </Space>
            ),
          },
        ]}
      />
    </>
  );
}
