import React, { useState, useMemo } from "react";
import PageHeader from "../Common/PageHeader";
import OrderPagination from "./OrderPagination";
import OrderFilter from "./OrderFilter";
import AddNewOrder from "./AddNewOrder";
import OnHoldModal from "./OnHoldOrder";
import ShowInvoices from "./ShowInvoices";
import {
  useGetFilteredOrdersQuery,
  useGetAllOrdersQuery,
  useCreateOrderMutation,
  useUpdateOrderByIdMutation,
  useDeleteOrderMutation,
} from "../../api/orderApi";
import { useGetTeamByIdQuery } from "../../api/teamApi";
import { FaEdit, FaOpencart, FaPause, FaTrash } from "react-icons/fa";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const OrderWrapper = () => {
  const [activeTab, setActiveTab] = useState("orders");
  const [showModal, setShowModal] = useState(false);
  const [showHoldModal, setShowHoldModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [filters, setFilters] = useState({
    status: "",
    priority: "",
    important: false,
    trash: false,
    page: 1,
    limit: 10,
  });

  const isFiltered = useMemo(() => {
    return (
      filters.status !== "" ||
      filters.priority !== "" ||
      filters.important !== false ||
      filters.trash !== false ||
      filters.page > 1
    );
  }, [filters]);

  const cleanFilters = useMemo(() => {
    const { status, priority, important, trash, page, limit } = filters;
    const cleaned = { page, limit };
    if (status) cleaned.status = status;
    if (priority) cleaned.priority = priority;
    if (important) cleaned.important = important;
    if (trash) cleaned.trash = trash;
    return cleaned;
  }, [filters]);

  const {
    data: filteredData,
    error: filteredError,
    isLoading: filteredLoading,
  } = useGetFilteredOrdersQuery(cleanFilters, {
    skip: !isFiltered,
  });

  const {
    data: allData,
    error: allError,
    isLoading: allLoading,
  } = useGetAllOrdersQuery({ skip: isFiltered });

  const orders = (isFiltered ? filteredData?.orders : allData?.orders) || [];
  const totalCount =
    (isFiltered ? filteredData?.totalCount : allData?.totalCount) || 0;
  const isLoading = isFiltered ? filteredLoading : allLoading;
  const error = isFiltered ? filteredError : allError;

  const { data: teamData, isLoading: teamLoading } = useGetTeamByIdQuery(
    selectedOrder?.assignedTo,
    { skip: !selectedOrder?.assignedTo }
  );

  const [createOrder] = useCreateOrderMutation();
  const [updateOrder] = useUpdateOrderByIdMutation();
  const [deleteOrder] = useDeleteOrderMutation();

  const handleOpenModal = () => {
    setSelectedOrder(null);
    setShowModal(true);
  };

  const handlePageChange = (page) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  const handleEditClick = (order) => {
    setSelectedOrder(order);
    setShowModal(true);
  };

  const handleHoldClick = (order) => {
    setSelectedOrder(order);
    setShowHoldModal(true);
  };

  const handleModalClose = () => {
    setSelectedOrder(null);
    setShowModal(false);
    setShowHoldModal(false);
  };

  const handleViewInvoice = (order) => {
    const invoiceId = order.invoiceId;
    if (invoiceId) {
      window.open(`/invoices/${invoiceId}`, "_blank");
    } else {
      toast.error("No invoice associated with this order.");
    }
  };

  const handleDeleteOrder = async (orderId) => {
    if (window.confirm("Are you sure you want to delete this order?")) {
      try {
        await deleteOrder(orderId).unwrap();
        toast.success("Order deleted successfully!");
      } catch (err) {
        console.error("Failed to delete order:", err);
        toast.error(
          `Failed to delete order: ${err.data?.message || "Unknown error"}`
        );
      }
    }
  };

  const handleSaveOrder = async (orderData) => {
    try {
      if (selectedOrder) {
        await updateOrder({ id: selectedOrder.id, ...orderData }).unwrap();
        toast.success("Order updated successfully!");
      } else {
        await createOrder(orderData).unwrap();
        toast.success("Order created successfully!");
      }
      handleModalClose();
    } catch (err) {
      console.error("Failed to save order:", err);
      toast.error(
        `Failed to save order: ${err.data?.message || "Unknown error"}`
      );
    }
  };

  const handleClearFilters = () => {
    setFilters({
      status: "",
      priority: "",
      important: false,
      trash: false,
      page: 1,
      limit: 10,
    });
    toast.success("Filters cleared!");
  };

  return (
    <div className="page-wrapper notes-page-wrapper">
      <div className="content">
        <div className="page-header page-add-notes border-0 flex-sm-row flex-column">
          <div className="add-item d-flex">
            <div className="page-title">
              <h4>Orders & Invoices</h4>
              <h6 className="mb-0">Manage everything from here</h6>
            </div>
          </div>
          <div className="d-flex align-items-center gap-2">
            <button className="btn btn-primary" onClick={handleOpenModal}>
              <i className="ti ti-plus me-2"></i>New Order
            </button>
            <button className="btn btn-secondary" onClick={handleClearFilters}>
              Clear Filters
            </button>
          </div>
          <ul className="nav nav-tabs">
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
                className={`nav-link ${
                  activeTab === "invoices" ? "active" : ""
                }`}
                onClick={() => setActiveTab("invoices")}
              >
                Invoices
              </button>
            </li>
          </ul>
        </div>

        {activeTab === "orders" ? (
          <div className="row">
            <div className="col-xl-3 col-md-12 sidebars-right theiaStickySidebar section-bulk-widget">
              <OrderFilter setFilters={setFilters} />
            </div>
            <div className="col-xl-9 budget-role-notes">
              <div className="border-bottom mb-4 pb-4">
                <h4>All Orders</h4>
              </div>

              {isLoading ? (
                <div className="text-center">
                  <div className="spinner-border" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              ) : error ? (
                <div className="alert alert-danger">
                  Error loading orders: {error.message || "Unknown error"}
                </div>
              ) : orders.length > 0 ? (
                <>
                  <div className="row">
                    {orders.map((order) => (
                      <div key={order.id} className="col-md-4 d-flex">
                        <div className="card rounded-3 mb-4 flex-fill">
                          <div className="card-body p-4">
                            <div className="d-flex align-items-center justify-content-between">
                              <span className="badge bg-outline-success d-inline-flex align-items-center">
                                <i className="fas fa-circle fs-6 me-1"></i>
                                {order.priority || "None"} -{" "}
                                {teamLoading
                                  ? "Loading..."
                                  : teamData?.name ||
                                    order.assignedTo ||
                                    "Unassigned"}
                              </span>
                              <div>
                                <a
                                  href="#"
                                  data-bs-toggle="dropdown"
                                  aria-expanded="false"
                                >
                                  <i className="fas fa-ellipsis-v"></i>
                                </a>
                                <div className="dropdown-menu notes-menu dropdown-menu-end">
                                  <a
                                    href={`/orders/${order.id}`}
                                    className="dropdown-item"
                                  >
                                    <FaOpencart /> Open Order
                                  </a>
                                  <a
                                    href="#"
                                    className="dropdown-item"
                                    onClick={() => handleEditClick(order)}
                                  >
                                    <FaEdit /> Edit
                                  </a>
                                  <a
                                    href="#"
                                    className="dropdown-item"
                                    onClick={() => handleViewInvoice(order)}
                                  >
                                    <i className="fas fa-file-invoice"></i> View
                                    Invoice
                                  </a>
                                  <a
                                    href="#"
                                    className="dropdown-item"
                                    onClick={() => handleHoldClick(order)}
                                  >
                                    <FaPause /> Hold Order
                                  </a>
                                  <a
                                    href="#"
                                    className="dropdown-item text-danger"
                                    onClick={() => handleDeleteOrder(order.id)}
                                  >
                                    <FaTrash /> Delete
                                  </a>
                                </div>
                              </div>
                            </div>

                            <div className="my-3">
                              <h5 className="text truncate mb-1">
                                <a href={`/orders/${order.id}`}>
                                  {order.title || "Untitled Order"} -
                                  {order.pipeline || "No Pipeline"}
                                </a>
                              </h5>
                              <p className="mb-3 d-flex align-items-center text-dark">
                                <i className="ti ti-calendar me-1"></i>
                                {order.dueDate || "No Due Date"} -{" "}
                                {order.followupDates?.length
                                  ? order.followupDates.join(", ")
                                  : "No Follow-up"}
                              </p>
                              <p className="text-truncate line-clamb-2 text-wrap">
                                {order.description ||
                                  "No description available"}
                              </p>
                            </div>

                            <div className="d-flex align-items-center justify-content-between border-top pt-3">
                              <span className="text-warning d-flex align-items-center">
                                <i className="fas fa-square square-rotate fs-10 me-1"></i>
                                {order.source || "Unknown"}
                              </span>
                              <span className="text-info d-flex align-items-center">
                                <i className="fas fa-square square-rotate fs-10 me-1"></i>
                                {order.status || "Unknown"}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
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
                <p>No orders found.</p>
              )}
            </div>
          </div>
        ) : (
          <ShowInvoices />
        )}

        {showModal && (
          <AddNewOrder
            visible={showModal}
            onClose={handleModalClose}
            order={selectedOrder}
            onSave={handleSaveOrder}
          />
        )}
        {showHoldModal && (
          <OnHoldModal
            visible={showHoldModal}
            onClose={handleModalClose}
            order={selectedOrder}
          />
        )}
      </div>
    </div>
  );
};

export default OrderWrapper;
