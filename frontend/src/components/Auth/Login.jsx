import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLoginMutation } from "../../api/authApi";
import { ToastContainer, toast } from "react-toastify";
import { useAuth } from "../../context/AuthContext"; // ✅ use your context
import "react-toastify/dist/ReactToastify.css";
import logo from "../../assets/img/logo.png";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loginMutation, { isLoading }] = useLoginMutation();
  const { login: authLogin } = useAuth(); // ✅ renamed to avoid conflict
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await loginMutation({ email, password }).unwrap();
      const token = response.accessToken;

      if (!token) throw new Error("No access token received");

      // ✅ Store token in context
      authLogin(token, null); // Pass token + user if available

      // ✅ Optional: Save token manually depending on rememberMe
      if (rememberMe) {
        localStorage.setItem("token", token);
      } else {
        sessionStorage.setItem("token", token);
      }

      toast.success("Login successful!", { autoClose: 1000 });
      navigate("/", { replace: true });
    } catch (err) {
      console.error("Login failed:", err);
      const status = err?.status;
      const message = err?.data?.message || "Invalid email or password";

      if (
        status === 403 ||
        message.toLowerCase().includes("forbidden") ||
        message.toLowerCase().includes("not allowed")
      ) {
        navigate("/no-access");
      } else {
        toast.error(message);
      }
    }
  };

  return (
    <div className="main-wrapper">
      <ToastContainer />
      <div className="account-content">
        <div className="login-wrapper bg-img">
          <div className="login-content authent-content">
            <form onSubmit={handleSubmit}>
              <div className="login-userset">
                <div className="login-logo logo-normal">
                  <img src={logo} alt="Logo" />
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
                    />
                    <span className="input-group-text border-start-0">
                      <i className="ti ti-mail"></i>
                    </span>
                  </div>
                </div>
                <div className="mb-3">
                  <label className="form-label">
                    Password <span className="text-danger">*</span>
                  </label>
                  <div className="pass-group input-group">
                    <input
                      type={showPassword ? "text" : "password"}
                      className="form-control"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <span
                      className="input-group-text cursor-pointer"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      <i
                        className={`ti ${
                          showPassword ? "ti-eye" : "ti-eye-off"
                        }`}
                      ></i>
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
                        <a
                          className="text-orange fs-16 fw-medium"
                          href="/forgot-password"
                        >
                          Forgot Password?
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="form-login">
                  <button
                    type="submit"
                    className="btn btn-primary w-100"
                    disabled={isLoading}
                  >
                    {isLoading ? "Signing In..." : "Sign In"}
                  </button>
                </div>
                <div className="signinform">
                  <h4>
                    New on our platform?
                    <a href="/signup" className="hover-a">
                      {" "}
                      Create an account
                    </a>
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
