import React, { useState, useEffect, useMemo } from "react";
import PageHeader from "../Common/PageHeader";
import OrderPagination from "./OrderPagination";
import OrderList from "./OrderList";
import OrderFilter from "./OrderFilter";
import AddNewOrder from "./AddNewOrder";
import OnHoldModal from "./OnHoldOrder";
import ShowInvoices from "./ShowInvoices";
import {
  useGetFilteredOrdersQuery,
  useGetAllOrdersQuery,
} from "../../api/orderApi";
import { useGetTeamByIdQuery } from "../../api/teamApi";
import { FaEdit, FaOpencart, FaPause, FaTrash } from "react-icons/fa";

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

  const {
    data: filteredData,
    error: filteredError,
    isLoading: filteredLoading,
  } = useGetFilteredOrdersQuery(filters, {
    skip: !Object.values(filters).some((val) => val),
  });

  const {
    data: allData,
    error: allError,
    isLoading: allLoading,
  } = useGetAllOrdersQuery({ skip: Object.values(filters).some((val) => val) });

  const isFiltered = useMemo(
    () =>
      filters.status || filters.priority || filters.important || filters.trash,
    [filters]
  );

  const orders = isFiltered ? filteredData?.orders : allData?.orders;
  const totalCount = isFiltered
    ? filteredData?.totalCount
    : allData?.totalCount;
  const isLoading = isFiltered ? filteredLoading : allLoading;
  const error = isFiltered ? filteredError : allError;

  const { data: teamData, isLoading: teamLoading } = useGetTeamByIdQuery(
    selectedOrder?.assignedTo,
    { skip: !selectedOrder?.assignedTo }
  );

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
      window.open(`/invoice/${invoiceId}`, "_blank");
    } else {
      alert("Invoice ID not found.");
    }
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
            <div class="col-xl-3 col-md-12 sidebars-right theiaStickySidebar section-bulk-widget">
              <OrderFilter setFilters={setFilters} />
            </div>
            <div className="col-xl-9 budget-role-notes">
              <div className="border-bottom mb-4 pb-4">
                <h4>All Orders</h4>
              </div>

              {isLoading ? (
                <p>Loading orders...</p>
              ) : error ? (
                <p>Error loading orders: {error.message}</p>
              ) : orders?.length > 0 ? (
                <>
                  <div className="row">
                    {orders.map((order) => (
                      <div key={order.id} className="col-md-4 d-flex">
                        <div className="card rounded-3 mb-4 flex-fill">
                          <div className="card-body p-4">
                            <div className="d-flex align-items-center justify-content-between">
                              <span className="badge bg-outline-success d-inline-flex align-items-center">
                                <i className="fas fa-circle fs-6 me-1"></i>
                                {order.priority} -{" "}
                                {teamData?.name ||
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
                                    href={`/order/${order.id}`}
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
                                  <a href="#" className="dropdown-item">
                                    <FaTrash /> Delete
                                  </a>
                                </div>
                              </div>
                            </div>

                            <div className="my-3">
                              <h5 className="text truncate mb-1">
                                <a href={`/order/${order.id}`}>
                                  {order.title || "Untitled Order"} -{" "}
                                  {order.pipeline}
                                </a>
                              </h5>
                              <p className="mb-3 d-flex align-items-center text-dark">
                                <i className="ti ti-calendar me-1"></i>
                                {order.dueDate || "No Due Date"} -{" "}
                                {order.followupDates || "No Follow-up"}
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
                                {order.status}
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
