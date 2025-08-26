import React from "react";

const SidebarCategory = ({ category, isActive, onClick }) => {
  return (
    <a
      href="javascript:void(0);"
      className={`d-flex align-items-center justify-content-between p-2 rounded ${
        isActive ? "active" : ""
      }`}
      onClick={onClick}
    >
      <span className="d-flex align-items-center fw-medium">
        <i className={`ti ${category.icon} text-gray me-2`}></i>
        {category.name}
      </span>
      <span
        className={`badge shadow-none ${category.badgeClass} rounded-pill badge-xs`}
      >
        {category.count}
      </span>
    </a>
  );
};

export default SidebarCategory;
