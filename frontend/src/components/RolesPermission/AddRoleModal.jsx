import React, { useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useCreateRoleMutation } from "../../api/rolesApi"; // Import mutation

const AddRoleModal = ({ show, onClose }) => {
  const [roleName, setRoleName] = useState("");
  const [createRole, { isLoading }] = useCreateRoleMutation(); // Use mutation hook

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!roleName.trim()) {
      toast.error("Role name is required.");
      return;
    }
    try {
      await createRole({ roleName }).unwrap();
      toast.success("Role added successfully!");
      setRoleName("");
      onClose();
    } catch (error) {
      toast.error(
        `Failed to add role: ${error.data?.message || "Please try again."}`
      );
    }
  };

  const handleClose = () => {
    setRoleName("");
    onClose();
  };

  if (!show) return null;

  return (
    <>
      <div className="modal fade show" style={{ display: "block" }}>
        <div className="modal-dialog modal-dialog-centered modal-md">
          <div className="modal-content">
            <div className="modal-header border-0">
              <h4 className="mb-0">Add New Role</h4>
              <button
                type="button"
                className="btn-close"
                onClick={handleClose}
                aria-label="Close"
                data-bs-dismiss="modal"
              ></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="input-block mb-3">
                  <label className="form-label">Role Name</label>
                  <input
                    type="text"
                    name="roleName"
                    className="form-control"
                    placeholder="Role Name"
                    value={roleName}
                    onChange={(e) => setRoleName(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleClose}
                  data-bs-dismiss="modal"
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isLoading}
                >
                  {isLoading ? "Adding..." : "Add New"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      <div className="modal-backdrop fade show" onClick={handleClose}></div>
      <ToastContainer />
    </>
  );
};

export default AddRoleModal;
