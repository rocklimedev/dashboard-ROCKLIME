import React, { useState, useEffect } from "react";
import {
  useCreateVendorMutation,
  useUpdateVendorMutation,
} from "../../api/vendorApi.js";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const AddCompanyModal = ({ show, onClose, existingVendor }) => {
  const [formData, setFormData] = useState({
    vendorId: "",
    vendorName: "",
    brandSlug: "",
  });

  const [addVendor, { isLoading: isCreating }] = useCreateVendorMutation();
  const [updateVendor, { isLoading: isUpdating }] = useUpdateVendorMutation();

  useEffect(() => {
    if (existingVendor) {
      setFormData({
        vendorId: existingVendor.vendorId || "",
        vendorName: existingVendor.vendorName || "",
        brandSlug: existingVendor.brandSlug || "",
      });
    } else {
      setFormData({ vendorId: "", vendorName: "", brandSlug: "" });
    }
  }, [existingVendor, show]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (formData.vendorId) {
        await updateVendor(formData).unwrap();
        toast.success("Vendor updated successfully!");
      } else {
        await addVendor(formData).unwrap();
        toast.success("Vendor added successfully!");
      }
      onClose();
    } catch (error) {
      toast.error("Failed to submit vendor. Please try again.");
    }
  };
  return (
    <div className="modal fade show" style={{ display: "block" }}>
      <div className="modal-dialog modal-dialog-centered modal-md">
        <div className="modal-content">
          <div className="modal-header border-0">
            <h4 className="mb-0">
              {formData.vendorId ? "Edit Company" : "Add New Company"}
            </h4>
            <button
              type="button"
              className="btn-close"
              onClick={onClose}
            ></button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
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
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onClose}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isCreating || isUpdating}
              >
                {isCreating || isUpdating
                  ? "Saving..."
                  : formData.vendorId
                  ? "Update"
                  : "Add New"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddCompanyModal;
