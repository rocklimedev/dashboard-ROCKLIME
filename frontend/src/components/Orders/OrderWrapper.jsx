import React, { useState } from "react";
import PageHeader from "../Common/PageHeader";
import OrderPagination from "./OrderPagination";
import OrderList from "./OrderList";
import OrderFilter from "./OrderFilter";
import AddNewOrder from "./AddNewOrder";
import OnHoldModal from "./OnHoldOrder";
import OrderItem from "./Orderitem";
import { useGetAllOrdersQuery } from "../../api/orderApi";
import DataTablePagination from "../Common/DataTablePagination";
import avatar from "../../assets/img/profiles/avatar-01.jpg";
import { FaEdit, FaOpencart, FaPause, FaTrash } from "react-icons/fa";
import { useGetInvoiceByIdQuery } from "../../api/invoiceApi"; // adjust path if needed

const OrderWrapper = () => {
  const [showModal, setShowModal] = useState(false);
  const [showHoldModal, setShowHoldModal] = useState(false); // new state
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [filters, setFilters] = useState({ page: 1, limit: 6 });

  const { data, error, isLoading } = useGetAllOrdersQuery(filters);
  const orders = data?.orders || [];
  const totalCount = data?.totalCount || 0;

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
    const invoiceId = order.invoiceId; // assuming this field exists on the order
    if (invoiceId) {
      // You could navigate, show a modal, or call the hook imperatively
      window.open(`/invoice/${invoiceId}`, "_blank"); // example behavior
    } else {
      alert("Invoice ID not found.");
    }
  };

  return (
    <div className="page-wrapper notes-page-wrapper">
      <div className="content">
        {/* Header */}
        <div className="page-header page-add-notes border-0 flex-sm-row flex-column">
          <div className="add-item d-flex">
            <div className="page-title">
              <h4>Orders</h4>
              <h6 className="mb-0">Manage your orders</h6>
            </div>
          </div>
          <div className="d-flex flex-sm-row flex-column align-items-sm-center align-items-start">
            <div className="page-btn">
              <button
                onClick={() => {
                  setSelectedOrder(null);
                  setShowModal(true);
                }}
                className="btn btn-primary"
              >
                <i className="ti ti-circle-plus me-1"></i>Add New Order
              </button>
            </div>
          </div>
        </div>

        {/* Filters and Orders */}
        <div className="row">
          <OrderFilter setFilters={setFilters} />
          <div className="col-xl-9 budget-role-notes">
            <div className="tab-content">
              <div className="tab-pane fade active show">
                <div className="border-bottom mb-4 pb-4">
                  <h4>All Orders</h4>
                </div>

                {isLoading ? (
                  <p>Loading...</p>
                ) : error ? (
                  <p>Error loading orders!</p>
                ) : orders.length > 0 ? (
                  <div className="row">
                    {orders.map((order) => (
                      <div key={order.id} className="col-md-4 d-flex">
                        <div className="card rounded-3 mb-4 flex-fill">
                          <div className="card-body p-4">
                            <div className="d-flex align-items-center justify-content-between">
                              <span className="badge bg-outline-success d-inline-flex align-items-center">
                                <i className="fas fa-circle fs-6 me-1"></i>
                                {order.priority} - {order.assignedTo || "null"}
                              </span>
                              <div>
                                <a
                                  href="javascript:void(0);"
                                  data-bs-toggle="dropdown"
                                  aria-expanded="false"
                                >
                                  <i className="fas fa-ellipsis-v"></i>
                                </a>
                                <div className="dropdown-menu notes-menu dropdown-menu-end">
                                  <a
                                    href={`/order/${order.invoiceId}`}
                                    className="dropdown-item"
                                  >
                                    <span>
                                      <FaOpencart />
                                    </span>{" "}
                                    Open Order
                                  </a>
                                  <a
                                    href="#"
                                    className="dropdown-item"
                                    onClick={() => handleEditClick(order)}
                                  >
                                    <span>
                                      <FaEdit />
                                    </span>{" "}
                                    Edit
                                  </a>
                                  <a
                                    href="#"
                                    className="dropdown-item"
                                    onClick={() => handleViewInvoice(order)}
                                  >
                                    <span>
                                      <i className="fas fa-file-invoice"></i>
                                    </span>{" "}
                                    View Invoice
                                  </a>

                                  <a
                                    href="#"
                                    className="dropdown-item"
                                    onClick={() => handleHoldClick(order)}
                                  >
                                    <span>
                                      <FaPause />
                                    </span>{" "}
                                    Hold Order
                                  </a>
                                  <a href="#" className="dropdown-item">
                                    <span>
                                      <FaTrash />
                                    </span>{" "}
                                    Delete
                                  </a>
                                </div>
                              </div>
                            </div>

                            <div className="my-3">
                              <h5 className="text-truncate mb-1">
                                <a href={`/order/${order.invoiceId}`}>
                                  {order.title || "Order Title"} -{" "}
                                  {order.pipeline}
                                </a>
                              </h5>
                              <p className="mb-3 d-flex align-items-center text-dark">
                                <i className="ti ti-calendar me-1"></i>{" "}
                                {order.dueDate || "No Due Date"} -{" "}
                                {order.followupDates}
                              </p>
                              <p className="text-truncate line-clamb-2 text-wrap">
                                {order.description ||
                                  "No description available"}
                              </p>
                            </div>

                            <div className="d-flex align-items-center justify-content-between border-top pt-3">
                              <span className="text-warning d-flex align-items-center">
                                <i className="fas fa-square square-rotate fs-10 me-1"></i>{" "}
                                {order.source || "Unknown"}
                              </span>
                              <span className="text-info d-flex align-items-center">
                                <i className="fas fa-square square-rotate fs-10 me-1"></i>{" "}
                                {order.status}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p>No orders found.</p>
                )}

                <DataTablePagination
                  totalItems={totalCount}
                  itemNo={filters.limit}
                  onPageChange={handlePageChange}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showModal && (
        <AddNewOrder onClose={handleModalClose} orderToEdit={selectedOrder} />
      )}
      {showHoldModal && (
        <OnHoldModal onClose={handleModalClose} order={selectedOrder} />
      )}
    </div>
  );
};

export default OrderWrapper;
