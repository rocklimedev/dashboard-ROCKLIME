import React from "react";
import { FaSearch, FaTimes } from "react-icons/fa";

const OrderFilter = ({ setFilters, onClear }) => {
  const handleFilterChange = (field) => (e) => {
    setFilters((prev) => ({
      ...prev,
      [field]: e.target.value,
      page: 1, // Reset to first page on filter change
    }));
  };

  return (
    <div className="filter-form">
      <div className="filter-item">
        <div className="filter-input-wrapper">
          <span className="filter-icon">
            <FaSearch />
          </span>
          <select
            className="filter-input"
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
          <span className="filter-icon">
            <FaSearch />
          </span>
          <select
            className="filter-input"
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
          <span className="filter-icon">
            <FaSearch />
          </span>
          <select
            className="filter-input"
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
        <button
          className="btn btn-red btn-filter"
          onClick={() => setFilters((prev) => ({ ...prev }))}
        >
          <FaSearch className="me-2" /> Search
        </button>
        <button className="btn btn-outline-red btn-clear" onClick={onClear}>
          <FaTimes className="me-2" /> Clear Filters
        </button>
      </div>
    </div>
  );
};

export default OrderFilter;
