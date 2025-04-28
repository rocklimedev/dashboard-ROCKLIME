import React from "react";
import { FaEdit, FaOpencart, FaPause, FaTrash } from "react-icons/fa";

const OrderItem = ({
  order,
  teamName,
  isTeamLoading,
  onEditClick,
  onHoldClick,
  onViewInvoice,
  onDeleteOrder,
  onOpenDatesModal,
  isDueDateClose,
}) => {
  const totalDates =
    (order.dueDate ? 1 : 0) + (order.followupDates?.length || 0);

  return (
    <div className="order-card card rounded-3 mb-4 flex-fill">
      <div className="card-body p-4">
        <div className="d-flex align-items-center justify-content-between mb-3">
          <span
            className={`badge ${
              order.status === "Active" ? "badge-primary" : "badge-secondary"
            }`}
          >
            {order.status || "Unknown"}
          </span>
          <div className="dropdown">
            <button
              className="dropdown-toggle"
              data-bs-toggle="dropdown"
              aria-expanded="false"
              aria-label="Order actions"
            >
              <i className="fas fa-ellipsis-h"></i>
            </button>
            <div className="dropdown-menu dropdown-menu-end">
              <a
                href={`/order/${order.id}`}
                className="dropdown-item d-flex align-items-center"
              >
                <FaOpencart className="me-2" /> Open Order
              </a>
              <button
                className="dropdown-item d-flex align-items-center"
                onClick={() => onEditClick(order)}
              >
                <FaEdit className="me-2" /> Edit
              </button>
              <button
                className="dropdown-item d-flex align-items-center"
                onClick={() => onViewInvoice(order)}
              >
                <i className="fas fa-file-invoice me-2"></i> View Invoice
              </button>
              <button
                className="dropdown-item d-flex align-items-center"
                onClick={() => onHoldClick(order)}
              >
                <FaPause className="me-2" /> Hold Order
              </button>
              <button
                className="dropdown-item d-flex align-items-center text-danger"
                onClick={() => onDeleteOrder(order.id)}
              >
                <FaTrash className="me-2" /> Delete
              </button>
            </div>
          </div>
        </div>
        <div className="my-3">
          <h5 className="text-truncate mb-1">
            <a
              href={`/order/${order.id}`}
              className="text-primary font-weight-medium text-decoration-none d-block text-truncate"
            >
              {order.title || "Untitled Order"} -{" "}
              {order.pipeline || "No Pipeline"}
            </a>
          </h5>
          <p className="mb-3 d-flex align-items-center text-dark date-section">
            <i className="ti ti-calendar me-1"></i>{" "}
            <button
              className={`btn btn-sm ${
                isDueDateClose(order.dueDate) ? "btn-danger" : "btn-info"
              }`}
              onClick={() =>
                onOpenDatesModal(order.dueDate, order.followupDates)
              }
            >
              {totalDates} Date{totalDates !== 1 ? "s" : ""}
            </button>
          </p>
          <p className="description text-wrap">
            {order.description || "No description available"}
          </p>
        </div>
        <div className="d-flex align-items-center justify-content-between border-top pt-3">
          <div className="d-flex align-items-center">
            <a href="javascript:void(0);" className="avatar avatar-md me-2">
              <img
                src="assets/img/profiles/avatar-05.jpg"
                alt="Profile"
                className="img-fluid rounded-circle"
              />
            </a>
            <span className="team-info d-flex align-items-center">
              <i className="fas fa-square square-rotate fs-10 me-1"></i>{" "}
              {isTeamLoading ? (
                <span className="text-muted">Loading...</span>
              ) : (
                <span className="text-success">{teamName || "N/A"}</span>
              )}
            </span>
          </div>
          <div className="d-flex align-items-center footer-icons">
            <a href="javascript:void(0);" className="me-2">
              <span>
                <i className="fas fa-star text-warning"></i>
              </span>
            </a>
            <a
              href="javascript:void(0);"
              onClick={() => onDeleteOrder(order.id)}
            >
              <span>
                <i className="ti ti-trash text-danger"></i>
              </span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderItem;
