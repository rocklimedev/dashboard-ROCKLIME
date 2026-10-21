import { useCallback, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Alert, Button, Card, Descriptions, Space, Spin, Tag, Typography, message } from 'antd';
import { ArrowLeftOutlined, FileExcelFilled } from '@ant-design/icons';
import { useGetDispatchDetailsQuery } from '../../api/quotationApi';
import QuotationPdfActions from '../../components/Quotation/QuotationPdfActions';
import QuotationPdfFrame from '../../components/Quotation/QuotationPdfFrame';
import DocumentExportOptions from '../../components/Quotation/DocumentExportOptions';
import { exportToExcel } from '../../components/Quotation/hooks/exportHelpers';
import { quotationTotals } from '../../utils/quotationMath';
import MarkDeliveredModal from '../../components/Orders/MarkDeliveredModal';
import useCan from '../../utils/useCan';
import logo from '../../assets/img/logo-quotation.png';
const { Title, Text } = Typography;
export default function DispatchDetails() {
  const { dispatchId } = useParams();
  const navigate = useNavigate();
  const can = useCan();
  const [deliveryOpen, setDeliveryOpen] = useState(false);
  const { data, isLoading, error } = useGetDispatchDetailsQuery(dispatchId);
  const [style, setStyle] = useState('detailed');
  const cover = false;
  const setCover = () => {};
  const [exportOptions, setExportOptions] = useState({ hidden: [] });
  const [pages, setPages] = useState([]),
    [pageOrder, setPageOrder] = useState(null);
  const [exporting, setExporting] = useState(false);
  const onPagesChange = useCallback(
    (next) =>
      setPages((previous) => (JSON.stringify(previous) === JSON.stringify(next) ? previous : next)),
    [],
  );
  const resetPages = () => {
    setPages([]);
    setPageOrder(null);
  };
  if (isLoading) return <Spin size="large" style={{ display: 'block', marginTop: 100 }} />;
  if (error || !data)
    return (
      <Alert
        type="error"
        showIcon
        message="Could not load dispatch"
        description={error?.data?.message}
      />
    );
  const { dispatch, document: doc } = data;
  const q = doc.quotation,
    source = dispatch.quotationRef || dispatch.orderNo;
  const resourcePath = '/order/dispatch/' + dispatchId;
  const excel = async () => {
    setExporting(true);
    try {
      const state = (doc.shipTo || doc.billing)?.state;
      const normalize = (value) =>
        String(value || '')
          .trim()
          .toLowerCase();
      const totals = quotationTotals({
        ...q,
        items: doc.items,
        shipping: q.shippingAmount,
        gstRate: q.gst,
        interState: Boolean(
          state && doc.companyState && normalize(state) !== normalize(doc.companyState),
        ),
      });
      await exportToExcel({
        products: doc.items,
        quotation: q,
        customerName: doc.customer?.displayName || doc.customer?.name || 'Dear Client',
        address: [
          doc.shipTo?.street || doc.billing?.street,
          doc.shipTo?.city || doc.billing?.city,
          doc.shipTo?.state || doc.billing?.state,
        ]
          .filter(Boolean)
          .join(', '),
        logo,
        id: dispatchId,
        exportOptions,
        documentLabel: 'Dispatch',
        documentTotals: totals,
      });
    } catch {
      message.error('Could not export dispatch Excel');
    } finally {
      setExporting(false);
    }
  };
  return (
    <div className="page-wrapper">
      <div className="content">
        <MarkDeliveredModal
          orderId={dispatch.orderId}
          dispatch={dispatch}
          open={deliveryOpen}
          onClose={() => setDeliveryOpen(false)}
        />
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 12,
            }}
          >
            <div>
              <Title level={3} style={{ margin: 0 }}>
                Dispatch {q.reference_number}
              </Title>
              <Text type="secondary">
                {doc.customer?.name} · {dispatch.totalQuantity} units
              </Text>{' '}
              <Tag color={dispatch.status === 'DELIVERED' ? 'green' : 'blue'}>
                {dispatch.status}
              </Tag>
            </div>
            <Space wrap>
              {dispatch.status === 'DISPATCHED' &&
                can(dispatch.orderId ? 'orders' : 'quotations', 'edit') && (
                  <Button onClick={() => setDeliveryOpen(true)}>Mark delivered</Button>
                )}
              <DocumentExportOptions
                exportOptions={exportOptions}
                setExportOptions={(value) => {
                  setExportOptions(value);
                  resetPages();
                }}
                pages={pages}
                pageOrder={pageOrder}
                setPageOrder={setPageOrder}
                setPdfCover={setCover}
                documentLabel="dispatch"
              />
              <QuotationPdfActions
                quotationId={dispatchId}
                resourcePath={resourcePath}
                documentLabel="Dispatch"
                style={style}
                onStyleChange={(value) => {
                  setStyle(value);
                  resetPages();
                }}
                cover={cover}
                showCoverOption={false}
                exportOptions={exportOptions}
                pageOrder={pageOrder}
                showPreview={false}
              />
              <Button icon={<FileExcelFilled />} loading={exporting} onClick={excel}>
                Excel
              </Button>
              <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/orders/dispatch/all')}>
                Dispatch history
              </Button>
            </Space>
          </div>
          <Card size="small">
            <Descriptions
              size="small"
              column={{ xs: 1, sm: 2, lg: 4 }}
              items={[
                {
                  key: 'source',
                  label: 'Source',
                  children: dispatch.orderId ? (
                    <Link to={'/order/' + dispatch.orderId}>Order {dispatch.orderNo}</Link>
                  ) : (
                    <Link to={'/quotation/' + dispatch.quotationId}>Quotation {source}</Link>
                  ),
                },
                {
                  key: 'date',
                  label: 'Dispatched',
                  children: new Date(dispatch.dispatchDate).toLocaleString('en-IN'),
                },
                { key: 'vehicle', label: 'Vehicle', children: dispatch.vehicleNo || '—' },
                {
                  key: 'driver',
                  label: 'Driver',
                  children:
                    [dispatch.driverName, dispatch.driverPhone].filter(Boolean).join(' · ') || '—',
                },
                {
                  key: 'carrier',
                  label: 'Carrier',
                  children: dispatch.carrier || dispatch.transporter || '—',
                },
                {
                  key: 'lr',
                  label: 'LR / Tracking',
                  children: dispatch.trackingNumber || dispatch.lrNumber || '—',
                },
                { key: 'eway', label: 'E-way bill', children: dispatch.ewayBillNo || '—' },
                { key: 'remarks', label: 'Remarks', children: dispatch.remarks || '—' },
              ]}
            />
          </Card>
          <QuotationPdfFrame
            quotationId={dispatchId}
            resourcePath={resourcePath}
            documentLabel="Dispatch"
            style={style}
            cover={cover}
            exportOptions={exportOptions}
            pageOrder={pageOrder}
            onPagesChange={onPagesChange}
            refreshKey={dispatch.updatedAt}
          />
        </Space>
      </div>
    </div>
  );
}
