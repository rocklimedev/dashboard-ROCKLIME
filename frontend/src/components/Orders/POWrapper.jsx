import React, { useState, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { message } from "antd";
import { SearchOutlined, EditOutlined, DeleteOutlined, MoreOutlined } from "@ant-design/icons";
import { Dropdown, Menu, Button, Select, Pagination, Tag } from "antd";
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

// Color palette (same as FGSWrapper)
const PRIMARY_RED = "#e31e24";
const DARK_GRAY = "#333333";
const LIGHT_GRAY = "#f5f5f5";
const BORDER_GRAY = "#d9d9d9";

const POWrapper = ({ activeTab, setActiveTab }) => {
  const navigate = useNavigate();

  // ──────────────────────────────────────────────────────
  // State
  // ──────────────────────────────────────────────────────
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
  const { data: poData, error } = useGetPurchaseOrdersQuery({
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
  // Derived data
  // ──────────────────────────────────────────────────────
  const vendorMap = useMemo(() => {
    if (!vendorsData) return {};
    return vendorsData.reduce((acc, v) => {
      acc[v.id] = v.vendorName || "—";
      return acc;
    }, {});
  }, [vendorsData]);

  const purchaseOrders = poData?.purchaseOrders?.data || [];
  const totalCount = poData?.purchaseOrders?.pagination?.total || 0;

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "#E6EAED";
      case "confirmed":
        return "#E6EAED";
      case "delivered":
        return "#E6EAED";
      case "cancelled":
        return "#E6EAED";
      default:
        return "#E6EAED";
    }
  };

  const getStatusTextColor = (status) => {
    switch (status) {
      case "pending":
        return "#E6EAED";
      case "confirmed":
        return "#E6EAED";
      case "delivered":
        return "#E6EAED";
      case "cancelled":
        return "#E6EAED";
      default:
        return "#E6EAED";
    }
  };

  // ──────────────────────────────────────────────────────
  // Client-side sort
  // ──────────────────────────────────────────────────────
  const filteredPOs = useMemo(() => {
    let result = [...purchaseOrders];

    switch (sortBy?.trim()) {
      case "Recently Added":
        return result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      case "Ascending":
        return result.sort((a, b) => (a.poNumber || "").localeCompare(b.poNumber || ""));
      case "Descending":
        return result.sort((a, b) => (b.poNumber || "").localeCompare(a.poNumber || ""));
      case "Order Date Ascending":
        return result.sort((a, b) => new Date(a.orderDate || "9999-12-31") - new Date(b.orderDate || "9999-12-31"));
      case "Order Date Descending":
        return result.sort((a, b) => new Date(b.orderDate || "9999-12-31") - new Date(a.orderDate || "9999-12-31"));
      default:
        return result;
    }
  }, [purchaseOrders, sortBy]);

  // ──────────────────────────────────────────────────────
  // Helpers
  // ──────────────────────────────────────────────────────
  const isDueDateClose = (dueDate) => {
    if (!dueDate) return false;
    const diffDays = (new Date(dueDate) - new Date()) / (1000 * 60 * 60 * 24);
    return diffDays <= 3;
  };

  const statuses = ["pending", "confirmed", "delivered", "cancelled"];
  const sortOptions = [
    "Recently Added",
    "Ascending",
    "Descending",
    "Order Date Ascending",
    "Order Date Descending",
  ];

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
      message.success("Purchase order deleted successfully");
    } catch (err) {
      message.error(`Failed to delete: ${err.data?.message || "Unknown error"}`);
    }
  };

  const handleStatusChange = async (poId, newStatus) => {
    try {
      await updatePurchaseOrderStatus({ id: poId, status: newStatus }).unwrap();
      setEditingStatusId(null);
      message.success("Status updated");
    } catch (err) {
      message.error(`Failed to update status: ${err.data?.message || "Unknown error"}`);
    }
  };

  const handlePageChange = (page, pageSize) => {
    setFilters((prev) => ({
      ...prev,
      page,
      limit: pageSize || prev.limit,
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
            tableData={filteredPOs}
          />

          <div className="card-body">
            {/* Filters */}
            <div className="row mb-4">
              <div className="col-lg-6">
                <div className="d-flex flex-wrap gap-3 align-items-center">
                  <select
                    className="form-select"
                    style={{ width: "auto" }}
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

                  <select
                    className="form-select"
                    style={{ width: "auto" }}
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

              <div className="col-lg-6">
                <div className="d-flex justify-content-lg-end flex-wrap gap-2">
                  <div className="input-icon-start position-relative me-2">
                    <span className="input-icon-addon">
                      <SearchOutlined />
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

            {/* Table */}
            {error ? (
              <div className="text-danger text-center">
                Error: {error.data?.message || "Something went wrong"}
              </div>
            ) : filteredPOs.length === 0 ? (
              <p className="text-muted text-center">
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
                    {filteredPOs.map((po, idx) => {
                      const vendorName = po.vendorId
                        ? vendorMap[po.vendorId] || "—"
                        : "N/A";
                      const status = po.status || "pending";
                      const dueDateClass = isDueDateClose(po.expectDeliveryDate)
                        ? "due-date-close"
                        : "";
                      const serialNumber =
                        (filters.page - 1) * filters.limit + idx + 1;
                      const hasFgs = !!po.fgsId;

                      return (
                        <tr key={po.id}>
                          <td>{serialNumber}</td>
                          <td>
                            <div className="d-flex align-items-center gap-2">
                              <Link to={`/po/${po.id}`}>{po.poNumber}</Link>
                              {hasFgs && (
                                <Tag
                                  color={PRIMARY_RED}
                                  style={{
                                    fontSize: "11px",
                                    padding: "0 6px",
                                    cursor: "pointer",
                                    borderRadius: "4px",
                                  }}
                                  onClick={() => navigate(`/fgs/${po.fgsId}`)}
                                >
                                  FGS
                                </Tag>
                              )}
                            </div>
                          </td>

                          <td>
                            <PermissionGate
                              api="write"
                              module="purchase_orders"
                            >
                              {editingStatusId === po.id ? (
                                <Select
                                  value={po.status}
                                  onChange={(newStatus) =>
                                    handleStatusChange(po.id, newStatus)
                                  }
                                  style={{ width: 140 }}
                                  loading={isUpdatingStatus}
                                  autoFocus
                                  onBlur={() => setEditingStatusId(null)}
                                  onPressEnter={() => setEditingStatusId(null)}
                                  size="small"
                                >
                                  {statuses.map((s) => (
                                    <Option key={s} value={s}>
                                      {s.charAt(0).toUpperCase() + s.slice(1)}
                                    </Option>
                                  ))}
                                </Select>
                              ) : (
                                <div
                                  className="d-flex align-items-center gap-2"
                                  style={{ cursor: "pointer" }}
                                  onClick={() => setEditingStatusId(po.id)}
                                >
                                  <span
                                    className={`priority-badge status-${po.status}`}
                                    style={{
                                      padding: "4px 10px",
                                      borderRadius: "4px",
                                      fontSize: "13px",
                                      fontWeight: 500,
                                      backgroundColor: getStatusColor(po.status),
                                    }}
                                  >
                                    {po.status
                                      ? po.status.charAt(0).toUpperCase() +
                                        po.status.slice(1)
                                      : "Pending"}
                                  </span>
                                  <EditOutlined
                                    style={{
                                      fontSize: "14px",
                                    }}
                                  />
                                </div>
                              )}
                            </PermissionGate>

                            <PermissionGate
                              api="view"
                              module="purchase_orders"
                              fallback={
                                <span className="priority-badge status-pending">
                                  {po.status
                                    ? po.status.charAt(0).toUpperCase() +
                                      po.status.slice(1)
                                    : "Pending"}
                                </span>
                              }
                            />
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
                                style={{ cursor: "pointer" }}
                                onClick={() =>
                                  handleOpenDatesModal(
                                    po.expectDeliveryDate,
                                    po.followupDates,
                                  )
                                }
                              >
                                {new Date(po.expectDeliveryDate).toLocaleDateString()}
                              </span>
                            ) : (
                              "—"
                            )}
                          </td>

                          <td>
                            <div className="d-flex align-items-center gap-2">
                              <PermissionGate api="edit" module="purchase_orders">
                                <EditOutlined
                                  style={{ cursor: "pointer" }}
                                  onClick={() => handleEditClick(po)}
                                  title="Edit"
                                />
                              </PermissionGate>

                              <PermissionGate api="delete" module="purchase_orders">
                                <Dropdown
                                  overlay={
                                    <Menu>
                                      <Menu.Item
                                        key="delete"
                                        danger
                                        onClick={() => handleDeleteClick(po.id)}
                                      >
                                        <DeleteOutlined /> Delete
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
                    })}
                  </tbody>
                </table>

                {/* Pagination */}
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

          {/* Modals */}
          <DeleteModal
            isVisible={showDeleteModal}
            item={poToDelete}
            itemType="Purchase Order"
            onConfirm={handleDeletePO}
            onCancel={handleModalClose}
          />

          <DatesModal
            show={showDatesModal}
            onHide={handleCloseDatesModal}
            dueDate={selectedDates.dueDate}
            followupDates={selectedDates.followupDates}
          />
        </div>
      </div>
    </div>
  );
};

export default POWrapper;