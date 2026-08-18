// src/components/POS-NEW/Cart.jsx
import React, { useMemo, useState, useEffect, useCallback } from "react";
import {
  DndContext,
  closestCenter,
  pointerWithin,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  useDroppable,
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
  Alert,
  Tag,
  Modal,
  Form,
  Tabs,
} from "antd";
import {
  ArrowLeftOutlined,
  ShoppingCartOutlined,
  CheckCircleOutlined,
  PlusOutlined,
  EditOutlined,
  HomeOutlined,
} from "@ant-design/icons";
import styled from "styled-components";
import { v4 as uuidv4 } from "uuid";
import "./cartitem.css";
import OrderTotal from "../../components/POS-NEW/OrderTotal";
import CartItemRow from "../../components/POS-NEW/CartItemRow";

import AddFloorModal from "../../components/modals/AddFloorModal";
import EditFloorModal from "../../components/modals/EditFloorModal";
import AddEditRoomModal from "../../components/modals/AddEditRoomModal";
import AssignItemModal from "../../components/modals/AssignItemLocation";

const { Title, Text } = Typography;

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

const LayoutTabs = styled(Tabs)`
  margin-bottom: 12px;

  .ant-tabs-nav {
    margin-bottom: 8px;
  }
`;

/* ────────────────────── Helpers (Site Layout) ────────────────────── */

const generateFloorId = () => `fl_${uuidv4().slice(0, 8)}`;
const generateRoomId = (floorId = "") =>
  `${floorId ? floorId + "_" : "rm_"}${uuidv4().slice(0, 8)}`;

const getItemLocations = (item) => {
  if (Array.isArray(item?.locations) && item.locations.length > 0) {
    return item.locations;
  }
  if (item?.floorId) {
    return [
      {
        floorId: item.floorId,
        roomId: item.roomId || null,
        assignedQuantity: item.quantity || 1,
        floorName: item.floorName,
        roomName: item.roomName,
      },
    ];
  }
  return [];
};

const getItemKey = (item) => item?.productId || item?.id;

/* ── Droppable tab label (assign location by dropping items) ── */
const DroppableTabLabel = ({ id, children }) => {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div
      ref={setNodeRef}
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "2px 6px",
        borderRadius: 6,
        transition: "background 0.15s, outline 0.15s",
        background: isOver ? "rgba(22, 119, 255, 0.12)" : undefined,
        outline: isOver ? "2px dashed #1677ff" : "2px solid transparent",
      }}
    >
      {children}
    </div>
  );
};

/** Prefer location droppables under pointer; otherwise sort list */
const locationAwareCollision = (args) => {
  const pointerHits = pointerWithin(args);
  const locationHit = pointerHits.find((c) => String(c.id).startsWith("drop-"));
  if (locationHit) return [locationHit];
  return closestCenter(args);
};

/* ────────────────────── Component ────────────────────── */

