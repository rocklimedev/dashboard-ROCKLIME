import React, { useState, useMemo, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useGetAllUsersQuery } from "../../api/userApi";
import { useGetAllTeamsQuery } from "../../api/teamApi";
import { useGetCustomersQuery } from "../../api/customerApi";
import { useGetAllQuotationsQuery } from "../../api/quotationApi";
import {
  useGetAllOrdersQuery,
  useDeleteOrderMutation,
  useUpdateOrderStatusMutation,
} from "../../api/orderApi";
import { toast } from "sonner";
import { FaSearch } from "react-icons/fa";
import {
  EditOutlined,
  FileTextOutlined,
  DeleteOutlined,
  MoreOutlined,
} from "@ant-design/icons";
import { Dropdown, Menu, Button, Select } from "antd";
import DatesModal from "./DateModal";
import OnHoldModal from "./OnHoldOrder";
import DeleteModal from "../Common/DeleteModal";
import OrderPagination from "./OrderPagination";
import PageHeader from "../Common/PageHeader";

const { Option } = Select;

const OrderWrapper = () => {
  const navigate = useNavigate();
  const [teamMap, setTeamMap] = useState({});
  const [customerMap, setCustomerMap] = useState({});
  const [userMap, setUserMap] = useState({});
  const [quotationMap, setQuotationMap] = useState({});
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
    masterPipelineNo: null,
    previousOrderNo: null,
  });
  const [dateRange, setDateRange] = useState({
    startDate: "",
    endDate: "",
  });

  // Fetch data from APIs
  const { data: teamsData } = useGetAllTeamsQuery();
  const { data: customersData } = useGetCustomersQuery();
  const { data: usersData } = useGetAllUsersQuery();
  const { data: quotationsData } = useGetAllQuotationsQuery();
  const {
    data: allData,
    error: allError,
    isLoading: allLoading,
    isFetching: allFetching,
  } = useGetAllOrdersQuery();
  const orders = allData?.orders || [];
  const totalCount = allData?.totalCount || orders.length;
  const isLoading = allLoading;
  const isFetching = allFetching;
  const error = allError;

  const [deleteOrder] = useDeleteOrderMutation();
  const [updateOrderStatus] = useUpdateOrderStatusMutation();

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await updateOrderStatus({ orderId, status: newStatus }).unwrap();
    } catch (err) {
      toast.error(
        `Failed to update status: ${err.data?.message || "Unknown error"}`
      );
    }
  };
  // Map teams, customers, users, and quotations
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

  useEffect(() => {
    if (quotationsData) {
      const map = quotationsData.reduce((acc, quotation) => {
        acc[quotation.quotationId] = quotation.reference_number || "—";
        return acc;
      }, {});
      setQuotationMap(map);
    }
  }, [quotationsData]);

  // Helper to get status display
  const getStatusDisplay = (status) => {
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
    return statuses.includes(status) ? status : "CREATED";
  };

  // Helper to get quotation status
  const getQuotationStatus = (quotationId) => {
    return quotationId ? "QUOTATIONED" : "IDLE";
  };

  // Helper to format Assigned To field
  const getAssignedToDisplay = (order) => {
    const assignments = [];
    if (order.assignedTeamId && teamMap[order.assignedTeamId]) {
      assignments.push(`${teamMap[order.assignedTeamId]} (Team)`);
    }
    if (order.assignedUserId && userMap[order.assignedUserId]) {
      assignments.push(`${userMap[order.assignedUserId]} (User)`);
    }
    if (order.secondaryUserId && userMap[order.secondaryUserId]) {
      assignments.push(`${userMap[order.secondaryUserId]} (User)`);
    }
    return assignments.length > 0 ? assignments.join(", ") : "—";
  };

  // Filtered and sorted orders
  const filteredOrders = useMemo(() => {
    let result = orders;
    if (filters.status) {
      result = result.filter((ord) => ord.status === filters.status);
    }
    if (filters.priority) {
      result = result.filter((ord) => ord.priority === filters.priority);
    }
    if (filters.source) {
      result = result.filter((ord) =>
        ord.source?.toLowerCase().includes(filters.source.toLowerCase())
      );
    }
    if (filters.masterPipelineNo) {
      result = result.filter(
        (ord) => ord.masterPipelineNo === filters.masterPipelineNo
      );
    }
    if (filters.previousOrderNo) {
      result = result.filter(
        (ord) => ord.previousOrderNo === filters.previousOrderNo
      );
    }
    if (searchTerm.trim()) {
      result = result.filter((ord) => {
        const customerName = ord.createdFor
          ? customerMap[ord.createdFor] || "—"
          : "N/A";
        const reference_number = ord.quotationId
          ? quotationMap[ord.quotationId] || "—"
          : "—";
        return (
          customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          ord.source?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          reference_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
          ord.orderNo.toString().includes(searchTerm.toLowerCase()) ||
          (ord.masterPipelineNo &&
            ord.masterPipelineNo
              .toString()
              .includes(searchTerm.toLowerCase())) ||
          (ord.previousOrderNo &&
            ord.previousOrderNo.toString().includes(searchTerm.toLowerCase()))
        );
      });
    }
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
    switch (sortBy) {
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
  }, [
    orders,
    searchTerm,
    sortBy,
    dateRange,
    customerMap,
    quotationMap,
    filters,
  ]);

  // Paginated orders
  const paginatedOrders = useMemo(() => {
    const startIndex = (filters.page - 1) * filters.limit;
    return filteredOrders.slice(startIndex, startIndex + filters.limit);
  }, [filteredOrders, filters.page, filters.limit]);

  // Formatted table data for export
  const tableDataForExport = useMemo(() => {
    return paginatedOrders.map((order, index) => ({
      "S.No.": (filters.page - 1) * filters.limit + index + 1,
      "Order No.": order.orderNo,
      "Master Pipeline": order.masterPipelineNo || "—",
      "Previous Order": order.previousOrderNo || "—",
      Status: getStatusDisplay(order.status),
      Quotation: order.quotationId
        ? quotationMap[order.quotationId] || "—"
        : "—",
      Customer: order.createdFor ? customerMap[order.createdFor] || "—" : "N/A",
      Priority: order.priority || "Medium",
      "Assigned To": getAssignedToDisplay(order),
      "Created By": order.createdBy ? userMap[order.createdBy] || "—" : "N/A",
      "Due Date": order.dueDate
        ? new Date(order.dueDate).toLocaleDateString()
        : "—",
    }));
  }, [
    paginatedOrders,
    filters.page,
    filters.limit,
    customerMap,
    teamMap,
    userMap,
    quotationMap,
  ]);

  // Handlers (unchanged)
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
      masterPipelineNo: null,
      previousOrderNo: null,
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

  return (
    <div className="page-wrapper">
      <div className="content">
        <div className="card">
          <PageHeader
            title="Orders"
            subtitle="Manage your Orders"
            tableData={tableDataForExport}
            exportOptions={{ pdf: true, excel: true }}
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
                      {[
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
                      ].map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="d-flex align-items-center me-3">
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
                      {["All", "high", "medium", "low"].map((priority) => (
                        <option
                          key={priority}
                          value={priority === "All" ? "" : priority}
                        >
                          {priority === "All" ? "All Priorities" : priority}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="d-flex align-items-center me-3">
                    <Select
                      style={{ width: 200 }}
                      value={filters.masterPipelineNo || undefined}
                      onChange={(value) =>
                        setFilters((prev) => ({
                          ...prev,
                          masterPipelineNo: value || null,
                          page: 1,
                        }))
                      }
                      placeholder="Master Pipeline"
                      allowClear
                    >
                      {orders
                        .filter((order) => order.orderNo)
                        .map((order) => (
                          <Option key={order.orderNo} value={order.orderNo}>
                            {order.orderNo}
                          </Option>
                        ))}
                    </Select>
                  </div>
                  <div className="d-flex align-items-center">
                    <Select
                      style={{ width: 200 }}
                      value={filters.previousOrderNo || undefined}
                      onChange={(value) =>
                        setFilters((prev) => ({
                          ...prev,
                          previousOrderNo: value || null,
                          page: 1,
                        }))
                      }
                      placeholder="Previous Order"
                      allowClear
                    >
                      {orders
                        .filter((order) => order.orderNo)
                        .map((order) => (
                          <Option key={order.orderNo} value={order.orderNo}>
                            {order.orderNo}
                          </Option>
                        ))}
                    </Select>
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
                  <div className="d-flex align-items-center ms-3">
                    <select
                      className="form-select"
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                    >
                      {[
                        "Recently Added",
                        "Ascending",
                        "Descending",
                        "Due Date Ascending",
                        "Due Date Descending",
                      ].map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>
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
                        <th>Master Pipeline</th>
                        <th>Previous Order</th>
                        <th>STATUS</th>
                        <th>QUOTATION</th>
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
                        const customerName = order.createdFor
                          ? customerMap[order.createdFor] || "Loading..."
                          : "N/A";
                        const createdByName = order.createdBy
                          ? userMap[order.createdBy] || "Loading..."
                          : "N/A";
                        const status = getStatusDisplay(order.status);
                        const quotationStatus = getQuotationStatus(
                          order.quotationId
                        );
                        const reference_number = order.quotationId
                          ? quotationMap[order.quotationId] || "Loading..."
                          : "—";
                        const dueDateClass = isDueDateClose(order.dueDate)
                          ? "due-date-close"
                          : "";
                        const serialNumber =
                          (filters.page - 1) * filters.limit + index + 1;
                        const showInvoiceOption =
                          [
                            "INVOICE",
                            "DISPATCHED",
                            "DELIVERED",
                            "PARTIALLY_DELIVERED",
                          ].includes(order.status) &&
                          order.invoiceLink &&
                          order.invoiceLink.trim() !== "";
                        const menuItems = [
                          showInvoiceOption && {
                            key: "viewInvoice",
                            label: (
                              <span onClick={() => handleViewInvoice(order)}>
                                <FileTextOutlined style={{ marginRight: 8 }} />
                                Show Invoice
                              </span>
                            ),
                          },
                          {
                            key: "delete",
                            label: (
                              <span
                                onClick={() => handleDeleteClick(order.id)}
                                style={{ color: "#ff4d4f" }}
                              >
                                <DeleteOutlined style={{ marginRight: 8 }} />
                                Delete Order
                              </span>
                            ),
                          },
                        ].filter(Boolean);

                        return (
                          <tr key={order.id}>
                            <td>{serialNumber}</td>
                            <td>
                              <Link to={`/order/${order.id}`}>
                                {order.orderNo}{" "}
                                <span
                                  className="priority-badge"
                                  style={{
                                    backgroundColor:
                                      quotationStatus === "QUOTATIONED"
                                        ? "#d4edda"
                                        : "#f8d7da",
                                    color:
                                      quotationStatus === "QUOTATIONED"
                                        ? "#155724"
                                        : "#721c24",
                                    marginLeft: "8px",
                                  }}
                                >
                                  {quotationStatus}
                                </span>
                              </Link>
                            </td>
                            <td>
                              {order.masterOrder ? (
                                <Link to={`/order/${order.masterOrder.id}`}>
                                  {order.masterPipelineNo}
                                </Link>
                              ) : order.masterPipelineNo ? (
                                order.masterPipelineNo
                              ) : (
                                "—"
                              )}
                            </td>
                            <td>
                              {order.previousOrder ? (
                                <Link to={`/order/${order.previousOrder.id}`}>
                                  {order.previousOrderNo}
                                </Link>
                              ) : order.previousOrderNo ? (
                                order.previousOrderNo
                              ) : (
                                "—"
                              )}
                            </td>
                            <td>
                              <span
                                className="priority-badge"
                                style={{ backgroundColor: "#f2f2f2" }}
                              >
                                {getStatusDisplay(order.status)}
                              </span>
                              <Dropdown
                                overlay={
                                  <Select
                                    value={getStatusDisplay(order.status)}
                                    onChange={(value) =>
                                      handleStatusChange(order.id, value)
                                    }
                                    style={{ width: 150 }}
                                  >
                                    {[
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
                                    ].map((status) => (
                                      <Option key={status} value={status}>
                                        {status}
                                      </Option>
                                    ))}
                                  </Select>
                                }
                                trigger={["click"]}
                              >
                                <EditOutlined
                                  style={{ marginLeft: 8, cursor: "pointer" }}
                                  aria-label="Edit status"
                                />
                              </Dropdown>
                            </td>
                            <td>
                              {order.quotationId ? (
                                <Link to={`/quotations/${order.quotationId}`}>
                                  {reference_number}
                                </Link>
                              ) : (
                                "—"
                              )}
                            </td>
                            <td>
                              {order.createdFor ? (
                                <Link to={`/customer/${order.createdFor}`}>
                                  {customerName}
                                </Link>
                              ) : (
                                "N/A"
                              )}
                            </td>
                            <td>
                              <span
                                className={`priority-badge ${
                                  order.priority?.toLowerCase() || "medium"
                                }`}
                              >
                                {order.priority || "Medium"}
                              </span>
                            </td>
                            <td>{getAssignedToDisplay(order)}</td>
                            <td>
                              {order.createdBy ? (
                                <Link to={`/user/${order.createdBy}`}>
                                  {createdByName}
                                </Link>
                              ) : (
                                "N/A"
                              )}
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
                                  {new Date(order.dueDate).toLocaleDateString()}
                                </span>
                              ) : (
                                "—"
                              )}
                            </td>
                            <td>
                              <span>
                                <EditOutlined
                                  style={{ marginRight: 8 }}
                                  onClick={() => handleEditClick(order)}
                                />
                              </span>
                              <Dropdown
                                menu={{ items: menuItems }}
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
