import React from "react";
import { FolderOutlined } from "@ant-design/icons";
const FolderItem = ({ folder }) => {
  return (
    <a
      href="javascript:void(0);"
      className="fw-medium d-flex align-items-center text-dark py-1"
    >
      <FolderOutlined />
      {folder.name}
    </a>
  );
};

export default FolderItem;
