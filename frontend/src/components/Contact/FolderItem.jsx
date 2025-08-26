import React from "react";

const FolderItem = ({ folder }) => {
  return (
    <a
      href="javascript:void(0);"
      className="fw-medium d-flex align-items-center text-dark py-1"
    >
      <i className={`ti ti-folder-filled text-${folder.color} me-2`}></i>
      {folder.name}
    </a>
  );
};

export default FolderItem;
