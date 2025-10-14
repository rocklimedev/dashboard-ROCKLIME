import React, { useEffect, useState } from "react";
import {
  useCreateAddressMutation,
  useUpdateAddressMutation,
  useGetAllAddressesQuery,
} from "../../api/addressApi";
import { useGetCustomersQuery } from "../../api/customerApi";
import { useGetAllUsersQuery } from "../../api/userApi";
import { v4 as uuidv4 } from "uuid";
import { toast } from "sonner";
import { Modal, Button, Input, Select, Form, Radio } from "antd";

const { Option } = Select;

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
      // Allow current status or ADDITIONAL
      const currentStatus = existingAddress.status;
      const options = ["ADDITIONAL"];
      if (currentStatus === "BILLING" || !hasBilling) options.push("BILLING");
      if (currentStatus === "PRIMARY" || (!hasPrimary && existingCount >= 1))
        options.push("PRIMARY");
      return options;
    } else {
      // New address: Allow BILLING if none exists, PRIMARY if only BILLING exists, else ADDITIONAL
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
        status: getAvailableStatuses()[0], // Default to first available status
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
      ...(type === "customer" && selectedCustomer
        ? { customerId: selectedCustomer }
        : {}),
    });
  };

  const handleSubmit = async (values) => {
    if (!values.userId && !values.customerId) {
      toast.error("Either User or Customer is required");
      return;
    }
    if (values.userId && values.customerId) {
      toast.error(
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
      toast.error(
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
        <Form.Item label="State" name="state">
          <Input />
        </Form.Item>
        <Form.Item label="Postal Code" name="postalCode">
          <Input />
        </Form.Item>
        <Form.Item
          label="Country"
          name="country"
          rules={[{ required: true, message: "Country is required" }]}
        >
          <Input />
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
