import ListToolbar from '../../components/Common/ListToolbar';
import ListPagination from '../../components/Common/ListPagination';
import Loader from '../../components/Common/Loader';
import './PurchaseManagement.styles.css';
// src/pages/PurchaseManagement.jsx  (or wherever you keep it)

import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Tabs, Button, Modal } from 'antd';
import { toast } from 'sonner';
import dayjs from 'dayjs';

import DeleteModal from '../../components/Common/DeleteModal';
import PageHeader from '../../components/Common/PageHeader';
import DatesModal from '../../components/Orders/DateModal';
import PermissionGate from '../../context/PermissionGate';

import {
  useGetPurchaseOrdersQuery,
  useDeletePurchaseOrderMutation,
  useUpdatePurchaseOrderStatusMutation,
  useGetVendorsQuery,
} from '../../api/poApi';

import {
  useGetAllFGSQuery,
  useDeleteFGSMutation,
  useUpdateFGSStatusMutation,
  useConvertFgsToPoMutation,
} from '../../api/fgsApi';

// ← New imports
import FGSRow from '../../components/Orders/FgsRow';
import PORow from '../../components/Orders/PoRow';
const { TabPane } = Tabs;
// Shared Colors (you can move these to a constants file later)
const PRIMARY_RED = '#e31e24';
const DARK_GRAY = '#333333';
const LIGHT_GRAY = '#f5f5f5';
const RED_LIGHT = '#ffebee';
const RED_SOFT = '#ef9a9a';

