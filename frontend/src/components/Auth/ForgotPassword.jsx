import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForgotPasswordMutation } from "../../api/authApi";
import { toast } from "sonner";
import logo from "../../assets/img/logo.png";
import { Spinner } from "react-bootstrap";
import { useGetProfileQuery } from "../../api/userApi";
const ForgotPassword = () => {
  const navigate = useNavigate();
  const [forgotPassword, { isLoading }] = useForgotPasswordMutation();
  const {
    data: profile,
    isLoading: profileLoading,
    error: profileError,
  } = useGetProfileQuery();
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [useManualInput, setUseManualInput] = useState(false);

  // Validate email format
  const validateEmail = (value) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!value || value.trim() === "") {
      return "Email is required";
    }
    if (!emailRegex.test(value.trim())) {
      return "Please enter a valid email address";
    }
    return "";
  };

  // Set email from profile when available
  useEffect(() => {
    console.log("Profile data:", { profile, profileLoading, profileError }); // Debug log
    if (!profileLoading && !profileError && profile?.user?.email) {
      const fetchedEmail = String(profile.user.email); // Ensure string
      console.log("Fetched profile email:", fetchedEmail);
      const validationError = validateEmail(fetchedEmail);
      setEmail(fetchedEmail);
      setEmailError(validationError);
      setUseManualInput(validationError !== "");
    } else if (!profileLoading && (profileError || !profile?.user?.email)) {
      console.log("Profile fetch failed or no email:", profileError, profile);
      setUseManualInput(true);
      setEmail("");
      setEmailError("Unable to fetch profile email. Please enter manually.");
    }
  }, [profile, profileLoading, profileError]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validateEmail(email);
    if (validationError) {
      setEmailError(validationError);
      toast.error(validationError);
      return;
    }

    const payload = { email: email.trim() };
    console.log("Sending payload to backend:", payload);
    try {
      const response = await forgotPassword(payload).unwrap();
      toast.success(
        response.message || "Password reset link sent successfully!"
      );
      setTimeout(() => navigate("/reset-password"), 2000);
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
                            <i className="ti ti-mail"></i>
                          </span>
                          {emailError && (
                            <div className="invalid-feedback">{emailError}</div>
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
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
