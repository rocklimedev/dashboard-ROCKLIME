import React from "react";
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
}) => {
  // Filter addresses to only include those for the selected customer
  const filteredAddresses = addresses.filter(
    (address) => address.customerId === selectedCustomer
  );

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
                value={quotationData.shipTo || undefined}
                onChange={(value) => handleQuotationChange("shipTo", value)}
                placeholder="Select shipping address"
                loading={addressesLoading}
                disabled={
                  !selectedCustomer ||
                  addressesLoading ||
                  addressesError ||
                  filteredAddresses.length === 0
                }
                style={{ width: "100%", marginTop: 8 }}
                aria-label="Select shipping address"
              >
                {!selectedCustomer ? (
                  <Option disabled>Please select a customer first</Option>
                ) : addressesLoading ? (
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
                    const addressDetails = address.addressDetails || address;
                    const addressLabel = `${customerName} - ${
                      addressDetails.street
                    }, ${addressDetails.city}, ${addressDetails.state}, ${
                      addressDetails.postalCode || addressDetails.zip
                    }, ${addressDetails.country || "India"}`;
                    return (
                      <Option key={address.addressId} value={address.addressId}>
                        {addressLabel}
                      </Option>
                    );
                  })
                )}
              </Select>
              <Button
                type="link"
                icon={<UserAddOutlined />}
                onClick={handleAddAddress}
                style={{ padding: 0, marginTop: 8 }}
                aria-label="Add new address"
                disabled={!selectedCustomer}
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
              !quotationData.dueDate
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

export default QuotationForm;
