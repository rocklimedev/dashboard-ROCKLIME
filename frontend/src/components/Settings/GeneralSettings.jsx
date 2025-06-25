import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { toast } from "sonner";
import {
  useDeleteUserMutation,
  useInactiveUserMutation,
} from "../../api/userApi";
import { useResetPasswordMutation } from "../../api/authApi";
import { logout } from "../../api/userSlice";
import { Modal, Button, Form } from "react-bootstrap";
import { Link } from "react-router-dom";
import "./settingsWrapper.css";

const GeneralSettings = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // RTK Query mutations
  const [resetPassword, { isLoading: isResettingPassword }] =
    useResetPasswordMutation();
  const [deactivateAccount, { isLoading: isDeactivating }] =
    useInactiveUserMutation();
  const [deleteUser, { isLoading: isDeleting }] = useDeleteUserMutation();

  // State for active section
  const [activeSection, setActiveSection] = useState("Profile");

  // State for password change
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
  });

  // State for profile data (example)
  const [profileData, setProfileData] = useState({
    name: "John Doe",
    email: "john.doe@example.com",
    profilePicture: "",
  });

  // State for company data (example)
  const [companyData] = useState({
    name: "Example Corp",
    address: "123 Business St, City, Country",
  });

  // State for confirmation modal
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [confirmMessage, setConfirmMessage] = useState("");

  // Handle password change
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    try {
      await resetPassword(passwordData).unwrap();
      toast.success("Password changed successfully!");
      setPasswordData({ currentPassword: "", newPassword: "" });
      document.getElementById("change-password").classList.remove("show");
    } catch (error) {
      toast.error(error?.data?.message || "Failed to change password");
    }
  };

  // Handle profile update
  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    try {
      // Placeholder for profile update API call
      toast.success("Profile updated successfully!");
    } catch (error) {
      toast.error(error?.data?.message || "Failed to update profile");
    }
  };

  // Handle logout
  const handleLogout = () => {
    setConfirmMessage("Are you sure you want to log out?");
    setConfirmAction(() => () => {
      dispatch(logout());
      navigate("/login");
      toast.success("Logged out successfully");
      setShowConfirmModal(false);
    });
    setShowConfirmModal(true);
  };

  // Open confirmation modal for deactivation
  const handleInitiateDeactivateAccount = () => {
    setConfirmMessage("Are you sure you want to deactivate your account?");
    setConfirmAction(() => handleDeactivateAccount);
    setShowConfirmModal(true);
  };

  // Open confirmation modal for deletion
  const handleInitiateDeleteAccount = () => {
    setConfirmMessage(
      "Are you sure you want to permanently delete your account? This action cannot be undone."
    );
    setConfirmAction(() => handleDeleteAccount);
    setShowConfirmModal(true);
  };

  // Handle account deactivation
  const handleDeactivateAccount = async () => {
    try {
      await deactivateAccount().unwrap();
      toast.success("Account deactivated successfully");
      dispatch(logout());
      navigate("/login");
    } catch (error) {
      toast.error(error?.data?.message || "Failed to deactivate account");
    } finally {
      setShowConfirmModal(false);
    }
  };

  // Handle account deletion
  const handleDeleteAccount = async () => {
    try {
      await deleteUser().unwrap();
      toast.success("Account deleted successfully");
      dispatch(logout());
      navigate("/login");
    } catch (error) {
      toast.error(error?.data?.message || "Failed to delete account");
    } finally {
      setShowConfirmModal(false);
    }
  };

  // Handle modal confirmation
  const handleConfirmAction = () => {
    if (confirmAction) {
      confirmAction();
    }
  };

  // Render content based on active section
  const renderContent = () => {
    switch (activeSection) {
      case "Profile":
        return (
          <div className="card flex-fill mb-0">
            <div className="card-body">
              <h5 className="fs-16 fw-medium mb-3">Profile Details</h5>
              <Form onSubmit={handleProfileUpdate}>
                <Form.Group className="mb-3" controlId="profileName">
                  <Form.Label>Name</Form.Label>
                  <Form.Control
                    type="text"
                    value={profileData.name}
                    onChange={(e) =>
                      setProfileData({ ...profileData, name: e.target.value })
                    }
                    required
                  />
                </Form.Group>
                <Form.Group className="mb-3" controlId="profileEmail">
                  <Form.Label>Email</Form.Label>
                  <Form.Control
                    type="email"
                    value={profileData.email}
                    onChange={(e) =>
                      setProfileData({ ...profileData, email: e.target.value })
                    }
                    required
                  />
                </Form.Group>
                <Form.Group className="mb-3" controlId="profilePicture">
                  <Form.Label>Profile Picture</Form.Label>
                  <Form.Control
                    type="file"
                    onChange={(e) =>
                      setProfileData({
                        ...profileData,
                        profilePicture: e.target.files[0],
                      })
                    }
                  />
                  {profileData.profilePicture && (
                    <img
                      src={
                        typeof profileData.profilePicture === "string"
                          ? profileData.profilePicture
                          : URL.createObjectURL(profileData.profilePicture)
                      }
                      alt="Profile"
                      className="mt-2"
                      style={{
                        width: "100px",
                        height: "100px",
                        borderRadius: "50%",
                      }}
                    />
                  )}
                </Form.Group>
                <Button type="submit" variant="primary">
                  Save Profile
                </Button>
              </Form>
            </div>
          </div>
        );
      case "Security":
        return (
          <div className="card flex-fill mb-0">
            <div className="card-body">
              {/* Password Section */}
              <div className="d-flex align-items-center justify-content-between flex-wrap row-gap-3 border-bottom mb-3 pb-3">
                <div className="d-flex align-items-center">
                  <span className="avatar avatar-lg border bg-light fs-24 me-2">
                    <i className="ti ti-eye-off text-gray-900 fs-18"></i>
                  </span>
                  <div>
                    <h5 className="fs-16 fw-medium mb-1">Password</h5>
                    <p className="fs-16">Last Changed 22 Dec 2024, 10:30 AM</p>
                  </div>
                </div>
                <Link to="/forgot-password">
                  <button
                    className="btn btn-primary"
                    disabled={isResettingPassword}
                  >
                    {isResettingPassword ? "Resetting..." : "Forgot Password"}
                  </button>
                </Link>
              </div>

              {/* Phone Number Verification */}
              <div className="d-flex align-items-center justify-content-between flex-wrap row-gap-3 border-bottom mb-3 pb-3">
                <div className="d-flex align-items-center">
                  <span className="avatar avatar-lg border bg-light fs-24 me-2">
                    <i className="ti ti-phone text-gray-900 fs-18"></i>
                  </span>
                  <div>
                    <h5 className="fs-16 fw-medium mb-1">
                      Phone Number Verification
                    </h5>
                    <p className="fs-16">
                      Verified Mobile Number: +81699799974
                    </p>
                  </div>
                </div>
                <div classNameName="d-flex align-items-center">
                  <span className="fs-20 text-success me-3">
                    <i className="ti ti-circle-check-filled"></i>
                  </span>
                  <a
                    href="javascript:void(0);"
                    className="btn btn-primary mt-0"
                  >
                    Change
                  </a>
                  <a
                    href="javascript:void(0);"
                    className="btn btn-secondary ms-3"
                    onClick={() =>
                      toast.info("Phone number removal not implemented yet")
                    }
                  >
                    Remove
                  </a>
                </div>
              </div>

              {/* Deactivate Account */}
              <div className="d-flex align-items-center justify-content-between flex-wrap row-gap-3 border-bottom mb-3 pb-3">
                <div className="d-flex align-items-center">
                  <span className="avatar avatar-lg border bg-light fs-24 me-2">
                    <i className="ti ti-ban text-gray-900 fs-18"></i>
                  </span>
                  <div>
                    <h5 className="fs-16 fw-medium mb-1">Deactivate Account</h5>
                    <p className="fs-16">
                      This will shut down your account. Your account will be
                      reactivated when you sign in again.
                    </p>
                  </div>
                </div>
                <button
                  className="btn btn-primary mt-0"
                  onClick={handleInitiateDeactivateAccount}
                  disabled={isDeactivating}
                >
                  {isDeactivating ? "Deactivating..." : "Deactivate"}
                </button>
              </div>

              {/* Delete Account */}
              <div className="d-flex align-items-center justify-content-between flex-wrap row-gap-3">
                <div className="d-flex align-items-center">
                  <span className="avatar avatar-lg border bg-light fs-24 me-2">
                    <i className="ti ti-trash text-gray-900 fs-18"></i>
                  </span>
                  <div>
                    <h5 className="fs-16 fw-medium mb-1">Delete Account</h5>
                    <p className="fs-16">
                      Your account will be permanently deleted.
                    </p>
                  </div>
                </div>
                <button
                  className="btn btn-danger"
                  onClick={handleInitiateDeleteAccount}
                  disabled={isDeleting}
                >
                  {isDeleting ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          </div>
        );
      case "Company":
        return (
          <div className="card flex-fill mb-0">
            <div className="card-body">
              <h5 className="fs-16 fw-medium mb-3">Company Details</h5>
              <Form>
                <Form.Group className="mb-3" controlId="companyName">
                  <Form.Label>Company Name</Form.Label>
                  <Form.Control type="text" value={companyData.name} disabled />
                </Form.Group>
                <Form.Group className="mb-3" controlId="companyAddress">
                  <Form.Label>Address</Form.Label>
                  <Form.Control
                    type="text"
                    value={companyData.address}
                    disabled
                  />
                </Form.Group>
              </Form>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="page-wrapper">
      <div className="content settings-content">
        <div className="page-header">
          <h4 className="fw-bold">Settings</h4>
          <h6>Manage your settings on the portal</h6>
        </div>
        <div className="settings-wrapper d-flex">
          {/* Sidebar */}
          <div className="settings-sidebar">
            <ul className="nav flex-column">
              <li
                className={`nav-item ${
                  activeSection === "Profile" ? "active" : ""
                }`}
                onClick={() => setActiveSection("Profile")}
              >
                <i className="ti ti-user me-2"></i> Profile
              </li>
              <li
                className={`nav-item ${
                  activeSection === "Security" ? "active" : ""
                }`}
                onClick={() => setActiveSection("Security")}
              >
                <i className="ti ti-lock me-2"></i> Security
              </li>
              <li
                className={`nav-item ${
                  activeSection === "Company" ? "active" : ""
                }`}
                onClick={() => setActiveSection("Company")}
              >
                <i className="ti ti-building me-2"></i> Company
              </li>
              <li className="nav-item" onClick={handleLogout}>
                <i className="ti ti-logout me-2"></i> Logout
              </li>
            </ul>
          </div>
          {/* Content */}
          <div className="settings-content-area">{renderContent()}</div>
        </div>
      </div>

      {/* Password Change Modal */}
      <div
        className="modal fade"
        id="change-password"
        tabIndex="-1"
        aria-labelledby="changePasswordLabel"
        aria-hidden="true"
      >
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title" id="changePasswordLabel">
                Change Password
              </h5>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              ></button>
            </div>
            <div className="modal-body">
              <Form onSubmit={handlePasswordChange}>
                <Form.Group className="mb-3" controlId="currentPassword">
                  <Form.Label>Current Password</Form.Label>
                  <Form.Control
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={(e) =>
                      setPasswordData({
                        ...passwordData,
                        currentPassword: e.target.value,
                      })
                    }
                    required
                  />
                </Form.Group>
                <Form.Group className="mb-3" controlId="newPassword">
                  <Form.Label>New Password</Form.Label>
                  <Form.Control
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) =>
                      setPasswordData({
                        ...passwordData,
                        newPassword: e.target.value,
                      })
                    }
                    required
                  />
                </Form.Group>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={isResettingPassword}
                >
                  {isResettingPassword ? "Saving..." : "Save Changes"}
                </Button>
              </Form>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      <Modal
        show={showConfirmModal}
        onHide={() => setShowConfirmModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Confirm Action</Modal.Title>
        </Modal.Header>
        <Modal.Body>{confirmMessage}</Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowConfirmModal(false)}
          >
            Cancel
          </Button>
          <Button variant="danger" onClick={handleConfirmAction}>
            Confirm
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default GeneralSettings;
