// src/components/Orders/Modals/ViewOrderModal.jsx
import React from "react";

const ViewOrderModal = ({ order, onClose }) => {
  if (!order) return null;

  return (
    <div className="modal show d-block" tabIndex="-1">
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Order Details - #{order.id}</h5>
            <button
              type="button"
              className="btn-close"
              onClick={onClose}
            ></button>
          </div>
          <div className="modal-body">
            <p>
              <strong>Title:</strong> {order.title}
            </p>
            <p>
              <strong>Status:</strong> {order.status}
            </p>
            <p>
              <strong>Pipeline:</strong> {order.pipeline}
            </p>
            <p>
              <strong>Due Date:</strong> {order.dueDate}
            </p>
            <p>
              <strong>Assigned To:</strong> {order.assignedTo || "—"}
            </p>
            <p>
              <strong>Follow-up Dates:</strong>{" "}
              {order.followupDates?.join(", ")}
            </p>
            <p>
              <strong>Source:</strong> {order.source}
            </p>
            <p>
              <strong>Priority:</strong> {order.priority}
            </p>
            <p>
              <strong>Description:</strong> {order.description}
            </p>
            <p>
              <strong>Created At:</strong>{" "}
              {new Date(order.createdAt).toLocaleDateString()}
            </p>
            <p>
              <strong>Invoice ID:</strong> {order.invoiceId || "—"}
            </p>
          </div>
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewOrderModal;
