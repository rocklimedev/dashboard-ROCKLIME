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
import { debounce } from "lodash";

const { Text, Title } = Typography;
const { Panel } = Collapse;
const { Option } = Select;

const RESTRICTED_ROLES = ["SUPER_ADMIN", "DEVELOPER", "ADMIN"];

// ── Styled Components ────────────────────────────────────────────────
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

// ── Helpers ──────────────────────────────────────────────────────────
const momentToDate = (m) => (m ? m.toDate() : null);

const generateFloorId = () => `fl_${uuidv4().slice(0, 8)}`;
const generateRoomId = (floorId = "") =>
  `${floorId ? floorId + "_" : "rm_"}${uuidv4().slice(0, 8)}`;

// ── Main Component ───────────────────────────────────────────────────
const QuotationForm = ({
  quotationData,
  setQuotationData,
  handleQuotationChange,
  selectedCustomer,
  setSelectedCustomer,
  addresses,
  addressesLoading,
  documentType = "Quotation",
  cartItems, // ← renamed from products → cartItems in many codebases
  setCartItems,
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

  const [isCreatingAddress, setIsCreatingAddress] = useState(false);

  const [floorModalVisible, setFloorModalVisible] = useState(false);
  const [roomModal, setRoomModal] = useState({ visible: false, floorId: null });

  const [assignModal, setAssignModal] = useState({
    visible: false,
    itemId: null,
  });

  const [selectedFloorId, setSelectedFloorId] = useState(null);
  const [selectedRoomId, setSelectedRoomId] = useState(null);

  const [floorForm] = Form.useForm();
  const [roomForm] = Form.useForm();

  // Ensure floors always exist (minimal default)
  useEffect(() => {
    if (!quotationData.floors?.length) {
      const defaultFloor = {
        floorId: generateFloorId(),
        floorName: "Ground Floor",
        sortOrder: 0,
        rooms: [],
      };
      handleQuotationChange("floors", [defaultFloor]);
    }
  }, [quotationData.floors, handleQuotationChange]);

  // ── Floor & Room Handlers ──────────────────────────────────────
  const addFloor = (values) => {
    const current = quotationData.floors || [];
    const newFloor = {
      floorId: generateFloorId(),
      floorName: values.name || `Floor ${current.length + 1}`,
      sortOrder: current.length,
      rooms: [],
    };
    handleQuotationChange("floors", [...current, newFloor]);
    setFloorModalVisible(false);
    floorForm.resetFields();
    message.success("Floor added");
  };

  const addRoom = (values) => {
    const updatedFloors = (quotationData.floors || []).map((floor) =>
      floor.floorId === roomModal.floorId
        ? {
            ...floor,
            rooms: [
              ...(floor.rooms || []),
              {
                roomId: generateRoomId(floor.floorId),
                roomName: values.name,
                sortOrder: floor.rooms?.length || 0,
                type: values.type || undefined,
              },
            ],
          }
        : floor,
    );
    handleQuotationChange("floors", updatedFloors);
    setRoomModal({ visible: false, floorId: null });
    roomForm.resetFields();
    message.success("Room added");
  };

  // ── Item Assignment ─────────────────────────────────────────────
  const openAssignModal = (itemId) => {
    const item = cartItems.find((i) => i.id === itemId);
    if (!item) return;
    setSelectedFloorId(item.floorId || null);
    setSelectedRoomId(item.roomId || null);
    setAssignModal({ visible: true, itemId });
  };

  const assignItem = () => {
    if (!selectedFloorId) {
      return message.error("Please select a floor");
    }
    const updatedItems = cartItems.map((item) =>
      item.id === assignModal.itemId
        ? { ...item, floorId: selectedFloorId, roomId: selectedRoomId || null }
        : item,
    );
    setCartItems(updatedItems);
    message.success("Item assigned");
    setAssignModal({ visible: false, itemId: null });
    setSelectedFloorId(null);
    setSelectedRoomId(null);
  };

  // ── Floor Summary (for display) ─────────────────────────────────
  const floorSummary = useMemo(() => {
    const summary = {};
    (quotationData.floors || []).forEach((f) => {
      summary[f.floorId] = {
        name: f.floorName,
        count: 0,
        total: 0,
      };
    });

    cartItems.forEach((item) => {
      if (item.floorId && summary[item.floorId]) {
        summary[item.floorId].count += item.quantity || 1;
        const line =
          (item.quantity || 1) *
          (item.price || 0) *
          (1 - (item.discount || 0) / 100);
        summary[item.floorId].total += line;
      }
    });

    return Object.values(summary);
  }, [cartItems, quotationData.floors]);

  const unassignedCount = cartItems.filter((i) => !i.floorId).length;

  // ── Customer Search – FIXED MEMORY LEAK ─────────────────────────
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedTerm, setDebouncedTerm] = useState("");
  const [page, setPage] = useState(1);
  const [customers, setCustomers] = useState([]);
  const [hasMore, setHasMore] = useState(true);

  const debouncedSetTerm = useMemo(
    () =>
      debounce((value) => {
        const trimmed = value.trim();
        setDebouncedTerm(trimmed);
        if (trimmed !== debouncedTerm) {
          setCustomers([]);
          setPage(1);
          setHasMore(true);
        }
      }, 450),
    [debouncedTerm],
  );

  useEffect(() => {
    return () => debouncedSetTerm.cancel();
  }, [debouncedSetTerm]);

  const { data, isFetching } = useGetCustomersQuery(
    {
      page,
      limit: 30,
      search: debouncedTerm || undefined,
    },
    {
      skip: !debouncedTerm,
    },
  );

  useEffect(() => {
    if (!data?.data || !debouncedTerm) return;

    setCustomers((prev) => {
      if (data.pagination?.page !== page) return prev;
      const seen = new Set(prev.map((c) => c.customerId));
      const newOnes = data.data.filter((c) => !seen.has(c.customerId));
      return [...prev, ...newOnes];
    });

    const pagination = data.pagination;
    if (pagination) {
      setHasMore(
        pagination.page < pagination.totalPages && data.data.length === 30,
      );
    } else {
      setHasMore(data.data.length === 30);
    }
  }, [data, page, debouncedTerm]);

  useEffect(() => {
    if (!debouncedTerm) {
      setCustomers([]);
      setPage(1);
      setHasMore(true);
    }
  }, [debouncedTerm]);

  const handleSearchChange = (value) => {
    setSearchTerm(value);
    debouncedSetTerm(value);
  };

  const handlePopupScroll = (e) => {
    const target = e.currentTarget;
    if (
      target.scrollTop + target.offsetHeight >= target.scrollHeight - 80 &&
      !isFetching &&
      hasMore
    ) {
      setPage((p) => p + 1);
    }
  };

  const customerOptions = useMemo(() => {
    return customers.map((cust) => ({
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
      title: `${cust.name || "Unnamed"}${
        cust.mobileNumber ? ` • ${cust.mobileNumber}` : ""
      }`,
      searchText: `${cust.name || ""} ${cust.mobileNumber || ""} ${
        cust.email || ""
      } ${cust.companyName || ""}`.toLowerCase(),
    }));
  }, [customers]);

  const selectedCustomerData = useMemo(
    () => customers.find((c) => c.customerId === selectedCustomer),
    [customers, selectedCustomer],
  );

  // ── Address logic ──────────────────────────────────────────────
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
  }, [addresses, selectedCustomer, selectedCustomerData]);

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

  // ── Follow-up dates handlers ────────────────────────────────
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
      <Col xs={24} md={16}>
        <CompactCard title={<Title level={5}>Quotation Details</Title>}>
          <Collapse defaultActiveKey={["1", "2", "4"]} ghost>
            {/* Customer & Address – keep as is or minor tweaks */}
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
                      onSearch={handleSearchChange}
                      filterOption={(input, option) =>
                        option?.searchText?.includes(input.toLowerCase())
                      }
                      onPopupScroll={handlePopupScroll}
                      options={customerOptions}
                      loading={isFetching && page === 1}
                      notFoundContent={
                        isFetching ? (
                          <Spin size="small" tip="Loading customers..." />
                        ) : debouncedTerm ? (
                          "No customers found"
                        ) : (
                          "Start typing to search customers"
                        )
                      }
                      dropdownRender={(menu) => (
                        <>
                          {menu}
                          {hasMore && isFetching && (
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

            {/* Dates */}
            <Panel header="Dates & Follow-ups" key="2">
              <TightRow gutter={8}>
                <Col span={8}>
                  <Text strong>Quotation Date</Text>
                </Col>
                <Col span={16}>
                  <MiniDate
                    selected={momentToDate(
                      moment(quotationData.quotation_date || new Date()),
                    )}
                    onChange={(d) =>
                      handleQuotationChange(
                        "quotation_date",
                        d ? moment(d).format("YYYY-MM-DD") : "",
                      )
                    }
                    dateFormat="dd/MM/yyyy"
                  />
                </Col>
              </TightRow>

              <TightRow gutter={8}>
                <Col span={8}>
                  <Text strong>Due Date *</Text>
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

            {/* Site Layout – updated structure */}
            <Panel
              header={
                <Space>
                  <ApartmentOutlined /> Site Layout
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
                    key={floor.floorId}
                    header={
                      <Space>
                        <HomeOutlined />
                        <Text strong>{floor.floorName}</Text>
                        <Tag color="blue">{floor.rooms?.length || 0} rooms</Tag>
                        <Tag color="default">
                          {floorSummary.find((s) => s.name === floor.floorName)
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
                            floorId: floor.floorId,
                          })
                        }
                      >
                        Add Room
                      </Button>
                    }
                  >
                    <Space wrap size={[0, 8]}>
                      {floor.rooms?.map((room) => (
                        <Tag key={room.roomId} color="geekblue">
                          {room.roomName} {room.type && `(${room.type})`}
                        </Tag>
                      ))}
                      {!floor.rooms?.length && (
                        <Text type="secondary">No rooms yet</Text>
                      )}
                    </Space>
                  </Panel>
                ))}
              </Collapse>

              {unassignedCount > 0 && (
                <Alert
                  style={{ marginTop: 16 }}
                  message={`${unassignedCount} item${unassignedCount > 1 ? "s" : ""} not assigned to any floor`}
                  type="warning"
                  showIcon
                />
              )}
            </Panel>

            {/* Discount – adjust field name if backend uses different one */}
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
          )}{" "}
        </CompactCard>
      </Col>

      {/* Right Column – Summary */}
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

      {/* Modals – updated to use floorId / roomId */}
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
            rules={[{ required: true }]}
          >
            <Input placeholder="e.g. First Floor, Terrace" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Add Room"
        open={roomModal.visible}
        onOk={() => roomForm.submit()}
        onCancel={() => {
          setRoomModal({ visible: false, floorId: null });
          roomForm.resetFields();
        }}
        okText="Add Room"
      >
        <Form form={roomForm} onFinish={addRoom} layout="vertical">
          <Form.Item name="name" label="Room Name" rules={[{ required: true }]}>
            <Input placeholder="e.g. Master Bedroom, Kitchen" />
          </Form.Item>
          <Form.Item name="type" label="Room Type (optional)">
            <Select placeholder="Select type" allowClear>
              <Option value="Bedroom">Bedroom</Option>
              <Option value="Living">Living Room</Option>
              <Option value="Kitchen">Kitchen</Option>
              <Option value="Bathroom">Bathroom</Option>
              {/* ... */}
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Assign Item"
        open={assignModal.visible}
        onOk={assignItem}
        onCancel={() => {
          setAssignModal({ visible: false, itemId: null });
          setSelectedFloorId(null);
          setSelectedRoomId(null);
        }}
        okText="Assign"
        width={480}
      >
        <Space direction="vertical" style={{ width: "100%" }} size="middle">
          <div>
            <Text strong>Product:</Text>{" "}
            <Text>
              {cartItems.find((i) => i.id === assignModal.itemId)?.name}
            </Text>
          </div>

          <div>
            <Text strong>Floor *</Text>
            <Select
              style={{ width: "100%", marginTop: 8 }}
              value={selectedFloorId}
              onChange={(v) => {
                setSelectedFloorId(v);
                setSelectedRoomId(null);
              }}
              placeholder="Select floor"
            >
              {(quotationData.floors || []).map((f) => (
                <Option key={f.floorId} value={f.floorId}>
                  {f.floorName}
                </Option>
              ))}
            </Select>
          </div>

          {selectedFloorId && (
            <div>
              <Text strong>Room (optional)</Text>
              <Select
                style={{ width: "100%", marginTop: 8 }}
                value={selectedRoomId}
                onChange={setSelectedRoomId}
                allowClear
                placeholder="Apply to whole floor"
              >
                {(quotationData.floors || [])
                  .find((f) => f.floorId === selectedFloorId)
                  ?.rooms?.map((r) => (
                    <Option key={r.roomId} value={r.roomId}>
                      {r.roomName} {r.type && `(${r.type})`}
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
