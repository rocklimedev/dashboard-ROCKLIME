import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { toast } from "sonner";
import {
  useDeleteUserMutation,
  useInactiveUserMutation,
  useGetProfileQuery,
} from "../../api/userApi";
import {
  useResetPasswordMutation,
  useResendVerificationEmailMutation,
} from "../../api/authApi";
import { logout } from "../../api/userSlice";
import { Modal, Button, Form } from "react-bootstrap";
import { Link } from "react-router-dom";
import "./settingsWrapper.css";

const GeneralSettings = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // RTK Query hooks
  const [resetPassword, { isLoading: isResettingPassword }] =
    useResetPasswordMutation();
  const [deactivateAccount, { isLoading: isDeactivating }] =
    useInactiveUserMutation();
  const [deleteUser, { isLoading: isDeleting }] = useDeleteUserMutation();
  const [resendVerificationEmail, { isLoading: isResendingVerification }] =
    useResendVerificationEmailMutation();
  const {
    data: profile,
    isLoading: isProfileLoading,
    error: profileError,
  } = useGetProfileQuery();

  // State
  const [activeSection, setActiveSection] = useState("Profile");
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
  });
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [confirmMessage, setConfirmMessage] = useState("");

  // Handle password change
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    try {
      await resetPassword(passwordData).unwrap();
      setPasswordData({ currentPassword: "", newPassword: "" });
      setShowPasswordModal(false);
      toast.success("Password changed successfully");
    } catch (error) {
      toast.error(error?.data?.message || "Failed to change password");
    }
  };

  // Handle resend verification email
  const handleResendVerification = async () => {
    try {
      await resendVerificationEmail({ email: profile?.user?.email }).unwrap();
      toast.success("Verification email sent successfully");
    } catch (error) {
      toast.error(error?.data?.message || "Failed to send verification email");
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

  // Handle account deactivation
  const handleInitiateDeactivateAccount = () => {
    setConfirmMessage("Are you sure you want to deactivate your account?");
    setConfirmAction(() => handleDeactivateAccount);
    setShowConfirmModal(true);
  };

  const handleDeactivateAccount = async () => {
    try {
      await deactivateAccount().unwrap();
      dispatch(logout());
      navigate("/login");
      toast.success("Account deactivated");
    } catch (error) {
      toast.error(error?.data?.message || "Failed to deactivate account");
    } finally {
      setShowConfirmModal(false);
    }
  };

  // Handle account deletion
  const handleInitiateDeleteAccount = () => {
    setConfirmMessage(
      "Are you sure you want to permanently delete your account? This action cannot be undone."
    );
    setConfirmAction(() => handleDeleteAccount);
    setShowConfirmModal(true);
  };

  const handleDeleteAccount = async () => {
    try {
      await deleteUser().unwrap();
      dispatch(logout());
      navigate("/login");
      toast.success("Account deleted");
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

  // Handle profile loading and error states
  if (isProfileLoading) return <div>Loading...</div>;
  if (profileError) return <div>Error: {profileError.message}</div>;

  return (
    <div className="page-wrapper">
      <div className="content settings-content">
        <div className="page-header">
          <h4 className="fw-bold">Settings</h4>
          <h6>Manage your settings on the portal</h6>
        </div>
        <div className="settings-wrapper d-flex">
          <div className="settings-content-area">
            <div className="card flex-fill mb-0">
              <div className="card-body">
                {/* Email Verification Section */}
                <div className="d-flex align-items-center justify-content-between flex-wrap row-gap-3 border-bottom mb-3 pb-3">
                  <div className="d-flex align-items-center">
                    <span className="avatar avatar-lg border bg-light fs-24 me-2">
                      <i className="ti ti-mail text-gray-900 fs-18"></i>
                    </span>
                    <div>
                      <h5 className="fs-16 fw-medium mb-1">
                        Email Verification
                      </h5>
                      <p className="fs-16">
                        Email: {profile?.user?.email || "Not available"}
                        <br />
                        Status:{" "}
                        {profile?.user?.status === "active" ? (
                          <span className="text-success">Verified</span>
                        ) : (
                          <span className="text-danger">Not Verified</span>
                        )}
                      </p>
                    </div>
                  </div>
                  {profile?.user?.status !== "active" && (
                    <Button
                      variant="primary"
                      onClick={handleResendVerification}
                      disabled={isResendingVerification}
                    >
                      {isResendingVerification
                        ? "Sending..."
                        : "Resend Verification Email"}
                    </Button>
                  )}
                </div>

                {/* Password Section */}
                <div className="d-flex align-items-center justify-content-between flex-wrap row-gap-3 border-bottom mb-3 pb-3">
                  <div className="d-flex align-items-center">
                    <span className="avatar avatar-lg border bg-light fs-24 me-2">
                      <i className="ti ti-eye-off text-gray-900 fs-18"></i>
                    </span>
                    <div>
                      <h5 className="fs-16 fw-medium mb-1">Password</h5>
                      <p className="fs-16">
                        Click to change your password or{" "}
                        <Link to="/forgot-password">reset it</Link>.
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="primary"
                    onClick={() => setShowPasswordModal(true)}
                    disabled={isResettingPassword}
                  >
                    {isResettingPassword ? "Resetting..." : "Change Password"}
                  </Button>
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
                    <Button variant="primary">Change</Button>
                    <Button variant="secondary" className="ms-3">
                      Remove
                    </Button>
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
                  <Button
                    variant="primary"
                    onClick={handleInitiateDeactivateAccount}
                    disabled={isDeactivating}
                  >
                    {isDeactivating ? "Deactivating..." : "Deactivate"}
                  </Button>
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
                  <Button
                    variant="danger"
                    onClick={handleInitiateDeleteAccount}
                    disabled={isDeleting}
                  >
                    {isDeleting ? "Deleting..." : "Delete"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Password Change Modal */}
      <Modal
        show={showPasswordModal}
        onHide={() => setShowPasswordModal(false)}
        centered
        aria-labelledby="changePasswordLabel"
      >
        <Modal.Header closeButton>
          <Modal.Title id="changePasswordLabel">Change Password</Modal.Title>
        </Modal.Header>
        <Modal.Body>
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
                autoFocus
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
        </Modal.Body>
      </Modal>

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
