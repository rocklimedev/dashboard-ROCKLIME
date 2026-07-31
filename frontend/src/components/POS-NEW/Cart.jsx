// src/components/POS-NEW/Cart.jsx
import React, { useMemo, useState, useEffect } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";

import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";

import {
  Card,
  Button,
  Space,
  Typography,
  Divider,
  Row,
  Col,
  Empty,
  message,
  Collapse,
  Alert,
  Tag,
  Modal,
  Form,
} from "antd";
import {
  ArrowLeftOutlined,
  ShoppingCartOutlined,
  CheckCircleOutlined,
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
  HomeOutlined,
  ApartmentOutlined,
  PushpinOutlined,
} from "@ant-design/icons";
import styled from "styled-components";
import { v4 as uuidv4 } from "uuid";

import OrderTotal from "../../components/POS-NEW/OrderTotal";
import CartItemRow from "../../components/POS-NEW/CartItemRow";

// Site Layout modals (quotation-only feature)
import AddFloorModal from "../../components/modals/AddFloorModal";
import EditFloorModal from "../../components/modals/EditFloorModal";
import AddEditRoomModal from "../../components/modals/AddEditRoomModal";
import AssignItemModal from "../../components/modals/AssignItemLocation";

const { Title, Text } = Typography;
const { Panel } = Collapse;

/* ────────────────────── Styled Components ────────────────────── */

const CartItemsCard = styled(Card)`
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 16px;
`;

const CartHeader = styled.div`
  width: 100%;
`;

const CartSummaryCard = styled(Card)`
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 16px;
`;

const CheckoutButton = styled(Button)`
  background: #e31e24;
  border-color: #e31e24;
  color: white;

  &:hover,
  &:focus {
    background: #c41e1e;
    border-color: #c41e1e;
    color: white;
  }
`;

const EmptyCartWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px 0;
`;

const OptionGroupWrapper = styled.div`
  margin-left: 40px;
  opacity: 0.92;
  border-left: 2px solid #ff4d4f;
  padding-left: 12px;
