import React, { useEffect, useState } from "react";
import {
  useCreateAddressMutation,
  useUpdateAddressMutation,
} from "../../api/addressApi";
import { v4 as uuidv4 } from "uuid";
import { useGetAllUsersQuery } from "../../api/userApi";
import { toast } from "sonner";

const AddAddress = ({ onClose, existingAddress }) => {
  const isEdit = !!existingAddress;

  const [formData, setFormData] = useState({
    street: "",
    city: "",
    state: "",
    postalCode: "",
    country: "",
    userId: "",
  });

  const [errors, setErrors] = useState({});

  const [createAddress, { isLoading: isCreating }] = useCreateAddressMutation();
  const [updateAddress, { isLoading: isUpdating }] = useUpdateAddressMutation();
  const {
    data: users,
    isLoading: isUsersLoading,
    error: usersError,
  } = useGetAllUsersQuery();

  useEffect(() => {
    if (existingAddress) {
      setFormData({
        street: existingAddress.street || "",
        city: existingAddress.city || "",
        state: existingAddress.state || "",
        postalCode: existingAddress.postalCode || "",
        country: existingAddress.country || "",
        userId: existingAddress.userId || "",
      });
    }
  }, [existingAddress]);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.street.trim()) newErrors.street = "Street is required";
    if (!formData.city.trim()) newErrors.city = "City is required";
    if (!formData.state.trim()) newErrors.state = "State is required";
    if (!formData.postalCode.trim())
      newErrors.postalCode = "Postal Code is required";
    if (!formData.country.trim()) newErrors.country = "Country is required";
    if (!formData.userId) newErrors.userId = "User is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" })); // Clear error on change
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please fill in all required fields");
      return;
    }

    const updatedData = {
      street: formData.street,
      city: formData.city,
      state: formData.state,
      postalCode: formData.postalCode,
      country: formData.country,
      userId: formData.userId,
      updatedAt: new Date().toISOString(),
    };

    try {
      if (isEdit) {
        await updateAddress({
          addressId: existingAddress.addressId,
          updatedData,
        }).unwrap();
        toast.success("Address updated successfully!");
      } else {
        const addressData = {
          addressId: uuidv4(),
          ...updatedData,
          createdAt: new Date().toISOString(),
        };
        await createAddress(addressData).unwrap();
        toast.success("Address created successfully!");
      }
      onClose();
    } catch (err) {
      console.error("Address save error:", err); // Debug log
      toast.error(
        `Failed to save address: ${
          err?.data?.message || err.message || "Unknown error"
        }`
      );
    }
  };

  return (
    <div
      className="modal fade show d-block"
      tabIndex="-1"
      role="dialog"
      aria-labelledby="addressModalLabel"
      style={{ background: "rgba(0,0,0,0.5)" }}
    >
      <div className="modal-dialog modal-lg">
        <form onSubmit={handleSubmit}>
          <div className="modal-content">
            <div className="modal-header">
              <h5 id="addressModalLabel" className="modal-title">
                {isEdit ? "Edit Address" : "Add New Address"}
              </h5>
              <button
                type="button"
                className="btn-close"
                onClick={onClose}
                aria-label="Close"
              ></button>
            </div>
            <div className="modal-body row g-3">
              <div className="col-md-6">
                <label htmlFor="street" className="form-label">
                  Street
                </label>
                <input
                  type="text"
                  id="street"
                  name="street"
                  value={formData.street}
                  onChange={handleChange}
                  className={`form-control ${
                    errors.street ? "is-invalid" : ""
                  }`}
                  required
                  aria-describedby="streetError"
                />
                {errors.street && (
                  <div id="streetError" className="invalid-feedback">
                    {errors.street}
                  </div>
                )}
              </div>
              <div className="col-md-6">
                <label htmlFor="city" className="form-label">
                  City
                </label>
                <input
                  type="text"
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  className={`form-control ${errors.city ? "is-invalid" : ""}`}
                  required
                  aria-describedby="cityError"
                />
                {errors.city && (
                  <div id="cityError" className="invalid-feedback">
                    {errors.city}
                  </div>
                )}
              </div>
              <div className="col-md-6">
                <label htmlFor="state" className="form-label">
                  State
                </label>
                <input
                  type="text"
                  id="state"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  className={`form-control ${errors.state ? "is-invalid" : ""}`}
                  required
                  aria-describedby="stateError"
                />
                {errors.state && (
                  <div id="stateError" className="invalid-feedback">
                    {errors.state}
                  </div>
                )}
              </div>
              <div className="col-md-6">
                <label htmlFor="postalCode" className="form-label">
                  Postal Code
                </label>
                <input
                  type="text"
                  id="postalCode"
                  name="postalCode"
                  value={formData.postalCode}
                  onChange={handleChange}
                  className={`form-control ${
                    errors.postalCode ? "is-invalid" : ""
                  }`}
                  required
                  aria-describedby="postalCodeError"
                />
                {errors.postalCode && (
                  <div id="postalCodeError" className="invalid-feedback">
                    {errors.postalCode}
                  </div>
                )}
              </div>
              <div className="col-md-6">
                <label htmlFor="country" className="form-label">
                  Country
                </label>
                <input
                  type="text"
                  id="country"
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  className={`form-control ${
                    errors.country ? "is-invalid" : ""
                  }`}
                  required
                  aria-describedby="countryError"
                />
                {errors.country && (
                  <div id="countryError" className="invalid-feedback">
                    {errors.country}
                  </div>
                )}
              </div>
              <div className="col-md-6">
                <label htmlFor="userId" className="form-label">
                  User
                </label>
                {isUsersLoading ? (
                  <div>Loading users...</div>
                ) : usersError ? (
                  <div className="text-danger">
                    Error loading users: {usersError.message}
                  </div>
                ) : (
                  <select
                    id="userId"
                    name="userId"
                    value={formData.userId}
                    onChange={handleChange}
                    className={`form-select ${
                      errors.userId ? "is-invalid" : ""
                    }`}
                    required
                    aria-describedby="userIdError"
                  >
                    <option value="">Select a user</option>
                    {users?.users?.map((user) => (
                      <option key={user.userId} value={user.userId}>
                        {user.name || user.email || user.userId}
                      </option>
                    ))}
                  </select>
                )}
                {errors.userId && (
                  <div id="userIdError" className="invalid-feedback">
                    {errors.userId}
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onClose}
                disabled={isCreating || isUpdating}
                aria-label="Cancel"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isCreating || isUpdating || isUsersLoading}
                aria-label={isEdit ? "Update address" : "Create address"}
              >
                {isCreating || isUpdating
                  ? "Saving..."
                  : isEdit
                  ? "Update"
                  : "Create"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddAddress;
