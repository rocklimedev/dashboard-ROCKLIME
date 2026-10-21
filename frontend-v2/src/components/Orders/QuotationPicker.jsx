import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import {
  Alert,
  Button,
  Input,
  List,
  Modal,
  Pagination,
  Segmented,
  Space,
  Typography,
  message,
} from 'antd';
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
      message.error(e?.data?.message || 'Could not open the quotation');
    } finally {
      setBusy(null);
    }
  };

  return (
    <Space direction="vertical" size={12} style={{ width: '100%' }}>
      <Space wrap style={{ width: '100%', justifyContent: 'space-between' }}>
        <Input.Search
          autoFocus
          allowClear
          placeholder="Quotation no., customer, phone or title"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ width: 340, maxWidth: '100%' }}
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
      <div style={{ height: 'min(400px, 45vh)', overflowY: 'auto', overflowX: 'hidden' }}>
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
                style={{ cursor: 'pointer', padding: '10px 8px', borderRadius: 8 }}
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
                  avatar={
                    <FileTextOutlined style={{ fontSize: 22, color: '#d4380d', marginTop: 4 }} />
                  }
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
    <Modal
      open={open}
      onCancel={onClose}
      width={760}
      title="New order"
      footer={null}
      destroyOnClose
    >
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
        <Button
          onClick={() => {
            onClose?.();
            navigate('/cart/order');
          }}
        >
          Start without a quotation
        </Button>
      </div>
      <Text type="secondary" style={{ display: 'block', marginBottom: 12 }}>
        Pick the quotation the customer agreed to. The order opens with its products, prices,
        discounts and GST.
      </Text>
      <QuotationPickList onPicked={onClose} />
    </Modal>
  );
}
