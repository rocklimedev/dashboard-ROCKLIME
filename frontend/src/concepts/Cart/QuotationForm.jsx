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
  EditOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import styled from "styled-components";
import OrderTotal from "../../components/POS-NEW/OrderTotal";
import { useGetCustomersQuery } from "../../api/customerApi";
import moment from "moment";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { v4 as uuidv4 } from "uuid";
import { debounce } from "lodash";
import { AREA_OPTIONS } from "../../components/modals/AddAreaModal";
import AddFloorModal from "../../components/modals/AddFloorModal";
import EditFloorModal from "../../components/modals/EditFloorModal";
import AddEditRoomModal from "../../components/modals/AddEditRoomModal";
import AddAreaModal from "../../components/modals/AddAreaModal";
import AssignItemModal from "../../components/modals/AssignItemLocation";

const { Text, Title } = Typography;
const { Panel } = Collapse;
const { Option } = Select;

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

// Helpers
const momentToDate = (m) => (m ? m.toDate() : null);
const generateFloorId = () => `fl_${uuidv4().slice(0, 8)}`;
const generateRoomId = (floorId = "") =>
  `${floorId ? floorId + "_" : "rm_"}${uuidv4().slice(0, 8)}`;
const generateAreaId = (roomId) => `${roomId}_ar_${uuidv4().slice(0, 6)}`;

