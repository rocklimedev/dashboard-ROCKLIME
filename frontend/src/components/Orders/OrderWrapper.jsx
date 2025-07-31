import React, { useState, useMemo, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useGetAllUsersQuery } from "../../api/userApi";
import { useGetAllTeamsQuery } from "../../api/teamApi";
import { useGetCustomersQuery } from "../../api/customerApi";
import {
  useGetFilteredOrdersQuery,
  useGetAllOrdersQuery,
  useDeleteOrderMutation,
} from "../../api/orderApi";
import { toast } from "sonner";
import {
  FaEdit,
  FaPause,
  FaFileInvoice,
  FaTrash,
  FaSearch,
} from "react-icons/fa";
import { Tooltip } from "react-tooltip";
import ShowInvoices from "./ShowInvoices";
import QuotationList from "../Quotation/QuotationList";
import DatesModal from "./DateModal";
import OnHoldModal from "./OnHoldOrder";
import DeleteModal from "../Common/DeleteModal";
import OrderPagination from "./OrderPagination";
import PageHeader from "../Common/PageHeader";
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

  // Fetch data from APIs
  const { data: teamsData } = useGetAllTeamsQuery();
  const { data: customersData } = useGetCustomersQuery();
  const { data: usersData } = useGetAllUsersQuery();

  // Compute filtered state
  const isFiltered = useMemo(() => {
    return (
      filters.status !== "" ||
      filters.priority !== "" ||
      filters.source !== "" ||
      searchTerm.trim() !== ""
    );
  }, [filters, searchTerm]);

  // Clean filters for API query
  const cleanFilters = useMemo(() => {
    const { status, priority, source, page, limit } = filters;
    return {
      ...(status && { status }),
      ...(priority && { priority }),
      ...(source && { source }),
      ...(searchTerm && { search: searchTerm }),
      page,
      limit,
    };
  }, [filters, searchTerm]);

  // Fetch orders based on filters
  const {
    data: filteredData,
    error: filteredError,
    isLoading: filteredLoading,
    isFetching: filteredFetching,
  } = useGetFilteredOrdersQuery(cleanFilters, { skip: !isFiltered });

  const {
    data: allData,
    error: allError,
    isLoading: allLoading,
    isFetching: allFetching,
  } = useGetAllOrdersQuery(
    { page: filters.page, limit: filters.limit },
    { skip: isFiltered }
  );

  const orders = isFiltered
    ? filteredData?.orders || []
    : allData?.orders || [];
  const totalCount = isFiltered
    ? filteredData?.totalCount || 0
    : allData?.totalCount || 0;
  const isLoading = isFiltered ? filteredLoading : allLoading;
  const isFetching = isFiltered ? filteredFetching : allFetching;
  const error = isFiltered ? filteredError : allError;

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

  // Memoized grouped orders for tab-based filtering
  const groupedOrders = useMemo(
    () => ({
      All: orders,
      Completed: orders.filter((ord) => ord.status === "COMPLETED"),
      Pending: orders.filter((ord) => ord.status === "PENDING"),
      OnHold: orders.filter((ord) => ord.status === "ON_HOLD"),
    }),
    [orders]
  );

  // Filtered and sorted orders
  const filteredOrders = useMemo(() => {
    let result = groupedOrders[filters.status || "All"] || [];

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

    // Apply priority filter
    if (filters.priority) {
      result = result.filter(
        (ord) => ord.priority?.toLowerCase() === filters.priority.toLowerCase()
      );
    }

    // Apply source filter
    if (filters.source) {
      result = result.filter(
        (ord) => ord.source?.toLowerCase() === filters.source.toLowerCase()
      );
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
      default:
        break;
    }

    return result;
  }, [
    groupedOrders,
    filters.status,
    filters.priority,
    filters.source,
    searchTerm,
    sortBy,
    customerMap,
  ]);

  // Paginated orders
  const paginatedOrders = useMemo(() => {
    const startIndex = (filters.page - 1) * filters.limit;
    return filteredOrders.slice(startIndex, startIndex + filters.limit);
  }, [filteredOrders, filters.page, filters.limit]);

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
    const invoiceId = order.invoiceId;
    if (invoiceId) {
      window.open(`/invoice/${invoiceId}`, "_blank");
    } else {
      toast.error("No invoice associated with this order.");
    }
  };

  const handleDeleteOrder = async (orderId) => {
    try {
      await deleteOrder(orderId).unwrap();
      toast.success("Order deleted successfully!");
      handleModalClose();
    } catch (err) {
      toast.error(
        `Failed to delete order: ${err.data?.message || "Unknown error"}`
      );
    }
  };

  const handleConfirmHold = () => {
    handleModalClose();
    toast.success("Order placed on hold!");
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
    toast.success("Filters cleared!");
  };

  const handleOpenDatesModal = (dueDate, followupDates) => {
    setSelectedDates({ dueDate, followupDates });
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

  return (
    <div className="page-wrapper">
      <div className="content">
        {/* Tabs */}
        <ul className="nav nav-tabs mb-4">
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
              className={`nav-link ${activeTab === "invoices" ? "active" : ""}`}
              onClick={() => setActiveTab("invoices")}
            >
              Invoices
            </button>
          </li>
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
        </ul>

        {activeTab === "orders" ? (
          <div className="card">
            <PageHeader
              title="Orders"
              subtitle="Manage your Orders"
              onAdd={handleOpenAddOrder}
            />

            <div className="card-body">
              <div className="row">
                <div className="col-lg-4">
                  <div className="d-flex align-items-center flex-wrap row-gap-3 mb-3">
                    <h6 className="me-2">Status</h6>
                    <ul
                      className="nav nav-pills border d-inline-flex p-1 rounded bg-light todo-tabs"
                      id="pills-tab"
                      role="tablist"
                    >
                      {Object.keys(groupedOrders).map((status) => (
                        <li
                          className="nav-item"
                          role="presentation"
                          key={status}
                        >
                          <button
                            className={`nav-link btn btn-sm btn-icon py-3 d-flex align-items-center justify-content-center w-auto ${
                              (filters.status || "All") === status
                                ? "active"
                                : ""
                            }`}
                            id={`tab-${status}`}
                            data-bs-toggle="pill"
                            data-bs-target={`#pills-${status}`}
                            type="button"
                            role="tab"
                            aria-selected={(filters.status || "All") === status}
                            onClick={() =>
                              setFilters((prev) => ({
                                ...prev,
                                status: status === "All" ? "" : status,
                              }))
                            }
                          >
                            {status} ({groupedOrders[status].length})
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                <div className="col-lg-8">
                  <div className="d-flex align-items-center justify-content-lg-end flex-wrap row-gap-3 mb-3">
                    <div className="d-flex align-items-center border p-2 rounded">
                      <span className="d-inline-flex me-2">Sort By: </span>
                      <div className="dropdown">
                        <a
                          href="#"
                          className="dropdown-toggle btn btn-white d-inline-flex align-items-center border-0 bg-transparent p-0 text-dark"
                          data-bs-toggle="dropdown"
                          aria-expanded="false"
                        >
                          {sortBy}
                        </a>
                        <ul className="dropdown-menu dropdown-menu-end p-3">
                          {["Recently Added", "Ascending", "Descending"].map(
                            (option) => (
                              <li key={option}>
                                <a
                                  href="#"
                                  className="dropdown-item rounded-1"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    setSortBy(option);
                                  }}
                                >
                                  {option}
                                </a>
                              </li>
                            )
                          )}
                        </ul>
                      </div>
                    </div>
                    <div className="input-icon-start position-relative">
                      <span className="input-icon-addon">
                        <FaSearch />
                      </span>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Search Orders"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        aria-label="Search orders"
                      />
                    </div>
                    <button
                      className="btn btn-outline-secondary ms-2"
                      onClick={handleClearFilters}
                    >
                      Clear Filters
                    </button>
                  </div>
                </div>
              </div>
              <div className="tab-content" id="pills-tabContent">
                {Object.entries(groupedOrders).map(([status, list]) => (
                  <div
                    className={`tab-pane fade ${
                      (filters.status || "All") === status ? "show active" : ""
                    }`}
                    id={`pills-${status}`}
                    role="tabpanel"
                    aria-labelledby={`tab-${status}`}
                    key={status}
                  >
                    {paginatedOrders.length === 0 ? (
                      <p className="text-muted">
                        No {status.toLowerCase()} orders match the applied
                        filters
                      </p>
                    ) : (
                      <div className="table-responsive">
                        <table className="table table-hover">
                          <thead>
                            <tr>
                              <th>STATUS</th>
                              <th>TITLE</th>
                              <th>CUSTOMER</th>
                              <th>PRIORITY</th>
                              <th>TEAM</th>
                              <th>SOURCE</th>
                              <th>CREATED BY</th>
                              <th>CREATED AT</th>
                              <th>DUE DATE</th>
                              <th>ACTIONS</th>
                            </tr>
                          </thead>
                          <tbody>
                            {paginatedOrders.map((order) => {
                              const teamName = order.assignedTo
                                ? teamMap[order.assignedTo] || "—"
                                : "—";
                              const customerName = order.createdFor
                                ? customerMap[order.createdFor] || "Loading..."
                                : "N/A";
                              const createdByName = order.createdBy
                                ? userMap[order.createdBy] || "Loading..."
                                : "N/A";
                              const statusClass = order.status
                                ? order.status.toLowerCase().replace("_", "-")
                                : "";
                              const dueDateClass = isDueDateClose(order.dueDate)
                                ? "due-date-close"
                                : "";

                              return (
                                <tr key={order.id}>
                                  <td>
                                    <span
                                      className={`status-badge ${statusClass}`}
                                    >
                                      {order.status || "CREATED"}
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
                                        order.priority?.toLowerCase() ||
                                        "medium"
                                      }`}
                                    >
                                      {order.priority || "Medium"}
                                    </span>
                                  </td>
                                  <td>{teamName}</td>
                                  <td>{order.source || "—"}</td>
                                  <td>{createdByName}</td>
                                  <td>
                                    {order.createdAt
                                      ? new Date(
                                          order.createdAt
                                        ).toLocaleDateString()
                                      : "—"}
                                  </td>
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
                                  <td className="action-column">
                                    <div className="action-buttons d-flex gap-2">
                                      <button
                                        className="btn btn-icon btn-sm btn-outline-primary"
                                        onClick={() => handleEditClick(order)}
                                        data-tooltip-id={`edit-${order.id}`}
                                        data-tooltip-content="Edit Order"
                                      >
                                        <FaEdit />
                                      </button>
                                      <button
                                        className="btn btn-icon btn-sm btn-outline-warning"
                                        onClick={() => handleHoldClick(order)}
                                        data-tooltip-id={`hold-${order.id}`}
                                        data-tooltip-content="Put Order on Hold"
                                      >
                                        <FaPause />
                                      </button>
                                      <button
                                        className="btn btn-icon btn-sm btn-outline-info"
                                        onClick={() => handleViewInvoice(order)}
                                        data-tooltip-id={`invoice-${order.id}`}
                                        data-tooltip-content="View Invoice"
                                      >
                                        <FaFileInvoice />
                                      </button>
                                      <button
                                        className="btn btn-icon btn-sm btn-outline-danger"
                                        onClick={() =>
                                          handleDeleteClick(order.id)
                                        }
                                        data-tooltip-id={`delete-${order.id}`}
                                        data-tooltip-content="Delete Order"
                                      >
                                        <FaTrash />
                                      </button>
                                      <Tooltip id={`edit-${order.id}`} />
                                      <Tooltip id={`hold-${order.id}`} />
                                      <Tooltip id={`invoice-${order.id}`} />
                                      <Tooltip id={`delete-${order.id}`} />
                                    </div>
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
                ))}
              </div>
            </div>
          </div>
        ) : activeTab === "invoices" ? (
          <ShowInvoices />
        ) : (
          <QuotationList />
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
