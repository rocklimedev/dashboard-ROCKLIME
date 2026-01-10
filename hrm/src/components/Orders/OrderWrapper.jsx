import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  useGetAllOrdersQuery,
  useDeleteOrderMutation,
  useUpdateOrderStatusMutation,
} from "../../api/orderApi";
import { useGetAllTeamsQuery } from "../../api/teamApi";
import { useGetAllUsersQuery } from "../../api/userApi";
import { useGetAllQuotationsQuery } from "../../api/quotationApi";
import {
  message,
  Input,
  Button,
  Select,
  Pagination,
  Dropdown,
  Menu,
} from "antd";
import {
  SearchOutlined,
  EditOutlined,
  FileTextOutlined,
  DeleteOutlined,
  MoreOutlined,
} from "@ant-design/icons";
import DatesModal from "./DateModal";
import DeleteModal from "../Common/DeleteModal";
import PageHeader from "../Common/PageHeader";
import { useAuth } from "../../context/AuthContext";

const { Option } = Select;

const OrderWrapper = () => {
  const navigate = useNavigate();
  const { auth } = useAuth();
  const permissions = auth?.permissions || [];

  const canEditOrder = permissions.some(
    (p) => p.action === "edit" && p.module === "orders"
  );
  const canDeleteOrder = permissions.some(
    (p) => p.action === "delete" && p.module === "orders"
  );
  const canUpdateOrderStatus = permissions.some(
    (p) => p.action === "write" && p.module === "orders"
  );

  // State
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [filters, setFilters] = useState({
    status: "",
    priority: "",
  });
  const [sortBy, setSortBy] = useState("Recently Added");

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState(null);
  const [showDatesModal, setShowDatesModal] = useState(false);
  const [selectedDates, setSelectedDates] = useState({
    dueDate: null,
    followupDates: [],
  });

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch Orders with server-side pagination + search
  const {
    data: response,
    error,
    isLoading,
    isFetching,
  } = useGetAllOrdersQuery({
    page: currentPage,
    limit: pageSize,
    search: debouncedSearch || undefined,
    status: filters.status || undefined,
    priority: filters.priority || undefined,
  });

  const orders = response?.data || [];
  const pagination = response?.pagination || {
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 0,
  };

  // Fetch supporting data
  const { data: teamsData } = useGetAllTeamsQuery();
  const { data: usersData } = useGetAllUsersQuery();
  const { data: quotationsData } = useGetAllQuotationsQuery();

  const [deleteOrder] = useDeleteOrderMutation();
  const [updateOrderStatus] = useUpdateOrderStatusMutation();

  // Build lookup maps
  const teamMap = useMemo(() => {
    if (!teamsData?.teams) return {};
    return teamsData.teams.reduce((acc, t) => {
      acc[t.id] = t.teamName || "—";
      return acc;
    }, {});
  }, [teamsData]);

  const userMap = useMemo(() => {
    if (!usersData?.users) return {};
    return usersData.users.reduce((acc, u) => {
      acc[u.userId] = u.username || u.name || "—";
      return acc;
    }, {});
  }, [usersData]);

  const quotationMap = useMemo(() => {
    if (!quotationsData?.data || !Array.isArray(quotationsData.data)) return {};
    return quotationsData.data.reduce((acc, q) => {
      acc[q.quotationId] = q.reference_number || "—";
      return acc;
    }, {});
  }, [quotationsData]);
  // Helper displays
  const getAssignedToDisplay = (order) => {
    const parts = [];
    if (order.assignedTeam?.id && teamMap[order.assignedTeam.id]) {
      parts.push(`${teamMap[order.assignedTeam.id]} (Team)`);
    }
    if (order.assignedUser?.userId && userMap[order.assignedUser.userId]) {
      parts.push(`${userMap[order.assignedUser.userId]} (User)`);
    }
    if (order.secondaryUser?.userId && userMap[order.secondaryUser.userId]) {
      parts.push(`${userMap[order.secondaryUser.userId]} (User)`);
    }
    return parts.length > 0 ? parts.join(", ") : "—";
  };

  const isDueDateClose = (dueDate) => {
    if (!dueDate) return false;
    const diffDays = (new Date(dueDate) - new Date()) / (1000 * 60 * 60 * 24);
    return diffDays <= 3 && diffDays >= 0;
  };

  // Handlers
  const handleStatusChange = async (orderId, newStatus) => {
    if (!canUpdateOrderStatus) {
      message.error("No permission to update status");
      return;
    }
    try {
      await updateOrderStatus({ orderId, status: newStatus }).unwrap();
      message.success("Status updated");
    } catch (err) {
      message.error(err?.data?.message || "Failed to update status");
    }
  };

  const handleEditClick = (order) => {
    if (!canEditOrder) {
      message.error("No permission to edit");
      return;
    }
    navigate(`/order/${order.id}/edit`, { state: { order } });
  };

  const handleDeleteClick = (orderId) => {
    if (!canDeleteOrder) {
      message.error("No permission to delete");
      return;
    }
    setOrderToDelete(orderId);
    setShowDeleteModal(true);
  };

  const handleDeleteOrder = async () => {
    try {
      await deleteOrder(orderToDelete).unwrap();
      message.success("Order deleted");
      if (orders.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      }
    } catch (err) {
      message.error(err?.data?.message || "Failed to delete");
    } finally {
      setShowDeleteModal(false);
      setOrderToDelete(null);
    }
  };

  const handleViewInvoice = (invoiceLink) => {
    if (invoiceLink) window.open(invoiceLink, "_blank");
  };

  const handlePageChange = (page, newPageSize) => {
    setCurrentPage(page);
    if (newPageSize !== pageSize) {
      setPageSize(newPageSize);
      setCurrentPage(1);
    }
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setFilters({ status: "", priority: "" });
    setSortBy("Recently Added");
    setCurrentPage(1);
  };

  const handleOpenDatesModal = (dueDate, followupDates) => {
    setSelectedDates({ dueDate, followupDates: followupDates || [] });
    setShowDatesModal(true);
  };

  // Export data (using current page)
  const tableDataForExport = useMemo(() => {
    return orders.map((order, index) => ({
      "S.No.": (currentPage - 1) * pageSize + index + 1,
      "Order No.": order.orderNo,
      "Master Pipeline": order.masterOrder?.orderNo || "—",
      "Previous Order": order.previousOrder?.orderNo || "—",
      Status: order.status || "PREPARING",
      Quotation: order.quotationId
        ? quotationMap[order.quotationId] || "—"
        : "—",
      Customer: order.customer?.name || "N/A",
      Priority: order.priority || "Medium",
      "Assigned To": getAssignedToDisplay(order),
      "Created By": order.creator?.name || order.creator?.username || "N/A",
      "Due Date": order.dueDate
        ? new Date(order.dueDate).toLocaleDateString()
        : "—",
    }));
  }, [orders, currentPage, pageSize, quotationMap, teamMap, userMap]);

  return (
    <div className="page-wrapper">
      <div className="content">
        <div className="card">
          <PageHeader
            title="Orders"
            subtitle="Manage your Orders"
            onAdd={() => navigate("/order/add")}
            tableData={tableDataForExport}
            exportOptions={{ pdf: true, excel: true }}
          />

          <div className="card-body">
            {/* Filters */}
            <div className="row mb-4 align-items-center g-3">
              <div className="col-lg-8">
                <div className="d-flex flex-wrap gap-3 align-items-center">
                  <Select
                    value={filters.status}
                    onChange={(val) => {
                      setFilters((prev) => ({ ...prev, status: val || "" }));
                      setCurrentPage(1);
                    }}
                    placeholder="All Statuses"
                    allowClear
                    style={{ width: 180 }}
                    size="large"
                  >
                    {[
                      "PREPARING",
                      "CHECKING",
                      "INVOICE",
                      "DISPATCHED",
                      "DELIVERED",
                      "PARTIALLY_DELIVERED",
                      "CANCELED",
                      "DRAFT",
                      "ONHOLD",
                      "CLOSED",
                    ].map((s) => (
                      <Option key={s} value={s}>
                        {s}
                      </Option>
                    ))}
                  </Select>

                  <Select
                    value={filters.priority}
                    onChange={(val) => {
                      setFilters((prev) => ({ ...prev, priority: val || "" }));
                      setCurrentPage(1);
                    }}
                    placeholder="Priority"
                    allowClear
                    style={{ width: 140 }}
                    size="large"
                  >
                    <Option value="high">High</Option>
                    <Option value="medium">Medium</Option>
                    <Option value="low">Low</Option>
                  </Select>

                  <Select
                    value={sortBy}
                    onChange={setSortBy}
                    style={{ width: 200 }}
                    size="large"
                  >
                    <Option value="Recently Added">Recently Added</Option>
                    <Option value="Due Date Ascending">
                      Due Date (Soonest)
                    </Option>
                    <Option value="Due Date Descending">
                      Due Date (Latest)
                    </Option>
                  </Select>
                </div>
              </div>

              <div className="col-lg-4">
                <div className="d-flex justify-content-end gap-2">
                  <Input
                    prefix={<SearchOutlined />}
                    placeholder="Search order no, customer, quotation..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    allowClear
                    size="large"
                    style={{ width: 300 }}
                  />
                  <Button onClick={handleClearFilters} size="large">
                    Clear
                  </Button>
                </div>
              </div>
            </div>

            {/* Loading */}
            {isFetching && !isLoading && (
              <div className="text-center my-3">
                <span className="text-muted">Updating...</span>
              </div>
            )}

            {/* Table */}
            {isLoading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            ) : error ? (
              <div className="alert alert-danger">
                Error: {error?.data?.message || "Failed to load orders"}
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center py-5 text-muted">No orders found</div>
            ) : (
              <>
                <div className="table-responsive">
                  <table className="table table-hover align-middle">
                    <thead className="table-light">
                      <tr>
                        <th>S.No.</th>
                        <th>Order No.</th>
                        <th>Master Pipeline</th>
                        <th>Previous Order</th>
                        <th>STATUS</th>
                        <th>QUOTATION</th>
                        <th>CUSTOMER</th>
                        <th>PRIORITY</th>
                        <th>ASSIGNED TO</th>
                        <th>CREATED BY</th>
                        <th>DUE DATE</th>
                        <th className="text-end">ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map((order, index) => {
                        const serialNo =
                          (currentPage - 1) * pageSize + index + 1;
                        const hasInvoice =
                          [
                            "INVOICE",
                            "DISPATCHED",
                            "DELIVERED",
                            "PARTIALLY_DELIVERED",
                            "CLOSED",
                          ].includes(order.status) && order.invoiceLink;

                        return (
                          <tr key={order.id}>
                            <td>{serialNo}</td>
                            <td>
                              <Link
                                to={`/order/${order.id}`}
                                className="fw-medium"
                              >
                                {order.orderNo}
                              </Link>
                              <span
                                className="badge ms-2"
                                style={{
                                  backgroundColor: order.quotationId
                                    ? "#d4edda"
                                    : "#f8d7da",
                                  color: order.quotationId
                                    ? "#155724"
                                    : "#721c24",
                                }}
                              >
                                {order.quotationId ? "QUOTATIONED" : "IDLE"}
                              </span>
                            </td>
                            <td>
                              {order.masterOrder ? (
                                <Link to={`/order/${order.masterOrder.id}`}>
                                  {order.masterPipelineNo}
                                </Link>
                              ) : (
                                order.masterPipelineNo || "—"
                              )}
                            </td>
                            <td>
                              {order.previousOrder ? (
                                <Link to={`/order/${order.previousOrder.id}`}>
                                  {order.previousOrder.orderNo}
                                </Link>
                              ) : (
                                order.previousOrderNo || "—"
                              )}
                            </td>
                            <td>
                              <span className="badge bg-secondary">
                                {order.status || "PREPARING"}
                              </span>
                              {canUpdateOrderStatus && (
                                <Dropdown
                                  overlay={
                                    <Menu>
                                      {[
                                        "PREPARING",
                                        "CHECKING",
                                        "INVOICE",
                                        "DISPATCHED",
                                        "DELIVERED",
                                        "PARTIALLY_DELIVERED",
                                        "CANCELED",
                                        "DRAFT",
                                        "ONHOLD",
                                        "CLOSED",
                                      ].map((s) => (
                                        <Menu.Item
                                          key={s}
                                          onClick={() =>
                                            handleStatusChange(order.id, s)
                                          }
                                          disabled={order.status === s}
                                        >
                                          {s}
                                        </Menu.Item>
                                      ))}
                                    </Menu>
                                  }
                                  trigger={["click"]}
                                >
                                  <EditOutlined
                                    className="ms-2 text-primary"
                                    style={{ cursor: "pointer" }}
                                  />
                                </Dropdown>
                              )}
                            </td>
                            <td>
                              {order.quotationId ? (
                                <Link to={`/quotation/${order.quotationId}`}>
                                  {quotationMap[order.quotationId] || "—"}
                                </Link>
                              ) : (
                                "—"
                              )}
                            </td>
                            <td>
                              {order.customer ? (
                                <Link
                                  to={`/customer/${order.customer.customerId}`}
                                >
                                  {order.customer.name}
                                </Link>
                              ) : (
                                "N/A"
                              )}
                            </td>
                            <td>
                              <span
                                className={`badge bg-${
                                  order.priority === "high"
                                    ? "danger"
                                    : order.priority === "low"
                                    ? "info"
                                    : "warning"
                                }`}
                              >
                                {order.priority || "Medium"}
                              </span>
                            </td>
                            <td>{getAssignedToDisplay(order)}</td>
                            <td>
                              {order.creator
                                ? order.creator.name || order.creator.username
                                : "N/A"}
                            </td>
                            <td
                              className={
                                isDueDateClose(order.dueDate)
                                  ? "text-danger fw-bold"
                                  : ""
                              }
                            >
                              {order.dueDate ? (
                                <span
                                  className="cursor-pointer"
                                  onClick={() =>
                                    handleOpenDatesModal(
                                      order.dueDate,
                                      order.followupDates
                                    )
                                  }
                                >
                                  {new Date(order.dueDate).toLocaleDateString()}
                                </span>
                              ) : (
                                "—"
                              )}
                            </td>
                            <td className="text-end">
                              {canEditOrder && (
                                <Button
                                  type="text"
                                  icon={<EditOutlined />}
                                  onClick={() => handleEditClick(order)}
                                />
                              )}
                              {(canDeleteOrder || hasInvoice) && (
                                <Dropdown
                                  overlay={
                                    <Menu>
                                      {hasInvoice && (
                                        <Menu.Item
                                          key="invoice"
                                          onClick={() =>
                                            handleViewInvoice(order.invoiceLink)
                                          }
                                        >
                                          <FileTextOutlined /> View Invoice
                                        </Menu.Item>
                                      )}
                                      {canDeleteOrder && (
                                        <Menu.Item
                                          key="delete"
                                          danger
                                          onClick={() =>
                                            handleDeleteClick(order.id)
                                          }
                                        >
                                          <DeleteOutlined /> Delete
                                        </Menu.Item>
                                      )}
                                    </Menu>
                                  }
                                  trigger={["click"]}
                                >
                                  <Button type="text" icon={<MoreOutlined />} />
                                </Dropdown>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {pagination.total > 0 && (
                  <div className="mt-4 d-flex justify-content-between align-items-center">
                    <div className="text-muted small">
                      Showing {(currentPage - 1) * pageSize + 1}–
                      {Math.min(currentPage * pageSize, pagination.total)} of{" "}
                      {pagination.total} orders
                    </div>
                    <Pagination
                      current={currentPage}
                      pageSize={pageSize}
                      total={pagination.total}
                      onChange={handlePageChange}
                      showSizeChanger
                      pageSizeOptions={["10", "20", "50", "100"]}
                      disabled={isFetching}
                    />
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Modals */}
        <DeleteModal
          isVisible={showDeleteModal}
          onConfirm={handleDeleteOrder}
          onCancel={() => {
            setShowDeleteModal(false);
            setOrderToDelete(null);
          }}
          itemType="Order"
        />

        <DatesModal
          show={showDatesModal}
          onHide={() => setShowDatesModal(false)}
          dueDate={selectedDates.dueDate}
          followupDates={selectedDates.followupDates}
        />
      </div>
    </div>
  );
};

export default OrderWrapper;
