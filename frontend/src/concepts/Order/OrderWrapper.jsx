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
  Collapse,
  Statistic,
} from "antd";
import {
  SearchOutlined,
  EditOutlined,
  FileTextOutlined,
  DeleteOutlined,
  MoreOutlined,
  BookOutlined,
  UnorderedListOutlined,
} from "@ant-design/icons";
import DatesModal from "../../components/Orders/DateModal";
import DeleteModal from "../../components/Common/DeleteModal";
import PageHeader from "../../components/Common/PageHeader";
import { useAuth } from "../../context/AuthContext";
import moment from "moment";

const { Option } = Select;
const { Panel } = Collapse;

const OrderWrapper = () => {
  const navigate = useNavigate();
  const { auth } = useAuth();
  const permissions = auth?.permissions || [];

  const canEditOrder = permissions.some(
    (p) => p.action === "edit" && p.module === "orders",
  );
  const canDeleteOrder = permissions.some(
    (p) => p.action === "delete" && p.module === "orders",
  );
  const canUpdateOrderStatus = permissions.some(
    (p) => p.action === "write" && p.module === "orders",
  );

  // ==================== NEW: View Mode ====================
  const [viewMode, setViewMode] = useState("list"); // "list" | "book"

  const [searchTerm, setSearchTerm] = useState("");
  const [committedFilters, setCommittedFilters] = useState({
    search: "",
    status: "",
    priority: "",
    sort: "createdAt_desc",
    page: 1,
    limit: 20,
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
      setCommittedFilters((prev) => ({
        ...prev,
        search: searchTerm.trim(),
        page: 1,
      }));
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // ==================== API QUERY ====================
  const {
    data: response,
    error,
    isLoading,
    isFetching,
  } = useGetAllOrdersQuery({
    ...committedFilters,
    limit: viewMode === "book" ? 1000 : committedFilters.limit, // Fetch more for grouping
    page: viewMode === "book" ? 1 : committedFilters.page,
  });

  const orders = response?.data || [];
  const pagination = response?.pagination || {
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 0,
  };

  // Supporting Data
  const { data: teamsData } = useGetAllTeamsQuery();
  const { data: usersData } = useGetAllUsersQuery();
  const { data: quotationsData } = useGetAllQuotationsQuery();

  const [deleteOrder] = useDeleteOrderMutation();
  const [updateOrderStatus] = useUpdateOrderStatusMutation();

  // Maps
  const teamMap = useMemo(() => {
    return (teamsData?.teams || []).reduce((acc, t) => {
      acc[t.id] = t.teamName || "—";
      return acc;
    }, {});
  }, [teamsData]);

  const userMap = useMemo(() => {
    return (usersData?.users || []).reduce((acc, u) => {
      acc[u.userId] = u.username || u.name || "—";
      return acc;
    }, {});
  }, [usersData]);

  const quotationMap = useMemo(() => {
    if (!quotationsData?.data) return {};
    return quotationsData.data.reduce((acc, q) => {
      acc[q.quotationId] = q.reference_number || "—";
      return acc;
    }, {});
  }, [quotationsData]);

  // ==================== MONTHLY GROUPING (Book Mode) ====================
  const monthlyGroups = useMemo(() => {
    if (viewMode !== "book") return [];

    const groups = {};

    orders.forEach((order) => {
      const date = order.dueDate || order.createdAt;
      if (!date) return;

      const monthKey = moment(date).format("YYYY-MM");
      const monthLabel = moment(date).format("MMMM YYYY");

      if (!groups[monthKey]) {
        groups[monthKey] = {
          key: monthKey,
          label: monthLabel,
          orders: [],
          totalOrders: 0,
        };
      }

      groups[monthKey].orders.push(order);
      groups[monthKey].totalOrders += 1;
    });

    return Object.values(groups).sort((a, b) => b.key.localeCompare(a.key));
  }, [orders, viewMode]);

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
    return parts.length ? parts.join(", ") : "—";
  };

  const isDueDateClose = (dueDate) => {
    if (!dueDate) return false;
    const diffDays = (new Date(dueDate) - Date.now()) / (1000 * 60 * 60 * 24);
    return diffDays <= 3 && diffDays >= 0;
  };

  // Handlers (same as before)
  const handleStatusChange = (value) => {
    setCommittedFilters((prev) => ({ ...prev, status: value || "", page: 1 }));
  };

  const handlePriorityChange = (value) => {
    setCommittedFilters((prev) => ({
      ...prev,
      priority: value || "",
      page: 1,
    }));
  };

  const handleSortChange = (value) => {
    let sortValue = "createdAt_desc";
    switch (value) {
      case "Recently Added":
        sortValue = "createdAt_desc";
        break;
      case "Due Date Ascending":
        sortValue = "dueDate_asc";
        break;
      case "Due Date Descending":
        sortValue = "dueDate_desc";
        break;
      default:
        break;
    }
    setCommittedFilters((prev) => ({ ...prev, sort: sortValue, page: 1 }));
    setSortBy(value);
  };

  const handlePageChange = (page, pageSize) => {
    setCommittedFilters((prev) => ({ ...prev, page, limit: pageSize }));
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setSortBy("Recently Added");
    setCommittedFilters({
      search: "",
      status: "",
      priority: "",
      sort: "createdAt_desc",
      page: 1,
      limit: 20,
    });
  };

  const handleDeleteClick = (orderId) => {
    if (!canDeleteOrder) return message.error("No permission to delete");
    setOrderToDelete(orderId);
    setShowDeleteModal(true);
  };

  const handleDeleteOrder = async () => {
    if (!orderToDelete) return;
    try {
      await deleteOrder(orderToDelete).unwrap();
      message.success("Order deleted successfully");
    } catch (err) {
      message.error(err?.data?.message || "Failed to delete order");
    } finally {
      setShowDeleteModal(false);
      setOrderToDelete(null);
    }
  };

  const handleViewInvoice = (invoiceLink) => {
    if (invoiceLink) window.open(invoiceLink, "_blank", "noopener,noreferrer");
  };

  const handleOpenDatesModal = (dueDate, followupDates = []) => {
    setSelectedDates({ dueDate, followupDates });
    setShowDatesModal(true);
  };

  // Export Data
  const tableDataForExport = useMemo(() => {
    return orders.map((order, index) => ({
      "S.No.": (committedFilters.page - 1) * committedFilters.limit + index + 1,
      "Order No.": order.orderNo,
      Status: order.status || "PREPARING",
      Customer: order.customer?.name || "N/A",
      Priority: order.priority || "Medium",
      "Assigned To": getAssignedToDisplay(order),
      "Due Date": order.dueDate
        ? moment(order.dueDate).format("DD/MM/YYYY")
        : "—",
    }));
  }, [orders, committedFilters]);

  return (
    <div className="page-wrapper">
      <div className="content">
        <div className="card">
          <PageHeader
            title="Orders"
            subtitle={
              viewMode === "book" ? "Book View - Monthly" : "Manage your Orders"
            }
            onAdd={() => navigate("/order/add")}
            tableData={tableDataForExport}
            exportOptions={{ pdf: true, excel: true }}
            extra={
              <Button
                icon={
                  viewMode === "list" ? (
                    <BookOutlined />
                  ) : (
                    <UnorderedListOutlined />
                  )
                }
                onClick={() =>
                  setViewMode(viewMode === "list" ? "book" : "list")
                }
                type={viewMode === "book" ? "primary" : "default"}
              >
                {viewMode === "book" ? "List Mode" : "Book Mode"}
              </Button>
            }
          />

          <div className="card-body">
            {/* Filters */}
            <div className="row mb-4 align-items-center g-3">
              <div className="col-12 col-md-7 col-lg-6 col-xl-5">
                <Input
                  prefix={<SearchOutlined />}
                  placeholder="Search order no, customer, quotation..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  allowClear
                  size="large"
                />
              </div>

              <div className="col-12 col-md-5 col-lg-6 col-xl-7">
                <div className="d-flex gap-3 flex-wrap justify-content-md-end">
                  <Select
                    placeholder="All Statuses"
                    value={committedFilters.status || undefined}
                    style={{ width: 170 }}
                    size="large"
                    onChange={handleStatusChange}
                    allowClear
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
                        {s.replace("_", " ")}
                      </Option>
                    ))}
                  </Select>

                  <Select
                    placeholder="All Priorities"
                    value={committedFilters.priority || undefined}
                    style={{ width: 130 }}
                    size="large"
                    onChange={handlePriorityChange}
                    allowClear
                  >
                    <Option value="high">High</Option>
                    <Option value="medium">Medium</Option>
                    <Option value="low">Low</Option>
                  </Select>

                  <Select
                    value={sortBy}
                    style={{ width: 190 }}
                    size="large"
                    onChange={handleSortChange}
                  >
                    <Option value="Recently Added">Recently Added</Option>
                    <Option value="Due Date Ascending">
                      Due Date (Soonest)
                    </Option>
                    <Option value="Due Date Descending">
                      Due Date (Latest)
                    </Option>
                  </Select>

                  <Button size="large" onClick={handleClearFilters}>
                    Clear Filters
                  </Button>
                </div>
              </div>
            </div>

            {/* ==================== BOOK MODE ==================== */}
            {viewMode === "book" ? (
              isLoading ? (
                <div className="text-center py-5">Loading book view...</div>
              ) : monthlyGroups.length === 0 ? (
                <div className="text-center py-5 text-muted">
                  No orders found
                </div>
              ) : (
                <Collapse accordion defaultActiveKey={monthlyGroups[0]?.key}>
                  {monthlyGroups.map((month) => (
                    <Panel
                      header={
                        <div className="d-flex justify-content-between align-items-center w-100">
                          <strong>{month.label}</strong>
                          <Statistic
                            title="Total Orders"
                            value={month.totalOrders}
                            valueStyle={{ fontSize: "18px", color: "#3f8600" }}
                          />
                        </div>
                      }
                      key={month.key}
                    >
                      <div className="table-responsive">
                        <table className="table table-hover align-middle">
                          <thead className="table-light">
                            <tr>
                              <th>S.No.</th>
                              <th>Order No.</th>
                              <th>STATUS</th>
                              <th>CUSTOMER</th>
                              <th>PRIORITY</th>
                              <th>ASSIGNED TO</th>
                              <th>DUE DATE</th>
                              <th className="text-end">ACTIONS</th>
                            </tr>
                          </thead>
                          <tbody>
                            {month.orders.map((order, idx) => {
                              const serialNo =
                                (committedFilters.page - 1) *
                                  committedFilters.limit +
                                orders.indexOf(order) +
                                1;

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
                                      {order.quotationId ? "Linked" : "Idle"}
                                    </span>
                                  </td>

                                  <td>
                                    <span
                                      className="badge"
                                      style={{
                                        backgroundColor: "#e6eaed",
                                        color: "black",
                                      }}
                                    >
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
                                                  updateOrderStatus({
                                                    orderId: order.id,
                                                    status: s,
                                                  })
                                                }
                                                disabled={order.status === s}
                                              >
                                                {s.replace("_", " ")}
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
                                      <Link
                                        to={`/quotation/${order.quotationId}`}
                                      >
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
                                    {order.creator?.name ||
                                      order.creator?.username ||
                                      "N/A"}
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
                                        className="cursor-pointer text-decoration-underline"
                                        onClick={() =>
                                          handleOpenDatesModal(
                                            order.dueDate,
                                            order.followupDates,
                                          )
                                        }
                                      >
                                        {new Date(
                                          order.dueDate,
                                        ).toLocaleDateString()}
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
                                        onClick={() =>
                                          navigate(`/order/${order.id}/edit`, {
                                            state: { order },
                                          })
                                        }
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
                                                  handleViewInvoice(
                                                    order.invoiceLink,
                                                  )
                                                }
                                              >
                                                <FileTextOutlined /> View
                                                Invoice
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
                                        <Button
                                          type="text"
                                          icon={<MoreOutlined />}
                                        />
                                      </Dropdown>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </Panel>
                  ))}
                </Collapse>
              )
            ) : (
              /* ==================== LIST MODE (Original) ==================== */
              <>
                {/* Your existing table code here */}
                {isLoading ? (
                  <div className="text-center py-5">
                    <div
                      className="spinner-border text-primary"
                      role="status"
                    />
                  </div>
                ) : error ? (
                  <div className="alert alert-danger">
                    {error?.data?.message || "Failed to load orders"}
                  </div>
                ) : orders.length === 0 ? (
                  <div className="text-center py-5 text-muted">
                    No orders found
                  </div>
                ) : (
                  <>
                    <div className="table-responsive">
                      <table className="table table-hover align-middle">
                        <thead className="table-light">
                          <tr>
                            <th>S.No.</th>
                            <th>Order No.</th>
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
                          {orders.map((order) => {
                            const serialNo =
                              (committedFilters.page - 1) *
                                committedFilters.limit +
                              orders.indexOf(order) +
                              1;

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
                                    {order.quotationId ? "Linked" : "Idle"}
                                  </span>
                                </td>

                                <td>
                                  <span
                                    className="badge"
                                    style={{
                                      backgroundColor: "#e6eaed",
                                      color: "black",
                                    }}
                                  >
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
                                                updateOrderStatus({
                                                  orderId: order.id,
                                                  status: s,
                                                })
                                              }
                                              disabled={order.status === s}
                                            >
                                              {s.replace("_", " ")}
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
                                    <Link
                                      to={`/quotation/${order.quotationId}`}
                                    >
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
                                  {order.creator?.name ||
                                    order.creator?.username ||
                                    "N/A"}
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
                                      className="cursor-pointer text-decoration-underline"
                                      onClick={() =>
                                        handleOpenDatesModal(
                                          order.dueDate,
                                          order.followupDates,
                                        )
                                      }
                                    >
                                      {new Date(
                                        order.dueDate,
                                      ).toLocaleDateString()}
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
                                      onClick={() =>
                                        navigate(`/order/${order.id}/edit`, {
                                          state: { order },
                                        })
                                      }
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
                                                handleViewInvoice(
                                                  order.invoiceLink,
                                                )
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
                                      <Button
                                        type="text"
                                        icon={<MoreOutlined />}
                                      />
                                    </Dropdown>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {pagination.total > 0 && (
                      <div className="mt-4 d-flex justify-content-between align-items-center flex-wrap gap-3">
                        <div className="text-muted small">
                          Showing{" "}
                          {(committedFilters.page - 1) *
                            committedFilters.limit +
                            1}
                          –
                          {Math.min(
                            committedFilters.page * committedFilters.limit,
                            pagination.total,
                          )}{" "}
                          of {pagination.total} orders
                        </div>
                        <Pagination
                          current={committedFilters.page}
                          pageSize={committedFilters.limit}
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
