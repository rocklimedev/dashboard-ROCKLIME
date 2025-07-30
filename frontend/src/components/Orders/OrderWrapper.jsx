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
import { FaEdit, FaPause, FaFileInvoice, FaTrash } from "react-icons/fa";
import { Tooltip } from "react-tooltip";
import PageHeader from "../Common/PageHeader";
import OrderFilter from "./OrderFilter";
import OrderPagination from "./OrderPagination";
import ShowInvoices from "./ShowInvoices";
import QuotationList from "../Quotation/QuotationList";
import DatesModal from "./DateModal";
import OnHoldModal from "./OnHoldOrder";
import DeleteModal from "../Common/DeleteModal";

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
      filters.status !== "" || filters.priority !== "" || filters.source !== ""
    );
  }, [filters]);

  // Clean filters for API query
  const cleanFilters = useMemo(() => {
    const { status, priority, source, page, limit } = filters;
    return {
      ...(status && { status }),
      ...(priority && { priority }),
      ...(source && { source }),
      page,
      limit,
    };
  }, [filters]);

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
          <>
            <PageHeader
              title="Order"
              subtitle="Manage your Orders, Invoices & Quotations list"
              onAdd={handleOpenAddOrder}
            />
            <div className="orders-section">
              <div className="filter-section mb-4">
                <OrderFilter
                  filters={filters}
                  setFilters={setFilters}
                  onClear={handleClearFilters}
                />
              </div>
              <div className="orders-table-section">
                <div className="border-bottom mb-4 pb-2">
                  <h4>All Orders</h4>
                </div>
                {isLoading || isFetching ? (
                  <div className="text-center">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  </div>
                ) : error ? (
                  <div className="alert alert-danger">
                    Error loading orders:{" "}
                    {error?.data?.message || error?.message || "Unknown error"}
                  </div>
                ) : orders.length > 0 ? (
                  <>
                    <div className="cm-table-wrapper">
                      <table className="cm-table table table-striped">
                        <thead>
                          <tr>
                            <th className="checkbox-column">
                              <input type="checkbox" />
                            </th>
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
                          {orders.map((order) => {
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
                                <td className="checkbox-column">
                                  <input type="checkbox" />
                                </td>
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
                                      order.priority?.toLowerCase() || "medium"
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
                    </div>
                    {totalCount > filters.limit && (
                      <OrderPagination
                        currentPage={filters.page}
                        totalCount={totalCount}
                        pageSize={filters.limit}
                        onPageChange={handlePageChange}
                      />
                    )}
                  </>
                ) : (
                  <p className="no-data text-muted">No orders found.</p>
                )}
              </div>
            </div>
          </>
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
