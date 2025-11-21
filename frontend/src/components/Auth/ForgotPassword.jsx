// src/pages/auth/ForgotPassword.jsx
import React, { useState, useEffect } from "react";
import { useForgotPasswordMutation } from "../../api/authApi";
import { useGetProfileQuery } from "../../api/userApi";
import logo from "../../assets/img/logo.png";
import { MailOutlined } from "@ant-design/icons";
import { message } from "antd";
const ForgotPassword = () => {
  const [forgotPassword] = useForgotPasswordMutation();
  const {
    data: profile,
    isLoading: profileLoading,
    error: profileError,
  } = useGetProfileQuery();

  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [useManualInput, setUseManualInput] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [countdown, setCountdown] = useState(15); // 15-second auto-close

  // ────── EMAIL VALIDATION ──────
  const validateEmail = (value) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!value?.trim()) return "Email is required";
    if (!emailRegex.test(value.trim()))
      return "Please enter a valid email address";
    return "";
  };

  // ────── AUTO-FILL FROM PROFILE ──────
  useEffect(() => {
    if (!profileLoading && !profileError && profile?.user?.email) {
      const fetched = String(profile.user.email);
      const err = validateEmail(fetched);
      setEmail(fetched);
      setEmailError(err);
      setUseManualInput(err !== "");
    } else if (!profileLoading && (profileError || !profile?.user?.email)) {
      setUseManualInput(true);
      setEmail("");
      setEmailError("Unable to fetch profile email. Please enter manually.");
    }
  }, [profile, profileLoading, profileError]);

  // ────── AUTO-CLOSE COUNTDOWN ──────
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

  // ────── SUBMIT ──────
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
      message.success("Reset link sent! Check your inbox (and spam).");
    } catch (error) {
      message.error(error?.data?.message || "Failed to send reset link.");
    }
  };

  // ────── RENDER ──────
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

                {/* ────── SUCCESS STATE ────── */}
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
                        Email Sent!
                      </h3>
                      <p style={{ marginBottom: "20px" }}>
                        A password reset link has been sent to{" "}
                        <strong>{email}</strong>. Please check your email (and
                        spam/junk folder).
                      </p>
                      <p style={{ marginBottom: "20px" }}>
                        This tab will close in{" "}
                        <strong style={{ color: "#e31e24" }}>
                          {countdown} seconds
                        </strong>
                        . If it doesn’t close, please close it manually.
                      </p>
                    </div>
                  </div>
                ) : (
                  /* ────── FORM STATE ────── */
                  <form onSubmit={handleSubmit}>
                    <div className="card">
                      <div className="card-body p-5">
                        <div className="login-userheading">
                          <h3>Forgot Password?</h3>
                          <h4>We'll send a reset link to your email.</h4>
                        </div>

                        {/* EMAIL INPUT */}
                        <div className="mb-3">
                          <label className="form-label">
                            Email <span className="text-danger">*</span>
                          </label>
                          <div className="input-group">
                            <input
                              type="email"
                              className={`form-control border-end-0 ${
                                emailError ? "is-invalid" : ""
                              }`}
                              value={profileLoading ? "Loading..." : email}
                              onChange={(e) => {
                                if (useManualInput) {
                                  setEmail(e.target.value);
                                  setEmailError(validateEmail(e.target.value));
                                }
                              }}
                              placeholder={
                                useManualInput ? "Enter your email" : ""
                              }
                              disabled={profileLoading || !useManualInput}
                            />
                            <span className="input-group-text border-start-0">
                              <MailOutlined />
                            </span>
                            {emailError && (
                              <div className="invalid-feedback">
                                {emailError}
                              </div>
                            )}
                          </div>

                          {/* PROFILE FETCH ERROR */}
                          {(profileError || !profile?.user?.email) &&
                            !profileLoading && (
                              <div className="text-danger mt-2">
                                Unable to fetch profile. Please enter your email
                                manually.
                              </div>
                            )}
                        </div>

                        {/* SUBMIT BUTTON */}
                        <div className="form-login">
                          <button
                            type="submit"
                            className="btn btn-login"
                            disabled={
                              profileLoading || emailError || !email.trim()
                            }
                            style={{ minWidth: "160px" }}
                          >
                            Send Reset Link
                          </button>
                        </div>

                        <div className="signinform text-center mt-3">
                          <h4>
                            Return to{" "}
                            <a href="/login" className="hover-a">
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

export default ForgotPassword;
