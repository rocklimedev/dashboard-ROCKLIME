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
  useChangePasswordMutation,
  useResendVerificationEmailMutation,
} from "../../api/authApi";
import { logout } from "../../api/userSlice";
import { Modal, Button, Form } from "react-bootstrap";
import { Link } from "react-router-dom";
import "./settingsWrapper.css";
import {
  MailOutlined,
  EyeOutlined,
  UserDeleteOutlined,
  EditOutlined, // <-- new icon
} from "@ant-design/icons";
import PageHeader from "../Common/PageHeader";

const GeneralSettings = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // RTK Query hooks
  const [changePassword, { isLoading: isChangingPassword }] =
    useChangePasswordMutation();
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
    password: "", // current password
    newPassword: "", // new password
  });
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [confirmMessage, setConfirmMessage] = useState("");

  // ---------- NEW: Edit Profile ----------
  const handleEditProfile = () => {
    if (profile?.user?.id) {
      navigate(`/u/${profile.user.id}/edit`);
    }
  };
  // -----------------------------------------

  // Handle password change
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    try {
      await changePassword(passwordData).unwrap();
      setPasswordData({ password: "", newPassword: "" });
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
      toast.success("Verification email sent");
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
    } catch (error) {
      toast.error(error?.data?.message || "Failed to delete account");
    } finally {
      setShowConfirmModal(false);
    }
  };

  // Handle modal confirmation
  const handleConfirmAction = () => {
    if (confirmAction) confirmAction();
  };

  // Loading / error states
  if (isProfileLoading) return <div>Loading...</div>;
  if (profileError) return <div>Error: {profileError.message}</div>;

  return (
    <div className="page-wrapper">
      <div className="content">
        <div className="card">
          <div className="card-header d-flex align-items-center">
            <PageHeader
              title="Settings"
              subtitle="Manage your settings"
              exportOptions={{ pdf: false, excel: false }}
            />
          </div>

          <div className="card-body">
            {/* ---------- NEW: Edit Profile Section ---------- */}
            <div className="d-flex align-items-center justify-content-between flex-wrap row-gap-3 border-bottom mb-3 pb-3">
              <div className="d-flex align-items-center">
                <span className="avatar avatar-lg border bg-light fs-24 me-2">
                  <EditOutlined />
                </span>
                <div>
                  <h5 className="fs-16 fw-medium mb-1">Edit Profile</h5>
                  <p className="fs-16">
                    Update your personal information, avatar, and other profile
                    details.
                  </p>
                </div>
              </div>
              <Button variant="primary" onClick={handleEditProfile}>
                Edit Profile
              </Button>
            </div>
            {/* ------------------------------------------------ */}

            {/* Email Verification Section */}
            <div className="d-flex align-items-center justify-content-between flex-wrap row-gap-3 border-bottom mb-3 pb-3">
              <div className="d-flex align-items-center">
                <span className="avatar avatar-lg border bg-light fs-24 me-2">
                  <MailOutlined />
                </span>
                <div>
                  <h5 className="fs-16 fw-medium mb-1">Email Verification</h5>
                  <p className="fs-16">
                    Email: {profile?.user?.email || "Not available"}
                    <br />
                    Status:{" "}
                    {profile?.user?.isEmailVerified ? (
                      <span className="text-success">Verified</span>
                    ) : (
                      <span className="text-danger">Not Verified</span>
                    )}
                  </p>
                </div>
              </div>
              {!profile?.user?.isEmailVerified && (
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
                  <EyeOutlined />
                </span>
                <div>
                  <h5 className="fs-16 fw-medium mb-1">Password</h5>
                  <p className="fs-16 mb-1">Update your password securely.</p>
                  <p className="fs-14 text-muted">
                    Forgot your password?{" "}
                    <Link to="/forgot-password">Click here to reset it</Link>.
                  </p>
                </div>
              </div>
              <Button
                variant="primary"
                onClick={() => setShowPasswordModal(true)}
                disabled={isChangingPassword}
              >
                {isChangingPassword ? "Saving..." : "Change Password"}
              </Button>
            </div>

            {/* Deactivate Account */}
            <div className="d-flex align-items-center justify-content-between flex-wrap row-gap-3 border-bottom mb-3 pb-3">
              <div className="d-flex align-items-center">
                <span className="avatar avatar-lg border bg-light fs-24 me-2">
                  <UserDeleteOutlined />
                </span>
                <div>
                  <h5 className="fs-16 fw-medium mb-1">Deactivate Account</h5>
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
                  <UserDeleteOutlined />
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

          {/* Password Change Modal */}
          <Modal
            show={showPasswordModal}
            onHide={() => setShowPasswordModal(false)}
            centered
            aria-labelledby="changePasswordLabel"
          >
            <Modal.Header closeButton>
              <Modal.Title id="changePasswordLabel">
                Change Password
              </Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <Form onSubmit={handlePasswordChange}>
                <Form.Group className="mb-3" controlId="password">
                  <Form.Label>Current Password</Form.Label>
                  <Form.Control
                    type="password"
                    value={passwordData.password}
                    onChange={(e) =>
                      setPasswordData({
                        ...passwordData,
                        password: e.target.value,
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
                  disabled={isChangingPassword}
                >
                  {isChangingPassword ? "Saving..." : "Save Changes"}
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
      </div>
    </div>
  );
};

export default GeneralSettings;
