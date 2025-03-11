import React, { useState } from "react";
import { useCreateBrandMutation } from "../../api/brandsApi";
const AddBrand = ({ onClose }) => {
  const [createBrand, { isLoading, error }] = useCreateBrandMutation();
  const [formData, setFormData] = useState({
    brandName: "",
    brandSlug: "",
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createBrand(formData).unwrap();
      alert("Brand added successfully!");
    } catch (err) {
      console.error("Failed to add Brand:", err);
    }
  };

  return (
    <div className="modal fade show" style={{ display: "block" }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h4 className="modal-title">Add Brand</h4>
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
                    Brand Name<span className="text-danger ms-1">*</span>
                  </label>
                  <input
                    type="text"
                    name="brandName"
                    className="form-control"
                    value={formData.brandName}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="col-lg-6 mb-3">
                  <label className="form-label">
                    Brand Slug<span className="text-danger ms-1">*</span>
                  </label>
                  <input
                    type="text"
                    name="brandSlug"
                    className="form-control"
                    value={formData.brandSlug}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                data-bs-dismiss="modal"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isLoading}
              >
                {isLoading ? "Adding..." : "Add Brand"}
              </button>
            </div>
            {error && (
              <p className="text-danger mt-2">
                {error.data?.message || "Error adding Brand"}
              </p>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddBrand;
