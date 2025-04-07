import React from "react";
import { IoEyeOutline } from "react-icons/io5";
import { FaPen } from "react-icons/fa";
import { ImBin } from "react-icons/im";

const Actions = ({ id, name, viewUrl, editUrl, onDelete }) => {
  return (
    <div class="edit-delete-action">
      <a
        class="me-2 edit-icon  p-2"
        target="_blank"
        rel="noopener noreferrer"
        href={`${viewUrl}`}
      >
        <IoEyeOutline className="align-middle fs-18" />
      </a>
      <a class="me-2 p-2" href={`${editUrl}`}>
        <FaPen className="align-middle fs-18" />
      </a>
      <a class="p-2" onClick={onDelete}>
        <ImBin className="align-middle fs-18" />
      </a>
    </div>
  );
};

export default Actions;
