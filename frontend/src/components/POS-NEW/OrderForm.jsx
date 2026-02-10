// src/components/Orders/OrderForm.jsx
import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Card,
  Button,
  Select,
  Input,
  Row,
  Col,
  Empty,
  Typography,
  Radio,
  Space,
  Divider,
  InputNumber,
  Collapse,
  message,
} from "antd";
import {
  UserAddOutlined,
  CheckCircleOutlined,
  ArrowLeftOutlined,
  DeleteOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import styled from "styled-components";
import OrderTotal from "./OrderTotal";
import moment from "moment";
import { debounce } from "lodash";
import { useCreateAddressMutation } from "../../api/addressApi";
import { useGetAllOrdersQuery } from "../../api/orderApi";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useAuth } from "../../context/AuthContext";
import AddCustomerModal from "../Customers/AddCustomerModal";

const { Text, Title } = Typography;
const { Option } = Select;
const { Panel } = Collapse;
const RESTRICTED_ROLES = ["SUPER_ADMIN", "DEVELOPER", "ADMIN"];

/* ────────────────────── Styled ────────────────────── */
const CompactCard = styled(Card)`
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  .ant-card-body {
    padding: 12px 16px;
  }
`;

const TightRow = styled(Row)`
  margin-bottom: 8px;
  .ant-col {
    padding: 0 4px;
  }
`;

const MiniSelect = styled(Select)`
  width: 100%;
  .ant-select-selector {
    padding: 0 8px;
    height: 28px;
  }
`;

const MiniInput = styled(Input)`
  height: 28px;
`;

const MiniNumber = styled(InputNumber)`
  width: 100%;
  height: 28px;
  .ant-input-number-input {
    height: 26px;
  }
`;

const MiniDate = styled(DatePicker)`
  width: 100%;
  height: 28px;
  .react-datepicker-wrapper {
    width: 100%;
  }
  .react-datepicker__input-container input {
    height: 28px;
    width: 100%;
    padding: 0 8px;
    border-radius: 4px;
    border: 1px solid #d9d9d9;
  }
  &.error-border .react-datepicker__input-container input {
    border-color: #ff4d4f;
    box-shadow: 0 0 0 2px rgba(245, 34, 45, 0.2);
  }
`;

const CheckoutBtn = styled(Button)`
  height: 36px;
  font-weight: 600;
`;

/* ────────────────────── Constants ────────────────────── */
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

/* ────────────────────── Helper ────────────────────── */
const momentToDate = (m) => (m ? m.toDate() : null);

