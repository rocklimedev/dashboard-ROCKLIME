import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useRegisterMutation } from "../../api/authApi";
import { toast } from "sonner"; // Changed import

const Signup = () => {
  const [formData, setFormData] = useState({
    username: "",
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    agreeTerms: false,
  });

  const [register, { isLoading, error }] = useRegisterMutation();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match!"); // Sonner toast
      return;
    }

    if (!formData.agreeTerms) {
      toast.error("You must agree to the terms and conditions!"); // Sonner toast
      return;
    }

    try {
      await register(formData).unwrap();
      toast.success("Registration successful!", { duration: 2000 }); // Sonner toast
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      toast.error(err?.data?.message || "Something went wrong. Try again."); // Sonner toast
    }
  };
  return (
    <div className="main-wrapper">
      <div className="account-content">
        <div className="login-wrapper bg-img">
          <div className="login-content authent-content">
            <form onSubmit={handleSubmit}>
              <div className="login-userset">
                <div className="login-userheading">
                  <h3>Register</h3>
                  <h4>Create New Account</h4>
                </div>
                <div className="mb-3">
                  <label className="form-label">
                    Name <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">
                    Username <span className="text-danger">*</span>
                  </label>
                  <input
                    type="username"
                    className="form-control"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">
                    Email <span className="text-danger">*</span>
                  </label>
                  <input
                    type="email"
                    className="form-control"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">
                    Password <span className="text-danger">*</span>
                  </label>
                  <input
                    type="password"
                    className="form-control"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">
                    Confirm Password <span className="text-danger">*</span>
                  </label>
                  <input
                    type="password"
                    className="form-control"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-login authentication-check">
                  <label className="checkboxs ps-4 mb-0 pb-0 line-height-1">
                    <input
                      type="checkbox"
                      name="agreeTerms"
                      checked={formData.agreeTerms}
                      onChange={handleChange}
                    />
                    <span className="checkmarks"></span>I agree to the{" "}
                    <a href="#" className="text-primary">
                      Terms & Privacy
                    </a>
                  </label>
                </div>
                <div className="form-login">
                  <button
                    type="submit"
                    className="btn btn-primary w-100"
                    disabled={isLoading}
                  >
                    {isLoading ? "Registering..." : "Sign Up"}
                  </button>
                </div>
                {error && (
                  <p className="text-danger">
                    {error.data?.message || "Registration failed!"}
                  </p>
                )}
                <div className="signinform">
                  <h4>
                    Already have an account?{" "}
                    <a href="/login" className="hover-a">
                      Sign In Instead
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

export default Signup;
