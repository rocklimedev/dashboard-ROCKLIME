import React, { useState, useEffect } from "react";
import {
  Form,
  Button,
  Input,
  Select,
  Checkbox,
  DatePicker,
  TimePicker,
} from "antd";
import { toast } from "sonner";
import moment from "moment";
import {
  useCreateUserMutation,
  useUpdateUserMutation,
  useGetUserByIdQuery,
} from "../../api/userApi";
import { useGetRolesQuery } from "../../api/rolesApi";
import {
  useCreateAddressMutation,
  useUpdateAddressMutation,
} from "../../api/addressApi";
import { useNavigate, useParams } from "react-router-dom";
import {
  LeftOutlined,
  ReloadOutlined,
  InfoCircleOutlined,
  HomeOutlined,
} from "@ant-design/icons";

const { Option } = Select;

const NewAddUser = ({ userToEdit: propUserToEdit }) => {
  const { userId } = useParams();
  const navigate = useNavigate();

  const {
    data: fetchedUser,
    isLoading: isFetchingUser,
    error: fetchUserError,
    refetch, // ← Add this
  } = useGetUserByIdQuery(userId, { skip: !userId || !!propUserToEdit });
  const userToEdit = propUserToEdit || fetchedUser?.data || fetchedUser?.user;

  const [createUser, { isLoading: isCreating, error: createError }] =
    useCreateUserMutation();
  const [updateUser, { isLoading: isUpdating, error: updateError }] =
    useUpdateUserMutation();
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
  const [manageAddress, setManageAddress] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    name: "",
    email: "",
    mobileNumber: "",
    dateOfBirth: "",
    shiftFrom: "",
    shiftTo: "",
    bloodGroup: "",
    emergencyNumber: "",
    roleId: "",
    status: "inactive",
    password: "",
    about: "",
    street: "",
    country: "",
    state: "",
    city: "",
    postalCode: "",
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
              { hour12: false, hour: "2-digit", minute: "2-digit" }
            )
          : "",
        shiftTo: userToEdit.shiftTo
          ? new Date(`1970-01-01T${userToEdit.shiftTo}`).toLocaleTimeString(
              "en-US",
              { hour12: false, hour: "2-digit", minute: "2-digit" }
            )
          : "",
        bloodGroup: userToEdit.bloodGroup || "",
        street: userToEdit.address?.street || "",
        country: userToEdit.address?.country || "",
        state: userToEdit.address?.state || "",
        city: userToEdit.address?.city || "",
        postalCode: userToEdit.address?.postalCode || "",
        emergencyNumber: userToEdit.emergencyNumber || "",
        roleId: userToEdit.roleId || "",
        status: ["active", "inactive", "restricted"].includes(userToEdit.status)
          ? userToEdit.status
          : "inactive",
        password: "",
        about: userToEdit.about || "",
        addressId: userToEdit.addressId || null,
      });
      setIsEditMode(true);
      setManageAddress(!!userToEdit.addressId);
    } else {
      setIsEditMode(false);
      setManageAddress(false);
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

  const handleChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleDateChange = (name, date) => {
    const value = date ? date.format("YYYY-MM-DD") : "";
    handleChange(name, value);
  };

  const handleTimeChange = (name, time) => {
    const value = time ? time.format("HH:mm") : "";
    handleChange(name, value);
  };

  const handleSubmit = async () => {
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

      let addressId = isEditMode ? formData.addressId : null;
      let newUserId = null;

      if (manageAddress) {
        const hasAddressFields =
          formData.street ||
          formData.country ||
          formData.state ||
          formData.city ||
          formData.postalCode;

        if (hasAddressFields) {
          const addressPayload = {
            street: formData.street || null,
            country: formData.country || null,
            state: formData.state || null,
            city: formData.city || null,
            postalCode: formData.postalCode || null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            userId: isEditMode ? userToEdit.userId : null,
          };

          let addressResponse;
          try {
            if (isEditMode && addressId) {
              addressResponse = await updateAddress({
                addressId,
                ...addressPayload,
              }).unwrap();
            } else {
              addressResponse = await createAddress(addressPayload).unwrap();
            }
            addressId =
              addressResponse.addressId || addressResponse.data?.addressId;
            if (!addressId) {
              toast.error("Failed to obtain address ID");
              return;
            }
          } catch (err) {
            toast.error(
              `Address operation failed: ${
                err.data?.message || "Unknown error"
              }`
            );
            return;
          }
        } else if (isEditMode && addressId) {
          toast.warning(
            "Address fields are empty; address will remain unchanged."
          );
        }
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
        roleId: selectedRoleObj.roleId,
        status: formData.status,
        password: formData.password || undefined,
        about: formData.about || null,
      };

      let userResponse;
      try {
        if (isEditMode) {
          userResponse = await updateUser({
            userId: userToEdit.userId,
            ...userPayload,
          }).unwrap();
        } else {
          userResponse = await createUser(userPayload).unwrap();
          newUserId = userResponse.userId || userResponse.data?.userId;
        }
      } catch (err) {
        toast.error(
          `User operation failed: ${err.data?.message || "Unknown error"}`
        );
        return;
      }

      if (!isEditMode && addressId && newUserId) {
        try {
          await updateAddress({
            addressId,
            userId: newUserId,
            street: formData.street || null,
            country: formData.country || null,
            state: formData.state || null,
            city: formData.city || null,
            postalCode: formData.postalCode || null,
            updatedAt: new Date().toISOString(),
          }).unwrap();
        } catch (err) {
          toast.error(
            `Failed to associate address: ${
              err.data?.message || "Unknown error"
            }`
          );
          return;
        }
      }

      toast.success(
        isEditMode ? "User updated successfully!" : "User created successfully!"
      );
      navigate("/users/list");
    } catch (err) {
      toast.error(`Operation failed: ${err.message || "Unknown error"}`);
    }
  };

  const handleRefresh = async () => {
    if (isEditMode) {
      // In Edit Mode: Reload original data from API (or props)
      if (propUserToEdit) {
        // If passed via props (e.g. from list), use that
        setFormData({
          username: propUserToEdit.username || "",
          name: propUserToEdit.name || "",
          email: propUserToEdit.email || "",
          mobileNumber: propUserToEdit.mobileNumber || "",
          dateOfBirth: propUserToEdit.dateOfBirth
            ? new Date(propUserToEdit.dateOfBirth).toISOString().split("T")[0]
            : "",
          shiftFrom: propUserToEdit.shiftFrom
            ? new Date(
                `1970-01-01T${propUserToEdit.shiftFrom}`
              ).toLocaleTimeString("en-US", {
                hour12: false,
                hour: "2-digit",
                minute: "2-digit",
              })
            : "",
          shiftTo: propUserToEdit.shiftTo
            ? new Date(
                `1970-01-01T${propUserToEdit.shiftTo}`
              ).toLocaleTimeString("en-US", {
                hour12: false,
                hour: "2-digit",
                minute: "2-digit",
              })
            : "",
          bloodGroup: propUserToEdit.bloodGroup || "",
          street: propUserToEdit.address?.street || "",
          country: propUserToEdit.address?.country || "",
          state: propUserToEdit.address?.state || "",
          city: propUserToEdit.address?.city || "",
          postalCode: propUserToEdit.address?.postalCode || "",
          emergencyNumber: propUserToEdit.emergencyNumber || "",
          roleId: propUserToEdit.roleId || "",
          status: ["active", "inactive", "restricted"].includes(
            propUserToEdit.status
          )
            ? propUserToEdit.status
            : "inactive",
          password: "",
          about: propUserToEdit.about || "",
          addressId: propUserToEdit.addressId || null,
        });
        setManageAddress(!!propUserToEdit.addressId);
      } else if (userId) {
        // If editing via URL, refetch from API
        try {
          const refetched = await refetch(); // We'll add this below
          const user = refetched.data?.data || refetched.data?.user;
          if (user) {
            setFormData({
              username: user.username || "",
              name: user.name || "",
              email: user.email || "",
              mobileNumber: user.mobileNumber || "",
              dateOfBirth: user.dateOfBirth
                ? new Date(user.dateOfBirth).toISOString().split("T")[0]
                : "",
              shiftFrom: user.shiftFrom
                ? new Date(`1970-01-01T${user.shiftFrom}`).toLocaleTimeString(
                    "en-US",
                    {
                      hour12: false,
                      hour: "2-digit",
                      minute: "2-digit",
                    }
                  )
                : "",
              shiftTo: user.shiftTo
                ? new Date(`1970-01-01T${user.shiftTo}`).toLocaleTimeString(
                    "en-US",
                    {
                      hour12: false,
                      hour: "2-digit",
                      minute: "2-digit",
                    }
                  )
                : "",
              bloodGroup: user.bloodGroup || "",
              street: user.address?.street || "",
              country: user.address?.country || "",
              state: user.address?.state || "",
              city: user.address?.city || "",
              postalCode: user.address?.postalCode || "",
              emergencyNumber: user.emergencyNumber || "",
              roleId: user.roleId || "",
              status: ["active", "inactive", "restricted"].includes(user.status)
                ? user.status
                : "inactive",
              password: "",
              about: user.about || "",
              addressId: user.addressId || null,
            });
            setManageAddress(!!user.addressId);
          }
        } catch (err) {
          toast.error("Failed to reload user data");
        }
      }
    } else {
      // In Add Mode: Reset to empty
      setFormData({
        username: "",
        name: "",
        email: "",
        mobileNumber: "",
        dateOfBirth: "",
        shiftFrom: "",
        shiftTo: "",
        bloodGroup: "",
        emergencyNumber: "",
        roleId: "",
        status: "inactive",
        password: "",
        about: "",
        street: "",
        country: "",
        state: "",
        city: "",
        postalCode: "",
        addressId: null,
      });
      setManageAddress(false);
    }
  };
  const handleClose = () => navigate("/users/list");

  if (isFetchingUser || isRolesLoading) {
    return (
      <div className="page-wrapper">
        <div className="content text-center">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (fetchUserError && userId) {
    return (
      <div className="page-wrapper">
        <div className="content text-center">
          <p className="text-danger">Error loading user data.</p>
          <Button onClick={handleClose}>Go Back</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      <div className="content">
        {/* Header */}
        <div className="page-header">
          <div className="add-item d-flex">
            <div className="page-title">
              <h4>{isEditMode ? "Edit User" : "Add User"}</h4>
              <h6>{isEditMode ? "Update user details" : "Create new user"}</h6>
            </div>
          </div>
          <ul className="table-top-head">
            <li className="me-2">
              <a href="#" onClick={handleRefresh} title="Refresh">
                <ReloadOutlined />
              </a>
            </li>
          </ul>
          <div className="page-btn">
            <Button onClick={handleClose} className="btn btn-secondary">
              <LeftOutlined /> Back to List
            </Button>
          </div>
        </div>

        {/* Form Content - Always Visible */}
        <Form onFinish={handleSubmit} layout="vertical">
          {/* User Information Section */}
          <div className="card mb-4">
            <div className="card-header bg-white border-bottom">
              <h5 className="d-inline-flex align-items-center">
                <InfoCircleOutlined className="me-2" />
                User Information
              </h5>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-lg-4 col-md-6">
                  <Form.Item label="Username" required>
                    <Input
                      value={formData.username}
                      onChange={(e) => handleChange("username", e.target.value)}
                    />
                  </Form.Item>
                </div>
                <div className="col-lg-4 col-md-6">
                  <Form.Item label="Full Name" required>
                    <Input
                      value={formData.name}
                      onChange={(e) => handleChange("name", e.target.value)}
                    />
                  </Form.Item>
                </div>
                <div className="col-lg-4 col-md-6">
                  <Form.Item label="Email" required>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleChange("email", e.target.value)}
                    />
                  </Form.Item>
                </div>
                <div className="col-lg-4 col-md-6">
                  <Form.Item
                    label="Mobile Number"
                    validateStatus={
                      formData.mobileNumber &&
                      !/^\d{10}$/.test(formData.mobileNumber)
                        ? "error"
                        : ""
                    }
                    help={
                      formData.mobileNumber &&
                      !/^\d{10}$/.test(formData.mobileNumber)
                        ? "Mobile number must be exactly 10 digits"
                        : ""
                    }
                  >
                    <Input
                      value={formData.mobileNumber}
                      onChange={(e) => {
                        const value = e.target.value
                          .replace(/\D/g, "")
                          .slice(0, 10); // Allow only digits, max 10
                        handleChange("mobileNumber", value);
                      }}
                      placeholder="Enter 10-digit mobile number"
                      maxLength={10}
                    />
                  </Form.Item>
                </div>
                <div className="col-lg-4 col-md-6">
                  <Form.Item label="Date of Birth">
                    <DatePicker
                      value={
                        formData.dateOfBirth
                          ? moment(formData.dateOfBirth)
                          : null
                      }
                      onChange={(date) => handleDateChange("dateOfBirth", date)}
                      format="YYYY-MM-DD"
                      style={{ width: "100%" }}
                    />
                  </Form.Item>
                </div>
                <div className="col-lg-4 col-md-6">
                  <Form.Item label="Shift From">
                    <TimePicker
                      value={
                        formData.shiftFrom
                          ? moment(formData.shiftFrom, "HH:mm")
                          : null
                      }
                      onChange={(time) => handleTimeChange("shiftFrom", time)}
                      format="HH:mm"
                      style={{ width: "100%" }}
                    />
                  </Form.Item>
                </div>

                <div className="col-lg-4 col-md-6">
                  <Form.Item label="Shift To">
                    <TimePicker
                      value={
                        formData.shiftTo
                          ? moment(formData.shiftTo, "HH:mm")
                          : null
                      }
                      onChange={(time) => handleTimeChange("shiftTo", time)}
                      format="HH:mm"
                      style={{ width: "100%" }}
                    />
                  </Form.Item>
                </div>
                <div className="col-lg-4 col-md-6">
                  <Form.Item label="Blood Group">
                    <Select
                      value={formData.bloodGroup}
                      onChange={(value) => handleChange("bloodGroup", value)}
                      placeholder="Select blood group"
                      style={{ width: "100%" }}
                      dropdownStyle={{ minWidth: 120 }}
                    >
                      {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map(
                        (bg) => (
                          <Option key={bg} value={bg}>
                            {bg}
                          </Option>
                        )
                      )}
                    </Select>
                  </Form.Item>
                </div>
                <div className="col-lg-4 col-md-6">
                  <Form.Item label="Role" required>
                    <Select
                      value={formData.roleId}
                      onChange={(value) => handleChange("roleId", value)}
                      placeholder="Select role"
                      loading={isRolesLoading}
                      style={{ width: "100%" }}
                      dropdownStyle={{ minWidth: 200 }}
                    >
                      {roles?.map((role) => (
                        <Option key={role.roleId} value={role.roleId}>
                          {role.roleName}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </div>

                <div className="col-lg-4 col-md-6">
                  <Form.Item label="Status" required>
                    <Select
                      value={formData.status}
                      onChange={(value) => handleChange("status", value)}
                    >
                      <Option value="active">Active</Option>
                      <Option value="inactive">Inactive</Option>
                      <Option value="restricted">Restricted</Option>
                    </Select>
                  </Form.Item>
                </div>
                <div className="col-lg-4 col-md-6">
                  <Form.Item label="Emergency Contact">
                    <Input
                      value={formData.emergencyNumber}
                      onChange={(e) =>
                        handleChange("emergencyNumber", e.target.value)
                      }
                    />
                  </Form.Item>
                </div>
                <div className="col-lg-4 col-md-6">
                  <Form.Item label="Password" required={!isEditMode}>
                    <Input.Password
                      value={formData.password}
                      onChange={(e) => handleChange("password", e.target.value)}
                      placeholder={
                        isEditMode
                          ? "Leave blank to keep current"
                          : "Enter password"
                      }
                    />
                  </Form.Item>
                </div>
              </div>
            </div>
          </div>

          {/* Address Section */}
          <div className="card mb-4">
            <div className="card-header bg-white border-bottom d-flex align-items-center">
              <h5 className="d-inline-flex align-items-center">
                <HomeOutlined className="me-2" />
                Address Information
              </h5>
              <Checkbox
                checked={manageAddress}
                onChange={(e) => setManageAddress(e.target.checked)}
                className="ms-3"
              >
                {isEditMode && formData.addressId
                  ? "Edit Address"
                  : "Add Address"}
              </Checkbox>
            </div>
            {manageAddress && (
              <div className="card-body">
                <div className="row">
                  <div className="col-lg-4 col-md-6">
                    <Form.Item label="Street">
                      <Input
                        value={formData.street}
                        onChange={(e) => handleChange("street", e.target.value)}
                      />
                    </Form.Item>
                  </div>
                  <div className="col-lg-4 col-md-6">
                    <Form.Item label="Country">
                      <Input
                        value={formData.country}
                        onChange={(e) =>
                          handleChange("country", e.target.value)
                        }
                      />
                    </Form.Item>
                  </div>
                  <div className="col-lg-4 col-md-6">
                    <Form.Item label="State">
                      <Input
                        value={formData.state}
                        onChange={(e) => handleChange("state", e.target.value)}
                      />
                    </Form.Item>
                  </div>
                  <div className="col-lg-4 col-md-6">
                    <Form.Item label="City">
                      <Input
                        value={formData.city}
                        onChange={(e) => handleChange("city", e.target.value)}
                      />
                    </Form.Item>
                  </div>
                  <div className="col-lg-4 col-md-6">
                    <Form.Item label="Postal Code">
                      <Input
                        value={formData.postalCode}
                        onChange={(e) =>
                          handleChange("postalCode", e.target.value)
                        }
                      />
                    </Form.Item>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Submit Buttons */}
          <div className="text-end">
            <Button
              onClick={handleClose}
              disabled={
                isCreating ||
                isUpdating ||
                isAddressCreating ||
                isAddressUpdating
              }
              style={{ marginRight: 8 }}
            >
              Cancel
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={
                isCreating ||
                isUpdating ||
                isAddressCreating ||
                isAddressUpdating
              }
            >
              {isEditMode ? "Update User" : "Add User"}
            </Button>
          </div>
        </Form>
      </div>
    </div>
  );
};

export default NewAddUser;