const CartTab = ({
  localCartItems = [],
  cartItems,
  mainCartItems = [],
  optionalCartItems = [],
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
  handleAssignOptionToParent,
  handleSetItemLocations,

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

  const isQuotationMode = documentType?.toLowerCase() === "quotation";

  const lineTotal = (item) => {
    if (!item) return "0.00";
    const price = Number(item.price) || 0;
    const qty = Number(item.quantity) || 1;
    const subtotal = price * qty;

    const key = getItemKey(item);
    const discVal = Number(itemDiscounts[key]) || 0;
    const discType = itemDiscountTypes[key] || "percent";

    const discountAmount =
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

  /* ────────────────────── Grouping (main + options) ────────────────────── */

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

  /* ────────────────────── Site Layout state ────────────────────── */

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

  const [activeFloorId, setActiveFloorId] = useState(null);
  const [activeRoomId, setActiveRoomId] = useState("__global__");

  // Auto-create default floor when items are assigned
  useEffect(() => {
    if (!isQuotationMode) return;
    const currentFloors = quotationData.floors || [];
    const hasAssignments = mainCartItems.some(
      (item) => Boolean(item?.floorId) || item?.locations?.length > 0,
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
  }, [
    isQuotationMode,
    mainCartItems,
    quotationData.floors?.length,
    handleQuotationChange,
  ]);

  /* ── layoutTree: item can appear under multiple locations (split) ── */
  const layoutTree = useMemo(() => {
    const floors = quotationData.floors || [];
    const tree = floors.map((floor) => ({
      ...floor,
      rooms: (floor.rooms || []).map((room) => ({
        ...room,
        items: [],
      })),
      unassignedItems: [],
    }));

    const globalUnassigned = [];
    const pushedToGlobal = new Set();

    const sourceItems =
      mainCartItems.length > 0
        ? mainCartItems
        : safeCartItems.filter((i) => !i?.isOption && !i?.isOptionFor);

    sourceItems.forEach((item) => {
      const locs = getItemLocations(item);
      const totalQty = Number(item.quantity) || 0;
      const assignedSum = locs.reduce(
        (s, l) => s + (Number(l.assignedQuantity) || 0),
        0,
      );

      // Fully unassigned
      if (!locs.length) {
        globalUnassigned.push(item);
        return;
      }

      // Partial split → remaining qty also counts as unassigned
      if (assignedSum < totalQty) {
        const key = getItemKey(item);
        if (!pushedToGlobal.has(key)) {
          globalUnassigned.push({
            ...item,
            _viewAssignedQty: totalQty - assignedSum,
            _partialUnassigned: true,
          });
          pushedToGlobal.add(key);
        }
      }

      locs.forEach((loc) => {
        if (!loc?.floorId) return;

        const floorNode = tree.find((f) => f.floorId === loc.floorId);
        if (!floorNode) {
          const key = getItemKey(item);
          if (!pushedToGlobal.has(key)) {
            globalUnassigned.push(item);
            pushedToGlobal.add(key);
          }
          return;
        }

        const viewItem = {
          ...item,
          _viewFloorId: loc.floorId,
          _viewRoomId: loc.roomId || null,
          _viewAssignedQty: Number(loc.assignedQuantity) || 0,
        };

        if (loc.roomId) {
          const roomNode = floorNode.rooms.find((r) => r.roomId === loc.roomId);
          if (roomNode) roomNode.items.push(viewItem);
          else floorNode.unassignedItems.push(viewItem);
        } else {
          floorNode.unassignedItems.push(viewItem);
        }
      });
    });

    return { floors: tree, globalUnassigned };
  }, [mainCartItems, safeCartItems, quotationData.floors]);

  // Keep selection valid when floors/rooms change
  useEffect(() => {
    if (!isQuotationMode) return;
    const floors = layoutTree.floors;

    if (!floors.length) {
      setActiveFloorId(null);
      setActiveRoomId("__global__");
      return;
    }

    const floorExists = floors.some((f) => f.floorId === activeFloorId);
    if (activeFloorId && !floorExists) {
      setActiveFloorId(floors[0].floorId);
      setActiveRoomId(null);
      return;
    }

    if (activeFloorId) {
      const floor = floors.find((f) => f.floorId === activeFloorId);
      if (
        activeRoomId &&
        activeRoomId !== null &&
        activeRoomId !== "__global__" &&
        !floor?.rooms?.some((r) => r.roomId === activeRoomId)
      ) {
        setActiveRoomId(null);
      }
    }
  }, [layoutTree.floors, activeFloorId, activeRoomId, isQuotationMode]);

  /* ── Items visible under current floor / room ── */
  const visibleMainItems = useMemo(() => {
    if (!isQuotationMode) return [];

    if (activeRoomId === "__global__" || !activeFloorId) {
      return layoutTree.globalUnassigned;
    }

    const floor = layoutTree.floors.find((f) => f.floorId === activeFloorId);
    if (!floor) return [];

    if (activeRoomId === null) return floor.unassignedItems;

    const room = floor.rooms.find((r) => r.roomId === activeRoomId);
    return room ? room.items : [];
  }, [layoutTree, activeFloorId, activeRoomId, isQuotationMode]);

  /**
   * Build grouped rows for the current tab.
   * Prefer the viewItem from visibleMainItems (has _viewAssignedQty)
   * so Split portions show the correct "Here ×N" qty.
   */
  const visibleGrouped = useMemo(() => {
    if (!isQuotationMode) return groupedItems;

    const viewById = new Map();
    visibleMainItems.forEach((i) => {
      const key = getItemKey(i);
      if (!viewById.has(key)) viewById.set(key, i);
    });

    const grouped = groupedItems.grouped
      .filter(({ main }) => viewById.has(getItemKey(main)))
      .map(({ main, options }) => ({
        main: viewById.get(getItemKey(main)) || main,
        options,
      }));

    const ungroupedOptions =
      activeRoomId === "__global__" || !activeFloorId
        ? groupedItems.ungroupedOptions
        : [];

    return { grouped, ungroupedOptions };
  }, [
    isQuotationMode,
    groupedItems,
    visibleMainItems,
    activeFloorId,
    activeRoomId,
  ]);

  // DnD ordered ids — use product id only (one row per product in a given tab)
  useEffect(() => {
    if (isQuotationMode) {
      const ids = [];
      visibleGrouped.grouped.forEach(({ main, options }) => {
        ids.push(getItemKey(main));
        options.forEach((opt) => ids.push(getItemKey(opt)));
      });
      visibleGrouped.ungroupedOptions.forEach((opt) =>
        ids.push(getItemKey(opt)),
      );
      setOrderedIds(ids.filter(Boolean));
    } else {
      setOrderedIds(safeCartItems.map((item) => getItemKey(item)));
    }
  }, [isQuotationMode, visibleGrouped, safeCartItems]);

  /** Single location assign → replace primary (clears split) */
  const handleLocationChange = (itemId, floorId, roomId) => {
    const item =
      mainCartItems.find((i) => getItemKey(i) === itemId) ||
      safeCartItems.find((i) => getItemKey(i) === itemId);

    const floor = (quotationData.floors || []).find(
      (f) => f.floorId === floorId,
    );
    const room = floor?.rooms?.find((r) => r.roomId === roomId);

    if (!floorId) {
      if (typeof handleSetItemLocations === "function") {
        handleSetItemLocations(itemId, []);
      } else {
        handleAssignItemToLocation?.(
          itemId,
          null,
          null,
          null,
          null,
          null,
          null,
          item?.quantity || 1,
        );
      }
      return;
    }

    const assignment = [
      {
        floorId,
        roomId: roomId || null,
        floorName: floor?.floorName || null,
        roomName: room?.roomName || null,
        assignedQuantity: item?.quantity || 1,
      },
    ];

    if (typeof handleSetItemLocations === "function") {
      handleSetItemLocations(itemId, assignment);
    } else {
      handleAssignItemToLocation?.(
        itemId,
        floorId,
        roomId || null,
        null,
        floor?.floorName || null,
        room?.roomName || null,
        null,
        item?.quantity || 1,
      );
    }
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const overId = String(over.id);
    const activeId = String(active.id);

    // ── Location assignment (corner handle → drop-*) ──
    // active.id will be "loc-{productId}" when dragged from the corner handle
    const isLocationDrag = activeId.startsWith("loc-");
    const itemId = isLocationDrag ? activeId.slice(4) : activeId;

    if (overId.startsWith("drop-")) {
      if (overId === "drop-unassigned") {
        handleLocationChange(itemId, null, null);
        return;
      }
      if (overId.startsWith("drop-floor-")) {
        const floorId = overId.slice("drop-floor-".length);
        handleLocationChange(itemId, floorId, null);
        return;
      }
      if (overId.startsWith("drop-room-")) {
        const rest = overId.slice("drop-room-".length);
        const [floorId, roomId] = rest.split("__");
        if (floorId) {
          handleLocationChange(itemId, floorId, roomId || null);
        }
        return;
      }
      return;
    }

    // ── Reorder (only when dragged from S.No.) ──
    // Ignore location-drags that somehow land on another item
    if (isLocationDrag) return;

    const oldIndex = orderedIds.indexOf(active.id);
    const newIndex = orderedIds.indexOf(over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const newOrderedIds = arrayMove(orderedIds, oldIndex, newIndex);
    setOrderedIds(newOrderedIds);

    const idToItem = new Map(
      safeCartItems.map((item) => [getItemKey(item), item]),
    );

    if (isQuotationMode) {
      const visibleIdSet = new Set(newOrderedIds);
      const nonVisible = safeCartItems.filter(
        (item) => !visibleIdSet.has(getItemKey(item)),
      );
      const reorderedVisible = newOrderedIds
        .map((id) => idToItem.get(id))
        .filter(Boolean);

      const newCartItems = [...reorderedVisible, ...nonVisible];
      const itemsWithPriority = newCartItems.map((item, index) => ({
        ...item,
        priority: index,
      }));
      onCartOrderChange?.(itemsWithPriority);
    } else {
      const newCartItems = arrayMove(safeCartItems, oldIndex, newIndex);
      const itemsWithPriority = newCartItems.map((item, index) => ({
        ...item,
        priority: index,
      }));
      onCartOrderChange?.(itemsWithPriority);
    }
  };

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

  /* ────────────────────── Floor / Room CRUD ────────────────────── */

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
    setActiveFloorId(newFloor.floorId);
    setActiveRoomId(null);
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
    const itemsInFloor = mainCartItems.filter((i) => {
      const locs = getItemLocations(i);
      return locs.some((l) => l.floorId === floorId);
    }).length;

    Modal.confirm({
      title: `Delete floor "${floorName}"?`,
      content: itemsInFloor
        ? `${itemsInFloor} item(s) will lose this floor assignment.`
        : "No items assigned.",
      okText: "Delete",
      okType: "danger",
      onOk() {
        const updatedFloors = (quotationData.floors || [])
          .filter((f) => f.floorId !== floorId)
          .map((f, idx) => ({ ...f, sortOrder: idx }));
        handleQuotationChange("floors", updatedFloors);

        if (typeof handleSetItemLocations === "function") {
          mainCartItems.forEach((item) => {
            const locs = getItemLocations(item).filter(
              (l) => l.floorId !== floorId,
            );
            if (locs.length !== getItemLocations(item).length) {
              handleSetItemLocations(getItemKey(item), locs);
            }
          });
        }

        if (activeFloorId === floorId) {
          setActiveFloorId(null);
          setActiveRoomId("__global__");
        }
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
    const itemsInRoom = mainCartItems.filter((i) => {
      const locs = getItemLocations(i);
      return locs.some((l) => l.roomId === roomId);
    }).length;

    Modal.confirm({
      title: `Delete room "${roomName}"?`,
      content: itemsInRoom
        ? `${itemsInRoom} item(s) will lose this room assignment.`
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

        if (typeof handleSetItemLocations === "function") {
          mainCartItems.forEach((item) => {
            const locs = getItemLocations(item).map((l) =>
              l.roomId === roomId ? { ...l, roomId: null, roomName: null } : l,
            );
            const changed = getItemLocations(item).some(
              (l) => l.roomId === roomId,
            );
            if (changed) {
              handleSetItemLocations(getItemKey(item), locs);
            }
          });
        }

        if (activeRoomId === roomId) setActiveRoomId(null);
        message.success("Room deleted");
      },
    });
  };

  const openAssignModal = (itemId) => setAssignModal({ visible: true, itemId });

  /**
   * Split / multi-location assign from AssignItemModal.
   * assignments: [{ floorId, roomId, floorName, roomName, assignedQuantity }, ...]
   */
  const handleMultiAssign = (itemId, assignments) => {
    if (!assignments?.length) {
      return message.error("No assignment data received");
    }

    const item =
      mainCartItems.find((i) => getItemKey(i) === itemId) ||
      safeCartItems.find((i) => getItemKey(i) === itemId);

    const totalQty = Number(item?.quantity) || 1;
    const assignedSum = assignments.reduce(
      (s, a) => s + (Number(a.assignedQuantity) || 0),
      0,
    );

    if (assignedSum > totalQty) {
      return message.error(
        `Assigned qty (${assignedSum}) exceeds item quantity (${totalQty})`,
      );
    }

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
          rooms: ass.roomId
            ? [
                {
                  roomId: ass.roomId,
                  roomName: ass.roomName || "Room",
                  sortOrder: 0,
                },
              ]
            : [],
        });
      } else {
        if (ass.floorName) {
          updatedFloors[floorIndex] = {
            ...updatedFloors[floorIndex],
            floorName: ass.floorName,
          };
        }
        if (ass.roomId) {
          const rooms = updatedFloors[floorIndex].rooms || [];
          if (!rooms.some((r) => r.roomId === ass.roomId)) {
            updatedFloors[floorIndex] = {
              ...updatedFloors[floorIndex],
              rooms: [
                ...rooms,
                {
                  roomId: ass.roomId,
                  roomName: ass.roomName || "Room",
                  sortOrder: rooms.length,
                },
              ],
            };
          }
        }
      }
    });

    handleQuotationChange("floors", updatedFloors);

    if (typeof handleSetItemLocations === "function") {
      handleSetItemLocations(itemId, assignments);
    } else if (typeof handleAssignItemToLocation === "function") {
      assignments.forEach((ass, index) => {
        handleAssignItemToLocation(
          itemId,
          ass.floorId,
          ass.roomId || null,
          null,
          ass.floorName || null,
          ass.roomName || null,
          null,
          ass.assignedQuantity || 1,
          { replacePrimary: index === 0, append: index > 0 },
        );
      });
    }

    setAssignModal({ visible: false, itemId: null });
  };
  const handleUpdateAssignedQuantity = useCallback(
    (itemId, newAssignedQty, viewFloorId, viewRoomId, isPartialUnassigned) => {
      if (!itemId || newAssignedQty < 1) return;

      const item =
        mainCartItems.find((i) => getItemKey(i) === itemId) ||
        safeCartItems.find((i) => getItemKey(i) === itemId);
      if (!item) return;

      const totalQty = Number(item.quantity) || 1;
      let locs = getItemLocations(item);

      // ── Partial-unassigned view (global “Unassigned” tab) ──
      if (isPartialUnassigned) {
        const assignedSum = locs.reduce(
          (s, l) => s + (Number(l.assignedQuantity) || 0),
          0,
        );
        const newTotal = assignedSum + newAssignedQty;
        if (newTotal !== totalQty) {
          handleUpdateQuantity?.(itemId, newTotal);
        }
        return;
      }

      // ── Concrete floor/room view ──
      if (!viewFloorId) return;

      const match = (l) =>
        l.floorId === viewFloorId &&
        (l.roomId || null) === (viewRoomId || null);

      let found = false;
      const updatedLocs = locs.map((l) => {
        if (match(l)) {
          found = true;
          return { ...l, assignedQuantity: newAssignedQty };
        }
        return l;
      });

      if (!found && newAssignedQty > 0) {
        // safety – should not normally happen
        const floor = (quotationData.floors || []).find(
          (f) => f.floorId === viewFloorId,
        );
        const room = floor?.rooms?.find((r) => r.roomId === viewRoomId);
        updatedLocs.push({
          floorId: viewFloorId,
          roomId: viewRoomId || null,
          floorName: floor?.floorName || null,
          roomName: room?.roomName || null,
          assignedQuantity: newAssignedQty,
        });
      }

      const newSum = updatedLocs.reduce(
        (s, l) => s + (Number(l.assignedQuantity) || 0),
        0,
      );

      // Raise total if the new allocation exceeds it
      if (newSum > totalQty) {
        handleUpdateQuantity?.(itemId, newSum);
      }

      // Persist the new location split (filters out zero-qty entries)
      if (typeof handleSetItemLocations === "function") {
        handleSetItemLocations(
          itemId,
          updatedLocs.filter((l) => (Number(l.assignedQuantity) || 0) > 0),
        );
      }
    },
    [
      mainCartItems,
      safeCartItems,
      quotationData.floors,
      handleUpdateQuantity,
      handleSetItemLocations,
    ],
  );
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

  const renderCartItemRows = (grouped, ungroupedOptions) => {
    let sno = 0;

    return (
      <>
        {grouped.map(({ main, options }) => {
          sno += 1;
          const mainSno = sno;
          return (
            <React.Fragment key={getItemKey(main)}>
              <CartItemRow
                item={main}
                serialNumber={mainSno}
                onUpdateAssignedQuantity={handleUpdateAssignedQuantity}
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
                handleAssignOptionToParent={handleAssignOptionToParent}
                floors={quotationData.floors || []}
                onLocationChange={handleLocationChange}
                onSplit={(id) => openAssignModal(id)}
              />

              {options.map((opt) => {
                sno += 1;
                return (
                  <OptionGroupWrapper key={getItemKey(opt)}>
                    <CartItemRow
                      item={opt}
                      serialNumber={sno}
                      // ... same props
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
                      handleAssignOptionToParent={handleAssignOptionToParent}
                      floors={quotationData.floors || []}
                      onLocationChange={handleLocationChange}
                      onSplit={(id) => openAssignModal(id)}
                    />
                  </OptionGroupWrapper>
                );
              })}
            </React.Fragment>
          );
        })}

        {ungroupedOptions.length > 0 && isQuotationMode && (
          <>
            <Divider orientation="left">Optional Items (Ungrouped)</Divider>
            {ungroupedOptions.map((opt) => {
              sno += 1;
              return (
                <CartItemRow
                  key={getItemKey(opt)}
                  item={opt}
                  serialNumber={sno}
                  // ... same props
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
                  handleAssignOptionToParent={handleAssignOptionToParent}
                  floors={quotationData.floors || []}
                  onLocationChange={handleLocationChange}
                  onSplit={(id) => openAssignModal(id)}
                />
              );
            })}
          </>
        )}
      </>
    );
  };

  /* ── Floor tabs (droppable) ── */
  const floorTabItems = useMemo(() => {
    const items = layoutTree.floors.map((f) => {
      const count =
        f.rooms.reduce((s, r) => s + r.items.length, 0) +
        f.unassignedItems.length;
      return {
        key: f.floorId,
        label: (
          <DroppableTabLabel id={`drop-floor-${f.floorId}`}>
            <Space size={4}>
              <HomeOutlined />
              <span>{f.floorName}</span>
              <Tag style={{ marginRight: 0 }}>{count}</Tag>
            </Space>
          </DroppableTabLabel>
        ),
        closable: true,
      };
    });

    items.push({
      key: "__global__",
      label: (
        <DroppableTabLabel id="drop-unassigned">
          <Space size={4}>
            <span>Unassigned</span>
            <Tag color="orange" style={{ marginRight: 0 }}>
              {layoutTree.globalUnassigned.length}
            </Tag>
          </Space>
        </DroppableTabLabel>
      ),
      closable: false,
    });

    return items;
  }, [layoutTree]);

  /* ── Room tabs (droppable) ── */
  const roomTabItems = useMemo(() => {
    if (!activeFloorId) return [];

    const floor = layoutTree.floors.find((f) => f.floorId === activeFloorId);
    if (!floor) return [];

    const items = floor.rooms.map((r) => ({
      key: r.roomId,
      label: (
        <DroppableTabLabel id={`drop-room-${activeFloorId}__${r.roomId}`}>
          <Space size={4}>
            <span>{r.roomName}</span>
            <Tag style={{ marginRight: 0 }}>{r.items.length}</Tag>
          </Space>
        </DroppableTabLabel>
      ),
      closable: true,
    }));

    items.push({
      key: "__floor_unassigned__",
      label: (
        <DroppableTabLabel id={`drop-floor-${activeFloorId}`}>
          <Space size={4}>
            <span>Unassigned</span>
            <Tag color="orange" style={{ marginRight: 0 }}>
              {floor.unassignedItems.length}
            </Tag>
          </Space>
        </DroppableTabLabel>
      ),
      closable: false,
    });

    return items;
  }, [layoutTree, activeFloorId]);

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={locationAwareCollision}
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
                      {isQuotationMode && (
                        <Button
                          icon={<PlusOutlined />}
                          onClick={() => setFloorModalVisible(true)}
                        >
                          Add Floor
                        </Button>
                      )}
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
                ) : isQuotationMode ? (
                  <>
                    <LayoutTabs
                      type="editable-card"
                      hideAdd
                      activeKey={activeFloorId || "__global__"}
                      onChange={(key) => {
                        if (key === "__global__") {
                          setActiveFloorId(null);
                          setActiveRoomId("__global__");
                        } else {
                          setActiveFloorId(key);
                          setActiveRoomId(null);
                        }
                      }}
                      onEdit={(targetKey, action) => {
                        if (action === "remove" && targetKey !== "__global__") {
                          const floor = (quotationData.floors || []).find(
                            (f) => f.floorId === targetKey,
                          );
                          if (floor) {
                            showDeleteFloorConfirm(
                              floor.floorId,
                              floor.floorName,
                            );
                          }
                        }
                      }}
                      items={floorTabItems}
                      tabBarExtraContent={
                        activeFloorId ? (
                          <Space size="small">
                            <Button
                              size="small"
                              icon={<EditOutlined />}
                              onClick={() => {
                                const floor = (quotationData.floors || []).find(
                                  (f) => f.floorId === activeFloorId,
                                );
                                if (floor) {
                                  floorForm.setFieldsValue({
                                    name: floor.floorName,
                                  });
                                  setEditFloorModal({
                                    visible: true,
                                    floorId: floor.floorId,
                                  });
                                }
                              }}
                            />
                            <Button
                              size="small"
                              icon={<PlusOutlined />}
                              onClick={() =>
                                setRoomModal({
                                  visible: true,
                                  floorId: activeFloorId,
                                })
                              }
                            >
                              Room
                            </Button>
                          </Space>
                        ) : null
                      }
                    />

                    {activeFloorId && (
                      <LayoutTabs
                        size="small"
                        type="editable-card"
                        hideAdd
                        activeKey={
                          activeRoomId === null
                            ? "__floor_unassigned__"
                            : activeRoomId
                        }
                        onChange={(key) => {
                          setActiveRoomId(
                            key === "__floor_unassigned__" ? null : key,
                          );
                        }}
                        onEdit={(targetKey, action) => {
                          if (
                            action === "remove" &&
                            targetKey !== "__floor_unassigned__"
                          ) {
                            const floor = (quotationData.floors || []).find(
                              (f) => f.floorId === activeFloorId,
                            );
                            const room = floor?.rooms?.find(
                              (r) => r.roomId === targetKey,
                            );
                            if (room) {
                              showDeleteRoomConfirm(
                                activeFloorId,
                                room.roomId,
                                room.roomName,
                              );
                            }
                          }
                        }}
                        items={roomTabItems}
                      />
                    )}

                    {isQuotationMode && safeCartItems.length > 0 && (
                      <Text
                        type="secondary"
                        style={{
                          display: "block",
                          marginBottom: 8,
                          fontSize: 12,
                        }}
                      >
                        Drag items onto a floor or room tab to assign location
                      </Text>
                    )}

                    {unassignedCount > 0 &&
                      (activeRoomId === "__global__" || !activeFloorId) && (
                        <Alert
                          message={`${unassignedCount} item(s) not fully assigned to a location`}
                          type="warning"
                          showIcon
                          style={{ marginBottom: 12 }}
                        />
                      )}

                    {visibleGrouped.grouped.length === 0 &&
                    visibleGrouped.ungroupedOptions.length === 0 ? (
                      <Empty
                        description={
                          activeRoomId === "__global__" || !activeFloorId
                            ? "No unassigned items"
                            : "No items in this location"
                        }
                        style={{ padding: "24px 0" }}
                      />
                    ) : (
                      renderCartItemRows(
                        visibleGrouped.grouped,
                        visibleGrouped.ungroupedOptions,
                      )
                    )}
                  </>
                ) : (
                  renderCartItemRows(
                    groupedItems.grouped,
                    groupedItems.ungroupedOptions,
                  )
                )}
              </CartItemsCard>
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
              setEditRoomModal({
                visible: false,
                floorId: null,
                roomId: null,
              });
            }}
            onFinish={editRoomModal.visible ? editRoom : addRoom}
            form={roomForm}
          />
          <AssignItemModal
            visible={assignModal.visible}
            onCancel={() => setAssignModal({ visible: false, itemId: null })}
            onAssign={handleMultiAssign}
            item={
              mainCartItems.find((i) => getItemKey(i) === assignModal.itemId) ||
              safeCartItems.find((i) => getItemKey(i) === assignModal.itemId)
            }
            floors={quotationData.floors || []}
          />
        </>
      )}
    </>
  );
};

export default CartTab;
