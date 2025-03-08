import React, { useState } from "react";
import { useCreateUserMutation } from "../../api/userApi";
const AddUser = () => {
  const [createUser, { isLoading, error }] = useCreateUserMutation();
  const [formData, setFormData] = useState({
    name: "",
    username: "",
    email: "",
    phone: "",
    role: "",
    state: "",
    country: "",
    postalCode: "",
    status: true,
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createUser(formData).unwrap();
      alert("user added successfully!");
    } catch (err) {
      console.error("Failed to add user:", err);
    }
  };

  return (
    <div className="modal fade show" style={{ display: "block" }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <div className="page-title">
              <h4>Add user</h4>
            </div>
            <button
              type="button"
              className="close"
              data-bs-dismiss="modal"
              aria-label="Close"
            >
              <span aria-hidden="true">&times;</span>
            </button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <div className="row">
                <div className="col-lg-6 mb-3">
                  <label className="form-label">
                    Name<span className="text-danger ms-1">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    className="form-control"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="col-lg-6 mb-3">
                  <label className="form-label">
                    Username<span className="text-danger ms-1">*</span>
                  </label>
                  <input
                    type="text"
                    name="username"
                    className="form-control"
                    value={formData.username}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="col-lg-12 mb-3">
                  <label className="form-label">
                    Email<span className="text-danger ms-1">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    className="form-control"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="col-lg-12 mb-3">
                  <label className="form-label">
                    Phone<span className="text-danger ms-1">*</span>
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    className="form-control"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="col-lg-6 mb-3">
                  <label className="form-label">
                    Role<span className="text-danger ms-1">*</span>
                  </label>
                  <select
                    name="role"
                    className="form-control"
                    value={formData.role}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select</option>
                    <option value="Admin">Admin</option>
                    <option value="Super Admin">Super Admin</option>
                    <option value="Accounts">Accounts</option>
                    <option value="Sales">Sales</option>
                    <option value="Developer">Developer</option>
                    <option value="Users">Users</option>
                  </select>
                </div>
                <div className="col-lg-6 mb-3">
                  <label className="form-label">
                    State<span className="text-danger ms-1">*</span>
                  </label>
                  <select
                    name="state"
                    className="form-control"
                    value={formData.state}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select</option>
                    <option value="California">California</option>
                    <option value="New York">New York</option>
                    <option value="Texas">Texas</option>
                  </select>
                </div>
                <div className="col-lg-6 mb-3">
                  <label className="form-label">
                    Country<span className="text-danger ms-1">*</span>
                  </label>
                  <select
                    name="country"
                    className="form-control"
                    value={formData.country}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select</option>
                    <option value="United States">United States</option>
                    <option value="Canada">Canada</option>
                    <option value="Germany">Germany</option>
                  </select>
                </div>
                <div className="col-lg-6 mb-3">
                  <label className="form-label">
                    Postal Code<span className="text-danger ms-1">*</span>
                  </label>
                  <input
                    type="text"
                    name="postalCode"
                    className="form-control"
                    value={formData.postalCode}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="col-lg-12">
                  <div className="status-toggle modal-status d-flex justify-content-between align-items-center">
                    <span className="status-label">Status</span>
                    <input
                      type="checkbox"
                      name="status"
                      id="user1"
                      className="check"
                      checked={formData.status}
                      onChange={handleChange}
                    />
                    <label htmlFor="user1" className="checktoggle">
                      {" "}
                    </label>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn me-2 btn-secondary fs-13 fw-medium p-2 px-3 shadow-none"
                data-bs-dismiss="modal"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary fs-13 fw-medium p-2 px-3"
                disabled={isLoading}
              >
                {isLoading ? "Adding..." : "Add user"}
              </button>
            </div>
            {error && (
              <p className="text-danger mt-2">
                {error.data?.message || "Error adding user"}
              </p>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddUser;
