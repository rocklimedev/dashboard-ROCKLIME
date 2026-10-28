import Loader from '../../components/Common/Loader';
import ModalShell from '../../components/Common/ModalShell';
import './NewQuotationDetails.styles.css';
// Quotation page: status and follow-ups at the top, then the quotation itself,
// shown as the same PDF the customer receives (the Chhabra Marble format).
import { useCallback, useEffect, useRef, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Space, Typography, Alert, Select, Tag, Checkbox, Table } from 'antd';
import { toast } from 'sonner';
import { ArrowLeftOutlined, FileExcelFilled } from '@ant-design/icons';
import { Helmet } from 'react-helmet';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

import QuotationExportOrganizer from '../../components/Quotation/QuotationExportOrganizer';
import { API_URL } from '../../store/config';
import { token, downloadQuotationPdf } from '../../components/Quotation/quotationPdf';
import DocumentExportOptions from '../../components/Quotation/DocumentExportOptions';
import QuotationDispatchModal from '../../components/Orders/QuotationDispatchModal';
import {
  useGetQuotationByIdQuery,
  useGetQuotationVersionsQuery,
  useCloneQuotationMutation,
  useGetQuotationDispatchesQuery,
} from '../../api/quotationApi';
import { useGetCustomerByIdQuery } from '../../api/customerApi';
import { useGetAddressByIdQuery } from '../../api/addressApi';
import {
  buildQuotationWorkbook,
  quotationSheets,
  hasRoomAssignments,
  addQuotationImages,
} from '../../components/Quotation/hooks/quotationWorkbook';
import { getSafeTitle } from '../../components/Quotation/hooks/exportHelpers';
import QuotationPdfActions from '../../components/Quotation/QuotationPdfActions';
import QuotationPdfFrame from '../../components/Quotation/QuotationPdfFrame';
import { QuotationPipelineBar } from '../../components/Quotation/QuotationPipeline';
import { orderStateFromQuotation } from '../../components/Quotation/convertToOrder';
import useCan from '../../utils/useCan';

dayjs.extend(relativeTime);
const { Title, Text } = Typography;

const asList = (data) => {
  let v = data;
  for (let i = 0; i < 3 && typeof v === 'string'; i++) {
    try {
      v = JSON.parse(v);
    } catch {
      return [];
    }
  }
  return Array.isArray(v) ? v : [];
};
const titleFor = (gender) => ({ male: 'Mr.', female: 'Ms.' })[(gender || '').toLowerCase()] || '';

