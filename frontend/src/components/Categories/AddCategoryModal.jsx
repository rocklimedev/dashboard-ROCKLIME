import React, { useState, useEffect } from "react";
import {
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
} from "../../api/categoryApi";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useGetAllParentCategoriesQuery } from "../../api/parentCategoryApi.js";
const AddCategoryModal = ({ onClose, editMode = false, categoryData = {} }) => {
  const [createCategory, { isLoading: isCreating, error: createError }] =
    useCreateCategoryMutation();
  const [updateCategory, { isLoading: isUpdating, error: updateError }] =
    useUpdateCategoryMutation();
  const { data: parentCategoryData } = useGetAllParentCategoriesQuery();
  const parentCategories = Array.isArray(parentCategoryData?.data)
    ? parentCategoryData.data
    : [];

  const [formData, setFormData] = useState({
    name: "",
    parentCategoryId: "",
    parentCategory: "0", // Keep this state as requested
  });

  useEffect(() => {
    if (editMode && categoryData) {
      setFormData({
        name: categoryData.name || "",
        parentCategoryId: categoryData.parentCategoryId || "",
        parentCategory: categoryData.parentCategory || "0",
      });
    }
  }, [editMode, categoryData]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editMode) {
        await updateCategory({ id: categoryData.id, ...formData }).unwrap();
        toast.success("Category updated successfully!");
      } else {
        await createCategory(formData).unwrap();
        toast.success("Category added successfully!");
      }
      onClose();
    } catch (err) {
      console.error("Error handling category:", err);
      toast.error("Failed to process category.");
    }
  };

  return (
    <div className="modal fade show" style={{ display: "block" }}>
      <div className="modal-dialog modal-dialog-centered modal-md">
        <div className="modal-content">
          <div className="modal-header border-0 pb-0">
            <h4 className="mb-0">
              {editMode ? "Edit Category" : "Add Category"}
            </h4>
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

                        {/* Parent Category ID Dropdown */}
                        <div className="col-lg-12 col-sm-12">
                          <div className="input-block mb-3">
                            <label>Parent Category</label>
                            <select
                              name="parentCategoryId"
                              className="form-control"
                              value={formData.parentCategoryId}
                              onChange={handleChange}
                            >
                              <option value="">Select Parent Category</option>
                              {parentCategories.map((cat) => (
                                <option key={cat.id} value={cat.id}>
                                  {cat.name}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {/* Parent Category Field (Static or Business Logic Based) */}
                        <div className="col-lg-12 col-sm-12">
                          <div className="input-block mb-3">
                            <label>Parent Category</label>
                            <select
                              name="parentCategory"
                              className="form-control"
                              value={formData.parentCategory}
                              onChange={handleChange}
                            >
                              <option value="1">1</option>
                              <option value="0">0</option>
                            </select>
                          </div>
                        </div>

                        {/* Error Message */}
                        {(createError || updateError) && (
                          <div className="col-12">
                            <p className="text-danger">
                              {createError?.data?.message ||
                                updateError?.data?.message ||
                                "Failed to process category"}
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
                disabled={isCreating || isUpdating}
              >
                {isCreating || isUpdating
                  ? editMode
                    ? "Updating..."
                    : "Adding..."
                  : editMode
                  ? "Update Category"
                  : "Add Category"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddCategoryModal;
