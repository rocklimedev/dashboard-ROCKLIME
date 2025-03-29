import React from "react";
import { useForm } from "react-hook-form";
import { useAddCompanyMutation } from "../services/api"; // Adjust the import based on your API setup

const AddCompany = ({ onClose }) => {
  const { register, handleSubmit, reset } = useForm();
  const [addCompany, { isLoading, isError }] = useAddCompanyMutation();

  const onSubmit = async (data) => {
    try {
      await addCompany(data).unwrap();
      reset(); // Reset form on successful submission
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
            >
              <i className="ti ti-x"></i>
            </button>
          </div>
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="modal-body pb-0">
              <div className="row">
                <div className="col-md-6">
                  <div className="mb-3">
                    <label className="form-label">
                      Name <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      {...register("name", { required: true })}
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="mb-3">
                    <label className="form-label">Email Address</label>
                    <input
                      type="email"
                      className="form-control"
                      {...register("email")}
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="mb-3">
                    <label className="form-label">Phone Number</label>
                    <input
                      type="text"
                      className="form-control"
                      {...register("phone", { required: true })}
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="mb-3">
                    <label className="form-label">Website</label>
                    <input
                      type="text"
                      className="form-control"
                      {...register("website")}
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary me-2"
                data-bs-dismiss="modal"
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
