import React, { useState } from "react";

const OnHoldModal = ({ order, invoice, onClose, onConfirm }) => {
  const [reference, setReference] = useState(order?.source || "");

  const handleSubmit = (e) => {
    e.preventDefault();
    onConfirm(reference);
  };

  return (
    <div className="modal fade show d-block" tabIndex="-1" role="dialog">
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Hold order</h5>
            <button
              type="button"
              className="close"
              onClick={onClose}
              aria-label="Close"
            >
              <span aria-hidden="true">×</span>
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <div className="bg-light br-10 p-4 text-center mb-3">
                <h2 className="display-1">{invoice?.amount || "₹ 0.00"}</h2>
              </div>
              <div className="mb-3">
                <label className="form-label">
                  Order Reference <span className="text-danger">*</span>
                </label>
                <input
                  className="form-control"
                  type="text"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  required
                />
              </div>
              <p>
                The current order will be set on hold. You can retrieve it from
                the pending orders. A reference might help you identify it more
                quickly.
              </p>
            </div>

            <div className="modal-footer d-flex justify-content-end gap-2">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onClose}
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                Confirm
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default OnHoldModal;
