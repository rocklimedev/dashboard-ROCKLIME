import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Card,
  Button,
  Select,
  Input,
  Alert,
  Row,
  Col,
  Empty,
  DatePicker,
  Typography,
  Radio,
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
import moment from "moment";
import { toast } from "sonner";
import { debounce } from "lodash";
import { useCreateAddressMutation } from "../../api/addressApi";
import { useGetAllOrdersQuery } from "../../api/orderApi";

const { Text } = Typography;
const { Option } = Select;

// Styled Components
const CartSummaryCard = styled(Card)`
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 16px;
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
  justify-content: center;
  padding: 24px;
`;

const CustomerSelect = styled(Select)`
  width: 100%;
`;

const CheckoutButton = styled(Button)`
  background-color: #1890ff;
  border-color: #1890ff;
  &:hover {
    background-color: #40a9ff;
    border-color: #40a9ff;
  }
`;

const ActionButton = styled(Button)`
  padding: 0;
  height: auto;
`;

const SOURCE_TYPES = [
  "Retail",
  "Architect",
  "Interior",
  "Builder",
  "Contractor",
];
const STATUS_VALUES = [
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
  handleTeamAdded,
  useBillingAddress,
  setUseBillingAddress,
}) => {
  const [assignmentType, setAssignmentType] = useState(
    orderData?.assignedTeamId
      ? "team"
      : orderData?.assignedUserId || orderData?.secondaryUserId
      ? "users"
      : "team"
  );
  const [customerSearch, setCustomerSearch] = useState("");
  const [sourceType, setSourceType] = useState("");
  const [filteredCustomers, setFilteredCustomers] = useState(customers || []);
  const [descriptionLength, setDescriptionLength] = useState(
    orderData?.description?.length || 0
  );
  const [isCreatingAddress, setIsCreatingAddress] = useState(false);
  const [createAddress] = useCreateAddressMutation();
  const {
    data: allOrdersData,
    isLoading: isAllOrdersLoading,
    error: allOrdersError,
  } = useGetAllOrdersQuery();
  const orders = useMemo(
    () => (Array.isArray(allOrdersData?.orders) ? allOrdersData.orders : []),
    [allOrdersData]
  );

  // Memoized filtered addresses
  const filteredAddresses = useMemo(() => {
    if (!selectedCustomer) return [];
    return addresses.filter((addr) => addr.customerId === selectedCustomer);
  }, [addresses, selectedCustomer]);

  // Memoized default address
  const defaultAddress = useMemo(() => {
    const customer = customers.find((c) => c.customerId === selectedCustomer);
    return customer?.address || null;
  }, [customers, selectedCustomer]);

  // Memoized source customers
  const sourceCustomers = useMemo(() => {
    if (!sourceType) return [];
    const normalizedSourceType = sourceType.toLowerCase();
    return customers.filter((customer) => {
      const customerType = customer.customerType
        ? customer.customerType.toLowerCase()
        : "";
      return customerType === normalizedSourceType;
    });
  }, [customers, sourceType]);

  // Auto-select previousOrderNo based on masterPipelineNo
  useEffect(() => {
    if (orderData?.masterPipelineNo) {
      const relatedOrders = orders.filter(
        (order) =>
          order.masterPipelineNo === orderData.masterPipelineNo &&
          order.orderNo !== orderData.orderNo
      );
      const sortedOrders = relatedOrders.sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );
      const previousOrder = sortedOrders[0]?.orderNo || "";
      handleOrderChange("previousOrderNo", previousOrder);
    } else {
      handleOrderChange("previousOrderNo", "");
    }
  }, [orderData?.masterPipelineNo, orders, handleOrderChange]);

  // Debounced customer search
  const debouncedCustomerSearch = useCallback(
    debounce((value) => {
      setCustomerSearch(value);
      if (value) {
        const filtered = customers.filter(
          (customer) =>
            customer.name.toLowerCase().includes(value.toLowerCase()) ||
            customer.email?.toLowerCase().includes(value.toLowerCase())
        );
        setFilteredCustomers(filtered);
      } else {
        setFilteredCustomers(customers);
      }
    }, 300),
    [customers]
  );

  // Debounced toast
  const debouncedToast = useCallback(
    debounce((message, type = "error") => {
      toast[type](message);
    }, 300),
    []
  );

  // Initialize dueDate if not set
  useEffect(() => {
    if (!orderData.dueDate) {
      setOrderData((prev) => ({
        ...prev,
        dueDate: moment().add(1, "days").format("YYYY-MM-DD"),
      }));
    }
  }, [orderData.dueDate, setOrderData]);

  // Sync shipTo with default address when useBillingAddress is true
  useEffect(() => {
    if (
      !selectedCustomer ||
      !defaultAddress ||
      isCreatingAddress ||
      !useBillingAddress ||
      orderData?.shipTo
    ) {
      return;
    }

    const normalizeString = (str) => (str ? str.trim().toLowerCase() : "");
    const matchingAddress = filteredAddresses.find((addr) => {
      const match = {
        streetMatch:
          normalizeString(addr.street) ===
          normalizeString(defaultAddress.street),
        cityMatch:
          normalizeString(addr.city) === normalizeString(defaultAddress.city),
        stateMatch:
          normalizeString(addr.state) === normalizeString(defaultAddress.state),
        postalMatch:
          normalizeString(addr.postalCode || addr.zip) ===
            normalizeString(defaultAddress.postalCode || defaultAddress.zip) ||
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
      handleOrderChange("shipTo", matchingAddress.addressId);
      return;
    }

    const createBillingAddress = async () => {
      setIsCreatingAddress(true);
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
        handleOrderChange("shipTo", result.data.addressId);
        debouncedToast("Billing address created successfully.", "success");
      } catch (err) {
        debouncedToast(
          `Failed to create billing address: ${
            err.data?.message || "Unknown error"
          }`
        );
        handleOrderChange("shipTo", null);
      } finally {
        setIsCreatingAddress(false);
      }
    };

    createBillingAddress();
  }, [
    useBillingAddress,
    defaultAddress,
    filteredAddresses,
    selectedCustomer,
    orderData?.shipTo,
    isCreatingAddress,
    handleOrderChange,
    createAddress,
    debouncedToast,
  ]);

  // Handle follow-up date changes
  const handleFollowupDateChange = (index, date) => {
    const newFollowupDates = [...(orderData.followupDates || [])];
    newFollowupDates[index] = date ? date.format("YYYY-MM-DD") : null;
    handleOrderChange("followupDates", newFollowupDates);
  };

  // Add new follow-up date
  const addFollowupDate = () => {
    const newFollowupDates = [...(orderData.followupDates || []), null];
    handleOrderChange("followupDates", newFollowupDates);
  };

  // Remove follow-up date
  const removeFollowupDate = (index) => {
    const newFollowupDates = orderData.followupDates.filter(
      (_, i) => i !== index
    );
    handleOrderChange("followupDates", newFollowupDates);
  };

  // Validate order number format
  const validateOrderNo = (orderNo) => {
    const orderNoRegex = /^\d{1,2}\d{1,2}25\d{3,}$/;
    return orderNoRegex.test(orderNo);
  };

  // Check order number uniqueness
  const checkOrderNoUniqueness = (orderNo) => {
    return !orders.some((order) => order.orderNo === orderNo);
  };

  // Handle address change
  const handleAddressChange = (value) => {
    if (value === "sameAsBilling") {
      setUseBillingAddress(true);
    } else {
      setUseBillingAddress(false);
      handleOrderChange("shipTo", value);
    }
  };

  return (
    <Row gutter={[16, 16]} justify="center">
      <Col xs={24} sm={24} md={16} lg={16}>
        <CartSummaryCard>
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
                    showSearch
                    value={selectedCustomer}
                    onChange={(value) => {
                      setSelectedCustomer(value);
                      handleOrderChange("createdFor", value);
                      handleOrderChange("shipTo", null);
                      setUseBillingAddress(false);
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
                <Text strong>Source Type</Text>
                <Select
                  value={sourceType}
                  onChange={(value) => {
                    setSourceType(value);
                    if (value) {
                      handleOrderChange("source", "");
                    }
                  }}
                  placeholder="Select source type"
                  allowClear
                  aria-label="Select source type"
                >
                  {SOURCE_TYPES.map((type) => (
                    <Option key={type} value={type}>
                      {type}
                    </Option>
                  ))}
                </Select>
              </FormSection>

              <FormSection>
                <Text strong>Source Customer</Text>
                <Select
                  value={orderData?.source || undefined}
                  onChange={(value) => handleOrderChange("source", value)}
                  placeholder="Select source customer"
                  disabled={!sourceType || customersLoading || customersError}
                  allowClear
                  aria-label="Select source customer"
                >
                  {customersLoading ? (
                    <Option value="" disabled>
                      Loading customers...
                    </Option>
                  ) : customersError ? (
                    <Option value="" disabled>
                      Error fetching customers:{" "}
                      {customersError?.data?.message || "Unknown error"}
                    </Option>
                  ) : (sourceCustomers?.length ?? 0) > 0 ? (
                    sourceCustomers.map((customer) => (
                      <Option
                        key={customer.customerId}
                        value={customer.customerId}
                      >
                        {customer.name} ({customer.email})
                      </Option>
                    ))
                  ) : (
                    <Option value="" disabled>
                      {sourceType
                        ? `No customers available for ${sourceType} type`
                        : "Please select a source type first"}
                    </Option>
                  )}
                </Select>
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
                        : orderData?.shipTo || undefined
                    }
                    onChange={handleAddressChange}
                    placeholder="Select shipping address"
                    loading={
                      addressesLoading ||
                      isCreatingAddress ||
                      userQueries.some((q) => q.isLoading) ||
                      customerQueries.some((q) => q.isLoading)
                    }
                    disabled={
                      !selectedCustomer ||
                      addressesLoading ||
                      addressesError ||
                      isCreatingAddress ||
                      userQueries.some((q) => q.isLoading) ||
                      customerQueries.some((q) => q.isLoading)
                    }
                    aria-label="Select shipping address"
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
                    ) : (filteredAddresses?.length ?? 0) === 0 ? (
                      <Option disabled>
                        No addresses available for this customer
                      </Option>
                    ) : (
                      filteredAddresses.map((address) => (
                        <Option
                          key={address.addressId}
                          value={address.addressId}
                        >
                          {`${address.street}, ${address.city}, ${
                            address.state || ""
                          }, ${address.postalCode}, ${
                            address.country || "India"
                          } (${address.status})`}
                        </Option>
                      ))
                    )}
                  </Select>
                  {useBillingAddress && defaultAddress && (
                    <Text>
                      <strong>Billing Address:</strong>{" "}
                      {`${defaultAddress.street}, ${defaultAddress.city}, ${
                        defaultAddress.state || ""
                      }, ${
                        defaultAddress.postalCode || defaultAddress.zip || ""
                      }, ${defaultAddress.country || "India"} (${
                        defaultAddress.status || "BILLING"
                      })`}
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
                <Text strong>Order Number</Text>
                <Input
                  value={orderData.orderNo}
                  onChange={(e) => handleOrderChange("orderNo", e.target.value)}
                  placeholder="Enter order number (e.g., 151025101)"
                  disabled={true}
                  aria-label="Order number"
                />
              </FormSection>

              <FormSection>
                <Text strong>Master Pipeline Number</Text>
                <Select
                  value={orderData?.masterPipelineNo || undefined}
                  onChange={(value) =>
                    handleOrderChange("masterPipelineNo", value)
                  }
                  placeholder="Select master pipeline order"
                  allowClear
                  aria-label="Select master pipeline order"
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
              </FormSection>

              <FormSection>
                <Text strong>Status</Text>
                <Select
                  value={orderData?.status}
                  onChange={(value) => handleOrderChange("status", value)}
                  placeholder="Select status"
                  aria-label="Select status"
                >
                  {STATUS_VALUES.map((status) => (
                    <Option key={status} value={status}>
                      {status.charAt(0).toUpperCase() +
                        status.slice(1).toLowerCase().replace("_", " ")}
                    </Option>
                  ))}
                </Select>
              </FormSection>

              <FormSection>
                <Text strong>Priority</Text>
                <Select
                  value={orderData?.priority}
                  onChange={(value) => handleOrderChange("priority", value)}
                  placeholder="Select priority"
                  aria-label="Select priority"
                >
                  <Option value="high">High</Option>
                  <Option value="medium">Medium</Option>
                  <Option value="low">Low</Option>
                </Select>
              </FormSection>

              <FormSection>
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
                  aria-label="Select assignment type"
                >
                  <Radio value="team">Team</Radio>
                  <Radio value="users">Users</Radio>
                </Radio.Group>
              </FormSection>

              {assignmentType === "team" && (
                <FormSection>
                  <Text strong>Team</Text>
                  <Select
                    value={orderData?.assignedTeamId || undefined}
                    onChange={(value) =>
                      handleOrderChange("assignedTeamId", value)
                    }
                    placeholder="Select team"
                    disabled={teamsLoading}
                    aria-label="Select team"
                    dropdownRender={(menu) => (
                      <>
                        {menu}
                        <Divider style={{ margin: "8px 0" }} />
                        <Button
                          type="primary"
                          icon={<PlusOutlined />}
                          onClick={() => handleTeamAdded(true)}
                          style={{ width: "100%" }}
                          aria-label="Add new team"
                        >
                          Add New Team
                        </Button>
                      </>
                    )}
                  >
                    {(teams?.length ?? 0) > 0 ? (
                      teams.map((team) => (
                        <Option key={team.id} value={team.id}>
                          {team.teamName} (
                          {team.teammembers?.length > 0
                            ? team.teammembers
                                .map((member) => member.userName)
                                .join(", ")
                            : "No members"}
                          )
                        </Option>
                      ))
                    ) : (
                      <Option value="" disabled>
                        No teams available
                      </Option>
                    )}
                  </Select>
                </FormSection>
              )}

              {assignmentType === "users" && (
                <>
                  <FormSection>
                    <Text strong>Primary User</Text>
                    <Select
                      value={orderData?.assignedUserId || undefined}
                      onChange={(value) =>
                        handleOrderChange("assignedUserId", value)
                      }
                      placeholder="Select primary user"
                      disabled={usersLoading}
                      aria-label="Select primary user"
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
                  </FormSection>
                  <FormSection>
                    <Text strong>Secondary User (Optional)</Text>
                    <Select
                      value={orderData?.secondaryUserId || undefined}
                      onChange={(value) =>
                        handleOrderChange("secondaryUserId", value)
                      }
                      placeholder="Select secondary user"
                      disabled={usersLoading}
                      allowClear
                      aria-label="Select secondary user"
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
                  </FormSection>
                </>
              )}

              <FormSection>
                <Text strong>
                  Due Date <span style={{ color: "red" }}>*</span>
                </Text>
                <DatePicker
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
                  aria-label="Select due date"
                />
              </FormSection>

              <FormSection>
                <Text strong>Timeline Dates</Text>
                {(orderData?.followupDates || []).map((date, index) => (
                  <Space key={index} align="center" style={{ width: "100%" }}>
                    <DatePicker
                      value={date ? moment(date) : null}
                      onChange={(date) => handleFollowupDateChange(index, date)}
                      format="YYYY-MM-DD"
                      disabledDate={(current) =>
                        current &&
                        (current < moment().startOf("day") ||
                          (orderData?.dueDate &&
                            current > moment(orderData.dueDate).endOf("day")))
                      }
                      aria-label={`Select follow-up date ${index + 1}`}
                    />
                    <Button
                      type="text"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => removeFollowupDate(index)}
                      aria-label="Remove follow-up date"
                    />
                  </Space>
                ))}
                <Button
                  type="primary"
                  onClick={addFollowupDate}
                  icon={<PlusOutlined />}
                  aria-label="Add follow-up date"
                >
                  Add Follow-up Date
                </Button>
              </FormSection>

              <FormSection>
                <Text strong>Description</Text>
                <Input.TextArea
                  value={orderData?.description}
                  onChange={(e) => {
                    handleOrderChange("description", e.target.value);
                    setDescriptionLength(e.target.value?.length || 0);
                  }}
                  rows={3}
                  placeholder="Enter description"
                  maxLength={60}
                  aria-label="Enter description"
                />
                <Text
                  style={{
                    color: descriptionLength > 60 ? "red" : "inherit",
                  }}
                >
                  {descriptionLength}/60 Characters (Recommended)
                </Text>
              </FormSection>

              {error && <Alert message={error} type="error" showIcon />}
            </FormContainer>
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
              if (sourceType && !orderData?.source) {
                toast.error(
                  "Please select a Source Customer for the selected Source Type."
                );
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
                  "Order Number must be in the format DDMM25XXX (e.g., 151025101)."
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
                  "Master Pipeline Number must be in the format DDMM25XXX (e.g., 151025101)."
                );
                return;
              }
              if (
                orderData?.previousOrderNo &&
                !validateOrderNo(orderData?.previousOrderNo)
              ) {
                toast.error(
                  "Previous Order Number must be in the format DDMM25XXX (e.g., 151025101)."
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
              if (!orderData?.shipTo && !useBillingAddress) {
                toast.error("Please select a shipping address.");
                return;
              }
              if (!orderData?.dueDate) {
                toast.error("Please select a due date.");
                return;
              }
              handleCreateDocument();
            }}
            disabled={
              (cartItems?.length ?? 0) === 0 ||
              !selectedCustomer ||
              error ||
              !orderData?.dueDate ||
              !orderData?.orderNo ||
              (sourceType && !orderData?.source) ||
              (assignmentType === "team" && !orderData?.assignedTeamId) ||
              (assignmentType === "users" && !orderData?.assignedUserId) ||
              !(orderData?.followupDates || []).every(
                (date) =>
                  !date ||
                  moment(date).isSameOrBefore(moment(orderData?.dueDate), "day")
              ) ||
              (!orderData?.shipTo && !useBillingAddress)
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

export default React.memo(OrderForm);
