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
import DatePicker from "react-datepicker"; // ← NEW
import "react-datepicker/dist/react-datepicker.css"; // ← NEW
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

// Main Component
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

  // === Customer & Address Logic ===
  const selectedCustomerData = useMemo(
    () => customers.find((c) => c.customerId === selectedCustomer),
    [customers, selectedCustomer]
  );

  const defaultAddress = useMemo(() => {
    const billing = addresses.find(
      (a) => a.customerId === selectedCustomer && a.status === "BILLING"
    );
    return billing || selectedCustomerData?.address || null;
  }, [selectedCustomerData, addresses, selectedCustomer]);

  const filteredAddresses = useMemo(
    () => addresses.filter((a) => a.customerId === selectedCustomer),
    [addresses, selectedCustomer]
  );

  const debouncedToast = useMemo(
    () => debounce((msg) => toast.warning(msg), 500),
    []
  );
  // Inside QuotationForm
  const extraDiscount = useMemo(() => {
    const amount = parseFloat(quotationData.discountAmount) || 0;
    if (!amount) return 0;

    if (quotationData.discountType === "percent") {
      return parseFloat(((subTotal * amount) / 100).toFixed(2));
    }
    return amount;
  }, [quotationData.discountType, quotationData.discountAmount, subTotal]);
  const normalizeString = (str) => (str ? str.trim().toLowerCase() : "");

  // Sync shipTo with billing address
  useEffect(() => {
    if (useBillingAddress && defaultAddress && selectedCustomer) {
      const match = filteredAddresses.find((addr) => {
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

      if (match) {
        handleQuotationChange("shipTo", match.addressId);
      } else {
        setIsCreatingAddress(true);
        const createBilling = async () => {
          try {
            const newAddr = {
              customerId: selectedCustomer,
              street: defaultAddress.street || "",
              city: defaultAddress.city || "",
              state: defaultAddress.state || "",
              postalCode: defaultAddress.postalCode || defaultAddress.zip || "",
              country: defaultAddress.country || "India",
              status: "BILLING",
            };
            const result = await createAddress(newAddr).unwrap();
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
        createBilling();
      }
    } else if (
      selectedCustomer &&
      filteredAddresses.length === 1 &&
      !quotationData.shipTo
    ) {
      handleQuotationChange("shipTo", filteredAddresses[0].addressId);
    } else if (
      !useBillingAddress &&
      quotationData.shipTo &&
      filteredAddresses.length === 0
    ) {
      handleQuotationChange("shipTo", null);
    }
  }, [
    useBillingAddress,
    defaultAddress,
    filteredAddresses,
    selectedCustomer,
    createAddress,
    debouncedToast,
    handleQuotationChange,
  ]);

  // === Follow-up Dates ===
  const validateFollowupDates = () => {
    if (!quotationData.dueDate || quotationData.followupDates.length === 0)
      return true;
    const due = moment(quotationData.dueDate);
    return quotationData.followupDates.every((d) => {
      if (!d || new Date(d).toString() === "Invalid Date") return true;
      return moment(d).isSameOrBefore(due, "day");
    });
  };

  const handleFollowupDateChange = (index, date) => {
    const updated = [...quotationData.followupDates];
    updated[index] = date ? date.format("YYYY-MM-DD") : "";

    if (
      quotationData.dueDate &&
      date &&
      moment(date).isAfter(quotationData.dueDate, "day")
    ) {
      toast.warning(`Follow-up date ${index + 1} cannot be after due date.`);
    }
    if (date && moment(date).isBefore(moment().startOf("day"))) {
      toast.warning(`Follow-up date ${index + 1} cannot be in the past.`);
    }

    handleQuotationChange("followupDates", updated);
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
  const getOrCreateBillingAddress = async () => {
    if (!selectedCustomer || !selectedCustomerData?.address) return null;

    const primary = selectedCustomerData.address;

    const existing = filteredAddresses.find((a) => {
      return (
        a.status === "BILLING" &&
        normalizeString(a.street) === normalizeString(primary.street) &&
        normalizeString(a.city) === normalizeString(primary.city) &&
        normalizeString(a.state) === normalizeString(primary.state) &&
        normalizeString(a.postalCode || a.zip || "") ===
          normalizeString(primary.postalCode || primary.zip || "") &&
        normalizeString(a.country || "India") ===
          normalizeString(primary.country || "India")
      );
    });

    if (existing) return existing.addressId;

    setIsCreatingAddress(true);
    try {
      const payload = {
        customerId: selectedCustomer,
        street: primary.street || "",
        city: primary.city || "",
        state: primary.state || "",
        postalCode: primary.postalCode || primary.zip || "",
        country: primary.country || "India",
        status: "BILLING",
      };
      const { addressId } = await createAddress(payload).unwrap();
      toast.success("Billing address created from primary address.");
      return addressId;
    } catch (err) {
      toast.error(
        `Failed to create billing address: ${err?.data?.message || err}`
      );
      return null;
    } finally {
      setIsCreatingAddress(false);
    }
  };
  // === Address & Discount Handlers ===
  const handleAddressChange = (value) => {
    if (value === "sameAsBilling") {
      setUseBillingAddress(true);
    } else {
      setUseBillingAddress(false);
      handleQuotationChange("shipTo", value);
    }
  };

  const handleDiscountTypeChange = (value) => {
    handleQuotationChange("discountType", value);
    handleQuotationChange("discountAmount", "");
  };
  // === Smart Round-Off: Last digit → 0 or 5 ===
  useEffect(() => {
    const baseAmount = subTotal + shipping + tax - discount - extraDiscount;
    const totalInPaise = Math.round(baseAmount * 100); // Work in paise for precision

    const rupees = Math.floor(totalInPaise / 100);
    const lastDigit = rupees % 10;

    let targetRupees;
    if (lastDigit <= 4) {
      targetRupees = rupees - lastDigit; // e.g., 1023 → 1020
    } else if (lastDigit >= 6) {
      targetRupees = rupees + (10 - lastDigit); // e.g., 1027 → 1030
    } else {
      targetRupees = rupees; // lastDigit is 5 → keep
    }

    const targetTotal = targetRupees;
    const roundOffValue = parseFloat((targetTotal - baseAmount).toFixed(2));

    handleQuotationChange("roundOff", roundOffValue);
  }, [subTotal, shipping, tax, discount, extraDiscount, handleQuotationChange]);
  const finalRoundedTotal = useMemo(() => {
    const base = subTotal + shipping + tax - discount - extraDiscount;
    const totalInPaise = Math.round(base * 100);
    const rupees = Math.floor(totalInPaise / 100);
    const lastDigit = rupees % 10;

    if (lastDigit <= 4) {
      return rupees - lastDigit;
    } else if (lastDigit >= 6) {
      return rupees + (10 - lastDigit);
    } else {
      return rupees;
    }
  }, [subTotal, shipping, tax, discount, extraDiscount]);
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

              {/* Document Type */}
              <FormSection>
                <Text strong>Document Type</Text>
                <Select
                  value={documentType}
                  onChange={setDocumentType}
                  placeholder="Select document type"
                >
                  <Option value="Quotation">Quotation</Option>
                  <Option value="Order">Order</Option>
                  <Option value="Purchase Order">Purchase Order</Option>
                </Select>
              </FormSection>

              {/* Customer */}
              <FormSection>
                <Text strong>
                  Customer <span style={{ color: "red" }}>*</span>
                </Text>
                <Space direction="vertical" style={{ width: "100%" }}>
                  <CustomerSelect
                    value={selectedCustomer}
                    onChange={(val) => {
                      setSelectedCustomer(val);
                      setQuotationData((prev) => ({ ...prev, shipTo: null }));
                      setUseBillingAddress(false);
                    }}
                    placeholder="Select a customer"
                    loading={customersLoading}
                    disabled={customersLoading || customersError}
                  >
                    {customersLoading ? (
                      <Option disabled>Loading...</Option>
                    ) : customersError ? (
                      <Option disabled>Error loading customers</Option>
                    ) : customers.length === 0 ? (
                      <Option disabled>No customers</Option>
                    ) : (
                      customers.map((c) => (
                        <Option key={c.customerId} value={c.customerId}>
                          {c.name} ({c.email})
                        </Option>
                      ))
                    )}
                  </CustomerSelect>
                  <ActionButton
                    type="link"
                    icon={<UserAddOutlined />}
                    onClick={handleAddCustomer}
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
                    onChange={async (val) => {
                      if (val === "sameAsBilling") {
                        setUseBillingAddress(true);
                        const newAddrId = await getOrCreateBillingAddress();
                        if (newAddrId) {
                          handleQuotationChange("shipTo", newAddrId);
                        }
                      } else {
                        setUseBillingAddress(false);
                        handleQuotationChange("shipTo", val);
                      }
                    }}
                    placeholder="Select shipping address"
                    loading={addressesLoading || isCreatingAddress}
                    disabled={
                      !selectedCustomer ||
                      addressesLoading ||
                      addressesError ||
                      isCreatingAddress
                    }
                    dropdownRender={(menu) => (
                      <>
                        {menu}
                        <Divider style={{ margin: "8px 0" }} />
                        <Space style={{ padding: "0 8px 4px" }}>
                          <ActionButton
                            type="text"
                            icon={<UserAddOutlined />}
                            onClick={handleAddAddress}
                            disabled={isCreatingAddress}
                          >
                            Add New Address
                          </ActionButton>
                        </Space>
                      </>
                    )}
                  >
                    {/* Option 1: Show "Same as Billing" if primary address exists */}
                    {selectedCustomer && selectedCustomerData?.address && (
                      <Option value="sameAsBilling">
                        Same as Billing Address
                      </Option>
                    )}

                    {/* Option 2: Show all saved addresses */}
                    {filteredAddresses.length > 0 ? (
                      filteredAddresses.map((addr) => {
                        const label = `${addr.street}, ${addr.city}, ${
                          addr.state
                        }, ${addr.postalCode || addr.zip || ""}, ${
                          addr.country || "India"
                        } (${addr.status})`;
                        return (
                          <Option key={addr.addressId} value={addr.addressId}>
                            {label}
                          </Option>
                        );
                      })
                    ) : (
                      <Option disabled>No saved addresses</Option>
                    )}
                  </Select>

                  {/* Show preview of primary address when "Same as Billing" is selected */}
                  {useBillingAddress && selectedCustomerData?.address && (
                    <Text type="secondary">
                      <strong>Billing (from customer):</strong>{" "}
                      {`${selectedCustomerData.address.street}, ${
                        selectedCustomerData.address.city
                      }, ${selectedCustomerData.address.state}, ${
                        selectedCustomerData.address.postalCode ||
                        selectedCustomerData.address.zip ||
                        ""
                      }${
                        selectedCustomerData.address.country
                          ? `, ${selectedCustomerData.address.country}`
                          : ""
                      }`}
                    </Text>
                  )}

                  {/* Show preview of selected saved address */}
                  {!useBillingAddress && quotationData.shipTo && (
                    <Text type="secondary">
                      <strong>Shipping:</strong>{" "}
                      {(() => {
                        const addr = filteredAddresses.find(
                          (a) => a.addressId === quotationData.shipTo
                        );
                        return addr
                          ? `${addr.street}, ${addr.city}, ${addr.state}, ${
                              addr.postalCode || addr.zip || ""
                            }, ${addr.country || "India"}`
                          : "—";
                      })()}
                    </Text>
                  )}
                </Space>
              </FormSection>
              <FormSection>
                <Text strong>
                  Due Date <span style={{ color: "red" }}>*</span>
                </Text>

                <DatePicker
                  selected={
                    quotationData.dueDate
                      ? new Date(quotationData.dueDate)
                      : null
                  }
                  onChange={(date) => {
                    const dateStr = date
                      ? moment(date).format("YYYY-MM-DD")
                      : "";
                    handleQuotationChange("dueDate", dateStr);
                  }}
                  dateFormat="yyyy-MM-dd"
                  minDate={new Date()} // disables past dates
                  placeholderText="Select due date"
                  className="ant-input" // makes it look like AntD input
                  wrapperClassName="full-width"
                  popperClassName="custom-datepicker-popper"
                  showPopperArrow={false}
                  customInput={<input style={{ width: "100%" }} />}
                />
              </FormSection>
              {/* Follow-up Dates */}
              <FormSection>
                <Text strong>Follow-up Dates</Text>
                {quotationData.followupDates.map((date, i) => (
                  <Space key={i} style={{ width: "100%" }}>
                    <DatePicker
                      selected={date ? new Date(date) : null}
                      onChange={(d) =>
                        handleFollowupDateChange(i, d ? moment(d) : null)
                      }
                      dateFormat="yyyy-MM-dd"
                      minDate={new Date()}
                      maxDate={
                        quotationData.dueDate
                          ? new Date(quotationData.dueDate)
                          : null
                      }
                      placeholderText="Follow-up date"
                      className="ant-input"
                      customInput={<input style={{ width: "100%" }} />}
                    />
                    <Button
                      type="text"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => removeFollowupDate(i)}
                    />
                  </Space>
                ))}
                <Button
                  type="primary"
                  onClick={addFollowupDate}
                  icon={<PlusOutlined />}
                >
                  Add Follow-up
                </Button>
              </FormSection>

              {/* Discount */}

              <FormSection>
                <Text strong>Extra Discount (on total)</Text>
                <DiscountContainer>
                  <Select
                    value={quotationData.discountType}
                    onChange={handleDiscountTypeChange}
                    style={{ width: 120 }}
                  >
                    <Option value="percent">Percent</Option>
                    <Option value="fixed">Rupees</Option>
                  </Select>
                  <InputNumber
                    value={quotationData.discountAmount}
                    onChange={(v) => handleQuotationChange("discountAmount", v)}
                    min={0}
                    placeholder={
                      quotationData.discountType === "percent"
                        ? "Percent"
                        : "Rupees"
                    }
                    style={{ flex: 1 }}
                  />
                </DiscountContainer>
              </FormSection>
              {/* Auto Round Off (Disabled Input) */}
              <FormSection>
                <Text strong>Round Off (Auto)</Text>
                <InputNumber
                  value={quotationData.roundOff || 0}
                  disabled
                  prefix="₹"
                  style={{ width: "100%", backgroundColor: "#f9f9f9" }}
                />
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Auto-rounded to nearest rupee:{" "}
                  <strong>₹{finalRoundedTotal}</strong>
                </Text>
              </FormSection>

              {error && <Alert message={error} type="error" showIcon />}
            </FormContainer>
          )}
        </CartSummaryCard>
      </Col>

      {/* Summary Sidebar */}
      <Col xs={24} sm={24} md={8} lg={8}>
        <CartSummaryCard>
          <Text strong>Quotation #: {quotationNumber}</Text>
          <Divider />

          <OrderTotal
            shipping={shipping}
            tax={tax}
            coupon={0}
            discount={discount}
            extraDiscount={extraDiscount}
            roundOff={quotationData.roundOff || 0}
            subTotal={subTotal}
            finalTotal={finalRoundedTotal}
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
                toast.error("Follow-up dates cannot be after due date.");
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
          >
            Create {documentType}
          </CheckoutButton>

          <Button
            type="default"
            onClick={() => setActiveTab("cart")}
            block
            style={{ marginTop: 8 }}
          >
            Back to Cart
          </Button>
        </CartSummaryCard>
      </Col>
    </Row>
  );
};

// PropTypes
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
  customers: PropTypes.array.isRequired,
  customersLoading: PropTypes.bool.isRequired,
  customersError: PropTypes.object,
  addresses: PropTypes.array.isRequired,
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
  cartItems: PropTypes.array.isRequired,
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
