import React, { useEffect, useState } from "react";
import {
  useCreateAddressMutation,
  useUpdateAddressMutation,
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

  const customers = customersData?.data || [];
  const users = usersData?.users || [];

  useEffect(() => {
    if (existingAddress) {
      form.setFieldsValue({
        street: existingAddress.street || "",
        city: existingAddress.city || "",
        state: existingAddress.state || "",
        postalCode: existingAddress.postalCode || "",
        country: existingAddress.country || "",
        userId: existingAddress.userId || undefined,
        customerId: existingAddress.customerId || undefined,
      });
      setAddressType(existingAddress.customerId ? "customer" : "user");
    } else if (selectedCustomer) {
      form.setFieldsValue({ customerId: selectedCustomer });
      setAddressType("customer");
    }
  }, [existingAddress, selectedCustomer, form]);

  const handleAddressTypeChange = (e) => {
    const type = e.target.value;
    setAddressType(type);
    form.setFieldsValue({
      userId: undefined,
      customerId: undefined,
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
      userId: values.userId || null,
      customerId: values.customerId || null,
      updatedAt: new Date().toISOString(),
    };

    try {
      if (isEdit) {
        await updateAddress({
          addressId: existingAddress.addressId,
          updatedData,
        }).unwrap();
      } else {
        const addressData = {
          addressId: uuidv4(),
          ...updatedData,
          createdAt: new Date().toISOString(),
        };
        const newAddress = await createAddress(addressData).unwrap();
        onSave(newAddress.data.addressId);
      }
      onClose();
    } catch (err) {
      console.error("Address creation error:", err);
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
            disabled={isEdit} // Prevent changing type when editing
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
            disabled={isUsersLoading || isCustomersLoading}
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
