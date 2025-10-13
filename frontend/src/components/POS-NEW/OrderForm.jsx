import React, { useState, useEffect, useCallback } from "react";
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
  Radio,
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
import { debounce } from "lodash";

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

const INVOICE_EDITABLE_STATUSES = [
  "INVOICE",
  "DISPATCHED",
  "DELIVERED",
  "PARTIALLY_DELIVERED",
];

const OrderForm = ({
  orderData,
  setOrderData,
  handleOrderChange,
  selectedCustomer,
  setSelectedCustomer,
  customers = [],
  customersLoading,
  customersError,
  addresses = [],
  addressesLoading,
  addressesError,
  userMap = {},
  customerMap = {},
  userQueries = [],
  customerQueries = [],
  teams = [],
  teamsLoading,
  users = [],
  usersLoading,
  usersError,
  quotationData,
  setQuotationData,
  handleQuotationChange,
  error,
  orderNumber,
  documentType,
  setDocumentType,
  cartItems = [],
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
  orders = [],
  isAllOrdersLoading,
  allOrdersError,
  handleTeamAdded,
}) => {
  const [assignmentType, setAssignmentType] = useState(
    orderData?.assignedTeamId
      ? "team"
      : orderData?.assignedUserId || orderData?.secondaryUserId
      ? "users"
      : "team"
  );
  const [customerSearch, setCustomerSearch] = useState("");
  const [filteredCustomers, setFilteredCustomers] = useState(customers || []);
  const [descriptionLength, setDescriptionLength] = useState(
    orderData?.description?.length || 0
  );

  // Debounced customer search
  const debouncedCustomerSearch = useCallback(
    debounce((value) => {
      setCustomerSearch(value);
      if (value) {
        const filtered = (customers || []).filter((customer) =>
          customer?.name?.toLowerCase().includes(value.toLowerCase())
        );
        setFilteredCustomers(filtered);
      } else {
        setFilteredCustomers(customers || []);
      }
    }, 300),
    [customers]
  );

  useEffect(() => {
    setFilteredCustomers(customers || []);
  }, [customers]);

  useEffect(() => {
    setDescriptionLength(orderData?.description?.length || 0);
  }, [orderData?.description]);

  const handleFollowupDateChange = (index, date) => {
    const updatedDates = [...(orderData?.followupDates || [])];
    updatedDates[index] = date ? date.format("YYYY-MM-DD") : "";
    if (
      orderData?.dueDate &&
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
      followupDates: [...(orderData?.followupDates || []), ""],
    });
  };

  const removeFollowupDate = (index) => {
    setOrderData({
      ...orderData,
      followupDates: (orderData?.followupDates || []).filter(
        (_, i) => i !== index
      ),
    });
  };

  const validateOrderNo = (orderNo) => {
    if (!orderNo) return false;
    const orderNoRegex = /^\d{8}\d{5}$/;
    return orderNoRegex.test(orderNo);
  };

  const checkOrderNoUniqueness = useCallback(
    (orderNo) => {
      if (!orderNo || !orders) return false;
      return !orders.some((order) => order.orderNo === orderNo);
    },
    [orders]
  );

  return (
    <Row gutter={[16, 16]} justify="center">
      <Col xs={24} sm={24} md={16} lg={16}>
        <CartSummaryCard>
          <Text strong style={{ fontSize: "18px" }}>
            Checkout
          </Text>
          <Divider />
          {(cartItems?.length ?? 0) === 0 ? (
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
              <Text strong>
                Customer <span style={{ color: "red" }}>*</span>
              </Text>
              <CustomerSelect
                showSearch
                value={selectedCustomer}
                onChange={(value) => {
                  setSelectedCustomer(value);
                  handleOrderChange("createdFor", value);
                  setQuotationData((prev) => ({ ...prev, shipTo: null }));
                }}
                onSearch={debouncedCustomerSearch}
                placeholder="Select a customer"
                loading={customersLoading}
                disabled={customersLoading || customersError}
                filterOption={false}
                aria-label="Select customer"
              >
                {(filteredCustomers?.length ?? 0) > 0 ? (
                  filteredCustomers.map((customer) => (
                    <Option
                      key={customer.customerId}
                      value={customer.customerId}
                    >
                      {customer.name} ({customer.email})
                    </Option>
                  ))
                ) : (
                  <Option value="" disabled>
                    No customers available
                  </Option>
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
                value={quotationData?.shipTo}
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
                  <Option disabled>Loading addresses...</Option>
                ) : addressesError ? (
                  <Option disabled>
                    Error fetching addresses:{" "}
                    {addressesError?.data?.message || "Unknown error"}
                  </Option>
                ) : (addresses?.length ?? 0) === 0 ? (
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
              <Text strong>Created By</Text>
              <Input
                value={userMap[orderData?.createdBy] || "N/A"}
                disabled
                style={{ marginTop: 8 }}
                placeholder="Auto-filled from profile"
              />
              <Divider />
              <Text strong>Order Number</Text>
              <Input
                value={orderData?.orderNo}
                onChange={(e) => handleOrderChange("orderNo", e.target.value)}
                placeholder={orderNumber || "Generating..."}
                style={{ marginTop: 8 }}
                disabled
              />
              <Divider />
              <Text strong>Quotation Number</Text>
              <Input
                value={orderData?.source || "N/A"}
                disabled
                style={{ marginTop: 8 }}
                placeholder="Quotation number (auto-filled if converted)"
              />
              <Divider />
              <Text strong>Master Pipeline Number</Text>
              <Select
                style={{ width: "100%", marginTop: 8 }}
                value={orderData?.masterPipelineNo || undefined}
                onChange={(value) =>
                  handleOrderChange("masterPipelineNo", value)
                }
                placeholder="Select master pipeline order"
                allowClear
              >
                {isAllOrdersLoading ? (
                  <Option disabled>Loading orders...</Option>
                ) : allOrdersError ? (
                  <Option disabled>Error loading orders</Option>
                ) : (orders?.length ?? 0) === 0 ? (
                  <Option disabled>No orders available</Option>
                ) : (
                  orders
                    .filter(
                      (order) =>
                        order.orderNo && order.orderNo !== orderData?.orderNo
                    )
                    .map((order) => (
                      <Option key={order.orderNo} value={order.orderNo}>
                        {order.orderNo}
                      </Option>
                    ))
                )}
              </Select>
              <Divider />
              <Text strong>Previous Order Number</Text>
              <Select
                style={{ width: "100%", marginTop: 8 }}
                value={orderData?.previousOrderNo || undefined}
                onChange={(value) =>
                  handleOrderChange("previousOrderNo", value)
                }
                placeholder="Select previous order"
                allowClear
              >
                {isAllOrdersLoading ? (
                  <Option disabled>Loading orders...</Option>
                ) : allOrdersError ? (
                  <Option disabled>Error loading orders</Option>
                ) : (orders?.length ?? 0) === 0 ? (
                  <Option disabled>No orders available</Option>
                ) : (
                  orders
                    .filter(
                      (order) =>
                        order.orderNo && order.orderNo !== orderData?.orderNo
                    )
                    .map((order) => (
                      <Option key={order.orderNo} value={order.orderNo}>
                        {order.orderNo}
                      </Option>
                    ))
                )}
              </Select>
              <Divider />
              <Text strong>Pipeline</Text>
              <Input
                value={orderData?.pipeline}
                onChange={(e) => handleOrderChange("pipeline", e.target.value)}
                placeholder="Enter pipeline"
                style={{ marginTop: 8 }}
              />
              <Divider />
              <Text strong>Invoice Link</Text>
              <Input
                value={orderData?.invoiceLink || ""}
                onChange={(e) =>
                  handleOrderChange("invoiceLink", e.target.value)
                }
                placeholder="Enter invoice link"
                style={{ marginTop: 8 }}
                maxLength={500}
                disabled={
                  !INVOICE_EDITABLE_STATUSES.includes(orderData?.status || "")
                }
              />
              <Divider />
              <Text strong>Status</Text>
              <Select
                value={orderData?.status}
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
                value={orderData?.priority}
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
              <Radio.Group
                value={assignmentType}
                onChange={(e) => {
                  setAssignmentType(e.target.value);
                  setOrderData((prev) => ({
                    ...prev,
                    assignedTeamId:
                      e.target.value === "team" ? prev.assignedTeamId : "",
                    assignedUserId:
                      e.target.value === "users" ? prev.assignedUserId : "",
                    secondaryUserId:
                      e.target.value === "users" ? prev.secondaryUserId : "",
                  }));
                }}
                style={{ marginTop: 8 }}
              >
                <Radio value="team">Team</Radio>
                <Radio value="users">Users</Radio>
              </Radio.Group>
              {assignmentType === "team" && (
                <>
                  <Divider />
                  <Text strong>Team</Text>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      marginTop: 8,
                    }}
                  >
                    <Select
                      style={{ width: "100%" }}
                      value={orderData?.assignedTeamId || undefined}
                      onChange={(value) =>
                        handleOrderChange("assignedTeamId", value)
                      }
                      placeholder="Select team"
                      disabled={teamsLoading}
                    >
                      {(teams?.length ?? 0) > 0 ? (
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
                    <Button
                      type="primary"
                      icon={<PlusOutlined />}
                      onClick={() => handleTeamAdded(true)}
                      style={{ marginLeft: 8 }}
                      aria-label="Add new team"
                    ></Button>
                  </div>
                </>
              )}
              {assignmentType === "users" && (
                <>
                  <Divider />
                  <Text strong>Primary User</Text>
                  <Select
                    style={{ width: "100%", marginTop: 8 }}
                    value={orderData?.assignedUserId || undefined}
                    onChange={(value) =>
                      handleOrderChange("assignedUserId", value)
                    }
                    placeholder="Select primary user"
                    disabled={usersLoading}
                  >
                    {(users?.length ?? 0) > 0 ? (
                      users.map((user) => (
                        <Option key={user.userId} value={user.userId}>
                          {user.username || user.name || "—"}
                        </Option>
                      ))
                    ) : (
                      <Option value="" disabled>
                        No users available
                      </Option>
                    )}
                  </Select>
                  <Divider />
                  <Text strong>Secondary User (Optional)</Text>
                  <Select
                    style={{ width: "100%", marginTop: 8 }}
                    value={orderData?.secondaryUserId || undefined}
                    onChange={(value) =>
                      handleOrderChange("secondaryUserId", value)
                    }
                    placeholder="Select secondary user"
                    disabled={usersLoading}
                    allowClear
                  >
                    {(users?.length ?? 0) > 0 ? (
                      users.map((user) => (
                        <Option key={user.userId} value={user.userId}>
                          {user.username || user.name || "—"}
                        </Option>
                      ))
                    ) : (
                      <Option value="" disabled>
                        No users available
                      </Option>
                    )}
                  </Select>
                </>
              )}
              <Divider />
              <Text strong>Due Date</Text>
              <DatePicker
                style={{ width: "100%", marginTop: 8 }}
                value={orderData?.dueDate ? moment(orderData.dueDate) : null}
                onChange={(date) =>
                  handleOrderChange(
                    "dueDate",
                    date ? date.format("YYYY-MM-DD") : ""
                  )
                }
                format="YYYY-MM-DD"
                disabledDate={(current) =>
                  current && current < moment().startOf("day")
                }
              />
              <Divider />
              <Text strong>Follow-up Dates</Text>
              {(orderData?.followupDates || []).map((date, index) => (
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
                        (orderData?.dueDate &&
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
              <Text strong>Source</Text>
              <Input
                value={orderData?.source}
                onChange={(e) => handleOrderChange("source", e.target.value)}
                placeholder="Enter source"
                style={{ marginTop: 8 }}
                maxLength={255}
              />
              <Divider />
              <Text strong>Description</Text>
              <Input.TextArea
                value={orderData?.description}
                onChange={(e) => {
                  handleOrderChange("description", e.target.value);
                  setDescriptionLength(e.target.value?.length || 0);
                }}
                rows={4}
                placeholder="Enter description"
                style={{ marginTop: 8 }}
                maxLength={60}
              />
              <Text
                style={{
                  color: descriptionLength > 60 ? "red" : "inherit",
                }}
              >
                {descriptionLength}/60 Characters (Recommended)
              </Text>
              {error && (
                <Alert
                  message={error}
                  type="error"
                  showIcon
                  style={{ marginTop: 8 }}
                />
              )}
            </>
          )}
        </CartSummaryCard>
      </Col>
      <Col xs={24} sm={24} md={8} lg={8}>
        <CartSummaryCard>
          <Text strong>Order #: {orderData?.orderNo || "N/A"}</Text>
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
            onClick={() => {
              if (!selectedCustomer) {
                toast.error("Please select a Customer.");
                return;
              }
              if (assignmentType === "team" && !orderData?.assignedTeamId) {
                toast.error("Please select a Team for assignment.");
                return;
              }
              if (assignmentType === "users" && !orderData?.assignedUserId) {
                toast.error(
                  "Please select at least a Primary User for assignment."
                );
                return;
              }
              if (
                assignmentType === "users" &&
                orderData?.assignedUserId &&
                orderData?.secondaryUserId &&
                orderData?.assignedUserId === orderData?.secondaryUserId
              ) {
                toast.error("Primary and Secondary Users cannot be the same.");
                return;
              }
              if (!validateOrderNo(orderData?.orderNo)) {
                toast.error(
                  "Order Number must be in the format DDMMYYYYXXXXX (e.g., 2708202500001)."
                );
                return;
              }
              if (!checkOrderNoUniqueness(orderData?.orderNo)) {
                toast.error("Order Number already exists.");
                return;
              }
              if (
                orderData?.masterPipelineNo &&
                !validateOrderNo(orderData?.masterPipelineNo)
              ) {
                toast.error(
                  "Master Pipeline Number must be in the format DDMMYYYYXXXXX (e.g., 2708202500001)."
                );
                return;
              }
              if (
                orderData?.previousOrderNo &&
                !validateOrderNo(orderData?.previousOrderNo)
              ) {
                toast.error(
                  "Previous Order Number must be in the format DDMMYYYYXXXXX (e.g., 2708202500001)."
                );
                return;
              }
              if (
                orderData?.masterPipelineNo &&
                orders?.every(
                  (order) => order.orderNo !== orderData.masterPipelineNo
                )
              ) {
                toast.error(
                  "Master Pipeline Number does not match any existing order."
                );
                return;
              }
              if (
                orderData?.previousOrderNo &&
                orders?.every(
                  (order) => order.orderNo !== orderData.previousOrderNo
                )
              ) {
                toast.error(
                  "Previous Order Number does not match any existing order."
                );
                return;
              }
              handleCreateDocument();
            }}
            disabled={
              (cartItems?.length ?? 0) === 0 ||
              !selectedCustomer ||
              error ||
              !quotationData?.quotationDate ||
              !quotationData?.dueDate ||
              !orderData?.orderNo ||
              (assignmentType === "team" && !orderData?.assignedTeamId) ||
              (assignmentType === "users" && !orderData?.assignedUserId) ||
              !(orderData?.followupDates || []).every(
                (date) =>
                  !date ||
                  moment(date).isSameOrBefore(moment(orderData?.dueDate), "day")
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
