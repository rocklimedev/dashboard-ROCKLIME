import ModalShell from '../Common/ModalShell';
import './QuotationPicker.styles.css';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { Alert, Button, Input, List, Pagination, Segmented, Space, Typography } from 'antd';
import { toast } from 'sonner';
import { FileTextOutlined, ArrowRightOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { quotationApi, useGetAllQuotationsQuery } from '../../api/quotationApi';
import { orderStateFromQuotation } from '../Quotation/convertToOrder';
import { QuotationStatusTag } from '../Quotation/QuotationPipeline';

const { Text } = Typography;
const inr = (n) => `₹${Math.round(Number(n) || 0).toLocaleString('en-IN')}`;
const OPEN = 'DRAFT,SENT,NEGOTIATION';

/** List of quotations to turn into an order: search, pick, the order form opens filled in. */
export function QuotationPickList({ onPicked }) {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [search, setSearch] = useState('');
  const [q, setQ] = useState('');
  const [which, setWhich] = useState(OPEN);
  const [page, setPage] = useState(1);
  const pageSize = 6;
  const [busy, setBusy] = useState(null);
  useEffect(() => {
    const t = setTimeout(() => {
      setQ(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [search]);
  const {
    currentData: data,
    isFetching,
    error,
    refetch,
  } = useGetAllQuotationsQuery({ search: q, status: which || undefined, page, limit: pageSize });
  const rows = data?.data || [];

  const convert = async (row) => {
    if (busy || isFetching || row.status === 'WON') return;
    setBusy(row.quotationId);
    try {
      const full = await dispatch(
        quotationApi.endpoints.getQuotationById.initiate(row.quotationId, { forceRefetch: true }),
      ).unwrap();
      onPicked?.();
      navigate('/order/add', { state: orderStateFromQuotation(full) });
    } catch (e) {
      toast.error(e?.data?.message || 'Could not open the quotation');
    } finally {
      setBusy(null);
    }
  };

  return (
    <Space className="fv2-quotationpicker-8bc712a529" direction="vertical" size={12}>
      <Space className="fv2-quotationpicker-fb7e537a8b" wrap>
        <Input.Search
          className="fv2-quotationpicker-3cbd5cf654"
          autoFocus
          allowClear
          placeholder="Quotation no., customer, phone or title"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Segmented
          value={which}
          onChange={(value) => {
            setWhich(value);
            setPage(1);
          }}
          options={[
            { value: OPEN, label: 'Open' },
            { value: 'SENT', label: 'Sent' },
            { value: 'NEGOTIATION', label: 'Negotiation' },
            { value: '', label: 'All' },
          ]}
        />
      </Space>
      <div className="fv2-quotationpicker-fac570ba74">
        {error ? (
          <Alert
            type="error"
            showIcon
            message="Could not load quotations"
            action={<Button onClick={refetch}>Retry</Button>}
          />
        ) : (
          <List
            loading={isFetching}
            dataSource={rows}
            locale={{ emptyText: q ? 'No quotation matches' : 'No open quotations' }}
            renderItem={(r) => (
              <List.Item
                className="fv2-quotationpicker-74d5ad6711"

                onClick={() => convert(r)}
                actions={[
                  <Button
                    key="go"
                    type="primary"
                    size="small"
                    loading={busy === r.quotationId}
                    icon={<ArrowRightOutlined />}
                    disabled={r.status === 'WON'}
                  >
                    Make order
                  </Button>,
                ]}
              >
                <List.Item.Meta
                  avatar={<FileTextOutlined className="fv2-quotationpicker-279c665455" />}
                  title={
                    <Space size={8} wrap>
                      <Text strong>{r.reference_number}</Text>
                      <Text>{r.customerName || r.customer?.name || '—'}</Text>
                      <QuotationStatusTag status={r.status} lostReason={r.lostReason} />
                    </Space>
                  }
                  description={
                    <Text type="secondary">
                      {[
                        inr(r.finalAmount),
                        r.document_title,
                        r.quotation_date ? dayjs(r.quotation_date).format('D MMM YYYY') : null,
                      ]
                        .filter(Boolean)
                        .join(' · ')}
                    </Text>
                  }
                />
              </List.Item>
            )}
          />
        )}
      </div>
      <Pagination
        size="small"
        current={page}
        pageSize={pageSize}
        total={data?.pagination?.total || 0}
        onChange={setPage}
        showSizeChanger={false}
        showTotal={(total) => `${total} quotations`}
        disabled={isFetching || !!busy}
        responsive
      />
    </Space>
  );
}

/** "New order" dialog: start from a quotation (one click) or a blank cart. */
export default function NewOrderModal({ open, onClose }) {
  const navigate = useNavigate();
  return (
    <ModalShell
      open={open}
      onCancel={onClose}
      width={760}
      title="New order"
      footer={null}
      destroyOnClose
    >
      <div className="fv2-quotationpicker-3c2182b967">
        <Button
          onClick={() => {
            onClose?.();
            navigate('/cart/order');
          }}
        >
          Start without a quotation
        </Button>
      </div>
      <Text className="fv2-quotationpicker-f1abcbada3" type="secondary">
        Pick the quotation the customer agreed to. The order opens with its products, prices,
        discounts and GST.
      </Text>
      <QuotationPickList onPicked={onClose} />
    </ModalShell>
  );
}
