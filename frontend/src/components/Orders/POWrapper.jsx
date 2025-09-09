// POWrapper.jsx (modified for mock data)
import React, { useState, useMemo, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "sonner";
import { FaSearch } from "react-icons/fa";
import { EditOutlined, DeleteOutlined, MoreOutlined } from "@ant-design/icons";
import { Dropdown, Menu, Button } from "antd";
import DeleteModal from "../Common/DeleteModal";
import OrderPagination from "./OrderPagination";
import PageHeader from "../Common/PageHeader";
import DatesModal from "./DateModal";
import { mockPOs, mockTeams, mockCustomers, mockUsers } from "./mockData"; // Import mock data

const POWrapper = ({ activeTab, setActiveTab }) => {
  const navigate = useNavigate();
  const [teamMap, setTeamMap] = useState({});
  const [customerMap, setCustomerMap] = useState({});
  const [userMap, setUserMap] = useState({});
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
    priority: "",
    source: "",
    page: 1,
    limit: 10,
  });
  const [dateRange, setDateRange] = useState({
    startDate: "",
    endDate: "",
  });

  // Use mock data instead of API hooks
  const allData = mockPOs;
  const teamsData = mockTeams;
  const customersData = mockCustomers;
  const usersData = mockUsers;

  const purchaseOrders = allData?.purchaseOrders || [];
  const totalCount = allData?.totalCount || 0;
  const isLoading = false; // Simulate no loading
  const isFetching = false; // Simulate no fetching
  const error = null; // Simulate no error

  // Mock delete function
  const deletePO = async (poId) => {
    try {
      // Simulate successful deletion
      console.log(`Mock delete PO with ID: ${poId}`);
      return { success: true };
    } catch (err) {
      throw new Error("Mock deletion failed");
    }
  };

  // Map teams, customers, and users for quick lookup
  useEffect(() => {
    if (teamsData?.teams) {
      setTeamMap(
        teamsData.teams.reduce((acc, team) => {
          acc[team.id] = team.teamName || "—";
          return acc;
        }, {})
      );
    }
  }, [teamsData]);

  useEffect(() => {
    if (customersData?.data) {
      setCustomerMap(
        customersData.data.reduce((acc, customer) => {
          acc[customer.customerId] = customer.name || "—";
          return acc;
        }, {})
      );
    }
  }, [customersData]);

  useEffect(() => {
    if (usersData?.users) {
      setUserMap(
        usersData.users.reduce((acc, user) => {
          acc[user.userId] = user.username || user.name || "—";
          return acc;
        }, {})
      );
    }
  }, [usersData]);

  // Statuses for Purchase Orders (adjust based on your backend)
  const statuses = [
    "CREATED",
    "APPROVED",
    "PENDING",
    "FULFILLED",
    "CANCELED",
    "DRAFT",
    "ONHOLD",
  ];

  // Priority options
  const priorityOptions = ["All", "high", "medium", "low"];

  // Sort options
  const sortOptions = [
    "Recently Added",
    "Ascending",
    "Descending",
    "Due Date Ascending",
    "Due Date Descending",
  ];

  // Filtered and sorted purchase orders
  const filteredPOs = useMemo(() => {
    let result = purchaseOrders;

    if (filters.status) {
      result = result.filter((po) => po.status === filters.status);
    }

    if (filters.priority) {
      result = result.filter(
        (po) => po.priority?.toLowerCase() === filters.priority
      );
    }

    if (filters.source) {
      result = result.filter(
        (po) => po.source?.toLowerCase() === filters.source.toLowerCase()
      );
    }

    if (searchTerm.trim()) {
      result = result.filter((po) => {
        const customerName = po.createdFor
          ? customerMap[po.createdFor] || "—"
          : "N/A";
        return (
          po.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          po.source?.toLowerCase().includes(searchTerm.toLowerCase())
        );
      });
    }

    if (dateRange.startDate || dateRange.endDate) {
      result = result.filter((po) => {
        const poDate = new Date(po.createdAt);
        const start = dateRange.startDate
          ? new Date(dateRange.startDate)
          : null;
        const end = dateRange.endDate ? new Date(dateRange.endDate) : null;
        return (!start || poDate >= start) && (!end || poDate <= end);
      });
    }

    switch (sortBy) {
      case "Ascending":
        return [...result].sort((a, b) => a.title.localeCompare(b.title));
      case "Descending":
        return [...result].sort((a, b) => b.title.localeCompare(a.title));
      case "Recently Added":
        return [...result].sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );
      case "Due Date Ascending":
        return [...result].sort(
          (a, b) =>
            new Date(a.dueDate || "9999-12-31") -
            new Date(b.dueDate || "9999-12-31")
        );
      case "Due Date Descending":
        return [...result].sort(
          (a, b) =>
            new Date(b.dueDate || "9999-12-31") -
            new Date(a.dueDate || "9999-12-31")
        );
      default:
        return result;
    }
  }, [purchaseOrders, searchTerm, sortBy, filters, dateRange, customerMap]);

  // Paginated purchase orders
  const paginatedPOs = useMemo(() => {
    const startIndex = (filters.page - 1) * filters.limit;
    return filteredPOs.slice(startIndex, startIndex + filters.limit);
  }, [filteredPOs, filters.page, filters.limit]);

  // Compute filtered state
  const isFiltered = useMemo(() => {
    return (
      filters.status !== "" ||
      filters.priority !== "" ||
      filters.source !== "" ||
      searchTerm.trim() !== "" ||
      dateRange.startDate !== "" ||
      dateRange.endDate !== ""
    );
  }, [filters, searchTerm, dateRange]);

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
      await deletePO(poId).unwrap();
      toast.success("Purchase order deleted successfully");
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
      priority: "",
      source: "",
      page: 1,
      limit: 10,
    });
    setSearchTerm("");
    setSortBy("Recently Added");
    setDateRange({ startDate: "", endDate: "" });
  };

  const handleOpenDatesModal = (dueDate, followupDates) => {
    setSelectedDates({ dueDate, followupDates });
    setShowDatesModal(true);
  };

  const handleCloseDatesModal = () => {
    setShowDatesModal(false);
    setSelectedDates({ dueDate: null, followupDates: [] });
  };

  const handleDateRangeChange = (field) => (e) => {
    setDateRange((prev) => ({
      ...prev,
      [field]: e.target.value,
    }));
    setFilters((prev) => ({ ...prev, page: 1 }));
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
    return statuses.includes(status) ? status : "CREATED";
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
                          {status}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="d-flex align-items-center">
                    <select
                      className="form-select"
                      value={filters.priority}
                      onChange={(e) =>
                        setFilters((prev) => ({
                          ...prev,
                          priority: e.target.value,
                          page: 1,
                        }))
                      }
                    >
                      {priorityOptions.map((priority) => (
                        <option
                          key={priority}
                          value={priority === "All" ? "" : priority}
                        >
                          {priority === "All" ? "All Priorities" : priority}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="d-flex align-items-center ms-3">
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
                <p className="text-danger">Error: {error.message}</p>
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
                        <th>TITLE</th>
                        <th>CUSTOMER</th>
                        <th>PRIORITY</th>
                        <th>ASSIGNED TO</th>
                        <th>CREATED BY</th>
                        <th>DUE DATE</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedPOs.map((po, index) => {
                        const teamName = po.assignedTo
                          ? teamMap[po.assignedTo] || "—"
                          : "—";
                        const customerName = po.createdFor
                          ? customerMap[po.createdFor] || "Loading..."
                          : "N/A";
                        const createdByName = po.createdBy
                          ? userMap[po.createdBy] || "Loading..."
                          : "N/A";
                        const status = getStatusDisplay(po.status);
                        const dueDateClass = isDueDateClose(po.dueDate)
                          ? "due-date-close"
                          : "";
                        const serialNumber =
                          (filters.page - 1) * filters.limit + index + 1;

                        return (
                          <tr key={po.id}>
                            <td>{serialNumber}</td>
                            <td>{po.poNo}</td>
                            <td>
                              <span
                                className="priority-badge"
                                style={{ backgroundColor: "#f2f2f2" }}
                              >
                                {status}
                              </span>
                            </td>
                            <td>
                              <Link to={`/po/${po.id}`}>{po.title}</Link>
                            </td>
                            <td>{customerName}</td>
                            <td>
                              <span
                                className={`priority-badge ${
                                  po.priority?.toLowerCase() || "medium"
                                }`}
                              >
                                {po.priority || "Medium"}
                              </span>
                            </td>
                            <td>{teamName}</td>
                            <td>{createdByName}</td>
                            <td className={dueDateClass}>
                              {po.dueDate ? (
                                <span
                                  className="due-date-link"
                                  style={{
                                    color: "#e31e24",
                                    cursor: "pointer",
                                  }}
                                  onClick={() =>
                                    handleOpenDatesModal(
                                      po.dueDate,
                                      po.followupDates || []
                                    )
                                  }
                                >
                                  {new Date(po.dueDate).toLocaleDateString()}
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
