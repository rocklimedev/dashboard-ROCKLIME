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

// Sorted Indian States
const sortedStates = [
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
].sort();

const AddAddress = ({
  visible,
  onClose,
  onSave,
  existingAddress,
  selectedCustomer,
}) => {
  const isEdit = !!existingAddress;
  const [form] = Form.useForm();

  const [addressType, setAddressType] = useState("customer");

  const [createAddress, { isLoading: isCreating }] = useCreateAddressMutation();
  const [updateAddress, { isLoading: isUpdating }] = useUpdateAddressMutation();

  const { data: customersData, isLoading: isCustomersLoading } =
    useGetCustomersQuery();
  const { data: usersData, isLoading: isUsersLoading } = useGetAllUsersQuery();

  // Only fetch customer addresses if creating for a specific customer
  const { data: addressesData, isLoading: isAddressesLoading } =
    useGetAllAddressesQuery(
      { customerId: selectedCustomer },
      { skip: !selectedCustomer || addressType !== "customer" }
    );

  const customers = customersData?.data || [];
  const users = usersData?.users || [];
  const customerAddresses = addressesData || [];

  // Determine available status options
  const getAvailableStatuses = () => {
    if (addressType !== "customer" || !selectedCustomer) {
      return ["BILLING", "PRIMARY", "ADDITIONAL"];
    }

    const hasBilling = customerAddresses.some(
      (a) =>
        a.status === "BILLING" && a.addressId !== existingAddress?.addressId
    );
    const hasPrimary = customerAddresses.some(
      (a) =>
        a.status === "PRIMARY" && a.addressId !== existingAddress?.addressId
    );

    const options = ["ADDITIONAL"];

    if (!hasBilling) options.unshift("BILLING");
    if (!hasPrimary) options.unshift("PRIMARY");

    return options;
  };

  // Initialize form on mount or when props change
  useEffect(() => {
    if (!visible) return;

    if (existingAddress) {
      form.setFieldsValue({
        street: existingAddress.street || "",
        city: existingAddress.city || "",
        state: existingAddress.state || "",
        postalCode: existingAddress.postalCode || "",
        country: existingAddress.country || "India",
        status: existingAddress.status || "ADDITIONAL",
        customerId: existingAddress.customerId || undefined,
        userId: existingAddress.userId || undefined,
      });
      setAddressType(existingAddress.customerId ? "customer" : "user");
    } else {
      form.resetFields();
      setAddressType(selectedCustomer ? "customer" : "customer");

      form.setFieldsValue({
        country: "India",
        customerId: selectedCustomer || undefined,
        status: selectedCustomer ? getAvailableStatuses()[0] : "ADDITIONAL",
      });
    }
  }, [visible, existingAddress, selectedCustomer, form, customerAddresses]);

  const handleAddressTypeChange = (e) => {
    const type = e.target.value;
    setAddressType(type);
    form.setFieldsValue({
      customerId: type === "customer" ? selectedCustomer : undefined,
      userId: type === "user" ? undefined : undefined,
      status: type === "customer" ? getAvailableStatuses()[0] : "ADDITIONAL",
    });
  };

  const handleSubmit = async (values) => {
    if (!values.customerId && !values.userId) {
      message.error("Please select either a Customer or a User");
      return;
    }

    const payload = {
      street: values.street.trim(),
      city: values.city.trim(),
      state: values.state,
      postalCode: values.postalCode?.trim() || null,
      country: values.country || "India",
      status: values.status || "ADDITIONAL",
      customerId: values.customerId || null,
      userId: values.userId || null,
    };

    try {
      let addressId;
      if (isEdit) {
        await updateAddress({
          addressId: existingAddress.addressId,
          updatedData: payload,
        }).unwrap();
        addressId = existingAddress.addressId;
        message.success("Address updated successfully");
      } else {
        const newAddress = {
          addressId: uuidv4(),
          ...payload,
          createdAt: new Date().toISOString(),
        };
        const result = await createAddress(newAddress).unwrap();
        addressId = result.data.addressId;
        message.success("Address created successfully");
      }

      onSave(addressId);
      onClose();
      form.resetFields();
    } catch (err) {
      message.error(err?.data?.message || "Failed to save address");
    }
  };

  return (
    <Modal
      title={isEdit ? "Edit Address" : "Add New Address"}
      open={visible}
      onCancel={() => {
        form.resetFields();
        onClose();
      }}
      footer={null}
      width={600}
    >
      <Form form={form} onFinish={handleSubmit} layout="vertical">
        {/* Address For */}
        <Form.Item label="Address For">
          <Radio.Group
            value={addressType}
            onChange={handleAddressTypeChange}
            disabled={isEdit || !!selectedCustomer}
          >
            <Radio value="customer">Customer</Radio>
            <Radio value="user">User</Radio>
          </Radio.Group>
        </Form.Item>

        {/* Customer / User Selection */}
        {addressType === "customer" && !selectedCustomer && (
          <Form.Item
            name="customerId"
            label="Customer"
            rules={[{ required: true, message: "Please select a customer" }]}
          >
            <Select
              showSearch
              placeholder="Search customer..."
              loading={isCustomersLoading}
              filterOption={(input, option) =>
                option.children.toLowerCase().includes(input.toLowerCase())
              }
            >
              {customers.map((c) => (
                <Option key={c.customerId} value={c.customerId}>
                  {c.name} ({c.email})
                </Option>
              ))}
            </Select>
          </Form.Item>
        )}

        {addressType === "user" && (
          <Form.Item
            name="userId"
            label="User"
            rules={[{ required: true, message: "Please select a user" }]}
          >
            <Select
              showSearch
              placeholder="Search user..."
              loading={isUsersLoading}
              filterOption={(input, option) =>
                option.children.toLowerCase().includes(input.toLowerCase())
              }
            >
              {users.map((u) => (
                <Option key={u.userId} value={u.userId}>
                  {u.name || u.email}
                </Option>
              ))}
            </Select>
          </Form.Item>
        )}

        {/* Address Fields */}
        <Form.Item
          name="street"
          label="Street Address"
          rules={[{ required: true, message: "Street is required" }]}
        >
          <Input.TextArea
            rows={2}
            placeholder="House no., Building, Street, Area"
          />
        </Form.Item>

        <Form.Item
          name="city"
          label="City"
          rules={[{ required: true, message: "City is required" }]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          name="state"
          label="State"
          rules={[{ required: true, message: "State is required" }]}
        >
          <Select
            showSearch
            placeholder="Select state"
            optionFilterProp="children"
          >
            {sortedStates.map((state) => (
              <Option key={state} value={state}>
                {state}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          name="postalCode"
          label="Postal Code"
          rules={[
            { pattern: /^[0-9]{6}$/, message: "Enter valid 6-digit PIN code" },
          ]}
        >
          <Input maxLength={6} />
        </Form.Item>

        <Form.Item name="country" label="Country" rules={[{ required: true }]}>
          <Select showSearch defaultValue="India">
            <Option value="India">India</Option>
            <Option value="Other">Other</Option>
          </Select>
        </Form.Item>

        {/* Status (only for customers) */}
        {addressType === "customer" && (
          <Form.Item
            name="status"
            label="Address Type"
            rules={[{ required: true }]}
          >
            <Select loading={isAddressesLoading}>
              {getAvailableStatuses().map((status) => (
                <Option key={status} value={status}>
                  {status === "BILLING" && "Billing Address"}
                  {status === "PRIMARY" && "Primary Address"}
                  {status === "ADDITIONAL" && "Additional Address"}
                </Option>
              ))}
            </Select>
          </Form.Item>
        )}

        {/* Submit Buttons */}
        <Form.Item style={{ marginBottom: 0, textAlign: "right" }}>
          <Button
            onClick={() => {
              form.resetFields();
              onClose();
            }}
            style={{ marginRight: 8 }}
          >
            Cancel
          </Button>
          <Button
            type="primary"
            htmlType="submit"
            loading={isCreating || isUpdating}
          >
            {isEdit ? "Update Address" : "Create Address"}
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default AddAddress;
