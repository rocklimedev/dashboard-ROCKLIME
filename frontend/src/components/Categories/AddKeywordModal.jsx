import React, { useEffect, useState } from "react";
import {
  useCreateKeywordMutation,
  useUpdateKeywordMutation,
} from "../../api/keywordApi";
import { useGetAllCategoriesQuery } from "../../api/categoryApi";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const AddKeywordModal = ({ onClose, editData }) => {
  const isEditMode = !!editData;

  const [formData, setFormData] = useState({
    keyword: "",
    categoryId: "",
  });

  const {
    data: categoryData,
    isLoading: categoryLoading,
    error: categoryError,
  } = useGetAllCategoriesQuery();

  const [createKeyword, { isLoading: isCreating, error: createError }] =
    useCreateKeywordMutation();

  const [updateKeyword, { isLoading: isUpdating, error: updateError }] =
    useUpdateKeywordMutation();

  useEffect(() => {
    if (isEditMode) {
      setFormData({
        keyword: editData.keyword || "",
        categoryId: editData.categoryId || "",
      });
    }
  }, [editData]);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditMode) {
        await updateKeyword({ id: editData.id, ...formData }).unwrap();
        toast.success("Keyword updated successfully! ✨");
      } else {
        await createKeyword(formData).unwrap();
        toast.success("Keyword added successfully! 🎉");
      }
      onClose();
    } catch (err) {
      toast.error(err?.data?.message || "Failed to save keyword ❌");
    }
  };

  return (
    <div className="modal fade show" style={{ display: "block" }}>
      <div className="modal-dialog modal-dialog-centered modal-md">
        <div className="modal-content">
          <div className="modal-header border-0 pb-0">
            <h4 className="mb-0">
              {isEditMode ? "Edit Keyword" : "Add Keyword"}
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
                        {/* Keyword Field */}
                        <div className="col-lg-12 col-sm-12">
                          <div className="input-block mb-3">
                            <label>
                              Keyword <span className="text-danger">*</span>
                            </label>
                            <input
                              type="text"
                              name="keyword"
                              className="form-control"
                              placeholder="Enter Keyword"
                              value={formData.keyword}
                              onChange={handleChange}
                              required
                            />
                          </div>
                        </div>

                        {/* Category Dropdown */}
                        <div className="col-lg-12 col-sm-12">
                          <div className="input-block mb-3">
                            <label>
                              Category <span className="text-danger">*</span>
                            </label>
                            <select
                              name="categoryId"
                              className="form-select"
                              value={formData.categoryId}
                              onChange={handleChange}
                              required
                            >
                              <option value="">-- Select Category --</option>
                              {categoryLoading ? (
                                <option>Loading categories...</option>
                              ) : categoryError ? (
                                <option>Error loading categories</option>
                              ) : (
                                categoryData?.categories?.map((cat) => (
                                  <option
                                    key={cat.categoryId}
                                    value={cat.categoryId}
                                  >
                                    {cat.name}
                                  </option>
                                ))
                              )}
                            </select>
                          </div>
                        </div>

                        {/* Error Message */}
                        {(createError || updateError) && (
                          <div className="col-12">
                            <p className="text-danger">
                              {createError?.data?.message ||
                                updateError?.data?.message ||
                                "Failed to save keyword."}
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
                  ? isEditMode
                    ? "Updating..."
                    : "Adding..."
                  : isEditMode
                  ? "Update Keyword"
                  : "Add Keyword"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddKeywordModal;
