import React, { useState, useEffect } from "react";
import { useForgotPasswordMutation } from "../../api/authApi";
import { toast } from "sonner";
import logo from "../../assets/img/logo.png";
import { Spinner } from "react-bootstrap";
import { useGetProfileQuery } from "../../api/userApi";
import { MailOutlined } from "@ant-design/icons";
const ForgotPassword = () => {
  const [forgotPassword, { isLoading }] = useForgotPasswordMutation();
  const {
    data: profile,
    isLoading: profileLoading,
    error: profileError,
  } = useGetProfileQuery();
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [useManualInput, setUseManualInput] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [countdown, setCountdown] = useState(15); // 15-second countdown

  const validateEmail = (value) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!value || value.trim() === "") return "Email is required";
    if (!emailRegex.test(value.trim()))
      return "Please enter a valid email address";
    return "";
  };

  useEffect(() => {
    if (!profileLoading && !profileError && profile?.user?.email) {
      const fetchedEmail = String(profile.user.email);
      const validationError = validateEmail(fetchedEmail);
      setEmail(fetchedEmail);
      setEmailError(validationError);
      setUseManualInput(validationError !== "");
    } else if (!profileLoading && (profileError || !profile?.user?.email)) {
      setUseManualInput(true);
      setEmail("");
      setEmailError("Unable to fetch profile email. Please enter manually.");
    }
  }, [profile, profileLoading, profileError]);

  useEffect(() => {
    let timer;
    if (emailSent && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            try {
              window.close(); // Attempt to close the tab
            } catch (e) {
              console.warn("Window close failed:", e);
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer); // Clean up timer on unmount
  }, [emailSent, countdown]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validateEmail(email);
    if (validationError) {
      setEmailError(validationError);
      toast.error(validationError);
      return;
    }

    try {
      const response = await forgotPassword({ email: email.trim() }).unwrap();
      toast.success(response.message || "Reset link sent to your email!");
      setEmailSent(true); // Show success message and start timer
    } catch (error) {
      console.error("ForgotPassword API error:", error);
      toast.error(error?.data?.message || "Failed to send reset link.");
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
                {emailSent ? (
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
                        Email Sent!
                      </h3>
                      <p style={{ marginBottom: "20px" }}>
                        A password reset link has been sent to{" "}
                        <strong>{email}</strong>. Please check your email (and
                        spam/junk folder) to reset your password.
                      </p>
                      <p style={{ marginBottom: "20px" }}>
                        This tab will close in{" "}
                        <strong style={{ color: "#e31e24" }}>
                          {countdown} seconds
                        </strong>
                        . If it doesn’t close automatically, please close it
                        manually.
                      </p>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit}>
                    <div className="card">
                      <div className="card-body p-5">
                        <div className="login-userheading">
                          <h3>Forgot Password?</h3>
                          <h4>We'll send a reset link to your email.</h4>
                        </div>
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
                              disabled={
                                isLoading || profileLoading || !useManualInput
                              }
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
                          {(profileError || !profile?.user?.email) &&
                            !profileLoading && (
                              <div className="text-danger mt-2">
                                Unable to fetch profile. Please enter your email
                                manually.
                              </div>
                            )}
                        </div>
                        <div className="form-login">
                          <button
                            type="submit"
                            className="btn btn-login"
                            disabled={
                              isLoading ||
                              profileLoading ||
                              emailError ||
                              !email.trim()
                            }
                          >
                            {isLoading ? (
                              <>
                                <Spinner
                                  as="span"
                                  animation="border"
                                  size="sm"
                                  role="status"
                                  aria-hidden="true"
                                  className="me-2"
                                />
                                Sending...
                              </>
                            ) : (
                              "Send Reset Link"
                            )}
                          </button>
                        </div>
                        <div className="signinform text-center">
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
