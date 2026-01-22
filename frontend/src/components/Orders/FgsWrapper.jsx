import React, { useState, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { message, Modal } from "antd";
import { SearchOutlined, EditOutlined, DeleteOutlined, MoreOutlined } from "@ant-design/icons";
import { Dropdown, Menu, Button, Select, Pagination } from "antd";
import DeleteModal from "../Common/DeleteModal";
import PageHeader from "../Common/PageHeader";
import PermissionGate from "../../context/PermissionGate";

import {
  useGetAllFGSQuery,
  useDeleteFGSMutation,
  useUpdateFGSStatusMutation,
  useConvertFgsToPoMutation,
} from "../../api/fgsApi";

import { useGetVendorsQuery } from "../../api/poApi";

const { Option } = Select;

// Restricted Color Palette (only red shades + grays)
const PRIMARY_RED = "#e31e24";
const RED_DARK = "#b71c1c";     // darker red for emphasis
const RED_LIGHT = "#ffebee";    // very light red tint for backgrounds
const RED_SOFT = "#ef9a9a";     // softer red for badges/hovers
const DARK_GRAY = "#333333";
const MEDIUM_GRAY = "#666666";
const LIGHT_GRAY = "#f5f5f5";
const BORDER_GRAY = "#d9d9d9";

const FGSWrapper = ({ activeTab, setActiveTab }) => {
  const navigate = useNavigate();

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [fgsToDelete, setFGSToDelete] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("Recently Added");
  const [filters, setFilters] = useState({
    status: "",
    page: 1,
    limit: 10,
  });
  const [editingStatusId, setEditingStatusId] = useState(null);

  const { data: fgsData, error, isLoading } = useGetAllFGSQuery({
    page: filters.page,
    limit: filters.limit,
  });

  const { data: vendorsData } = useGetVendorsQuery();
  const [deleteFGS] = useDeleteFGSMutation();
  const [updateFGSStatus, { isLoading: isUpdatingStatus }] = useUpdateFGSStatusMutation();
  const [convertFgsToPo, { isLoading: isConverting }] = useConvertFgsToPoMutation();

  const vendorMap = useMemo(() => {
    if (!vendorsData) return {};
    return vendorsData.reduce((acc, v) => {
      acc[v.id] = v.vendorName || "—";
      return acc;
    }, {});
  }, [vendorsData]);

  const fieldGuidedSheets = fgsData?.data || [];
  const totalCount = fgsData?.pagination?.total || 0;

  // All status colors now based on red shades + grays
  const getStatusColor = (status) => {
    const base = {
      draft: { bg: LIGHT_GRAY, text: DARK_GRAY },
      negotiating: { bg: RED_LIGHT, text: RED_DARK },
      approved: { bg: "#ffcdd2", text: RED_DARK },      // light red tint
      converted: { bg: "#ef9a9a", text: "#ffffff" },    // medium red, white text
      cancelled: { bg: "#ffebee", text: RED_DARK },
    };
    return base[status] || { bg: LIGHT_GRAY, text: DARK_GRAY };
  };

  const sortedFGS = useMemo(() => {
    let result = [...fieldGuidedSheets];
    switch (sortBy?.trim()) {
      case "Recently Added":
        return result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      case "Ascending":
        return result.sort((a, b) => (a.fgsNumber || "").localeCompare(b.fgsNumber || ""));
      case "Descending":
        return result.sort((a, b) => (b.fgsNumber || "").localeCompare(a.fgsNumber || ""));
      case "Order Date Ascending":
        return result.sort((a, b) => new Date(a.orderDate) - new Date(b.orderDate));
      case "Order Date Descending":
        return result.sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate));
      default:
        return result;
    }
  }, [fieldGuidedSheets, sortBy]);

  const handleOpenAddFGS = () => navigate("/fgs/add");

  const handleEditClick = (fgs) => {
    navigate(`/fgs/${fgs.id}/edit`, { state: { fgs } });
  };

  const handleDeleteClick = (fgsId) => {
    setFGSToDelete(fgsId);
    setShowDeleteModal(true);
  };

  const handleModalClose = () => {
    setFGSToDelete(null);
    setShowDeleteModal(false);
  };

  const handleDeleteFGS = async (fgsId) => {
    try {
      await deleteFGS(fgsId).unwrap();
      handleModalClose();
      message.success("Field Guided Sheet deleted successfully");
    } catch (err) {
      message.error(`Failed to delete: ${err.data?.message || "Unknown error"}`);
    }
  };

  const handleStatusChange = async (fgsId, newStatus) => {
    try {
      await updateFGSStatus({ id: fgsId, status: newStatus }).unwrap();
      setEditingStatusId(null);
      message.success("Status updated");
    } catch (err) {
      message.error(`Failed to update status: ${err.data?.message || "Unknown error"}`);
    }
  };

  const handleConvertToPO = (fgsId, fgsNumber) => {
    Modal.confirm({
      title: "Convert to Purchase Order?",
      content: `Are you sure you want to convert FGS #${fgsNumber} to a Purchase Order? This action cannot be undone.`,
      okText: "Convert",
      okType: "primary",
      okButtonProps: { 
        danger: true, 
        style: { backgroundColor: PRIMARY_RED, borderColor: PRIMARY_RED } 
      },
      cancelText: "Cancel",
      onOk: async () => {
        try {
          const result = await convertFgsToPo(fgsId).unwrap();
          message.success(`Converted successfully! New PO: ${result.purchaseOrder?.poNumber || "Generated"}`);
        } catch (err) {
          message.error(`Conversion failed: ${err.data?.message || "Unknown error"}`);
        }
      },
    });
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

  return (
    <div className="page-wrapper">
      <div className="content">
        <div className="card">
          <PageHeader
            title="Field Guided Sheets"
            subtitle="Manage temporary / negotiable purchase drafts"
            onAdd={handleOpenAddFGS}
            tableData={sortedFGS}
          />

          <div className="card-body">
            {/* Filters */}
            <div className="row mb-4">
              <div className="col-lg-6">
                <div className="d-flex flex-wrap gap-3 align-items-center">
                  <select
                    className="form-select"
                    style={{ width: "auto", borderColor: BORDER_GRAY, color: DARK_GRAY }}
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
                    {["draft", "negotiating", "approved", "converted", "cancelled"].map((s) => (
                      <option key={s} value={s}>
                        {s.charAt(0).toUpperCase() + s.slice(1)}
                      </option>
                    ))}
                  </select>

                  <select
                    className="form-select"
                    style={{ width: "auto", borderColor: BORDER_GRAY, color: DARK_GRAY }}
                    value={sortBy}
                    onChange={(e) => {
                      setSortBy(e.target.value);
                      setFilters((prev) => ({ ...prev, page: 1 }));
                    }}
                  >
                    {[
                      "Recently Added",
                      "Ascending",
                      "Descending",
                      "Order Date Ascending",
                      "Order Date Descending",
                    ].map((opt) => (
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
                      <SearchOutlined style={{ color: DARK_GRAY }} />
                    </span>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Search FGS..."
                      value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setFilters((prev) => ({ ...prev, page: 1 }));
                      }}
                      style={{ borderColor: BORDER_GRAY, color: DARK_GRAY }}
                    />
                  </div>

                  <button
                    className="btn btn-outline-secondary"
                    style={{ borderColor: DARK_GRAY, color: DARK_GRAY }}
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
            ) : isLoading ? (
              <div className="text-center" style={{ color: DARK_GRAY }}>
                Loading Field Guided Sheets...
              </div>
            ) : sortedFGS.length === 0 ? (
              <p className="text-muted text-center" style={{ color: DARK_GRAY }}>
                No Field Guided Sheets match the applied filters
              </p>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead style={{ backgroundColor: LIGHT_GRAY }}>
                    <tr>
                      <th style={{ color: DARK_GRAY }}>S.No.</th>
                      <th style={{ color: DARK_GRAY }}>FGS No.</th>
                      <th style={{ color: DARK_GRAY }}>STATUS</th>
                      <th style={{ color: DARK_GRAY }}>VENDOR</th>
                      <th style={{ color: DARK_GRAY }}>TOTAL AMOUNT</th>
                      <th style={{ color: DARK_GRAY }}>ORDER DATE</th>
                      <th style={{ color: DARK_GRAY }}>EXPECTED DELIVERY</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedFGS.map((fgs, idx) => {
                      const vendorName = fgs.vendorId
                        ? vendorMap[fgs.vendorId] || "—"
                        : "N/A";
                      const status = fgs.status || "draft";
                      const { bg: statusBg, text: statusText } = getStatusColor(status);
                      const serialNumber = (filters.page - 1) * filters.limit + idx + 1;
                      const canConvert = status === "approved";

                      return (
                        <tr key={fgs.id}>
                          <td style={{ color: DARK_GRAY }}>{serialNumber}</td>
                          <td>
                            <Link
                              to={`/fgs/${fgs.id}`}
                              style={{ color: PRIMARY_RED, textDecoration: "none" }}
                            >
                              {fgs.fgsNumber}
                            </Link>
                          </td>

                          <td>
                            <PermissionGate api="write" module="field_guided_sheets">
                              {editingStatusId === fgs.id ? (
                                <Select
                                  value={fgs.status}
                                  onChange={(newStatus) => handleStatusChange(fgs.id, newStatus)}
                                  style={{ width: 140 }}
                                  loading={isUpdatingStatus}
                                  autoFocus
                                  onBlur={() => setEditingStatusId(null)}
                                  size="small"
                                >
                                  {["draft", "negotiating", "approved", "converted", "cancelled"].map((s) => (
                                    <Option key={s} value={s}>
                                      {s.charAt(0).toUpperCase() + s.slice(1)}
                                    </Option>
                                  ))}
                                </Select>
                              ) : (
                                <div
                                  className="d-flex align-items-center gap-2"
                                  style={{ cursor: "pointer" }}
                                  onClick={() => setEditingStatusId(fgs.id)}
                                >
                                  <span
                                    className={`priority-badge status-${status}`}
                                    style={{
                                      padding: "4px 10px",
                                      borderRadius: "4px",
                                      fontSize: "13px",
                                      fontWeight: 500,
                                      backgroundColor: statusBg,
                                      color: statusText,
                                      border: `1px solid ${RED_SOFT}`,
                                    }}
                                  >
                                    {status.charAt(0).toUpperCase() + status.slice(1)}
                                  </span>
                                  <EditOutlined
                                    style={{ fontSize: "14px", color: PRIMARY_RED }}
                                  />
                                </div>
                              )}
                            </PermissionGate>

                            <PermissionGate
                              api="view"
                              module="field_guided_sheets"
                              fallback={
                                <span
                                  className={`priority-badge status-${status}`}
                                  style={{
                                    padding: "4px 10px",
                                    borderRadius: "4px",
                                    fontSize: "13px",
                                    fontWeight: 500,
                                    backgroundColor: statusBg,
                                    color: statusText,
                                  }}
                                >
                                  {status.charAt(0).toUpperCase() + status.slice(1)}
                                </span>
                              }
                            />
                          </td>

                          <td style={{ color: DARK_GRAY }}>{vendorName}</td>
                          <td style={{ color: DARK_GRAY }}>
                            {fgs.totalAmount ? `Rs. ${fgs.totalAmount}` : "—"}
                          </td>
                          <td style={{ color: DARK_GRAY }}>
                            {fgs.orderDate
                              ? new Date(fgs.orderDate).toLocaleDateString()
                              : "—"}
                          </td>
                          <td style={{ color: DARK_GRAY }}>
                            {fgs.expectDeliveryDate
                              ? new Date(fgs.expectDeliveryDate).toLocaleDateString()
                              : "—"}
                          </td>

                          <td>
                            <div className="d-flex align-items-center gap-2">
                              <PermissionGate api="edit" module="field_guided_sheets">
                                <EditOutlined
                                  style={{ cursor: "pointer", color: PRIMARY_RED }}
                                  onClick={() => handleEditClick(fgs)}
                                  title="Edit"
                                />
                              </PermissionGate>

                              <PermissionGate api="delete" module="field_guided_sheets">
                                <Dropdown
                                  overlay={
                                    <Menu>
                                      <Menu.Item
                                        key="delete"
                                        danger
                                        onClick={() => handleDeleteClick(fgs.id)}
                                        icon={<DeleteOutlined style={{ color: PRIMARY_RED }} />}
                                      >
                                        Delete
                                      </Menu.Item>

                                      {canConvert && (
                                        <Menu.Item
                                          key="convert"
                                          onClick={() => handleConvertToPO(fgs.id, fgs.fgsNumber)}
                                          icon={<span style={{ color: PRIMARY_RED }}>→</span>}
                                          style={{ color: PRIMARY_RED }}
                                        >
                                          Convert to PO
                                        </Menu.Item>
                                      )}
                                    </Menu>
                                  }
                                  trigger={["click"]}
                                >
                                  <Button
                                    type="text"
                                    icon={<MoreOutlined style={{ color: DARK_GRAY }} />}
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

          <DeleteModal
            isVisible={showDeleteModal}
            item={fgsToDelete}
            itemType="Field Guided Sheet"
            onConfirm={handleDeleteFGS}
            onCancel={handleModalClose}
          />
        </div>
      </div>
    </div>
  );
};

export default FGSWrapper;