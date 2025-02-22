import React, { useState } from "react";
import { useCreateVendorMutation } from "../../api/vendorApi.js";
const AddCompanyModal = ({ show, onClose }) => {
  const [formData, setFormData] = useState({
    vendorId: "",
    vendorName: "",
    brandSlug: "",
  });

  const [addVendor, { isLoading, isError, isSuccess }] =
    useCreateVendorMutation();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await addVendor(formData).unwrap();
      alert("Vendor added successfully!");
    } catch (error) {
      console.error("Failed to add vendor: ", error);
    }
  };
  return (
    <div
      className={`modal custom-modal fade ${show ? "show d-block" : ""}`}
      id="add_companies"
    >
      <div className="modal-dialog modal-dialog-centered modal-md">
        <div className="modal-content">
          <div className="modal-header border-0">
            <div className="form-header modal-header-title text-start mb-0">
              <h4 className="mb-0">Add New Company</h4>
            </div>
            <button
              type="button"
              className="btn-close"
              onClick={onClose}
            ></button>
          </div>
          <form
             onSubmit={handleSubmit}
          >
            <div className="modal-body">
              <div className="row">
                <div className="col-md-12">
                  <div className="input-block mb-3">
                    <label className="form-label">Vendor Id</label>
                    <div className="url-text-box">
                      <input
                        type="text"
                        className="form-control"
                        name="vendorId"
                        placeholder="Vendor ID"
                        value={formData.vendorId}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                </div>
                <div className="col-md-12">
                  <div className="input-block mb-3">
                    <label className="form-label">Vendor Name</label>
                    <input
                      type="text"
                      name="vendorName"
                      className="form-control"
                      placeholder="Vendor Name"
                      value={formData.vendorName}
                      onChange={handleChange}
                    />
                  </div>
                </div>
                <div className="col-md-12">
                  <div className="input-block mb-3">
                    <label className="form-label">Brand Slug</label>
                    <input
                      type="text"
                      name="brandSlug"
                      className="form-control"
                      placeholder="Brand Slug"
                      value={formData.brandSlug}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onClose}
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={isLoading}>
                {isLoading ? "Adding..." : "Add New"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddCompanyModal;
