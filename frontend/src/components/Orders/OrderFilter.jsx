import React from "react";

const OrderFilter = ({ setFilters }) => {
  const applyFilter = (key, value) => {
    setFilters((prev) => {
      let newFilters = { ...prev, page: 1 };
      if (key === "status" && value === "all") {
        // Reset all filters for "All Orders"
        newFilters = {
          ...newFilters,
          status: "",
          priority: "",
        };
      } else if (key === "priority") {
        // Apply priority filter and reset status
        newFilters = {
          ...newFilters,
          status: "",
          priority: value,
        };
      } else {
        // Apply status filter and reset priority
        newFilters = {
          ...newFilters,
          status: value,
          priority: "",
        };
      }
      return newFilters;
    });
  };

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

  const priorities = ["high", "medium", "low"];

  return (
    <div className="border rounded-3 bg-white p-4 shadow-sm">
      <div className="mb-4 border-bottom pb-2">
        <h5 className="fw-bold text-secondary d-flex align-items-center">
          <i className="ti ti-file-text me-2"></i> Order Filters
        </h5>
      </div>

      <div className="mb-4">
        <h6 className="text-muted mb-3">Quick Actions</h6>
        <div className="btn-group-vertical w-100">
          <button
            className="btn btn-outline-primary mb-2"
            onClick={() => applyFilter("status", "all")}
          >
            <i className="ti ti-inbox me-2"></i>All Orders
          </button>
          {priorities.map((priority) => (
            <button
              key={priority}
              className={`btn btn-outline-${
                priority === "high"
                  ? "danger"
                  : priority === "medium"
                  ? "warning"
                  : "secondary"
              } mb-2`}
              onClick={() => applyFilter("priority", priority)}
            >
              <i className={`ti ti-urgent me-2`}></i>
              {priority.charAt(0).toUpperCase() + priority.slice(1)} Priority
            </button>
          ))}
        </div>
      </div>

      <div className="mb-4">
        <h6 className="text-muted mb-3">Filter by Status</h6>
        <ul className="list-group">
          {statuses.map((status) => (
            <li
              key={status}
              className="list-group-item list-group-item-action d-flex justify-content-between align-items-center"
              role="button"
              onClick={() => applyFilter("status", status)}
            >
              {status.replace(/_/g, " ")}
              <span className="badge bg-light text-secondary">
                {status.length}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default OrderFilter;
