import React, { useState } from "react"; // Adjust the import as needed
import { useCreateCategoryMutation } from "../../api/categoryApi";
const AddCategoryModal = ({ onClose }) => {
  const [createCategory, { isLoading, error }] = useCreateCategoryMutation();
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    parentCategory: "None",
  });

  // Handle Input Change
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Handle Form Submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createCategory(formData).unwrap();
      onClose(); // Close the modal on success
    } catch (err) {
      console.error("Error creating category:", err);
    }
  };

  return (
    <div className="modal fade show" style={{ display: "block" }}>
      <div className="modal-dialog modal-dialog-centered modal-md">
        <div className="modal-content">
          <div className="modal-header border-0 pb-0">
            <h4 className="mb-0">Add Category</h4>
            <button type="button" className="close" onClick={onClose}>
              <span>&times;</span>
            </button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <div className="row">
                <div className="col-md-12">
                  <div className="card-body">
                    <div className="form-group-item border-0 pb-0 mb-0">
                      <div className="row">
                        {/* Name Field */}
                        <div className="col-lg-12 col-sm-12">
                          <div className="input-block mb-3">
                            <label>
                              Name <span className="text-danger">*</span>
                            </label>
                            <input
                              type="text"
                              name="name"
                              className="form-control"
                              placeholder="Enter Title"
                              value={formData.name}
                              onChange={handleChange}
                              required
                            />
                          </div>
                        </div>
                        {/* Slug Field */}
                        <div className="col-lg-12 col-sm-12">
                          <div className="input-block mb-3">
                            <label>Slug</label>
                            <input
                              type="text"
                              name="slug"
                              className="form-control"
                              placeholder="Enter Slug"
                              value={formData.slug}
                              onChange={handleChange}
                            />
                          </div>
                        </div>
                        {/* Parent Category */}
                        <div className="col-lg-12 col-sm-12">
                          <div className="input-block mb-3">
                            <label>Parent Category</label>
                            <select
                              name="parentCategory"
                              className="form-control"
                              value={formData.parentCategory}
                              onChange={handleChange}
                            >
                              <option>None</option>
                              <option>Coupons</option>
                              <option>News</option>
                              <option>Plugins</option>
                              <option>Themes</option>
                              <option>Tutorial</option>
                            </select>
                          </div>
                        </div>
                        {/* Error Message */}
                        {error && (
                          <div className="col-12">
                            <p className="text-danger">
                              {error?.data?.message || "Failed to add category"}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* Footer Buttons */}
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-back cancel-btn me-2"
                onClick={onClose}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary paid-continue-btn"
                disabled={isLoading}
              >
                {isLoading ? "Adding..." : "Add Category"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddCategoryModal;
