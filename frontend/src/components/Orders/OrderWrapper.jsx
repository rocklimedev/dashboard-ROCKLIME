import React, { useState, useMemo, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useGetAllUsersQuery } from "../../api/userApi";
import { useGetAllTeamsQuery } from "../../api/teamApi";
import { useGetCustomersQuery } from "../../api/customerApi";
import {
  useGetAllOrdersQuery,
  useDeleteOrderMutation,
} from "../../api/orderApi";
import { toast } from "sonner";
import { FaSearch } from "react-icons/fa";
import {
  EditOutlined,
  PauseOutlined,
  FileTextOutlined,
  DeleteOutlined,
  MoreOutlined,
} from "@ant-design/icons";
import { Dropdown, Menu, Button } from "antd";
import { Tooltip } from "react-tooltip";
import ShowInvoices from "./ShowInvoices";
import QuotationList from "../Quotation/QuotationList";
import DatesModal from "./DateModal";
import OnHoldModal from "./OnHoldOrder";
import DeleteModal from "../Common/DeleteModal";
import OrderPagination from "./OrderPagination";
import PageHeader from "../Common/PageHeader";
import ComingSoon from "../Common/ComingSoon";
const OrderWrapper = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("orders");
  const [teamMap, setTeamMap] = useState({});
  const [customerMap, setCustomerMap] = useState({});
  const [userMap, setUserMap] = useState({});
  const [showHoldModal, setShowHoldModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderToDelete, setOrderToDelete] = useState(null);
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

  // Fetch data from APIs
  const { data: teamsData } = useGetAllTeamsQuery();
  const { data: customersData } = useGetCustomersQuery();
  const { data: usersData } = useGetAllUsersQuery();
  const {
    data: allData,
    error: allError,
    isLoading: allLoading,
    isFetching: allFetching,
  } = useGetAllOrdersQuery({ page: filters.page, limit: filters.limit });

  const orders = allData?.orders || [];
  const totalCount = allData?.totalCount || 0;
  const isLoading = allLoading;
  const isFetching = allFetching;
  const error = allError;

  // Map teams, customers, and users for quick lookup
  useEffect(() => {
    if (teamsData?.teams) {
      const map = teamsData.teams.reduce((acc, team) => {
        acc[team.id] = team.teamName || "—";
        return acc;
      }, {});
      setTeamMap(map);
    }
  }, [teamsData]);

  useEffect(() => {
    if (customersData?.data) {
      const map = customersData.data.reduce((acc, customer) => {
        acc[customer.customerId] = customer.name || "—";
        return acc;
      }, {});
      setCustomerMap(map);
    }
  }, [customersData]);

  useEffect(() => {
    if (usersData?.users) {
      const map = usersData.users.reduce((acc, user) => {
        acc[user.userId] = user.username || user.name || "—";
        return acc;
      }, {});
      setUserMap(map);
    }
  }, [usersData]);

  const [deleteOrder] = useDeleteOrderMutation();

  // Statuses from backend ENUM
  const statuses = [
    "CREATED",
    "PREPARING",
    "CHECKING",
    "INVOICE",
    "DISPATCHED",
    "DELIVERED",
    "PARTIALLY_DELIVERED",
    "CANCELED",
    "DRAFT",
    "ONHOLD",
  ];

  // Define statuses that are "INVOICE or above"
  const invoiceOrAboveStatuses = [
    "INVOICE",
    "DISPATCHED",
    "DELIVERED",
    "PARTIALLY_DELIVERED",
  ];

  // Priority options from schema
  const priorityOptions = ["All", "high", "medium", "low"];

  // Sort options including date sorting
  const sortOptions = [
    "Recently Added",
    "Ascending",
    "Descending",
    "Due Date Ascending",
    "Due Date Descending",
  ];

  // Filtered and sorted orders
  const filteredOrders = useMemo(() => {
    let result = orders;

    // Apply status filter
    if (filters.status) {
      result = result.filter((ord) => ord.status === filters.status);
    }

    // Apply priority filter
    if (filters.priority) {
      result = result.filter(
        (ord) => ord.priority?.toLowerCase() === filters.priority
      );
    }

    // Apply source filter
    if (filters.source) {
      result = result.filter(
        (ord) => ord.source?.toLowerCase() === filters.source.toLowerCase()
      );
    }

    // Apply search filter
    if (searchTerm.trim()) {
      result = result.filter((ord) => {
        const customerName = ord.createdFor
          ? customerMap[ord.createdFor] || "—"
          : "N/A";
        return (
          ord.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          ord.source?.toLowerCase().includes(searchTerm.toLowerCase())
        );
      });
    }

    // Apply date range filter
    if (dateRange.startDate || dateRange.endDate) {
      result = result.filter((ord) => {
        const orderDate = new Date(ord.createdAt);
        const start = dateRange.startDate
          ? new Date(dateRange.startDate)
          : null;
        const end = dateRange.endDate ? new Date(dateRange.endDate) : null;
        return (!start || orderDate >= start) && (!end || orderDate <= end);
      });
    }

    // Apply sorting
    switch (sortBy) {
      case "Ascending":
        result = [...result].sort((a, b) => a.title.localeCompare(b.title));
        break;
      case "Descending":
        result = [...result].sort((a, b) => b.title.localeCompare(a.title));
        break;
      case "Recently Added":
        result = [...result].sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );
        break;
      case "Due Date Ascending":
        result = [...result].sort(
          (a, b) =>
            new Date(a.dueDate || "9999-12-31") -
            new Date(b.dueDate || "9999-12-31")
        );
        break;
      case "Due Date Descending":
        result = [...result].sort(
          (a, b) =>
            new Date(b.dueDate || "9999-12-31") -
            new Date(a.dueDate || "9999-12-31")
        );
        break;
      default:
        break;
    }

    return result;
  }, [orders, searchTerm, sortBy, filters, dateRange, customerMap]);

  // Paginated orders
  const paginatedOrders = useMemo(() => {
    const startIndex = (filters.page - 1) * filters.limit;
    return filteredOrders.slice(startIndex, startIndex + filters.limit);
  }, [filteredOrders, filters.page, filters.limit]);

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
  const handleOpenAddOrder = () => {
    navigate("/order/add");
  };

  const handleEditClick = (order) => {
    navigate(`/order/${order.id}/edit`, { state: { order } });
  };

  const handleHoldClick = (order) => {
    setSelectedOrder(order);
    setShowHoldModal(true);
  };

  const handleDeleteClick = (orderId) => {
    setOrderToDelete(orderId);
    setShowDeleteModal(true);
  };

  const handleModalClose = () => {
    setSelectedOrder(null);
    setShowHoldModal(false);
    setShowDeleteModal(false);
    setOrderToDelete(null);
  };

  const handleViewInvoice = (order) => {
    window.open(`${order.invoiceLink}`, "_blank");
  };

  const handleDeleteOrder = async (orderId) => {
    try {
      await deleteOrder(orderId).unwrap();
      handleModalClose();
    } catch (err) {
      toast.error(
        `Failed to delete order: ${err.data?.message || "Unknown error"}`
      );
    }
  };

  const handleConfirmHold = () => {
    handleModalClose();
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

  // Helper to get status display
  const getStatusDisplay = (status) => {
    return statuses.includes(status) ? status : "CREATED";
  };

  return (
    <div className="page-wrapper">
      <div className="content">
        {/* Tabs */}
        <ul className="nav nav-tabs mb-4">
          <li className="nav-item">
            <button
              className={`nav-link ${
                activeTab === "quotations" ? "active" : ""
              }`}
              onClick={() => setActiveTab("quotations")}
            >
              Quotations
            </button>
          </li>
          <li className="nav-item">
            <button
              className={`nav-link ${activeTab === "orders" ? "active" : ""}`}
              onClick={() => setActiveTab("orders")}
            >
              Orders
            </button>
          </li>
          <li className="nav-item">
            <button
              className={`nav-link ${activeTab === "po" ? "active" : ""}`}
              onClick={() => setActiveTab("po")}
            >
              PO
            </button>
          </li>
        </ul>

        {activeTab === "orders" ? (
          <div className="card">
            <PageHeader
              title="Orders"
              subtitle="Manage your Orders"
              onAdd={handleOpenAddOrder}
              tableData={paginatedOrders}
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
                        placeholder="Search Orders"
                        value={searchTerm}
                        onChange={(e) => {
                          setSearchTerm(e.target.value);
                          setFilters((prev) => ({ ...prev, page: 1 }));
                        }}
                        aria-label="Search orders"
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
                ) : paginatedOrders.length === 0 ? (
                  <p className="text-muted">
                    No orders match the applied filters
                  </p>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-hover">
                      <thead>
                        <tr>
                          <th>S.No.</th>
                          <th>Order No.</th>
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
                        {paginatedOrders.map((order, index) => {
                          const teamName = order.assignedTo
                            ? teamMap[order.assignedTo] || "—"
                            : "—";
                          const customerName = order.createdFor
                            ? customerMap[order.createdFor] || "Loading..."
                            : "N/A";
                          const createdByName = order.createdBy
                            ? userMap[order.createdBy] || "Loading..."
                            : "N/A";
                          const status = getStatusDisplay(order.status);
                          const dueDateClass = isDueDateClose(order.dueDate)
                            ? "due-date-close"
                            : "";
                          const serialNumber =
                            (filters.page - 1) * filters.limit + index + 1;

                          // Check if "Show Invoice" should be displayed
                          const showInvoiceOption =
                            invoiceOrAboveStatuses.includes(order.status) &&
                            order.invoiceLink &&
                            order.invoiceLink.trim() !== "";

                          return (
                            <tr key={order.id}>
                              <td>{serialNumber}</td>
                              <td>{order.orderNo}</td>
                              <td>
                                <span
                                  className="priority-badge"
                                  style={{ backgroundColor: "#f2f2f2" }}
                                >
                                  {status}
                                </span>
                              </td>
                              <td>
                                <Link to={`/order/${order.id}`}>
                                  {order.title}
                                </Link>
                              </td>
                              <td>{customerName}</td>
                              <td>
                                <span
                                  className={`priority-badge ${
                                    order.priority?.toLowerCase() || "medium"
                                  }`}
                                >
                                  {order.priority || "Medium"}
                                </span>
                              </td>
                              <td>{teamName}</td>
                              <td>{createdByName}</td>
                              <td className={dueDateClass}>
                                {order.dueDate ? (
                                  <span
                                    className="due-date-link"
                                    style={{
                                      color: "#e31e24",
                                      cursor: "pointer",
                                    }}
                                    onClick={() =>
                                      handleOpenDatesModal(
                                        order.dueDate,
                                        order.followupDates || []
                                      )
                                    }
                                  >
                                    {new Date(
                                      order.dueDate
                                    ).toLocaleDateString()}
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
                                        onClick={() => handleEditClick(order)}
                                      >
                                        <EditOutlined
                                          style={{ marginRight: 8 }}
                                        />
                                        Edit Order
                                      </Menu.Item>
                                      {showInvoiceOption && (
                                        <Menu.Item
                                          key="viewInvoice"
                                          onClick={() =>
                                            handleViewInvoice(order)
                                          }
                                        >
                                          <FileTextOutlined
                                            style={{ marginRight: 8 }}
                                          />
                                          Show Invoice
                                        </Menu.Item>
                                      )}
                                      <Menu.Item
                                        key="delete"
                                        onClick={() =>
                                          handleDeleteClick(order.id)
                                        }
                                        style={{ color: "#ff4d4f" }}
                                      >
                                        <DeleteOutlined
                                          style={{ marginRight: 8 }}
                                        />
                                        Delete Order
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
          </div>
        ) : activeTab === "quotations" ? (
          <QuotationList />
        ) : (
          <ComingSoon />
        )}

        {/* Modals */}
        {showHoldModal && (
          <OnHoldModal
            order={selectedOrder}
            invoice={{ amount: selectedOrder?.totalAmount || 0 }}
            onClose={handleModalClose}
            onConfirm={handleConfirmHold}
          />
        )}
        {showDeleteModal && (
          <DeleteModal
            isVisible={showDeleteModal}
            item={orderToDelete}
            itemType="Order"
            onConfirm={handleDeleteOrder}
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
  );
};

export default OrderWrapper;