export default function NewQuotationsDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const can = useCan();
  const [dispatchOpen, setDispatchOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [excelOpen, setExcelOpen] = useState(false);
  const [selectedSheets, setSelectedSheets] = useState([]);
  const [version, setVersion] = useState('current');
  const [pdfStyle, setPdfStyle] = useState('detailed');
  const [pdfCover, setPdfCover] = useState(true);
  const [exportOptions, setExportOptions] = useState({ hidden: [] });
  const [organizerOpen, setOrganizerOpen] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const pendingLabels = useRef(null);
  const [pages, setPages] = useState([]);
  const [pageOrder, setPageOrder] = useState(null);
  useEffect(() => {
    let cancelled = false;
    pendingLabels.current = null;
    setPageOrder(null);
    setPages([]);
    fetch(API_URL + '/quotation/' + id + '/export-settings?version=' + version, { headers: { Authorization: 'Bearer ' + token() } })
      .then(async response => {
        if (!response.ok) throw new Error('Could not load saved export settings');
        return response.json();
      }).then(({ settings }) => {
        if (cancelled) return;
        setPdfStyle(settings?.style || 'detailed');
        setPdfCover(settings?.cover ?? true);
        setExportOptions({ hidden: settings?.hidden || [] });
        pendingLabels.current = settings?.pageLabels || null;
      }).catch(error => { if (!cancelled) toast.error(error.message); });
    return () => { cancelled = true; };
  }, [id, version]);
  const onPagesChange = useCallback(
    (next) => {
      setPages((previous) => (JSON.stringify(previous) === JSON.stringify(next) ? previous : next));
      if (pendingLabels.current && next.length) {
        const roomLabels = [...new Set(pendingLabels.current.map(label => label.replace(/ \(continued \d+\)$/, '')))];
        const restored = roomLabels.flatMap(label => next.filter(page => page.label.replace(/ \(continued \d+\)$/, '') === label).map(page => page.id));
        setPageOrder(restored.length ? restored : null);
        pendingLabels.current = null;
      }
    },
    [],
  );
  const resetPages = () => {
    setPageOrder(null);
    setPages([]);
  };
  const [isExporting, setIsExporting] = useState(false);

  const {
    data: quotation,
    isLoading: qLoading,
    error: qError,
  } = useGetQuotationByIdQuery(id, {
    refetchOnMountOrArgChange: true,
  });
  const { data: versionsData } = useGetQuotationVersionsQuery(id);
  const { data: dispatchData, isFetching: dispatchLoading } = useGetQuotationDispatchesQuery(id);
  const fullyDispatched = dispatchData?.fullyDispatched === true;
  const linkedOrder = dispatchData?.orders?.[0];
  const [cloneQuotation] = useCloneQuotationMutation();

  // saved versions, newest first; "current" is the live quotation
  const versions = useMemo(
    () =>
      (Array.isArray(versionsData) ? [...versionsData] : []).sort(
        (a, b) => (b.version || 0) - (a.version || 0),
      ),
    [versionsData],
  );
  const versionObj = versions.find((v) => v.version === version);
  const shown = versionObj?.quotationData
    ? { ...quotation, ...versionObj.quotationData }
    : quotation || {};
  const items = versionObj
    ? asList(versionObj.quotationData?.products ?? versionObj.quotationItems)
    : asList(quotation?.products || quotation?.items);

  const { data: customerResponse } = useGetCustomerByIdQuery(shown.customerId, {
    skip: !shown.customerId,
  });
  const { data: addressResponse } = useGetAddressByIdQuery(shown.shipTo, { skip: !shown.shipTo });
  const customer = customerResponse?.data;
  const address = addressResponse || {};
  const customerName = customer?.name
    ? customer.displayName ||
      `${customer.title || titleFor(customer.gender)} ${customer.name}`.trim()
    : '';
  const excelProducts = useMemo(
    () => [...items].sort((a, b) => Number(a.priority ?? 9999) - Number(b.priority ?? 9999)),
    [items],
  );
  const sheetOptions = useMemo(() => quotationSheets(excelProducts, shown), [excelProducts, shown]);

  const handleExcel = async () => {
    setIsExporting(true);
    try {
      const workbook = buildQuotationWorkbook({
        products: excelProducts,
        customerName: customerName || 'Dear Client',
        quotation: shown,
        address:
          [address.street, address.city, address.state].filter(Boolean).join(', ') +
          (address.postalCode ? ` - ${address.postalCode}` : ''),
        activeVersion: version,
        selectedSheets,
      });
      await addQuotationImages(workbook, {
        products: excelProducts,
        quotation: shown,
        selectedSheets,
      });
      const buffer = await workbook.xlsx.writeBuffer();
      const url = URL.createObjectURL(
        new Blob([buffer], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        }),
      );
      const link = document.createElement('a');
      link.href = url;
      link.download = `${getSafeTitle(shown)}_V${version}.xlsx`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setExcelOpen(false);
      toast.success('Excel exported');
    } catch (error) {
      toast.error(error.message || 'Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  if (qLoading) return <Loader className="fv2-newquotationdetails-b691cb8489" size="large" />;
  if (qError || !quotation)
    return (
      <Alert
        className="fv2-newquotationdetails-034131c424"
        message="Quotation not found"
        type="error"
        showIcon
      />
    );

  const pdfVersion = version !== 'current' ? version : null;

  return (
    <>
      <QuotationExportOrganizer open={organizerOpen} onClose={() => setOrganizerOpen(false)} pages={pages} floors={asList(shown.floors)}
        pageOrder={pageOrder} setPageOrder={setPageOrder} saving={savingSettings} downloading={downloading}
        onSave={async () => {
          setSavingSettings(true);
          try {
            const response = await fetch(API_URL + '/quotation/' + id + '/export-settings?version=' + version, {
              method: 'PUT', headers: { Authorization: 'Bearer ' + token(), 'Content-Type': 'application/json' },
              body: JSON.stringify({ style: pdfStyle, cover: pdfCover, hidden: exportOptions.hidden,
                pageLabels: pageOrder ? [...new Set(pageOrder.map(pageId => pages.find(p => p.id === pageId)?.label.replace(/ \(continued \d+\)$/, '')).filter(Boolean))] : null }) });
            if (!response.ok) throw new Error((await response.json()).message || 'Could not save settings');
            toast.success('Export settings saved');
          } catch (error) { toast.error(error.message); }
          finally { setSavingSettings(false); }
        }}
        onDownload={async () => {
          setDownloading(true);
          try { await downloadQuotationPdf(id, { version: pdfVersion, style: pdfStyle, cover: pdfCover, exportOptions, pageOrder }); }
          catch (error) { toast.error(error.message); }
          finally { setDownloading(false); }
        }} />
      <QuotationDispatchModal
        open={dispatchOpen}
        quotation={quotation}
        onClose={() => setDispatchOpen(false)}
        onSuccess={(result) => navigate(`/dispatch/${result.dispatch.id}`)}
      />
      <ModalShell
        title="Dispatch history"
        open={historyOpen}
        onCancel={() => setHistoryOpen(false)}
        footer={null}
        width={1100}
      >
        <Table
          rowKey="id"
          loading={dispatchLoading}
          dataSource={dispatchData?.dispatches || []}
          scroll={{ x: 950 }}
          expandable={{
            expandedRowRender: (dispatch) => (
              <Table
                rowKey={(_, index) => index}
                pagination={false}
                dataSource={asList(dispatch.items)}
                columns={[
                  { title: 'Product', dataIndex: 'name' },
                  {
                    title: 'Code',
                    render: (_, item) => item.companyCode || item.productCode || '—',
                  },
                  { title: 'Quantity', dataIndex: 'quantity' },
                ]}
              />
            ),
          }}
          columns={[
            {
              title: 'Dispatch',
              render: (_, dispatch) => (
                <Button type="link" onClick={() => navigate(`/dispatch/${dispatch.id}`)}>
                  #{dispatch.dispatchNumber || dispatch.id.slice(0, 8)}
                </Button>
              ),
            },
            {
              title: 'Date',
              render: (_, dispatch) =>
                dispatch.dispatchDate || dispatch.createdAt
                  ? dayjs(dispatch.dispatchDate || dispatch.createdAt).format(
                      'DD MMM YYYY, hh:mm A',
                    )
                  : '—',
            },
            { title: 'Status', dataIndex: 'status', render: (status) => <Tag>{status}</Tag> },
            {
              title: 'Quantity',
              render: (_, dispatch) =>
                dispatch.totalQuantity ??
                asList(dispatch.items).reduce((sum, item) => sum + Number(item.quantity || 0), 0),
            },
            { title: 'Carrier', dataIndex: 'carrier' },
            { title: 'Tracking', dataIndex: 'trackingNumber' },
            { title: 'Remarks', dataIndex: 'remarks' },
          ]}
        />
      </ModalShell>
      <ModalShell
        title="Excel export — choose sheets"
        open={excelOpen}
        onCancel={() => setExcelOpen(false)}
        onOk={handleExcel}
        okText="Export Excel"
        confirmLoading={isExporting}
        okButtonProps={{ disabled: !selectedSheets.length }}
      >
        <Alert
          className="fv2-newquotationdetails-6a5f0c52a3"
          type="info"
          showIcon
          message="Excel includes all pricing fields and optional products. PDF field and page selections apply only to PDF. Summary totals always cover the complete quotation."
        />
        <Space className="fv2-newquotationdetails-caa6819e4f">
          <Button onClick={() => setSelectedSheets(sheetOptions.map((sheet) => sheet.id))}>
            Select all
          </Button>
          <Button onClick={() => setSelectedSheets([])}>Clear</Button>
        </Space>
        <div className="fv2-newquotationdetails-1d6a626679">
          <Checkbox.Group
            className="fv2-newquotationdetails-bb1199e2be"
            value={selectedSheets}
            onChange={setSelectedSheets}

            options={sheetOptions.map((sheet) => ({ value: sheet.id, label: sheet.label }))}
          />
        </div>
      </ModalShell>
      <Helmet>
        <title>
          {quotation.reference_number || 'Quotation'} ·{' '}
          {customerName || quotation.document_title || ''}
        </title>
      </Helmet>
      <div className="page-wrapper">
        <div className="content fv2-newquotationdetails-f2a8198e56">
          <div className="fv2-newquotationdetails-2d87874176">
            <div className="fv2-newquotationdetails-0d7e32a54b">
              <div className="fv2-newquotationdetails-6126d9a4bf">
                <Space size={8} align="center">
                  <Title className="fv2-newquotationdetails-6f0ddb7585" level={4}>
                    {quotation.reference_number || 'Quotation'}
                  </Title>
                  {version !== 'current' && <Tag color="blue">Version {version}</Tag>}
                </Space>
                <div className="fv2-newquotationdetails-36c4f5bf8d">
                  <Text type="secondary">
                    {[customerName, quotation.document_title].filter(Boolean).join(' · ') ||
                      'No customer'}
                  </Text>
                </div>
              </div>
              <Space size={10} wrap align="center">
                {fullyDispatched && linkedOrder ? (
                  <Button type="primary" onClick={() => navigate(`/order/${linkedOrder.id}`)}>
                    View order #{linkedOrder.orderNo}
                  </Button>
                ) : (
                  !fullyDispatched &&
                  can('quotations', 'write') &&
                  can('orders', 'view') &&
                  can('orders', 'write') && (
                    <Button
                      type="primary"
                      disabled={version !== 'current' || dispatchLoading}
                      onClick={() => setDispatchOpen(true)}
                    >
                      Dispatch products
                    </Button>
                  )
                )}
                {dispatchData?.dispatches?.length > 0 && can('orders', 'view') && (
                  <Button onClick={() => setHistoryOpen(true)}>Dispatch history</Button>
                )}
                {versions.length > 0 && (
                  <Select
                    className="fv2-newquotationdetails-2a07d0e50d"
                    value={version}
                    onChange={(value) => {
                      setVersion(value);
                      resetPages();
                    }}

                    options={[
                      { value: 'current', label: 'Current version' },
                      ...versions.map((v) => ({
                        value: v.version,
                        label: `Version ${v.version}${v.updatedAt ? ` · ${dayjs(v.updatedAt).fromNow()}` : ''}`,
                      })),
                    ]}
                  />
                )}
                <DocumentExportOptions onExpand={() => setOrganizerOpen(true)}
                  pdfOnly
                  hasRooms={hasRoomAssignments(items)}
                  exportOptions={exportOptions}
                  setExportOptions={setExportOptions}
                  pages={pages}
                  pageOrder={pageOrder}
                  setPageOrder={setPageOrder}
                  setPdfCover={setPdfCover}
                />
                <QuotationPdfActions
                  quotationId={id}
                  version={pdfVersion}
                  style={pdfStyle}
                  onStyleChange={(value) => {
                    setPdfStyle(value);
                    resetPages();
                  }}
                  cover={pdfCover}
                  onCoverChange={(value) => {
                    setPdfCover(value);
                    resetPages();
                  }}
                  exportOptions={exportOptions}
                  pageOrder={pageOrder}
                  showPreview={false}
                />
                <Button
                  loading={isExporting}
                  onClick={() => {
                    setSelectedSheets(sheetOptions.map((sheet) => sheet.id));
                    setExcelOpen(true);
                  }}
                  icon={<FileExcelFilled />}
                >
                  Excel
                </Button>
                <Button onClick={() => navigate('/quotations/list')} icon={<ArrowLeftOutlined />}>
                  Back
                </Button>
              </Space>
            </div>
          </div>

          <div className="fv2-newquotationdetails-b3997f85e7">
            <QuotationPipelineBar
              quotation={quotation}
              canEdit={can('quotations', 'edit')}
              canConvert={
                !fullyDispatched &&
                !linkedOrder &&
                !dispatchLoading &&
                can('orders', 'view') &&
                can('orders', 'write')
              }
              onConvert={() =>
                navigate('/order/add', { state: orderStateFromQuotation(quotation) })
              }
              onEdit={() => navigate(`/quotation/${id}/edit`, { state: { quotation } })}
              onRecreate={
                can('quotations', 'write')
                  ? () => navigate(`/cart/quotation?recreate=${encodeURIComponent(id)}`)
                  : undefined
              }
              onDuplicate={
                can('quotations', 'write')
                  ? async () => {
                      try {
                        const r = await cloneQuotation(id).unwrap();
                        const newId = r?.clonedQuotation?.quotationId;
                        toast.success('Copy created as a draft');
                        if (newId) navigate(`/quotation/${newId}`);
                      } catch (e) {
                        toast.error(e?.data?.message || 'Could not duplicate');
                      }
                    }
                  : undefined
              }
            />
          </div>

          {/* The quotation exactly as the customer receives it */}
          <div className="fv2-newquotationdetails-b9e8e31578">
            <div className="fv2-newquotationdetails-8948c5d53f">
              <QuotationPdfFrame
                quotationId={id}
                version={pdfVersion}
                style={pdfStyle}
                cover={pdfCover}
                exportOptions={exportOptions}
                pageOrder={pageOrder}
                onPagesChange={onPagesChange}
                refreshKey={`${quotation.updatedAt || ''}-${quotation.status || ''}-${quotation.finalAmount || ''}`}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
