import React, { useState, useEffect } from "react";
import { Form, Button } from "react-bootstrap";
import { toast } from "sonner";
import Flatpickr from "react-flatpickr";
import "flatpickr/dist/flatpickr.min.css";
import {
  useCreateUserMutation,
  useUpdateUserMutation,
  useAssignRoleMutation,
  useGetUserByIdQuery,
} from "../../api/userApi";
import { useGetRolesQuery } from "../../api/rolesApi";
import {
  useCreateAddressMutation,
  useUpdateAddressMutation,
} from "../../api/addressApi";
import { useParams } from "react-router-dom";

const NewAddUser = ({ userToEdit: propUserToEdit, onClose }) => {
  const { userId } = useParams();
  const {
    data: fetchedUser,
    isLoading: isFetchingUser,
    error: fetchUserError,
  } = useGetUserByIdQuery(userId, { skip: !userId || !!propUserToEdit });

  // Adjust based on actual API response structure

  const userToEdit = propUserToEdit || fetchedUser?.data || fetchedUser?.user;

  const [createUser, { isLoading: isCreating, error: createError }] =
    useCreateUserMutation();
  const [updateUser, { isLoading: isUpdating, error: updateError }] =
    useUpdateUserMutation();
  const [assignRole] = useAssignRoleMutation();
  const [
    createAddress,
    { isLoading: isAddressCreating, error: addressCreateError },
  ] = useCreateAddressMutation();
  const [
    updateAddress,
    { isLoading: isAddressUpdating, error: addressUpdateError },
  ] = useUpdateAddressMutation();
  const {
    data: roles,
    isLoading: isRolesLoading,
    error: rolesError,
  } = useGetRolesQuery();

  const [isEditMode, setIsEditMode] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    name: "",
    email: "",
    mobileNumber: "",
    dateOfBirth: "",
    shiftFrom: "",
    shiftTo: "",
    bloodGroup: "",
    street: "",
    country: "",
    state: "",
    city: "",
    postalCode: "",
    emergencyNumber: "",
    roleId: "", // Changed from role to roleId to match backend
    status: "inactive",
    password: "",
    avatar: null,
    about: "",
    addressId: null,
  });

  useEffect(() => {
    if (userToEdit) {
      setFormData({
        username: userToEdit.username || "",
        name: userToEdit.name || "",
        email: userToEdit.email || "",
        mobileNumber: userToEdit.mobileNumber || "",
        dateOfBirth: userToEdit.dateOfBirth
          ? new Date(userToEdit.dateOfBirth).toISOString().split("T")[0]
          : "",
        shiftFrom: userToEdit.shiftFrom
          ? new Date(`1970-01-01T${userToEdit.shiftFrom}`).toLocaleTimeString(
              "en-US",
              {
                hour12: false,
              }
            )
          : "",
        shiftTo: userToEdit.shiftTo
          ? new Date(`1970-01-01T${userToEdit.shiftTo}`).toLocaleTimeString(
              "en-US",
              {
                hour12: false,
              }
            )
          : "",
        bloodGroup: userToEdit.bloodGroup || "",
        street: userToEdit.address?.street || "",
        country: userToEdit.address?.country || "",
        state: userToEdit.address?.state || "",
        city: userToEdit.address?.city || "",
        postalCode: userToEdit.address?.postalCode || "",
        emergencyNumber: userToEdit.emergencyNumber || "",
        roleId: userToEdit.roleId || "", // Use roleId from backend
        status: ["active", "inactive", "restricted"].includes(userToEdit.status)
          ? userToEdit.status
          : "inactive",
        password: "",
        avatar: userToEdit.avatar || null,
        about: userToEdit.about || "",
        addressId: userToEdit.addressId || null,
      });
      setIsEditMode(true);
    } else {
      setIsEditMode(false);
    }
  }, [userToEdit]);

  useEffect(() => {
    if (createError)
      toast.error(createError?.data?.message || "Failed to create user");
    if (updateError)
      toast.error(updateError?.data?.message || "Failed to update user");
    if (rolesError)
      toast.error(rolesError?.data?.message || "Failed to load roles");
    if (addressCreateError)
      toast.error(
        addressCreateError?.data?.message || "Failed to create address"
      );
    if (addressUpdateError)
      toast.error(
        addressUpdateError?.data?.message || "Failed to update address"
      );
    if (fetchUserError)
      toast.error(fetchUserError?.data?.message || "Failed to fetch user data");
  }, [
    createError,
    updateError,
    rolesError,
    addressCreateError,
    addressUpdateError,
    fetchUserError,
  ]);

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]:
        type === "checkbox" ? checked : type === "file" ? files[0] : value,
    }));
  };

  const handleDateChange = (name, selectedDates) => {
    const date = selectedDates[0]
      ? selectedDates[0].toISOString().split("T")[0]
      : "";
    setFormData((prevData) => ({ ...prevData, [name]: date }));
  };

  const handleTimeChange = (name, selectedDates) => {
    const time = selectedDates[0]
      ? selectedDates[0].toLocaleTimeString("en-US", { hour12: false })
      : "";
    setFormData((prevData) => ({ ...prevData, [name]: time }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const requiredFields = ["username", "email", "name", "roleId"];
      if (!isEditMode) requiredFields.push("password");
      for (const field of requiredFields) {
        if (!formData[field]) {
          toast.error(
            `${field.charAt(0).toUpperCase() + field.slice(1)} is required`
          );
          return;
        }
      }

      if (formData.shiftFrom && formData.shiftTo) {
        const from = new Date(`1970-01-01T${formData.shiftFrom}`);
        const to = new Date(`1970-01-01T${formData.shiftTo}`);
        if (to <= from) {
          toast.error("Shift To must be after Shift From");
          return;
        }
      }

      const selectedRoleObj = roles?.find((r) => r.roleId === formData.roleId);
      if (!selectedRoleObj) {
        toast.error("Selected role is invalid");
        return;
      }

      let addressId = formData.addressId;
      if (
        formData.street ||
        formData.country ||
        formData.state ||
        formData.city ||
        formData.postalCode
      ) {
        const addressPayload = {
          street: formData.street,
          country: formData.country,
          state: formData.state,
          city: formData.city,
          postalCode: formData.postalCode,
          userId: userToEdit?.userId || null,
        };

        let addressResponse;
        if (isEditMode && addressId) {
          // Update existing address
          addressResponse = await updateAddress({
            addressId,
            ...addressPayload,
          }).unwrap();
        } else {
          // Create new address
          addressResponse = await createAddress(addressPayload).unwrap();
        }
        addressId = addressResponse.addressId; // Backend returns addressId
      }

      let avatarUrl = formData.avatar;
      if (formData.avatar instanceof File) {
        const formDataUpload = new FormData();
        formDataUpload.append("file", formData.avatar);
        const uploadResponse = await fetch("/api/upload", {
          method: "POST",
          body: formDataUpload,
        });
        const uploadData = await uploadResponse.json();
        if (!uploadData.success) {
          toast.error("Failed to upload avatar");
          return;
        }
        avatarUrl = uploadData.data.url;
      }

      const userPayload = {
        username: formData.username,
        name: formData.name,
        email: formData.email,
        mobileNumber: formData.mobileNumber || null,
        dateOfBirth: formData.dateOfBirth || null,
        shiftFrom: formData.shiftFrom || null,
        shiftTo: formData.shiftTo || null,
        bloodGroup: formData.bloodGroup || null,
        addressId: addressId || null,
        emergencyNumber: formData.emergencyNumber || null,
        roleId: selectedRoleObj.roleId, // Use roleId instead of roles array
        status: formData.status,
        password: formData.password || undefined,
        avatar: avatarUrl || null,
        about: formData.about || null,
      };

      let userResponse;
      if (isEditMode) {
        userResponse = await updateUser({
          userId: userToEdit.userId,
          ...userPayload,
        }).unwrap();
        toast.success("User updated successfully!");
      } else {
        userResponse = await createUser(userPayload).unwrap();
        toast.success("User added successfully!");
      }

      // Role assignment is handled by updateUser/createUser in the backend, so no need for separate assignRole call
      onClose();
    } catch (err) {
      toast.error(
        `Failed to process the request: ${err.data?.message || "Unknown error"}`
      );
    }
  };

  const handleRefresh = () => {
    setFormData({
      username: "",
      name: "",
      email: "",
      mobileNumber: "",
      dateOfBirth: "",
      shiftFrom: "",
      shiftTo: "",
      bloodGroup: "",
      street: "",
      country: "",
      state: "",
      city: "",
      postalCode: "",
      emergencyNumber: "",
      roleId: "",
      status: "inactive",
      password: "",
      avatar: null,
      about: "",
      addressId: null,
    });
    setIsEditMode(false);
    toast.info("Form reset");
  };

  const handleCollapse = () => {
    setIsCollapsed((prev) => !prev);
  };

  if (isFetchingUser || isRolesLoading) {
    return (
      <div className="page-wrapper">
        <div className="content text-center">
          <p>Loading {isFetchingUser ? "user data" : "roles"}...</p>
        </div>
      </div>
    );
  }

  if (fetchUserError && userId) {
    return (
      <div className="page-wrapper">
        <div className="content text-center">
          <p className="text-danger">Error loading user data.</p>
          <Button variant="secondary" onClick={onClose}>
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      <div className="content">
        <div className="page-header">
          <div className="add-item d-flex">
            <div className="page-title">
              <h4>{isEditMode ? "Edit User" : "Add User"}</h4>
              <h6>Create new Employee</h6>
            </div>
          </div>
          <ul className="table-top-head">
            <li className="me-2">
              <a
                href="#"
                onClick={handleRefresh}
                data-bs-toggle="tooltip"
                title="Refresh"
              >
                <i className="ti ti-refresh"></i>
              </a>
            </li>
            <li className="me-2">
              <a
                href="#"
                onClick={handleCollapse}
                data-bs-toggle="tooltip"
                title={isCollapsed ? "Expand" : "Collapse"}
                id="collapse-header"
              >
                <i
                  className={
                    isCollapsed ? "ti ti-chevron-down" : "ti ti-chevron-up"
                  }
                ></i>
              </a>
            </li>
          </ul>
          <div className="page-btn">
            <a href="/users/list" className="btn btn-secondary">
              <i data-feather="arrow-left" className="me-2"></i>Back to List
            </a>
          </div>
        </div>

        <Form
          onSubmit={handleSubmit}
          style={{ display: isCollapsed ? "none" : "block" }}
        >
          <div className="accordions-items-seperate" id="accordionExample">
            {/* Employee Information */}
            <div className="accordion-item border mb-4">
              <h2 className="accordion-header" id="headingOne">
                <div
                  className="accordion-button bg-white"
                  data-bs-toggle="collapse"
                  data-bs-target="#collapseOne"
                  aria-controls="collapseOne"
                >
                  <h5 className="d-inline-flex align-items-center">
                    <i className="ti ti-users text-primary me-2"></i>
                    <span>Employee Information</span>
                  </h5>
                </div>
              </h2>
              <div
                id="collapseOne"
                className="accordion-collapse collapse show"
                aria-labelledby="headingOne"
                data-bs-parent="#accordionExample"
              >
                <div className="accordion-body border-top">
                  <div className="new-employee-field">
                    <div className="row">
                      <div className="col-lg-4 col-md-6">
                        <div className="mb-3">
                          <label className="form-label">
                            Username<span className="text-danger ms-1">*</span>
                          </label>
                          <input
                            type="text"
                            className="form-control"
                            name="username"
                            value={formData.username}
                            onChange={handleChange}
                            required
                          />
                        </div>
                      </div>
                      <div className="col-lg-4 col-md-6">
                        <div className="mb-3">
                          <label className="form-label">
                            Full Name<span className="text-danger ms-1">*</span>
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
                      </div>
                      <div className="col-lg-4 col-md-6">
                        <div className="mb-3">
                          <label className="form-label">
                            Email<span className="text-danger ms-1">*</span>
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
                      </div>
                      <div className="col-lg-4 col-md-6">
                        <div className="mb-3">
                          <label className="form-label">Mobile Number</label>
                          <input
                            type="text"
                            className="form-control"
                            name="mobileNumber"
                            value={formData.mobileNumber}
                            onChange={handleChange}
                          />
                        </div>
                      </div>
                      <div className="col-lg-4 col-md-6">
                        <div className="mb-3">
                          <label className="form-label">Date of Birth</label>
                          <Flatpickr
                            value={
                              formData.dateOfBirth
                                ? new Date(formData.dateOfBirth)
                                : ""
                            }
                            onChange={(dates) =>
                              handleDateChange("dateOfBirth", dates)
                            }
                            options={{ dateFormat: "Y-m-d" }}
                            className="form-control datetimepicker"
                            placeholder="Select Date"
                          />
                        </div>
                      </div>
                      <div className="col-lg-4 col-md-6">
                        <div className="mb-3">
                          <label className="form-label">Shift From</label>
                          <Flatpickr
                            value={
                              formData.shiftFrom
                                ? new Date(`1970-01-01T${formData.shiftFrom}`)
                                : ""
                            }
                            onChange={(dates) =>
                              handleTimeChange("shiftFrom", dates)
                            }
                            options={{
                              enableTime: true,
                              noCalendar: true,
                              dateFormat: "H:i",
                              time_24hr: true,
                            }}
                            className="form-control datetimepicker"
                            placeholder="Select Time"
                          />
                        </div>
                      </div>
                      <div className="col-lg-4 col-md-6">
                        <div className="mb-3">
                          <label className="form-label">Shift To</label>
                          <Flatpickr
                            value={
                              formData.shiftTo
                                ? new Date(`1970-01-01T${formData.shiftTo}`)
                                : ""
                            }
                            onChange={(dates) =>
                              handleTimeChange("shiftTo", dates)
                            }
                            options={{
                              enableTime: true,
                              noCalendar: true,
                              dateFormat: "H:i",
                              time_24hr: true,
                            }}
                            className="form-control datetimepicker"
                            placeholder="Select Time"
                          />
                        </div>
                      </div>
                      <div className="col-lg-4 col-md-6">
                        <div className="mb-3">
                          <label className="form-label">Blood Group</label>
                          <Form.Select
                            name="bloodGroup"
                            value={formData.bloodGroup}
                            onChange={handleChange}
                          >
                            <option value="">Select</option>
                            {[
                              "A+",
                              "A-",
                              "B+",
                              "B-",
                              "AB+",
                              "AB-",
                              "O+",
                              "O-",
                            ].map((bg) => (
                              <option key={bg} value={bg}>
                                {bg}
                              </option>
                            ))}
                          </Form.Select>
                        </div>
                      </div>
                      <div className="col-lg-4 col-md-6">
                        <div className="mb-3">
                          <label className="form-label">
                            Role<span className="text-danger ms-1">*</span>
                          </label>
                          <Form.Select
                            name="roleId"
                            value={formData.roleId}
                            onChange={handleChange}
                            disabled={isRolesLoading}
                            required
                          >
                            <option value="">Select</option>
                            {roles?.map((role) => (
                              <option key={role.roleId} value={role.roleId}>
                                {role.roleName}
                              </option>
                            ))}
                          </Form.Select>
                        </div>
                      </div>
                      <div className="col-lg-4 col-md-6">
                        <div className="mb-3">
                          <label className="form-label">
                            Status<span className="text-danger ms-1">*</span>
                          </label>
                          <Form.Select
                            name="status"
                            value={formData.status}
                            onChange={handleChange}
                            required
                          >
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                            <option value="restricted">Restricted</option>
                          </Form.Select>
                        </div>
                      </div>
                      <div className="col-lg-4 col-md-6">
                        <div className="mb-3">
                          <label className="form-label">
                            Emergency Contact Number
                          </label>
                          <input
                            type="text"
                            className="form-control"
                            name="emergencyNumber"
                            value={formData.emergencyNumber}
                            onChange={handleChange}
                          />
                        </div>
                      </div>
                      <div className="col-lg-4 col-md-6">
                        <div className="mb-3">
                          <label className="form-label">
                            Password
                            {!isEditMode && (
                              <span className="text-danger ms-1">*</span>
                            )}
                          </label>
                          <input
                            type="password"
                            className="form-control"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            required={!isEditMode}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Address Information */}
            <div className="accordion-item border mb-4">
              <h2 className="accordion-header" id="headingThree">
                <div
                  className="accordion-button bg-white"
                  data-bs-toggle="collapse"
                  data-bs-target="#collapseThree"
                  aria-controls="collapseThree"
                >
                  <h5 className="d-inline-flex align-items-center">
                    <i data-feather="map-pin" className="text-primary me-2"></i>
                    <span>Address Information</span>
                  </h5>
                </div>
              </h2>
              <div
                id="collapseThree"
                className="accordion-collapse collapse show"
                aria-labelledby="headingThree"
                data-bs-parent="#accordionExample"
              >
                <div className="accordion-body border-top">
                  <div className="row">
                    <div className="col-lg-4 col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Street</label>
                        <input
                          type="text"
                          className="form-control"
                          name="street"
                          value={formData.street}
                          onChange={handleChange}
                        />
                      </div>
                    </div>
                    <div className="col-lg-4 col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Country</label>
                        <Form.Select
                          name="country"
                          value={formData.country}
                          onChange={handleChange}
                        >
                          <option value="">Select</option>
                          <option value="United Kingdom">United Kingdom</option>
                          <option value="USA">USA</option>
                          <option value="India">India</option>
                        </Form.Select>
                      </div>
                    </div>
                    <div className="col-lg-4 col-md-6">
                      <div className="mb-3">
                        <label className="form-label">State</label>
                        <Form.Select
                          name="state"
                          value={formData.state}
                          onChange={handleChange}
                        >
                          <option value="">Select</option>
                          <option value="California">California</option>
                          <option value="Texas">Texas</option>
                        </Form.Select>
                      </div>
                    </div>
                    <div className="col-lg-4 col-md-6">
                      <div className="mb-3">
                        <label className="form-label">City</label>
                        <Form.Select
                          name="city"
                          value={formData.city}
                          onChange={handleChange}
                        >
                          <option value="">Select</option>
                          <option value="Los Angeles">Los Angeles</option>
                          <option value="New York">New York</option>
                        </Form.Select>
                      </div>
                    </div>
                    <div className="col-lg-4 col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Postal Code</label>
                        <input
                          type="text"
                          className="form-control"
                          name="postalCode"
                          value={formData.postalCode}
                          onChange={handleChange}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="text-end mb-3">
            <Button
              variant="secondary"
              className="me-2"
              onClick={onClose}
              disabled={
                isCreating ||
                isUpdating ||
                isAddressCreating ||
                isAddressUpdating
              }
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={
                isCreating ||
                isUpdating ||
                isAddressCreating ||
                isAddressUpdating ||
                isRolesLoading
              }
            >
              {isCreating ||
              isUpdating ||
              isAddressCreating ||
              isAddressUpdating
                ? "Saving..."
                : isEditMode
                ? "Update Employee"
                : "Add Employee"}
            </Button>
          </div>
        </Form>
      </div>
    </div>
  );
};

export default NewAddUser;
