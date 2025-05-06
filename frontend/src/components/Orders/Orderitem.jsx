import React from "react";
import {
  FaEdit,
  FaOpencart,
  FaPause,
  FaTrash,
  FaEllipsisH,
  FaCalendar,
  FaFileInvoice,
  FaStar,
} from "react-icons/fa";
import { Dropdown, Button, Badge } from "react-bootstrap";

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
          <Badge bg={order.status === "Active" ? "primary" : "secondary"}>
            {order.status || "Unknown"}
          </Badge>
          <Dropdown>
            <Dropdown.Toggle
              variant="link"
              id={`dropdown-${order.id}`}
              className="text-dark"
              aria-label="Order actions"
            >
              <FaEllipsisH />
            </Dropdown.Toggle>
            <Dropdown.Menu align="end">
              <Dropdown.Item href={`/order/${order.id}`}>
                <FaOpencart className="me-2" /> Open Order
              </Dropdown.Item>
              <Dropdown.Item onClick={() => onEditClick(order)}>
                <FaEdit className="me-2" /> Edit
              </Dropdown.Item>
              <Dropdown.Item onClick={() => onViewInvoice(order)}>
                <FaFileInvoice className="me-2" /> View Invoice
              </Dropdown.Item>
              <Dropdown.Item onClick={() => onHoldClick(order)}>
                <FaPause className="me-2" /> Hold Order
              </Dropdown.Item>
              <Dropdown.Item
                onClick={() => onDeleteOrder(order.id)}
                className="text-danger"
              >
                <FaTrash className="me-2" /> Delete
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
        </div>
        <div className="my-3">
          <h5 className="text-truncate mb-1">
            <a
              href={`/order/${order.id}`}
              className="text-primary fw-medium text-decoration-none d-block text-truncate"
            >
              {order.title || "Untitled Order"} -{" "}
              {order.pipeline || "No Pipeline"}
            </a>
          </h5>
          <p className="mb-3 d-flex align-items-center text-dark date-section">
            <FaCalendar className="me-1" />
            <Button
              size="sm"
              variant={isDueDateClose(order.dueDate) ? "danger" : "info"}
              onClick={() =>
                onOpenDatesModal(order.dueDate, order.followupDates)
              }
            >
              {totalDates} Date{totalDates !== 1 ? "s" : ""}
            </Button>
          </p>
          <p className="description text-wrap">
            {order.description || "No description available"}
          </p>
        </div>
        <div className="d-flex align-items-center justify-content-between border-top pt-3">
          <div className="d-flex align-items-center">
            <a href="#" className="avatar avatar-md me-2">
              <img
                src="assets/img/profiles/avatar-05.jpg"
                alt="Profile"
                className="img-fluid rounded-circle"
              />
            </a>
            <span className="team-info d-flex align-items-center">
              <i
                className="fas fa-square me-1"
                style={{ transform: "rotate(45deg)", fontSize: "10px" }}
              ></i>
              {isTeamLoading ? (
                <span className="text-muted">Loading...</span>
              ) : (
                <span className="text-success">{teamName || "N/A"}</span>
              )}
            </span>
          </div>
          <div className="d-flex align-items-center footer-icons">
            <a href="#" className="me-2">
              <FaStar className="text-warning" />
            </a>
            <a href="#" onClick={() => onDeleteOrder(order.id)}>
              <FaTrash className="text-danger" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderItem;