`;

/* ────────────────────── Helpers (Site Layout) ────────────────────── */

const generateFloorId = () => `fl_${uuidv4().slice(0, 8)}`;
const generateRoomId = (floorId = "") =>
  `${floorId ? floorId + "_" : "rm_"}${uuidv4().slice(0, 8)}`;

/* ────────────────────── Component ────────────────────── */

const CartTab = ({
  localCartItems = [],
  cartItems, // fallback
  mainCartItems = [], // ← New
  optionalCartItems = [], // ← New (optional)
  subTotal = 0,
  discount = 0,
  roundOff = 0,
  shipping = 0,
  itemDiscounts = {},
  itemDiscountTypes = {},
  itemTaxes = {},
  updatingItems = {},
  handleUpdateQuantity,
  handleRemoveItem,
  handleDiscountChange,
  handleDiscountTypeChange,
  handleTaxChange,
  setShowClearCartModal,
  setActiveTab,
  onShippingChange,
  handleMakeOption,
  documentType = "quotation",
  onCartOrderChange,
  handleAssignOptionToParent, // ← New

  // Site Layout (quotation only)
  quotationData = { floors: [] },
  handleQuotationChange = () => {},
  handleAssignItemToLocation,
}) => {
  const [orderedIds, setOrderedIds] = useState([]);

  const safeCartItems = useMemo(() => {
    return Array.isArray(localCartItems) && localCartItems.length > 0
      ? localCartItems
      : Array.isArray(cartItems)
        ? cartItems
        : [];
  }, [localCartItems, cartItems]);

  // Sync orderedIds for drag & drop
  useEffect(() => {
    const ids = safeCartItems.map((item) => item.productId || item.id);
    setOrderedIds(ids);
  }, [safeCartItems]);

  const isQuotationMode = documentType?.toLowerCase() === "quotation";

  const lineTotal = (item) => {
    if (!item) return "0.00";
    const price = Number(item.price) || 0;
    const qty = Number(item.quantity) || 1;
    const subtotal = price * qty;

    const key = item.productId || item.id;
    const discVal = Number(itemDiscounts[key]) || 0;
    const discType = itemDiscountTypes[key] || "percent";

    let discountAmount =
      discType === "percent" ? (subtotal * discVal) / 100 : discVal * qty;

    const taxPct = Number(itemTaxes[key]) || 0;
    const taxAmount = (subtotal * taxPct) / 100;

    return (subtotal - discountAmount + taxAmount).toFixed(2);
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = orderedIds.indexOf(active.id);
    const newIndex = orderedIds.indexOf(over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    const newOrderedIds = arrayMove(orderedIds, oldIndex, newIndex);
    setOrderedIds(newOrderedIds);

    const newCartItems = arrayMove(safeCartItems, oldIndex, newIndex);

    const itemsWithPriority = newCartItems.map((item, index) => ({
      ...item,
      priority: index,
    }));

    onCartOrderChange?.(itemsWithPriority);
  };

  // Updated Grouping Logic
  const groupedItems = useMemo(() => {
    const mains = safeCartItems.filter((i) => !i?.isOption && !i?.isOptionFor);
    const options = safeCartItems.filter((i) => i?.isOption || i?.isOptionFor);

    const grouped = mains.map((main) => ({
      main,
      options: options.filter(
        (opt) =>
          opt?.parentProductId === main?.productId ||
          opt?.isOptionFor === main?.productId,
      ),
    }));

    const ungroupedOptions = options.filter(
      (o) => !o?.parentProductId && !o?.isOptionFor,
    );

    return { grouped, ungroupedOptions };
  }, [safeCartItems]);

  const renderEmpty = () => (
    <EmptyCartWrapper>
      <Empty description="Your cart is empty" />
      <Button
        type="primary"
        icon={<ArrowLeftOutlined />}
        href="/category-selector"
        style={{ marginTop: 16 }}
      >
        Continue Shopping
      </Button>
    </EmptyCartWrapper>
  );

  // ==================== SITE LAYOUT (Quotation only) ====================
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
  const [assignModal, setAssignModal] = useState({
    visible: false,
    itemId: null,
  });

  const [floorForm] = Form.useForm();
  const [roomForm] = Form.useForm();

  // Auto-create default floor when items are assigned
  useEffect(() => {
    if (!isQuotationMode) return;
    const currentFloors = quotationData.floors || [];
    const hasAssignments = mainCartItems.some((item) => Boolean(item?.floorId));

    if (hasAssignments && currentFloors.length === 0) {
      const defaultFloor = {
        floorId: generateFloorId(),
        floorName: "Ground Floor",
        sortOrder: 0,
        rooms: [],
      };
      handleQuotationChange("floors", [defaultFloor]);
    }
  }, [
    isQuotationMode,
    mainCartItems,
    quotationData.floors?.length,
    handleQuotationChange,
  ]);

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

    mainCartItems.forEach((item) => {
      const price = item.price || 0;
      const locations =
        Array.isArray(item.locations) && item.locations.length > 0
          ? item.locations
          : item.floorId
            ? [
                {
                  floorId: item.floorId,
                  roomId: item.roomId,
                  assignedQuantity: item.quantity || 1,
                },
              ]
            : [];

      locations.forEach((loc) => {
        const floor = summary[loc.floorId];
        if (!floor) return;
        const qty = Number(loc.assignedQuantity) || 0;
        floor.itemCount += qty;
        floor.total += qty * price;

        if (loc.roomId) {
          const room = floor.rooms.find((r) => r.roomId === loc.roomId);
          if (room) {
            room.itemCount += qty;
            room.total += qty * price;
          }
        }
      });
    });

    return Object.values(summary);
  }, [mainCartItems, quotationData.floors]);

  const unassignedCount = useMemo(() => {
    return mainCartItems.filter((item) => {
      const totalQty = Number(item.quantity) || 0;
      const assignedQty =
        Array.isArray(item.locations) && item.locations.length > 0
          ? item.locations.reduce(
              (s, l) => s + (Number(l.assignedQuantity) || 0),
              0,
            )
          : item.floorId
            ? totalQty
            : 0;
      return assignedQty < totalQty;
    }).length;
  }, [mainCartItems]);

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
    const itemsInFloor = mainCartItems.filter(
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
    const itemsInRoom = mainCartItems.filter((i) => i.roomId === roomId).length;
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

  const openAssignModal = (itemId) => setAssignModal({ visible: true, itemId });

  const handleMultiAssign = (itemId, assignments) => {
    if (!assignments?.length)
      return message.error("No assignment data received");

    let updatedFloors = [...(quotationData.floors || [])];

    assignments.forEach((ass) => {
      if (!ass.floorId) return;

      const floorIndex = updatedFloors.findIndex(
        (f) => f.floorId === ass.floorId,
      );

      if (floorIndex === -1) {
        updatedFloors.push({
          floorId: ass.floorId,
          floorName: ass.floorName || `Floor ${updatedFloors.length + 1}`,
          sortOrder: updatedFloors.length,
          rooms: [],
        });
      } else if (ass.floorName) {
        updatedFloors[floorIndex].floorName = ass.floorName;
      }
    });

    handleQuotationChange("floors", updatedFloors);

    if (typeof handleAssignItemToLocation === "function") {
      assignments.forEach((ass) => {
        handleAssignItemToLocation(
          itemId,
          ass.floorId,
          ass.roomId || null,
          null, // areaId removed
          ass.floorName || null,
          ass.roomName || null,
          null, // areaName removed
          ass.assignedQuantity || 1,
        );
      });
    }

    setAssignModal({ visible: false, itemId: null });
    message.success("Location assigned successfully");
  };

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={orderedIds}
          strategy={verticalListSortingStrategy}
        >
          <Row gutter={[16, 16]}>
            <Col xs={24} md={16}>
              <CartItemsCard>
                <CartHeader>
                  <Space
                    style={{ justifyContent: "space-between", width: "100%" }}
                  >
                    <Title level={3} style={{ margin: 0 }}>
                      <ShoppingCartOutlined /> Cart ({safeCartItems.length})
                    </Title>

                    <Space>
                      <Button
                        danger
                        onClick={() => setShowClearCartModal?.(true)}
                      >
                        Clear Cart
                      </Button>
                    </Space>
                  </Space>
                  <Divider />
                </CartHeader>

                {!safeCartItems.length ? (
                  renderEmpty()
                ) : (
                  <>
                    {groupedItems.grouped.map(({ main, options }) => (
                      <React.Fragment key={main?.productId || main?.id}>
                        <CartItemRow
                          item={main}
                          itemDiscounts={itemDiscounts}
                          itemDiscountTypes={itemDiscountTypes}
                          updatingItems={updatingItems}
                          handleUpdateQuantity={handleUpdateQuantity}
                          handleRemoveItem={handleRemoveItem}
                          handleDiscountChange={handleDiscountChange}
                          handleDiscountTypeChange={handleDiscountTypeChange}
                          handleMakeOption={handleMakeOption}
                          lineTotal={lineTotal}
                          documentType={documentType}
                          dragEnabled={true}
                          mainCartItems={mainCartItems}
                          handleAssignOptionToParent={
                            handleAssignOptionToParent
                          }
                        />

                        {options.map((opt) => (
                          <OptionGroupWrapper key={opt?.productId || opt?.id}>
                            <CartItemRow
                              item={opt}
                              itemDiscounts={itemDiscounts}
                              itemDiscountTypes={itemDiscountTypes}
                              updatingItems={updatingItems}
                              handleUpdateQuantity={handleUpdateQuantity}
                              handleRemoveItem={handleRemoveItem}
                              handleDiscountChange={handleDiscountChange}
                              handleDiscountTypeChange={
                                handleDiscountTypeChange
                              }
                              handleMakeOption={handleMakeOption}
                              lineTotal={lineTotal}
                              documentType={documentType}
                              dragEnabled={true}
                              mainCartItems={mainCartItems}
                              handleAssignOptionToParent={
                                handleAssignOptionToParent
                              }
                            />
                          </OptionGroupWrapper>
                        ))}
                      </React.Fragment>
                    ))}

                    {groupedItems.ungroupedOptions.length > 0 &&
                      isQuotationMode && (
                        <>
                          <Divider orientation="left">
                            Optional Items (Ungrouped)
                          </Divider>
                          {groupedItems.ungroupedOptions.map((opt) => (
                            <CartItemRow
                              key={opt?.productId || opt?.id}
                              item={opt}
                              itemDiscounts={itemDiscounts}
                              itemDiscountTypes={itemDiscountTypes}
                              updatingItems={updatingItems}
                              handleUpdateQuantity={handleUpdateQuantity}
                              handleRemoveItem={handleRemoveItem}
                              handleDiscountChange={handleDiscountChange}
                              handleDiscountTypeChange={
                                handleDiscountTypeChange
                              }
                              handleMakeOption={handleMakeOption}
                              lineTotal={lineTotal}
                              documentType={documentType}
                              dragEnabled={true}
                              mainCartItems={mainCartItems}
                              handleAssignOptionToParent={
                                handleAssignOptionToParent
                              }
                            />
                          ))}
                        </>
                      )}
                  </>
                )}
              </CartItemsCard>

              {/* ==================== SITE LAYOUT (Quotation only) ==================== */}
              {isQuotationMode && !!safeCartItems.length && (
                <CartItemsCard
                  title={
                    <Space>
                      <ApartmentOutlined /> Site Layout & Location Assignment
                    </Space>
                  }
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
                            <Tag color="blue">
                              {floor.rooms?.length || 0} rooms
                            </Tag>
                            <Tag color="default">
                              {floorSummary.find(
                                (s) => s.name === floor.floorName,
                              )?.itemCount || 0}{" "}
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
                                floorForm.setFieldsValue({
                                  name: floor.floorName,
                                });
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
                                />
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
                              </Space>
                            }
                          />
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

                  <Divider orientation="left">Assign Items to Location</Divider>
                  <Space
                    direction="vertical"
                    style={{ width: "100%" }}
                    size="middle"
                  >
                    {mainCartItems.map((item) => (
                      <Card
                        key={item.id || item.productId}
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
                            onClick={() =>
                              openAssignModal(item.id || item.productId)
                            }
                          >
                            {item.locations?.length
                              ? item.locations
                                  .map(
                                    (l) =>
                                      `${l.floorName || "Floor"} ×${l.assignedQuantity}`,
                                  )
                                  .join(", ")
                              : "Assign Location"}
                          </Button>
                        }
                      >
                        <Text>₹{(item.price || 0).toLocaleString()}</Text>
                      </Card>
                    ))}
                  </Space>
                </CartItemsCard>
              )}
            </Col>

            <Col xs={24} md={8}>
              <CartSummaryCard>
                <Title level={4}>Order Summary</Title>
                <Divider />

                <OrderTotal
                  shipping={shipping}
                  tax={0}
                  discount={discount}
                  roundOff={roundOff}
                  subTotal={subTotal}
                  onShippingChange={onShippingChange}
                />

                <Divider />

                <CheckoutButton
                  icon={<CheckCircleOutlined />}
                  onClick={() => setActiveTab?.("checkout")}
                  disabled={!safeCartItems.length}
                  block
                >
                  Proceed to Checkout
                </CheckoutButton>

                <Button
                  block
                  href="/category-selector"
                  style={{ marginTop: 8 }}
                >
                  Continue Shopping
                </Button>
              </CartSummaryCard>
            </Col>
          </Row>
        </SortableContext>
      </DndContext>

      {/* Site Layout Modals (Quotation only) */}
      {isQuotationMode && (
        <>
          <AddFloorModal
            visible={floorModalVisible}
            onCancel={() => setFloorModalVisible(false)}
            onFinish={addFloor}
            form={floorForm}
          />
          <EditFloorModal
            visible={editFloorModal.visible}
            onCancel={() =>
              setEditFloorModal({ visible: false, floorId: null })
            }
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
          <AssignItemModal
            visible={assignModal.visible}
            onCancel={() => setAssignModal({ visible: false, itemId: null })}
            onAssign={handleMultiAssign}
            item={mainCartItems.find(
              (i) => (i.id || i.productId) === assignModal.itemId,
            )}
            floors={quotationData.floors || []}
          />
        </>
      )}
    </>
  );
};

export default CartTab;
