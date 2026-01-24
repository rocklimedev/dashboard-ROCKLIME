import React, { useState, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { message, Modal, Spin } from "antd"; // ← added Spin
import {
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  MoreOutlined,
} from "@ant-design/icons";
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

// NEW: Import the user query hook
import { useGetUserByIdQuery } from "../../api/userApi";

const { Option } = Select;

// Restricted Color Palette (unchanged)
const PRIMARY_RED = "#e31e24";
const RED_DARK = "#b71c1c";
const RED_LIGHT = "#ffebee";
const RED_SOFT = "#ef9a9a";
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

  const {
    data: fgsData,
    error,
    isLoading,
  } = useGetAllFGSQuery({
    page: filters.page,
    limit: filters.limit,
  });

  const { data: vendorsData } = useGetVendorsQuery();
  const [deleteFGS] = useDeleteFGSMutation();
  const [updateFGSStatus, { isLoading: isUpdatingStatus }] =
    useUpdateFGSStatusMutation();
  const [convertFgsToPo, { isLoading: isConverting }] =
    useConvertFgsToPoMutation();

  const vendorMap = useMemo(() => {
    if (!vendorsData) return {};
    return vendorsData.reduce((acc, v) => {
      acc[v.id] = v.vendorName || "—";
      return acc;
    }, {});
  }, [vendorsData]);

  const fieldGuidedSheets = fgsData?.data || [];
  const totalCount = fgsData?.pagination?.total || 0;

  // ────────────────────────────────────────────────
  // NEW: Cache user lookups (avoid re-fetching same user many times)
  // ────────────────────────────────────────────────
  const userCache = useMemo(() => {
    const cache = {};
    fieldGuidedSheets.forEach((fgs) => {
      if (fgs.userId && !cache[fgs.userId]) {
        // We use skip to prevent unnecessary queries until needed
        // But in render we'll use the hook conditionally
      }
    });
    return cache;
  }, [fieldGuidedSheets]);

  const getStatusColor = (status) => {
    const base = {
      draft: { bg: LIGHT_GRAY, text: DARK_GRAY },
      negotiating: { bg: RED_LIGHT, text: RED_DARK },
      approved: { bg: "#ffcdd2", text: RED_DARK },
      converted: { bg: "#ef9a9a", text: "#ffffff" },
      cancelled: { bg: "#ffebee", text: RED_DARK },
    };
    return base[status] || { bg: LIGHT_GRAY, text: DARK_GRAY };
  };

  const sortedFGS = useMemo(() => {
    let result = [...fieldGuidedSheets];
    switch (sortBy?.trim()) {
      case "Recently Added":
        return result.sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
        );
      case "Ascending":
        return result.sort((a, b) =>
          (a.fgsNumber || "").localeCompare(b.fgsNumber || ""),
        );
      case "Descending":
        return result.sort((a, b) =>
          (b.fgsNumber || "").localeCompare(a.fgsNumber || ""),
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
  }, [fieldGuidedSheets, sortBy]);

  // ... (handleOpenAddFGS, handleEditClick, handleDeleteClick, etc. unchanged)

  return (
    <div className="page-wrapper">
      <div className="content">
        <div className="card">
          <PageHeader
            title="Field Generated Sheets"
            subtitle="Manage temporary / negotiable purchase drafts"
            onAdd={handleOpenAddFGS}
            tableData={sortedFGS}
          />

          <div className="card-body">
            {/* Filters – unchanged */}
            {/* ... your existing filter row ... */}

            {/* Table */}
            {error ? (
              <div className="text-danger text-center">
                Error: {error.data?.message || "Something went wrong"}
              </div>
            ) : isLoading ? (
              <div className="text-center" style={{ color: DARK_GRAY }}>
                Loading Field Generated Sheets...
              </div>
            ) : sortedFGS.length === 0 ? (
              <p
                className="text-muted text-center"
                style={{ color: DARK_GRAY }}
              >
                No Field Generated Sheets match the applied filters
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
                      {/* NEW COLUMN */}
                      <th style={{ color: DARK_GRAY }}>CREATED BY</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedFGS.map((fgs, idx) => {
                      const vendorName = fgs.vendorId
                        ? vendorMap[fgs.vendorId] || "—"
                        : "N/A";
                      const status = fgs.status || "draft";
                      const { bg: statusBg, text: statusText } =
                        getStatusColor(status);
                      const serialNumber =
                        (filters.page - 1) * filters.limit + idx + 1;
                      const canConvert = status === "approved";

                      // NEW: Fetch user info only when needed
                      const { data: user, isLoading: isUserLoading } =
                        useGetUserByIdQuery(fgs.userId, { skip: !fgs.userId });

                      const createdByDisplay = isUserLoading ? (
                        <Spin size="small" />
                      ) : user ? (
                        user.name || user.email || user.username || "—"
                      ) : fgs.userId ? (
                        "User not found"
                      ) : (
                        "—"
                      );

                      return (
                        <tr key={fgs.id}>
                          <td style={{ color: DARK_GRAY }}>{serialNumber}</td>
                          <td>
                            <Link
                              to={`/fgs/${fgs.id}`}
                              style={{
                                color: PRIMARY_RED,
                                textDecoration: "none",
                              }}
                            >
                              {fgs.fgsNumber}
                            </Link>
                          </td>
                          <td>{/* ... status cell unchanged ... */}</td>
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
                              ? new Date(
                                  fgs.expectDeliveryDate,
                                ).toLocaleDateString()
                              : "—"}
                          </td>

                          {/* NEW: Created By column */}
                          <td style={{ color: DARK_GRAY }}>
                            {createdByDisplay}
                          </td>

                          <td>{/* actions column unchanged */}</td>
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
                      onChange={(page, pageSize) =>
                        setFilters((prev) => ({
                          ...prev,
                          page,
                          limit: pageSize,
                        }))
                      }
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
            itemType="Field Generated Sheet"
            onConfirm={handleDeleteFGS}
            onCancel={() => setShowDeleteModal(false)}
          />
        </div>
      </div>
    </div>
  );
};

export default FGSWrapper;
