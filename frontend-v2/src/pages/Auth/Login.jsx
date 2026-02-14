// src/pages/auth/Login.jsx
import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useLoginMutation } from "../../api/authApi";
import { useAuth } from "../../context/AuthContext";
import logo from "../../assets/img/logo.png";
import {
  MailOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
} from "@ant-design/icons";
import { message } from "antd";
const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loginMutation] = useLoginMutation();
  const { login: authLogin, auth } = useAuth();
  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    if (auth?.token) {
      navigate("/", { replace: true });
    }
  }, [auth?.token, navigate]);

  // Early return to avoid flash
  if (auth?.token) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await loginMutation({ email, password }).unwrap();
      const token = response.accessToken;
      if (!token) throw new Error("No access token received");

      // Store token
      if (rememberMe) {
        localStorage.setItem("token", token);
        sessionStorage.removeItem("token");
      } else {
        sessionStorage.setItem("token", token);
        localStorage.removeItem("token");
      }

      await authLogin(token, response.user || null);
      navigate("/", { replace: true });
    } catch (err) {
      // Server unreachable / down / network error
      const isServerDown =
        !err ||
        err.status === "FETCH_ERROR" ||
        err.status === "PARSING_ERROR" ||
        err.originalStatus === 0 ||
        err?.error === "TypeError: Failed to fetch" ||
        !err?.data;

      if (isServerDown) {
        message.error("Server is down. Please try again later.");
        return;
      }

      // Backend returned proper error
      message.error(
        "Login failed! " +
          (err?.data?.message || err.message || "Something went wrong"),
      );
    }
  };

  return (
    <div className="account-content">
      <div className="login-wrapper bg-img">
        <div className="login-content authent-content">
          <form onSubmit={handleSubmit}>
            <div className="login-userset">
              <div className="login-logo logo-normal">
                <img
                  src={logo}
                  alt="Logo"
                  style={{ width: "177px", height: "auto" }}
                />
              </div>

              <div className="login-userheading">
                <h3>Sign In</h3>
                <h4 className="fs-16">
                  Access the panel using your email and passcode.
                </h4>
              </div>

              {/* Email Field */}
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
                    <MailOutlined />
                  </span>
                </div>
              </div>

              {/* Password Field */}
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
                    onKeyDown={(e) =>
                      e.key === "Enter" && setShowPassword(!showPassword)
                    }
                    tabIndex={0}
                    role="button"
                  >
                    {showPassword ? <EyeInvisibleOutlined /> : <EyeOutlined />}
                  </span>
                </div>
              </div>

              {/* Remember Me + Forgot Password */}
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
                    <div className="d-flex flex-column align-items-end">
                      <Link
                        to="/forgot-password"
                        className="text-orange fs-16 fw-medium mb-1"
                      >
                        Forgot Password?
                      </Link>
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="form-login">
                <button
                  type="submit"
                  className="btn btn-primary w-100 d-flex align-items-center justify-content-center"
                  style={{ minHeight: "44px" }}
                  disabled={false} // Let global loader handle it
                >
                  Sign In
                </button>
              </div>

              {/* Sign Up Link */}
              <div className="signinform text-center">
                <h4>
                  New on our platform?{" "}
                  <Link to="/signup" className="hover-a">
                    Create an account
                  </Link>
                </h4>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
