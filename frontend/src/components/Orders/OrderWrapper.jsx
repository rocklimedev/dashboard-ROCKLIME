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
    (p) => p.action === "edit" && p.module === "orders",
  );
  const canDeleteOrder = permissions.some(
    (p) => p.action === "delete" && p.module === "orders",
  );
  const canUpdateOrderStatus = permissions.some(
    (p) => p.action === "write" && p.module === "orders",
  );

  const [searchTerm, setSearchTerm] = useState("");
  const [committedFilters, setCommittedFilters] = useState({
    search: "",
    status: "",
    priority: "",
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

  const {
    data: response,
    error,
    isLoading,
    isFetching,
  } = useGetAllOrdersQuery(committedFilters);

  const orders = response?.data || [];
  const pagination = response?.pagination || {
    total: 0,
    page: committedFilters.page,
    limit: committedFilters.limit,
    totalPages: 0,
  };

  const { data: teamsData } = useGetAllTeamsQuery();
  const { data: usersData } = useGetAllUsersQuery();
  const { data: quotationsData } = useGetAllQuotationsQuery();

  const [deleteOrder] = useDeleteOrderMutation();
  const [updateOrderStatus] = useUpdateOrderStatusMutation();

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
    const diffDays =
      (new Date(dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    return diffDays <= 3 && diffDays >= 0;
  };

  const handleStatusChange = (val) => {
    setCommittedFilters((prev) => ({
      ...prev,
      status: val || "",
      page: 1,
    }));
  };

  const handlePriorityChange = (val) => {
    setCommittedFilters((prev) => ({
      ...prev,
      priority: val || "",
      page: 1,
    }));
  };

  const handleSortChange = (val) => {
    setSortBy(val);
  };

  const handlePageChange = (page, newLimit) => {
    setCommittedFilters((prev) => ({
      ...prev,
      page,
      limit: newLimit ?? prev.limit,
    }));
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setSortBy("Recently Added");
    setCommittedFilters({
      search: "",
      status: "",
      priority: "",
      page: 1,
      limit: 20,
    });
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
    if (!orderToDelete) return;
    try {
      await deleteOrder(orderToDelete).unwrap();
      message.success("Order deleted");
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

  const handleOpenDatesModal = (dueDate, followupDates = []) => {
    setSelectedDates({ dueDate, followupDates });
    setShowDatesModal(true);
  };

  const tableDataForExport = useMemo(() => {
    return orders.map((order, index) => ({
      "S.No.": (committedFilters.page - 1) * committedFilters.limit + index + 1,
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
  }, [
    orders,
    committedFilters.page,
    committedFilters.limit,
    quotationMap,
    teamMap,
    userMap,
  ]);

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
            <div className="row mb-4 align-items-center g-3">
              {/* Search – left side, takes what it needs */}
              <div className="col-12 col-md-7 col-lg-6 col-xl-5">
                <Input
                  prefix={<SearchOutlined />}
                  placeholder="Search order no, customer, quotation..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  allowClear
                  size="large"
                  style={{ width: "100%" }}
                />
              </div>

              {/* Filters – right side, takes remaining space */}
              <div className="col-12 col-md-5 col-lg-6 col-xl-7">
                <div className="d-flex gap-3 flex-wrap justify-content-md-end">
                  {/* All Selects + Clear button here – same as above */}
                  <Select
                    value={committedFilters.status}
                    style={{ width: 170 }}
                    size="large"
                  >
                    {" "}
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
                    value={committedFilters.priority}
                    style={{ width: 130 }}
                    size="large"
                  >
                    {" "}
                    <Option value="high">High</Option>
                    <Option value="medium">Medium</Option>
                    <Option value="low">Low</Option>
                  </Select>
                  <Select value={sortBy} style={{ width: 190 }} size="large">
                    {" "}
                    <Option value="Recently Added">Recently Added</Option>
                    <Option value="Due Date Ascending">
                      Due Date (Soonest)
                    </Option>
                    <Option value="Due Date Descending">
                      Due Date (Latest)
                    </Option>
                  </Select>
                  <Button size="large">Clear</Button>
                </div>
              </div>
            </div>

            {isFetching && !isLoading && (
              <div className="text-center my-3">
                <span className="text-muted">Updating...</span>
              </div>
            )}

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
                          (committedFilters.page - 1) * committedFilters.limit +
                          (orders.indexOf(order) + 1);

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
                                {order.quotationId ? "" : "IDLE"}
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
                                      order.followupDates,
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

                {pagination.total > 0 && (
                  <div className="mt-4 d-flex justify-content-between align-items-center">
                    <div className="text-muted small">
                      Showing{" "}
                      {(committedFilters.page - 1) * committedFilters.limit + 1}
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
          </div>
        </div>

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
