import React from "react";
import { useGetAllOrdersQuery } from "../../api/orderApi";
import { toast } from "sonner";

const OrderFilter = ({ setFilters }) => {
  const {
    data,
    isLoading: countsLoading,
    isFetching: countsFetching,
    error,
  } = useGetAllOrdersQuery(
    {
      page: 1,
      limit: 100, // Reduced for performance
    },
    {
      selectFromResult: ({ data, error }) => ({
        data: {
          statusCounts:
            data?.orders?.reduce((acc, order) => {
              acc[order.status] = (acc[order.status] || 0) + 1;
              return acc;
            }, {}) || {},
          priorityCounts:
            data?.orders?.reduce((acc, order) => {
              acc[order.priority] = (acc[order.priority] || 0) + 1;
              return acc;
            }, {}) || {},
        },
        error,
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

  // Prepare status and priority counts with fallbacks
  const statusCounts = data?.statusCounts
    ? Object.entries(data.statusCounts)
    : statuses.map((status) => [status, 0]);
  const priorityCounts = data?.priorityCounts
    ? Object.entries(data.priorityCounts)
    : priorities.map((priority) => [priority, 0]);

  const applyFilter = (key, value) => {
    setFilters((prev) => {
      const newFilters = {
        ...prev,
        page: 1,
        status: key === "status" && value !== "all" ? value : "",
        priority: key === "priority" ? value : "",
      };

      return newFilters;
    });
  };

  const handleClearFilters = () => {
    const defaultFilters = {
      status: "",
      priority: "",
      important: false,
      trash: false,
      page: 1,
      limit: 10,
    };
    setFilters(defaultFilters);
    toast.success("Filters cleared!");
  };

  if (error) {
    toast.error(
      `Failed to load order counts: ${error?.data?.message || "Unknown error"}`
    );
  }

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
            disabled={countsLoading || countsFetching}
          >
            <i className="ti ti-inbox me-2"></i>All Orders
            <span className="badge bg-light text-secondary ms-2">
              {data?.statusCounts
                ? Object.values(data.statusCounts).reduce(
                    (sum, count) => sum + count,
                    0
                  )
                : 0}
            </span>
          </button>
          {priorityCounts.map(([priority, count]) => (
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
              disabled={countsLoading || countsFetching}
            >
              <i className="ti ti-urgent me-2"></i>
              {priority.charAt(0).toUpperCase() + priority.slice(1)} Priority
              <span className="badge bg-light text-secondary ms-2">
                {count}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="mb-4">
        <h6 className="text-muted mb-3">Filter by Status</h6>
        {countsLoading || countsFetching ? (
          <div className="text-center">
            <div className="spinner-border spinner-border-sm" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        ) : (
          <ul className="list-group">
            {statusCounts.map(([status, count]) => (
              <li
                key={status}
                className="list-group-item list-group-item-action d-flex justify-content-between align-items-center"
                role="button"
                onClick={() => applyFilter("status", status)}
              >
                {status.replace(/_/g, " ")}
                <span className="badge bg-light text-secondary">{count}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default OrderFilter;
