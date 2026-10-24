import ListToolbar from '../../components/Common/ListToolbar';
import ListPagination from '../../components/Common/ListPagination';
import './QuotationList.styles.css';
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import {
  useGetAllQuotationsQuery,
  useDeleteQuotationMutation,
  useCloneQuotationMutation,
  useGetQuotationPipelineQuery,
} from '../../api/quotationApi';
import { useGetCustomersQuery } from '../../api/customerApi';
import {
  EyeOutlined,
  DeleteFilled,
  FileAddOutlined,
  MoreOutlined,
  EditOutlined,
  HomeOutlined,
  CopyOutlined,
  FilePdfOutlined,
  PhoneOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons';
import QuotationProductModal from '../../components/Quotation/QuotationProductModal';
import DeleteModal from '../../components/Common/DeleteModal';
import { Button, Dropdown, Table, Tabs, Tooltip, Space, Badge, Typography, Checkbox } from 'antd';
import { toast } from 'sonner';
import PageHeader from '../../components/Common/PageHeader';
import dayjs from 'dayjs';
import useCan from '../../utils/useCan';
import { downloadQuotationPdf } from '../../components/Quotation/quotationPdf';
import { orderStateFromQuotation } from '../../components/Quotation/convertToOrder';
import { STATUS_META } from '../../components/Quotation/pipelineMeta';
import {
  QuotationStatusTag,
  ValidTill,
  NextFollowUp,
  LostModal,
  FollowUpModal,
} from '../../components/Quotation/QuotationPipeline';

const { Text } = Typography;

const inr = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

const TABS = [
  { key: '', label: 'All' },
  { key: 'OPEN', label: 'Open', statuses: 'DRAFT,SENT,NEGOTIATION' },
  { key: 'FOLLOWUP', label: 'Follow-up due' },
  { key: 'DRAFT', label: 'Draft' },
  { key: 'SENT', label: 'Sent' },
  { key: 'NEGOTIATION', label: 'Negotiation' },
  { key: 'WON', label: 'Won' },
  { key: 'LOST', label: 'Lost' },
  { key: 'EXPIRED', label: 'Expired' },
];

const QuotationList = () => {
  const navigate = useNavigate();
  const can = useCan();
  const [params, setParams] = useSearchParams();

  // ==================== STATE ====================
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [customerFilter, setCustomerFilter] = useState('');
  const [dateRange, setDateRange] = useState([null, null]);
  const tab = params.get('tab') || '';
  const mine = params.get('mine') === '1';

  const [showProductModal, setShowProductModal] = useState(false);
  const [selectedQuotationId, setSelectedQuotationId] = useState(null);
  const [quotationToDelete, setQuotationToDelete] = useState(null);
  const [lostFor, setLostFor] = useState(null);
  const [followUpFor, setFollowUpFor] = useState(null);
  const [pdfBusy, setPdfBusy] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const formattedDateRange = useMemo(() => {
    if (!dateRange[0] || !dateRange[1]) return undefined;
    return [dateRange[0].format('YYYY-MM-DD'), dateRange[1].format('YYYY-MM-DD')];
  }, [dateRange]);

  const tabDef = TABS.find((t) => t.key === tab) || TABS[0];

  // ==================== API ====================
  const {
    data: response,
    isLoading,
    isFetching,
    isError,
    error,
  } = useGetAllQuotationsQuery({
    page: currentPage,
    limit: pageSize,
    search: debouncedSearch.trim() || undefined,
    customerId: customerFilter || undefined,
    status: tab === 'FOLLOWUP' ? undefined : tabDef.statuses || tabDef.key || undefined,
    followUpDue: tab === 'FOLLOWUP',
    mine,
    dateRange: formattedDateRange,
  });
  const { data: pipeline } = useGetQuotationPipelineQuery({ mine });

  const quotations = Array.isArray(response?.data) ? response.data : [];
  const pagination = response?.pagination || { total: 0 };

  const { data: customersData } = useGetCustomersQuery({ limit: 10000 });
  const customers = customersData?.data || [];

  const [deleteQuotation, { isLoading: isDeleting }] = useDeleteQuotationMutation();
  const [cloneQuotation] = useCloneQuotationMutation();

  const setTab = (key) => {
    const next = new URLSearchParams(params);
    if (key) next.set('tab', key);
    else next.delete('tab');
    setParams(next, { replace: true });
    setCurrentPage(1);
  };
  const setMine = (v) => {
    const next = new URLSearchParams(params);
    if (v) next.set('mine', '1');
    else next.delete('mine');
    setParams(next, { replace: true });
    setCurrentPage(1);
  };

  const count = (key) => {
    const by = pipeline?.byStatus;
    if (!by) return null;
    if (key === '') return Object.values(by).reduce((a, s) => a + s.count, 0);
    if (key === 'OPEN') return pipeline.open.count;
    if (key === 'FOLLOWUP') return pipeline.followUpsDue;
    return by[key]?.count ?? 0;
  };

  // ==================== HANDLERS ====================
  const itemCount = (items) =>
    Array.isArray(items) ? items.filter((i) => !i.isOptionFor).length : 0;

  const handleClone = async (q) => {
    try {
      await cloneQuotation(q.quotationId).unwrap();
      toast.success(`Copy of ${q.reference_number} created as a draft`);
    } catch (err) {
      toast.error(err?.data?.message || 'Could not duplicate the quotation');
    }
  };

  const handleConfirmDelete = async () => {
    if (!quotationToDelete?.quotationId) return;
    try {
      await deleteQuotation(quotationToDelete.quotationId).unwrap();
      toast.success('Quotation deleted');
    } catch (e) {
      toast.error(e?.data?.message || 'Delete failed');
    } finally {
      setQuotationToDelete(null);
    }
  };

  const handlePdf = async (q) => {
    setPdfBusy(q.quotationId);
    try {
      await downloadQuotationPdf(q.quotationId, { style: 'detailed' });
    } catch (e) {
      toast.error(e.message);
    } finally {
      setPdfBusy(null);
    }
  };

  const handleGenerateSiteMap = (q) => {
    const rawItems = q.items || [];
    if (!rawItems.length) return toast.warning('No products to generate a site map');
    navigate('/site-map/add', {
      state: {
        fromQuotation: true,
        quotationId: q.quotationId,
        customerId: q.customerId,
        projectName: `${q.document_title || 'Quotation'} - Site Map`,
        items: rawItems.map((item) => ({
          productId: item.productId,
          name: item.name || 'Unknown',
          imageUrl: item.imageUrl || null,
          quantity: Number(item.quantity) || 1,
          price: Number(item.price) || 0,
          floor_number: 1,
          productType: item.category || 'Others',
        })),
        totalFloors: 1,
      },
    });
  };

  const handleConvert = (q) => {
    if (!itemCount(q.items)) return toast.error('This quotation has no items to convert');
    navigate('/order/add', { state: orderStateFromQuotation(q) });
  };

  const clearFilters = () => {
    setSearchTerm('');
    setCustomerFilter('');
    setDateRange([null, null]);
    setCurrentPage(1);
  };

  const isOpen = (q) => ['DRAFT', 'SENT', 'NEGOTIATION'].includes(q.status || 'DRAFT');

  // ==================== COLUMNS ====================
  const columns = [
    {
      title: 'Quotation',
      key: 'ref',
      render: (_, rec) => (
        <div>
          <Link to={`/quotation/${rec.quotationId}`} className="fw-medium">
            {rec.reference_number || '—'}
          </Link>
          <div>
            <Text className="fv2-quotationlist-574d2ce3a9" type="secondary">
              {rec.document_title || 'Untitled'} ·{' '}
              {rec.quotation_date ? dayjs(rec.quotation_date).format('D MMM YYYY') : '—'}
            </Text>
          </div>
        </div>
      ),
    },
    {
      title: 'Customer',
      key: 'customer',
      render: (_, rec) =>
        rec.customerId ? (
          <Link to={`/customer/${rec.customerId}`}>{rec.customerName}</Link>
        ) : (
          rec.customerName || '—'
        ),
    },
    {
      title: 'Status',
      key: 'status',
      render: (_, rec) => <QuotationStatusTag status={rec.status} lostReason={rec.lostReason} />,
    },
    {
      title: 'Value',
      dataIndex: 'finalAmount',
      key: 'amount',
      align: 'right',
      render: (amt, rec) => (
        <div>
          <div>{inr(amt)}</div>
          <Button
            className="fv2-quotationlist-5802823038"
            type="link"
            size="small"

            onClick={() => {
              setSelectedQuotationId(rec.quotationId);
              setShowProductModal(true);
            }}
          >
            {itemCount(rec.items)} {itemCount(rec.items) === 1 ? 'item' : 'items'}
          </Button>
        </div>
      ),
    },
    {
      title: 'Valid till',
      key: 'valid',
      render: (_, rec) => <ValidTill date={rec.validTill} status={rec.status} />,
    },
    {
      title: 'Next follow-up',
      key: 'followup',
      render: (_, rec) => <NextFollowUp date={rec.nextFollowUp} status={rec.status} />,
    },
    {
      title: 'Owner',
      key: 'owner',
      render: (_, rec) => <Text type="secondary">{rec.createdByName || '—'}</Text>,
    },
    {
      title: '',
      key: 'actions',
      fixed: 'right',
      width: 200,
      render: (_, rec) => {
        const menu = [
          { key: 'view', icon: <EyeOutlined />, label: 'Open' },
          can('quotations', 'edit') && { key: 'edit', icon: <EditOutlined />, label: 'Edit' },
          can('quotations', 'write') && {
            key: 'clone',
            icon: <CopyOutlined />,
            label: 'Duplicate',
          },
          can('quotations', 'write') && {
            key: 'recreate',
            icon: <CopyOutlined />,
            label: 'Recreate quotation',
          },
          can('quotations', 'edit') &&
            isOpen(rec) && {
              key: 'lost',
              icon: <CloseCircleOutlined />,
              label: 'Mark lost',
              danger: true,
            },
          { key: 'sitemap', icon: <HomeOutlined />, label: 'Generate site map' },
          can('quotations', 'delete') && { type: 'divider' },
          can('quotations', 'delete') && {
            key: 'delete',
            icon: <DeleteFilled />,
            label: 'Delete',
            danger: true,
          },
        ].filter(Boolean);
        const onMenu = ({ key }) => {
          if (key === 'view') navigate(`/quotation/${rec.quotationId}`);
          if (key === 'edit')
            navigate(`/quotation/${rec.quotationId}/edit`, { state: { quotation: rec } });
          if (key === 'clone') handleClone(rec);
          if (key === 'recreate')
            navigate(`/cart/quotation?recreate=${encodeURIComponent(rec.quotationId)}`);
          if (key === 'lost') setLostFor(rec);
          if (key === 'sitemap') handleGenerateSiteMap(rec);
          if (key === 'delete') setQuotationToDelete(rec);
        };
        return (
          <Space size={4}>
            {isOpen(rec) && can('orders', 'write') && (
              <Tooltip title="Convert to order">
                <Button
                  size="small"
                  type="primary"
                  ghost
                  icon={<FileAddOutlined />}
                  onClick={() => handleConvert(rec)}
                >
                  Order
                </Button>
              </Tooltip>
            )}
            {isOpen(rec) && can('quotations', 'edit') && (
              <Tooltip title="Log follow-up">
                <Button
                  size="small"
                  type="text"
                  icon={<PhoneOutlined />}
                  onClick={() => setFollowUpFor(rec)}
                />
              </Tooltip>
            )}
            <Tooltip title="Download PDF">
              <Button
                size="small"
                type="text"
                icon={<FilePdfOutlined className="fv2-quotationlist-8b772a7ce3" />}
                loading={pdfBusy === rec.quotationId}
                onClick={() => handlePdf(rec)}
              />
            </Tooltip>
            <Dropdown menu={{ items: menu, onClick: onMenu }} trigger={['click']}>
              <Button size="small" type="text" icon={<MoreOutlined />} />
            </Dropdown>
          </Space>
        );
      },
    },
  ];

  const by = pipeline?.byStatus;

  return (
    <div className="page-wrapper">
      <div className="content">
        <PageHeader
          title="Quotations"
          subtitle={
            pipeline
              ? `${pipeline.open.count} open worth ${inr(pipeline.open.value)}` +
                (pipeline.winRate != null ? ` · win rate ${pipeline.winRate}%` : '')
              : 'Price, share and follow up quotations'
          }
          onAdd={can('quotations', 'write') ? () => navigate('/cart/quotation') : undefined}
          addLabel="+ New quotation"
        />

        <div className="card-body">
          <Tabs
            activeKey={tab}
            onChange={setTab}
            items={TABS.map((t) => ({
              key: t.key,
              label: (
                <span>
                  {t.label}{' '}
                  {count(t.key) != null && (
                    <Badge
                      count={count(t.key)}
                      showZero
                      overflowCount={999}
                      color={
                        t.key === 'FOLLOWUP' && count(t.key)
                          ? '#cf1322'
                          : t.key && STATUS_META[t.key]
                            ? undefined
                            : '#8c8c8c'
                      }
                      style={
                        t.key && STATUS_META[t.key]
                          ? { background: '#f0f0f0', color: '#595959' }
                          : undefined
                      }
                    />
                  )}
                </span>
              ),
            }))}
          />
          {by && ['WON', 'LOST'].includes(tab) && (
            <Text type="secondary" className="d-block mb-2">
              {tab === 'WON'
                ? `Won value ${inr(by.WON.value)}`
                : `Lost value ${inr(by.LOST.value)}`}
            </Text>
          )}

          <ListToolbar
            exportTitle={'Quotations'}
            exportData={quotations.map((q) => ({
              Reference: q.reference_number,
              Title: q.document_title,
              Customer: q.customerName,
              Status: q.status,
              Amount: q.finalAmount,
              Date: q.quotation_date,
            }))}
            search={{
              placeholder: 'Search ref no., title or customer',
              value: searchTerm,
              onChange: (e) => setSearchTerm(e.target.value),
              allowClear: true,
            }}
            filters={[
              {
                key: 'customer',
                type: 'select',
                props: {
                  placeholder: 'Customer',
                  value: customerFilter || undefined,
                  onChange: (val) => {
                    setCustomerFilter(val || '');
                    setCurrentPage(1);
                  },
                  allowClear: true,
                  showSearch: true,
                  optionFilterProp: 'label',
                  options: customers.map((c) => ({ value: c.customerId, label: c.name })),
                },
              },
              {
                key: 'dates',
                type: 'dateRange',
                props: {
                  value: dateRange,
                  onChange: (d) => {
                    setDateRange(d || [null, null]);
                    setCurrentPage(1);
                  },
                  format: 'D MMM YYYY',
                },
              },
              {
                key: 'only-mine',
                type: 'custom',
                content: (
                  <Checkbox checked={mine} onChange={(e) => setMine(e.target.checked)}>
                    Only mine
                  </Checkbox>
                ),
              },
            ]}
            onClear={clearFilters}
          />

          {isError ? (
            <div className="alert alert-danger">
              Error: {error?.data?.message || 'Failed to load quotations'}
            </div>
          ) : (
            <>
              <Table
                columns={columns}
                dataSource={quotations}
                rowKey="quotationId"
                loading={isLoading || isFetching}
                size="middle"
                scroll={{ x: 'max-content' }}
                locale={{
                  emptyText:
                    tab === 'FOLLOWUP'
                      ? "No follow-ups due — you're up to date"
                      : 'No quotations match these filters',
                }}
                pagination={false}
              />
              <ListPagination
                itemLabel="quotations"
                current={currentPage}
                pageSize={pageSize}
                total={pagination.total}
                showSizeChanger
                onChange={(page, size) => {
                  setCurrentPage(page);
                  setPageSize(size);
                }}
              />
            </>
          )}
        </div>

        <QuotationProductModal
          show={showProductModal}
          onHide={() => {
            setShowProductModal(false);
            setSelectedQuotationId(null);
          }}
          quotationId={selectedQuotationId}
        />
        <LostModal quotation={lostFor} open={!!lostFor} onClose={() => setLostFor(null)} />
        <FollowUpModal
          quotation={followUpFor}
          open={!!followUpFor}
          onClose={() => setFollowUpFor(null)}
        />
        <DeleteModal
          isVisible={!!quotationToDelete}
          onConfirm={handleConfirmDelete}
          onCancel={() => setQuotationToDelete(null)}
          itemType="Quotation"
          isLoading={isDeleting}
        />
      </div>
    </div>
  );
};

export default QuotationList;
