import React, { useState } from "react";
import { useCreateCompanyMutation } from "../../api/companyApi";

const AddCompany = ({ onClose }) => {
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    slug: "",
    website: "",
  });

  const [addCompany, { isLoading, isError }] = useCreateCompanyMutation();

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
      await addCompany(formData).unwrap();
      setFormData({ name: "", email: "", phone: "", website: "" }); // Reset form
      onClose(); // Optional: close modal on success
    } catch (error) {
      console.error("Failed to add company:", error);
    }
  };

  return (
    <div className="modal fade show" style={{ display: "block" }}>
      <div className="modal-dialog modal-dialog-centered modal-lg">
        <div className="modal-content">
          <div className="modal-header">
            <h4 className="modal-title">Add New Company</h4>
            <button
              type="button"
              className="btn-close custom-btn-close p-0"
              data-bs-dismiss="modal"
              aria-label="Close"
              onClick={onClose}
            >
              <i className="ti ti-x"></i>
            </button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <div className="row">
                <div className="col-lg-6 mb-3">
                  <label className="form-label">
                    Name <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="col-lg-6 mb-3">
                  <label className="form-label">Address</label>
                  <input
                    type="address"
                    className="form-control"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                  />
                </div>
                <div className="col-lg-6 mb-3">
                  <label className="form-label">Slug</label>
                  <input
                    type="text"
                    className="form-control"
                    name="slug"
                    value={formData.slug}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="col-lg-6 mb-3">
                  <label className="form-label">Parent Category </label>
                  <input
                    type="text"
                    className="form-control"
                    name="parentCategoryId"
                    value={formData.parentCategoryId}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="col-lg-6 mb-3">
                  <label className="form-label">Website</label>
                  <input
                    type="text"
                    className="form-control"
                    name="website"
                    value={formData.website}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary me-2"
                data-bs-dismiss="modal"
                onClick={onClose}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isLoading}
              >
                {isLoading ? "Adding..." : "Add Company"}
              </button>
            </div>
          </form>
          {isError && (
            <p className="text-danger text-center">
              Failed to add company. Try again.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddCompany;
