import React, { useState, useEffect } from "react";
import {
  useCreateCustomerMutation,
  useUpdateCustomerMutation,
} from "../../api/customerApi";
const AddCustomer = ({ onClose, existingCustomer }) => {
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const [createCustomer, { isLoading: isCreating, error: createError }] =
    useCreateCustomerMutation();
  const [updateCustomer, { isLoading: isEditing, error: editError }] =
    useUpdateCustomerMutation();
  const [formData, setFormData] = useState({
    name: "",
    companyName: "",
    email: "",
    mobileNumber: "",
    isVendor: false,
    totalAmount: "",
    paidAmount: "",
    balance: "",
    dueDate: "",
    paymentMode: "",
    invoiceStatus: "Draft",
  });
  useEffect(() => {
    if (existingCustomer) {
      setFormData((prevData) => ({
        ...prevData,
        ...existingCustomer,
      }));
    }
  }, [existingCustomer]);

  const handleEditCustomer = (customer) => {
    console.log("Editing customer:", customer); // ✅ Debugging
    setSelectedCustomer(customer);
    setShowModal(true);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]:
        name === "isVendor"
          ? value === "true"
          : type === "checkbox"
          ? checked
          : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (existingCustomer) {
        await updateCustomer({
          id: existingCustomer.customerId,
          ...formData,
        }).unwrap();
        alert("Customer updated successfully!");
      } else {
        await createCustomer(formData).unwrap();
        alert("Customer added successfully!");
      }
      onClose();
    } catch (err) {
      console.error("Failed to add/update customer:", err);
    }
  };

  return (
    <div className="modal fade show" style={{ display: "block" }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h4 className="modal-title">
              {existingCustomer ? "Edit Customer" : "Add Customer"}
            </h4>
            <button
              type="button"
              className="close"
              onClick={onClose} // Ensure this calls the prop function
            >
              <span>&times;</span>
            </button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <div className="row">
                <div className="col-lg-6 mb-3">
                  <label className="form-label">
                    Name<span className="text-danger ms-1">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    className="form-control"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="col-lg-6 mb-3">
                  <label className="form-label">
                    Company Name<span className="text-danger ms-1">*</span>
                  </label>
                  <input
                    type="text"
                    name="companyName"
                    className="form-control"
                    value={formData.companyName}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="col-lg-6 mb-3">
                  <label className="form-label">
                    Email<span className="text-danger ms-1">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    className="form-control"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="col-lg-6 mb-3">
                  <label className="form-label">
                    Phone<span className="text-danger ms-1">*</span>
                  </label>
                  <input
                    type="tel"
                    name="mobileNumber"
                    className="form-control"
                    value={formData.mobileNumber}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="col-lg-6 mb-3">
                  <label className="form-label">
                    Is Vendor?<span className="text-danger ms-1">*</span>
                  </label>
                  <select
                    name="isVendor"
                    className="form-control"
                    value={formData.isVendor}
                    onChange={handleChange}
                    required
                  >
                    <option value={true}>Yes</option>
                    <option value={false}>No</option>
                  </select>
                </div>
                <div className="col-lg-6 mb-3">
                  <label className="form-label">
                    Total Amount<span className="text-danger ms-1">*</span>
                  </label>
                  <input
                    type="number"
                    name="totalAmount"
                    className="form-control"
                    value={formData.totalAmount}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="col-lg-6 mb-3">
                  <label className="form-label">
                    Paid Amount<span className="text-danger ms-1">*</span>
                  </label>
                  <input
                    type="number"
                    name="paidAmount"
                    className="form-control"
                    value={formData.paidAmount}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="col-lg-6 mb-3">
                  <label className="form-label">
                    Balance<span className="text-danger ms-1">*</span>
                  </label>
                  <input
                    type="number"
                    name="balance"
                    className="form-control"
                    value={formData.balance}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="col-lg-6 mb-3">
                  <label className="form-label">
                    Due Date<span className="text-danger ms-1">*</span>
                  </label>
                  <input
                    type="date"
                    name="dueDate"
                    className="form-control"
                    value={formData.dueDate}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="col-lg-6 mb-3">
                  <label className="form-label">
                    Payment Mode<span className="text-danger ms-1">*</span>
                  </label>
                  <select
                    name="paymentMode"
                    className="form-control"
                    value={formData.paymentMode}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select Mode</option>
                    <option value="Cash">Cash</option>
                    <option value="Credit Card">Credit Card</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="UPI">UPI</option>
                  </select>
                </div>
                <div className="col-lg-12 mb-3">
                  <label className="form-label">
                    Invoice Status<span className="text-danger ms-1">*</span>
                  </label>
                  <select
                    name="invoiceStatus"
                    className="form-control"
                    value={formData.invoiceStatus}
                    onChange={handleChange}
                    required
                  >
                    <option value="Paid">Paid</option>
                    <option value="Overdue">Overdue</option>
                    <option value="Cancelled">Cancelled</option>
                    <option value="Partially Paid">Partially Paid</option>
                    <option value="Undue">Undue</option>
                    <option value="Draft">Draft</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                data-bs-dismiss="modal"
                onClick={onClose}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isCreating || isEditing}
              >
                {isCreating || isEditing
                  ? "Processing..."
                  : existingCustomer
                  ? "Update Customer"
                  : "Add Customer"}
              </button>
            </div>
            {(createError || editError) && (
              <p className="text-danger mt-2">
                {createError?.data?.message ||
                  editError?.data?.message ||
                  "Error processing request"}
              </p>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddCustomer;
