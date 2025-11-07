// src/pages/auth/EmailVerification.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useResendVerificationEmailMutation } from "../../api/authApi";
import { toast } from "sonner";
import logo from "../../assets/img/logo.png";
import logoWhite from "../../assets/img/logo.png";
import { FaEnvelope } from "react-icons/fa";

const EmailVerification = () => {
  const [email, setEmail] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const [timer, setTimer] = useState(60); // seconds until auto-close
  const [resendVerificationEmail, { isLoading }] =
    useResendVerificationEmailMutation();
  const navigate = useNavigate();

  // Same regex as backend
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // ────── FORM SUBMIT ──────
  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = email.trim().toLowerCase();

    if (!trimmed) return toast.error("Please enter an email address");
    if (!emailRegex.test(trimmed)) return toast.error("Invalid email format");

    try {
      await resendVerificationEmail({ email: trimmed }).unwrap();
      setEmailSent(true);
      setTimer(60);
    } catch (err) {
      toast.error(err?.data?.message || "Failed to send verification email");
    }
  };

  // ────── AUTO-CLOSE COUNTDOWN ──────
  useEffect(() => {
    if (!emailSent) return;

    const id = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          clearInterval(id);
          try {
            window.close();
          } catch (_) {}
          navigate("/login", { replace: true });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(id);
  }, [emailSent, navigate]);

  // ────── RENDER ──────
  return (
    <div className="account-content">
      <div className="login-wrapper email-veri-wrap bg-img">
        <div className="login-content authent-content">
          <div className="login-userset">
            {/* LOGO */}
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

            {/* SUCCESS STATE */}
            {emailSent ? (
              <div className="text-center">
                <p className="text-gray-9">
                  We sent you the email – check your inbox (and spam). This
                  window will close in <strong>{timer}</strong> second
                  {timer !== 1 ? "s" : ""}.
                </p>
              </div>
            ) : (
              /* FORM STATE */
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
                      disabled={isLoading}
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
                    style={{ minHeight: "44px" }}
                  >
                    Send Verification Email
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
