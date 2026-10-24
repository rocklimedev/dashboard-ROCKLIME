import ModalShell from '../../components/Common/ModalShell';
import './GeneralSettings.styles.css';
// src/pages/settings/GeneralSettings.jsx   (adjust path as needed)

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { Button, Typography, Space, Tag } from 'antd';
import { toast } from 'sonner';
import { MailOutlined, UserDeleteOutlined, EditOutlined } from '@ant-design/icons';
import { useDeleteUserMutation, useGetProfileQuery } from '../../api/userApi';
import {
  useResendVerificationEmailMutation,
  useDeactivateAccountMutation,
} from '../../api/authApi';
import { logout } from '../../api/userSlice';
import { Link } from 'react-router-dom';
import PageHeader from '../../components/Common/PageHeader';
import ChangePasswordModal from '../../components/modals/ChangePasswordModal';
import './settingsWrapper.css';
import { EyeOutlined } from '@ant-design/icons';
const { Title, Text } = Typography;

const GeneralSettings = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [deleteUser] = useDeleteUserMutation();
  const [resendVerificationEmail] = useResendVerificationEmailMutation();
  const [deactivateAccount, { isLoading: isDeactivating }] = useDeactivateAccountMutation();

  const { data: profile, isLoading: isProfileLoading, error: profileError } = useGetProfileQuery();

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmMessage, setConfirmMessage] = useState('');
  const [confirmAction, setConfirmAction] = useState(null);

  const [showPasswordModal, setShowPasswordModal] = useState(false);

  // Handlers
  const handleResendVerification = async () => {
    try {
      await resendVerificationEmail({ email: profile?.user?.email }).unwrap();
      toast.success('Verification email sent successfully!');
    } catch (error) {
      toast.error(error?.data?.message || 'Failed to send verification email');
    }
  };

  const handleDeactivateAccount = async () => {
    try {
      await deactivateAccount().unwrap();
      toast.success('Account deactivated successfully. You can reactivate by logging in again.');
      dispatch(logout());
      navigate('/login');
    } catch (error) {
      toast.error(error?.data?.message || 'Failed to deactivate account. Please try again.');
    }
  };

  const handleInitiateDeactivate = () => {
    setConfirmMessage('Are you sure you want to deactivate your account?');
    setConfirmAction(() => handleDeactivateAccount);
    setShowConfirmModal(true);
  };

  const handleDeleteAccount = async () => {
    try {
      await deleteUser().unwrap();
      toast.success('Account permanently deleted.');
      dispatch(logout());
      navigate('/login');
    } catch (error) {
      toast.error(error?.data?.message || 'Failed to delete account');
    }
  };

  const handleInitiateDelete = () => {
    setConfirmMessage(
      'Are you sure you want to permanently delete your account? This action cannot be undone.',
    );
    setConfirmAction(() => handleDeleteAccount);
    setShowConfirmModal(true);
  };

  const handleConfirm = () => {
    if (confirmAction) confirmAction();
    setShowConfirmModal(false);
  };

  if (isProfileLoading) return <div className="fv2-generalsettings-b89494a7d1">Loading...</div>;

  if (profileError)
    return <div className="fv2-generalsettings-fd2453a69d">Error loading profile.</div>;

  const user = profile?.user || {};

  return (
    <div className="page-wrapper">
      <div className="content">
        <div className="card">
          <div className="card-header d-flex align-items-center">
            <PageHeader
              title="My Account Settings"
              subtitle="Manage your account settings"
              exportOptions={{ pdf: false, excel: false }}
            />
          </div>

          <div className="card-body">
            {/* Email Verification */}
            <div className="d-flex align-items-center justify-content-between flex-wrap border-bottom pb-4 mb-4">
              <Space size={16}>
                <div className="avatar avatar-lg border bg-light d-flex align-items-center justify-content-center">
                  <MailOutlined className="fv2-generalsettings-03d31bbfe2" />
                </div>
                <div>
                  <Title className="fv2-generalsettings-04624dbbf2" level={5}>
                    Email Verification
                  </Title>
                  <Text>
                    Email: <strong>{user.email || 'Not available'}</strong>
                    <br />
                    Status:{' '}
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
                  <EyeOutlined className="fv2-generalsettings-03d31bbfe2" />
                </div>
                <div>
                  <Title className="fv2-generalsettings-04624dbbf2" level={5}>
                    Password
                  </Title>
                  <Text type="secondary">
                    Update your password securely.
                    <br />
                    Forgot your password?{' '}
                    <Link className="fv2-generalsettings-4d2e58010f" to="/forgot-password">
                      Click here to reset it
                    </Link>
                    .
                  </Text>
                </div>
              </Space>
              <Button
                className="fv2-generalsettings-53b21fd144"
                type="primary"

                onClick={() => setShowPasswordModal(true)}
              >
                Change Password
              </Button>
            </div>

            {/* Deactivate Account */}
            <div className="d-flex align-items-center justify-content-between flex-wrap border-bottom pb-4 mb-4">
              <Space size={16}>
                <div className="avatar avatar-lg border bg-light d-flex align-items-center justify-content-center">
                  <UserDeleteOutlined className="fv2-generalsettings-03d31bbfe2" />
                </div>
                <div>
                  <Title className="fv2-generalsettings-04624dbbf2" level={5}>
                    Deactivate Account
                  </Title>
                  <Text type="secondary">
                    This will temporarily disable your account. You can reactivate it anytime by
                    logging in again.
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
                  <UserDeleteOutlined className="fv2-generalsettings-03d31bbfe2" />
                </div>
                <div>
                  <Title className="fv2-generalsettings-04624dbbf2" level={5}>
                    Delete Account
                  </Title>
                  <Text type="secondary">
                    Permanently delete your account and all associated data. This action cannot be
                    undone.
                  </Text>
                </div>
              </Space>
              <Button
                className="fv2-generalsettings-53b21fd144"
                type="primary"

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
      <ModalShell
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
      </ModalShell>
    </div>
  );
};

export default GeneralSettings;
