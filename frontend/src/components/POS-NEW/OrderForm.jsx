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
  DatePicker,
  Typography,
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
import moment from "moment";
import { toast } from "sonner";
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

const STATUS_VALUES = [
  "CREATED",
  "PREPARING",
  "CHECKING",
  "INVOICE",
  "DISPATCHED",
  "DELIVERED",
  "PARTIALLY_DELIVERED",
  "CANCELED",
  "DRAFT",
  "ONHOLD",
];

const OrderForm = ({
  orderData,
  setOrderData,
  handleOrderChange,
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
  teams,
  teamsLoading,
  quotationData,
  setQuotationData,
  handleQuotationChange,
  error,
  orderNumber,
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
  const handleFollowupDateChange = (index, date) => {
    const updatedDates = [...orderData.followupDates];
    updatedDates[index] = date ? date.format("YYYY-MM-DD") : "";
    if (
      orderData.dueDate &&
      date &&
      moment(date).isAfter(moment(orderData.dueDate), "day")
    ) {
      toast.warning(
        `Follow-up date ${index + 1} cannot be after the due date.`
      );
    }
    if (date && moment(date).isBefore(moment().startOf("day"))) {
      toast.warning(`Follow-up date ${index + 1} cannot be before today.`);
    }
    setOrderData({ ...orderData, followupDates: updatedDates });
  };

  const addFollowupDate = () => {
    setOrderData({
      ...orderData,
      followupDates: [...orderData.followupDates, ""],
    });
  };

  const removeFollowupDate = (index) => {
    setOrderData({
      ...orderData,
      followupDates: orderData.followupDates.filter((_, i) => i !== index),
    });
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
                }}
                placeholder="Select a customer"
                loading={customersLoading}
                disabled={customersLoading || customersError}
                aria-label="Select customer"
              >
                {customersLoading ? (
                  <Option disabled>Select a customer</Option>
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
                value={quotationData.shipTo}
                onChange={(value) => handleQuotationChange("shipTo", value)}
                placeholder="Select shipping address"
                loading={
                  addressesLoading ||
                  userQueries.some((q) => q.isLoading) ||
                  customerQueries.some((q) => q.isLoading)
                }
                disabled={
                  addressesLoading ||
                  addressesError ||
                  !selectedCustomer ||
                  userQueries.some((q) => q.isLoading) ||
                  customerQueries.some((q) => q.isLoading)
                }
                style={{ width: "100%", marginTop: 8 }}
                aria-label="Select shipping address"
              >
                {addressesLoading ? (
                  <Option disabled>Select Shipping Address</Option>
                ) : addressesError ? (
                  <Option disabled>
                    Error fetching addresses:{" "}
                    {addressesError?.data?.message || "Unknown error"}
                  </Option>
                ) : addresses.length === 0 ? (
                  <Option disabled>No addresses available</Option>
                ) : (
                  addresses.map((address) => (
                    <Option key={address.addressId} value={address.addressId}>
                      {`${address.street}, ${address.city}${
                        address.state ? `, ${address.state}` : ""
                      }, ${address.country} (${
                        address.customerId
                          ? customerMap[address.customerId] ||
                            "Unknown Customer"
                          : address.userId
                          ? userMap[address.userId] || "Unknown User"
                          : "No associated name"
                      })`}
                    </Option>
                  ))
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
              <Divider />
              <Text strong>Order Number</Text>
              <Input
                value={orderData.orderNo}
                onChange={(e) => handleOrderChange("orderNo", e.target.value)}
                placeholder={orderData.orderNo}
                style={{ marginTop: 8 }}
                disabled
              />
              {error && orderData.orderNo && (
                <Text type="danger" style={{ display: "block", marginTop: 4 }}>
                  {error}
                </Text>
              )}
              <Divider />
              <Text strong>Status</Text>
              <Select
                value={orderData.status}
                onChange={(value) => handleOrderChange("status", value)}
                style={{ width: "100%", marginTop: 8 }}
              >
                {STATUS_VALUES.map((status) => (
                  <Option key={status} value={status}>
                    {status.charAt(0).toUpperCase() +
                      status.slice(1).toLowerCase().replace("_", " ")}
                  </Option>
                ))}
              </Select>
              <Divider />
              <Text strong>Priority</Text>
              <Select
                value={orderData.priority}
                onChange={(value) => handleOrderChange("priority", value)}
                style={{ width: "100%", marginTop: 8 }}
                placeholder="Select priority"
              >
                <Option value="high">High</Option>
                <Option value="medium">Medium</Option>
                <Option value="low">Low</Option>
              </Select>
              <Divider />
              <Text strong>Assigned To</Text>
              <Select
                value={orderData.teamId}
                onChange={(value) => handleOrderChange("teamId", value)}
                style={{ width: "100%", marginTop: 8 }}
                placeholder="Select team"
                disabled={teamsLoading}
              >
                {teams.length > 0 ? (
                  teams.map((team) => (
                    <Option key={team.id} value={team.id}>
                      {team.teamName}
                    </Option>
                  ))
                ) : (
                  <Option value="" disabled>
                    No teams available
                  </Option>
                )}
              </Select>
              <Divider />
              <Text strong>Follow-up Dates</Text>
              {orderData.followupDates.map((date, index) => (
                <div
                  key={index}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    marginTop: 8,
                  }}
                >
                  <DatePicker
                    style={{ width: "100%" }}
                    value={date ? moment(date) : null}
                    onChange={(date) => handleFollowupDateChange(index, date)}
                    format="YYYY-MM-DD"
                    disabledDate={(current) =>
                      current &&
                      (current < moment().startOf("day") ||
                        (orderData.dueDate &&
                          current > moment(orderData.dueDate).endOf("day")))
                    }
                  />
                  <Button
                    type="text"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => removeFollowupDate(index)}
                    aria-label="Remove follow-up date"
                    style={{ marginLeft: 8 }}
                  />
                </div>
              ))}
              <Button
                type="primary"
                onClick={addFollowupDate}
                style={{ marginTop: 8 }}
                aria-label="Add follow-up date"
              >
                <PlusOutlined /> Add Follow-up Date
              </Button>
              <Divider />
              <Text strong>Reference</Text>
              <Select
                showSearch
                allowClear
                placeholder="Search by customer name or type"
                value={orderData.source}
                onChange={(value) => handleOrderChange("source", value)}
                filterOption={(input, option) => {
                  const name = option?.customerName?.toLowerCase() || "";
                  const type = option?.customerType?.toLowerCase() || "";
                  return (
                    name.includes(input.toLowerCase()) ||
                    type.includes(input.toLowerCase())
                  );
                }}
                style={{ width: "100%", marginTop: 8 }}
                options={
                  customers?.map((cust) => ({
                    label: `${cust.name} (${cust.customerType || "N/A"})`,
                    value: cust.name,
                    customerName: cust.name,
                    customerType: cust.customerType || "",
                  })) || []
                }
              />
              <Divider />
              <Text strong>Description</Text>
              <Input.TextArea
                value={orderData.description}
                onChange={(e) =>
                  handleOrderChange("description", e.target.value)
                }
                rows={4}
                placeholder="Enter description"
                style={{ marginTop: 8 }}
                maxLength={60}
              />
              <Text
                style={{
                  color: orderData.description.length > 60 ? "red" : "inherit",
                }}
              >
                {orderData.description.length}/60 Characters (Recommended)
              </Text>
            </>
          )}
        </CartSummaryCard>
      </Col>
      <Col xs={24} sm={24} md={8} lg={8}>
        <CartSummaryCard>
          <Text strong>Order #: {orderNumber}</Text>
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
              !orderData.orderNo ||
              !orderData.teamId ||
              !orderData.followupDates.every(
                (date) =>
                  !date ||
                  moment(date).isSameOrBefore(moment(orderData.dueDate), "day")
              )
            }
            block
            size="large"
            aria-label="Create order"
          >
            Create Order
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

export default OrderForm;
