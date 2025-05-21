import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useLoginMutation } from "../../api/authApi";
import { toast } from "sonner"; // Changed import
import { useAuth } from "../../context/AuthContext";
import logo from "../../assets/img/logo.png";
import { FaEnvelope, FaEye, FaEyeSlash } from "react-icons/fa";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loginMutation, { isLoading }] = useLoginMutation();
  const { login: authLogin, auth } = useAuth();
  const navigate = useNavigate();
  const [loginSuccess, setLoginSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Perform login mutation
      const response = await loginMutation({ email, password }).unwrap();
      const token = response.accessToken;

      if (!token) {
        throw new Error("No access token received");
      }

      // Store token in localStorage or sessionStorage first
      if (rememberMe) {
        localStorage.setItem("token", token);
        sessionStorage.removeItem("token");
      } else {
        sessionStorage.setItem("token", token);
        localStorage.removeItem("token");
      }

      // Update AuthContext
      authLogin(token, response.user || null);

      // Mark login as successful
      setLoginSuccess(true);

      // Show success toast
      toast.success("Login successful!", { duration: 1000 }); // Sonner toast
    } catch (err) {
      toast.error(`Login failed: ${err?.message || "Unknown error occurred"}`); // Sonner toast
      const status = err?.status;
      const message = err?.data?.message || "Invalid email or password";

      if (
        status === 403 ||
        message.toLowerCase().includes("forbidden") ||
        message.toLowerCase().includes("not allowed")
      ) {
        navigate("/no-access");
      } else {
        toast.error(message, { duration: 3000 }); // Sonner toast
      }
    }
  };

  // Navigate when auth is updated after successful login
  useEffect(() => {
    if (loginSuccess && auth?.token) {
      navigate("/", { replace: true });
      setLoginSuccess(false);
    }
  }, [auth, loginSuccess, navigate]);

  return (
    <div className="main-wrapper">
      <div className="account-content">
        <div className="login-wrapper bg-img">
          <div className="login-content authent-content">
            <form onSubmit={handleSubmit}>
              <div className="login-userset">
                <div className="login-logo logo-normal">
                  <img
                    src={logo}
                    alt="Logo"
                    style={{ width: "100px", height: "auto" }}
                  />
                </div>
                <div className="login-userheading">
                  <h3>Sign In</h3>
                  <h4 className="fs-16">
                    Access the Rocklime panel using your email and passcode.
                  </h4>
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
                      placeholder="Enter your email"
                    />
                    <span className="input-group-text border-start-0">
                      <FaEnvelope />
                    </span>
                  </div>
                </div>
                <div className="mb-3">
                  <label className="form-label">
                    Password <span className="text-danger">*</span>
                  </label>
                  <div className="input-group">
                    <input
                      type={showPassword ? "text" : "password"}
                      className="form-control border-end-0"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      placeholder="Enter your password"
                    />
                    <span
                      className="input-group-text border-start-0 cursor-pointer"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <FaEyeSlash /> : <FaEye />}
                    </span>
                  </div>
                </div>
                <div className="form-login authentication-check">
                  <div className="row">
                    <div className="col-12 d-flex align-items-center justify-content-between">
                      <label className="checkboxs ps-4 mb-0 pb-0 line-height-1 fs-16 text-gray-6">
                        <input
                          type="checkbox"
                          checked={rememberMe}
                          onChange={() => setRememberMe(!rememberMe)}
                        />
                        <span className="checkmarks"></span> Remember me
                      </label>
                      <div className="text-end">
                        <Link
                          to="/forgot-password"
                          className="text-orange fs-16 fw-medium"
                        >
                          Forgot Password?
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="form-login">
                  <button
                    type="submit"
                    className="btn btn-primary w-100 d-flex align-items-center justify-content-center"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <span
                          className="spinner-border spinner-border-sm me-2"
                          role="status"
                          aria-hidden="true"
                        ></span>
                        Signing In...
                      </>
                    ) : (
                      "Sign In"
                    )}
                  </button>
                </div>
                <div className="signinform text-center">
                  <h4>
                    New on our platform?
                    <Link to="/signup" className="hover-a text-orange">
                      {" "}
                      Create an account
                    </Link>
                  </h4>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
