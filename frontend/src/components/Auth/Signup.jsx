import React, { useState } from "react";
import { useRegisterMutation } from "../../api/authApi";

const Signup = () => {
  const [register, { data: auth, isLoading, error }] = useRegisterMutation();
  const [formData, setFormData] = useState({
    username: "",
    name: "",
    email: "",
    password: "",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await register(formData).unwrap();
      alert("Registration successful!");
    } catch (err) {
      console.error("Registration failed:", err);
    }
  };

  return (
    <div className="main-wrapper login-body">
      <div className="login-wrapper">
        <div className="container">
          <img className="img-fluid logo-dark mb-2" src="assets/img/logo2.png" alt="Logo" />
          <img className="img-fluid logo-light mb-2" src="assets/img/logo2-white.png" alt="Logo" />

          <div className="loginbox">
            <div className="login-right">
              <div className="login-right-wrap">
                <h1>Sign Up</h1>
                <p className="account-subtitle">Access to our dashboard</p>

                <form onSubmit={handleSubmit}>
                  <div className="input-block mb-3">
                    <label className="form-control-label">Username</label>
                    <input className="form-control" type="text" name="username" value={formData.username} onChange={handleChange} required />
                  </div>
                  <div className="input-block mb-3">
                    <label className="form-control-label">Name</label>
                    <input className="form-control" type="text" name="name" value={formData.name} onChange={handleChange} required />
                  </div>
                  <div className="input-block mb-3">
                    <label className="form-control-label">Email Address</label>
                    <input className="form-control" type="email" name="email" value={formData.email} onChange={handleChange} required />
                  </div>
                 
                  <div className="input-block mb-3">
                    <label className="form-control-label">Password</label>
                    <input className="form-control" type="password" name="password" value={formData.password} onChange={handleChange} required />
                  </div>

                  <div className="input-block mb-0">
                    <button className="btn btn-lg btn-primary w-100" type="submit" disabled={isLoading}>
                      {isLoading ? "Registering..." : "Register"}
                    </button>
                  </div>
                </form>

                {error && <p style={{ color: "red" }}>Error: {error.data?.message || "Something went wrong"}</p>}

                <div className="login-or">
                  <span className="or-line"></span>
                  <span className="span-or">or</span>
                </div>

                <div className="text-center dont-have">
                  Already have an account? <a href="/login">Login</a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
