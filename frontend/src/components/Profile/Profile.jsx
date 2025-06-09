import React, { useState, useEffect } from "react";
import {
  useGetProfileQuery,
  useUpdateProfileMutation,
} from "../../api/userApi";
import { useGetRolesQuery } from "../../api/rolesApi";
import { toast } from "sonner";
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
    username: "",
    name: "",
    email: "",
    mobileNumber: "",
    street: "",
    city: "",
    state: "",
    postalCode: "",
    country: "",
  });
  const [avatarUrl, setAvatarUrl] = useState("");
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);

  // Debug token and API response
  useEffect(() => {
    const token =
      localStorage.getItem("token") || sessionStorage.getItem("token");

    if (!token) {
      toast.error("No authentication token found. Redirecting to login...");
      window.location.href = "/login";
    }
    console.log("useGetProfileQuery response:", {
      data: profile,
      error: profileError,
      status: profileError?.status,
      endpoint: profileError?.originalStatus,
      url: profileError?.data?.url || "N/A",
    });
  }, [profile, profileError]);

  // Initialize formData and avatar
  useEffect(() => {
    if (profile?.user) {
      setFormData({
        username: profile.user.username || "",
        name: profile.user.name || "",
        email: profile.user.email || "",
        mobileNumber: profile.user.mobileNumber || "",
        street: profile.user.address?.street || "",
        city: profile.user.address?.city || "",
        state: profile.user.address?.state || "",
        postalCode: profile.user.address?.postalCode || "",
        country: profile.user.address?.country || "",
      });
      const savedAvatar = localStorage.getItem(`avatar_${profile.user.userId}`);
      setAvatarUrl(savedAvatar || profile.user.name || profile.user.email);
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
  if (profileError) {
    console.error("Profile error:", profileError);
    let errorMessage = "Unknown error";
    if (profileError.status === 404) {
      errorMessage =
        "User profile not found. Please check your account or contact support.";
    } else if (profileError.status === 401) {
      errorMessage = "Unauthorized. Please log in again.";
    } else {
      errorMessage =
        profileError?.data?.message || profileError.message || "Unknown error";
    }
    return <p>Error loading profile: {errorMessage}</p>;
  }
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
      username: profile.user.username || "",
      name: profile.user.name || "",
      email: profile.user.email || "",
      mobileNumber: profile.user.mobileNumber || "",
      street: profile.user.address?.street || "",
      city: profile.user.address?.city || "",
      state: profile.user.address?.state || "",
      postalCode: profile.user.address?.postalCode || "",
      country: profile.user.address?.country || "",
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
      toast.error("Please fill in all required fields.");
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error("Please enter a valid email address.");
      return;
    }

    // Validate phone number (basic example)
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(formData.mobileNumber)) {
      toast.error("Please enter a valid 10-digit phone number.");
      return;
    }

    const updatedData = {
      username: formData.username,
      name: formData.name,
      email: formData.email,
      mobileNumber: formData.mobileNumber,
    };

    const hasAddress =
      formData.street ||
      formData.city ||
      formData.state ||
      formData.postalCode ||
      formData.country;
    if (hasAddress) {
      updatedData.address = {
        street: formData.street || "",
        city: formData.city || "",
        state: formData.state || "",
        postalCode: formData.postalCode || "",
        country: formData.country || "",
      };
    }

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
    formData.name || "User",
    formData.email || "Email",
    "John Doe",
    "Jane Smith",
    "User One",
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
              {/* Username */}
              <div className="col-lg-6 col-sm-12">
                <div className="mb-3">
                  <label className="form-label">Username</label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="username"
                      className="form-control"
                      value={formData.username}
                      onChange={handleChange}
                    />
                  ) : (
                    <p className="form-control-static">{formData.username}</p>
                  )}
                </div>
              </div>

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
                      {formData.mobileNumber || "N/A"}
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

              {/* Address Section */}
              <div className="col-12">
                <h5 className="mb-2 mt-4">
                  <i className="ti ti-home text-primary me-1"></i>Address
                  Information
                </h5>
              </div>

              {/* Street */}
              <div className="col-lg-6 col-sm-12">
                <div className="mb-3">
                  <label className="form-label">Street</label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="street"
                      className="form-control"
                      value={formData.street}
                      onChange={handleChange}
                    />
                  ) : (
                    <p className="form-control-static">
                      {formData.street || "N/A"}
                    </p>
                  )}
                </div>
              </div>

              {/* City */}
              <div className="col-lg-6 col-sm-12">
                <div className="mb-3">
                  <label className="form-label">City</label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="city"
                      className="form-control"
                      value={formData.city}
                      onChange={handleChange}
                    />
                  ) : (
                    <p className="form-control-static">
                      {formData.city || "N/A"}
                    </p>
                  )}
                </div>
              </div>

              {/* State */}
              <div className="col-lg-6 col-sm-12">
                <div className="mb-3">
                  <label className="form-label">State</label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="state"
                      className="form-control"
                      value={formData.state}
                      onChange={handleChange}
                    />
                  ) : (
                    <p className="form-control-static">
                      {formData.state || "N/A"}
                    </p>
                  )}
                </div>
              </div>

              {/* Postal Code */}
              <div className="col-lg-6 col-sm-12">
                <div className="mb-3">
                  <label className="form-label">Postal Code</label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="postalCode"
                      className="form-control"
                      value={formData.postalCode}
                      onChange={handleChange}
                    />
                  ) : (
                    <p className="form-control-static">
                      {formData.postalCode || "N/A"}
                    </p>
                  )}
                </div>
              </div>

              {/* Country */}
              <div className="col-lg-6 col-sm-12">
                <div className="mb-3">
                  <label className="form-label">Country</label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="country"
                      className="form-control"
                      value={formData.country}
                      onChange={handleChange}
                    />
                  ) : (
                    <p className="form-control-static">
                      {formData.country || "N/A"}
                    </p>
                  )}
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
      </div>
    </div>
  );
};

export default Profile;
