import React, { useState, useMemo, useEffect } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import {
  message,
  Tabs,
  Select,
  Pagination,
  Tag,
  Button,
  Modal,
  Spin,
} from "antd";
import {
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  MoreOutlined,
} from "@ant-design/icons";
import { Dropdown, Menu } from "antd";
import { useGetUserByIdQuery } from "../../api/userApi";

import DeleteModal from "../Common/DeleteModal";
import PageHeader from "../Common/PageHeader";
import DatesModal from "./DateModal";
import PermissionGate from "../../context/PermissionGate";

import {
  useGetPurchaseOrdersQuery,
  useDeletePurchaseOrderMutation,
  useUpdatePurchaseOrderStatusMutation,
  useGetVendorsQuery,
} from "../../api/poApi";

import {
  useGetAllFGSQuery,
  useDeleteFGSMutation,
  useUpdateFGSStatusMutation,
  useConvertFgsToPoMutation,
} from "../../api/fgsApi";

const { TabPane } = Tabs;
const { Option } = Select;

// Shared Colors
const PRIMARY_RED = "#e31e24";
const DARK_GRAY = "#333333";
const LIGHT_GRAY = "#f5f5f5";
const BORDER_GRAY = "#d9d9d9";
const RED_LIGHT = "#ffebee";
const RED_SOFT = "#ef9a9a";

// ─────────────────────────────────────────────────────────────
// PO Row Component
// ─────────────────────────────────────────────────────────────
const PORow = ({
  po,
  idx,
  vendorMap,
  filters,
  handleEditPO,
  handleDeletePOClick,
  editingPOStatusId,
  setEditingPOStatusId,
  handlePOStatusChange,
  isUpdatingPOStatus,
  handleOpenDatesModal,
  poStatuses, // ← added as prop
  isDueDateClose, // ← added as prop
}) => {
  const navigate = useNavigate();
  const { data: user, isLoading: isUserLoading } = useGetUserByIdQuery(
    po.userId,
  );

  const createdByDisplay = isUserLoading ? (
    <Spin size="small" />
  ) : user ? (
    user.name || user.email || user.username || "—"
  ) : po.userId ? (
    "User not found"
  ) : (
    "—"
  );

  const serial = (filters.page - 1) * filters.limit + idx + 1;
  const vendorName = vendorMap[po.vendorId] || "—";
  const status = po.status || "pending";

  return (
    <tr key={po.id}>
      <td>{serial}</td>
      <td>
        <div className="d-flex align-items-center gap-2">
          <Link to={`/po/${po.id}`}>{po.poNumber}</Link>
          {po.fgsId && (
            <Tag
              color={PRIMARY_RED}
              style={{ fontSize: "11px", cursor: "pointer" }}
              onClick={() => navigate(`/fgs/${po.fgsId}`)}
            >
              FGS
            </Tag>
          )}
        </div>
      </td>
      <td>
        <PermissionGate api="write" module="purchase_orders">
          {editingPOStatusId === po.id ? (
            <Select
              value={status}
              onChange={(val) => handlePOStatusChange(po.id, val)}
              style={{ width: 140 }}
              loading={isUpdatingPOStatus}
              autoFocus
              size="small"
              onBlur={() => setEditingPOStatusId(null)}
            >
              {poStatuses.map((s) => (
                <Option key={s} value={s}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </Option>
              ))}
            </Select>
          ) : (
            <div
              className="d-flex align-items-center gap-2 pointer"
              onClick={() => setEditingPOStatusId(po.id)}
            >
              <span
                className={`priority-badge status-${status}`}
                style={{
                  padding: "4px 10px",
                  borderRadius: "4px",
                  fontSize: "13px",
                  fontWeight: 500,
                  backgroundColor: "#E6EAED",
                  color: DARK_GRAY,
                }}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </span>
              <EditOutlined style={{ fontSize: "14px" }} />
            </div>
          )}
        </PermissionGate>
      </td>
      <td>{vendorName}</td>
      <td>{po.totalAmount ? `Rs. ${po.totalAmount}` : "—"}</td>
      <td>
        {po.orderDate ? new Date(po.orderDate).toLocaleDateString() : "—"}
      </td>
      <td>
        {po.expectDeliveryDate ? (
          <span
            className={`due-date-link ${isDueDateClose(po.expectDeliveryDate) ? "due-date-close" : ""}`}
            style={{ cursor: "pointer" }}
            onClick={() =>
              handleOpenDatesModal(po.expectDeliveryDate, po.followupDates)
            }
          >
            {new Date(po.expectDeliveryDate).toLocaleDateString()}
          </span>
        ) : (
          "—"
        )}
      </td>
      <td>{createdByDisplay}</td>
      <td>
        <div className="d-flex gap-2">
          <PermissionGate api="edit" module="purchase_orders">
            <EditOutlined
              style={{ cursor: "pointer" }}
              onClick={() => handleEditPO(po)}
            />
          </PermissionGate>
          <PermissionGate api="delete" module="purchase_orders">
            <Dropdown
              overlay={
                <Menu>
                  <Menu.Item
                    key="delete"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => handleDeletePOClick(po.id)}
                  >
                    Delete
                  </Menu.Item>
                </Menu>
              }
              trigger={["click"]}
            >
              <Button type="text" icon={<MoreOutlined />} />
            </Dropdown>
          </PermissionGate>
        </div>
      </td>
    </tr>
  );
};

