import React, { useState } from "react";
import { useForgotPasswordMutation } from "../../api/authApi";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify"; // ✅ Import ToastContainer
import "react-toastify/dist/ReactToastify.css";
import logo from "../../assets/img/logo.png";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const navigate = useNavigate();
  const [forgotPassword, { isLoading }] = useForgotPasswordMutation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await forgotPassword({ email }).unwrap();
      toast.success(response.message || "OTP sent successfully!");
      navigate("/reset-password");
    } catch (error) {
      toast.error(error?.data?.message || "Failed to send OTP");
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
                  <img src={logo} alt="logo" />
                </div>
                <form onSubmit={handleSubmit}>
                  <div className="card">
                    <div className="card-body p-5">
                      <div className="login-userheading">
                        <h3>Forgot password?</h3>
                        <h4>Enter your email, and we'll send you an OTP.</h4>
                      </div>
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
                          />
                          <span className="input-group-text border-start-0">
                            <i className="ti ti-mail"></i>
                          </span>
                        </div>
                      </div>
                      <div className="form-login">
                        <button
                          type="submit"
                          className="btn btn-login"
                          disabled={isLoading}
                        >
                          {isLoading ? "Sending..." : "Send OTP"}
                        </button>
                      </div>
                      <div className="signinform text-center">
                        <h4>
                          Return to{" "}
                          <a href="signin-3.html" className="hover-a">
                            login
                          </a>
                        </h4>
                      </div>
                    </div>
                  </div>
                </form>
                {/* ✅ Correct ToastContainer usage */}
                <ToastContainer position="top-right" autoClose={3000} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
