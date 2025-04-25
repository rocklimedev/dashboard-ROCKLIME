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
    <div className="card shadow-sm mb-3">
      <div className="card-header bg-light">
        <a
          href={`/orders/${order.id}`}
          className="text-primary font-weight-medium text-decoration-none d-block text-truncate"
        >
          {order.title || "Untitled Order"} - {order.pipeline || "No Pipeline"}
        </a>
      </div>
      <div className="card-body py-3 px-4">
        <div className="row">
          <div className="col-12 col-md-6 mb-2">
            <p className="text-muted small mb-0 text-truncate">
              {order.description || "No description available"}
            </p>
          </div>
          <div className="col-6 col-md-3 mb-2">
            <strong>Priority: </strong>
            <span className="text-muted">{order.priority || "None"}</span>
          </div>
          <div className="col-6 col-md-3 mb-2">
            <strong>Team: </strong>
            {isTeamLoading ? (
              <span className="text-muted">Loading...</span>
            ) : (
              <span className="text-success">{teamName}</span>
            )}
          </div>
          <div className="col-6 col-md-3 mb-2">
            <strong>Status: </strong>
            <span
              className={`badge ${
                order.status === "Active" ? "badge-primary" : "badge-secondary"
              }`}
            >
              {order.status || "Unknown"}
            </span>
          </div>
          <div className="col-6 col-md-3 mb-2">
            <strong>Source: </strong>
            <span className="text-muted">{order.source || "Unknown"}</span>
          </div>
          <div className="col-6 col-md-3">
            <strong>Dates: </strong>
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
          </div>
        </div>
      </div>
      <div className="card-footer bg-white text-right py-2">
        <div className="dropdown">
          <button
            className="btn btn-link text-muted p-0"
            data-bs-toggle="dropdown"
            aria-expanded="false"
            aria-label="Order actions"
          >
            <i className="fas fa-ellipsis-v"></i>
          </button>
          <div className="dropdown-menu dropdown-menu-end">
            <a
              href={`/orders/${order.id}`}
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
    </div>
  );
};

export default OrderItem;
