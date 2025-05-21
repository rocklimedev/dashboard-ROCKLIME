// src/components/Orders/Modals/EditOrderModal.jsx
import React, { useState } from "react";
import { useUpdateOrderByIdMutation } from "../../api/orderApi";
import { toast } from "sonner";
const EditOrderModal = ({ order, onClose }) => {
  const [formData, setFormData] = useState({ ...order });
  const [updateOrder] = useUpdateOrderByIdMutation();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    try {
      await updateOrder({ id: order.id, ...formData }).unwrap();
      onClose();
    } catch (err) {
      toast.error("Failed to update order:", err);
    }
  };

  return (
    <div className="modal show d-block" tabIndex="-1">
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Edit Order - #{order.id}</h5>
            <button
              type="button"
              className="btn-close"
              onClick={onClose}
            ></button>
          </div>
          <div className="modal-body">
            <div className="mb-3">
              <label className="form-label">Title</label>
              <input
                type="text"
                name="title"
                className="form-control"
                value={formData.title}
                onChange={handleChange}
              />
            </div>
            <div className="mb-3">
              <label className="form-label">Status</label>
              <input
                type="text"
                name="status"
                className="form-control"
                value={formData.status}
                onChange={handleChange}
              />
            </div>
            <div className="mb-3">
              <label className="form-label">Due Date</label>
              <input
                type="date"
                name="dueDate"
                className="form-control"
                value={formData.dueDate}
                onChange={handleChange}
              />
            </div>
            <div className="mb-3">
              <label className="form-label">Priority</label>
              <input
                type="text"
                name="priority"
                className="form-control"
                value={formData.priority}
                onChange={handleChange}
              />
            </div>
            {/* Add more fields as needed */}
          </div>
          <div className="modal-footer">
            <button className="btn btn-primary" onClick={handleSubmit}>
              Save Changes
            </button>
            <button className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditOrderModal;
