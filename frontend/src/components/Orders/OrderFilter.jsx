import React from "react";
import { useGetFilteredOrdersQuery } from "../../api/orderApi";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const OrderFilter = ({ setFilters }) => {
  const { data: orderCountsData, isLoading: countsLoading } =
    useGetFilteredOrdersQuery(
      {
        status: "",
        priority: "",
        important: false,
        trash: false,
        page: 1,
        limit: 100, // Reduced from 1000 to improve performance
      },
      {
        selectFromResult: ({ data }) => ({
          data: data?.orders?.reduce((acc, order) => {
            acc[order.status] = (acc[order.status] || 0) + 1;
            return acc;
          }, {}),
        }),
      }
    );

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

  const applyFilter = (key, value) => {
    setFilters((prev) => {
      let newFilters = { ...prev, page: 1 };
      if (key === "status" && value === "all") {
        newFilters = {
          ...newFilters,
          status: "",
          priority: "",
        };
      } else if (key === "priority") {
        newFilters = {
          ...newFilters,
          status: "",
          priority: value,
        };
      } else {
        newFilters = {
          ...newFilters,
          status: value,
          priority: "",
        };
      }
      return newFilters;
    });
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
    <div className="border rounded-3 bg-white p-4 shadow-sm">
      <div className="mb-4 border-bottom pb-2 d-flex justify-content-between align-items-center">
        <h5 className="fw-bold text-secondary d-flex align-items-center">
          <i className="ti ti-file-text me-2"></i> Order Filters
        </h5>
        <button
          className="btn btn-sm btn-secondary"
          onClick={handleClearFilters}
        >
          Clear Filters
        </button>
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
              <i className="ti ti-urgent me-2"></i>
              {priority.charAt(0).toUpperCase() + priority.slice(1)} Priority
            </button>
          ))}
        </div>
      </div>

      <div className="mb-4">
        <h6 className="text-muted mb-3">Filter by Status</h6>
        {countsLoading ? (
          <div className="text-center">
            <div className="spinner-border spinner-border-sm" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        ) : (
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
                  {orderCountsData?.[status] || 0}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default OrderFilter;
