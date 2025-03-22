import React, { useState } from "react";
import { useCreateKeywordMutation } from "../../api/keywordApi";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const AddKeywordModal = ({ onClose }) => {
  const [createKeyword, { isLoading, error }] = useCreateKeywordMutation();
  const [formData, setFormData] = useState({
    keyword: "",
    type: "",
  });

  // Handle Input Change
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Handle Form Submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createKeyword(formData).unwrap();
      toast.success("Keyword added successfully! 🎉");
      onClose(); // Close the modal on success
    } catch (err) {
      toast.error(err?.data?.message || "Failed to add keyword. ❌");
      console.error("Error creating keyword:", err);
    }
  };

  return (
    <div className="modal fade show" style={{ display: "block" }}>
      <div className="modal-dialog modal-dialog-centered modal-md">
        <div className="modal-content">
          <div className="modal-header border-0 pb-0">
            <h4 className="mb-0">Add Keyword</h4>
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
                        {/* Type Field */}
                        <div className="col-lg-12 col-sm-12">
                          <div className="input-block mb-3">
                            <label>Type</label>
                            <input
                              type="text"
                              name="type"
                              className="form-control"
                              placeholder="Enter Type"
                              value={formData.type}
                              onChange={handleChange}
                            />
                          </div>
                        </div>
                        {/* Error Message */}
                        {error && (
                          <div className="col-12">
                            <p className="text-danger">
                              {error?.data?.message || "Failed to add keyword."}
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
                {isLoading ? "Adding..." : "Add Keyword"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddKeywordModal;
