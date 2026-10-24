import Loader from '../../components/Common/Loader';
import './ResetPassword.styles.css';
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useResetPasswordMutation } from '../../api/authApi';
import logo from '../../assets/img/logo.png';
import { toast } from 'sonner'; // Shared loading indicator
import { useValidateResetTokenQuery } from '../../api/authApi';

const ResetPassword = () => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const navigate = useNavigate();
  const { token } = useParams(); // Extract token from URL
  const [resetPassword, { isLoading: isResetLoading }] = useResetPasswordMutation();
  const {
    data: validationData,
    isLoading: isValidationLoading,
    error: validationError,
  } = useValidateResetTokenQuery(token); // Validate token

  useEffect(() => {
    if (validationError) {
      toast.error(validationError?.data?.message || 'Invalid or expired reset link.');
      setTimeout(() => navigate('/login'), 2000);
    }
  }, [validationError, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validationData?.email) {
      toast.error('Invalid or missing verification data.');
      setTimeout(() => navigate('/login'), 2000);
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    try {
      const response = await resetPassword({
        resetToken: token,
        newPassword,
        email: validationData.email,
      }).unwrap();
      toast.success('Password reset successfully!');
      setTimeout(() => navigate('/login'), 2000);
    } catch (error) {
      toast.error(error?.data?.message || 'Failed to reset password');
    }
  };

  return (
    <div className="main-wrapper">
      <div className="account-content">
        <div className="login-wrapper login-new">
          <div className="row w-100">
            <div className="col-lg-5 mx-auto">
              <div className="login-content user-login">
                <div className="login-logo">
                  <img src={logo} alt="CM Trading Co Logo" />
                </div>

                {isValidationLoading ? (
                  <div className="card fv2-resetpassword-18ca936fc1">
                    <div className="card-body p-5 text-center fv2-resetpassword-60db4fca7a">
                      <Loader size="small" />{' '}
                      <span className="fv2-resetpassword-013827c9e3">Validating reset link...</span>
                    </div>
                  </div>
                ) : validationError ? (
                  <div className="card fv2-resetpassword-18ca936fc1">
                    <div className="card-body p-5 fv2-resetpassword-60db4fca7a">
                      <h3 className="fv2-resetpassword-9ce2c4eb64">Invalid Reset Link</h3>
                      <p className="fv2-resetpassword-4e591586d9">
                        The reset link is invalid or has expired. Please request a new one.
                      </p>
                      <a className="fv2-resetpassword-2b73d951dd" href="/forgot-password">
                        Request New Link
                      </a>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit}>
                    <div className="card">
                      <div className="card-body p-5">
                        <div className="login-userheading">
                          <h3>Reset Password</h3>
                          <h4>Enter your new password to proceed.</h4>
                        </div>
                        <div className="mb-3">
                          <label className="form-label">New Password *</label>
                          <input
                            type="password"
                            className="form-control"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            required
                          />
                        </div>
                        <div className="mb-3">
                          <label className="form-label">Confirm Password *</label>
                          <input
                            type="password"
                            className="form-control"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                          />
                        </div>
                        <div className="form-login">
                          <button
                            type="submit"
                            className="btn btn-login fv2-resetpassword-e5fb449ce9"
                            disabled={isResetLoading || isValidationLoading}
                          >
                            {isResetLoading ? (
                              <>
                                <Loader className="fv2-resetpassword-9496c4ae48" size="small" />{' '}
                                <span className="fv2-resetpassword-013827c9e3">Changing...</span>
                              </>
                            ) : (
                              'Change Password'
                            )}
                          </button>
                        </div>
                        <div className="signinform text-center mb-0">
                          <h4>
                            Return to{' '}
                            <a href="/login" className="hover-a fv2-resetpassword-7dcfb06297">
                              login
                            </a>
                          </h4>
                        </div>
                      </div>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
