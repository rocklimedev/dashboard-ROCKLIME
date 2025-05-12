import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useResetPasswordMutation } from "../../api/authApi";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import logo from "../../assets/img/logo.png";

const ResetPassword = () => {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const navigate = useNavigate();
  const [resetPassword, { isLoading }] = useResetPasswordMutation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    try {
      const response = await resetPassword({ newPassword }).unwrap();
      toast.success(response.message || "Password changed successfully!");
      navigate("/signin");
    } catch (error) {
      toast.error(error?.data?.message || "Failed to reset password");
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
                          className="btn btn-login"
                          disabled={isLoading}
                        >
                          {isLoading ? "Changing..." : "Change Password"}
                        </button>
                      </div>
                      <div className="signinform text-center mb-0">
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
                {/* Toast Container */}
                <ToastContainer position="top-right" autoClose={3000} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
