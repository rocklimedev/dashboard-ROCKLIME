import React, { useState, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { message } from "antd";
import { FaSearch } from "react-icons/fa";
import { EditOutlined, DeleteOutlined, MoreOutlined } from "@ant-design/icons";
import { Dropdown, Menu, Button, Select, Spin, Pagination } from "antd"; // <-- Pagination added
import DeleteModal from "../Common/DeleteModal";
import PageHeader from "../Common/PageHeader";
import DatesModal from "./DateModal";
import PermissionGate from "../../context/PermissionGate";
import {
  useGetPurchaseOrdersQuery,
  useDeletePurchaseOrderMutation,
  useGetVendorsQuery,
  useUpdatePurchaseOrderStatusMutation,
} from "../../api/poApi";

const { Option } = Select;

const POWrapper = ({ activeTab, setActiveTab }) => {
  const navigate = useNavigate();

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [poToDelete, setPOToDelete] = useState(null);
  const [showDatesModal, setShowDatesModal] = useState(false);
  const [selectedDates, setSelectedDates] = useState({
    dueDate: null,
    followupDates: [],
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("Recently Added");
  const [filters, setFilters] = useState({
    status: "",
    page: 1,
    limit: 10,
  });
  const [editingStatusId, setEditingStatusId] = useState(null);

  // ──────────────────────────────────────────────────────
  // RTK Queries
  // ──────────────────────────────────────────────────────
  const {
    data: poData,
    isLoading,
    isFetching,
    error,
  } = useGetPurchaseOrdersQuery({
    page: filters.page,
    limit: filters.limit,
    status: filters.status,
    search: searchTerm,
    sort: sortBy,
  });

  const { data: vendorsData } = useGetVendorsQuery();
  const [deletePurchaseOrder] = useDeletePurchaseOrderMutation();
  const [updatePurchaseOrderStatus, { isLoading: isUpdatingStatus }] =
    useUpdatePurchaseOrderStatusMutation();

  // ──────────────────────────────────────────────────────
  // Vendor map
  // ──────────────────────────────────────────────────────
  const vendorMap = useMemo(() => {
    if (!vendorsData) return {};
    return vendorsData.reduce((acc, v) => {
      acc[v.id] = v.vendorName || "—";
      return acc;
    }, {});
  }, [vendorsData]);

  const purchaseOrders = poData?.purchaseOrders || [];
  const totalCount = poData?.totalCount || 0;

  // ──────────────────────────────────────────────────────
  // Statuses & Sorting
  // ──────────────────────────────────────────────────────
  const statuses = ["pending", "confirmed", "delivered", "cancelled"];
  const sortOptions = [
    "Recently Added",
    "Ascending",
    "Descending",
    "Order Date Ascending",
    "Order Date Descending",
  ];

  // ──────────────────────────────────────────────────────
  // Client-side filtering & sorting
  // ──────────────────────────────────────────────────────
  const filteredPOs = useMemo(() => {
    let result = purchaseOrders;

    if (searchTerm.trim()) {
      result = result.filter((po) => {
        const vendorName = po.vendorId ? vendorMap[po.vendorId] || "—" : "N/A";
        return (
          (po.poNumber || "")
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          vendorName.toLowerCase().includes(searchTerm.toLowerCase())
        );
      });
    }

    switch (sortBy) {
      case "Ascending":
        return [...result].sort((a, b) =>
          (a.poNumber || "").localeCompare(b.poNumber || "")
        );
      case "Descending":
        return [...result].sort((a, b) =>
          (b.poNumber || "").localeCompare(a.poNumber || "")
        );
      case "Recently Added":
        return [...result].sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );
      case "Order Date Ascending":
        return [...result].sort(
          (a, b) =>
            new Date(a.orderDate || "9999-12-31") -
            new Date(b.orderDate || "9999-12-31")
        );
      case "Order Date Descending":
        return [...result].sort(
          (a, b) =>
            new Date(b.orderDate || "9999-12-31") -
            new Date(a.orderDate || "9999-12-31")
        );
      default:
        return result;
    }
  }, [purchaseOrders, searchTerm, sortBy, vendorMap]);

  const paginatedPOs = filteredPOs;

  // ──────────────────────────────────────────────────────
  // Helpers
  // ──────────────────────────────────────────────────────
  const isDueDateClose = (dueDate) => {
    if (!dueDate) return false;
    const today = new Date();
    const due = new Date(dueDate);
    const diffDays = (due - today) / (1000 * 60 * 60 * 24);
    return diffDays <= 3;
  };

  const getStatusDisplay = (status) => {
    return statuses.includes(status) ? status : "pending";
  };

  // ──────────────────────────────────────────────────────
  // Handlers
  // ──────────────────────────────────────────────────────
  const handleOpenAddPO = () => navigate("/po/add");

  const handleEditClick = (po) => {
    navigate(`/po/${po.id}/edit`, { state: { po } });
  };

  const handleDeleteClick = (poId) => {
    setPOToDelete(poId);
    setShowDeleteModal(true);
  };

  const handleModalClose = () => {
    setPOToDelete(null);
    setShowDeleteModal(false);
  };

  const handleDeletePO = async (poId) => {
    try {
      await deletePurchaseOrder(poId).unwrap();
      handleModalClose();
    } catch (err) {
      message.error(
        `Failed to delete purchase order: ${
          err.data?.message || "Unknown error"
        }`
      );
    }
  };

  const handleStatusChange = async (poId, newStatus) => {
    try {
      await updatePurchaseOrderStatus({ id: poId, status: newStatus }).unwrap();
      setEditingStatusId(null);
    } catch (err) {
      message.error(
        `Failed to update status: ${err.data?.message || "Unknown error"}`
      );
    }
  };

  const handlePageChange = (page, pageSize) => {
    setFilters((prev) => ({
      ...prev,
      page,
      limit: pageSize,
    }));
  };

  const handleClearFilters = () => {
    setFilters({ status: "", page: 1, limit: 10 });
    setSearchTerm("");
    setSortBy("Recently Added");
  };

  const handleOpenDatesModal = (dueDate, followupDates) => {
    setSelectedDates({ dueDate, followupDates: followupDates || [] });
    setShowDatesModal(true);
  };

  const handleCloseDatesModal = () => {
    setShowDatesModal(false);
    setSelectedDates({ dueDate: null, followupDates: [] });
  };

  // ──────────────────────────────────────────────────────
  // Render
  // ──────────────────────────────────────────────────────
  return (
    <div className="page-wrapper">
      <div className="content">
        <div className="card">
          <PageHeader
            title="Purchase Orders"
            subtitle="Manage your Purchase Orders"
            onAdd={handleOpenAddPO}
            tableData={paginatedPOs}
          />

          <div className="card-body">
            {/* ─────── Filters ─────── */}
            <div className="row">
              <div className="col-lg-6">
                <div className="d-flex align-items-center flex-wrap row-gap-3 mb-3">
                  <div className="d-flex align-items-center me-3">
                    <select
                      className="form-select"
                      value={filters.status}
                      onChange={(e) =>
                        setFilters((prev) => ({
                          ...prev,
                          status: e.target.value,
                          page: 1,
                        }))
                      }
                    >
                      <option value="">All Statuses</option>
                      {statuses.map((s) => (
                        <option key={s} value={s}>
                          {s.charAt(0).toUpperCase() + s.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="d-flex align-items-center">
                    <select
                      className="form-select"
                      value={sortBy}
                      onChange={(e) => {
                        setSortBy(e.target.value);
                        setFilters((prev) => ({ ...prev, page: 1 }));
                      }}
                    >
                      {sortOptions.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="col-lg-6">
                <div className="d-flex align-items-center justify-content-lg-end flex-wrap row-gap-3 mb-3">
                  <div className="input-icon-start position-relative me-2">
                    <span className="input-icon-addon">
                      <FaSearch />
                    </span>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Search Purchase Orders"
                      value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setFilters((prev) => ({ ...prev, page: 1 }));
                      }}
                      aria-label="Search purchase orders"
                    />
                  </div>

                  <button
                    className="btn btn-outline-secondary"
                    onClick={handleClearFilters}
                  >
                    Clear Filters
                  </button>
                </div>
              </div>
            </div>

            {/* ─────── Table ─────── */}
            <div className="tab-content">
              {isLoading || isFetching ? (
                <p className="text-center">
                  <Spin />
                </p>
              ) : error ? (
                <p className="text-danger">
                  Error: {error.data?.message || error.message}
                </p>
              ) : paginatedPOs.length === 0 ? (
                <p className="text-muted">
                  No purchase orders match the applied filters
                </p>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>S.No.</th>
                        <th>PO No.</th>
                        <th>STATUS</th>
                        <th>VENDOR</th>
                        <th>TOTAL AMOUNT</th>
                        <th>ORDER DATE</th>
                        <th>EXPECTED DELIVERY</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedPOs.map((po, idx) => {
                        const vendorName = po.vendorId
                          ? vendorMap[po.vendorId] || "Loading..."
                          : "N/A";
                        const status = getStatusDisplay(po.status);
                        const dueDateClass = isDueDateClose(
                          po.expectDeliveryDate
                        )
                          ? "due-date-close"
                          : "";
                        const serialNumber =
                          (filters.page - 1) * filters.limit + idx + 1;

                        return (
                          <tr key={po.id}>
                            <td>{serialNumber}</td>
                            <td>
                              <Link to={`/po/${po.id}`}>{po.poNumber}</Link>
                            </td>

                            {/* ── STATUS (editable) ── */}
                            <td>
                              <PermissionGate
                                api="write"
                                module="Purchase Order Management"
                              >
                                {editingStatusId === po.id ? (
                                  <Select
                                    value={status}
                                    onChange={(v) =>
                                      handleStatusChange(po.id, v)
                                    }
                                    style={{ width: 120 }}
                                    loading={isUpdatingStatus}
                                    autoFocus
                                    onBlur={() => setEditingStatusId(null)}
                                  >
                                    {statuses.map((s) => (
                                      <Option key={s} value={s}>
                                        {s.charAt(0).toUpperCase() + s.slice(1)}
                                      </Option>
                                    ))}
                                  </Select>
                                ) : (
                                  <span
                                    className="priority-badge"
                                    style={{
                                      backgroundColor: "#f2f2f2",
                                      cursor: "pointer",
                                    }}
                                    onClick={() => setEditingStatusId(po.id)}
                                  >
                                    {status.charAt(0).toUpperCase() +
                                      status.slice(1)}
                                    <EditOutlined style={{ marginLeft: 8 }} />
                                  </span>
                                )}
                              </PermissionGate>

                              {/* Fallback if no write permission */}
                              {!editingStatusId && (
                                <PermissionGate
                                  api="view"
                                  module="Purchase Order Management"
                                  fallback={
                                    <span>
                                      {status.charAt(0).toUpperCase() +
                                        status.slice(1)}
                                    </span>
                                  }
                                />
                              )}
                            </td>

                            <td>{vendorName}</td>
                            <td>
                              {po.totalAmount ? `Rs. ${po.totalAmount}` : "—"}
                            </td>
                            <td>
                              {po.orderDate
                                ? new Date(po.orderDate).toLocaleDateString()
                                : "—"}
                            </td>
                            <td>
                              {po.expectDeliveryDate ? (
                                <span
                                  className={`due-date-link ${dueDateClass}`}
                                  style={{
                                    color: "#e31e24",
                                    cursor: "pointer",
                                  }}
                                  onClick={() =>
                                    handleOpenDatesModal(
                                      po.expectDeliveryDate,
                                      po.followupDates
                                    )
                                  }
                                >
                                  {new Date(
                                    po.expectDeliveryDate
                                  ).toLocaleDateString()}
                                </span>
                              ) : (
                                "—"
                              )}
                            </td>

                            {/* ── ACTIONS ── */}
                            <td>
                              <div className="d-flex align-items-center">
                                {/* EDIT */}
                                <PermissionGate
                                  api="edit"
                                  module="purchase_orders"
                                >
                                  <span
                                    onClick={() => handleEditClick(po)}
                                    style={{
                                      cursor: "pointer",
                                      marginRight: 8,
                                    }}
                                    title="Edit PO"
                                  >
                                    <EditOutlined />
                                  </span>
                                </PermissionGate>

                                {/* MORE (Delete) */}
                                <PermissionGate
                                  api="delete"
                                  module="purchase_orders"
                                >
                                  <Dropdown
                                    overlay={
                                      <Menu>
                                        <Menu.Item
                                          key="delete"
                                          onClick={() =>
                                            handleDeleteClick(po.id)
                                          }
                                          style={{ color: "#ff4d4f" }}
                                        >
                                          <DeleteOutlined
                                            style={{ marginRight: 8 }}
                                          />
                                          Delete Purchase Order
                                        </Menu.Item>
                                      </Menu>
                                    }
                                    trigger={["click"]}
                                    placement="bottomRight"
                                  >
                                    <Button
                                      type="text"
                                      icon={<MoreOutlined />}
                                      aria-label="More actions"
                                    />
                                  </Dropdown>
                                </PermissionGate>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>

                  {/* ── ANT DESIGN PAGINATION ── */}
                  {totalCount > filters.limit && (
                    <div className="d-flex justify-content-end mt-4">
                      <Pagination
                        current={filters.page}
                        pageSize={filters.limit}
                        total={totalCount}
                        onChange={handlePageChange}
                        showSizeChanger
                        pageSizeOptions={["10", "20", "50", "100"]}
                        showQuickJumper
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ── Modals ── */}
          {showDeleteModal && (
            <DeleteModal
              isVisible={showDeleteModal}
              item={poToDelete}
              itemType="Purchase Order"
              onConfirm={handleDeletePO}
              onCancel={handleModalClose}
            />
          )}

          {showDatesModal && (
            <DatesModal
              show={showDatesModal}
              onHide={handleCloseDatesModal}
              dueDate={selectedDates.dueDate}
              followupDates={selectedDates.followupDates}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default POWrapper;