// ─────────────────────────────────────────────────────────────
// FGS Row Component
// ─────────────────────────────────────────────────────────────
const FGSRow = ({
  fgs,
  idx,
  vendorMap,
  filters,
  handleEditFGS,
  handleDeleteFGSClick,
  handleConvertToPO,
  editingFGSStatusId,
  setEditingFGSStatusId,
  handleFGSStatusChange,
  isUpdatingFGSStatus,
  fgsStatuses, // ← added as prop
  getFGSStatusBg, // ← added as prop
  getFGSStatusColor, // ← added as prop
}) => {
  const { data: user, isLoading: isUserLoading } = useGetUserByIdQuery(
    fgs.userId,
  );

  const createdByDisplay = isUserLoading ? (
    <Spin size="small" />
  ) : user ? (
    user.name || user.email || user.username || "—"
  ) : fgs.userId ? (
    "User not found"
  ) : (
    "—"
  );

  const serial = (filters.page - 1) * filters.limit + idx + 1;
  const vendorName = vendorMap[fgs.vendorId] || "—";
  const status = fgs.status || "draft";

  return (
    <tr key={fgs.id}>
      <td>{serial}</td>
      <td>
        <Link to={`/fgs/${fgs.id}`}>{fgs.fgsNumber}</Link>
      </td>
      <td>
        <PermissionGate api="write" module="field_guided_sheets">
          {editingFGSStatusId === fgs.id ? (
            <Select
              value={status}
              onChange={(val) => handleFGSStatusChange(fgs.id, val)}
              style={{ width: 140 }}
              loading={isUpdatingFGSStatus}
              autoFocus
              size="small"
              onBlur={() => setEditingFGSStatusId(null)}
            >
              {fgsStatuses.map((s) => (
                <Option key={s} value={s}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </Option>
              ))}
            </Select>
          ) : (
            <div
              className="d-flex align-items-center gap-2 pointer"
              onClick={() => setEditingFGSStatusId(fgs.id)}
            >
              <span
                className={`priority-badge status-${status}`}
                style={{
                  padding: "4px 10px",
                  borderRadius: "4px",
                  fontSize: "13px",
                  fontWeight: 500,
                  backgroundColor: getFGSStatusBg(status),
                  color: getFGSStatusColor(status),
                  border: `1px solid ${RED_SOFT}`,
                }}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </span>
              <EditOutlined style={{ fontSize: "14px" }} />
            </div>
          )}
        </PermissionGate>
      </td>
      <td>{vendorName}</td>
      <td>{fgs.totalAmount ? `Rs. ${fgs.totalAmount}` : "—"}</td>
      <td>
        {fgs.orderDate ? new Date(fgs.orderDate).toLocaleDateString() : "—"}
      </td>
      <td>
        {fgs.expectDeliveryDate
          ? new Date(fgs.expectDeliveryDate).toLocaleDateString()
          : "—"}
      </td>
      <td>{createdByDisplay}</td>
      <td>
        <div className="d-flex gap-2">
          <PermissionGate api="edit" module="field_guided_sheets">
            <EditOutlined
              style={{ cursor: "pointer" }}
              onClick={() => handleEditFGS(fgs)}
            />
          </PermissionGate>
          <PermissionGate api="delete" module="field_guided_sheets">
            <Dropdown
              overlay={
                <Menu>
                  <Menu.Item
                    key="delete"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => handleDeleteFGSClick(fgs.id)}
                  >
                    Delete
                  </Menu.Item>
                  {status === "approved" && (
                    <Menu.Item
                      key="convert"
                      icon={<span style={{ color: PRIMARY_RED }}>→</span>}
                      onClick={() => handleConvertToPO(fgs.id, fgs.fgsNumber)}
                    >
                      Convert to PO
                    </Menu.Item>
                  )}
                </Menu>
              }
              trigger={["click"]}
            >
              <Button type="text" icon={<MoreOutlined />} />
            </Dropdown>
          </PermissionGate>
        </div>
      </td>
    </tr>
  );
};

