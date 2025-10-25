import React, { useState, useEffect, useMemo } from "react";
import {
  Card,
  Button,
  Select,
  InputNumber,
  Alert,
  Row,
  Col,
  Empty,
  Typography,
  DatePicker,
  Space,
  Divider,
} from "antd";
import {
  UserAddOutlined,
  CheckCircleOutlined,
  ArrowLeftOutlined,
  DeleteOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import { FcEmptyTrash } from "react-icons/fc";
import styled from "styled-components";
import OrderTotal from "./OrderTotal";
import { toast } from "sonner";
import { debounce } from "lodash";
import { useCreateAddressMutation } from "../../api/addressApi";
import moment from "moment";
import PropTypes from "prop-types";

const { Text } = Typography;
const { Option } = Select;

// Styled Components
const CartSummaryCard = styled(Card)`
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 16px;
  position: sticky;
  top: 16px;
  @media (min-width: 768px) {
    top: 20px;
  }
`;

const FormContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const FormSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const EmptyCartWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px 0;
  @media (min-width: 768px) {
    padding: 40px 0;
  }
`;

const CustomerSelect = styled(Select)`
  width: 100%;
`;

const CheckoutButton = styled(Button)`
  background: #e31e24;
  border-color: #e31e24;
  &:hover {
    background: #ff4d4f;
    border-color: #ff4d4f;
  }
`;

const ActionButton = styled(Button)`
  padding: 0;
  height: auto;
`;

const DiscountContainer = styled.div`
  display: flex;
  gap: 8px;
`;

const QuotationForm = ({
  quotationData,
  setQuotationData,
  handleQuotationChange,
  selectedCustomer,
  setSelectedCustomer,
  customers,
  customersLoading,
  customersError,
  addresses,
  addressesLoading,
  addressesError,
  userMap,
  customerMap,
  userQueries,
  customerQueries,
  error,
  quotationNumber,
  documentType,
  setDocumentType,
  cartItems,
  totalAmount,
  shipping,
  tax,
  discount,
  roundOff,
  subTotal,
  handleAddCustomer,
  handleAddAddress,
  setActiveTab,
  handleCreateDocument,
  useBillingAddress,
  setUseBillingAddress,
  itemDiscounts,
  itemTaxes,
}) => {
  const [isCreatingAddress, setIsCreatingAddress] = useState(false);
  const [createAddress] = useCreateAddressMutation();

  // Find the selected customer's default address (prefer BILLING)
  const selectedCustomerData = useMemo(
    () =>
      customers.find((customer) => customer.customerId === selectedCustomer),
    [customers, selectedCustomer]
  );
  const defaultAddress = useMemo(() => {
    const billingAddress = addresses.find(
      (addr) =>
        addr.customerId === selectedCustomer && addr.status === "BILLING"
    );
    return billingAddress || selectedCustomerData?.address || null;
  }, [selectedCustomerData, addresses, selectedCustomer]);

  // Filter addresses for the selected customer
  const filteredAddresses = useMemo(
    () =>
      addresses.filter((address) => address.customerId === selectedCustomer),
    [addresses, selectedCustomer]
  );

  // Debounce toast
  const debouncedToast = useMemo(
    () =>
      debounce((message) => {
        toast.warning(message);
      }, 500),
    []
  );

  // Normalize address fields for comparison
  const normalizeString = (str) => (str ? str.trim().toLowerCase() : "");

  // Sync shipTo with default address when useBillingAddress is true
  useEffect(() => {
    if (useBillingAddress && defaultAddress && selectedCustomer) {
      const matchingAddress = filteredAddresses.find((addr) => {
        return (
          normalizeString(addr.street) ===
            normalizeString(defaultAddress.street) &&
          normalizeString(addr.city) === normalizeString(defaultAddress.city) &&
          normalizeString(addr.state) ===
            normalizeString(defaultAddress.state) &&
          normalizeString(addr.postalCode || addr.zip || "") ===
            normalizeString(
              defaultAddress.postalCode || defaultAddress.zip || ""
            ) &&
          normalizeString(addr.country || "India") ===
            normalizeString(defaultAddress.country || "India")
        );
      });

      if (matchingAddress) {
        handleQuotationChange("shipTo", matchingAddress.addressId);
      } else {
        setIsCreatingAddress(true);
        const createBillingAddress = async () => {
          try {
            const newAddress = {
              customerId: selectedCustomer,
              street: defaultAddress.street || "",
              city: defaultAddress.city || "",
              state: defaultAddress.state || "",
              postalCode: defaultAddress.postalCode || defaultAddress.zip || "",
              country: defaultAddress.country || "India",
              status: "BILLING",
            };
            const result = await createAddress(newAddress).unwrap();
            handleQuotationChange("shipTo", result.addressId);
            debouncedToast("Billing address created successfully.");
          } catch (err) {
            debouncedToast(
              `Failed to create billing address: ${
                err.data?.message || "Unknown error"
              }`
            );
          } finally {
            setIsCreatingAddress(false);
          }
        };
        createBillingAddress();
      }
    } else if (
      selectedCustomer &&
      filteredAddresses.length === 1 &&
      !quotationData.shipTo
    ) {
      // Auto-select the only available address
      handleQuotationChange("shipTo", filteredAddresses[0].addressId);
    } else if (
      !useBillingAddress &&
      quotationData.shipTo &&
      filteredAddresses.length === 0
    ) {
      // Clear shipTo if no addresses are available
      handleQuotationChange("shipTo", null);
    }
  }, [
    useBillingAddress,
    defaultAddress,
    filteredAddresses,
    handleQuotationChange,
    selectedCustomer,
    createAddress,
    debouncedToast,
  ]);

  // Follow-up dates handlers
  const validateFollowupDates = () => {
    if (!quotationData.dueDate || quotationData.followupDates.length === 0)
      return true;

    const dueDate = moment(quotationData.dueDate);
    return quotationData.followupDates.every((followupDate) => {
      if (!followupDate || new Date(followupDate).toString() === "Invalid Date")
        return true;
      return moment(followupDate).isSameOrBefore(dueDate, "day");
    });
  };

  const handleFollowupDateChange = (index, date) => {
    const updatedDates = [...quotationData.followupDates];
    updatedDates[index] = date ? date.format("YYYY-MM-DD") : "";

    if (
      quotationData.dueDate &&
      date &&
      moment(date).isAfter(moment(quotationData.dueDate), "day")
    ) {
      toast.warning(`Timeline date ${index + 1} cannot be after the due date.`);
    }
    if (date && moment(date).isBefore(moment().startOf("day"))) {
      toast.warning(`Timeline date ${index + 1} cannot be before today.`);
    }

    handleQuotationChange("followupDates", updatedDates);
  };

  const addFollowupDate = () => {
    handleQuotationChange("followupDates", [
      ...quotationData.followupDates,
      "",
    ]);
  };

  const removeFollowupDate = (index) => {
    handleQuotationChange(
      "followupDates",
      quotationData.followupDates.filter((_, i) => i !== index)
    );
  };

  // Handle address selection
  const handleAddressChange = (value) => {
    if (value === "sameAsBilling") {
      setUseBillingAddress(true);
      // shipTo will be set by useEffect
    } else {
      setUseBillingAddress(false);
      handleQuotationChange("shipTo", value);
    }
  };
  // Handle discount type change
  const handleDiscountTypeChange = (value) => {
    handleQuotationChange("discountType", value);
    handleQuotationChange("discountAmount", "");
  };

  return (
    <Row gutter={[16, 16]} justify="center">
      <Col xs={24} sm={24} md={16} lg={16}>
        <CartSummaryCard>
          {cartItems.length === 0 ? (
            <EmptyCartWrapper>
              <Empty
                description="Your cart is empty"
                image={<FcEmptyTrash style={{ fontSize: 64 }} />}
              />
              <Button
                type="primary"
                icon={<ArrowLeftOutlined />}
                onClick={() => setActiveTab("cart")}
                style={{ marginTop: 16 }}
                aria-label="Back to cart"
              >
                Back to Cart
              </Button>
            </EmptyCartWrapper>
          ) : (
            <FormContainer>
              <Text strong style={{ fontSize: "18px" }}>
                Checkout
              </Text>
              <FormSection>
                <Text strong>Document Type</Text>
                <Select
                  value={documentType}
                  onChange={setDocumentType}
                  placeholder="Select document type"
                  aria-label="Select document type"
                >
                  <Option value="Quotation">Quotation</Option>
                  <Option value="Order">Order</Option>
                  <Option value="Purchase Order">Purchase Order</Option>
                </Select>
              </FormSection>

              <FormSection>
                <Text strong>
                  Customer <span style={{ color: "red" }}>*</span>
                </Text>
                <Space direction="vertical" style={{ width: "100%" }}>
                  <CustomerSelect
                    value={selectedCustomer}
                    onChange={(value) => {
                      setSelectedCustomer(value);
                      setQuotationData((prev) => ({ ...prev, shipTo: null }));
                      setUseBillingAddress(false);
                    }}
                    placeholder="Select a customer"
                    loading={customersLoading}
                    disabled={customersLoading || customersError}
                    aria-label="Select customer"
                  >
                    {customersLoading ? (
                      <Option disabled>Loading customers...</Option>
                    ) : customersError ? (
                      <Option disabled>Error fetching customers</Option>
                    ) : customers.length === 0 ? (
                      <Option disabled>No customers available</Option>
                    ) : (
                      customers.map((customer) => (
                        <Option
                          key={customer.customerId}
                          value={customer.customerId}
                        >
                          {customer.name} ({customer.email})
                        </Option>
                      ))
                    )}
                  </CustomerSelect>
                  <ActionButton
                    type="link"
                    icon={<UserAddOutlined />}
                    onClick={handleAddCustomer}
                    aria-label="Add new customer"
                  >
                    Add New Customer
                  </ActionButton>
                </Space>
              </FormSection>

              <FormSection>
                <Text strong>
                  Shipping Address <span style={{ color: "red" }}>*</span>
                </Text>
                <Space direction="vertical" style={{ width: "100%" }}>
                  <Select
                    value={
                      useBillingAddress
                        ? "sameAsBilling"
                        : quotationData.shipTo ||
                          (filteredAddresses.length === 1
                            ? filteredAddresses[0].addressId
                            : undefined)
                    }
                    onChange={handleAddressChange}
                    placeholder="Select shipping address"
                    loading={addressesLoading || isCreatingAddress}
                    disabled={
                      !selectedCustomer ||
                      addressesLoading ||
                      addressesError ||
                      isCreatingAddress ||
                      filteredAddresses.length === 0
                    }
                    aria-label="Select shipping address"
                    onDropdownVisibleChange={(open) => {
                      if (
                        !open &&
                        useBillingAddress &&
                        defaultAddress &&
                        !quotationData.shipTo
                      ) {
                        const matchingAddress = filteredAddresses.find(
                          (addr) => {
                            return (
                              normalizeString(addr.street) ===
                                normalizeString(defaultAddress.street) &&
                              normalizeString(addr.city) ===
                                normalizeString(defaultAddress.city) &&
                              normalizeString(addr.state) ===
                                normalizeString(defaultAddress.state) &&
                              normalizeString(
                                addr.postalCode || addr.zip || ""
                              ) ===
                                normalizeString(
                                  defaultAddress.postalCode ||
                                    defaultAddress.zip ||
                                    ""
                                ) &&
                              normalizeString(addr.country || "India") ===
                                normalizeString(
                                  defaultAddress.country || "India"
                                )
                            );
                          }
                        );
                        if (matchingAddress) {
                          handleQuotationChange(
                            "shipTo",
                            matchingAddress.addressId
                          );
                        }
                      }
                    }}
                  >
                    {selectedCustomer && defaultAddress && (
                      <Option value="sameAsBilling">
                        Same as Billing Address
                      </Option>
                    )}
                    {!selectedCustomer ? (
                      <Option disabled>Please select a customer first</Option>
                    ) : addressesLoading || isCreatingAddress ? (
                      <Option disabled>Loading addresses...</Option>
                    ) : addressesError ? (
                      <Option disabled>
                        Error fetching addresses:{" "}
                        {addressesError?.data?.message || "Unknown error"}
                      </Option>
                    ) : filteredAddresses.length === 0 ? (
                      <Option disabled>
                        No addresses available for this customer
                      </Option>
                    ) : (
                      filteredAddresses.map((address) => {
                        const customerName =
                          customerMap[address.customerId]?.name ||
                          "Unknown Customer";
                        const addressLabel = `${address.street}, ${
                          address.city
                        }, ${address.state}, ${
                          address.postalCode || address.zip
                        }, ${address.country || "India"} (${address.status})`;
                        return (
                          <Option
                            key={address.addressId}
                            value={address.addressId}
                          >
                            {addressLabel}
                          </Option>
                        );
                      })
                    )}
                  </Select>
                  {useBillingAddress && defaultAddress && (
                    <Text>
                      <strong>Billing Address:</strong>{" "}
                      {`${defaultAddress.street}, ${defaultAddress.city}, ${
                        defaultAddress.state
                      }, ${
                        defaultAddress.postalCode || defaultAddress.zip || ""
                      }${
                        defaultAddress.country
                          ? `, ${defaultAddress.country}`
                          : ""
                      }`}
                    </Text>
                  )}
                  <ActionButton
                    type="link"
                    icon={<UserAddOutlined />}
                    onClick={handleAddAddress}
                    disabled={!selectedCustomer || isCreatingAddress}
                    aria-label="Add new address"
                  >
                    Add New Address
                  </ActionButton>
                </Space>
              </FormSection>

              <FormSection>
                <Text strong>Quotation/Order Date</Text>
                <DatePicker
                  value={
                    quotationData.quotationDate
                      ? moment(quotationData.quotationDate)
                      : null
                  }
                  onChange={(date) =>
                    handleQuotationChange(
                      "quotationDate",
                      date ? date.format("YYYY-MM-DD") : ""
                    )
                  }
                  format="YYYY-MM-DD"
                  style={{ width: "100%" }}
                  aria-label="Select quotation date"
                />
              </FormSection>

              <FormSection>
                <Text strong>
                  Due Date <span style={{ color: "red" }}>*</span>
                </Text>
                <DatePicker
                  value={
                    quotationData.dueDate ? moment(quotationData.dueDate) : null
                  }
                  onChange={(date) =>
                    handleQuotationChange(
                      "dueDate",
                      date ? date.format("YYYY-MM-DD") : ""
                    )
                  }
                  format="YYYY-MM-DD"
                  disabledDate={(current) =>
                    current && current < moment().startOf("day")
                  }
                  style={{ width: "100%" }}
                  aria-label="Select due date"
                />
              </FormSection>

              <FormSection>
                <Text strong>Timeline Dates</Text>
                {quotationData.followupDates.map((date, index) => (
                  <Space key={index} align="center" style={{ width: "100%" }}>
                    <DatePicker
                      value={date ? moment(date) : null}
                      onChange={(date) => handleFollowupDateChange(index, date)}
                      format="YYYY-MM-DD"
                      disabledDate={(current) =>
                        current &&
                        (current < moment().startOf("day") ||
                          (quotationData.dueDate &&
                            current >
                              moment(quotationData.dueDate).endOf("day")))
                      }
                      style={{ width: "100%" }}
                      aria-label={`Select timeline date ${index + 1}`}
                    />
                    <Button
                      type="text"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => removeFollowupDate(index)}
                      aria-label="Remove timeline date"
                    />
                  </Space>
                ))}
                <Button
                  type="primary"
                  onClick={addFollowupDate}
                  icon={<PlusOutlined />}
                  aria-label="Add timeline date"
                >
                  Add Timeline Date
                </Button>
              </FormSection>

              <FormSection>
                <Text strong>Discount (if any)</Text>
                <DiscountContainer>
                  <Select
                    value={quotationData.discountType}
                    onChange={handleDiscountTypeChange}
                    style={{ width: 120 }}
                    aria-label="Select discount type"
                  >
                    <Option value="percent">Percentage</Option>
                    <Option value="fixed">Fixed</Option>
                  </Select>
                  <InputNumber
                    value={quotationData.discountAmount}
                    onChange={(value) =>
                      handleQuotationChange("discountAmount", value)
                    }
                    min={0}
                    placeholder={
                      quotationData.discountType === "percent"
                        ? "Enter discount percentage"
                        : "Enter discount amount"
                    }
                    style={{ flex: 1 }}
                    aria-label={
                      quotationData.discountType === "percent"
                        ? "Enter discount percentage"
                        : "Enter discount amount"
                    }
                  />
                </DiscountContainer>
              </FormSection>

              <FormSection>
                <Text strong>Round Off</Text>
                <InputNumber
                  value={quotationData.roundOff}
                  onChange={(value) => handleQuotationChange("roundOff", value)}
                  placeholder="Enter round off amount"
                  style={{ width: "100%" }}
                  aria-label="Enter round off amount"
                />
              </FormSection>

              {error && <Alert message={error} type="error" showIcon />}
            </FormContainer>
          )}
        </CartSummaryCard>
      </Col>
      <Col xs={24} sm={24} md={8} lg={8}>
        <CartSummaryCard>
          <Text strong>Quotation #: {quotationNumber}</Text>
          <Divider />
          <OrderTotal
            shipping={shipping}
            tax={tax}
            coupon={0}
            discount={discount}
            roundOff={roundOff}
            subTotal={subTotal}
            items={cartItems.map((item) => ({
              productId: item.productId,
              name: item.name,
              discount: parseFloat(itemDiscounts[item.productId]) || 0,
              tax: parseFloat(itemTaxes[item.productId]) || 0,
              price: item.price || 0,
              quantity: item.quantity || 1,
            }))}
          />
          <Divider />
          <CheckoutButton
            type="primary"
            icon={<CheckCircleOutlined />}
            onClick={() => {
              if (!validateFollowupDates()) {
                toast.error("Timeline dates cannot be after the due date.");
                return;
              }
              handleCreateDocument();
            }}
            disabled={
              cartItems.length === 0 ||
              !selectedCustomer ||
              error ||
              !quotationData.quotationDate ||
              !quotationData.dueDate ||
              (!quotationData.shipTo && !(useBillingAddress && defaultAddress))
            }
            block
            size="large"
            aria-label="Create quotation"
          >
            Create Quotation
          </CheckoutButton>
          <Button
            type="default"
            onClick={() => setActiveTab("cart")}
            block
            style={{ marginTop: 8 }}
            aria-label="Back to cart"
          >
            Back to Cart
          </Button>
        </CartSummaryCard>
      </Col>
    </Row>
  );
};

QuotationForm.propTypes = {
  quotationData: PropTypes.shape({
    quotationDate: PropTypes.string,
    dueDate: PropTypes.string,
    billTo: PropTypes.string,
    shipTo: PropTypes.string,
    signatureName: PropTypes.string,
    discountType: PropTypes.oneOf(["percent", "fixed"]),
    discountAmount: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    roundOff: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    followupDates: PropTypes.arrayOf(PropTypes.string),
  }).isRequired,
  setQuotationData: PropTypes.func.isRequired,
  handleQuotationChange: PropTypes.func.isRequired,
  selectedCustomer: PropTypes.string,
  setSelectedCustomer: PropTypes.func.isRequired,
  customers: PropTypes.arrayOf(
    PropTypes.shape({
      customerId: PropTypes.string,
      name: PropTypes.string,
      email: PropTypes.string,
      address: PropTypes.object,
    })
  ).isRequired,
  customersLoading: PropTypes.bool.isRequired,
  customersError: PropTypes.object,
  addresses: PropTypes.arrayOf(
    PropTypes.shape({
      addressId: PropTypes.string,
      customerId: PropTypes.string,
      street: PropTypes.string,
      city: PropTypes.string,
      state: PropTypes.string,
      postalCode: PropTypes.string,
      country: PropTypes.string,
      status: PropTypes.string,
    })
  ).isRequired,
  addressesLoading: PropTypes.bool.isRequired,
  addressesError: PropTypes.object,
  userMap: PropTypes.object.isRequired,
  customerMap: PropTypes.object.isRequired,
  userQueries: PropTypes.array.isRequired,
  customerQueries: PropTypes.array.isRequired,
  error: PropTypes.string,
  quotationNumber: PropTypes.string.isRequired,
  documentType: PropTypes.string.isRequired,
  setDocumentType: PropTypes.func.isRequired,
  cartItems: PropTypes.arrayOf(
    PropTypes.shape({
      productId: PropTypes.string,
      name: PropTypes.string,
      price: PropTypes.number,
      quantity: PropTypes.number,
    })
  ).isRequired,
  totalAmount: PropTypes.number.isRequired,
  shipping: PropTypes.number.isRequired,
  tax: PropTypes.number.isRequired,
  discount: PropTypes.number.isRequired,
  roundOff: PropTypes.number.isRequired,
  subTotal: PropTypes.number.isRequired,
  handleAddCustomer: PropTypes.func.isRequired,
  handleAddAddress: PropTypes.func.isRequired,
  setActiveTab: PropTypes.func.isRequired,
  handleCreateDocument: PropTypes.func.isRequired,
  useBillingAddress: PropTypes.bool.isRequired,
  setUseBillingAddress: PropTypes.func.isRequired,
  itemDiscounts: PropTypes.object.isRequired,
  itemTaxes: PropTypes.object.isRequired,
};

export default React.memo(QuotationForm);
