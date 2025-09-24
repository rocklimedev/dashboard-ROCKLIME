import React from "react";
import { TagsOutlined } from "@ant-design/icons";
const LabelItem = ({ label }) => {
  return (
    <a
      href="javascript:void(0);"
      className="fw-medium d-flex align-items-center text-dark py-1"
    >
      <TagsOutlined />
      {label.name}
    </a>
  );
};

export default LabelItem;
