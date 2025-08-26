import React from "react";

const LabelItem = ({ label }) => {
  return (
    <a
      href="javascript:void(0);"
      className="fw-medium d-flex align-items-center text-dark py-1"
    >
      <i className={`ti ti-square-rounded text-${label.color} me-2`}></i>
      {label.name}
    </a>
  );
};

export default LabelItem;