const PurchaseManagement = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const initialTab = searchParams.has("fgs") ? "fgs" : "po";
  const [activeTab, setActiveTab] = useState(initialTab);

  useEffect(() => {
    if (activeTab === "fgs") {
      setSearchParams({ fgs: "1" });
    } else {
      setSearchParams({});
    }
  }, [activeTab, setSearchParams]);

  // ─── Shared Filters ──────────────────────────────────
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("Recently Added");
  const [filters, setFilters] = useState({
    status: "",
    page: 1,
    limit: 10,
  });

  const resetPageOnFilterChange = () => {
    setFilters((prev) => ({ ...prev, page: 1 }));
  };

  // ─── Shared Vendors ──────────────────────────────────
  const { data: vendorsData } = useGetVendorsQuery();
  const vendorMap = useMemo(() => {
    if (!vendorsData) return {};
    return vendorsData.reduce((acc, v) => {
      acc[v.id] = v.vendorName || "—";
      return acc;
    }, {});
  }, [vendorsData]);

  // ─── PO Queries ──────────────────────────────────────
  const { data: poData, error: poError } = useGetPurchaseOrdersQuery(
    {
      page: filters.page,
      limit: filters.limit,
      status: filters.status,
      search: searchTerm,
      sort: sortBy,
    },
    { skip: activeTab !== "po" },
  );

  const [deletePurchaseOrder] = useDeletePurchaseOrderMutation();
  const [updatePurchaseOrderStatus, { isLoading: isUpdatingPOStatus }] =
    useUpdatePurchaseOrderStatusMutation();

  const purchaseOrders = poData?.purchaseOrders?.data || [];
  const poTotal = poData?.purchaseOrders?.pagination?.total || 0;

  // ─── FGS Queries ─────────────────────────────────────
  const {
    data: fgsData,
    error: fgsError,
    isLoading: fgsLoading,
  } = useGetAllFGSQuery(
    {
      page: filters.page,
      limit: filters.limit,
    },
    { skip: activeTab !== "fgs" },
  );

  const [deleteFGS] = useDeleteFGSMutation();
  const [updateFGSStatus, { isLoading: isUpdatingFGSStatus }] =
    useUpdateFGSStatusMutation();
  const [convertFgsToPo, { isLoading: isConverting }] =
    useConvertFgsToPoMutation();

  const fieldGuidedSheets = fgsData?.data || [];
  const fgsTotal = fgsData?.pagination?.total || 0;

  // ─── State for modals & editing ──────────────────────
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

  // ─── Constants & Helpers ─────────────────────────────
  const poStatuses = ["pending", "confirmed", "delivered", "cancelled"];
  const fgsStatuses = [
    "draft",
    "negotiating",
    "approved",
    "converted",
    "cancelled",
  ];

  const sortOptions = [
    "Recently Added",
    "Ascending",
    "Descending",
    "Order Date Ascending",
    "Order Date Descending",
  ];

  const getFGSStatusBg = (status) => {
    const map = {
      draft: LIGHT_GRAY,
      negotiating: RED_LIGHT,
      approved: "#ffcdd2",
      converted: "#ef9a9a",
      cancelled: RED_LIGHT,
    };
    return map[status] || LIGHT_GRAY;
  };

  const getFGSStatusColor = (status) => {
    const map = {
      draft: DARK_GRAY,
      negotiating: PRIMARY_RED,
      approved: PRIMARY_RED,
      converted: "#ffffff",
      cancelled: PRIMARY_RED,
    };
    return map[status] || DARK_GRAY;
  };

  const isDueDateClose = (date) => {
    if (!date) return false;
    const diff = (new Date(date) - new Date()) / (1000 * 60 * 60 * 24);
    return diff <= 3 && diff >= 0;
  };

  // ─── Handlers ────────────────────────────────────────
  const handleTabChange = (key) => {
    setActiveTab(key);
    resetPageOnFilterChange();
    setSearchTerm("");
    setFilters((prev) => ({ ...prev, status: "" }));
  };

  const handlePageChange = (page, pageSize) => {
    setFilters((prev) => ({
      ...prev,
      page,
      limit: pageSize || prev.limit,
    }));
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setSortBy("Recently Added");
    setFilters({ status: "", page: 1, limit: 10 });
  };

  const handleOpenAddPO = () => navigate("/po/add");
  const handleEditPO = (po) => navigate(`/po/${po.id}/edit`, { state: { po } });
  const handleDeletePOClick = (poId) => {
    setPOToDelete(poId);
    setShowDeleteModal(true);
  };
  const handleDeletePO = async (poId) => {
    try {
      await deletePurchaseOrder(poId).unwrap();
      message.success("Purchase order deleted successfully");
    } catch (err) {
      message.error(err.data?.message || "Failed to delete PO");
    } finally {
      setShowDeleteModal(false);
      setPOToDelete(null);
    }
  };
  const handlePOStatusChange = async (poId, newStatus) => {
    try {
      await updatePurchaseOrderStatus({ id: poId, status: newStatus }).unwrap();
      message.success("Status updated");
    } catch (err) {
      message.error(err.data?.message || "Failed to update status");
    } finally {
      setEditingPOStatusId(null);
    }
  };
  const handleOpenDatesModal = (dueDate, followupDates = []) => {
    setSelectedDates({ dueDate, followupDates });
    setShowDatesModal(true);
  };

  const handleOpenAddFGS = () => navigate("/fgs/add");
  const handleEditFGS = (fgs) =>
    navigate(`/fgs/${fgs.id}/edit`, { state: { fgs } });
  const handleDeleteFGSClick = (fgsId) => {
    setFGSToDelete(fgsId);
    setShowDeleteModal(true);
  };
  const handleDeleteFGSConfirm = async (fgsId) => {
    try {
      await deleteFGS(fgsId).unwrap();
      message.success("Field Generated Sheet deleted successfully");
    } catch (err) {
      message.error(err.data?.message || "Failed to delete FGS");
    } finally {
      setShowDeleteModal(false);
      setFGSToDelete(null);
    }
  };
  const handleFGSStatusChange = async (fgsId, newStatus) => {
    try {
      await updateFGSStatus({ id: fgsId, status: newStatus }).unwrap();
      message.success("Status updated");
    } catch (err) {
      message.error(err.data?.message || "Failed to update status");
    } finally {
      setEditingFGSStatusId(null);
    }
  };
  const handleConvertToPO = (fgsId, fgsNumber) => {
    Modal.confirm({
      title: "Convert to Purchase Order?",
      content: `Are you sure you want to convert FGS #${fgsNumber} to a Purchase Order?`,
      okText: "Convert",
      okType: "danger",
      okButtonProps: {
        style: { backgroundColor: PRIMARY_RED, borderColor: PRIMARY_RED },
      },
      onOk: async () => {
        try {
          const result = await convertFgsToPo(fgsId).unwrap();
          message.success(
            `Converted! New PO: ${result.purchaseOrder?.poNumber || "Generated"}`,
          );
        } catch (err) {
          message.error(err.data?.message || "Conversion failed");
        }
      },
    });
  };

  const getSortedData = (data) => {
    let result = [...data];
    switch (sortBy?.trim()) {
      case "Recently Added":
        return result.sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
        );
      case "Ascending":
        return result.sort((a, b) =>
          (a.poNumber || a.fgsNumber || "").localeCompare(
            b.poNumber || b.fgsNumber || "",
          ),
        );
      case "Descending":
        return result.sort((a, b) =>
          (b.poNumber || b.fgsNumber || "").localeCompare(
            a.poNumber || a.fgsNumber || "",
          ),
        );
      case "Order Date Ascending":
        return result.sort(
          (a, b) => new Date(a.orderDate) - new Date(b.orderDate),
        );
      case "Order Date Descending":
        return result.sort(
          (a, b) => new Date(b.orderDate) - new Date(a.orderDate),
        );
      default:
        return result;
    }
  };

  const sortedPOs = useMemo(
    () => getSortedData(purchaseOrders),
    [purchaseOrders, sortBy],
  );
  const sortedFGS = useMemo(
    () => getSortedData(fieldGuidedSheets),
    [fieldGuidedSheets, sortBy],
  );

  const renderTable = () => {
    const isPO = activeTab === "po";
    const data = isPO ? sortedPOs : sortedFGS;
    const error = isPO ? poError : fgsError;
    const loading = !isPO && fgsLoading;
    const total = isPO ? poTotal : fgsTotal;

    if (error) {
      return <div className="text-danger text-center">Error loading data</div>;
    }
    if (loading) {
      return <div className="text-center">Loading...</div>;
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
                <th>{isPO ? "PO No." : "FGS No."}</th>
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
                    poStatuses={poStatuses} // ← passed here
                    isDueDateClose={isDueDateClose} // ← passed here
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
                    fgsStatuses={fgsStatuses} // ← passed here
                    getFGSStatusBg={getFGSStatusBg} // ← passed here
                    getFGSStatusColor={getFGSStatusColor} // ← passed here
                  />
                ),
              )}
            </tbody>
          </table>
        </div>

        {total > filters.limit && (
          <div className="d-flex justify-content-end mt-4">
            <Pagination
              current={filters.page}
              pageSize={filters.limit}
              total={total}
              onChange={handlePageChange}
              showSizeChanger
              pageSizeOptions={["10", "20", "50", "100"]}
              showQuickJumper
            />
          </div>
        )}
      </>
    );
  };

  return (
    <div className="page-wrapper">
      <div className="content">
        <div className="card">
          <PageHeader
            title="Purchase Management"
            subtitle="Manage Purchase Orders & Field Generated Sheets"
            onAdd={() =>
              activeTab === "po" ? handleOpenAddPO() : handleOpenAddFGS()
            }
          />

          <div className="card-body">
            <Tabs activeKey={activeTab} onChange={handleTabChange}>
              <TabPane tab="Purchase Orders" key="po" />
              <TabPane tab="Field Generated Sheets" key="fgs" />
            </Tabs>

            <div className="row mb-4 align-items-center">
              <div className="col-lg-7">
                <div className="d-flex flex-wrap gap-3">
                  <Select
                    placeholder="All Statuses"
                    allowClear
                    style={{ width: 160 }}
                    value={filters.status || undefined}
                    onChange={(val) =>
                      setFilters((p) => ({ ...p, status: val || "", page: 1 }))
                    }
                  >
                    {(activeTab === "po" ? poStatuses : fgsStatuses).map(
                      (s) => (
                        <Option key={s} value={s}>
                          {s.charAt(0).toUpperCase() + s.slice(1)}
                        </Option>
                      ),
                    )}
                  </Select>

                  <Select
                    value={sortBy}
                    onChange={(v) => {
                      setSortBy(v);
                      resetPageOnFilterChange();
                    }}
                    style={{ width: 180 }}
                  >
                    {sortOptions.map((opt) => (
                      <Option key={opt} value={opt}>
                        {opt}
                      </Option>
                    ))}
                  </Select>
                </div>
              </div>

              <div className="col-lg-5">
                <div className="d-flex justify-content-lg-end flex-wrap gap-2 mt-3 mt-lg-0">
                  <div className="position-relative me-2 flex-grow-1">
                    <span className="input-icon-addon">
                      <SearchOutlined />
                    </span>
                    <input
                      className="form-control"
                      placeholder={`Search ${activeTab === "po" ? "POs" : "FGS"}...`}
                      value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value);
                        resetPageOnFilterChange();
                      }}
                    />
                  </div>
                  <button
                    className="btn btn-outline-secondary"
                    onClick={handleClearFilters}
                  >
                    Clear
                  </button>
                </div>
              </div>
            </div>

            {renderTable()}
          </div>
        </div>
      </div>

      <DeleteModal
        isVisible={showDeleteModal}
        item={activeTab === "po" ? poToDelete : fgsToDelete}
        itemType={
          activeTab === "po" ? "Purchase Order" : "Field Generated Sheet"
        }
        onConfirm={(id) =>
          activeTab === "po" ? handleDeletePO(id) : handleDeleteFGSConfirm(id)
        }
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
