import React from "react";

const DeleteModal = ({ item, itemType, onConfirm, onCancel, isVisible }) => {
  if (!isVisible) return null; // Hide modal when not visible

  return (
    <div className="modal fade show" style={{ display: "block" }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="page-wrapper-new p-0">
            <div className="content p-5 px-3 text-center">
              <span className="rounded-circle d-inline-flex p-2 bg-danger-transparent mb-2">
                <i className="ti ti-trash fs-24 text-danger"></i>
              </span>
              <h4 className="fs-20 text-gray-9 fw-bold mb-2 mt-1">
                Delete {itemType}
              </h4>
              <p className="text-gray-6 mb-0 fs-16">
                Are you sure you want to delete {itemType}?
              </p>
              <div className="modal-footer-btn mt-3 d-flex justify-content-center">
                <button
                  type="button"
                  className="btn me-2 btn-secondary fs-13 fw-medium p-2 px-3 shadow-none"
                  onClick={onCancel} // Handle cancel action
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary fs-13 fw-medium p-2 px-3"
                  onClick={() => onConfirm(item)} // Handle delete confirmation
                >
                  Yes, Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteModal;
