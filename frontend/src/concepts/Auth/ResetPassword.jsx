import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useResetPasswordMutation } from "../../api/authApi";
import logo from "../../assets/img/logo.png";
import { Spin, message } from "antd"; // Added Spin
import { useValidateResetTokenQuery } from "../../api/authApi";

const ResetPassword = () => {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const navigate = useNavigate();
  const { token } = useParams(); // Extract token from URL
  const [resetPassword, { isLoading: isResetLoading }] =
    useResetPasswordMutation();
  const {
    data: validationData,
    isLoading: isValidationLoading,
    error: validationError,
  } = useValidateResetTokenQuery(token); // Validate token

  useEffect(() => {
    if (validationError) {
      message.error(
        validationError?.data?.message || "Invalid or expired reset link."
      );
      setTimeout(() => navigate("/login"), 2000);
    }
  }, [validationError, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validationData?.email) {
      message.error("Invalid or missing verification data.");
      setTimeout(() => navigate("/login"), 2000);
      return;
    }
    if (newPassword !== confirmPassword) {
      message.error("Passwords do not match");
      return;
    }

    try {
      const response = await resetPassword({
        resetToken: token,
        newPassword,
        email: validationData.email,
      }).unwrap();
      message.success("Password reset successfully!");
      setTimeout(() => navigate("/login"), 2000);
    } catch (error) {
      message.error(error?.data?.message || "Failed to reset password");
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
                  <div
                    className="card"
                    style={{
                      border: "1px solid #eee",
                      borderRadius: "8px",
                      backgroundColor: "#ffffff",
                    }}
                  >
                    <div
                      className="card-body p-5 text-center"
                      style={{
                        fontFamily: "'Lato', Arial, sans-serif",
                        color: "#646b72",
                        fontSize: "15px",
                        lineHeight: "1.6",
                      }}
                    >
                      <Spin size="small" />{" "}
                      <span style={{ marginLeft: 8 }}>
                        Validating reset link...
                      </span>
                    </div>
                  </div>
                ) : validationError ? (
                  <div
                    className="card"
                    style={{
                      border: "1px solid #eee",
                      borderRadius: "8px",
                      backgroundColor: "#ffffff",
                    }}
                  >
                    <div
                      className="card-body p-5"
                      style={{
                        fontFamily: "'Lato', Arial, sans-serif",
                        color: "#646b72",
                        fontSize: "15px",
                        lineHeight: "1.6",
                      }}
                    >
                      <h3
                        style={{
                          color: "#212b36",
                          fontWeight: 700,
                          marginBottom: "20px",
                        }}
                      >
                        Invalid Reset Link
                      </h3>
                      <p style={{ marginBottom: "20px" }}>
                        The reset link is invalid or has expired. Please request
                        a new one.
                      </p>
                      <a
                        href="/forgot-password"
                        style={{
                          color: "#e31e24",
                          textDecoration: "none",
                          fontWeight: "bold",
                        }}
                      >
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
                          <label className="form-label">
                            Confirm Password *
                          </label>
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
                            className="btn btn-login"
                            disabled={isResetLoading || isValidationLoading}
                            style={{
                              backgroundColor: "#e31e24",
                              color: "#ffffff",
                              padding: "12px 20px",
                              borderRadius: "5px",
                              fontWeight: "bold",
                              width: "100%",
                              border: "none",
                              display: "flex",
                              justifyContent: "center",
                              alignItems: "center",
                            }}
                          >
                            {isResetLoading ? (
                              <>
                                <Spin size="small" style={{ color: "#fff" }} />{" "}
                                <span style={{ marginLeft: 8 }}>
                                  Changing...
                                </span>
                              </>
                            ) : (
                              "Change Password"
                            )}
                          </button>
                        </div>
                        <div className="signinform text-center mb-0">
                          <h4>
                            Return to{" "}
                            <a
                              href="/login"
                              className="hover-a"
                              style={{
                                color: "#e31e24",
                                textDecoration: "none",
                              }}
                            >
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
