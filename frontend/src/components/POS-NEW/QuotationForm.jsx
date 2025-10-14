import React, { useState, useEffect, useMemo } from "react";
import {
  Card,
  Button,
  Select,
  Input,
  Alert,
  Divider,
  Row,
  Col,
  Empty,
  Typography,
} from "antd";
import {
  UserAddOutlined,
  CheckCircleOutlined,
  ArrowLeftOutlined,
} from "@ant-design/icons";
import { FcEmptyTrash } from "react-icons/fc";
import styled from "styled-components";
import OrderTotal from "./OrderTotal";
import { toast } from "sonner";
import { debounce } from "lodash";
import { useCreateAddressMutation } from "../../api/addressApi";

const { Text } = Typography;
const { Option } = Select;

const CartSummaryCard = styled(Card)`
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 16px;
  @media (min-width: 768px) {
    top: 20px;
  }
`;

const CheckoutButton = styled(Button)`
  background: #e31e24;
  border-color: #e31e24;
  &:hover {
    background: #e31e24;
    border-color: #e31e24;
  }
`;

const CustomerSelect = styled(Select)`
  width: 100%;
  margin-top: 8px;
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
    return (
      billingAddress ||
      selectedCustomerData?.address || // Fallback to customer.address
      null
    );
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
        const match = {
          streetMatch:
            normalizeString(addr.street) ===
            normalizeString(defaultAddress.street),
          cityMatch:
            normalizeString(addr.city) === normalizeString(defaultAddress.city),
          stateMatch:
            normalizeString(addr.state) ===
            normalizeString(defaultAddress.state),
          postalMatch:
            normalizeString(addr.postalCode || addr.zip) ===
              normalizeString(
                defaultAddress.postalCode || defaultAddress.zip
              ) ||
            normalizeString(addr.postalCode || addr.zip) ===
              normalizeString(defaultAddress.zip || defaultAddress.postalCode),
          countryMatch:
            normalizeString(addr.country || "India") ===
            normalizeString(defaultAddress.country || "India"),
        };

        return (
          match.streetMatch &&
          match.cityMatch &&
          match.stateMatch &&
          match.postalMatch &&
          match.countryMatch
        );
      });

      if (matchingAddress) {
        handleQuotationChange("shipTo", matchingAddress.addressId);
      } else {
        // Create BILLING address immediately
        setIsCreatingAddress(true);
        const createBillingAddress = async () => {
          try {
            const newAddress = {
              customerId: selectedCustomer,
              street: defaultAddress.street,
              city: defaultAddress.city,
              state: defaultAddress.state,
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
            handleQuotationChange("shipTo", null);
          } finally {
            setIsCreatingAddress(false);
          }
        };
        createBillingAddress();
      }
    } else if (!useBillingAddress) {
      handleQuotationChange("shipTo", null);
    }

    return () => {
      debouncedToast.cancel();
    };
  }, [
    useBillingAddress,
    defaultAddress,
    filteredAddresses,
    handleQuotationChange,
    selectedCustomer,
    createAddress,
    debouncedToast,
  ]);

  // Handle address selection
  const handleAddressChange = (value) => {
    if (value === "sameAsBilling") {
      setUseBillingAddress(true);
    } else {
      setUseBillingAddress(false);
      handleQuotationChange("shipTo", value);
    }
  };

  return (
    <Row gutter={[16, 16]} justify="center">
      <Col xs={24} sm={24} md={16} lg={16}>
        <CartSummaryCard>
          <Text level={3} style={{ fontSize: "18px" }}>
            Checkout
          </Text>
          <Divider />
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
            <>
              <Text strong>Document Type</Text>
              <Select
                value={documentType}
                onChange={setDocumentType}
                style={{ width: "100%", marginTop: 8 }}
                aria-label="Select document type"
              >
                <Option value="Quotation">Quotation</Option>
                <Option value="Order">Order</Option>
                <Option value="Purchase Order">Purchase Order</Option>
              </Select>
              <Divider />
              <Text strong>Select Customer</Text>
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
              <Button
                type="link"
                icon={<UserAddOutlined />}
                onClick={handleAddCustomer}
              >
                Add New Customer
              </Button>
              <Divider />
              <Text strong>Shipping Address</Text>
              <Select
                value={
                  useBillingAddress
                    ? "sameAsBilling"
                    : quotationData.shipTo || undefined
                }
                onChange={handleAddressChange}
                placeholder="Select shipping address"
                loading={addressesLoading || isCreatingAddress}
                disabled={
                  !selectedCustomer ||
                  addressesLoading ||
                  addressesError ||
                  isCreatingAddress
                }
                style={{ width: "100%", marginTop: 8 }}
                aria-label="Select shipping address"
              >
                {selectedCustomer && defaultAddress && (
                  <Option value="sameAsBilling">Same as Billing Address</Option>
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
                    const addressLabel = `${customerName} - ${
                      address.street
                    }, ${address.city}, ${address.state}, ${
                      address.postalCode
                    }, ${address.country || "India"} (${address.status})`;
                    return (
                      <Option key={address.addressId} value={address.addressId}>
                        {addressLabel}
                      </Option>
                    );
                  })
                )}
              </Select>
              {useBillingAddress && defaultAddress && (
                <div style={{ marginTop: 8 }}>
                  <Text strong>Billing Address:</Text>
                  <p style={{ margin: 0 }}>
                    {`${defaultAddress.street}, ${defaultAddress.city}, ${
                      defaultAddress.state
                    }, ${
                      defaultAddress.postalCode || defaultAddress.zip || ""
                    }${
                      defaultAddress.country
                        ? `, ${defaultAddress.country}`
                        : ""
                    }`}
                  </p>
                </div>
              )}
              <Button
                type="link"
                icon={<UserAddOutlined />}
                onClick={handleAddAddress}
                style={{ padding: 0, marginTop: 8 }}
                aria-label="Add new address"
                disabled={!selectedCustomer || isCreatingAddress}
              >
                Add New Address
              </Button>
              <Divider />
              <Text strong>Quotation/Order Date</Text>
              <input
                type="date"
                className="form-control"
                value={quotationData.quotationDate}
                onChange={(e) =>
                  handleQuotationChange("quotationDate", e.target.value)
                }
                style={{ marginTop: 8, width: "100%" }}
              />
              <Text strong>Due Date</Text>
              <input
                type="date"
                className="form-control"
                value={quotationData.dueDate}
                onChange={(e) =>
                  handleQuotationChange("dueDate", e.target.value)
                }
                style={{ marginTop: 8, width: "100%" }}
              />
              {error && (
                <Alert
                  message={error}
                  type="error"
                  showIcon
                  style={{ marginTop: 8 }}
                />
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
                    onChange={(e) =>
                      handleQuotationChange("gstValue", e.target.value)
                    }
                    min="0"
                    style={{ marginTop: 8, width: "100%" }}
                  />
                </>
              )}
              <Divider />
              <Text strong>Discount Type</Text>
              <Select
                value={quotationData.discountType}
                onChange={(value) =>
                  handleQuotationChange("discountType", value)
                }
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
                onChange={(e) =>
                  handleQuotationChange("roundOff", e.target.value)
                }
                style={{ marginTop: 8, width: "100%" }}
              />
            </>
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
          />
          <Divider />
          <CheckoutButton
            type="primary"
            icon={<CheckCircleOutlined />}
            onClick={handleCreateDocument}
            disabled={
              cartItems.length === 0 ||
              !selectedCustomer ||
              error ||
              !quotationData.quotationDate ||
              !quotationData.dueDate ||
              (!quotationData.shipTo && !useBillingAddress)
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

export default React.memo(QuotationForm);
