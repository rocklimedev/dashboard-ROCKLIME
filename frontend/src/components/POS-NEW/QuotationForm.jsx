import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Card, Button, Alert, Typography, Divider, Tabs, Select } from "antd";
import { UserAddOutlined } from "@ant-design/icons";
import { useGetCustomersQuery } from "../../api/customerApi";

import { useClearCartMutation } from "../../api/cartApi";

import { useCreateQuotationMutation } from "../../api/quotationApi";

import { useGetAllAddressesQuery } from "../../api/addressApi";

import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";

import styled from "styled-components";
import PropTypes from "prop-types";
import "react-lazy-load-image-component/src/effects/blur.css";

const { Title, Text } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;

const CartSummaryCard = styled(Card)`
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 16px;
  @media (min-width: 768px) {
    top: 20px;
  }
`;

const CustomerSelect = styled(Select)`
  width: 100%;
  margin-top: 8px;
`;

const QuotationForm = ({
  selectedCustomer,
  setSelectedCustomer,
  quotationData,
  setQuotationData,
  itemDiscounts,
  cartItems,
  userId,
  quotationNumber,
  totalAmount,
  setError,
  error,
  setShowAddAddressModal,
  resetForm,
  setActiveTab,
}) => {
  const navigate = useNavigate();
  const { data: customerData, isLoading: customersLoading } =
    useGetCustomersQuery();
  const {
    data: addressesData,
    isLoading: addressesLoading,
    refetch: refetchAddresses,
  } = useGetAllAddressesQuery(
    { customerId: selectedCustomer },
    { skip: !selectedCustomer }
  );
  const [createQuotation] = useCreateQuotationMutation();
  const [clearCart] = useClearCartMutation();

  const customers = customerData?.data || [];
  const customerList = useMemo(
    () => (Array.isArray(customers) ? customers : []),
    [customers]
  );
  const addresses = useMemo(
    () => (Array.isArray(addressesData?.data) ? addressesData.data : []),
    [addressesData]
  );

  useEffect(() => {
    if (selectedCustomer && addresses.length > 0) {
      const selectedCustomerData = customerList.find(
        (customer) => customer.customerId === selectedCustomer
      );
      if (selectedCustomerData) {
        setQuotationData((prev) => {
          const newBillTo = selectedCustomerData.name || prev.billTo;
          let newShipTo = prev.shipTo;
          if (selectedCustomerData.address) {
            const customerAddress = selectedCustomerData.address;
            const matchingAddress = addresses.find((addr) => {
              const addrDetails = addr.addressDetails || addr;
              return (
                addrDetails.street === customerAddress.street &&
                addrDetails.city === customerAddress.city &&
                addrDetails.state === customerAddress.state &&
                (addrDetails.postalCode === customerAddress.zipCode ||
                  addrDetails.postalCode === customerAddress.postalCode) &&
                addrDetails.country === customerAddress.country
              );
            });
            if (matchingAddress && matchingAddress.addressId) {
              newShipTo = matchingAddress.addressId;
            }
          }
          return { ...prev, billTo: newBillTo, shipTo: newShipTo };
        });
      }
    }
  }, [selectedCustomer, customerList, addresses, setQuotationData]);

  useEffect(() => {
    const { quotationDate, dueDate } = quotationData;
    if (quotationDate && dueDate) {
      const quotation = new Date(quotationDate);
      const due = new Date(dueDate);
      if (due <= quotation) {
        setError("Due date must be after quotation date");
      } else {
        setError("");
      }
    }
  }, [quotationData.quotationDate, quotationData.dueDate, setError]);

  const handleQuotationChange = (key, value) => {
    setQuotationData((prev) => ({ ...prev, [key]: value }));
  };

  const handleCreateQuotation = async () => {
    if (!selectedCustomer) return toast.error("Please select a customer.");
    if (!userId) return toast.error("User not logged in!");
    if (!quotationData.quotationDate || !quotationData.dueDate)
      return toast.error("Please provide quotation and due dates.");
    if (!quotationData.billTo)
      return toast.error("Please provide a billing name.");
    if (error) return toast.error("Please fix the errors before submitting.");
    if (cartItems.length === 0)
      return toast.error("Cart is empty. Add items to proceed.");

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(quotationData.quotationDate))
      return toast.error("Invalid quotation date format. Use YYYY-MM-DD.");
    if (!dateRegex.test(quotationData.dueDate))
      return toast.error("Invalid due date format. Use YYYY-MM-DD.");

    if (isNaN(totalAmount) || totalAmount <= 0)
      return toast.error("Invalid total amount.");

    try {
      await refetchAddresses().unwrap();
    } catch (err) {
      return toast.error("Failed to load addresses. Please try again.");
    }

    const selectedCustomerData = customerList.find(
      (customer) => customer.customerId === selectedCustomer
    );
    if (!selectedCustomerData)
      return toast.error("Selected customer not found.");

    if (
      quotationData.shipTo &&
      !addresses.find((addr) => addr.addressId === quotationData.shipTo)
    ) {
      return toast.error("Invalid shipping address selected.");
    }

    const quotationPayload = {
      quotationId: uuidv4(),
      document_title: `Quotation for ${selectedCustomerData.name}`,
      quotation_date: quotationData.quotationDate,
      due_date: quotationData.dueDate,
      reference_number: quotationNumber,
      include_gst: quotationData.includeGst,
      gst_value: parseFloat(quotationData.gstValue) || 0,
      discountType: quotationData.discountType,
      roundOff: parseFloat(quotationData.roundOff) || 0,
      finalAmount: parseFloat(totalAmount.toFixed(2)),
      signature_name: quotationData.signatureName || "CM TRADING CO",
      signature_image: "",
      customerId: selectedCustomerData.customerId,
      shipTo: quotationData.shipTo || null,
      createdBy: userId,
      products: cartItems.map((item) => {
        const itemSubtotal = parseFloat(
          (item.price * item.quantity).toFixed(2)
        );
        const itemDiscount = parseFloat(itemDiscounts[item.productId]) || 0;
        return {
          productId: item.productId,
          name: item.name || "Unnamed Product",
          quantity: item.quantity || 1,
          sellingPrice: parseFloat(item.price || 0),
          discount: itemDiscount,
          tax: quotationData.includeGst
            ? parseFloat(quotationData.gstValue) || 0
            : 0,
          total: parseFloat((itemSubtotal - itemDiscount).toFixed(2)),
        };
      }),
      items: cartItems.map((item) => {
        const itemSubtotal = parseFloat(
          (item.price * item.quantity).toFixed(2)
        );
        const itemDiscount = parseFloat(itemDiscounts[item.productId]) || 0;
        return {
          productId: item.productId,
          quantity: item.quantity || 1,
          discount: itemDiscount,
          tax: quotationData.includeGst
            ? parseFloat(quotationData.gstValue) || 0
            : 0,
          total: parseFloat((itemSubtotal - itemDiscount).toFixed(2)),
        };
      }),
    };

    try {
      await createQuotation(quotationPayload).unwrap();
      await clearCart({ userId }).unwrap();
      resetForm();
      navigate("/quotations/list");
    } catch (error) {
      toast.error(
        `Failed to create quotation: ${
          error.data?.message || error.message || "Unknown error"
        }`
      );
    }
  };

  return (
    <CartSummaryCard>
      <Title level={3} style={{ fontSize: "18px" }}>
        Quotation Details
      </Title>
      <Divider />
      <Text strong>Select Customer</Text>
      <CustomerSelect
        value={selectedCustomer}
        onChange={setSelectedCustomer}
        placeholder="Select a customer"
        loading={customersLoading}
        disabled={customersLoading}
        aria-label="Select customer"
      >
        {customersLoading ? (
          <Option disabled>Select a customer</Option>
        ) : customerList.length === 0 ? (
          <Option disabled>No customers available</Option>
        ) : (
          customerList.map((customer) => (
            <Option key={customer.customerId} value={customer.customerId}>
              {customer.name} ({customer.email})
            </Option>
          ))
        )}
      </CustomerSelect>
      <Button
        type="link"
        icon={<UserAddOutlined />}
        onClick={() => navigate("/customers/add")}
      >
        Add New Customer
      </Button>
      <Divider />
      <Text strong>Shipping Address</Text>
      <Select
        value={quotationData.shipTo}
        onChange={(value) => handleQuotationChange("shipTo", value)}
        placeholder="Select shipping address"
        loading={addressesLoading}
        disabled={addressesLoading || !selectedCustomer}
        style={{ width: "100%", marginTop: 8 }}
        aria-label="Select shipping address"
      >
        {addressesLoading ? (
          <Option disabled>Select Shipping Address</Option>
        ) : addresses.length === 0 ? (
          <Option disabled>No addresses available</Option>
        ) : (
          addresses.map((address) => (
            <Option key={address.addressId} value={address.addressId}>
              {`${address.street}, ${address.city}${
                address.state ? `, ${address.state}` : ""
              }, ${address.country}`}
            </Option>
          ))
        )}
      </Select>
      <Button
        type="link"
        icon={<UserAddOutlined />}
        onClick={() => setShowAddAddressModal(true)}
        style={{ padding: 0, marginTop: 8 }}
        aria-label="Add new address"
        disabled={!selectedCustomer}
      >
        Add New Address
      </Button>
      <Divider />
      <Text strong>Quotation Date</Text>
      <input
        type="date"
        className="form-control"
        value={quotationData.quotationDate}
        onChange={(e) => handleQuotationChange("quotationDate", e.target.value)}
        style={{ marginTop: 8, width: "100%" }}
      />
      <Text strong>Due Date</Text>
      <input
        type="date"
        className="form-control"
        value={quotationData.dueDate}
        onChange={(e) => handleQuotationChange("dueDate", e.target.value)}
        style={{ marginTop: 8, width: "100%" }}
      />
      {error && (
        <Alert message={error} type="error" showIcon style={{ marginTop: 8 }} />
      )}
      <Divider />
      <Text strong>Include GST</Text>
      <div>
        <input
          type="checkbox"
          checked={quotationData.includeGst}
          onChange={(e) =>
            handleQuotationChange("includeGst", e.target.checked)
          }
          className="form-check-input"
        />
      </div>
      {quotationData.includeGst && (
        <>
          <Text strong>GST Value (%)</Text>
          <input
            type="number"
            className="form-control"
            value={quotationData.gstValue}
            onChange={(e) => handleQuotationChange("gstValue", e.target.value)}
            min="0"
            style={{ marginTop: 8, width: "100%" }}
          />
        </>
      )}
      <Divider />
      <Text strong>Discount Type</Text>
      <Select
        value={quotationData.discountType}
        onChange={(value) => handleQuotationChange("discountType", value)}
        style={{ width: "100%", marginTop: 8 }}
      >
        <Option value="percent">Percent</Option>
        <Option value="fixed">Fixed</Option>
      </Select>
      <Divider />
      <Text strong>Round Off</Text>
      <input
        type="number"
        className="form-control"
        value={quotationData.roundOff}
        onChange={(e) => handleQuotationChange("roundOff", e.target.value)}
        style={{ marginTop: 8, width: "100%" }}
      />
      <Button
        id="quotation-submit"
        style={{ display: "none" }}
        onClick={handleCreateQuotation}
      />
    </CartSummaryCard>
  );
};

QuotationForm.propTypes = {
  selectedCustomer: PropTypes.string,
  setSelectedCustomer: PropTypes.func.isRequired,
  quotationData: PropTypes.object.isRequired,
  setQuotationData: PropTypes.func.isRequired,
  itemDiscounts: PropTypes.object.isRequired,
  cartItems: PropTypes.array.isRequired,
  userId: PropTypes.string,
  quotationNumber: PropTypes.string.isRequired,
  totalAmount: PropTypes.number.isRequired,
  setError: PropTypes.func.isRequired,
  error: PropTypes.string,
  setShowAddAddressModal: PropTypes.func.isRequired,
  resetForm: PropTypes.func.isRequired,
  setActiveTab: PropTypes.func.isRequired,
};

export default QuotationForm;