const QuotationForm = ({
  // From CartLayout
  cartItems,
  setCartItems,
  calculationCartItems, // ← Use this instead of cartItems for calculations
  cartProductsData,
  subTotal,
  tax,
  shipping,
  gst,
  totalAmount,
  roundOff,
  itemDiscounts,
  itemDiscountTypes,
  itemTaxes,
  handleDiscountChange,
  handleDiscountTypeChange,
  handleTaxChange,
  handleShippingChange,
  handleGstChange,
  handleAssignItemToLocation,
  setActiveTab,
  handleCreateDocument,

  // Quotation specific
  quotationData,
  setQuotationData,
  handleQuotationChange,
  selectedCustomer,
  setSelectedCustomer,
  addressesLoading,
  addresses,
  useBillingAddress,
  setUseBillingAddress,
  billingAddressId,
  setBillingAddressId,
  previewVisible,
  setPreviewVisible,
  handleAddCustomer,
  handleAddAddress,
}) => {
  const [floorModalVisible, setFloorModalVisible] = useState(false);
  const [editFloorModal, setEditFloorModal] = useState({
    visible: false,
    floorId: null,
  });
  const [roomModal, setRoomModal] = useState({ visible: false, floorId: null });
  const [editRoomModal, setEditRoomModal] = useState({
    visible: false,
    floorId: null,
    roomId: null,
  });
  const [areaModal, setAreaModal] = useState({
    visible: false,
    floorId: null,
    roomId: null,
  });
  const [assignModal, setAssignModal] = useState({
    visible: false,
    itemId: null,
  });

  const [floorForm] = Form.useForm();
  const [roomForm] = Form.useForm();
  const [areaForm] = Form.useForm();

  const [isCreatingAddress, setIsCreatingAddress] = useState(false);

  // Ensure default floor exists
  useEffect(() => {
    if (!quotationData?.floors?.length) {
      const defaultFloor = {
        floorId: generateFloorId(),
        floorName: "Ground Floor",
        sortOrder: 0,
        rooms: [],
      };
      handleQuotationChange("floors", [defaultFloor]);
    }
  }, [quotationData?.floors, handleQuotationChange]);

  // ── Floor Handlers ────────────────────────────────────────────────
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

  const editFloor = (values) => {
    const updated = (quotationData.floors || []).map((f) =>
      f.floorId === editFloorModal.floorId
        ? { ...f, floorName: values.name.trim() || f.floorName }
        : f,
    );
    handleQuotationChange("floors", updated);

    const updatedItems = cartItems.map((item) =>
      item.floorId === editFloorModal.floorId
        ? { ...item, floorName: values.name.trim() || item.floorName }
        : item,
    );
    setCartItems(updatedItems);

    message.success("Floor name updated");
    setEditFloorModal({ visible: false, floorId: null });
    floorForm.resetFields();
  };

  const showDeleteFloorConfirm = (floorId, floorName) => {
    const itemsInFloor = cartItems.filter((i) => i.floorId === floorId).length;

    Modal.confirm({
      title: `Delete floor "${floorName}"?`,
      icon: <ExclamationCircleOutlined />,
      content: itemsInFloor
        ? `${itemsInFloor} item${itemsInFloor > 1 ? "s" : ""} will be unassigned.`
        : "This floor has no assigned items.",
      okText: "Delete",
      okType: "danger",
      onOk() {
        const updatedFloors = (quotationData.floors || [])
          .filter((f) => f.floorId !== floorId)
          .map((f, idx) => ({ ...f, sortOrder: idx }));

        const updatedItems = cartItems.map((item) =>
          item.floorId === floorId
            ? {
                ...item,
                floorId: null,
                floorName: null,
                roomId: null,
                roomName: null,
                areaId: null,
                areaName: null,
                areaValue: null,
              }
            : item,
        );

        setCartItems(updatedItems);
        handleQuotationChange("floors", updatedFloors);
        message.success("Floor deleted");
      },
    });
  };

  // ── Room Handlers ─────────────────────────────────────────────────
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
                areas: [],
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

  const editRoom = (values) => {
    const updatedFloors = (quotationData.floors || []).map((floor) =>
      floor.floorId === editRoomModal.floorId
        ? {
            ...floor,
            rooms: floor.rooms.map((r) =>
              r.roomId === editRoomModal.roomId
                ? {
                    ...r,
                    roomName: values.name.trim(),
                    type: values.type || undefined,
                  }
                : r,
            ),
          }
        : floor,
    );
    handleQuotationChange("floors", updatedFloors);

    const updatedItems = cartItems.map((item) =>
      item.roomId === editRoomModal.roomId
        ? { ...item, roomName: values.name.trim() }
        : item,
    );
    setCartItems(updatedItems);

    message.success("Room updated");
    setEditRoomModal({ visible: false, floorId: null, roomId: null });
    roomForm.resetFields();
  };

  const showDeleteRoomConfirm = (floorId, roomId, roomName) => {
    const itemsInRoom = cartItems.filter((i) => i.roomId === roomId).length;

    Modal.confirm({
      title: `Delete room "${roomName}"?`,
      icon: <ExclamationCircleOutlined />,
      content: itemsInRoom
        ? `${itemsInRoom} item${itemsInRoom > 1 ? "s" : ""} will lose room assignment.`
        : "No items assigned to this room.",
      okText: "Delete",
      okType: "danger",
      onOk() {
        const updatedFloors = (quotationData.floors || []).map((floor) =>
          floor.floorId === floorId
            ? {
                ...floor,
                rooms: floor.rooms
                  .filter((r) => r.roomId !== roomId)
                  .map((r, idx) => ({ ...r, sortOrder: idx })),
              }
            : floor,
        );

        const updatedItems = cartItems.map((item) =>
          item.roomId === roomId
            ? {
                ...item,
                roomId: null,
                roomName: null,
                areaId: null,
                areaName: null,
                areaValue: null,
              }
            : item,
        );

        setCartItems(updatedItems);
        handleQuotationChange("floors", updatedFloors);
        message.success("Room deleted");
      },
    });
  };

  // ── Area Handlers ─────────────────────────────────────────────────
  const addArea = (values) => {
    const selectedArea = AREA_OPTIONS.find(
      (opt) => opt.value === values.areaType,
    );

    if (!selectedArea) {
      return message.error("Please select a valid area type");
    }

    const updatedFloors = (quotationData.floors || []).map((floor) =>
      floor.floorId === areaModal.floorId
        ? {
            ...floor,
            rooms: (floor.rooms || []).map((room) =>
              room.roomId === areaModal.roomId
                ? {
                    ...room,
                    areas: [
                      ...(room.areas || []),
                      {
                        id: generateAreaId(room.roomId),
                        name: selectedArea.label,
                        value: selectedArea.value,
                      },
                    ],
                  }
                : room,
            ),
          }
        : floor,
    );

    handleQuotationChange("floors", updatedFloors);
    setAreaModal({ visible: false, floorId: null, roomId: null });
    areaForm.resetFields();
    message.success(`${selectedArea.label} added`);
  };

  // Safe floorSummary (this was causing the crash)
  const floorSummary = useMemo(() => {
    const floors = quotationData?.floors || [];
    const summary = {};

    // Safe initialization
    floors.forEach((f) => {
      summary[f.floorId] = {
        name: f.floorName,
        itemCount: 0,
        total: 0,
        rooms: (f.rooms || []).map((r) => ({
          ...r,
          itemCount: 0,
          total: 0,
        })),
      };
    });

    // Safe iteration over cart items
    (calculationCartItems || []).forEach((item) => {
      if (!item.floorId || !summary[item.floorId]) return;

      const floor = summary[item.floorId];
      floor.itemCount += item.quantity || 1;

      const lineTotal = (item.quantity || 1) * (item.price || 0);
      floor.total += lineTotal;

      if (item.roomId) {
        const room = floor.rooms.find((r) => r.roomId === item.roomId);
        if (room) {
          room.itemCount += item.quantity || 1;
          room.total += lineTotal;
        }
      }
    });

    return Object.values(summary);
  }, [quotationData?.floors, calculationCartItems]);

  const unassignedCount = (calculationCartItems || []).filter(
    (i) => !i.floorId,
  ).length;

  // ── Customer Search Logic ─────────────────────────────────────────
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
    { skip: !debouncedTerm },
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

  // ── Address logic ─────────────────────────────────────────────────
  const defaultAddress = useMemo(() => {
    const billing = addresses.find(
      (a) => a.customerId === selectedCustomer && a.status === "BILLING",
    );
    if (billing) return billing;

    const cust = customers.find((c) => c.customerId === selectedCustomer);
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
  }, [addresses, selectedCustomer, customers]);

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

  // ── Follow-up dates ───────────────────────────────────────────────
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
  if (!calculationCartItems?.length) {
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

            {/* Replace the entire Shipping Address TightRow */}
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
                        handleQuotationChange("shipTo", null); // Important: clear shipTo
                      } else {
                        setUseBillingAddress(false);
                        setBillingAddressId(v); // If real address selected
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
                        title="Use customer's default billing address as shipping"
                      >
                        Same as Billing Address
                      </Option>
                    )}

                    {filteredAddresses.map((a) => (
                      <Option
                        key={a.addressId}
                        value={a.addressId}
                        title={`${a.street}, ${a.city}, ${a.state || ""} ${a.postalCode || ""} (${a.status})`}
                      >
                        {a.street?.slice(0, 40)}
                        {a.street?.length > 40 ? "..." : ""}, {a.city} (
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
          {/* Discount & Notes */}
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
          {/* Site Layout */}
          <Panel
            header={
              <Space>
                <ApartmentOutlined /> Site Layout & Areas
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
                          ?.itemCount || 0}{" "}
                        items
                      </Tag>
                    </Space>
                  }
                  extra={
                    <Space size="small">
                      <Button
                        size="small"
                        icon={<EditOutlined />}
                        onClick={() => {
                          floorForm.setFieldsValue({ name: floor.floorName });
                          setEditFloorModal({
                            visible: true,
                            floorId: floor.floorId,
                          });
                        }}
                      >
                        Edit
                      </Button>
                      <Button
                        size="small"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() =>
                          showDeleteFloorConfirm(floor.floorId, floor.floorName)
                        }
                      />
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
                    </Space>
                  }
                >
                  {floor.rooms?.map((room) => (
                    <Card
                      key={room.roomId}
                      size="small"
                      title={
                        <Space>
                          <ApartmentOutlined />
                          {room.roomName} {room.type && `(${room.type})`}
                          <Tag color="geekblue">
                            {room.areas?.length || 0} areas
                          </Tag>
                          <Tag color="default">
                            {
                              floorSummary
                                .find((f) => f.name === floor.floorName)
                                ?.rooms?.find((r) => r.roomId === room.roomId)
                                ?.itemCount
                            }{" "}
                            items
                          </Tag>
                        </Space>
                      }
                      extra={
                        <Space size="small">
                          <Button
                            size="small"
                            icon={<EditOutlined />}
                            onClick={() => {
                              roomForm.setFieldsValue({
                                name: room.roomName,
                                type: room.type,
                              });
                              setEditRoomModal({
                                visible: true,
                                floorId: floor.floorId,
                                roomId: room.roomId,
                              });
                            }}
                          >
                            Edit
                          </Button>
                          <Button
                            size="small"
                            danger
                            icon={<DeleteOutlined />}
                            onClick={() =>
                              showDeleteRoomConfirm(
                                floor.floorId,
                                room.roomId,
                                room.roomName,
                              )
                            }
                          />
                          <Button
                            size="small"
                            type="dashed"
                            icon={<PlusOutlined />}
                            onClick={() =>
                              setAreaModal({
                                visible: true,
                                floorId: floor.floorId,
                                roomId: room.roomId,
                              })
                            }
                          >
                            Add Area
                          </Button>
                        </Space>
                      }
                      style={{ marginBottom: 12 }}
                    >
                      <Space wrap size={[0, 8]}>
                        {room.areas?.map((area) => (
                          <Tag
                            key={area.id}
                            color="cyan"
                            closable
                            onClose={(e) => {
                              e.preventDefault();
                              Modal.confirm({
                                title: `Remove "${area.name}"?`,
                                content:
                                  "Items assigned here will remain assigned to the room (area info removed).",
                                okText: "Remove",
                                okType: "danger",
                                onOk() {
                                  const updatedFloors = (
                                    quotationData.floors || []
                                  ).map((f) =>
                                    f.floorId === floor.floorId
                                      ? {
                                          ...f,
                                          rooms: f.rooms.map((r) =>
                                            r.roomId === room.roomId
                                              ? {
                                                  ...r,
                                                  areas: r.areas.filter(
                                                    (a) => a.id !== area.id,
                                                  ),
                                                }
                                              : r,
                                          ),
                                        }
                                      : f,
                                  );
                                  handleQuotationChange(
                                    "floors",
                                    updatedFloors,
                                  );

                                  const updatedItems = cartItems.map((item) =>
                                    item.areaId === area.id
                                      ? {
                                          ...item,
                                          areaId: null,
                                          areaName: null,
                                          areaValue: null,
                                        }
                                      : item,
                                  );
                                  setCartItems(updatedItems);
                                  message.success("Area removed");
                                },
                              });
                            }}
                          >
                            {area.name}
                          </Tag>
                        ))}
                        {!room.areas?.length && (
                          <Text type="secondary">No areas yet</Text>
                        )}
                      </Space>
                    </Card>
                  ))}
                  {!floor.rooms?.length && (
                    <Text type="secondary">No rooms added yet</Text>
                  )}
                </Panel>
              ))}
            </Collapse>

            {unassignedCount > 0 && (
              <Alert
                style={{ marginTop: 16 }}
                message={`${unassignedCount} item${
                  unassignedCount > 1 ? "s" : ""
                } not assigned to any floor`}
                type="warning"
                showIcon
              />
            )}
          </Panel>
          <Divider orientation="left" style={{ margin: "24px 0 16px" }}>
            Cart Items & Location Assignment
          </Divider>
          {/* In the Cart Items section, use calculationCartItems */}
          <Space direction="vertical" style={{ width: "100%" }} size="middle">
            {calculationCartItems.map((item) => (
              <Card
                key={item.id}
                size="small"
                title={
                  <Space>
                    <Text strong>{item.name}</Text>
                    <Tag color="blue">×{item.quantity || 1}</Tag>
                    {item.floorId && (
                      <Tag color="geekblue">
                        {quotationData.floors?.find(
                          (f) => f.floorId === item.floorId,
                        )?.floorName || "—"}
                        {item.roomId && (
                          <>
                            {" → "}
                            {
                              quotationData.floors
                                ?.find((f) => f.floorId === item.floorId)
                                ?.rooms?.find((r) => r.roomId === item.roomId)
                                ?.roomName
                            }
                            {item.areaId && (
                              <>
                                {" → "}
                                {quotationData.floors
                                  ?.find((f) => f.floorId === item.floorId)
                                  ?.rooms?.find((r) => r.roomId === item.roomId)
                                  ?.areas?.find((a) => a.id === item.areaId)
                                  ?.name || "—"}
                              </>
                            )}
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
                    onClick={() =>
                      setAssignModal({ visible: true, itemId: item.id })
                    }
                  >
                    {item.floorId ? "Change" : "Assign"}
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
              message={`${unassignedCount} item${
                unassignedCount > 1 ? "s" : ""
              } still unassigned`}
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
            discount={0} // You can pass totalDiscount if needed
            extraDiscount={0}
            tax={tax}
            shipping={shipping}
            roundOff={roundOff}
            autoRound={true}
          />

          <Divider />

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
                  {f.itemCount} item{f.itemCount !== 1 ? "s" : ""}
                </div>
              </div>
            ))
          ) : (
            <Text type="secondary">No items assigned yet</Text>
          )}

          <Divider />

          <Button
            type="default"
            size="large"
            block
            onClick={() => setPreviewVisible(true)}
            style={{ marginBottom: 12 }}
          >
            Preview Quotation
          </Button>

          <CheckoutBtn
            block
            size="large"
            icon={<CheckCircleOutlined />}
            onClick={handleCreateDocument}
          >
            Create Quotation
          </CheckoutBtn>
        </CompactCard>
      </Col>

      {/* All Modals */}
      {/* ── All Modals ──────────────────────────────────────────────────── */}
      <AddFloorModal
        visible={floorModalVisible}
        onCancel={() => {
          setFloorModalVisible(false);
          floorForm.resetFields();
        }}
        onFinish={addFloor}
        form={floorForm}
      />

      <EditFloorModal
        visible={editFloorModal.visible}
        floorName={
          quotationData.floors?.find(
            (f) => f.floorId === editFloorModal.floorId,
          )?.floorName
        }
        onCancel={() => {
          setEditFloorModal({ visible: false, floorId: null });
          floorForm.resetFields();
        }}
        onFinish={editFloor}
        form={floorForm}
      />

      <AddEditRoomModal
        visible={roomModal.visible || editRoomModal.visible}
        isEdit={editRoomModal.visible}
        initialValues={
          editRoomModal.visible
            ? {
                name:
                  quotationData.floors
                    ?.find((f) => f.floorId === editRoomModal.floorId)
                    ?.rooms?.find((r) => r.roomId === editRoomModal.roomId)
                    ?.roomName || "",
                type: quotationData.floors
                  ?.find((f) => f.floorId === editRoomModal.floorId)
                  ?.rooms?.find((r) => r.roomId === editRoomModal.roomId)?.type,
              }
            : {}
        }
        onCancel={() => {
          setRoomModal({ visible: false, floorId: null });
          setEditRoomModal({ visible: false, floorId: null, roomId: null });
          roomForm.resetFields();
        }}
        onFinish={editRoomModal.visible ? editRoom : addRoom}
        form={roomForm}
      />

      <AddAreaModal
        visible={areaModal.visible}
        onCancel={() => {
          setAreaModal({ visible: false, floorId: null, roomId: null });
          areaForm.resetFields();
        }}
        onFinish={addArea}
        form={areaForm}
      />

      {/* ... your modals (AddFloorModal, AssignItemModal, etc.) ... */}
      <AssignItemModal
        visible={assignModal.visible}
        onCancel={() => setAssignModal({ visible: false, itemId: null })}
        item={calculationCartItems.find((i) => i.id === assignModal.itemId)}
        floors={quotationData.floors || []}
        onAssign={(itemId, assignments) => {
          // Your handleMultiAssign logic here
        }}
      />
    </Row>
  );
};

export default React.memo(QuotationForm);
