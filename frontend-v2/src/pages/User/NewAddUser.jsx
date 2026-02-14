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
import { message } from "antd";
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
  ClearOutlined,
  InfoCircleOutlined,
  HomeOutlined,
} from "@ant-design/icons";

const { Option } = Select;

const NewAddUser = ({ userToEdit: propUserToEdit }) => {
  const { userId } = useParams();
  const navigate = useNavigate();

  // === RTK Queries & Mutations ===
  const { data: fetchedUser, refetch } = useGetUserByIdQuery(userId, {
    skip: !userId || !!propUserToEdit,
  });

  const userToEdit = propUserToEdit || fetchedUser?.data || fetchedUser?.user;

  const [createUser] = useCreateUserMutation();
  const [updateUser] = useUpdateUserMutation();
  const [createAddress] = useCreateAddressMutation();
  const [updateAddress] = useUpdateAddressMutation();
  const { data: roles } = useGetRolesQuery();

  // === Local State ===
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
    isEmailVerified: false,
  });

  // === Populate Form on Load/Edit ===
  useEffect(() => {
    if (userToEdit) {
      setFormData({
        username: userToEdit.username || "",
        name: userToEdit.name || "",
        email: userToEdit.email || "",
        mobileNumber: userToEdit.mobileNumber || "",
        isEmailVerified: userToEdit.isEmailVerified ?? false,
        dateOfBirth: userToEdit.dateOfBirth
          ? new Date(userToEdit.dateOfBirth).toISOString().split("T")[0]
          : "",
        shiftFrom: userToEdit.shiftFrom
          ? moment(userToEdit.shiftFrom, "HH:mm:ss").format("HH:mm")
          : "",
        shiftTo: userToEdit.shiftTo
          ? moment(userToEdit.shiftTo, "HH:mm:ss").format("HH:mm")
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

  // === Input Handlers ===
  const handleChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleDateChange = (name, date) => {
    handleChange(name, date ? date.format("YYYY-MM-DD") : "");
  };

  const handleTimeChange = (name, time) => {
    handleChange(name, time ? time.format("HH:mm") : "");
  };

  // === Reset & Clear Functions ===
  const resetToOriginal = async () => {
    if (isEditMode) {
      if (propUserToEdit) {
        // Reset from props
        populateForm(propUserToEdit);
      } else if (userId) {
        try {
          const { data } = await refetch();
          const user = data?.data || data?.user;
          if (user) populateForm(user);
        } catch {
          message.error("Failed to reload user data");
        }
      }
    } else {
      clearForm();
    }
  };

  const populateForm = (user) => {
    setFormData({
      username: user.username || "",
      name: user.name || "",
      email: user.email || "",
      mobileNumber: user.mobileNumber || "",
      isEmailVerified: user.isEmailVerified ?? false,
      dateOfBirth: user.dateOfBirth
        ? new Date(user.dateOfBirth).toISOString().split("T")[0]
        : "",
      shiftFrom: user.shiftFrom
        ? moment(user.shiftFrom, "HH:mm:ss").format("HH:mm")
        : "",
      shiftTo: user.shiftTo
        ? moment(user.shiftTo, "HH:mm:ss").format("HH:mm")
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
  };

  const clearForm = () => {
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
      isEmailVerified: false,
    });
    setManageAddress(false);
  };

  const handleRefresh = () => resetToOriginal();
  const handleClear = () => clearForm();
  const handleClose = () => navigate("/users/list");

  // === Form Submission ===
  const handleSubmit = async () => {
    try {
      const required = ["username", "email", "name", "roleId"];
      if (!isEditMode) required.push("password");

      for (const field of required) {
        if (!formData[field]?.trim()) {
          message.error(
            `${field.charAt(0).toUpperCase() + field.slice(1)} is required`
          );
          return;
        }
      }

      if (formData.shiftFrom && formData.shiftTo) {
        const from = moment(`1970-01-01 ${formData.shiftFrom}`);
        const to = moment(`1970-01-01 ${formData.shiftTo}`);
        if (to.isSameOrBefore(from)) {
          message.error("Shift To must be after Shift From");
          return;
        }
      }

      const selectedRole = roles?.find((r) => r.roleId === formData.roleId);
      if (!selectedRole) {
        message.error("Invalid role selected");
        return;
      }

      let addressId = isEditMode ? formData.addressId : null;

      // Handle Address
      if (manageAddress) {
        const hasFields =
          formData.street ||
          formData.country ||
          formData.state ||
          formData.city ||
          formData.postalCode;

        if (hasFields) {
          const payload = {
            street: formData.street || null,
            country: formData.country || null,
            state: formData.state || null,
            city: formData.city || null,
            postalCode: formData.postalCode || null,
            updatedAt: new Date().toISOString(),
            userId: isEditMode ? userToEdit.userId : null,
          };

          let result;
          if (isEditMode && addressId) {
            result = await updateAddress({ addressId, ...payload }).unwrap();
          } else {
            result = await createAddress(payload).unwrap();
          }
          addressId = result.addressId || result.data?.addressId;
        }
      }

      // Prepare User Payload
      const userPayload = {
        username: formData.username.trim(),
        name: formData.name.trim(),
        email: formData.email.trim(),
        mobileNumber: formData.mobileNumber || null,
        dateOfBirth: formData.dateOfBirth || null,
        shiftFrom: formData.shiftFrom || null,
        shiftTo: formData.shiftTo || null,
        bloodGroup: formData.bloodGroup || null,
        addressId: addressId || null,
        emergencyNumber: formData.emergencyNumber || null,
        roleId: selectedRole.roleId,
        status: formData.status,
        password: formData.password || undefined,
        about: formData.about || null,
        isEmailVerified: formData.isEmailVerified,
      };

      if (isEditMode) {
        await updateUser({
          userId: userToEdit.userId,
          ...userPayload,
        }).unwrap();
      } else {
        const res = await createUser(userPayload).unwrap();
        const newUserId = res.userId || res.data?.userId;

        // Link address to newly created user
        if (addressId && newUserId) {
          await updateAddress({
            addressId,
            userId: newUserId,
            updatedAt: new Date().toISOString(),
          }).unwrap();
        }
      }

      message.success(
        isEditMode ? "User updated successfully" : "User created successfully"
      );
      navigate("/users/list");
    } catch (err) {
      message.error(err?.data?.message || "Operation failed");
    }
  };

  // === Main Render (No loading states — handled globally) ===
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
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  handleRefresh();
                }}
                title="Reset"
              >
                <ReloadOutlined />
              </a>
            </li>
            <li className="me-2">
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  handleClear();
                }}
                title="Clear"
              >
                <ClearOutlined />
              </a>
            </li>
          </ul>

          <div className="page-btn">
            <Button onClick={handleClose} className="btn btn-secondary">
              <LeftOutlined /> Back to List
            </Button>
          </div>
        </div>

        {/* Form */}
        <Form onFinish={handleSubmit} layout="vertical">
          {/* User Information */}
          <div className="card mb-4">
            <div className="card-header bg-white border-bottom">
              <h5 className="d-inline-flex align-items-center">
                <InfoCircleOutlined className="me-2" /> User Information
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
                        ? "Must be 10 digits"
                        : ""
                    }
                  >
                    <Input
                      value={formData.mobileNumber}
                      onChange={(e) =>
                        handleChange(
                          "mobileNumber",
                          e.target.value.replace(/\D/g, "").slice(0, 10)
                        )
                      }
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
                      onChange={(d) => handleDateChange("dateOfBirth", d)}
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
                      onChange={(t) => handleTimeChange("shiftFrom", t)}
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
                      onChange={(t) => handleTimeChange("shiftTo", t)}
                      format="HH:mm"
                      style={{ width: "100%" }}
                    />
                  </Form.Item>
                </div>

                <div className="col-lg-4 col-md-6">
                  <Form.Item label="Blood Group">
                    <Select
                      value={formData.bloodGroup}
                      onChange={(v) => handleChange("bloodGroup", v)}
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
                      onChange={(v) => handleChange("roleId", v)}
                      placeholder="Select role"
                    >
                      {roles?.map((r) => (
                        <Option key={r.roleId} value={r.roleId}>
                          {r.roleName}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </div>

                <div className="col-lg-4 col-md-6">
                  <Form.Item label="Status">
                    <Select
                      value={formData.status}
                      onChange={(v) => handleChange("status", v)}
                    >
                      <Option value="active">Active</Option>
                      <Option value="inactive">Inactive</Option>
                      <Option value="restricted">Restricted</Option>
                    </Select>
                  </Form.Item>
                </div>

                <div className="col-lg-4 col-md-6">
                  <Form.Item label="Email Verified">
                    <Select
                      value={formData.isEmailVerified}
                      onChange={(v) => handleChange("isEmailVerified", v)}
                    >
                      <Option value={true}>Yes</Option>
                      <Option value={false}>No</Option>
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
                <HomeOutlined className="me-2" /> Address Information
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

          {/* Submit */}
          <div className="text-end">
            <Button onClick={handleClose} style={{ marginRight: 8 }}>
              Cancel
            </Button>
            <Button type="primary" htmlType="submit" loading={false}>
              {isEditMode ? "Update User" : "Add User"}
            </Button>
          </div>
        </Form>
      </div>
    </div>
  );
};

export default NewAddUser;
