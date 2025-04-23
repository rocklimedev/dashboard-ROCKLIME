import React, { useState } from "react";
import {
  useGetProfileQuery,
  useUpdateProfileMutation,
} from "../../api/userApi";
import { useGetRolesQuery } from "../../api/rolesApi";

import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const Profile = () => {
  const {
    data: profile,
    isLoading: isProfileLoading,
    error: profileError,
  } = useGetProfileQuery();
  const {
    data: rolesData,
    isLoading: isRolesLoading,
    error: rolesError,
  } = useGetRolesQuery();
  const [updateProfile, { isLoading: isUpdating }] = useUpdateProfileMutation();

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    mobileNumber: "",
  });

  // Initialize formData when profile loads
  React.useEffect(() => {
    if (profile?.user) {
      console.log("Profile data:", profile);
      setFormData({
        name: profile.user.name || "",
        email: profile.user.email || "",
        mobileNumber: profile.user.mobileNumber || "",
      });
    }
  }, [profile]);

  if (isProfileLoading || isRolesLoading) return <p>Loading...</p>;
  if (profileError) return <p>Error loading profile: {profileError.message}</p>;
  if (rolesError) return <p>Error loading roles: {rolesError.message}</p>;
  if (!profile?.user) return <p>No user profile data available.</p>;

  const userId = profile.user.userId;
  const roleId = profile.user.roleId;
  const roleName =
    rolesData?.find((role) => role.roleId === roleId)?.roleName || "N/A";
  const status = profile.user.status || "N/A";

  const handleEditClick = () => setIsEditing(true);

  const handleCancelClick = () => {
    setIsEditing(false);
    setFormData({
      name: profile.user.name || "",
      email: profile.user.email || "",
      mobileNumber: profile.user.mobileNumber || "",
    });
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSaveClick = async () => {
    if (!userId) {
      toast.error("User ID not found. Cannot update profile.");
      return;
    }

    if (!formData.name || !formData.email || !formData.mobileNumber) {
      toast.error("Please fill in all fields.");
      return;
    }

    const updatedData = {
      userId, // Include userId for the API
      name: formData.name,
      email: formData.email,
      mobileNumber: formData.mobileNumber,
    };

    console.log("Updating profile with data:", updatedData);

    try {
      await updateProfile(updatedData).unwrap();
      toast.success("Profile updated successfully!");
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating profile:", error);
      if (error.status === 404) {
        toast.error("User not found. Please check your account.");
      } else {
        toast.error(
          `Failed to update profile: ${error.data?.message || "Unknown error"}`
        );
      }
    }
  };

  return (
    <div className="page-wrapper">
      <div className="content">
        <div className="card">
          <div className="card-header">
            <h4>Profile</h4>
          </div>
          <div className="card-body profile-body">
            <h5 className="mb-2">
              <i className="ti ti-user text-primary me-1"></i>Basic Information
            </h5>
            <div className="profile-pic-upload image-field">
              <div className="profile-pic p-2">
                <img
                  src="assets/img/users/user-49.png"
                  className="object-fit-cover h-100 rounded-1"
                  alt="user"
                />
              </div>
            </div>
            <div className="row">
              {/* Name */}
              <div className="col-lg-6 col-sm-12">
                <div className="mb-3">
                  <label className="form-label">Name</label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="name"
                      className="form-control"
                      value={formData.name}
                      onChange={handleChange}
                      required
                    />
                  ) : (
                    <p className="form-control-static">{formData.name}</p>
                  )}
                </div>
              </div>

              {/* Email */}
              <div className="col-lg-6 col-sm-12">
                <div className="mb-3">
                  <label className="form-label">Email</label>
                  {isEditing ? (
                    <input
                      type="email"
                      name="email"
                      className="form-control"
                      value={formData.email}
                      onChange={handleChange}
                      required
                    />
                  ) : (
                    <p className="form-control-static">{formData.email}</p>
                  )}
                </div>
              </div>

              {/* Phone Number */}
              <div className="col-lg-6 col-sm-12">
                <div className="mb-3">
                  <label className="form-label">Phone Number</label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="mobileNumber"
                      className="form-control"
                      value={formData.mobileNumber}
                      onChange={handleChange}
                      required
                    />
                  ) : (
                    <p className="form-control-static">
                      {formData.mobileNumber}
                    </p>
                  )}
                </div>
              </div>

              {/* Role (Non-Editable) */}
              <div className="col-lg-6 col-sm-12">
                <div className="mb-3">
                  <label className="form-label">Role</label>
                  <p className="form-control-static">{roleName}</p>
                </div>
              </div>

              {/* Status (Non-Editable) */}
              <div className="col-lg-6 col-sm-12">
                <div className="mb-3">
                  <label className="form-label">Status</label>
                  <p className="form-control-static">{status}</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="col-12 d-flex justify-content-end">
                {isEditing ? (
                  <>
                    <button
                      className="btn btn-success shadow-none me-2"
                      onClick={handleSaveClick}
                      disabled={isUpdating}
                    >
                      {isUpdating ? "Saving..." : "Save"}
                    </button>
                    <button
                      className="btn btn-secondary shadow-none"
                      onClick={handleCancelClick}
                      disabled={isUpdating}
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <button
                    className="btn btn-primary shadow-none"
                    onClick={handleEditClick}
                  >
                    Edit Profile
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
        <ToastContainer />
      </div>
    </div>
  );
};

export default Profile;
