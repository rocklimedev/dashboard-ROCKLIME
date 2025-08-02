import React from "react";
import { useForgotPasswordMutation } from "../../api/authApi";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner"; // Changed import
import logo from "../../assets/img/logo.png";
import { useGetProfileQuery } from "../../api/userApi";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [forgotPassword, { isLoading }] = useForgotPasswordMutation();
  const {
    data: profile,
    isLoading: profileLoading,
    error,
  } = useGetProfileQuery();

  const email = profile?.user?.email || "";

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      toast.error("Email not available. Please try again."); // Sonner toast
      return;
    }

    try {
      const response = await forgotPassword({ email }).unwrap();
      toast.success(response.message || "OTP sent successfully!"); // Sonner toast
      navigate("/reset-password");
    } catch (error) {
      toast.error(error?.data?.message || "Failed to send OTP"); // Sonner toast
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
                        <h4>We'll send an OTP to your registered email.</h4>
                      </div>
                      <div className="mb-3">
                        <label className="form-label">
                          Email <span className="text-danger">*</span>
                        </label>
                        <div className="input-group">
                          <input
                            type="email"
                            className="form-control border-end-0"
                            value={profileLoading ? "Loading..." : email}
                            disabled
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
                          disabled={isLoading || profileLoading || !email}
                        >
                          {isLoading ? "Sending..." : "Send OTP"}
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
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
