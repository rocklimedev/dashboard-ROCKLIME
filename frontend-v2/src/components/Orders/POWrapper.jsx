import React, { useState, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { message } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import { EditOutlined, DeleteOutlined, MoreOutlined } from "@ant-design/icons";
import { Dropdown, Menu, Button, Select, Pagination } from "antd";
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

  const purchaseOrders = poData?.data || [];
  const totalCount = poData?.pagination?.total || 0;

  // ──────────────────────────────────────────────────────
  // Client-side search & sort (still useful when search is sent to server)
  // ──────────────────────────────────────────────────────
  const filteredPOs = useMemo(() => {
    let result = purchaseOrders;

    // Additional client-side sorting if you want UI consistency
    switch (sortBy) {
      case "Recently Added":
        return [...result].sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );
      case "Ascending":
        return [...result].sort((a, b) =>
          (a.poNumber || "").localeCompare(b.poNumber || "")
        );
      case "Descending":
        return [...result].sort((a, b) =>
          (b.poNumber || "").localeCompare(a.poNumber || "")
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
      message.error(
        `Failed to delete: ${err.data?.message || "Unknown error"}`
      );
    }
  };

  const handleStatusChange = async (poId, newStatus) => {
    try {
      await updatePurchaseOrderStatus({ id: poId, status: newStatus }).unwrap();
      setEditingStatusId(null);
      message.success("Status updated");
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

                      return (
                        <tr key={po.id}>
                          <td>{serialNumber}</td>
                          <td>
                            <Link to={`/po/${po.id}`}>{po.poNumber}</Link>
                          </td>

                          {/* Editable Status */}
                          <td>
                            <PermissionGate
                              api="write"
                              module="Purchase Order Management"
                            >
                              {editingStatusId === po.id ? (
                                <Select
                                  value={status}
                                  onChange={(v) => handleStatusChange(po.id, v)}
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
                                    padding: "4px 8px",
                                    borderRadius: 4,
                                  }}
                                  onClick={() => setEditingStatusId(po.id)}
                                >
                                  {status.charAt(0).toUpperCase() +
                                    status.slice(1)}
                                  <EditOutlined style={{ marginLeft: 8 }} />
                                </span>
                              )}
                            </PermissionGate>

                            {/* View-only fallback */}
                            {editingStatusId !== po.id && (
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
                                style={{ color: "#e31e24", cursor: "pointer" }}
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

                          {/* Actions */}
                          <td>
                            <div className="d-flex align-items-center gap-2">
                              <PermissionGate
                                api="edit"
                                module="purchase_orders"
                              >
                                <EditOutlined
                                  style={{ cursor: "pointer" }}
                                  onClick={() => handleEditClick(po)}
                                  title="Edit"
                                />
                              </PermissionGate>

                              <PermissionGate
                                api="delete"
                                module="purchase_orders"
                              >
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
