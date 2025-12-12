// src/pages/auth/ForgotPassword.jsx
import React, { useState, useEffect } from "react";
import { useForgotPasswordMutation } from "../../api/authApi";
import logo from "../../assets/img/logo.png";
import { MailOutlined } from "@ant-design/icons";
import { message } from "antd";

const ForgotPassword = () => {
  const [forgotPassword, { isLoading }] = useForgotPasswordMutation();

  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const [countdown, setCountdown] = useState(15);

  // Email validation
  const validateEmail = (value) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!value?.trim()) return "Email is required";
    if (!emailRegex.test(value.trim()))
      return "Please enter a valid email address";
    return "";
  };

  // Auto-close after success
  useEffect(() => {
    if (!emailSent || countdown === 0) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          try {
            window.close();
          } catch (_) {}
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [emailSent, countdown]);

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    const err = validateEmail(email);
    if (err) {
      setEmailError(err);
      message.error(err);
      return;
    }

    try {
      await forgotPassword({ email: email.trim() }).unwrap();
      setEmailSent(true);
      message.success("Reset link sent! Check your inbox (and spam folder).");
    } catch (error) {
      const errMsg =
        error?.data?.message || "Failed to send reset link. Please try again.";
      message.error(errMsg);
    }
  };

  return (
    <div className="main-wrapper">
      <div className="account-content">
        <div className="login-wrapper login-new-2">
          <div className="row w-100">
            <div className="col-lg-5 mx-auto">
              <div className="login-content user-login">
                <div className="login-logo">
                  <img src={logo} alt="CM Trading Co Logo" />
                </div>

                {/* SUCCESS STATE */}
                {emailSent ? (
                  <div
                    className="card"
                    style={{
                      border: "1px solid #eee",
                      borderRadius: "8px",
                      backgroundColor: "#fff",
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
                      <div className="mb-4">
                        <MailOutlined
                          style={{ fontSize: 48, color: "#52c41a" }}
                        />
                      </div>
                      <h3
                        style={{
                          color: "#212b36",
                          fontWeight: 700,
                          marginBottom: "16px",
                        }}
                      >
                        Check Your Email
                      </h3>
                      <p style={{ marginBottom: "16px" }}>
                        A password reset link has been sent to:
                      </p>
                      <p
                        style={{
                          fontWeight: "600",
                          color: "#1890ff",
                          marginBottom: "20px",
                        }}
                      >
                        {email}
                      </p>
                      <p style={{ marginBottom: "20px", color: "#8c8c8c" }}>
                        Please check your inbox (and spam/junk folder).
                      </p>
                      <p style={{ color: "#595959" }}>
                        This tab will close in{" "}
                        <strong style={{ color: "#e31e24" }}>
                          {countdown}
                        </strong>{" "}
                        seconds.
                      </p>
                    </div>
                  </div>
                ) : (
                  /* FORM STATE */
                  <form onSubmit={handleSubmit}>
                    <div className="card">
                      <div className="card-body p-5">
                        <div className="login-userheading text-center mb-4">
                          <h3>Forgot Password?</h3>
                          <h4 style={{ color: "#8c8c8c", fontSize: "15px" }}>
                            Enter your email and we'll send you a reset link
                          </h4>
                        </div>

                        <div className="mb-4">
                          <label className="form-label">
                            Email Address <span className="text-danger">*</span>
                          </label>
                          <div className="input-group">
                            <input
                              type="email"
                              className={`form-control ${
                                emailError ? "is-invalid" : ""
                              }`}
                              value={email}
                              onChange={(e) => {
                                setEmail(e.target.value);
                                setEmailError(validateEmail(e.target.value));
                              }}
                              placeholder="you@example.com"
                              autoFocus
                            />
                            <span className="input-group-text">
                              <MailOutlined />
                            </span>
                            {emailError && (
                              <div className="invalid-feedback">
                                {emailError}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="form-login text-center">
                          <button
                            type="submit"
                            className="btn btn-login w-100"
                            disabled={
                              isLoading || !!emailError || !email.trim()
                            }
                          >
                            {isLoading ? "Sending..." : "Send Reset Link"}
                          </button>
                        </div>

                        <div className="signinform text-center mt-4">
                          <h4>
                            Remember your password?{" "}
                            <a href="/login" className="hover-a">
                              Back to Login
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

export default ForgotPassword;
