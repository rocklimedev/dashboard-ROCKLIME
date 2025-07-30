import React from "react";
import { FaTimes } from "react-icons/fa";

const OrderFilter = ({ filters, setFilters, onClear }) => {
  const handleFilterChange = (field) => (e) => {
    setFilters((prev) => ({
      ...prev,
      [field]: e.target.value,
      page: 1, // Reset to first page on filter change
    }));
  };

  return (
    <div className="filter-form d-flex align-items-center gap-3">
      <div className="filter-item">
        <div className="filter-input-wrapper">
          <select
            className="filter-input form-select"
            value={filters.status}
            onChange={handleFilterChange("status")}
            aria-label="Filter by status"
          >
            <option value="">All Statuses</option>
            <option value="CREATED">Created</option>
            <option value="COMPLETED">Completed</option>
            <option value="PENDING">Pending</option>
            <option value="ON_HOLD">On Hold</option>
          </select>
        </div>
      </div>
      <div className="filter-item">
        <div className="filter-input-wrapper">
          <select
            className="filter-input form-select"
            value={filters.priority}
            onChange={handleFilterChange("priority")}
            aria-label="Filter by priority"
          >
            <option value="">All Priorities</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
          </select>
        </div>
      </div>
      <div className="filter-item">
        <div className="filter-input-wrapper">
          <select
            className="filter-input form-select"
            value={filters.source}
            onChange={handleFilterChange("source")}
            aria-label="Filter by source"
          >
            <option value="">All Sources</option>
            <option value="WEB">Web</option>
            <option value="MOBILE">Mobile</option>
            <option value="MANUAL">Manual</option>
          </select>
        </div>
      </div>
      <div className="filter-buttons">
        <button className="btn btn-outline-red btn-clear" onClick={onClear}>
          <FaTimes className="me-2" /> Clear Filters
        </button>
      </div>
    </div>
  );
};

export default OrderFilter;