const PurchaseManagement = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const initialTab = searchParams.has('fgs') ? 'fgs' : 'po';
  const [activeTab, setActiveTab] = useState(initialTab);

  useEffect(() => {
    if (activeTab === 'fgs') {
      setSearchParams({ fgs: '1' });
    } else {
      setSearchParams({});
    }
  }, [activeTab, setSearchParams]);

  // ─── Filters ────────────────────────────────────────────────
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('Recently Added');
  const [filters, setFilters] = useState({
    status: '',
    vendorId: '',
    range: null,
    page: 1,
    limit: 10,
  });

  const resetPageOnFilterChange = () => {
    setFilters((prev) => ({ ...prev, page: 1 }));
  };

  // ─── Vendors ────────────────────────────────────────────────
  const { data: vendorsData } = useGetVendorsQuery();
  const vendorMap = useMemo(() => {
    if (!vendorsData) return {};
    return vendorsData.reduce((acc, v) => {
      acc[v.id] = v.vendorName || '—';
      return acc;
    }, {});
  }, [vendorsData]);

  // ─── PO Data ────────────────────────────────────────────────
  const { data: poData, error: poError } = useGetPurchaseOrdersQuery(
    {
      page: filters.page,
      limit: filters.limit,
      status: filters.status,
      search: searchTerm,
      sort: sortBy,
      vendorId: filters.vendorId,
      from: filters.range?.[0]?.format('YYYY-MM-DD') || '',
      to: filters.range?.[1]?.format('YYYY-MM-DD') || '',
    },
    { skip: activeTab !== 'po' },
  );

  const [deletePurchaseOrder] = useDeletePurchaseOrderMutation();
  const [updatePurchaseOrderStatus, { isLoading: isUpdatingPOStatus }] =
    useUpdatePurchaseOrderStatusMutation();

  const purchaseOrders = poData?.purchaseOrders?.data || [];
  const poTotal = poData?.purchaseOrders?.pagination?.total || 0;

  // ─── FGS Data ───────────────────────────────────────────────
  const {
    data: fgsData,
    error: fgsError,
    isLoading: fgsLoading,
  } = useGetAllFGSQuery(
    {
      page: filters.page,
      limit: filters.limit,
    },
    { skip: activeTab !== 'fgs' },
  );

  const [deleteFGS] = useDeleteFGSMutation();
  const [updateFGSStatus, { isLoading: isUpdatingFGSStatus }] = useUpdateFGSStatusMutation();
  const [convertFgsToPo, { isLoading: isConverting }] = useConvertFgsToPoMutation();

  const fieldGuidedSheets = fgsData?.data || [];
  const fgsTotal = fgsData?.pagination?.total || 0;

  // ─── Modal & Editing State ──────────────────────────────────
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [poToDelete, setPOToDelete] = useState(null);
  const [fgsToDelete, setFGSToDelete] = useState(null);

  const [showDatesModal, setShowDatesModal] = useState(false);
  const [selectedDates, setSelectedDates] = useState({
    dueDate: null,
    followupDates: [],
  });

  const [editingPOStatusId, setEditingPOStatusId] = useState(null);
  const [editingFGSStatusId, setEditingFGSStatusId] = useState(null);

  // ─── Constants ──────────────────────────────────────────────
  const poStatuses = [
    'pending',
    'in_negotiation',
    'confirmed',
    'partial_delivered',
    'delivered',
    'cancelled',
  ];
  const fgsStatuses = ['draft', 'negotiating', 'approved', 'converted', 'cancelled'];

  const sortOptions = [
    'Recently Added',
    'Ascending',
    'Descending',
    'Order Date Ascending',
    'Order Date Descending',
  ];

  const getFGSStatusBg = (status) => {
    const map = {
      draft: LIGHT_GRAY,
      negotiating: RED_LIGHT,
      approved: '#ffcdd2',
      converted: '#ef9a9a',
      cancelled: RED_LIGHT,
    };
    return map[status] || LIGHT_GRAY;
  };

  const getFGSStatusColor = (status) => {
    const map = {
      draft: DARK_GRAY,
      negotiating: PRIMARY_RED,
      approved: PRIMARY_RED,
      converted: '#ffffff',
      cancelled: PRIMARY_RED,
    };
    return map[status] || DARK_GRAY;
  };

  const isDueDateClose = (date) => {
    if (!date) return false;
    const diff = (new Date(date) - new Date()) / (1000 * 60 * 60 * 24);
    return diff <= 3 && diff >= 0;
  };

  // ─── Handlers ───────────────────────────────────────────────
  const handleTabChange = (key) => {
    setActiveTab(key);
    resetPageOnFilterChange();
    setSearchTerm('');
    setFilters((prev) => ({ ...prev, status: '' }));
  };

  const handlePageChange = (page, pageSize) => {
    setFilters((prev) => ({
      ...prev,
      page,
      limit: pageSize || prev.limit,
    }));
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setSortBy('Recently Added');
    setFilters({ status: '', vendorId: '', range: null, page: 1, limit: 10 });
  };

  const handleOpenAddPO = () => navigate('/cart/purchase-order');
  const handleEditPO = (po) => navigate(`/po/${po.id}/edit`, { state: { po } });
  const handleDeletePOClick = (poId) => {
    setPOToDelete(poId);
    setShowDeleteModal(true);
  };

  const handleDeletePO = async (poId) => {
    try {
      await deletePurchaseOrder(poId).unwrap();
      toast.success('Purchase order deleted successfully');
    } catch (err) {
      toast.error(err.data?.message || 'Failed to delete PO');
    } finally {
      setShowDeleteModal(false);
      setPOToDelete(null);
    }
  };

  const handlePOStatusChange = async (poId, newStatus) => {
    try {
      await updatePurchaseOrderStatus({ id: poId, status: newStatus }).unwrap();
      toast.success('Status updated');
    } catch (err) {
      toast.error(err.data?.message || 'Failed to update status');
    } finally {
      setEditingPOStatusId(null);
    }
  };

  const handleOpenDatesModal = (dueDate, followupDates = []) => {
    setSelectedDates({ dueDate, followupDates });
    setShowDatesModal(true);
  };

  const handleOpenAddFGS = () => navigate('/fgs/add');
  const handleEditFGS = (fgs) => navigate(`/fgs/${fgs.id}/edit`, { state: { fgs } });
  const handleDeleteFGSClick = (fgsId) => {
    setFGSToDelete(fgsId);
    setShowDeleteModal(true);
  };

  const handleDeleteFGSConfirm = async (fgsId) => {
    try {
      await deleteFGS(fgsId).unwrap();
      toast.success('Field Generated Sheet deleted successfully');
    } catch (err) {
      toast.error(err.data?.message || 'Failed to delete FGS');
    } finally {
      setShowDeleteModal(false);
      setFGSToDelete(null);
    }
  };

  const handleFGSStatusChange = async (fgsId, newStatus) => {
    try {
      await updateFGSStatus({ id: fgsId, status: newStatus }).unwrap();
      toast.success('Status updated');
    } catch (err) {
      toast.error(err.data?.message || 'Failed to update status');
    } finally {
      setEditingFGSStatusId(null);
    }
  };

  const handleConvertToPO = (fgsId, fgsNumber) => {
    Modal.confirm({
      title: 'Convert to Purchase Order?',
      content: `Are you sure you want to convert FGS #${fgsNumber} to a Purchase Order?`,
      okText: 'Convert',
      okType: 'danger',
      okButtonProps: {
        style: { backgroundColor: PRIMARY_RED, borderColor: PRIMARY_RED },
      },
      onOk: async () => {
        try {
          const result = await convertFgsToPo(fgsId).unwrap();
          toast.success(`Converted! New PO: ${result.purchaseOrder?.poNumber || 'Generated'}`);
        } catch (err) {
          toast.error(err.data?.message || 'Conversion failed');
        }
      },
    });
  };

  const getSortedData = (data) => {
    let result = [...data];
    switch (sortBy?.trim()) {
      case 'Recently Added':
        return result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      case 'Ascending':
        return result.sort((a, b) =>
          (a.poNumber || a.fgsNumber || '').localeCompare(b.poNumber || b.fgsNumber || ''),
        );
      case 'Descending':
        return result.sort((a, b) =>
          (b.poNumber || b.fgsNumber || '').localeCompare(a.poNumber || a.fgsNumber || ''),
        );
      case 'Order Date Ascending':
        return result.sort((a, b) => new Date(a.orderDate) - new Date(b.orderDate));
      case 'Order Date Descending':
        return result.sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate));
      default:
        return result;
    }
  };

  const sortedPOs = useMemo(() => getSortedData(purchaseOrders), [purchaseOrders, sortBy]);
  const sortedFGS = useMemo(() => getSortedData(fieldGuidedSheets), [fieldGuidedSheets, sortBy]);

  const renderTable = () => {
    const isPO = activeTab === 'po';
    const data = isPO ? sortedPOs : sortedFGS;
    const error = isPO ? poError : fgsError;
    const loading = !isPO && fgsLoading;
    const total = isPO ? poTotal : fgsTotal;

    if (error) {
      return <div className="text-danger text-center">Error loading data</div>;
    }
    if (loading) {
      return (
        <div className="text-center">
          <Loader /> Loading...
        </div>
      );
    }
    if (!data.length) {
      return <p className="text-muted text-center">No records found</p>;
    }

    return (
      <>
        <div className="table-responsive">
          <table className="table table-hover">
            <thead>
              <tr>
                <th>S.No.</th>
                <th>{isPO ? 'PO No.' : 'FGS No.'}</th>
                <th>STATUS</th>
                <th>VENDOR</th>
                <th>TOTAL AMOUNT</th>
                <th>ORDER DATE</th>
                <th>EXPECTED DELIVERY</th>
                <th>CREATED BY</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {data.map((item, idx) =>
                isPO ? (
                  <PORow
                    key={item.id}
                    po={item}
                    idx={idx}
                    vendorMap={vendorMap}
                    filters={filters}
                    handleEditPO={handleEditPO}
                    handleDeletePOClick={handleDeletePOClick}
                    editingPOStatusId={editingPOStatusId}
                    setEditingPOStatusId={setEditingPOStatusId}
                    handlePOStatusChange={handlePOStatusChange}
                    isUpdatingPOStatus={isUpdatingPOStatus}
                    handleOpenDatesModal={handleOpenDatesModal}
                    poStatuses={poStatuses}
                    isDueDateClose={isDueDateClose}
                  />
                ) : (
                  <FGSRow
                    key={item.id}
                    fgs={item}
                    idx={idx}
                    vendorMap={vendorMap}
                    filters={filters}
                    handleEditFGS={handleEditFGS}
                    handleDeleteFGSClick={handleDeleteFGSClick}
                    handleConvertToPO={handleConvertToPO}
                    editingFGSStatusId={editingFGSStatusId}
                    setEditingFGSStatusId={setEditingFGSStatusId}
                    handleFGSStatusChange={handleFGSStatusChange}
                    isUpdatingFGSStatus={isUpdatingFGSStatus}
                    fgsStatuses={fgsStatuses}
                    getFGSStatusBg={getFGSStatusBg}
                    getFGSStatusColor={getFGSStatusColor}
                  />
                ),
              )}
            </tbody>
          </table>
        </div>

        {total > filters.limit && (
          <ListPagination
            itemLabel="records"
            current={filters.page}
            pageSize={filters.limit}
            total={total}
            onChange={handlePageChange}
            showSizeChanger
            showQuickJumper
          />
        )}
      </>
    );
  };

  return (
    <div className="page-wrapper">
      <div className="content">
        <PageHeader
          title="Purchase Order"
          subtitle="Manage Purchase Orders & Field Generated Sheets"
          onAdd={() => (activeTab === 'po' ? handleOpenAddPO() : handleOpenAddFGS())}
        />

        <div className="card-body">
          <Tabs activeKey={activeTab} onChange={handleTabChange}>
            <TabPane tab="Purchase Orders" key="po" />
            <TabPane tab="Field Generated Sheets" key="fgs" />
          </Tabs>

          {/* Filters */}
          <ListToolbar
            exportTitle={activeTab === 'po' ? 'Purchase orders' : 'Field generated sheets'}
            exportData={(activeTab === 'po' ? sortedPOs : sortedFGS).map((p) => ({
              Reference: p.poNumber ?? p.fgsNumber,
              Vendor: vendorMap[p.vendorId] ?? '',
              Status: p.status,
              Amount: p.totalAmount,
              'Order date': p.orderDate,
              'Expected delivery': p.expectedDeliveryDate,
            }))}
            search={{
              placeholder: `Search ${activeTab === 'po' ? 'POs' : 'FGS'}...`,
              value: searchTerm,
              onChange: (e) => {
                setSearchTerm(e.target.value);
                resetPageOnFilterChange();
              },
            }}
            filters={[
              {
                key: 'status',
                type: 'select',
                props: {
                  placeholder: 'All Statuses',
                  allowClear: true,
                  value: filters.status || undefined,
                  onChange: (val) => setFilters((p) => ({ ...p, status: val || '', page: 1 })),
                  options: (activeTab === 'po' ? poStatuses : fgsStatuses).map((s) => ({
                    value: s,
                    label: (s.charAt(0).toUpperCase() + s.slice(1)).replace(/_/g, ' '),
                  })),
                },
              },
              ...(activeTab === 'po'
                ? [
                    {
                      key: 'vendor',
                      type: 'select',
                      props: {
                        placeholder: 'All vendors',
                        allowClear: true,
                        showSearch: true,
                        optionFilterProp: 'label',
                        value: filters.vendorId || undefined,
                        onChange: (v) => setFilters((p) => ({ ...p, vendorId: v || '', page: 1 })),
                        options: (vendorsData || []).map((v) => ({
                          value: v.id,
                          label: v.vendorName,
                        })),
                      },
                    },
                    {
                      key: 'dates',
                      type: 'dateRange',
                      props: {
                        format: 'D MMM YY',
                        value: filters.range,
                        onChange: (v) => setFilters((p) => ({ ...p, range: v, page: 1 })),
                        presets: [
                          { label: 'This month', value: [dayjs().startOf('month'), dayjs()] },
                          { label: 'Last 30 days', value: [dayjs().subtract(30, 'day'), dayjs()] },
                          { label: 'This year', value: [dayjs().startOf('year'), dayjs()] },
                        ],
                      },
                    },
                  ]
                : []),
              {
                key: 'sort',
                type: 'select',
                props: {
                  value: sortBy,
                  onChange: (v) => {
                    setSortBy(v);
                    resetPageOnFilterChange();
                  },
                  options: sortOptions.map((opt) => ({ value: opt, label: opt })),
                },
              },
            ]}
            onClear={handleClearFilters}
          />

          {renderTable()}
        </div>
      </div>

      <DeleteModal
        isVisible={showDeleteModal}
        item={activeTab === 'po' ? poToDelete : fgsToDelete}
        itemType={activeTab === 'po' ? 'Purchase Order' : 'Field Generated Sheet'}
        onConfirm={(id) => (activeTab === 'po' ? handleDeletePO(id) : handleDeleteFGSConfirm(id))}
        onCancel={() => {
          setShowDeleteModal(false);
          setPOToDelete(null);
          setFGSToDelete(null);
        }}
      />

      <DatesModal
        show={showDatesModal}
        onHide={() => setShowDatesModal(false)}
        dueDate={selectedDates.dueDate}
        followupDates={selectedDates.followupDates}
      />
    </div>
  );
};

export default PurchaseManagement;
