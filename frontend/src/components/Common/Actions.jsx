import React from "react";
import { EyeOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
const Actions = ({ id, name, viewUrl, editUrl, onDelete }) => {
  return (
    <div class="edit-delete-action">
      <a
        class="me-2 edit-icon  p-2"
        target="_blank"
        rel="noopener noreferrer"
        href={`${viewUrl}`}
      >
        <EyeOutlined className="align-middle fs-18" />
      </a>
      <a class="me-2 p-2" href={`${editUrl}`}>
        <EditOutlined className="align-middle fs-18" />
      </a>
      <a class="p-2" onClick={onDelete}>
        <DeleteOutlined className="align-middle fs-18" />
      </a>
    </div>
  );
};

export default Actions;
