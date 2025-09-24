import React from "react";
import { Modal, Button } from "react-bootstrap";
import { DeleteOutlined } from "@ant-design/icons";
const DeleteModal = ({ item, itemType, onConfirm, onCancel, isVisible }) => {
  return (
    <Modal
      show={isVisible}
      onHide={onCancel}
      centered
      backdrop="static"
      keyboard={false}
    >
      <Modal.Body className="text-center p-4">
        <span className="rounded-circle d-inline-flex p-2 bg-danger-transparent mb-3">
          <DeleteOutlined />
        </span>
        <h4 className="fs-20 text-gray-9 fw-bold mb-2 mt-1">
          Delete {itemType}
        </h4>
        <p className="text-gray-6 mb-0 fs-16">
          Are you sure you want to delete {itemType}?
        </p>
        <div className="d-flex justify-content-center gap-2 mt-4">
          <Button
            variant="secondary"
            onClick={onCancel}
            className="px-3 py-2 fs-13 fw-medium shadow-none"
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={() => onConfirm(item)}
            className="px-3 py-2 fs-13 fw-medium"
          >
            Yes, Delete
          </Button>
        </div>
      </Modal.Body>
    </Modal>
  );
};

export default DeleteModal;
