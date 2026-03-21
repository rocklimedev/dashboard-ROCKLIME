// src/pages/settings/GeneralSettings.jsx   (adjust path as needed)

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import {
  message,
  Modal,
  Button,
  Typography,
  Space,
  Tag,
} from "antd";
import {
  MailOutlined,
  UserDeleteOutlined,
  EditOutlined,
} from "@ant-design/icons";
import {
  useDeleteUserMutation,
  useGetProfileQuery,
} from "../../api/userApi";
import {
  useResendVerificationEmailMutation,
  useDeactivateAccountMutation,
} from "../../api/authApi";
import { logout } from "../../api/userSlice";
import { Link } from "react-router-dom";
import PageHeader from "../../components/Common/PageHeader";
import ChangePasswordModal from "../../components/settings/ChangePasswordModal"; // ← new import
import "./settingsWrapper.css";

const { Title, Text } = Typography;

const GeneralSettings = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [deleteUser] = useDeleteUserMutation();
  const [resendVerificationEmail] = useResendVerificationEmailMutation();
  const [deactivateAccount, { isLoading: isDeactivating }] =
    useDeactivateAccountMutation();

  const {
    data: profile,
    isLoading: isProfileLoading,
    error: profileError,
  } = useGetProfileQuery();

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmMessage, setConfirmMessage] = useState("");
  const [confirmAction, setConfirmAction] = useState(null);

  const [showPasswordModal, setShowPasswordModal] = useState(false);

  // Handlers
  const handleResendVerification = async () => {
    try {
      await resendVerificationEmail({ email: profile?.user?.email }).unwrap();
      message.success("Verification email sent successfully!");
    } catch (error) {
      message.error(
        error?.data?.message || "Failed to send verification email"
      );
    }
  };

  const handleLogout = () => {
    setConfirmMessage("Are you sure you want to log out?");
    setConfirmAction(() => () => {
      dispatch(logout());
      navigate("/login");
    });
    setShowConfirmModal(true);
  };

  const handleDeactivateAccount = async () => {
    try {
      await deactivateAccount().unwrap();
      message.success(
        "Account deactivated successfully. You can reactivate by logging in again."
      );
      dispatch(logout());
      navigate("/login");
    } catch (error) {
      message.error(
        error?.data?.message || "Failed to deactivate account. Please try again."
      );
    }
  };

  const handleInitiateDeactivate = () => {
    setConfirmMessage("Are you sure you want to deactivate your account?");
    setConfirmAction(() => handleDeactivateAccount);
    setShowConfirmModal(true);
  };

  const handleDeleteAccount = async () => {
    try {
      await deleteUser().unwrap();
      message.success("Account permanently deleted.");
      dispatch(logout());
      navigate("/login");
    } catch (error) {
      message.error(error?.data?.message || "Failed to delete account");
    }
  };

  const handleInitiateDelete = () => {
    setConfirmMessage(
      "Are you sure you want to permanently delete your account? This action cannot be undone."
    );
    setConfirmAction(() => handleDeleteAccount);
    setShowConfirmModal(true);
  };

  const handleConfirm = () => {
    if (confirmAction) confirmAction();
    setShowConfirmModal(false);
  };

  if (isProfileLoading)
    return <div style={{ padding: 20, textAlign: "center" }}>Loading...</div>;

  if (profileError)
    return (
      <div style={{ padding: 20, color: "red" }}>Error loading profile.</div>
    );

  const user = profile?.user || {};

  return (
    <div className="page-wrapper">
      <div className="content">
        <div className="card">
          <div className="card-header d-flex align-items-center">
            <PageHeader
              title="Settings"
              subtitle="Manage your account settings"
              exportOptions={{ pdf: false, excel: false }}
            />
          </div>

          <div className="card-body">
            {/* Edit Profile */}
            <div className="d-flex align-items-center justify-content-between flex-wrap border-bottom pb-4 mb-4">
              <Space size={16}>
                <div className="avatar avatar-lg border bg-light d-flex align-items-center justify-content-center">
                  <EditOutlined style={{ fontSize: 24, color: "#e31e24" }} />
                </div>
                <div>
                  <Title level={5} style={{ margin: 0 }}>
                    Edit Profile
                  </Title>
                  <Text type="secondary">
                    Update your personal information, avatar, and other profile
                    details.
                  </Text>
                </div>
              </Space>
              <Button
                type="primary"
                style={{ background: "#E31E24", color: "#fff" }}
                onClick={() => navigate(`/u/${user.userId}/edit`)}
              >
                Edit Profile
              </Button>
            </div>

            {/* Email Verification */}
            <div className="d-flex align-items-center justify-content-between flex-wrap border-bottom pb-4 mb-4">
              <Space size={16}>
                <div className="avatar avatar-lg border bg-light d-flex align-items-center justify-content-center">
                  <MailOutlined style={{ fontSize: 24, color: "#e31e24" }} />
                </div>
                <div>
                  <Title level={5} style={{ margin: 0 }}>
                    Email Verification
                  </Title>
                  <Text>
                    Email: <strong>{user.email || "Not available"}</strong>
                    <br />
                    Status:{" "}
                    {user.isEmailVerified ? (
                      <Tag color="success">Verified</Tag>
                    ) : (
                      <Tag color="error">Not Verified</Tag>
                    )}
                  </Text>
                </div>
              </Space>
              {!user.isEmailVerified && (
                <Button type="primary" onClick={handleResendVerification}>
                  Resend Verification Email
                </Button>
              )}
            </div>

            {/* Password */}
            <div className="d-flex align-items-center justify-content-between flex-wrap border-bottom pb-4 mb-4">
              <Space size={16}>
                <div className="avatar avatar-lg border bg-light d-flex align-items-center justify-content-center">
                  <EyeOutlined style={{ fontSize: 24, color: "#e31e24" }} />
                </div>
                <div>
                  <Title level={5} style={{ margin: 0 }}>
                    Password
                  </Title>
                  <Text type="secondary">
                    Update your password securely.
                    <br />
                    Forgot your password?{" "}
                    <Link to="/forgot-password" style={{ color: "#1890ff" }}>
                      Click here to reset it
                    </Link>
                    .
                  </Text>
                </div>
              </Space>
              <Button
                type="primary"
                style={{ background: "#E31E24", color: "#fff" }}
                onClick={() => setShowPasswordModal(true)}
              >
                Change Password
              </Button>
            </div>

            {/* Deactivate Account */}
            <div className="d-flex align-items-center justify-content-between flex-wrap border-bottom pb-4 mb-4">
              <Space size={16}>
                <div className="avatar avatar-lg border bg-light d-flex align-items-center justify-content-center">
                  <UserDeleteOutlined
                    style={{ fontSize: 24, color: "#e31e24" }}
                  />
                </div>
                <div>
                  <Title level={5} style={{ margin: 0 }}>
                    Deactivate Account
                  </Title>
                  <Text type="secondary">
                    This will temporarily disable your account. You can
                    reactivate it anytime by logging in again.
                  </Text>
                </div>
              </Space>
              <Button danger onClick={handleInitiateDeactivate}>
                Deactivate
              </Button>
            </div>

            {/* Delete Account */}
            <div className="d-flex align-items-center justify-content-between flex-wrap">
              <Space size={16}>
                <div className="avatar avatar-lg border bg-light d-flex align-items-center justify-content-center">
                  <UserDeleteOutlined
                    style={{ fontSize: 24, color: "#e31e24" }}
                  />
                </div>
                <div>
                  <Title level={5} style={{ margin: 0 }}>
                    Delete Account
                  </Title>
                  <Text type="secondary">
                    Permanently delete your account and all associated data.
                    This action cannot be undone.
                  </Text>
                </div>
              </Space>
              <Button
                type="primary"
                style={{ background: "#E31E24", color: "#fff" }}
                danger
                onClick={handleInitiateDelete}
              >
                Delete Account
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Change Password Modal – now extracted */}
      <ChangePasswordModal
        visible={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
      />

      {/* Confirmation Modal (for logout/deactivate/delete) */}
      <Modal
        open={showConfirmModal}
        title="Confirm Action"
        onCancel={() => setShowConfirmModal(false)}
        footer={
          <Space>
            <Button onClick={() => setShowConfirmModal(false)}>Cancel</Button>
            <Button type="primary" danger onClick={handleConfirm}>
              Confirm
            </Button>
          </Space>
        }
      >
        <Text>{confirmMessage}</Text>
      </Modal>
    </div>
  );
};

export default GeneralSettings;