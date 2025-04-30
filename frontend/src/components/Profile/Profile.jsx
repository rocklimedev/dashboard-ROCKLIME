import React, { useState, useEffect } from "react";
import {
  useGetProfileQuery,
  useUpdateProfileMutation,
} from "../../api/userApi";
import { useGetRolesQuery } from "../../api/rolesApi";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Avatar from "react-avatar";
import { useForgotPasswordMutation } from "../../api/authApi";
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
  const [forgotPassword, { isLoading: isResetting }] =
    useForgotPasswordMutation();

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    mobileNumber: "",
  });
  const [avatarUrl, setAvatarUrl] = useState("");
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);

  // Initialize formData and avatar from profile and localStorage
  useEffect(() => {
    if (profile?.user) {
      setFormData({
        name: profile.user.name || "",
        email: profile.user.email || "",
        mobileNumber: profile.user.mobileNumber || "",
      });
      const savedAvatar = localStorage.getItem(`avatar_${profile.user.userId}`);
      if (savedAvatar) {
        setAvatarUrl(savedAvatar);
      } else {
        setAvatarUrl(profile.user.name || profile.user.email);
      }
    }
  }, [profile]);

  // Handle avatar selection
  const handleAvatarSelect = (avatar) => {
    setAvatarUrl(avatar);
    if (profile?.user?.userId) {
      localStorage.setItem(`avatar_${profile.user.userId}`, avatar);
    }
    setShowAvatarPicker(false);
  };

  // Handle forgot password
  const handleForgotPassword = async () => {
    if (!formData.email) {
      toast.error("Email is required to reset password.");
      return;
    }

    try {
      await forgotPassword({ email: formData.email }).unwrap();
      toast.success("Password reset link sent to your email!");
    } catch (error) {
      console.error("Error sending password reset request:", error);
      if (error.status === 404) {
        toast.error("Email not found. Please check your email address.");
      } else {
        toast.error(
          `Failed to send reset link: ${error.data?.error || "Unknown error"}`
        );
      }
    }
  };

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
    setShowAvatarPicker(false);
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
      userId,
      name: formData.name,
      email: formData.email,
      mobileNumber: formData.mobileNumber,
    };

    try {
      await updateProfile(updatedData).unwrap();
      toast.success("Profile updated successfully!");
      setIsEditing(false);
      if (formData.name !== profile.user.name) {
        const savedAvatar = localStorage.getItem(`avatar_${userId}`);
        if (!savedAvatar) {
          setAvatarUrl(formData.name);
          localStorage.setItem(`avatar_${userId}`, formData.name);
        }
      }
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

  const avatarOptions = [
    formData.name || formData.email,
    "John Doe",
    "Jane Smith",
    "User One",
    "User Two",
  ];

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
              <div className="profile-pic p-2 position-relative">
                <Avatar
                  name={avatarUrl}
                  size="100"
                  round={true}
                  className="object-fit-cover h-100 rounded-1"
                />
                {isEditing && (
                  <button
                    className="btn btn-sm btn-primary position-absolute bottom-0 end-0 m-1"
                    onClick={() => setShowAvatarPicker(!showAvatarPicker)}
                  >
                    Change Avatar
                  </button>
                )}
              </div>
              {isEditing && showAvatarPicker && (
                <div className="avatar-picker mt-2">
                  <div className="d-flex flex-wrap gap-2">
                    {avatarOptions.map((option, index) => (
                      <div
                        key={index}
                        className="avatar-option"
                        onClick={() => handleAvatarSelect(option)}
                        style={{ cursor: "pointer" }}
                      >
                        <Avatar name={option} size="50" round={true} />
                      </div>
                    ))}
                  </div>
                </div>
              )}
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
              <div className="col-12 d-flex justify-content-end align-items-center">
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
                  <>
                    <button
                      className="btn btn-primary shadow-none me-2"
                      onClick={handleEditClick}
                    >
                      Edit Profile
                    </button>
                    <button
                      className="btn btn-outline-warning shadow-none"
                      onClick={handleForgotPassword}
                      disabled={isResetting}
                    >
                      {isResetting ? "Sending..." : "Reset Password"}
                    </button>
                  </>
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
