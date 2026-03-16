// src/components/Quotation/QuotationForm.jsx
import React, { useState, useEffect, useMemo } from "react";
import {
  Card,
  Button,
  Select,
  InputNumber,
  Row,
  Col,
  Empty,
  Typography,
  Space,
  Divider,
  Collapse,
  Spin,
  message,
  Alert,
  Tag,
  Modal,
  Form,
  Input,
} from "antd";
import {
  UserAddOutlined,
  CheckCircleOutlined,
  ArrowLeftOutlined,
  DeleteOutlined,
  PlusOutlined,
  HomeOutlined,
  ApartmentOutlined,
  PushpinOutlined,
} from "@ant-design/icons";
import styled from "styled-components";
import OrderTotal from "./OrderTotal";
import { useGetCustomersQuery } from "../../api/customerApi";
import moment from "moment";
import DatePicker from "react-datepicker";
import { useAuth } from "../../context/AuthContext";
import "react-datepicker/dist/react-datepicker.css";
import { v4 as uuidv4 } from "uuid";

const RESTRICTED_ROLES = ["SUPER_ADMIN", "DEVELOPER", "ADMIN"];
const { Text, Title } = Typography;
const { Panel } = Collapse;
const { Option } = Select;

/* ────────────────────── Styled Components ────────────────────── */
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
    padding: 0 6px;
  }
`;

const MiniSelect = styled(Select)`
  width: 100%;
  .ant-select-selector {
    padding: 0 8px;
    height: 30px;
  }
`;

const MiniNumber = styled(InputNumber)`
  width: 100%;
  height: 30px;
  .ant-input-number-input {
    height: 28px;
  }
`;

const MiniDate = styled(DatePicker)`
  width: 100%;
  height: 30px;
  .react-datepicker-wrapper,
  input {
    height: 30px;
    padding: 4px 8px;
  }
`;

const CheckoutBtn = styled(Button)`
  height: 40px;
  font-weight: 600;
  background: #e31e24;
  border-color: #e31e24;
  color: white;
  &:hover {
    background: #ff4d4f;
    border-color: #ff4d4f;
  }
