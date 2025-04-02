import React, { useState, useEffect } from "react";
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
  } = useGetRolesQuery(); // Fetch roles

  const [isEditMode, setIsEditMode] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    username: "",
    email: "",
    phone: "",
    role: "",
    status: true,
  });

  useEffect(() => {
    if (userToEdit) {
      setFormData({
        ...userToEdit,
        role: userToEdit.roleId || "", // Use roleId from DB
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
      let user;
      if (userToEdit && isEditMode) {
        user = await updateUser({
          userId: userToEdit.userId,
          ...formData,
        }).unwrap();
        alert("User updated successfully!");
      } else {
        user = await createUser(formData).unwrap();
        alert("User added successfully!");
      }

      // Assign role if user is created/updated successfully
      if (user && formData.role) {
        await assignRole({
          userId: user.userId || userToEdit.userId,
          roleId: formData.role,
        }).unwrap();
        alert("Role assigned successfully!");
      }

      onClose();
    } catch (err) {
      console.error("Operation failed:", err);
      alert("Failed to process the request.");
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
              <span>&times;</span>
            </button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <div className="row">
                {["name", "username", "email", "phone"].map((field) => (
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
                    {userToEdit
                      ? isUpdating
                        ? "Updating..."
                        : "Update User"
                      : isCreating
                      ? "Adding..."
                      : "Add User"}
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
