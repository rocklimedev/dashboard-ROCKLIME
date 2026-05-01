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
  message,
  Alert,
  Tag,
  Modal,
  Form,
} from "antd";
import {
  CheckCircleOutlined,
  ArrowLeftOutlined,
  DeleteOutlined,
  PlusOutlined,
  HomeOutlined,
  ApartmentOutlined,
  PushpinOutlined,
  EditOutlined,
} from "@ant-design/icons";
import styled from "styled-components";
import OrderTotal from "../../components/POS-NEW/OrderTotal";
import moment from "moment";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { AREA_OPTIONS } from "../../components/modals/AddAreaModal";
import { v4 as uuidv4 } from "uuid";

// Modals
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
  localCartItems = [],
  calculationCartItems = [],
  subTotal = 0,
  totalDiscount: discount = 0,
  tax = 0,
  shipping = 0,
  gst = 0,

  // Quotation props from NewQuotation
  quotationData = {
    floors: [],
    followupDates: [],
    discountAmount: "",
    dueDate: "",
  },
  // Item-level adjustments (Add these lines)
  itemDiscounts = {},
  itemDiscountTypes = {},
  itemTaxes = {},
  handleClearCart,
  setQuotationData,
  handleQuotationChange,
  selectedCustomer = "",
  setSelectedCustomer,
  customers = [],
  addresses = [],
  useBillingAddress = false,
  setUseBillingAddress,
  billingAddressId = null,
  setBillingAddressId,
  previewVisible = false,
  setPreviewVisible,
  handleAddCustomer,
  handleAddAddress,
  setActiveTab,
  handleCreateDocument,
  handleAssignItem,
}) => {
  // Modal States
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

  // ==================== KEY FIX ====================
  // Use this as the single source of truth for cart items
  const effectiveCartItems = useMemo(() => {
    if (
      Array.isArray(calculationCartItems) &&
      calculationCartItems.length > 0
    ) {
      return calculationCartItems;
    }
    if (Array.isArray(localCartItems) && localCartItems.length > 0) {
      return localCartItems;
    }
    return [];
  }, [calculationCartItems, localCartItems]);

  // Auto-create default floor when items are assigned
  useEffect(() => {
    const currentFloors = quotationData.floors || [];
    const hasAssignments = effectiveCartItems.some((item) =>
      Boolean(item?.floorId),
    );

    if (hasAssignments && currentFloors.length === 0) {
      const defaultFloor = {
        floorId: generateFloorId(),
        floorName: "Ground Floor",
        sortOrder: 0,
        rooms: [],
      };
      handleQuotationChange("floors", [defaultFloor]);
    }
  }, [effectiveCartItems, quotationData.floors?.length, handleQuotationChange]);

  const unassignedCount = useMemo(
    () => effectiveCartItems.filter((i) => !i?.floorId).length,
    [effectiveCartItems],
  );

  const floorSummary = useMemo(() => {
    const summary = {};
    (quotationData.floors || []).forEach((f) => {
      summary[f.floorId] = {
        name: f.floorName,
        itemCount: 0,
        total: 0,
        rooms: (f.rooms || []).map((r) => ({ ...r, itemCount: 0, total: 0 })),
      };
    });

    effectiveCartItems.forEach((item) => {
      if (!item?.floorId || !summary[item.floorId]) return;
      const floor = summary[item.floorId];
      floor.itemCount += item.quantity || 1;
      floor.total += (item.quantity || 1) * (item.price || 0);

      if (item.roomId) {
        const room = floor.rooms.find((r) => r.roomId === item.roomId);
        if (room) {
          room.itemCount += item.quantity || 1;
          room.total += (item.quantity || 1) * (item.price || 0);
        }
      }
    });

    return Object.values(summary);
  }, [effectiveCartItems, quotationData.floors]);

  // Customer & Address Logic
  const customerOptions = useMemo(() => {
    return customers.map((cust) => ({
      value: cust.customerId,
      label: (
        <div style={{ lineHeight: 1.3 }}>
          <strong>{cust.name || "Unnamed Customer"}</strong>
          {cust.mobileNumber && (
            <span style={{ marginLeft: 8, color: "#555" }}>
              {cust.mobileNumber}
            </span>
          )}
          {cust.companyName && (
            <div style={{ fontSize: "0.85em", color: "#777" }}>
              {cust.companyName}
            </div>
          )}
        </div>
      ),
      searchText:
        `${cust.name || ""} ${cust.mobileNumber || ""} ${cust.companyName || ""}`.toLowerCase(),
    }));
  }, [customers]);

  const defaultAddress = useMemo(() => {
    const billing = addresses.find(
      (a) => a.customerId === selectedCustomer && a.status === "BILLING",
    );
    if (billing) return billing;

    const cust = customers.find((c) => c.customerId === selectedCustomer);
    if (!cust?.address) return null;

    try {
      return typeof cust.address === "string"
        ? JSON.parse(cust.address)
        : cust.address;
    } catch {
      return null;
    }
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
    if (useBillingAddress) return billingAddressId || "sameAsBilling";
    return quotationData.shipTo;
  }, [useBillingAddress, billingAddressId, quotationData.shipTo]);

  // Follow-up Handlers
  const handleFollowup = (index, date) => {
    const dates = [...(quotationData.followupDates || [])];
    dates[index] = date ? moment(date).format("YYYY-MM-DD") : "";
    handleQuotationChange("followupDates", dates);
  };

  const addFollowup = () =>
    handleQuotationChange("followupDates", [
      ...(quotationData.followupDates || []),
      "",
    ]);

  const removeFollowup = (index) =>
    handleQuotationChange(
      "followupDates",
      (quotationData.followupDates || []).filter((_, i) => i !== index),
    );

  // Floor, Room, Area Handlers (kept your original logic)
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
    const updatedFloors = (quotationData.floors || []).map((f) =>
      f.floorId === editFloorModal.floorId
        ? { ...f, floorName: values.name.trim() || f.floorName }
        : f,
    );
    handleQuotationChange("floors", updatedFloors);
    message.success("Floor updated");
    setEditFloorModal({ visible: false, floorId: null });
    floorForm.resetFields();
  };

  const showDeleteFloorConfirm = (floorId, floorName) => {
    const itemsInFloor = effectiveCartItems.filter(
      (i) => i.floorId === floorId,
    ).length;
    Modal.confirm({
      title: `Delete floor "${floorName}"?`,
      content: itemsInFloor
        ? `${itemsInFloor} item(s) will be unassigned.`
        : "No items assigned.",
      okText: "Delete",
      okType: "danger",
      onOk() {
        const updatedFloors = (quotationData.floors || [])
          .filter((f) => f.floorId !== floorId)
          .map((f, idx) => ({ ...f, sortOrder: idx }));
        handleQuotationChange("floors", updatedFloors);
        message.success("Floor deleted");
      },
    });
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
                type: values.type,
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
                ? { ...r, roomName: values.name.trim(), type: values.type }
                : r,
            ),
          }
        : floor,
    );
    handleQuotationChange("floors", updatedFloors);
    message.success("Room updated");
    setEditRoomModal({ visible: false, floorId: null, roomId: null });
    roomForm.resetFields();
  };

  const showDeleteRoomConfirm = (floorId, roomId, roomName) => {
    const itemsInRoom = effectiveCartItems.filter(
      (i) => i.roomId === roomId,
    ).length;
    Modal.confirm({
      title: `Delete room "${roomName}"?`,
      content: itemsInRoom
        ? `${itemsInRoom} item(s) will lose room assignment.`
        : "No items assigned.",
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
        handleQuotationChange("floors", updatedFloors);
        message.success("Room deleted");
      },
    });
  };

  const addArea = (values) => {
    const selectedArea = AREA_OPTIONS.find(
      (opt) => opt.value === values.areaType,
    );
    if (!selectedArea) return message.error("Please select a valid area type");

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

  const openAssignModal = (itemId) => setAssignModal({ visible: true, itemId });

  const handleMultiAssign = (itemId, assignments) => {
    if (!assignments?.length)
      return message.error("No assignment data received");

    // Update floors (your existing code - it's fine)

    let updatedFloors = [...(quotationData.floors || [])];

    assignments.forEach((ass) => {
      if (!ass.floorId) return;

      let floorIndex = updatedFloors.findIndex(
        (f) => f.floorId === ass.floorId,
      );

      if (floorIndex === -1) {
        updatedFloors.push({
          floorId: ass.floorId,
          floorName: ass.floorName || `Floor ${updatedFloors.length + 1}`,
          sortOrder: updatedFloors.length,
          rooms: [],
        });
        floorIndex = updatedFloors.length - 1;
      } else if (ass.floorName) {
        updatedFloors[floorIndex].floorName = ass.floorName;
      }
    });

    handleQuotationChange("floors", updatedFloors);

    // Call handleAssignItem with names
    if (typeof handleAssignItem === "function") {
      assignments.forEach((ass) => {
        handleAssignItem(
          itemId,
          ass.floorId,
          ass.roomId || null,
          ass.areaId || null,
          ass.floorName || null,
          ass.roomName || null,
          ass.areaName || null,
          ass.assignedQuantity || 1,
        );
      });
    }

    setAssignModal({ visible: false, itemId: null });
    message.success("Location assigned successfully");
  };
  // ==================== EMPTY CART CHECK ====================
  if (!effectiveCartItems.length) {
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
            {/* Customer & Address Panel */}
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
                      placeholder="Search by name, phone, company..."
                      value={selectedCustomer}
                      onChange={setSelectedCustomer}
                      options={customerOptions}
                      filterOption={(input, option) =>
                        option?.searchText?.includes(input.toLowerCase())
                      }
                      style={{ flex: 1 }}
                      allowClear
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
                          setBillingAddressId(v);
                          handleQuotationChange("shipTo", v);
                        }
                      }}
                      disabled={!selectedCustomer}
                    >
                      {defaultAddress && !hasBillingAddress && (
                        <Option value="sameAsBilling">
                          Same as Billing Address
                        </Option>
                      )}
                      {filteredAddresses.map((a) => (
                        <Option key={a.addressId} value={a.addressId}>
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

            {/* Dates & Follow-ups Panel */}
            {/* Dates & Follow-ups Panel */}
            <Panel header="Dates & Follow-ups" key="2">
              <TightRow gutter={8}>
                <Col span={8}>
                  <Text strong>Due Date</Text> {/* Removed red * */}
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
                    isClearable // Allows user to clear the date
                  />
                </Col>
              </TightRow>

              <TightRow gutter={8}>
                <Col span={8}>
                  <Text strong>Follow-ups</Text>
                </Col>
                <Col span={16}>
                  {(quotationData.followupDates || []).map((d, i) => (
                    <Space key={i} style={{ width: "100%", marginBottom: 8 }}>
                      <MiniDate
                        selected={momentToDate(d ? moment(d) : null)}
                        onChange={(date) => handleFollowup(i, date)}
                        minDate={new Date()}
                        isClearable
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
            {/* Site Layout Panel - keep your existing code */}
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
                            showDeleteFloorConfirm(
                              floor.floorId,
                              floor.floorName,
                            )
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
                        title={room.roomName}
                        style={{ marginBottom: 12 }}
                      >
                        <Space wrap>
                          {room.areas?.map((area) => (
                            <Tag
                              key={area.id}
                              color="cyan"
                              closable
                              onClose={() => {
                                // Area remove logic
                                message.info(
                                  "Area remove logic can be added here",
                                );
                              }}
                            >
                              {area.name}
                            </Tag>
                          ))}
                        </Space>
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
                      </Card>
                    ))}
                  </Panel>
                ))}
              </Collapse>

              {unassignedCount > 0 && (
                <Alert
                  message={`${unassignedCount} item(s) not assigned`}
                  type="warning"
                  showIcon
                  style={{ marginTop: 16 }}
                />
              )}
            </Panel>
          </Collapse>

          {/* Cart Items & Location Assignment */}
          <Divider orientation="left">Cart Items & Location Assignment</Divider>
          <Space direction="vertical" style={{ width: "100%" }} size="middle">
            {effectiveCartItems.map((item) => (
              <Card
                key={item.id}
                size="small"
                title={
                  <Space>
                    <Text strong>{item.name}</Text>
                    <Tag color="blue">×{item.quantity || 1}</Tag>
                  </Space>
                }
                extra={
                  <Button
                    type="link"
                    icon={<PushpinOutlined />}
                    onClick={() => openAssignModal(item.id)}
                  >
                    {item.floorId
                      ? `✓ ${item.floorName || "Assigned"}`
                      : "Assign Location"}
                  </Button>
                }
              >
                <Text>₹{(item.price || 0).toLocaleString()}</Text>
              </Card>
            ))}
          </Space>
        </CompactCard>
      </Col>

      {/* Summary Sidebar */}
      <Col xs={24} md={8}>
        <CompactCard
          title="Order Summary"
          style={{ position: "sticky", top: 16 }}
        >
          <OrderTotal
            subTotal={subTotal}
            discount={discount}
            tax={tax}
            shipping={shipping}
          />
          <Divider />
          <Button block size="large" onClick={() => setPreviewVisible(true)}>
            Preview Quotation
          </Button>

          <CheckoutBtn
            block
            size="large"
            icon={<CheckCircleOutlined />}
            onClick={() => {
              if (!selectedCustomer) {
                return message.error("Please select a customer");
              }

              // Pass the correct key: payloadCartItems
              handleCreateDocument({
                payloadCartItems: localCartItems, // ← Changed from calculationCartItems
                calculationCartItems: calculationCartItems, // for totals
                shipping,
                gst,
                itemDiscounts,
                itemDiscountTypes,
                itemTaxes,
                handleClearCart,
              });
            }}
          >
            Create Quotation
          </CheckoutBtn>
        </CompactCard>
      </Col>

      {/* Modals */}
      <AddFloorModal
        visible={floorModalVisible}
        onCancel={() => setFloorModalVisible(false)}
        onFinish={addFloor}
        form={floorForm}
      />
      <EditFloorModal
        visible={editFloorModal.visible}
        onCancel={() => setEditFloorModal({ visible: false, floorId: null })}
        onFinish={editFloor}
        form={floorForm}
        floorName={
          quotationData.floors?.find(
            (f) => f.floorId === editFloorModal.floorId,
          )?.floorName
        }
      />
      <AddEditRoomModal
        visible={roomModal.visible || editRoomModal.visible}
        isEdit={editRoomModal.visible}
        onCancel={() => {
          setRoomModal({ visible: false, floorId: null });
          setEditRoomModal({ visible: false, floorId: null, roomId: null });
        }}
        onFinish={editRoomModal.visible ? editRoom : addRoom}
        form={roomForm}
      />
      <AddAreaModal
        visible={areaModal.visible}
        onCancel={() =>
          setAreaModal({ visible: false, floorId: null, roomId: null })
        }
        onFinish={addArea}
        form={areaForm}
      />
      <AssignItemModal
        visible={assignModal.visible}
        onCancel={() => setAssignModal({ visible: false, itemId: null })}
        onAssign={handleMultiAssign} // ← Must be onAssign
        item={effectiveCartItems.find((i) => i.id === assignModal.itemId)}
        floors={quotationData.floors || []}
      />
    </Row>
  );
};

export default React.memo(QuotationForm);
