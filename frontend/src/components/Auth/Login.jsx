import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLoginMutation } from "../../api/authApi";
const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [login, { isLoading, error }] = useLoginMutation();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await login({ email, password }).unwrap();
      localStorage.setItem("token", response.token);
      navigate("/dashboard");
    } catch (err) {
      console.error("Login failed:", err);
    }
  };

  return (
    <div className="main-wrapper login-body">
      <div className="login-wrapper">
        <div className="container">
          <img
            className="img-fluid logo-dark mb-2 logo-color"
            src="assets/img/logo2.png"
            alt="Logo"
          />
          <img
            className="img-fluid logo-light mb-2"
            src="assets/img/logo2-white.png"
            alt="Logo"
          />
          <div className="loginbox">
            <div className="login-right">
              <div className="login-right-wrap">
                <h1>Login</h1>
                <p className="account-subtitle">Access to our dashboard</p>
                <form onSubmit={handleSubmit}>
                  <div className="input-block mb-3">
                    <label className="form-control-label">Email Address</label>
                    <input
                      type="email"
                      className="form-control"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="input-block mb-3">
                    <label className="form-control-label">Password</label>
                    <div className="pass-group">
                      <input
                        type="password"
                        className="form-control pass-input"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  {error && <p className="text-danger">{error.data?.message || "Login failed"}</p>}
                  <button className="btn btn-lg btn-primary w-100" type="submit" disabled={isLoading}>
                    {isLoading ? "Logging in..." : "Login"}
                  </button>
                  <div className="login-or">
                    <span className="or-line"></span>
                    <span className="span-or">or</span>
                  </div>
                  <div className="text-center dont-have">
                    Don't have an account yet? <a href="/signup">Signup</a>
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

export default Login;
