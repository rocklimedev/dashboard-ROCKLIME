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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const addressData = {
      ...formData,
      addressId: isEdit ? existingAddress.addressId : uuidv4(),
      createdAt: isEdit ? existingAddress.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      if (isEdit) {
        await updateAddress(addressData).unwrap();
        toast.success("Address updated successfully!"); // Sonner toast
      } else {
        await createAddress(addressData).unwrap();
        toast.success("Address created successfully!"); // Sonner toast
      }
      onClose();
    } catch (err) {
      toast.error(
        `Failed to save address: ${err?.data?.message || "Unknown error"}`
      ); // Sonner toast
    }
  };
  return (
    <div
      className="modal fade show d-block"
      tabIndex="-1"
      style={{ background: "rgba(0,0,0,0.5)" }}
    >
      <div className="modal-dialog modal-lg">
        <form onSubmit={handleSubmit}>
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">
                {isEdit ? "Edit Address" : "Add New Address"}
              </h5>
              <button
                type="button"
                className="btn-close"
                onClick={onClose}
              ></button>
            </div>
            <div className="modal-body row g-3">
              <div className="col-md-6">
                <label className="form-label">Street</label>
                <input
                  type="text"
                  className="form-control"
                  name="street"
                  value={formData.street}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="col-md-6">
                <label className="form-label">City</label>
                <input
                  type="text"
                  className="form-control"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="col-md-6">
                <label className="form-label">State</label>
                <input
                  type="text"
                  className="form-control"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="col-md-6">
                <label className="form-label">Postal Code</label>
                <input
                  type="text"
                  className="form-control"
                  name="postalCode"
                  value={formData.postalCode}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="col-md-6">
                <label className="form-label">Country</label>
                <input
                  type="text"
                  className="form-control"
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="col-md-6">
                <label className="form-label">User</label>
                {isUsersLoading ? (
                  <div>Loading users...</div>
                ) : usersError ? (
                  <div className="text-danger">Error loading users</div>
                ) : (
                  <select
                    className="form-select"
                    name="userId"
                    value={formData.userId}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select a user</option>
                    {users.users?.map((user) => (
                      <option key={user.userId} value={user.userId}>
                        {user.name || user.email || user.userId}{" "}
                        {/* Adjust based on user data */}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onClose}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isCreating || isUpdating || isUsersLoading}
              >
                {isEdit ? "Update" : "Create"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddAddress;
