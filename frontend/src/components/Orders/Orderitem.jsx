import React from "react";
import {
  FaEdit,
  FaOpencart,
  FaPause,
  FaTrash,
  FaEllipsisH,
  FaFileInvoice,
} from "react-icons/fa";
import { Dropdown, Badge } from "react-bootstrap";

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
  // Mapping status to badge colors (based on image)
  const getStatusBadge = (status) => {
    switch (status.toLowerCase()) {
      case "new order":
        return <Badge bg="primary">New Order</Badge>;
      case "inprogress":
        return <Badge bg="warning">Inprogress</Badge>;
      case "shipped":
        return <Badge bg="success">Shipped</Badge>;
      case "cancelled":
        return <Badge bg="danger">Cancelled</Badge>;
      case "rejected":
        return <Badge bg="danger">Rejected</Badge>;
      case "draft":
        return <Badge bg="secondary">Draft</Badge>;
      default:
        return <Badge bg="secondary">{status || "Unknown"}</Badge>;
    }
  };

  // Mapping shipping service to colored dots (based on image)
  const getShippingIcon = (service) => {
    switch (service.toLowerCase()) {
      case "standard":
        return <span className="text-primary">●</span>;
      case "priority":
        return <span className="text-info">●</span>;
      case "express":
        return <span className="text-danger">●</span>;
      default:
        return <span>●</span>;
    }
  };

  return (
    <tr>
      <td>{order.id || "N/A"}</td>
      <td>{getStatusBadge(order.status)}</td>
      <td>{order.itemCount || 1}</td> {/* Assuming itemCount from order data */}
      <td>{order.orderNumber || "N/A"}</td>
      <td>{order.customerName || "N/A"}</td>
      <td>
        {getShippingIcon(order.shippingService)}{" "}
        {order.shippingService || "N/A"}
      </td>
      <td>{order.trackingCode || "N/A"}</td>
      <td>
        <Dropdown>
          <Dropdown.Toggle
            variant="link"
            id={`dropdown-${order.id}`}
            className="text-dark p-0"
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
      </td>
    </tr>
  );
};

export default OrderItem;
