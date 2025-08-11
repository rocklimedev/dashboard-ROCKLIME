import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { toast } from "sonner";
import {
  useDeleteUserMutation,
  useInactiveUserMutation,
  useGetProfileQuery,
} from "../../api/userApi";
import { useResetPasswordMutation } from "../../api/authApi";
import { logout } from "../../api/userSlice";
import { Modal, Button, Form } from "react-bootstrap";
import { Link } from "react-router-dom";
import "./settingsWrapper.css";

const GeneralSettings = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // RTK Query mutations and queries
  const [resetPassword, { isLoading: isResettingPassword }] =
    useResetPasswordMutation();
  const [deactivateAccount, { isLoading: isDeactivating }] =
    useInactiveUserMutation();
  const [deleteUser, { isLoading: isDeleting }] = useDeleteUserMutation();
  const {
    data: profile,
    isLoading: isProfileLoading,
    error: profileError,
  } = useGetProfileQuery();

  // State for active section
  const [activeSection, setActiveSection] = useState("Profile");

  // State for password change
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
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

      setPasswordData({ currentPassword: "", newPassword: "" });
      document.getElementById("change-password").classList.remove("show");
    } catch (error) {
      toast.error(error?.data?.message || "Failed to change password");
    }
  };

  // Handle logout
  const handleLogout = () => {
    setConfirmMessage("Are you sure you want to log out?");
    setConfirmAction(() => () => {
      dispatch(logout());
      navigate("/login");

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
  return (
    <div className="page-wrapper">
      <div className="content settings-content">
        <div className="page-header">
          <h4 className="fw-bold">Settings</h4>
          <h6>Manage your settings on the portal</h6>
        </div>
        <div className="settings-wrapper d-flex">
          {/* Content */}
          <div className="settings-content-area">
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
                      <p className="fs-16">
                        Forgot Your Password? Click here to change it.
                      </p>
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
                        Verified Mobile Number:{" "}
                        {profile?.user?.mobileNumber || "+81699799974"}
                      </p>
                    </div>
                  </div>
                  <div className="d-flex align-items-center">
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
                      <h5 className="fs-16 fw-medium mb-1">
                        Deactivate Account
                      </h5>
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
          </div>
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
