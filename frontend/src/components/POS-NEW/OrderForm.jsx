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
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

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

// Helper: Convert moment → Date for react-datepicker
const momentToDate = (m) => (m ? m.toDate() : null);

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
    const normalized = sourceType.toLowerCase();
    return customers.filter(
      (c) => c.customerType && c.customerType.toLowerCase() === normalized
    );
  }, [customers, sourceType]);

  // Auto-select previousOrderNo
  useEffect(() => {
    if (orderData?.masterPipelineNo) {
      const related = orders.filter(
        (o) =>
          o.masterPipelineNo === orderData.masterPipelineNo &&
          o.orderNo !== orderData.orderNo
      );
      const latest = related.sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      )[0];
      handleOrderChange("previousOrderNo", latest?.orderNo || "");
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
          (c) =>
            c.name.toLowerCase().includes(value.toLowerCase()) ||
            (c.email && c.email.toLowerCase().includes(value.toLowerCase()))
        );
        setFilteredCustomers(filtered);
      } else {
        setFilteredCustomers(customers);
      }
    }, 300),
    [customers]
  );

  const debouncedToast = useCallback(
    debounce((msg, type = "error") => toast[type](msg), 300),
    []
  );

  // Initialize dueDate
  useEffect(() => {
    if (!orderData.dueDate) {
      setOrderData((prev) => ({
        ...prev,
        dueDate: moment().add(1, "days").format("YYYY-MM-DD"),
      }));
    }
  }, [orderData.dueDate, setOrderData]);

  // Sync shipTo with billing address
  useEffect(() => {
    if (
      !selectedCustomer ||
      !defaultAddress ||
      isCreatingAddress ||
      !useBillingAddress ||
      orderData?.shipTo
    )
      return;

    const normalize = (s) => (s ? s.trim().toLowerCase() : "");

    const match = filteredAddresses.find((addr) => {
      const m = {
        street: normalize(addr.street) === normalize(defaultAddress.street),
        city: normalize(addr.city) === normalize(defaultAddress.city),
        state: normalize(addr.state) === normalize(defaultAddress.state),
        postal:
          normalize(addr.postalCode || addr.zip) ===
            normalize(defaultAddress.postalCode || defaultAddress.zip) ||
          normalize(addr.postalCode || addr.zip) ===
            normalize(defaultAddress.zip || defaultAddress.postalCode),
        country:
          normalize(addr.country || "india") ===
          normalize(defaultAddress.country || "india"),
      };
      return m.street && m.city && m.state && m.postal && m.country;
    });

    if (match) {
      handleOrderChange("shipTo", match.addressId);
      return;
    }

    const createBilling = async () => {
      setIsCreatingAddress(true);
      try {
        const payload = {
          customerId: selectedCustomer,
          street: defaultAddress.street || "",
          city: defaultAddress.city || "",
          state: defaultAddress.state || "",
          postalCode: defaultAddress.postalCode || defaultAddress.zip || "",
          country: defaultAddress.country || "India",
          status: "BILLING",
        };
        const result = await createAddress(payload).unwrap();
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

    createBilling();
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

  // Follow-up date handlers
  const handleFollowupDateChange = (index, date) => {
    const newDates = [...(orderData.followupDates || [])];
    newDates[index] = date ? moment(date).format("YYYY-MM-DD") : null;
    handleOrderChange("followupDates", newDates);
  };

  const addFollowupDate = () => {
    handleOrderChange("followupDates", [
      ...(orderData.followupDates || []),
      null,
    ]);
  };

  const removeFollowupDate = (index) => {
    handleOrderChange(
      "followupDates",
      orderData.followupDates?.filter((_, i) => i !== index) || []
    );
  };

  // Validation
  const validateOrderNo = (no) => /^\d{1,2}\d{1,2}25\d{3,}$/.test(no);
  const checkOrderNoUniqueness = (no) => !orders.some((o) => o.orderNo === no);

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
                    showSearch
                    value={selectedCustomer}
                    onChange={(v) => {
                      setSelectedCustomer(v);
                      handleOrderChange("createdFor", v);
                      handleOrderChange("shipTo", null);
                      setUseBillingAddress(false);
                    }}
                    onSearch={debouncedCustomerSearch}
                    placeholder="Select a customer"
                    loading={customersLoading}
                    disabled={customersLoading || customersError}
                    filterOption={false}
                  >
                    {(filteredCustomers?.length ?? 0) > 0 ? (
                      filteredCustomers.map((c) => (
                        <Option key={c.customerId} value={c.customerId}>
                          {c.name} ({c.email})
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
                  >
                    Add New Customer
                  </ActionButton>
                </Space>
              </FormSection>

              {/* Reference Type */}
              <FormSection>
                <Text strong>Reference Type</Text>
                <Select
                  value={sourceType}
                  onChange={(v) => {
                    setSourceType(v);
                    if (v) handleOrderChange("source", "");
                  }}
                  placeholder="Select reference type"
                  allowClear
                >
                  {SOURCE_TYPES.map((t) => (
                    <Option key={t} value={t}>
                      {t}
                    </Option>
                  ))}
                </Select>
              </FormSection>

              {/* Reference Customer */}
              <FormSection>
                <Text strong>Reference Customer</Text>
                <Select
                  value={orderData?.source || undefined}
                  onChange={(v) => handleOrderChange("source", v)}
                  placeholder="Select reference customer"
                  disabled={!sourceType || customersLoading || customersError}
                  allowClear
                >
                  {customersLoading ? (
                    <Option disabled>Loading customers...</Option>
                  ) : customersError ? (
                    <Option disabled>
                      Error: {customersError?.data?.message || "Unknown"}
                    </Option>
                  ) : (sourceCustomers?.length ?? 0) > 0 ? (
                    sourceCustomers.map((c) => (
                      <Option key={c.customerId} value={c.customerId}>
                        {c.name} ({c.email})
                      </Option>
                    ))
                  ) : (
                    <Option disabled>
                      {sourceType
                        ? `No ${sourceType} customers`
                        : "Select type first"}
                    </Option>
                  )}
                </Select>
              </FormSection>

              {/* Shipping Address */}
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
                    loading={addressesLoading || isCreatingAddress}
                    disabled={
                      !selectedCustomer ||
                      addressesLoading ||
                      addressesError ||
                      isCreatingAddress
                    }
                  >
                    {selectedCustomer && defaultAddress && (
                      <Option value="sameAsBilling">
                        Same as Billing Address
                      </Option>
                    )}
                    {!selectedCustomer ? (
                      <Option disabled>Select customer first</Option>
                    ) : addressesLoading || isCreatingAddress ? (
                      <Option disabled>Loading...</Option>
                    ) : addressesError ? (
                      <Option disabled>
                        Error: {addressesError?.data?.message || "Unknown"}
                      </Option>
                    ) : (filteredAddresses?.length ?? 0) === 0 ? (
                      <Option disabled>No addresses</Option>
                    ) : (
                      filteredAddresses.map((a) => (
                        <Option key={a.addressId} value={a.addressId}>
                          {`${a.street}, ${a.city}, ${a.state || ""}, ${
                            a.postalCode
                          }, ${a.country || "India"} (${a.status})`}
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
                  >
                    Add New Address
                  </ActionButton>
                </Space>
              </FormSection>

              {/* Order Number */}
              <FormSection>
                <Text strong>Order Number</Text>
                <Input
                  value={orderData.orderNo}
                  disabled
                  placeholder="e.g., 151025101"
                />
              </FormSection>

              {/* Master Pipeline */}
              <FormSection>
                <Text strong>Master Pipeline Number</Text>
                <Select
                  value={orderData?.masterPipelineNo || undefined}
                  onChange={(v) => handleOrderChange("masterPipelineNo", v)}
                  placeholder="Select master pipeline"
                  allowClear
                >
                  {isAllOrdersLoading ? (
                    <Option disabled>Loading orders...</Option>
                  ) : allOrdersError ? (
                    <Option disabled>Error loading orders</Option>
                  ) : (orders?.length ?? 0) === 0 ? (
                    <Option disabled>No orders</Option>
                  ) : (
                    orders
                      .filter(
                        (o) => o.orderNo && o.orderNo !== orderData?.orderNo
                      )
                      .map((o) => (
                        <Option key={o.orderNo} value={o.orderNo}>
                          {o.orderNo}
                        </Option>
                      ))
                  )}
                </Select>
              </FormSection>

              {/* Status */}
              <FormSection>
                <Text strong>Status</Text>
                <Select
                  value={orderData?.status}
                  onChange={(v) => handleOrderChange("status", v)}
                  placeholder="Select status"
                >
                  {STATUS_VALUES.map((s) => (
                    <Option key={s} value={s}>
                      {s.charAt(0) + s.slice(1).toLowerCase().replace("_", " ")}
                    </Option>
                  ))}
                </Select>
              </FormSection>

              {/* Priority */}
              <FormSection>
                <Text strong>Priority</Text>
                <Select
                  value={orderData?.priority}
                  onChange={(v) => handleOrderChange("priority", v)}
                  placeholder="Select priority"
                >
                  <Option value="high">High</Option>
                  <Option value="medium">Medium</Option>
                  <Option value="low">Low</Option>
                </Select>
              </FormSection>

              {/* Assigned To */}
              <FormSection>
                <Text strong>Assigned To</Text>
                <Radio.Group
                  value={assignmentType}
                  onChange={(e) => {
                    const val = e.target.value;
                    setAssignmentType(val);
                    setOrderData((prev) => ({
                      ...prev,
                      assignedTeamId: val === "team" ? prev.assignedTeamId : "",
                      assignedUserId:
                        val === "users" ? prev.assignedUserId : "",
                      secondaryUserId:
                        val === "users" ? prev.secondaryUserId : "",
                    }));
                  }}
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
                    onChange={(v) => handleOrderChange("assignedTeamId", v)}
                    placeholder="Select team"
                    disabled={teamsLoading}
                    dropdownRender={(menu) => (
                      <>
                        {menu}
                        <Divider style={{ margin: "8px 0" }} />
                        <Button
                          type="primary"
                          icon={<PlusOutlined />}
                          onClick={() => handleTeamAdded(true)}
                          style={{ width: "100%" }}
                        >
                          Add New Team
                        </Button>
                      </>
                    )}
                  >
                    {(teams?.length ?? 0) > 0 ? (
                      teams.map((t) => (
                        <Option key={t.id} value={t.id}>
                          {t.teamName} (
                          {t.teammembers?.length
                            ? t.teammembers.map((m) => m.userName).join(", ")
                            : "No members"}
                          )
                        </Option>
                      ))
                    ) : (
                      <Option disabled>No teams</Option>
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
                      onChange={(v) => handleOrderChange("assignedUserId", v)}
                      placeholder="Select primary user"
                      disabled={usersLoading}
                    >
                      {(users?.length ?? 0) > 0 ? (
                        users.map((u) => (
                          <Option key={u.userId} value={u.userId}>
                            {u.username || u.name || "—"}
                          </Option>
                        ))
                      ) : (
                        <Option disabled>No users</Option>
                      )}
                    </Select>
                  </FormSection>

                  <FormSection>
                    <Text strong>Secondary User (Optional)</Text>
                    <Select
                      value={orderData?.secondaryUserId || undefined}
                      onChange={(v) => handleOrderChange("secondaryUserId", v)}
                      placeholder="Select secondary user"
                      disabled={usersLoading}
                      allowClear
                    >
                      {(users?.length ?? 0) > 0 ? (
                        users.map((u) => (
                          <Option key={u.userId} value={u.userId}>
                            {u.username || u.name || "—"}
                          </Option>
                        ))
                      ) : (
                        <Option disabled>No users</Option>
                      )}
                    </Select>
                  </FormSection>
                </>
              )}

              {/* Due Date - react-datepicker */}
              <FormSection>
                <Text strong>
                  Due Date <span style={{ color: "red" }}>*</span>
                </Text>
                <DatePicker
                  selected={momentToDate(
                    orderData?.dueDate ? moment(orderData.dueDate) : null
                  )}
                  onChange={(date) =>
                    handleOrderChange(
                      "dueDate",
                      date ? moment(date).format("YYYY-MM-DD") : ""
                    )
                  }
                  dateFormat="yyyy-MM-dd"
                  minDate={new Date()}
                  placeholderText="Select due date"
                  className="ant-input"
                  wrapperClassName="w-100"
                />
              </FormSection>

              {/* Timeline Dates */}
              <FormSection>
                <Text strong>Timeline Dates</Text>
                {(orderData?.followupDates || []).map((date, idx) => (
                  <Space
                    key={idx}
                    align="center"
                    style={{ width: "100%", marginBottom: 8 }}
                  >
                    <DatePicker
                      selected={momentToDate(date ? moment(date) : null)}
                      onChange={(d) => handleFollowupDateChange(idx, d)}
                      dateFormat="yyyy-MM-dd"
                      minDate={new Date()}
                      maxDate={
                        orderData?.dueDate
                          ? moment(orderData.dueDate).toDate()
                          : undefined
                      }
                      placeholderText="Select follow-up date"
                      className="ant-input"
                      wrapperClassName="w-100"
                    />
                    <Button
                      type="text"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => removeFollowupDate(idx)}
                    />
                  </Space>
                ))}
                <Button
                  type="primary"
                  onClick={addFollowupDate}
                  icon={<PlusOutlined />}
                >
                  Add Follow-up Date
                </Button>
              </FormSection>

              {/* Description */}
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

      {/* Summary Column */}
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
              if (!selectedCustomer) return toast.error("Select a Customer.");
              if (sourceType && !orderData?.source)
                return toast.error("Select a Reference Customer.");
              if (assignmentType === "team" && !orderData?.assignedTeamId)
                return toast.error("Select a Team.");
              if (assignmentType === "users" && !orderData?.assignedUserId)
                return toast.error("Select Primary User.");
              if (
                assignmentType === "users" &&
                orderData?.assignedUserId === orderData?.secondaryUserId
              )
                return toast.error("Primary and Secondary cannot be same.");
              if (!validateOrderNo(orderData?.orderNo))
                return toast.error("Invalid Order Number format.");
              if (!checkOrderNoUniqueness(orderData?.orderNo))
                return toast.error("Order Number already exists.");
              if (
                orderData?.masterPipelineNo &&
                !validateOrderNo(orderData.masterPipelineNo)
              )
                return toast.error("Invalid Master Pipeline Number.");
              if (
                orderData?.previousOrderNo &&
                !validateOrderNo(orderData?.previousOrderNo)
              )
                return toast.error("Invalid Previous Order Number.");
              if (
                orderData?.masterPipelineNo &&
                orders.every((o) => o.orderNo !== orderData.masterPipelineNo)
              )
                return toast.error("Master Pipeline not found.");
              if (
                orderData?.previousOrderNo &&
                orders.every((o) => o.orderNo !== orderData.previousOrderNo)
              )
                return toast.error("Previous Order not found.");
              if (!orderData?.shipTo && !useBillingAddress)
                return toast.error("Select shipping address.");
              if (!orderData?.dueDate) return toast.error("Select due date.");

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
                (d) =>
                  !d ||
                  moment(d).isSameOrBefore(moment(orderData?.dueDate), "day")
              ) ||
              (!orderData?.shipTo && !useBillingAddress)
            }
            block
            size="large"
          >
            Create Order
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

export default React.memo(OrderForm);
