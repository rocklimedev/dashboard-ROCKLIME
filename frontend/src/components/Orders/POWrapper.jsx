// src/components/POWrapper.jsx
import React, { useState, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "sonner";
import { FaSearch } from "react-icons/fa";
import { EditOutlined, DeleteOutlined, MoreOutlined } from "@ant-design/icons";
import { Dropdown, Menu, Button } from "antd";
import DeleteModal from "../Common/DeleteModal";
import OrderPagination from "./OrderPagination";
import PageHeader from "../Common/PageHeader";
import DatesModal from "./DateModal";
import {
  useGetPurchaseOrdersQuery,
  useDeletePurchaseOrderMutation,
  useGetVendorsQuery,
} from "../../api/poApi"; // Import RTK Query hooks

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

  // Fetch purchase orders and vendors using RTK Query
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

  // Map vendors for quick lookup
  const vendorMap = useMemo(() => {
    if (!vendorsData) return {};
    return vendorsData.reduce((acc, vendor) => {
      acc[vendor.id] = vendor.vendorName || "—";
      return acc;
    }, {});
  }, [vendorsData]);

  const purchaseOrders = poData?.purchaseOrders || [];
  const totalCount = poData?.totalCount || 0;

  // Statuses aligned with backend model
  const statuses = ["pending", "confirmed", "delivered", "cancelled"];

  // Sort options
  const sortOptions = [
    "Recently Added",
    "Ascending",
    "Descending",
    "Order Date Ascending",
    "Order Date Descending",
  ];

  // Filtered purchase orders (client-side filtering for search and sort)
  const filteredPOs = useMemo(() => {
    let result = purchaseOrders;

    if (searchTerm.trim()) {
      result = result.filter((po) => {
        const vendorName = po.vendorId ? vendorMap[po.vendorId] || "—" : "N/A";
        return (
          (po.orderNumber || "")
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          vendorName.toLowerCase().includes(searchTerm.toLowerCase())
        );
      });
    }

    switch (sortBy) {
      case "Ascending":
        return [...result].sort((a, b) => {
          const aOrder = a.orderNumber || "";
          const bOrder = b.orderNumber || "";
          return aOrder.localeCompare(bOrder);
        });
      case "Descending":
        return [...result].sort((a, b) => {
          const aOrder = a.orderNumber || "";
          const bOrder = b.orderNumber || "";
          return bOrder.localeCompare(aOrder);
        });
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
  // Paginated purchase orders (handled by backend)
  const paginatedPOs = filteredPOs;

  // Compute filtered state
  const isFiltered = useMemo(() => {
    return filters.status !== "" || searchTerm.trim() !== "";
  }, [filters, searchTerm]);

  // Handlers
  const handleOpenAddPO = () => {
    navigate("/po/add");
  };

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
      toast.error(
        `Failed to delete purchase order: ${
          err.data?.message || "Unknown error"
        }`
      );
    }
  };

  const handlePageChange = (page) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  const handleClearFilters = () => {
    setFilters({
      status: "",
      page: 1,
      limit: 10,
    });
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

  const isDueDateClose = (dueDate) => {
    if (!dueDate) return false;
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due - today;
    const diffDays = diffTime / (1000 * 60 * 60 * 24);
    return diffDays <= 3;
  };

  const getStatusDisplay = (status) => {
    return statuses.includes(status) ? status : "pending";
  };

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
                      {statuses.map((status) => (
                        <option key={status} value={status}>
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="d-flex align-items-center">
                    <select
                      className="form-select"
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                    >
                      {sortOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
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
            <div className="tab-content">
              {isLoading || isFetching ? (
                <p>Loading...</p>
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
                      {paginatedPOs.map((po, index) => {
                        const vendorName = po.vendorId
                          ? vendorMap[po.vendorId] || "Loading..."
                          : "N/A";
                        const status = getStatusDisplay(po.status);
                        const dueDateClass = isDueDateClose(
                          po.expectedDeliveryDate
                        )
                          ? "due-date-close"
                          : "";
                        const serialNumber =
                          (filters.page - 1) * filters.limit + index + 1;

                        return (
                          <tr key={po.id}>
                            <td>{serialNumber}</td>
                            <td>
                              <Link to={`/po/${po.id}`}>{po.poNumber}</Link>
                            </td>
                            <td>
                              <span
                                className="priority-badge"
                                style={{ backgroundColor: "#f2f2f2" }}
                              >
                                {status.charAt(0).toUpperCase() +
                                  status.slice(1)}
                              </span>
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
                                  className="due-date-link"
                                  style={{
                                    color: "#e31e24",
                                    cursor: "pointer",
                                  }}
                                >
                                  {po.expectDeliveryDate
                                    ? new Date(
                                        po.expectDeliveryDate
                                      ).toLocaleDateString()
                                    : "—"}
                                </span>
                              ) : (
                                "—"
                              )}
                            </td>
                            <td>
                              <Dropdown
                                overlay={
                                  <Menu>
                                    <Menu.Item
                                      key="edit"
                                      onClick={() => handleEditClick(po)}
                                    >
                                      <EditOutlined
                                        style={{ marginRight: 8 }}
                                      />
                                      Edit Purchase Order
                                    </Menu.Item>
                                    <Menu.Item
                                      key="delete"
                                      onClick={() => handleDeleteClick(po.id)}
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
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  {totalCount > filters.limit && (
                    <div className="pagination-section mt-4">
                      <OrderPagination
                        currentPage={filters.page}
                        totalCount={totalCount}
                        pageSize={filters.limit}
                        onPageChange={handlePageChange}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Modals */}
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
