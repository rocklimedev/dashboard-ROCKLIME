// src/components/Quotation/AddQuotation.jsx
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  message,
  Input,
  Select,
  InputNumber,
  Space,
  Button,
  Modal,
  Typography,
  Form,
  Card,
  Row,
  Col,
  Spin,
  Statistic,
} from "antd";
import {
  ArrowLeftOutlined,
  PlusOutlined,
  DeleteOutlined,
  SaveOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { debounce } from "lodash";
import { format } from "date-fns";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { v4 as uuidv4 } from "uuid";
import AddCustomerModal from "../../components/Customers/AddCustomerModal";
import PageHeader from "../../components/Common/PageHeader";
import {
  useCreateQuotationMutation,
  useGetQuotationByIdQuery,
  useUpdateQuotationMutation,
  useGetQuotationVersionsQuery,
} from "../../api/quotationApi";
import { useSearchProductsQuery } from "../../api/productApi";
import { useGetCustomersQuery } from "../../api/customerApi";
import { useGetAllAddressesQuery } from "../../api/addressApi";
import { useGetProfileQuery } from "../../api/userApi";
import QuotationProductSheet from "../../components/Quotation/QuotationProductSheet";
import AddAddress from "../../components/Address/AddAddressModal";

// Import Modals
import AddFloorModal from "../../components/modals/AddFloorModal";
import AddEditRoomModal from "../../components/modals/AddEditRoomModal";
import AssignItemModal from "../../components/modals/AssignItemModal";
import EditFloorModal from "../../components/modals/EditFloorModal";

const { Text } = Typography;
const { Option } = Select;

// Cleared location fields — used when a floor/room is deleted and its
// items fall back to Unassigned.
const CLEARED = {
  floorId: null,
  floorName: null,
  roomId: null,
  roomName: null,
  areaId: null,
  areaName: null,
};

const AddQuotation = () => {
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const navigate = useNavigate();

  const [showCustomerModal, setShowCustomerModal] = useState(false);

  // ── API Hooks ─────────────────────────────────────────────────────
  const { data: existingQuotation, isLoading: loadingQuotation } =
    useGetQuotationByIdQuery(id, { skip: !isEditMode });
  const { data: versionsData = [] } = useGetQuotationVersionsQuery(id, {
    skip: !isEditMode,
  });

  const { data: userData } = useGetProfileQuery();
  const { data: customersData } = useGetCustomersQuery({ limit: 500 });
  const { data: addressesData, refetch: refetchAddresses } =
    useGetAllAddressesQuery();

  const [createQuotation, { isLoading: isCreating }] =
    useCreateQuotationMutation();
  const [updateQuotation, { isLoading: isUpdating }] =
    useUpdateQuotationMutation();

  // ── Product Search ────────────────────────────────────────────────
  const [searchTerm, setSearchTerm] = useState("");
  const { data: searchResult = [], isFetching: isSearching } =
    useSearchProductsQuery(searchTerm.trim(), {
      skip: searchTerm.trim().length < 2,
    });

  const debouncedSearch = useCallback(
    debounce((value) => setSearchTerm(value.trim()), 400),
    [],
  );

  // ── State ─────────────────────────────────────────────────────────
  const userId = userData?.user?.userId || "system";

  const initialFormData = {
    document_title: "",
    quotation_date: null,
    due_date: null,
    gst: 0,
    shippingAmount: 0,
    extraDiscount: 0,
    extraDiscountType: "fixed",
    signature_name: "",
    signature_image: "",
    customerId: "",
    shipTo: "",
    createdBy: userId,
    products: [],
    followupDates: [],
    floors: [],
  };

  const [formData, setFormData] = useState(initialFormData);

  // Modal Forms — each modal gets its own instance so one modal's
  // resetFields() can never wipe another's values.
  const [floorForm] = Form.useForm(); // add floor
  const [floorEditForm] = Form.useForm(); // edit floor
  const [roomForm] = Form.useForm(); // add room
  const [roomEditForm] = Form.useForm(); // edit room

  // Modal Visibility States
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [showAddFloorModal, setShowAddFloorModal] = useState(false);
  const [showAddRoomModal, setShowAddRoomModal] = useState(false);
  const [showEditFloorModal, setShowEditFloorModal] = useState(false);
  const [showEditRoomModal, setShowEditRoomModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showVersionsModal, setShowVersionsModal] = useState(false);

  // Option Modal States
  const [showAddOptionModal, setShowAddOptionModal] = useState(false);
  const [selectedParentId, setSelectedParentId] = useState(null);
  const [optionType, setOptionType] = useState("addon");

  const [selectedFloorId, setSelectedFloorId] = useState(null);
  const [editingFloor, setEditingFloor] = useState(null);
  const [editingRoom, setEditingRoom] = useState(null); // { floorId, roomId, roomName, type }
  const [itemToAssign, setItemToAssign] = useState(null);

  const editRoomInitialValues = useMemo(
    () => ({ name: editingRoom?.roomName, type: editingRoom?.type }),
    [editingRoom],
  );

  // ── Helpers ───────────────────────────────────────────────────────
  const safeNum = (val, fallback = 0) =>
    Number.isFinite(Number(val)) ? Number(val) : fallback;

  const safeJsonParse = (value, fallback = []) => {
    if (Array.isArray(value)) return value;
    if (!value) return fallback;
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : fallback;
    } catch {
      return fallback;
    }
  };

  const generateId = () => `id_${uuidv4().slice(0, 8)}`;

  // ── Load Existing Quotation ───────────────────────────────────────
  useEffect(() => {
    if (!isEditMode || !existingQuotation) return;

    const parsedProducts = safeJsonParse(existingQuotation.products, []);
    const parsedFloors = safeJsonParse(existingQuotation.floors, []);

    const mappedProducts = parsedProducts.map((p) => ({
      ...p,
      qty: safeNum(p.quantity ?? p.qty, 1),
      sellingPrice: safeNum(p.price ?? p.sellingPrice, 0),
      discount: safeNum(p.discount, 0),
      discountType: p.discountType || "fixed",

      // Preserve the multi-location split from the saved payload
      locations: Array.isArray(p.locations) ? p.locations : [],

      floorId: p.floorId || null,
      floorName: p.floorName || null,
      roomId: p.roomId || null,
      roomName: p.roomName || null,
      areaId: p.areaId || null,
      areaName: p.areaName || null,
    }));

    setFormData({
      ...initialFormData,
      quotationId: id,
      document_title: existingQuotation.document_title || "",
      quotation_date: existingQuotation.quotation_date
        ? new Date(existingQuotation.quotation_date)
        : null,
      due_date: existingQuotation.due_date
        ? new Date(existingQuotation.due_date)
        : null,
      shippingAmount: safeNum(existingQuotation.shippingAmount, 0),
      extraDiscount: safeNum(existingQuotation.extraDiscount, 0),
      extraDiscountType: existingQuotation.extraDiscountType || "fixed",
      signature_name: existingQuotation.signature_name || "",
      signature_image: existingQuotation.signature_image || "",
      customerId: existingQuotation.customerId || "",
      shipTo: existingQuotation.shipTo || "",
      createdBy: userId,
      products: mappedProducts,
      floors: parsedFloors,
      followupDates: safeJsonParse(existingQuotation.followupDates, [])
        .map((d) => (d ? new Date(d) : null))
        .filter(Boolean),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditMode, existingQuotation, userId]);

  // ── Location remapping ────────────────────────────────────────────
  // Rewrites a product's locations[] with `mapLoc`, merges shares that end
  // up at the same floor/room, and re-syncs the flat fields the sheet uses.
  const remapProductLocations = (p, mapLoc) => {
    const locs =
      Array.isArray(p.locations) && p.locations.length > 0
        ? p.locations
        : p.floorId || p.roomId
          ? [
              {
                floorId: p.floorId || null,
                floorName: p.floorName || null,
                roomId: p.roomId || null,
                roomName: p.roomName || null,
                areaId: null,
                areaName: null,
                assignedQuantity: safeNum(p.qty, 1),
              },
            ]
          : [];
    if (locs.length === 0) return p;

    const merged = [];
    locs.map(mapLoc).forEach((l) => {
      const k = `${l.floorId || ""}::${l.roomId || ""}`;
      const existing = merged.find(
        (m) => `${m.floorId || ""}::${m.roomId || ""}` === k,
      );
      if (existing) {
        existing.assignedQuantity =
          safeNum(existing.assignedQuantity) + safeNum(l.assignedQuantity);
      } else {
        merged.push({ ...l });
      }
    });

    const single =
      merged.length === 1 && merged[0].floorId && merged[0].roomId
        ? merged[0]
        : null;

    return {
      ...p,
      locations: merged,
      floorId: single?.floorId || null,
      floorName: single?.floorName || null,
      roomId: single?.roomId || null,
      roomName: single?.roomName || null,
      areaId: null,
      areaName: null,
    };
  };

  // How many products have at least one share in this floor (or room).
  const countItemsIn = (floorId, roomId = null) =>
    formData.products.filter((p) => {
      const locs = p.locations?.length
        ? p.locations
        : [{ floorId: p.floorId, roomId: p.roomId }];
      return locs.some(
        (l) => l.floorId === floorId && (!roomId || l.roomId === roomId),
      );
    }).length;

  // ── Floor Handlers ────────────────────────────────────────────────
  const addFloor = (values) => {
    const newFloor = {
      floorId: generateId(),
      floorName: values.name.trim(),
      rooms: [],
    };
    setFormData((prev) => ({ ...prev, floors: [...prev.floors, newFloor] }));
    message.success("Floor added");
    setShowAddFloorModal(false);
    floorForm.resetFields();
  };

  const openEditFloor = (floor) => {
    setEditingFloor(floor);
    setShowEditFloorModal(true);
  };

  // Also renames the denormalized floorName stored on assigned items.
  const editFloor = (values) => {
    if (!editingFloor) return;
    const name = values.name.trim();
    const { floorId } = editingFloor;
    setFormData((prev) => ({
      ...prev,
      floors: prev.floors.map((f) =>
        f.floorId === floorId ? { ...f, floorName: name } : f,
      ),
      products: prev.products.map((p) =>
        remapProductLocations(p, (l) =>
          l.floorId === floorId ? { ...l, floorName: name } : l,
        ),
      ),
    }));
    message.success("Floor updated");
    setShowEditFloorModal(false);
    setEditingFloor(null);
    floorEditForm.resetFields();
  };

  const deleteFloor = (floor) => {
    const affected = countItemsIn(floor.floorId);
    Modal.confirm({
      title: `Delete "${floor.floorName}"?`,
      content:
        affected > 0
          ? `This floor and its rooms will be removed. ${affected} item(s) placed here will move back to Unassigned.`
          : "This floor and its rooms will be removed.",
      okText: "Delete",
      okButtonProps: { danger: true },
      onOk: () => {
        setFormData((prev) => ({
          ...prev,
          floors: prev.floors.filter((f) => f.floorId !== floor.floorId),
          products: prev.products.map((p) =>
            remapProductLocations(p, (l) =>
              l.floorId === floor.floorId ? { ...l, ...CLEARED } : l,
            ),
          ),
        }));
        message.success("Floor deleted");
      },
    });
  };

  // ── Room Handlers ─────────────────────────────────────────────────
  const addRoom = (values) => {
    if (!selectedFloorId) return;
    const newRoom = {
      roomId: generateId(),
      roomName: values.name.trim(),
      type: values.type || null,
      areas: [],
    };

    setFormData((prev) => ({
      ...prev,
      floors: prev.floors.map((f) =>
        f.floorId === selectedFloorId
          ? { ...f, rooms: [...(f.rooms || []), newRoom] }
          : f,
      ),
    }));
    message.success("Room added");
    setShowAddRoomModal(false);
    roomForm.resetFields();
  };

  const openEditRoom = (floorId, room) => {
    setEditingRoom({
      floorId,
      roomId: room.roomId,
      roomName: room.roomName,
      type: room.type || undefined,
    });
    setShowEditRoomModal(true);
  };

  const editRoom = (values) => {
    if (!editingRoom) return;
    const name = values.name.trim();
    const { floorId, roomId } = editingRoom;
    setFormData((prev) => ({
      ...prev,
      floors: prev.floors.map((f) =>
        f.floorId !== floorId
          ? f
          : {
              ...f,
              rooms: (f.rooms || []).map((r) =>
                r.roomId === roomId
                  ? { ...r, roomName: name, type: values.type || null }
                  : r,
              ),
            },
      ),
      products: prev.products.map((p) =>
        remapProductLocations(p, (l) =>
          l.floorId === floorId && l.roomId === roomId
            ? { ...l, roomName: name }
            : l,
        ),
      ),
    }));
    message.success("Room updated");
    setShowEditRoomModal(false);
    setEditingRoom(null);
  };

  const deleteRoom = (floorId, room) => {
    const affected = countItemsIn(floorId, room.roomId);
    Modal.confirm({
      title: `Delete "${room.roomName}"?`,
      content:
        affected > 0
          ? `${affected} item(s) placed in this room will move back to Unassigned.`
          : "This room will be removed.",
      okText: "Delete",
      okButtonProps: { danger: true },
      onOk: () => {
        setFormData((prev) => ({
          ...prev,
          floors: prev.floors.map((f) =>
            f.floorId !== floorId
              ? f
              : {
                  ...f,
                  rooms: (f.rooms || []).filter(
                    (r) => r.roomId !== room.roomId,
                  ),
                },
          ),
          products: prev.products.map((p) =>
            remapProductLocations(p, (l) =>
              l.floorId === floorId && l.roomId === room.roomId
                ? { ...l, ...CLEARED }
                : l,
            ),
          ),
        }));
        message.success("Room deleted");
      },
    });
  };

  // ── Assign Location ───────────────────────────────────────────────
  const handleAssignLocation = (productId, assignments) => {
    if (!productId) {
      message.error("Could not match this item — try again");
      setShowAssignModal(false);
      return;
    }

    const validAssignments = (assignments || []).filter((a) => a.floorId);
    if (validAssignments.length === 0) {
      message.warning("No location selected");
      setShowAssignModal(false);
      return;
    }

    const primary = validAssignments[0];

    setFormData((prev) => ({
      ...prev,
      products: prev.products.map((p) => {
        if (p.productId !== productId) return p;
        return {
          ...p,
          locations: validAssignments,
          floorId: primary.floorId || null,
          floorName: primary.floorName || null,
          roomId: primary.roomId || null,
          roomName: primary.roomName || null,
          areaId: primary.areaId || null,
          areaName: primary.areaName || null,
        };
      }),
    }));

    const label =
      validAssignments.length > 1
        ? `${validAssignments.length} locations`
        : [primary.floorName, primary.roomName, primary.areaName]
            .filter(Boolean)
            .join(" → ");

    message.success(`Assigned to ${label}`);
    setShowAssignModal(false);
    setItemToAssign(null);
  };

  // ── Product Handlers ──────────────────────────────────────────────
  const addOption = (productId) => {
    if (!selectedParentId)
      return message.error("Please select a parent product");

    const prod = searchResult.find((p) => (p.id || p.productId) === productId);
    if (!prod) return message.warning("Product not found");

    const parent = formData.products.find(
      (p) => p.productId === selectedParentId && !p.isOptionFor,
    );
    if (!parent) return message.error("Parent product not found");

    const price = safeNum(
      prod.meta?.["9ba862ef-f993-4873-95ef-1fef10036aa5"],
      0,
    );

    setFormData((prev) => ({
      ...prev,
      products: [
        ...prev.products,
        {
          productId: prod.id || prod.productId,
          name: prod.name || "Unknown",
          qty: 1,
          sellingPrice: price,
          discount: 0,
          discountType: "fixed",
          priority: prev.products.length,
          isOptionFor: selectedParentId,
          optionType,
          groupId: parent.groupId,
        },
      ],
    }));

    setShowAddOptionModal(false);
    setSearchTerm("");
    message.success(`Added ${optionType}`);
  };

  const removeProduct = (productId) => {
    setFormData((prev) => ({
      ...prev,
      products: prev.products.filter((p) => p.productId !== productId),
    }));
  };

  // ── Remove Product (location-aware) ──────────────────────────────
  const removeProductFromLocation = (productId, location) => {
    setFormData((prev) => ({
      ...prev,
      products: prev.products.reduce((acc, p) => {
        if (p.productId !== productId) {
          acc.push(p);
          return acc;
        }

        if (
          !Array.isArray(p.locations) ||
          p.locations.length <= 1 ||
          !location
        ) {
          return acc; // drop it
        }

        const remainingLocations = p.locations.filter(
          (loc) =>
            !(
              loc.floorId === location.floorId &&
              loc.roomId === location.roomId &&
              loc.areaId === location.areaId
            ),
        );

        if (remainingLocations.length === p.locations.length) {
          acc.push(p);
          return acc;
        }

        if (remainingLocations.length === 0) {
          return acc;
        }

        const newQty = remainingLocations.reduce(
          (sum, loc) => sum + safeNum(loc.assignedQuantity, 0),
          0,
        );
        const primary = remainingLocations[0];

        acc.push({
          ...p,
          qty: newQty,
          locations: remainingLocations,
          floorId: primary.floorId || null,
          floorName: primary.floorName || null,
          roomId: primary.roomId || null,
          roomName: primary.roomName || null,
          areaId: primary.areaId || null,
          areaName: primary.areaName || null,
        });
        return acc;
      }, []),
    }));
  };

  // Follow-up handlers
  const addFollowup = () =>
    setFormData((prev) => ({
      ...prev,
      followupDates: [...prev.followupDates, null],
    }));
  const removeFollowup = (index) =>
    setFormData((prev) => ({
      ...prev,
      followupDates: prev.followupDates.filter((_, i) => i !== index),
    }));
  const changeFollowup = (index, date) =>
    setFormData((prev) => {
      const dates = [...prev.followupDates];
      dates[index] = date;
      return { ...prev, followupDates: dates };
    });

  // ── Calculations ──────────────────────────────────────────────────
  const { mainProducts } = useMemo(
    () => ({
      mainProducts: formData.products.filter((p) => !p.isOptionFor),
    }),
    [formData.products],
  );

  const calculations = useMemo(() => {
    let mainSubtotal = 0;
    let mainLineDiscount = 0;

    mainProducts.forEach((p) => {
      const qty = safeNum(p.qty, 1);
      const price = safeNum(p.sellingPrice, 0);
      const disc = safeNum(p.discount, 0);
      const discType = p.discountType || "fixed";

      const lineDisc =
        discType === "percent" ? (price * qty * disc) / 100 : disc * qty;
      mainSubtotal += price * qty - lineDisc;
      mainLineDiscount += lineDisc;
    });

    const extraDiscAmt =
      formData.extraDiscountType === "percent"
        ? (mainSubtotal * safeNum(formData.extraDiscount)) / 100
        : safeNum(formData.extraDiscount);

    const afterExtra = mainSubtotal - extraDiscAmt;
    const shipping = safeNum(formData.shippingAmount);
    const totalBeforeRound = afterExtra + shipping;
    const rounded = Math.round(totalBeforeRound);
    const roundOff = rounded - totalBeforeRound;

    return {
      mainSubtotal: Number(mainSubtotal.toFixed(2)),
      mainLineDiscount: Number(mainLineDiscount.toFixed(2)),
      extraDiscAmt: Number(extraDiscAmt.toFixed(2)),
      shipping,
      roundOff: Number(roundOff.toFixed(2)),
      finalAmount: rounded,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    mainProducts,
    formData.shippingAmount,
    formData.extraDiscount,
    formData.extraDiscountType,
  ]);

  // ── Submit ────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!formData.customerId) return message.error("Please select a customer");
    if (formData.products.length === 0)
      return message.error("Please add at least one product");

    const formatDateSafe = (date) => {
      if (!date || !(date instanceof Date) || isNaN(date.getTime()))
        return null;
      try {
        return format(date, "yyyy-MM-dd");
      } catch {
        return null;
      }
    };

    const finalShipTo =
      formData.shipTo && formData.shipTo.trim() !== "" ? formData.shipTo : null;

    const cleanProducts = formData.products.map((p) => {
      const qty = safeNum(p.qty, 1);
      const sellingPrice = safeNum(p.sellingPrice, 0);
      const discount = safeNum(p.discount, 0);
      const discountType = p.discountType || "fixed";

      const lineDiscount =
        discountType === "percent"
          ? (sellingPrice * qty * discount) / 100
          : discount * qty;

      const lineTotal = sellingPrice * qty - lineDiscount;

      const locations =
        p.locations && p.locations.length > 0
          ? p.locations.map((loc) => ({
              floorId: loc.floorId || null,
              floorName: loc.floorName || null,
              roomId: loc.roomId || null,
              roomName: loc.roomName || null,
              areaId: loc.areaId || null,
              areaName: loc.areaName || null,
              assignedQuantity: safeNum(loc.assignedQuantity, qty),
            }))
          : p.areaId || p.roomId || p.floorId
            ? [
                {
                  floorId: p.floorId || null,
                  floorName: p.floorName || null,
                  roomId: p.roomId || null,
                  roomName: p.roomName || null,
                  areaId: p.areaId || null,
                  areaName: p.areaName || null,
                  assignedQuantity: qty,
                },
              ]
            : [];

      return {
        productId: p.productId,
        name: p.name,
        quantity: qty,
        price: sellingPrice,
        sellingPrice: sellingPrice,
        discount: discount,
        discountType: discountType,
        isOptionFor: p.isOptionFor || null,
        optionType: p.optionType || null,
        groupId: p.groupId,
        priority: safeNum(p.priority, 0),
        locations: locations,

        floorId: p.floorId || null,
        floorName: p.floorName || null,
        roomId: p.roomId || null,
        roomName: p.roomName || null,
        areaId: p.areaId || null,
        areaName: p.areaName || null,

        total: Number(lineTotal.toFixed(2)),
      };
    });

    const payload = {
      document_title: formData.document_title,
      customerId: formData.customerId,
      shipTo: finalShipTo,
      quotation_date: formatDateSafe(formData.quotation_date),
      due_date: formatDateSafe(formData.due_date),
      shippingAmount: safeNum(formData.shippingAmount),
      extraDiscount: safeNum(formData.extraDiscount),
      extraDiscountType: formData.extraDiscountType || "fixed",
      signature_name: formData.signature_name || "",
      signature_image: formData.signature_image || "",
      createdBy: formData.createdBy,

      products: cleanProducts,
      floors: formData.floors || [],
      followupDates: formData.followupDates
        .filter(Boolean)
        .map((d) => formatDateSafe(d))
        .filter(Boolean),
    };

    try {
      if (isEditMode) {
        await updateQuotation({ id, updatedQuotation: payload }).unwrap();
        message.success("Quotation updated successfully");
      } else {
        await createQuotation(payload).unwrap();
        message.success("Quotation created successfully");
      }
      navigate("/quotations/list");
    } catch (err) {
      message.error(err?.data?.message || "Failed to save quotation");
    }
  };

  if (loadingQuotation) {
    return (
      <Spin
        tip="Loading quotation..."
        size="large"
        style={{ margin: "120px auto", display: "block" }}
      />
    );
  }

  return (
    <div className="page-wrapper">
      <div className="content">
        <PageHeader
          title={isEditMode ? "Edit Quotation" : "Create Quotation"}
          subtitle="Fill in all quotation details"
        />

        <Space style={{ marginBottom: 24 }}>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate("/quotations/list")}
          >
            Back
          </Button>
          {isEditMode && versionsData.length > 0 && (
            <Button onClick={() => setShowVersionsModal(true)}>
              Versions ({versionsData.length})
            </Button>
          )}
        </Space>

        <Form layout="vertical">
          {/* Customer & Shipping Card */}
          <Card title="Customer & Shipping" style={{ marginBottom: 24 }}>
            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item label="Customer *" required>
                  <Space.Compact style={{ width: "100%" }}>
                    <Select
                      showSearch
                      value={formData.customerId}
                      onChange={(v) =>
                        setFormData({
                          ...formData,
                          customerId: v,
                          shipTo: null,
                        })
                      }
                      placeholder="Select customer"
                      filterOption={(input, option) =>
                        (option?.label ?? "")
                          .toLowerCase()
                          .includes(input.toLowerCase())
                      }
                      style={{ flex: 1 }}
                    >
                      {(customersData?.data || []).map((c) => {
                        const displayName =
                          `${c.name} ${c.companyName ? `(${c.companyName})` : ""}`.trim();

                        return (
                          <Option
                            key={c.customerId}
                            value={c.customerId}
                            label={displayName}
                          >
                            {displayName}
                          </Option>
                        );
                      })}
                    </Select>
                    <Button
                      type="primary"
                      icon={<PlusOutlined />}
                      onClick={() => setShowCustomerModal(true)}
                    />
                  </Space.Compact>
                </Form.Item>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item label="Shipping Address (Optional)">
                  <Space.Compact style={{ width: "100%" }}>
                    <Select
                      placeholder="Select shipping address (optional)"
                      value={formData.shipTo || undefined}
                      onChange={(v) =>
                        setFormData({
                          ...formData,
                          shipTo: v || null,
                        })
                      }
                      disabled={!formData.customerId}
                      style={{ flex: 1 }}
                      allowClear
                    >
                      {(addressesData || [])
                        .filter((a) => a.customerId === formData.customerId)
                        .map((a) => (
                          <Option key={a.addressId} value={a.addressId}>
                            {a.street}, {a.city}, {a.state}
                          </Option>
                        ))}
                    </Select>
                    <Button
                      type="primary"
                      icon={<PlusOutlined />}
                      onClick={() => setShowAddressModal(true)}
                      disabled={!formData.customerId}
                    />
                  </Space.Compact>
                </Form.Item>
              </Col>
            </Row>
          </Card>

          {/* Quotation Details */}
          <Card
            title="Quotation Details"
            style={{ marginBottom: 24 }}
            styles={{ body: { paddingTop: 16 } }}
          >
            <Row gutter={[24, 16]}>
              <Col xs={24} md={12}>
                <Form.Item
                  label="Quotation Title"
                  required
                  style={{ marginBottom: 8 }}
                >
                  <Input
                    value={formData.document_title}
                    placeholder="e.g. Bathroom Fittings Quotation"
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        document_title: e.target.value,
                      })
                    }
                  />
                </Form.Item>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item label="Quotation Number" style={{ marginBottom: 8 }}>
                  <Input value="Auto-generated" disabled />
                </Form.Item>
              </Col>

              <Col xs={24}>
                <Card
                  size="small"
                  style={{
                    background: "#fafafa",
                    borderRadius: 10,
                  }}
                >
                  <Row gutter={[16, 16]}>
                    <Col xs={24} md={12}>
                      <Form.Item
                        label="Quotation Date"
                        required
                        style={{ marginBottom: 0 }}
                      >
                        <DatePicker
                          selected={formData.quotation_date}
                          onChange={(d) =>
                            setFormData({ ...formData, quotation_date: d })
                          }
                          dateFormat="dd/MM/yyyy"
                          className="ant-input"
                          isClearable
                          placeholderText="Select quotation date"
                          wrapperClassName="w-100"
                        />
                      </Form.Item>
                    </Col>

                    <Col xs={24} md={12}>
                      <Form.Item label="Due Date" style={{ marginBottom: 0 }}>
                        <DatePicker
                          selected={formData.due_date}
                          onChange={(d) =>
                            setFormData({ ...formData, due_date: d })
                          }
                          dateFormat="dd/MM/yyyy"
                          className="ant-input"
                          isClearable
                          placeholderText="Optional due date"
                          minDate={formData.quotation_date}
                          wrapperClassName="w-100"
                        />
                      </Form.Item>
                    </Col>
                  </Row>
                </Card>
              </Col>

              <Col xs={24}>
                <Form.Item
                  label="Follow-up Schedule"
                  style={{ marginBottom: 8 }}
                >
                  <Space wrap>
                    {formData.followupDates.map((date, i) => (
                      <div
                        key={i}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          padding: "4px 8px",
                          border: "1px solid #e5e5e5",
                          borderRadius: 20,
                          background: "#fff",
                        }}
                      >
                        <DatePicker
                          selected={date}
                          onChange={(d) => changeFollowup(i, d)}
                          dateFormat="dd/MM/yyyy"
                          minDate={new Date()}
                          maxDate={formData.due_date}
                          className="ant-input"
                        />

                        <Button
                          type="text"
                          danger
                          size="small"
                          icon={<DeleteOutlined />}
                          onClick={() => removeFollowup(i)}
                        />
                      </div>
                    ))}

                    <Button
                      type="dashed"
                      icon={<PlusOutlined />}
                      onClick={addFollowup}
                    >
                      Add Follow-up
                    </Button>
                  </Space>
                </Form.Item>
              </Col>
            </Row>
          </Card>

          {/*
            Products & Options — floors and rooms are created, renamed and
            deleted directly from the sheet's tabs.
          */}
          <Card
            title="Products & Options"
            style={{ borderRadius: 12 }}
            bodyStyle={{ padding: 12 }}
          >
            <QuotationProductSheet
              formData={formData}
              setFormData={setFormData}
              searchResult={searchResult}
              isSearching={isSearching}
              searchTerm={searchTerm}
              onSearch={debouncedSearch}
              safeNum={safeNum}
              onAddOption={(product) => {
                setSelectedParentId(product.productId);
                setShowAddOptionModal(true);
              }}
              onAddFloor={() => setShowAddFloorModal(true)}
              onEditFloor={openEditFloor}
              onDeleteFloor={deleteFloor}
              onAddRoom={(floorId) => {
                setSelectedFloorId(floorId);
                setShowAddRoomModal(true);
              }}
              onEditRoom={openEditRoom}
              onDeleteRoom={deleteRoom}
              onRemoveFromLocation={removeProductFromLocation}
              onRemoveProduct={removeProduct}
            />
          </Card>

          {/* Financial Summary */}
          <Card
            title="Financial Summary"
            style={{
              marginBottom: 32,
              borderRadius: 12,
            }}
            bodyStyle={{ padding: 16 }}
          >
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={8}>
                <Card
                  size="small"
                  style={{ borderRadius: 10, background: "#fafafa" }}
                >
                  <Statistic
                    title="Main Subtotal"
                    value={calculations.mainSubtotal}
                    precision={2}
                    prefix="₹"
                  />
                </Card>
              </Col>

              <Col xs={24} sm={8}>
                <Card
                  size="small"
                  style={{ borderRadius: 10, background: "#fff1f0" }}
                >
                  <Statistic
                    title="Line Discounts"
                    value={-calculations.mainLineDiscount}
                    precision={2}
                    prefix="₹"
                    valueStyle={{ color: "#cf1322" }}
                  />
                </Card>
              </Col>

              <Col xs={24} sm={8}>
                <Card
                  size="small"
                  style={{ borderRadius: 10, background: "#fff7e6" }}
                >
                  <Statistic
                    title="Extra Discount"
                    value={-calculations.extraDiscAmt}
                    precision={2}
                    prefix="₹"
                    valueStyle={{ color: "#d48806" }}
                  />
                </Card>
              </Col>

              <Col xs={24} sm={12}>
                <Card size="small" style={{ borderRadius: 10 }}>
                  <Form.Item label="Shipping Charges">
                    <InputNumber
                      min={0}
                      value={formData.shippingAmount}
                      onChange={(v) =>
                        setFormData({ ...formData, shippingAmount: v })
                      }
                      style={{ width: "100%", borderRadius: 8 }}
                      addonBefore="₹"
                    />
                  </Form.Item>
                </Card>
              </Col>

              <Col xs={24} sm={12}>
                <Card size="small" style={{ borderRadius: 10 }}>
                  <Form.Item label="Round Off">
                    <InputNumber
                      disabled
                      value={calculations.roundOff}
                      style={{ width: "100%", borderRadius: 8 }}
                    />
                  </Form.Item>
                </Card>
              </Col>

              <Col xs={24}>
                <Card
                  style={{
                    borderRadius: 14,
                    background:
                      "linear-gradient(135deg, #e6f4ff 0%, #f0f5ff 100%)",
                    border: "1px solid #d6e4ff",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div>
                      <Text type="secondary">Grand Total</Text>
                      <div
                        style={{
                          fontSize: 32,
                          fontWeight: 700,
                          color: "#1677ff",
                        }}
                      >
                        ₹{calculations.finalAmount}
                      </div>
                    </div>

                    <div style={{ textAlign: "right" }}>
                      <Text type="secondary">Rounded Amount</Text>
                      <div style={{ fontSize: 16 }}>
                        ₹{Math.round(calculations.finalAmount)}
                      </div>
                    </div>
                  </div>
                </Card>
              </Col>

              {calculations.optionalPotential > 0 && (
                <Col xs={24}>
                  <Card
                    size="small"
                    style={{
                      borderRadius: 10,
                      border: "1px dashed #722ed1",
                      background: "#faf5ff",
                    }}
                  >
                    <div>
                      <Text strong style={{ color: "#722ed1" }}>
                        Optional Items Potential
                      </Text>

                      <div style={{ fontSize: 18, marginTop: 4 }}>
                        ₹{calculations.optionalPotential}
                      </div>

                      <Text type="secondary">
                        (not included in final quotation total)
                      </Text>
                    </div>
                  </Card>
                </Col>
              )}
            </Row>
          </Card>

          {/* Actions */}
          <div style={{ textAlign: "right", marginTop: 40 }}>
            <Space size="large">
              <Button size="large" onClick={() => navigate("/quotations/list")}>
                Cancel
              </Button>
              <Button
                type="primary"
                icon={<SaveOutlined />}
                size="large"
                loading={isCreating || isUpdating}
                onClick={handleSubmit}
                disabled={
                  !formData.customerId || formData.products.length === 0
                }
              >
                {isEditMode ? "Update Quotation" : "Create Quotation"}
              </Button>
            </Space>
          </div>

          {/* ====================== MODALS ====================== */}

          <AddFloorModal
            visible={showAddFloorModal}
            onCancel={() => setShowAddFloorModal(false)}
            onFinish={addFloor}
            form={floorForm}
          />

          <EditFloorModal
            visible={showEditFloorModal}
            floorName={editingFloor?.floorName || ""}
            onCancel={() => {
              setShowEditFloorModal(false);
              setEditingFloor(null);
            }}
            onFinish={editFloor}
            form={floorEditForm}
          />

          <AddEditRoomModal
            visible={showAddRoomModal}
            onCancel={() => setShowAddRoomModal(false)}
            onFinish={addRoom}
            form={roomForm}
          />

          <AddEditRoomModal
            visible={showEditRoomModal}
            isEdit
            initialValues={editRoomInitialValues}
            onCancel={() => {
              setShowEditRoomModal(false);
              setEditingRoom(null);
            }}
            onFinish={editRoom}
            form={roomEditForm}
          />

          <AssignItemModal
            visible={showAssignModal}
            onCancel={() => setShowAssignModal(false)}
            onAssign={handleAssignLocation}
            item={itemToAssign}
            floors={formData.floors}
          />

          {/* Add Option Modal */}
          <Modal
            title="Add Option / Variant / Upgrade"
            open={showAddOptionModal}
            onCancel={() => {
              setShowAddOptionModal(false);
              setSelectedParentId(null);
            }}
            footer={null}
            width={600}
          >
            <Space direction="vertical" style={{ width: "100%" }} size="large">
              <div>
                <label style={{ display: "block", marginBottom: 8 }}>
                  Select parent product:
                </label>
                <Select
                  value={selectedParentId}
                  onChange={setSelectedParentId}
                  style={{ width: "100%" }}
                  placeholder="Choose main product"
                >
                  {mainProducts.map((p) => (
                    <Option key={p.productId} value={p.productId}>
                      {p.name} — ₹{safeNum(p.sellingPrice, 0).toFixed(2)}
                    </Option>
                  ))}
                </Select>
              </div>

              <div>
                <label style={{ display: "block", marginBottom: 8 }}>
                  Option type:
                </label>
                <Select
                  value={optionType}
                  onChange={setOptionType}
                  style={{ width: "100%" }}
                >
                  <Option value="addon">Add-on</Option>
                  <Option value="upgrade">Upgrade</Option>
                  <Option value="variant">Variant</Option>
                </Select>
              </div>

              <div>
                <label style={{ display: "block", marginBottom: 8 }}>
                  Search product:
                </label>
                <Select
                  showSearch
                  prefix={<SearchOutlined />}
                  placeholder={`Search ${optionType}...`}
                  onSearch={debouncedSearch}
                  onChange={addOption}
                  filterOption={false}
                  notFoundContent={
                    isSearching ? (
                      <Spin size="small" />
                    ) : searchTerm ? (
                      "No results"
                    ) : (
                      "Type to search"
                    )
                  }
                  style={{ width: "100%" }}
                >
                  {searchResult.map((p) => {
                    const price = safeNum(
                      p.meta?.["9ba862ef-f993-4873-95ef-1fef10036aa5"],
                      0,
                    );
                    return (
                      <Option
                        key={p.id || p.productId}
                        value={p.id || p.productId}
                      >
                        {p.name} — ₹{price.toFixed(2)}
                      </Option>
                    );
                  })}
                </Select>
              </div>
            </Space>
          </Modal>

          {/* Add Customer Modal */}
          <AddCustomerModal
            visible={showCustomerModal}
            onClose={() => setShowCustomerModal(false)}
          />

          {/* Add Address Modal */}
          {showAddressModal && (
            <AddAddress
              onClose={() => setShowAddressModal(false)}
              onSave={(addrId) => {
                setFormData((prev) => ({ ...prev, shipTo: addrId }));
                refetchAddresses();
              }}
              selectedCustomer={formData.customerId}
            />
          )}
        </Form>
      </div>
    </div>
  );
};

export default AddQuotation;