`;

/* ────────────────────── Helpers ────────────────────── */
const momentToDate = (m) => (m ? m.toDate() : null);

/* ────────────────────── Main Component ────────────────────── */
const QuotationForm = ({
  quotationData,
  setQuotationData,
  handleQuotationChange,
  selectedCustomer,
  setSelectedCustomer,
  addresses,
  addressesLoading,
  documentType,
  cartItems,
  setCartItems, // ← still needed — we update it here
  subTotal,
  shipping,
  tax,
  discount,
  extraDiscount,
  gst,
  setGst,
  billingAddressId,
  handleAddCustomer,
  handleAddAddress,
  setActiveTab,
  handleCreateDocument,
  useBillingAddress,
  setBillingAddressId,
  setUseBillingAddress,
  previewVisible,
  setPreviewVisible,
}) => {
  const { auth } = useAuth();
  const canCreatePurchaseOrder = RESTRICTED_ROLES.includes(auth?.role || "");

  const [isCreatingAddress, setIsCreatingAddress] = useState(false);

  const [floorModalVisible, setFloorModalVisible] = useState(false);
  const [roomModal, setRoomModal] = useState({
    visible: false,
    floorNumber: null,
  });

  // ── New: Assignment modal state (now local) ────────────────────
  const [assignModal, setAssignModal] = useState({
    visible: false,
    itemId: null,
  });
  const [selectedFloor, setSelectedFloor] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState(null);

  const [floorForm] = Form.useForm();
  const [roomForm] = Form.useForm();

  // Initialize floors if empty
  useEffect(() => {
    if (!quotationData.floors || quotationData.floors.length === 0) {
      handleQuotationChange("floors", [
        { number: 1, name: "Ground Floor", rooms: [] },
      ]);
    }
  }, [quotationData.floors, handleQuotationChange]);

  // ── Floor & Room Handlers ──────────────────────────────────────
  const addFloor = (values) => {
    const currentFloors = quotationData.floors || [];
    const newNumber = currentFloors.length + 1;
    const newFloor = {
      number: newNumber,
      name:
        values.name ||
        (newNumber === 1
          ? "Ground Floor"
          : `${newNumber}${["st", "nd", "rd"][(newNumber - 2) % 3] || "th"} Floor`),
      rooms: [],
    };
    handleQuotationChange("floors", [...currentFloors, newFloor]);
    setFloorModalVisible(false);
    floorForm.resetFields();
    message.success("Floor added");
  };

  const addRoom = (values) => {
    const updatedFloors = (quotationData.floors || []).map((floor) =>
      floor.number === roomModal.floorNumber
        ? {
            ...floor,
            rooms: [
              ...(floor.rooms || []),
              {
                id: uuidv4(),
                name: values.name,
                type: values.type || null,
              },
            ],
          }
        : floor,
    );
    handleQuotationChange("floors", updatedFloors);
    setRoomModal({ visible: false, floorNumber: null });
    roomForm.resetFields();
    message.success("Room added");
  };

  // ── Item Assignment (now fully inside component) ───────────────
  const openAssignModal = (itemId) => {
    const item = cartItems.find((i) => i.id === itemId);
    if (!item) return;

    // Pre-fill if already assigned
    setSelectedFloor(item.floor_number || null);
    setSelectedRoom(item.room_id || null);

    setAssignModal({ visible: true, itemId });
  };

  const assignItem = () => {
    if (!selectedFloor) {
      return message.error("Please select a floor");
    }

    const updatedItems = cartItems.map((item) =>
      item.id === assignModal.itemId
        ? {
            ...item,
            floor_number: selectedFloor,
            room_id: selectedRoom || null,
          }
        : item,
    );

    setCartItems(updatedItems);
    message.success("Item assigned successfully");

    // Reset & close
    setAssignModal({ visible: false, itemId: null });
    setSelectedFloor(null);
    setSelectedRoom(null);
  };

  // ── Floor Summary ───────────────────────────────────────────────
  const floorSummary = useMemo(() => {
    const summary = {};
    (quotationData.floors || []).forEach((f) => {
      summary[f.number] = {
        name: f.name,
        count: 0,
        total: 0,
      };
    });

    cartItems.forEach((item) => {
      if (item.floor_number && summary[item.floor_number]) {
        summary[item.floor_number].count += item.quantity || 1;
        const lineTotal =
          (item.quantity || 1) *
          (item.price || 0) *
          (1 - (item.discount || 0) / 100);
        summary[item.floor_number].total += lineTotal;
      }
    });

    return Object.values(summary);
  }, [cartItems, quotationData.floors]);

  const unassignedCount = cartItems.filter((i) => !i.floor_number).length;

  // ── Customer Search Pagination (unchanged) ─────────────────────
  const [customerSearch, setCustomerSearch] = useState("");
  const [customerPage, setCustomerPage] = useState(1);
  const [accumulatedCustomers, setAccumulatedCustomers] = useState([]);
  const [hasMore, setHasMore] = useState(true);

  const { data: pageData, isFetching: isPageFetching } = useGetCustomersQuery(
    {
      page: customerPage,
      limit: 30,
      search: customerSearch.trim() || undefined,
    },
    { skip: !hasMore },
  );

  useEffect(() => {
    if (!pageData?.data) return;

    setAccumulatedCustomers((prev) => {
      const newCustomers = pageData.data.filter(
        (newCust) => !prev.some((old) => old.customerId === newCust.customerId),
      );
      return [...prev, ...newCustomers];
    });

    const pagination = pageData.pagination;
    if (
      pageData.data.length < 30 ||
      (pagination && pagination.page >= pagination.totalPages)
    ) {
      setHasMore(false);
    }
  }, [pageData]);

  useEffect(() => {
    setAccumulatedCustomers([]);
    setCustomerPage(1);
    setHasMore(true);
  }, [customerSearch]);

  const customerOptions = useMemo(() => {
    return accumulatedCustomers.map((cust) => ({
      value: cust.customerId,
      label: (
        <div style={{ lineHeight: 1.3 }}>
          <strong>{cust.name || "Unnamed Customer"}</strong>
          {cust.mobileNumber && (
            <span style={{ marginLeft: 8, color: "#555", fontSize: "0.9em" }}>
              {cust.mobileNumber}
            </span>
          )}
          {cust.companyName && (
            <div style={{ fontSize: "0.85em", color: "#777", marginTop: 2 }}>
              {cust.companyName}
            </div>
          )}
        </div>
      ),
      title: `${cust.name || "Unnamed"}${cust.mobileNumber ? ` • ${cust.mobileNumber}` : ""}`,
      searchText:
        `${cust.name || ""} ${cust.mobileNumber || ""} ${cust.email || ""} ${cust.companyName || ""}`.toLowerCase(),
    }));
  }, [accumulatedCustomers]);

  const selectedCustomerData = useMemo(
    () => accumulatedCustomers.find((c) => c.customerId === selectedCustomer),
    [accumulatedCustomers, selectedCustomer],
  );

  // ── Address logic (your original) ──────────────────────────────
  const defaultAddress = useMemo(() => {
    const billing = addresses.find(
      (a) => a.customerId === selectedCustomer && a.status === "BILLING",
    );
    if (billing) return billing;

    const cust = selectedCustomerData;
    if (!cust?.address) return null;

    let parsed;
    try {
      parsed =
        typeof cust.address === "string"
          ? JSON.parse(cust.address)
          : cust.address;
    } catch {
      return null;
    }

    return {
      street:
        parsed.street === "null" || !parsed.street ? "" : parsed.street.trim(),
      city: parsed.city || "",
      state: parsed.state || "",
      postalCode: parsed.zip || parsed.postalCode || "",
      country: parsed.country || "India",
    };
  }, [addresses, selectedCustomerData, selectedCustomer]);

  const filteredAddresses = useMemo(
    () => addresses.filter((a) => a.customerId === selectedCustomer),
    [addresses, selectedCustomer],
  );

  const hasBillingAddress = useMemo(
    () =>
      addresses.some(
        (a) => a.customerId === selectedCustomer && a.status === "BILLING",
      ),
    [addresses, selectedCustomer],
  );

  const dropdownValue = useMemo(() => {
    if (useBillingAddress) {
      if (billingAddressId) return billingAddressId;
      if (isCreatingAddress) return "creating";
      if (defaultAddress && !hasBillingAddress) return "sameAsBilling";
    }
    return quotationData.shipTo;
  }, [
    useBillingAddress,
    billingAddressId,
    isCreatingAddress,
    defaultAddress,
    hasBillingAddress,
    quotationData.shipTo,
  ]);

  // ── Follow-up dates handlers (your original) ───────────────────
  const handleFollowup = (index, date) => {
    const dates = [...quotationData.followupDates];
    dates[index] = date ? moment(date).format("YYYY-MM-DD") : "";
    if (
      date &&
      quotationData.dueDate &&
      moment(date).isAfter(quotationData.dueDate)
    ) {
      message.warning("Follow-up date cannot be after due date");
    }
    handleQuotationChange("followupDates", dates);
  };

  const addFollowup = () =>
    handleQuotationChange("followupDates", [
      ...quotationData.followupDates,
      "",
    ]);

  const removeFollowup = (index) =>
    handleQuotationChange(
      "followupDates",
      quotationData.followupDates.filter((_, i) => i !== index),
    );

  // ── Render ─────────────────────────────────────────────────────
  if (!cartItems.length) {
    return (
      <CompactCard>
        <Empty
          description="Cart is empty"
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
    <Row gutter={[16, 16]}>
      {/* Left Column - Form */}
      <Col xs={24} md={16}>
        <CompactCard title={<Title level={5}>Quotation Details</Title>}>
          <Collapse defaultActiveKey={["1", "2", "4", "3"]} ghost>
            {/* Customer & Address */}
            <Panel header="Customer & Address" key="1">
              <TightRow gutter={8}>
                <Col span={8}>
                  <Text strong>
                    Customer <span style={{ color: "red" }}>*</span>
                  </Text>
                </Col>
                <Col span={16}>
                  <Space.Compact style={{ width: "100%" }}>
                    <Select
                      showSearch
                      placeholder="Search by name, phone, email, company..."
                      value={selectedCustomer}
                      onChange={(value) => {
                        setSelectedCustomer(value);
                        setQuotationData((prev) => ({ ...prev, shipTo: null }));
                        setUseBillingAddress(false);
                        setBillingAddressId(null);
                      }}
                      onSearch={setCustomerSearch}
                      filterOption={(input, option) =>
                        option?.searchText?.includes(input.toLowerCase())
                      }
                      onPopupScroll={(e) => {
                        const target = e.target;
                        if (
                          target.scrollTop + target.offsetHeight >=
                            target.scrollHeight - 60 &&
                          !isPageFetching &&
                          hasMore
                        ) {
                          setCustomerPage((prev) => prev + 1);
                        }
                      }}
                      options={customerOptions}
                      loading={isPageFetching && customerPage === 1}
                      notFoundContent={
                        isPageFetching ? (
                          <Spin size="small" tip="Loading customers..." />
                        ) : (
                          "No customers found"
                        )
                      }
                      dropdownRender={(menu) => (
                        <>
                          {menu}
                          {hasMore && isPageFetching && (
                            <div
                              style={{
                                textAlign: "center",
                                padding: "12px 0",
                                color: "#888",
                              }}
                            >
                              <Spin size="small" /> Loading more...
                            </div>
                          )}
                        </>
                      )}
                      style={{ flex: 1 }}
                      allowClear
                      optionLabelProp="title"
                    />
                    <Button
                      type="primary"
                      icon={<PlusOutlined />}
                      onClick={handleAddCustomer}
                      style={{ minWidth: 40 }}
                    />
                  </Space.Compact>
                </Col>
              </TightRow>

              <TightRow gutter={8}>
                <Col span={8}>
                  <Text strong>Shipping Address</Text>
                </Col>
                <Col span={16}>
                  <Space.Compact style={{ width: "100%" }}>
                    <MiniSelect
                      value={dropdownValue}
                      onChange={(v) => {
                        if (v === "sameAsBilling") {
                          setUseBillingAddress(true);
                          setBillingAddressId(null);
                          handleQuotationChange("shipTo", null);
                        } else {
                          setUseBillingAddress(false);
                          setBillingAddressId(null);
                          handleQuotationChange("shipTo", v);
                        }
                      }}
                      loading={addressesLoading || isCreatingAddress}
                      disabled={!selectedCustomer}
                      optionLabelProp="title"
                      dropdownMatchSelectWidth={false}
                      popupMatchSelectWidth={320}
                    >
                      {defaultAddress && !hasBillingAddress && (
                        <Option
                          value="sameAsBilling"
                          disabled={isCreatingAddress}
                          title="Use default billing address as shipping"
                        >
                          Same as Billing –{" "}
                          {defaultAddress.street?.slice(0, 40)}...
                        </Option>
                      )}

                      {isCreatingAddress && (
                        <Option value="creating" disabled>
                          Creating new address...
                        </Option>
                      )}

                      {filteredAddresses.map((a) => (
                        <Option
                          key={a.addressId}
                          value={a.addressId}
                          title={`${a.street}, ${a.city}, ${a.state || ""} ${a.postalCode || ""} (${a.status})`}
                        >
                          {a.street?.slice(0, 35)}
                          {a.street?.length > 35 ? "..." : ""}, {a.city} (
                          {a.status})
                        </Option>
                      ))}
                    </MiniSelect>

                    <Button
                      type="primary"
                      onClick={handleAddAddress}
                      disabled={!selectedCustomer}
                      style={{ minWidth: 40 }}
                    >
                      +
                    </Button>
                  </Space.Compact>
                </Col>
              </TightRow>
            </Panel>

            {/* Dates & Follow-ups */}
            <Panel header="Dates & Follow-ups" key="2">
              <TightRow gutter={8}>
                <Col span={8}>
                  <Text strong>
                    Due Date <span style={{ color: "red" }}>*</span>
                  </Text>
                </Col>
                <Col span={16}>
                  <MiniDate
                    selected={momentToDate(
                      quotationData.dueDate
                        ? moment(quotationData.dueDate)
                        : null,
                    )}
                    onChange={(d) =>
                      handleQuotationChange(
                        "dueDate",
                        d ? moment(d).format("YYYY-MM-DD") : "",
                      )
                    }
                    minDate={new Date()}
                    dateFormat="dd/MM/yyyy"
                    placeholderText="DD/MM/YYYY"
                  />
                </Col>
              </TightRow>

              <TightRow gutter={8}>
                <Col span={8}>
                  <Text strong>Follow-ups</Text>
                </Col>
                <Col span={16}>
                  {quotationData.followupDates.map((d, i) => (
                    <Space key={i} style={{ width: "100%", marginBottom: 8 }}>
                      <MiniDate
                        selected={momentToDate(d ? moment(d) : null)}
                        onChange={(date) => handleFollowup(i, date)}
                        minDate={new Date()}
                        dateFormat="dd/MM/yyyy"
                        placeholderText="DD/MM/YYYY"
                      />
                      <Button
                        danger
                        size="small"
                        icon={<DeleteOutlined />}
                        onClick={() => removeFollowup(i)}
                      />
                    </Space>
                  ))}
                  <Button
                    size="small"
                    icon={<PlusOutlined />}
                    onClick={addFollowup}
                  >
                    Add Follow-up
                  </Button>
                </Col>
              </TightRow>
            </Panel>

            {/* Site Layout - Floors & Rooms */}
            <Panel
              header={
                <Space>
                  <ApartmentOutlined />
                  Site Layout (Floors & Rooms)
                </Space>
              }
              key="4"
            >
              <Space style={{ marginBottom: 16 }}>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => setFloorModalVisible(true)}
                >
                  Add Floor
                </Button>
              </Space>

              <Collapse ghost>
                {(quotationData.floors || []).map((floor) => (
                  <Panel
                    key={floor.number}
                    header={
                      <Space>
                        <HomeOutlined />
                        <Text strong>{floor.name}</Text>
                        <Tag color="blue">{floor.rooms?.length || 0} rooms</Tag>
                        <Tag color="default">
                          {floorSummary.find((s) => s.name === floor.name)
                            ?.count || 0}{" "}
                          items
                        </Tag>
                      </Space>
                    }
                    extra={
                      <Button
                        size="small"
                        icon={<PlusOutlined />}
                        onClick={() =>
                          setRoomModal({
                            visible: true,
                            floorNumber: floor.number,
                          })
                        }
                      >
                        Add Room
                      </Button>
                    }
                  >
                    <Space wrap size={[0, 8]}>
                      {floor.rooms?.map((room) => (
                        <Tag key={room.id} color="geekblue">
                          {room.name} {room.type && `(${room.type})`}
                        </Tag>
                      ))}
                      {(!floor.rooms || floor.rooms.length === 0) && (
                        <Text type="secondary">No rooms added yet</Text>
                      )}
                    </Space>
                  </Panel>
                ))}
              </Collapse>

              {unassignedCount > 0 && (
                <Alert
                  style={{ marginTop: 16 }}
                  message={`${unassignedCount} item${unassignedCount > 1 ? "s" : ""} not assigned to any floor/room`}
                  type="warning"
                  showIcon
                />
              )}
            </Panel>

            {/* Global Discount */}
            <Panel header="Discount & Notes" key="3">
              <TightRow gutter={16} align="middle">
                <Col span={8}>
                  <Text strong>Global Discount</Text>
                </Col>
                <Col span={16}>
                  <MiniNumber
                    value={quotationData.discountAmount || ""}
                    onChange={(val) =>
                      handleQuotationChange(
                        "discountAmount",
                        val === null ? "" : val.toString(),
                      )
                    }
                    placeholder="500"
                    min={0}
                    precision={2}
                    addonBefore="₹"
                  />
                  <Text
                    type="secondary"
                    style={{ fontSize: 12, display: "block", marginTop: 4 }}
                  >
                    Fixed amount applied after subtotal, tax & shipping
                  </Text>
                </Col>
              </TightRow>
            </Panel>
          </Collapse>

          {/* ── New: Cart Items with Assignment ────────────────────── */}
          <Divider orientation="left" style={{ margin: "24px 0 16px" }}>
            Cart Items & Location Assignment
          </Divider>

          <Space direction="vertical" style={{ width: "100%" }} size="middle">
            {cartItems.map((item) => (
              <Card
                key={item.id}
                size="small"
                title={
                  <Space>
                    <Text strong>{item.name}</Text>
                    <Tag color="blue">×{item.quantity || 1}</Tag>
                    {item.floor_number && (
                      <Tag color="geekblue">
                        {quotationData.floors?.find(
                          (f) => f.number === item.floor_number,
                        )?.name || `Floor ${item.floor_number}`}
                        {item.room_id && (
                          <>
                            {" → "}
                            {
                              quotationData.floors
                                ?.find((f) => f.number === item.floor_number)
                                ?.rooms?.find((r) => r.id === item.room_id)
                                ?.name
                            }
                          </>
                        )}
                      </Tag>
                    )}
                  </Space>
                }
                extra={
                  <Button
                    type="link"
                    icon={<PushpinOutlined />}
                    onClick={() => openAssignModal(item.id)}
                  >
                    {item.floor_number ? "Change" : "Assign"}
                  </Button>
                }
              >
                <Space split={<Divider type="vertical" />}>
                  <Text>₹{(item.price || 0).toLocaleString()}</Text>
                  {item.discount > 0 && (
                    <Text type="secondary">-{item.discount}%</Text>
                  )}
                </Space>
              </Card>
            ))}
          </Space>

          {unassignedCount > 0 && (
            <Alert
              style={{ marginTop: 16 }}
              message={`${unassignedCount} item${unassignedCount > 1 ? "s" : ""} still unassigned`}
              type="warning"
              showIcon
            />
          )}
        </CompactCard>
      </Col>

      {/* Right Column - Summary */}
      <Col xs={24} md={8}>
        <CompactCard
          title={<Text strong>Order Summary</Text>}
          style={{ position: "sticky", top: 16 }}
        >
          <OrderTotal
            subTotal={subTotal}
            discount={discount}
            extraDiscount={extraDiscount}
            tax={tax}
            shipping={shipping}
            roundOff={0}
            autoRound={true}
          />

          <Divider style={{ margin: "16px 0 12px" }} />

          <Title level={5} style={{ marginBottom: 12 }}>
            Items by Floor
          </Title>

          {floorSummary.length > 0 ? (
            floorSummary.map((f) => (
              <div key={f.name} style={{ marginBottom: 12 }}>
                <Space
                  align="baseline"
                  style={{ width: "100%", justifyContent: "space-between" }}
                >
                  <Text strong>{f.name}</Text>
                  <Text style={{ color: "#52c41a" }}>
                    ₹{Math.round(f.total).toLocaleString()}
                  </Text>
                </Space>
                <div style={{ fontSize: 12, color: "#555", marginTop: 4 }}>
                  {f.count} item{f.count !== 1 ? "s" : ""}
                </div>
              </div>
            ))
          ) : (
            <Text type="secondary">No items assigned yet</Text>
          )}

          {unassignedCount > 0 && (
            <Text
              type="danger"
              style={{ display: "block", marginTop: 8, fontSize: 13 }}
            >
              {unassignedCount} item{unassignedCount > 1 ? "s" : ""} still
              unassigned
            </Text>
          )}

          <Divider style={{ margin: "16px 0" }} />

          <Button
            type="default"
            size="large"
            block
            style={{ marginBottom: 12 }}
            onClick={() => setPreviewVisible(true)}
          >
            Preview Quotation
          </Button>

          <CheckoutBtn
            block
            size="large"
            icon={<CheckCircleOutlined />}
            disabled={isCreatingAddress}
            onClick={() => {
              if (!selectedCustomer)
                return message.error("Please select a customer");
              if (!quotationData.dueDate)
                return message.error("Please select due date");
              if (unassignedCount > 0) {
                message.warning(
                  `${unassignedCount} item${unassignedCount > 1 ? "s are" : " is"} not assigned to any floor`,
                );
              }

              if (useBillingAddress && !billingAddressId) {
                setIsCreatingAddress(true);
              }

              handleCreateDocument().finally(() => setIsCreatingAddress(false));
            }}
          >
            Create {documentType}
          </CheckoutBtn>

          <Button
            block
            style={{ marginTop: 8 }}
            onClick={() => setActiveTab("cart")}
          >
            Back to Cart
          </Button>
        </CompactCard>
      </Col>

      {/* ── Add Floor Modal ──────────────────────────────────────────── */}
      <Modal
        title="Add New Floor"
        open={floorModalVisible}
        onOk={() => floorForm.submit()}
        onCancel={() => {
          setFloorModalVisible(false);
          floorForm.resetFields();
        }}
        okText="Add Floor"
      >
        <Form form={floorForm} onFinish={addFloor} layout="vertical">
          <Form.Item
            name="name"
            label="Floor Name"
            rules={[{ required: true, message: "Please enter floor name" }]}
          >
            <Input placeholder="e.g. First Floor, Terrace Level" />
          </Form.Item>
        </Form>
      </Modal>

      {/* ── Add Room Modal ───────────────────────────────────────────── */}
      <Modal
        title="Add Room"
        open={roomModal.visible}
        onOk={() => roomForm.submit()}
        onCancel={() => {
          setRoomModal({ visible: false, floorNumber: null });
          roomForm.resetFields();
        }}
        okText="Add Room"
      >
        <Form form={roomForm} onFinish={addRoom} layout="vertical">
          <Form.Item
            name="name"
            label="Room Name"
            rules={[{ required: true, message: "Room name is required" }]}
          >
            <Input placeholder="e.g. Master Bedroom, Living Room, Kitchen" />
          </Form.Item>
          <Form.Item name="type" label="Room Type (optional)">
            <Select placeholder="Select type">
              <Option value="Bedroom">Bedroom</Option>
              <Option value="Living">Living / Drawing Room</Option>
              <Option value="Kitchen">Kitchen</Option>
              <Option value="Bathroom">Bathroom</Option>
              <Option value="Balcony">Balcony / Terrace</Option>
              <Option value="Puja Room">Puja Room</Option>
              <Option value="Other">Other</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      {/* ── New: Assign Item Modal (local state) ───────────────────── */}
      <Modal
        title="Assign Item to Location"
        open={assignModal.visible}
        onOk={assignItem}
        onCancel={() => {
          setAssignModal({ visible: false, itemId: null });
          setSelectedFloor(null);
          setSelectedRoom(null);
        }}
        okText="Assign"
        width={480}
      >
        <Space direction="vertical" style={{ width: "100%" }} size="middle">
          <div>
            <Text strong>Product:</Text>{" "}
            <Text>
              {cartItems.find((i) => i.id === assignModal.itemId)?.name || "—"}
            </Text>
          </div>

          <div>
            <Text strong>
              Floor <span style={{ color: "red" }}>*</span>
            </Text>
            <Select
              placeholder="Select floor"
              style={{ width: "100%", marginTop: 8 }}
              value={selectedFloor}
              onChange={(v) => {
                setSelectedFloor(v);
                setSelectedRoom(null); // reset room when floor changes
              }}
            >
              {(quotationData.floors || []).map((f) => (
                <Option key={f.number} value={f.number}>
                  {f.name}
                </Option>
              ))}
            </Select>
          </div>

          {selectedFloor && (
            <div>
              <Text strong>Room (optional – whole floor if empty)</Text>
              <Select
                placeholder="Whole floor / common area"
                allowClear
                style={{ width: "100%", marginTop: 8 }}
                value={selectedRoom}
                onChange={setSelectedRoom}
              >
                {(quotationData.floors || [])
                  .find((f) => f.number === selectedFloor)
                  ?.rooms?.map((r) => (
                    <Option key={r.id} value={r.id}>
                      {r.name} {r.type && `(${r.type})`}
                    </Option>
                  ))}
              </Select>
            </div>
          )}
        </Space>
      </Modal>
    </Row>
  );
};

export default React.memo(QuotationForm);
