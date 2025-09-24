import React, { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { useVerifyAccountMutation } from "../../api/authApi";
import logo from "../../assets/img/logo.png";
import logoWhite from "../../assets/img/logo.png";
import { toast } from "sonner";
import ClockCircleOutlined from "@ant-design/icons/ClockCircleOutlined";
const EmailVerification = () => {
  const [otp, setOtp] = useState(["", "", "", ""]);
  const [timer, setTimer] = useState(600); // 10 minutes in seconds
  const [verifyAccount, { isLoading, error }] = useVerifyAccountMutation();
  const inputRefs = useRef([]);
  const location = useLocation();
  const email =
    location.state?.email ||
    localStorage.getItem("email") ||
    "example@domain.com";

  // Handle OTP input
  const handleInputChange = (index, value) => {
    if (/^[0-9]?$/.test(value)) {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);

      // Move to next input
      if (value && index < 3) {
        inputRefs.current[index + 1].focus();
      }
    }
  };

  // Handle backspace
  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = otp.join("");
    try {
      const response = await verifyAccount({ token, email }).unwrap();

      window.location.href = "/reset-password";
    } catch (err) {
      toast.error(error?.data?.message || "Verification failed");
    }
  };

  // Handle resend OTP
  const handleResend = async () => {
    try {
      await fetch("/api/auth/resend-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setTimer(600); // Reset timer
    } catch (err) {
      toast.error("Failed to resend OTP");
    }
  };

  // Timer logic
  useEffect(() => {
    const interval = setInterval(() => {
      setTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Format timer
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  return (
    <div className="account-content">
      <div className="login-wrapper email-veri-wrap bg-img">
        <div className="login-content authent-content">
          <form onSubmit={handleSubmit} className="digit-group">
            <div className="login-userset">
              <div className="login-logo logo-normal">
                <img src={logo} alt="Logo" />
              </div>
              <a href="/" className="login-logo logo-white">
                <img src={logoWhite} alt="White Logo" />
              </a>
              <div>
                <div className="login-userheading">
                  <h3>Email OTP Verification</h3>
                  <h4>
                    OTP sent to your Email Address ending{" "}
                    <span>******{email.slice(-10)}</span>
                  </h4>
                </div>
                <div className="text-center otp-input">
                  <div className="d-flex align-items-center mb-3">
                    {otp.map((digit, index) => (
                      <input
                        key={index}
                        type="text"
                        className="rounded w-100 py-sm-3 py-2 text-center fs-26 fw-bold me-3"
                        value={digit}
                        onChange={(e) =>
                          handleInputChange(index, e.target.value)
                        }
                        onKeyDown={(e) => handleKeyDown(index, e)}
                        ref={(el) => (inputRefs.current[index] = el)}
                        maxLength="1"
                        aria-label={`OTP digit ${index + 1}`}
                      />
                    ))}
                  </div>
                  <div>
                    <div className="badge bg-danger-transparent mb-3">
                      <p className="d-flex align-items-center">
                        <ClockCircleOutlined />
                        {formatTime(timer)}
                      </p>
                    </div>
                    <div className="mb-3 d-flex justify-content-center">
                      <p className="text-gray-9">
                        Didn't get the OTP?{" "}
                        <a
                          href="#"
                          className="text-primary"
                          onClick={handleResend}
                        >
                          Resend OTP
                        </a>
                      </p>
                    </div>
                  </div>
                </div>
                <div className="mb-3">
                  <button
                    type="submit"
                    className="btn btn-primary w-100"
                    disabled={isLoading || otp.some((digit) => !digit)}
                  >
                    {isLoading ? "Verifying..." : "Verify & Proceed"}
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EmailVerification;
