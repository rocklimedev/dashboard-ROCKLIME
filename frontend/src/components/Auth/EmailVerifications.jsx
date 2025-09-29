import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useResendVerificationEmailMutation } from "../../api/authApi";
import logo from "../../assets/img/logo.png";
import logoWhite from "../../assets/img/logo.png";
import { toast } from "sonner";
import { FaEnvelope } from "react-icons/fa";

const EmailVerification = () => {
  const [email, setEmail] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const [timer, setTimer] = useState(60); // 60 seconds for auto-close
  const [resendVerificationEmail, { isLoading, error }] =
    useResendVerificationEmailMutation();
  const navigate = useNavigate();

  // Email validation regex to match backend
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmedEmail = email.trim().toLowerCase();

    // Client-side validation
    if (!trimmedEmail) {
      toast.error("Please enter an email address");
      return;
    }
    if (!emailRegex.test(trimmedEmail)) {
      toast.error("Invalid email format");
      return;
    }

    try {
      await resendVerificationEmail({ email: trimmedEmail }).unwrap();
      setEmailSent(true);
      setTimer(60); // Start auto-close timer
    } catch (err) {
      const errorMessage =
        err?.data?.message || "Failed to send verification email";
      toast.error(errorMessage);
    }
  };

  // Auto-close timer
  useEffect(() => {
    if (emailSent && timer > 0) {
      const interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    } else if (emailSent && timer === 0) {
      window.close(); // Attempt to close the window
      navigate("/login", { replace: true }); // Fallback to login page
    }
  }, [emailSent, timer, navigate]);

  return (
    <div className="account-content">
      <div className="login-wrapper email-veri-wrap bg-img">
        <div className="login-content authent-content">
          <div className="login-userset">
            <div className="login-logo logo-normal">
              <img src={logo} alt="Logo" />
            </div>
            <a href="/" className="login-logo logo-white">
              <img src={logoWhite} alt="White Logo" />
            </a>
            <div className="login-userheading">
              <h3>Email Verification</h3>
              <h4>Enter your email to receive a verification link</h4>
            </div>
            {emailSent ? (
              <div className="text-center">
                <p className="text-gray-9">
                  We sent you the email, please check your inbox. This window
                  will be closed in {timer} seconds, if not, close it yourself.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label">
                    Email <span className="text-danger">*</span>
                  </label>
                  <div className="input-group">
                    <input
                      type="email"
                      className="form-control border-end-0"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="Enter your email"
                    />
                    <span className="input-group-text border-start-0">
                      <FaEnvelope />
                    </span>
                  </div>
                </div>
                <div className="mb-3">
                  <button
                    type="submit"
                    className="btn btn-primary w-100"
                    disabled={isLoading}
                  >
                    {isLoading ? "Sending..." : "Send Verification Email"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailVerification;
