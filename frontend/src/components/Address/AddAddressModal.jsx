import React, { useEffect, useState } from "react";
import {
  useCreateAddressMutation,
  useUpdateAddressMutation,
  useGetAllAddressesQuery,
} from "../../api/addressApi";
import { useGetCustomersQuery } from "../../api/customerApi";
import { useGetAllUsersQuery } from "../../api/userApi";
import { v4 as uuidv4 } from "uuid";
import { Modal, Button, Input, Select, Form, Radio, message } from "antd";

const { Option } = Select;

// Country and states data
const countryData = {
  name: "India",
  states: [
    "Andaman and Nicobar Islands",
    "Andhra Pradesh",
    "Arunachal Pradesh",
    "Assam",
    "Bihar",
    "Chandigarh",
    "Chhattisgarh",
    "Dadra and Nagar Haveli and Daman and Diu",
    "Delhi",
    "Goa",
    "Gujarat",
    "Haryana",
    "Himachal Pradesh",
    "Jammu and Kashmir",
    "Jharkhand",
    "Karnataka",
    "Kerala",
    "Ladakh",
    "Lakshadweep",
    "Madhya Pradesh",
    "Maharashtra",
    "Manipur",
    "Meghalaya",
    "Mizoram",
    "Nagaland",
    "Odisha",
    "Puducherry",
    "Punjab",
    "Rajasthan",
    "Sikkim",
    "Tamil Nadu",
    "Telangana",
    "Tripura",
    "Uttar Pradesh",
    "Uttarakhand",
    "West Bengal",
  ],
};
// ---- ADD THIS RIGHT AFTER `countryData` ----
const sortedStates = [...countryData.states].sort((a, b) => a.localeCompare(b));
const AddAddress = ({ onClose, onSave, existingAddress, selectedCustomer }) => {
  const isEdit = !!existingAddress;
  const [form] = Form.useForm();
  const [addressType, setAddressType] = useState(
    existingAddress?.customerId
      ? "customer"
      : existingAddress?.userId
      ? "user"
      : "customer"
  );
  const [createAddress, { isLoading: isCreating }] = useCreateAddressMutation();
  const [updateAddress, { isLoading: isUpdating }] = useUpdateAddressMutation();
  const {
    data: customersData,
    isLoading: isCustomersLoading,
    error: customersError,
  } = useGetCustomersQuery();
  const {
    data: usersData,
    isLoading: isUsersLoading,
    error: usersError,
  } = useGetAllUsersQuery();
  const { data: addressesData, isLoading: isAddressesLoading } =
    useGetAllAddressesQuery(
      { customerId: selectedCustomer },
      { skip: !selectedCustomer }
    );

  const customers = customersData?.data || [];
  const users = usersData?.users || [];
  const customerAddresses = addressesData || [];

  // Determine available status options based on existing addresses
  const getAvailableStatuses = () => {
    if (!selectedCustomer || addressType !== "customer") {
      return ["BILLING", "PRIMARY", "ADDITIONAL"];
    }
    const hasBilling = customerAddresses.some(
      (addr) => addr.status === "BILLING"
    );
    const hasPrimary = customerAddresses.some(
      (addr) => addr.status === "PRIMARY"
    );
    const existingCount = customerAddresses.length;

    if (isEdit) {
      const currentStatus = existingAddress.status;
      const options = ["ADDITIONAL"];
      if (currentStatus === "BILLING" || !hasBilling) options.push("BILLING");
      if (currentStatus === "PRIMARY" || (!hasPrimary && existingCount >= 1))
        options.push("PRIMARY");
      return options;
    } else {
      if (!hasBilling) return ["BILLING"];
      if (!hasPrimary && existingCount === 1) return ["PRIMARY"];
      return ["ADDITIONAL"];
    }
  };

  useEffect(() => {
    if (existingAddress) {
      form.setFieldsValue({
        street: existingAddress.street || "",
        city: existingAddress.city || "",
        state: existingAddress.state || "",
        postalCode: existingAddress.postalCode || "",
        country: existingAddress.country || "",
        status: existingAddress.status || "ADDITIONAL",
        userId: existingAddress.userId || undefined,
        customerId: existingAddress.customerId || undefined,
      });
      setAddressType(existingAddress.customerId ? "customer" : "user");
    } else if (selectedCustomer) {
      form.setFieldsValue({
        customerId: selectedCustomer,
        status: getAvailableStatuses()[0],
        country: "India", // Default to India
      });
      setAddressType("customer");
    }
  }, [existingAddress, selectedCustomer, form, customerAddresses]);

  const handleAddressTypeChange = (e) => {
    const type = e.target.value;
    setAddressType(type);
    form.setFieldsValue({
      userId: undefined,
      customerId: undefined,
      status: "ADDITIONAL",
      country: "India", // Reset to India
      state: undefined,
      ...(type === "customer" && selectedCustomer
        ? { customerId: selectedCustomer }
        : {}),
    });
  };

  const handleSubmit = async (values) => {
    if (!values.userId && !values.customerId) {
      message.error("Either User or Customer is required");
      return;
    }
    if (values.userId && values.customerId) {
      message.error(
        "Address can only be associated with either a User or a Customer"
      );
      return;
    }

    const updatedData = {
      street: values.street,
      city: values.city,
      state: values.state,
      postalCode: values.postalCode,
      country: values.country,
      status: values.status || "ADDITIONAL",
      userId: values.userId || null,
      customerId: values.customerId || null,
      updatedAt: new Date().toISOString(),
    };

    try {
      let newAddressId;
      if (isEdit) {
        await updateAddress({
          addressId: existingAddress.addressId,
          updatedData,
        }).unwrap();
        newAddressId = existingAddress.addressId;
      } else {
        const addressData = {
          addressId: uuidv4(),
          ...updatedData,
          createdAt: new Date().toISOString(),
        };
        const result = await createAddress(addressData).unwrap();
        newAddressId = result.data.addressId;
      }
      onSave(newAddressId);
      onClose();
    } catch (err) {
      message.error(
        `Failed to save address: ${
          err?.data?.message || err.message || "Unknown error"
        }`
      );
    }
  };

  return (
    <Modal
      title={isEdit ? "Edit Address" : "Add New Address"}
      open={true}
      onCancel={onClose}
      footer={null}
    >
      <Form form={form} onFinish={handleSubmit} layout="vertical">
        <Form.Item
          label="Address For"
          name="addressType"
          rules={[
            {
              required: true,
              message:
                "Please select whether the address is for a User or Customer",
            },
          ]}
        >
          <Radio.Group
            onChange={handleAddressTypeChange}
            value={addressType}
            disabled={isEdit}
          >
            <Radio value="user">User</Radio>
            <Radio value="customer">Customer</Radio>
          </Radio.Group>
        </Form.Item>
        <Form.Item
          label="Street"
          name="street"
          rules={[{ required: true, message: "Street is required" }]}
        >
          <Input />
        </Form.Item>
        <Form.Item
          label="City"
          name="city"
          rules={[{ required: true, message: "City is required" }]}
        >
          <Input />
        </Form.Item>
        <Form.Item
          label="State"
          name="state"
          rules={[{ required: true, message: "State is required" }]}
        >
          <Select
            showSearch
            allowClear
            placeholder="Search and select state"
            optionFilterProp="children"
            filterOption={(input, option) =>
              option.children.toLowerCase().includes(input.toLowerCase())
            }
            notFoundContent="No state found"
            style={{ width: "100%" }}
          >
            <Option value="">Select State</Option>
            {sortedStates.map((state) => (
              <Option key={state} value={state}>
                {state}
              </Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item
          label="Postal Code"
          name="postalCode"
          rules={[
            {
              pattern: /^[0-9]{6}$/,
              message: "Postal code must be a 6-digit number",
            },
          ]}
        >
          <Input />
        </Form.Item>
        <Form.Item
          label="Country"
          name="country"
          rules={[{ required: true, message: "Country is required" }]}
        >
          <Select
            showSearch
            allowClear
            placeholder="Select or type a country"
            filterOption={(input, option) =>
              option.children.toLowerCase().includes(input.toLowerCase())
            }
            // Allow custom input
            onSearch={(value) => {
              if (value) {
                form.setFieldsValue({ country: value });
              }
            }}
            onChange={(value) => {
              form.setFieldsValue({ country: value });
              // Reset state if country changes to non-India
              if (value !== "India") {
                form.setFieldsValue({ state: undefined });
              }
            }}
          >
            <Option key={countryData.name} value={countryData.name}>
              {countryData.name}
            </Option>
            {/* Add more countries if needed */}
            <Option key="Other" value="Other">
              Other
            </Option>
          </Select>
        </Form.Item>
        {addressType === "customer" && (
          <Form.Item
            label="Status"
            name="status"
            rules={[{ required: true, message: "Status is required" }]}
          >
            <Select
              loading={isAddressesLoading}
              disabled={isAddressesLoading}
              placeholder="Select address status"
            >
              {getAvailableStatuses().map((status) => (
                <Option key={status} value={status}>
                  {status}
                </Option>
              ))}
            </Select>
          </Form.Item>
        )}
        {addressType === "user" && (
          <Form.Item
            label="User"
            name="userId"
            rules={[{ required: true, message: "User is required" }]}
          >
            <Select
              loading={isUsersLoading}
              disabled={isUsersLoading || !!usersError}
              placeholder="Select a user"
              allowClear
            >
              {isUsersLoading ? (
                <Option disabled>Loading...</Option>
              ) : usersError ? (
                <Option disabled>Error fetching users</Option>
              ) : (
                users.map((user) => (
                  <Option key={user.userId} value={user.userId}>
                    {user.name || user.email || user.userId}
                  </Option>
                ))
              )}
            </Select>
          </Form.Item>
        )}
        {addressType === "customer" && (
          <Form.Item
            label="Customer"
            name="customerId"
            rules={[{ required: true, message: "Customer is required" }]}
          >
            <Select
              loading={isCustomersLoading}
              disabled={isCustomersLoading || !!customersError}
              placeholder="Select a customer"
              allowClear
            >
              {isCustomersLoading ? (
                <Option disabled>Loading...</Option>
              ) : customersError ? (
                <Option disabled>Error fetching customers</Option>
              ) : (
                customers.map((customer) => (
                  <Option key={customer.customerId} value={customer.customerId}>
                    {customer.name} ({customer.email})
                  </Option>
                ))
              )}
            </Select>
          </Form.Item>
        )}
        <Form.Item>
          <Button
            type="default"
            onClick={onClose}
            disabled={isCreating || isUpdating}
            style={{ marginRight: 8 }}
          >
            Cancel
          </Button>
          <Button
            type="primary"
            htmlType="submit"
            loading={isCreating || isUpdating}
            disabled={
              isUsersLoading || isCustomersLoading || isAddressesLoading
            }
          >
            {isCreating || isUpdating
              ? "Saving..."
              : isEdit
              ? "Update"
              : "Create"}
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default AddAddress;
