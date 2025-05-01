import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import {
  useCreateUserMutation,
  useUpdateUserMutation,
  useAssignRoleMutation,
} from "../../api/userApi";
import { useGetRolesQuery } from "../../api/rolesApi";

const AddUser = ({ onClose, userToEdit, isViewMode }) => {
  const [createUser, { isLoading: isCreating, error: createError }] =
    useCreateUserMutation();
  const [updateUser, { isLoading: isUpdating, error: updateError }] =
    useUpdateUserMutation();
  const [assignRole] = useAssignRoleMutation();

  const {
    data: roles,
    isLoading: isRolesLoading,
    error: rolesError,
  } = useGetRolesQuery();

  const [isEditMode, setIsEditMode] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    username: "",
    email: "",
    mobileNumber: "",
    role: "",
    status: true,
    password: "",
  });

  useEffect(() => {
    if (userToEdit) {
      setFormData({
        ...userToEdit,
        role: userToEdit.roleId || "",
      });
      setIsEditMode(true);
    }
  }, [userToEdit]);

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
      const selectedRoleObj = roles?.find((r) => r.roleId === formData.role);

      if (!selectedRoleObj) {
        toast.error("Selected role is invalid.");
        return;
      }

      const userPayload = {
        ...formData,
        roles: selectedRoleObj.roleName,
        roleId: selectedRoleObj.roleId,
      };

      let user;
      if (userToEdit && isEditMode) {
        user = await updateUser({
          userId: userToEdit.userId,
          ...userPayload,
        }).unwrap();
        toast.success("User updated successfully!");
      } else {
        user = await createUser(userPayload).unwrap();
        toast.success("User added successfully!");
      }

      await assignRole({
        userId: user.userId || userToEdit.userId,
        roleId: selectedRoleObj.roleId,
      }).unwrap();
      toast.success("Role assigned successfully!");

      onClose();
    } catch (err) {
      console.error("Operation failed:", err);
      toast.error(
        `Failed to process the request: ${err.data?.message || "Unknown error"}`
      );
    }
  };

  return (
    <div className="modal fade show" style={{ display: "block" }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h4>
              {userToEdit
                ? isViewMode
                  ? "View User"
                  : "Edit User"
                : "Add User"}
            </h4>
            <button type="button" className="close" onClick={onClose}>
              <span>×</span>
            </button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <div className="row">
                {["name", "username", "email", "mobileNumber"].map((field) => (
                  <div key={field} className="col-lg-6 mb-3">
                    <label className="form-label">
                      {field.charAt(0).toUpperCase() + field.slice(1)}
                      <span className="text-danger">*</span>
                    </label>
                    <input
                      type={field === "email" ? "email" : "text"}
                      name={field}
                      className="form-control"
                      value={formData[field]}
                      onChange={handleChange}
                      required
                      disabled={isViewMode && !isEditMode}
                    />
                  </div>
                ))}
                {!userToEdit && (
                  <div className="col-lg-6 mb-3">
                    <label className="form-label">
                      Password<span className="text-danger">*</span>
                    </label>
                    <input
                      type="password"
                      name="password"
                      className="form-control"
                      value={formData.password}
                      onChange={handleChange}
                      required
                    />
                  </div>
                )}

                <div className="col-lg-6 mb-3">
                  <label className="form-label">
                    Role<span className="text-danger">*</span>
                  </label>
                  <select
                    name="role"
                    className="form-control"
                    value={formData.role}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, role: e.target.value }))
                    }
                    required
                    disabled={(isViewMode && !isEditMode) || isRolesLoading}
                  >
                    <option value="">Select</option>
                    {isRolesLoading ? (
                      <option>Loading roles...</option>
                    ) : rolesError ? (
                      <option>Error loading roles</option>
                    ) : (
                      roles?.map((role) => (
                        <option key={role.roleId} value={role.roleId}>
                          {role.roleName}
                        </option>
                      ))
                    )}
                  </select>
                </div>

                <div className="col-lg-12">
                  <div className="status-toggle d-flex justify-content-between align-items-center">
                    <span>Status</span>
                    <input
                      type="checkbox"
                      name="status"
                      id="userStatus"
                      className="check"
                      checked={formData.status}
                      onChange={handleChange}
                      disabled={isViewMode && !isEditMode}
                    />
                    <label htmlFor="userStatus" className="checktoggle"></label>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              {isViewMode && !isEditMode ? (
                <button
                  type="button"
                  className="btn btn-info"
                  onClick={() => setIsEditMode(true)}
                >
                  Enable Edit Mode
                </button>
              ) : (
                <>
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
                    {isCreating || isUpdating ? (
                      <span
                        className="spinner-border spinner-border-sm"
                        role="status"
                        aria-hidden="true"
                      ></span>
                    ) : userToEdit ? (
                      "Update User"
                    ) : (
                      "Add User"
                    )}
                  </button>
                </>
              )}
            </div>
            {(createError || updateError) && (
              <p className="text-danger mt-2">
                {createError?.data?.message ||
                  updateError?.data?.message ||
                  "Error processing request"}
              </p>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddUser;