/* ────────────────────── Main Component ────────────────────── */
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
  teams = [],
  teamsLoading,
  users = [],
  usersLoading,
  cartItems = [],
  onShippingChange,
  subTotal,
  shipping,
  tax,
  totalDiscount,
  roundOff,
  handleAddCustomer,
  handleAddAddress,
  setActiveTab,
  handleCreateDocument,
  handleTeamAdded,
  useBillingAddress,
  setUseBillingAddress,
  documentType,
  setDocumentType,
}) => {
  const { auth } = useAuth();
  const canCreatePurchaseOrder =
    auth?.role && RESTRICTED_ROLES.includes(auth.role);

  /* ────── Local State ────── */
  const [assignmentType, setAssignmentType] = useState(
    orderData?.assignedTeamId ? "team" : "users",
  );
  const [sourceType, setSourceType] = useState("");
  const [isCreatingAddress, setIsCreatingAddress] = useState(false);
  const [gst, setGst] = useState(orderData.gst ?? 18);
  const [extraDiscount, setExtraDiscount] = useState(
    orderData.extraDiscount ?? 0,
  );
  const [extraDiscountType, setExtraDiscountType] = useState(
    orderData.extraDiscountType ?? "fixed",
  );
  const [customerSearch, setCustomerSearch] = useState("");
  const [errors, setErrors] = useState({});
  const [sourceModalVisible, setSourceModalVisible] = useState(false);

  /* ────── RTK ────── */
  const [createAddress] = useCreateAddressMutation();
  const { data: allOrdersData, isLoading: ordersLoading } =
    useGetAllOrdersQuery();
  const orders = useMemo(() => allOrdersData?.orders ?? [], [allOrdersData]);

  const handleAddSourceCustomer = () => setSourceModalVisible(true);
  const handleSourceCustomerAdded = () => setSourceModalVisible(false);

  /* ────── Memos ────── */
  const filteredAddresses = useMemo(
    () =>
      selectedCustomer
        ? addresses.filter((a) => a.customerId === selectedCustomer)
        : [],
    [addresses, selectedCustomer],
  );

  const defaultAddress = useMemo(
    () =>
      customers.find((c) => c.customerId === selectedCustomer)?.address ?? null,
    [customers, selectedCustomer],
  );

  const sourceCustomers = useMemo(
    () =>
      sourceType
        ? customers.filter(
            (c) => c.customerType?.toLowerCase() === sourceType.toLowerCase(),
          )
        : [],
    [customers, sourceType],
  );

  /* ────── Debounced Search ────── */
  const debouncedSearch = useCallback(
    debounce((v) => setCustomerSearch(v), 300),
    [],
  );

  /* ────── Auto-fill dueDate ────── */
  useEffect(() => {
    if (!orderData.dueDate) {
      setOrderData((p) => ({
        ...p,
        dueDate: moment().add(1, "day").format("YYYY-MM-DD"),
      }));
    }
  }, [orderData.dueDate, setOrderData]);

  /* ────── Sync shipTo with billing ────── */
  useEffect(() => {
    if (
      !selectedCustomer ||
      !defaultAddress ||
      isCreatingAddress ||
      !useBillingAddress ||
      orderData?.shipTo
    )
      return;

    const match = filteredAddresses.find(
      (a) =>
        a.street?.trim().toLowerCase() ===
          defaultAddress.street?.trim().toLowerCase() &&
        a.city?.trim().toLowerCase() ===
          defaultAddress.city?.trim().toLowerCase() &&
        a.state?.trim().toLowerCase() ===
          defaultAddress.state?.trim().toLowerCase() &&
        (a.postalCode || a.zip) ===
          (defaultAddress.postalCode || defaultAddress.zip) &&
        (a.country || "india").toLowerCase() ===
          (defaultAddress.country || "india").toLowerCase(),
    );

    if (match) {
      handleOrderChange("shipTo", match.addressId);
      return;
    }

    const create = async () => {
      setIsCreatingAddress(true);
      try {
        const res = await createAddress({
          customerId: selectedCustomer,
          street: defaultAddress.street ?? "",
          city: defaultAddress.city ?? "",
          state: defaultAddress.state ?? "",
          postalCode: defaultAddress.postalCode ?? defaultAddress.zip ?? "",
          country: defaultAddress.country ?? "India",
          status: "BILLING",
        }).unwrap();
        handleOrderChange("shipTo", res.addressId);
      } catch (e) {
        message.error(e?.data?.message ?? "Failed to create address");
      } finally {
        setIsCreatingAddress(false);
      }
    };
    create();
  }, [
    useBillingAddress,
    defaultAddress,
    filteredAddresses,
    selectedCustomer,
    orderData?.shipTo,
    isCreatingAddress,
    createAddress,
    handleOrderChange,
  ]);

  const safeShipping = Number(shipping) || 0;

  /* ────── Extra Discount & GST Calc ────── */
  const base = subTotal + safeShipping + tax - totalDiscount;
  const extraDiscAmt = useMemo(() => {
    const v = Number(extraDiscount) || 0;
    return extraDiscountType === "percent"
      ? ((base * v) / 100).toFixed(2)
      : v.toFixed(2);
  }, [base, extraDiscount, extraDiscountType]);

  const gstBase = (base - Number(extraDiscAmt)).toFixed(2);
  const gstAmt = ((Number(gstBase) * gst) / 100).toFixed(2);

  const availableSecondaryUsers = useMemo(() => {
    if (!orderData?.assignedUserId) return users;
    return users.filter((u) => u.userId !== orderData.assignedUserId);
  }, [users, orderData?.assignedUserId]);

  /* ────── Validation Helpers ────── */
  const validateField = useCallback(
    (field) => {
      const err = {};
      switch (field) {
        case "customer":
          if (!selectedCustomer) err.customer = "Customer is required";
          break;
        case "shipping":
          if (!useBillingAddress && !orderData?.shipTo)
            err.shipping = "Shipping address is required";
          break;
        case "dueDate":
          if (!orderData?.dueDate) err.dueDate = "Due date is required";
          break;
        case "assignment":
          if (assignmentType === "team" && !orderData?.assignedTeamId) {
            err.assignment = "Select a team";
          }
          if (assignmentType === "users") {
            if (!orderData?.assignedUserId) {
              err.assignment = "Select primary user";
            } else if (
              orderData?.secondaryUserId &&
              orderData.secondaryUserId === orderData.assignedUserId
            ) {
              err.assignment = "Primary and Secondary user cannot be the same";
            }
          }
          break;
        case "source":
          if (sourceType && !orderData?.source) {
            err.source = "Reference customer is required";
          }
          break;
      }
      return err;
    },
    [
      selectedCustomer,
      useBillingAddress,
      orderData,
      assignmentType,
      sourceType,
    ],
  );

  /* ────── Force Extra Discount to Fixed ────── */
  useEffect(() => {
    if (extraDiscountType !== "fixed") {
      setExtraDiscountType("fixed");
      handleOrderChange("extraDiscountType", "fixed");
    }
  }, [extraDiscountType, handleOrderChange]);

  /* ────── Real-time Validation ────── */
  useEffect(() => {
    const newErrors = {};
    ["customer", "shipping", "dueDate", "assignment", "source"].forEach(
      (field) => {
        Object.assign(newErrors, validateField(field));
      },
    );
    setErrors(newErrors);
  }, [
    selectedCustomer,
    orderData,
    assignmentType,
    sourceType,
    useBillingAddress,
    validateField,
  ]);

  const hasError = (field) => !!errors[field];
  const getError = (field) => errors[field];
  const canSubmit = Object.keys(errors).length === 0 && cartItems.length > 0;

  /* ────── UI Handlers ────── */
  const setShip = (v) => {
    if (v === "sameAsBilling") setUseBillingAddress(true);
    else {
      setUseBillingAddress(false);
      handleOrderChange("shipTo", v);
    }
  };

  const addFollow = () =>
    handleOrderChange("followupDates", [
      ...(orderData.followupDates || []),
      null,
    ]);

  const rmFollow = (i) =>
    handleOrderChange(
      "followupDates",
      (orderData.followupDates || []).filter((_, x) => x !== i),
    );

  const setFollow = (i, d) => {
    const arr = [...(orderData.followupDates || [])];
    arr[i] = d ? moment(d).format("YYYY-MM-DD") : null;
    handleOrderChange("followupDates", arr);
  };

  /* ────── Render ────── */
  if (!cartItems?.length) {
    return (
      <CompactCard>
        <Empty
          description="Cart empty"
          image={<DeleteOutlined style={{ fontSize: 48 }} />}
        />
        <Button
          type="primary"
          icon={<ArrowLeftOutlined />}
          onClick={() => setActiveTab("cart")}
          block
        >
          Back to Cart
        </Button>
      </CompactCard>
    );
  }

  return (
    <Row gutter={12}>
      {/* LEFT – FORM */}
      <Col xs={24} md={16}>
        <CompactCard title={<Title level={5}>Checkout</Title>}>
          <Collapse defaultActiveKey={["1", "2", "3", "4", "5"]} ghost>
            {/* 1. Document & Customer */}
            <Panel header="Customer" key="1">
              <TightRow gutter={8}>
                <Col span={8}>
                  <Text strong>
                    Customer <span style={{ color: "red" }}>*</span>
                  </Text>
                </Col>
                <Col span={16}>
                  <Space.Compact block>
                    <MiniSelect
                      showSearch
                      filterOption={false}
                      value={selectedCustomer}
                      onSearch={debouncedSearch}
                      onChange={(v) => {
                        setSelectedCustomer(v);
                        handleOrderChange("createdFor", v);
                        handleOrderChange("shipTo", null);
                        setUseBillingAddress(false);
                      }}
                      loading={customersLoading}
                      status={hasError("customer") ? "error" : ""}
                    >
                      {(customerSearch
                        ? customers.filter((c) =>
                            c.name
                              .toLowerCase()
                              .includes(customerSearch.toLowerCase()),
                          )
                        : customers
                      ).map((c) => (
                        <Option key={c.customerId} value={c.customerId}>
                          {c.name} ({c.email})
                        </Option>
                      ))}
                    </MiniSelect>
                    {hasError("customer") && (
                      <Text
                        type="danger"
                        style={{ fontSize: 12, display: "block" }}
                      >
                        {getError("customer")}
                      </Text>
                    )}
                    <Button type="primary" onClick={handleAddCustomer}>
                      +
                    </Button>
                  </Space.Compact>
                </Col>
              </TightRow>

              <TightRow gutter={8}>
                <Col span={8}>
                  <Text strong>
                    Shipping <span style={{ color: "red" }}>*</span>
                  </Text>
                </Col>
                <Col span={16}>
                  <Space style={{ width: "100%", display: "flex", gap: 8 }}>
                    <MiniSelect
                      value={
                        useBillingAddress ? "sameAsBilling" : orderData?.shipTo
                      }
                      onChange={setShip}
                      loading={addressesLoading || isCreatingAddress}
                      disabled={!selectedCustomer}
                      status={hasError("shipping") ? "error" : ""}
                      // ────── Address visibility fixes ──────
                      optionLabelProp="title"
                      popupMatchSelectWidth={340}
                      dropdownMatchSelectWidth={false}
                    >
                      {defaultAddress && (
                        <Option
                          value="sameAsBilling"
                          title={`Same as Billing: ${defaultAddress.street}, ${defaultAddress.city}, ${defaultAddress.state || ""} ${defaultAddress.postalCode || ""}`}
                        >
                          Same as Billing ({defaultAddress.city || "—"})
                        </Option>
                      )}

                      {filteredAddresses.map((a) => (
                        <Option
                          key={a.addressId}
                          value={a.addressId}
                          title={`${a.street}, ${a.city}, ${a.state || ""} ${a.postalCode || ""} (${a.status})`}
                        >
                          {a.street?.slice(0, 28)}
                          {a.street?.length > 28 ? "..." : ""}, {a.city} (
                          {a.status})
                        </Option>
                      ))}
                    </MiniSelect>

                    {hasError("shipping") && (
                      <Text
                        type="danger"
                        style={{ fontSize: 12, display: "block" }}
                      >
                        {getError("shipping")}
                      </Text>
                    )}

                    <Button
                      type="primary"
                      onClick={handleAddAddress}
                      disabled={!selectedCustomer}
                      style={{ minWidth: 40 }}
                    >
                      +
                    </Button>
                  </Space>
                </Col>
              </TightRow>
            </Panel>

            {/* 2. Reference */}
            <Panel header="Reference" key="2">
              <TightRow gutter={8}>
                <Col span={8}>
                  <Text strong>Type</Text>
                </Col>
                <Col span={16}>
                  <MiniSelect
                    value={sourceType}
                    onChange={(v) => {
                      setSourceType(v);
                      handleOrderChange("source", "");
                    }}
                    allowClear
                  >
                    {SOURCE_TYPES.map((t) => (
                      <Option key={t} value={t}>
                        {t}
                      </Option>
                    ))}
                  </MiniSelect>
                </Col>
              </TightRow>

              <TightRow gutter={8}>
                <Col span={8}>
                  <Text strong>Customer</Text>
                </Col>
                <Col span={16}>
                  <Space.Compact block>
                    <MiniSelect
                      value={orderData?.source}
                      onChange={(v) => handleOrderChange("source", v)}
                      disabled={!sourceType}
                      allowClear
                      status={hasError("source") ? "error" : ""}
                      placeholder="Select reference customer"
                    >
                      {sourceCustomers.map((c) => (
                        <Option key={c.customerId} value={c.customerId}>
                          {c.name}
                        </Option>
                      ))}
                    </MiniSelect>
                    <Button
                      type="primary"
                      onClick={handleAddSourceCustomer}
                      disabled={!sourceType}
                    >
                      +
                    </Button>
                  </Space.Compact>

                  {hasError("source") && (
                    <Text
                      type="danger"
                      style={{ fontSize: 12, display: "block" }}
                    >
                      {getError("source")}
                    </Text>
                  )}
                </Col>
              </TightRow>
            </Panel>

            {/* 4. Dates & Assignment */}
            <Panel header="Dates & Assignment" key="4">
              <TightRow gutter={8}>
                <Col span={8}>
                  <Text strong>
                    Due Date <span style={{ color: "red" }}>*</span>
                  </Text>
                </Col>
                <Col span={16}>
                  <MiniDate
                    selected={momentToDate(
                      orderData?.dueDate ? moment(orderData.dueDate) : null,
                    )}
                    onChange={(d) =>
                      handleOrderChange(
                        "dueDate",
                        d ? moment(d).format("YYYY-MM-DD") : "",
                      )
                    }
                    minDate={new Date()}
                    className={hasError("dueDate") ? "error-border" : ""}
                    dateFormat="dd/MM/yyyy"
                    placeholderText="DD/MM/YYYY"
                  />
                  {hasError("dueDate") && (
                    <Text
                      type="danger"
                      style={{ fontSize: 12, display: "block" }}
                    >
                      {getError("dueDate")}
                    </Text>
                  )}
                </Col>
              </TightRow>

              <TightRow gutter={8}>
                <Col span={8}>
                  <Text strong>Follow-ups</Text>
                </Col>
                <Col span={16}>
                  {(orderData?.followupDates || []).map((d, i) => (
                    <Space key={i} style={{ width: "100%", marginBottom: 4 }}>
                      <MiniDate
                        selected={momentToDate(d ? moment(d) : null)}
                        onChange={(v) => setFollow(i, v)}
                        minDate={new Date()}
                        maxDate={
                          orderData?.dueDate
                            ? moment(orderData.dueDate).toDate()
                            : undefined
                        }
                        dateFormat="dd/MM/yyyy"
                        placeholderText="DD/MM/YYYY"
                      />
                      <Button
                        danger
                        size="small"
                        icon={<DeleteOutlined />}
                        onClick={() => rmFollow(i)}
                      />
                    </Space>
                  ))}
                  <Button
                    size="small"
                    icon={<PlusOutlined />}
                    onClick={addFollow}
                  >
                    Add
                  </Button>
                </Col>
              </TightRow>

              <TightRow gutter={8}>
                <Col span={8}>
                  <Text strong>Assign</Text>
                </Col>
                <Col span={16}>
                  <Radio.Group
                    value={assignmentType}
                    onChange={(e) => {
                      const v = e.target.value;
                      setAssignmentType(v);
                      setOrderData((p) => ({
                        ...p,
                        assignedTeamId: v === "team" ? p.assignedTeamId : "",
                        assignedUserId: v === "users" ? p.assignedUserId : "",
                        secondaryUserId: v === "users" ? p.secondaryUserId : "",
                      }));
                    }}
                  >
                    <Radio value="team">Team</Radio>
                    <Radio value="users">Users</Radio>
                  </Radio.Group>
                </Col>
              </TightRow>

              {assignmentType === "team" && (
                <TightRow gutter={8}>
                  <Col span={8}>
                    <Text strong>
                      Team <span style={{ color: "red" }}>*</span>
                    </Text>
                  </Col>
                  <Col span={16}>
                    <MiniSelect
                      value={orderData?.assignedTeamId}
                      onChange={(v) => handleOrderChange("assignedTeamId", v)}
                      loading={teamsLoading}
                      status={hasError("assignment") ? "error" : ""}
                      dropdownRender={(menu) => (
                        <>
                          {menu}
                          <Divider style={{ margin: "4px 0" }} />
                          <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            onClick={() => handleTeamAdded(true)}
                            block
                            size="small"
                          >
                            Add Team
                          </Button>
                        </>
                      )}
                    >
                      {teams.map((t) => (
                        <Option key={t.id} value={t.id}>
                          {t.teamName}
                        </Option>
                      ))}
                    </MiniSelect>
                    {hasError("assignment") && assignmentType === "team" && (
                      <Text
                        type="danger"
                        style={{ fontSize: 12, display: "block" }}
                      >
                        {getError("assignment")}
                      </Text>
                    )}
                  </Col>
                </TightRow>
              )}

              {assignmentType === "users" && (
                <>
                  <TightRow gutter={8}>
                    <Col span={8}>
                      <Text strong>
                        Primary <span style={{ color: "red" }}>*</span>
                      </Text>
                    </Col>
                    <Col span={16}>
                      <MiniSelect
                        value={orderData?.assignedUserId}
                        onChange={(v) => handleOrderChange("assignedUserId", v)}
                        loading={usersLoading}
                        status={hasError("assignment") ? "error" : ""}
                      >
                        {users.map((u) => (
                          <Option key={u.userId} value={u.userId}>
                            {u.username || u.name}
                          </Option>
                        ))}
                      </MiniSelect>
                      {hasError("assignment") && assignmentType === "users" && (
                        <Text
                          type="danger"
                          style={{ fontSize: 12, display: "block" }}
                        >
                          {getError("assignment")}
                        </Text>
                      )}
                    </Col>
                  </TightRow>

                  <TightRow gutter={8}>
                    <Col span={8}>
                      <Text strong>Secondary</Text>
                    </Col>
                    <Col span={16}>
                      <MiniSelect
                        value={orderData?.secondaryUserId}
                        onChange={(v) =>
                          handleOrderChange("secondaryUserId", v)
                        }
                        allowClear
                        loading={usersLoading}
                        placeholder="Select secondary user"
                      >
                        {availableSecondaryUsers.map((u) => (
                          <Option key={u.userId} value={u.userId}>
                            {u.username || u.name}
                          </Option>
                        ))}
                      </MiniSelect>
                    </Col>
                  </TightRow>
                </>
              )}
            </Panel>

            {/* 5. Misc & Discount */}
            <Panel header="Misc & Discount" key="5">
              <TightRow gutter={8}>
                <Col span={8}>
                  <Text strong>Status</Text>
                </Col>
                <Col span={16}>
                  <MiniSelect
                    value={orderData?.status}
                    onChange={(v) => handleOrderChange("status", v)}
                  >
                    {STATUS_VALUES.map((s) => (
                      <Option key={s} value={s}>
                        {s.replace("_", " ")}
                      </Option>
                    ))}
                  </MiniSelect>
                </Col>
              </TightRow>

              <TightRow gutter={8}>
                <Col span={8}>
                  <Text strong>Priority</Text>
                </Col>
                <Col span={16}>
                  <MiniSelect
                    value={orderData?.priority}
                    onChange={(v) => handleOrderChange("priority", v)}
                  >
                    <Option value="high">High</Option>
                    <Option value="medium">Medium</Option>
                    <Option value="low">Low</Option>
                  </MiniSelect>
                </Col>
              </TightRow>
{/* 
              <TightRow gutter={8}>
                <Col span={8}>
                  <Text strong>GST %</Text>
                </Col>
                <Col span={16}>
                  <MiniNumber
                    min={0}
                    max={100}
                    step={0.01}
                    value={gst}
                    onChange={(v) => {
                      setGst(v ?? 0);
                      handleOrderChange("gst", v ?? 0);
                    }}
                    disabled
                  />
                </Col>
              </TightRow> */}

              {/* Extra Discount – Fixed Amount Only */}
              <TightRow gutter={8} align="middle">
                <Col span={8}>
                  <Text strong>Extra Discount</Text>
                </Col>
                <Col span={16}>
                  <Space.Compact block>
                    <MiniNumber
                      min={0}
                      precision={2}
                      value={extraDiscount}
                      onChange={(v) => {
                        const val = v ?? 0;
                        setExtraDiscount(val);
                        handleOrderChange("extraDiscount", val);
                      }}
                      placeholder="0"
                      addonBefore="₹"
                      style={{ width: "100%" }}
                    />
                  </Space.Compact>
                  <Text
                    type="secondary"
                    style={{ fontSize: 11, display: "block", marginTop: 4 }}
                  >
                    Fixed amount discount applied after subtotal, tax & shipping
                  </Text>
                </Col>
              </TightRow>

              <TightRow gutter={8}>
                <Col span={8}>
                  <Text strong>Description</Text>
                </Col>
                <Col span={16}>
                  <Input.TextArea
                    rows={2}
                    maxLength={60}
                    value={orderData?.description}
                    onChange={(e) =>
                      handleOrderChange("description", e.target.value)
                    }
                  />
                </Col>
              </TightRow>
            </Panel>
          </Collapse>
        </CompactCard>
      </Col>

      {/* RIGHT – SUMMARY */}
      <Col xs={24} md={8}>
        <CompactCard title={<Text strong>Summary</Text>}>
          <OrderTotal
            tax={tax}
            discount={totalDiscount}
            roundOff={roundOff}
            subTotal={subTotal}
            extraDiscount={Number(extraDiscAmt)}
            gst={gst}
            gstAmount={Number(gstAmt)}
          />
          <Divider style={{ margin: "8px 0" }} />
          <CheckoutBtn
            type="primary"
            block
            icon={<CheckCircleOutlined />}
            onClick={() => {
              if (!canSubmit) {
                message.error("Please fix all required fields");
                return;
              }
              handleCreateDocument();
            }}
            disabled={!canSubmit}
          >
            Create Order
          </CheckoutBtn>
          <Button
            block
            style={{ marginTop: 4 }}
            onClick={() => setActiveTab("cart")}
          >
            Back to Cart
          </Button>
        </CompactCard>
      </Col>

      <AddCustomerModal
        visible={sourceModalVisible}
        onClose={() => setSourceModalVisible(false)}
      />
    </Row>
  );
};

export default React.memo(OrderForm);
