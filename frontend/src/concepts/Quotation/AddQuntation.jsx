// src/components/Quotation/AddQuotation.jsx
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  message,
  Input,
  Select,
  Table,
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
  Divider,
  Statistic,
  Tag,
} from "antd";
import {
  ArrowLeftOutlined,
  PlusOutlined,
  DeleteOutlined,
  SaveOutlined,
  DragOutlined,
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

// DND KIT IMPORTS
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
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import AddAddress from "../../components/Address/AddAddressModal";

// Import Modals
import AddFloorModal from "../../components/modals/AddFloorModal";
import AddEditRoomModal from "../../components/modals/AddEditRoomModal";
import AssignItemModal from "../../components/modals/AssignItemModal";
import EditFloorModal from "../../components/modals/EditFloorModal";

const { Text } = Typography;
const { Option } = Select;
// Sortable Row Component
const SortableRow = ({ children, ...props }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: props["data-row-key"],
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
    background: isDragging ? "#f0f0f0" : "transparent",
  };

  return (
    <tr
      ref={setNodeRef}
      style={style}
      {...props}
      {...attributes}
      {...listeners}
    >
      {children}
    </tr>
  );
};
const AddQuotation = () => {
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const navigate = useNavigate(); // NEW: Drag & Drop State
  const [dragMode, setDragMode] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );
  // After other modal states
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

  // Modal Forms
  const [floorForm] = Form.useForm();
  const [roomForm] = Form.useForm();

  // Modal Visibility States
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [showAddFloorModal, setShowAddFloorModal] = useState(false);
  const [showAddRoomModal, setShowAddRoomModal] = useState(false);
  const [showEditFloorModal, setShowEditFloorModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showVersionsModal, setShowVersionsModal] = useState(false);

  // Option Modal States (Fixed)
  const [showAddOptionModal, setShowAddOptionModal] = useState(false);
  const [selectedParentId, setSelectedParentId] = useState(null);
  const [optionType, setOptionType] = useState("addon");

  const [selectedFloorId, setSelectedFloorId] = useState(null);
  const [editingFloor, setEditingFloor] = useState(null);
  const [itemToAssign, setItemToAssign] = useState(null);

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
  // ── Drag Reorder Handler ─────────────────────────────────────────
  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setFormData((prev) => {
      const oldIndex = prev.products.findIndex(
        (item) => item.productId === active.id,
      );
      const newIndex = prev.products.findIndex(
        (item) => item.productId === over.id,
      );

      if (oldIndex === -1 || newIndex === -1) return prev;

      const newProducts = arrayMove(prev.products, oldIndex, newIndex).map(
        (item, index) => ({
          ...item,
          priority: index,
        }),
      );

      return { ...prev, products: newProducts };
    });
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

      // Explicitly ensure location fields
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
  }, [isEditMode, existingQuotation, userId]);

  // ── Floor / Room Handlers ─────────────────────────────────────────
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

  const editFloor = (values) => {
    if (!editingFloor) return;
    setFormData((prev) => ({
      ...prev,
      floors: prev.floors.map((f) =>
        f.floorId === editingFloor.floorId
          ? { ...f, floorName: values.name.trim() }
          : f,
      ),
    }));
    message.success("Floor updated");
    setShowEditFloorModal(false);
    setEditingFloor(null);
    floorForm.resetFields();
  };

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

  // ── Assign Location ───────────────────────────────────────────────
  // ── Assign Location ───────────────────────────────────────────────
  const openAssignModal = (product) => {
    setItemToAssign(product);
    setShowAssignModal(true);
  };

  const handleAssignLocation = (productId, assignments) => {
    if (!assignments || assignments.length === 0) {
      message.warning("No location selected");
      setShowAssignModal(false);
      return;
    }

    const primary = assignments[assignments.length - 1] || assignments[0];

    setFormData((prev) => ({
      ...prev,
      products: prev.products.map((p) => {
        if (p.productId === productId) {
          return {
            ...p,
            floorId: primary.floorId || null,
            floorName: primary.floorName || null,
            roomId: primary.roomId || null,
            roomName: primary.roomName || null,
            areaId: primary.areaId || null,
            areaName: primary.areaName || null,
          };
        }
        return p;
      }),
    }));

    const loc = [primary.floorName, primary.roomName, primary.areaName]
      .filter(Boolean)
      .join(" → ");

    message.success(`Assigned to ${loc}`);
    setShowAssignModal(false);
    setItemToAssign(null);
  };

  // ── Product Handlers ──────────────────────────────────────────────
  const addProduct = (productId) => {
    const prod = searchResult.find((p) => (p.id || p.productId) === productId);
    if (
      !prod ||
      formData.products.some((item) => item.productId === productId)
    ) {
      return message.info("Product already added or not found");
    }

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
          priority: prev.products.length, // ← Updated
          isOptionFor: null,
          groupId: `grp-${uuidv4().slice(0, 8)}`,
        },
      ],
    }));
    setSearchTerm("");
  };

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
          priority: prev.products.length, // ← Updated
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

  const updateProductField = (productId, field, value) => {
    setFormData((prev) => ({
      ...prev,
      products: prev.products.map((p) =>
        p.productId === productId ? { ...p, [field]: value } : p,
      ),
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
  }, [
    mainProducts,
    formData.shippingAmount,
    formData.extraDiscount,
    formData.extraDiscountType,
  ]);

  // ── Submit ────────────────────────────────────────────────────────
  // ── Submit ────────────────────────────────────────────────────────
  // ── Submit ────────────────────────────────────────────────────────
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

    // Build clean products payload
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

      // Build locations array (This is what backend prefers)
      const locations =
        p.areaId || p.roomId || p.floorId
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
        // === NEW: Send locations array (Critical for Area) ===
        locations: locations,

        // Backward compatibility (keep these)
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
  // ── Table Columns ─────────────────────────────────────────────────
  const columns = [
    {
      title: "Drag",
      width: 50,
      render: (_, record) =>
        dragMode ? (
          <div style={{ cursor: "grab", color: "#999", textAlign: "center" }}>
            <DragOutlined />
          </div>
        ) : null,
    },
    {
      title: "Product",
      render: (_, record) => (
        <div>
          {record.isOptionFor && <Text type="secondary">↳ </Text>}
          {record.name}
        </div>
      ),
    },
    {
      title: "Qty",
      width: 100,
      render: (_, r) => (
        <InputNumber
          min={1}
          value={r.qty}
          onChange={(v) => updateProductField(r.productId, "qty", v)}
        />
      ),
    },
    {
      title: "Price (₹)",
      width: 120,
      render: (_, r) => safeNum(r.sellingPrice, 0).toFixed(2),
    },
    {
      title: "Discount",
      width: 160,
      render: (_, r) => (
        <Space.Compact>
          <InputNumber
            min={0}
            value={r.discount}
            onChange={(v) => updateProductField(r.productId, "discount", v)}
            style={{ width: 90 }}
          />
          <Select
            value={r.discountType}
            onChange={(v) => updateProductField(r.productId, "discountType", v)}
            style={{ width: 70 }}
          >
            <Option value="fixed">₹</Option>
            <Option value="percent">%</Option>
          </Select>
        </Space.Compact>
      ),
    },
    {
      title: "Location",
      width: 300,
      render: (_, record) => {
        const location = [record.floorName, record.roomName, record.areaName]
          .filter(Boolean)
          .join(" → ");

        return (
          <Button
            type="link"
            onClick={() => openAssignModal(record)}
            style={{
              padding: 0,
              textAlign: "left",
              height: "auto",
              whiteSpace: "normal",
            }}
          >
            {location || "Assign Location"}
          </Button>
        );
      },
    },
    {
      title: "",
      width: 80,
      render: (_, r) => (
        <Button
          danger
          size="small"
          icon={<DeleteOutlined />}
          onClick={() => removeProduct(r.productId)}
        />
      ),
    },
  ];

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
                            label={displayName} // ← Important for filtering
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
                      value={formData.shipTo || undefined} // ← Important
                      onChange={(v) =>
                        setFormData({
                          ...formData,
                          shipTo: v || null,
                        })
                      }
                      disabled={!formData.customerId}
                      style={{ flex: 1 }}
                      allowClear // Allows clearing
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
              {/* Title */}
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

              {/* Number */}
              <Col xs={24} md={12}>
                <Form.Item label="Quotation Number" style={{ marginBottom: 8 }}>
                  <Input value="Auto-generated" disabled />
                </Form.Item>
              </Col>

              {/* Dates Section */}
              <Col xs={24}>
                <Card
                  size="small"
                  style={{
                    background: "#fafafa",
                    borderRadius: 10,
                  }}
                >
                  <Row gutter={[16, 16]}>
                    {/* Quotation Date */}
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

                    {/* Due Date */}
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

              {/* Follow-up Dates */}
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
          {/* Project Structure */}
          <Card
            title="Project Structure (Floors, Rooms & Areas)"
            style={{
              marginBottom: 24,
              borderRadius: 12,
            }}
            bodyStyle={{ padding: 16 }}
            extra={
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setShowAddFloorModal(true)}
                style={{ borderRadius: 8 }}
              >
                Add Floor
              </Button>
            }
          >
            {formData.floors.length === 0 ? (
              <div style={{ padding: "20px 0", textAlign: "center" }}>
                <Text type="secondary">No floors added yet</Text>
              </div>
            ) : (
              <div
                style={{ display: "flex", flexDirection: "column", gap: 12 }}
              >
                {formData.floors.map((floor) => (
                  <Card
                    key={floor.floorId}
                    size="small"
                    style={{
                      borderRadius: 10,
                      border: "1px solid #f0f0f0",
                      background: "#fff",
                    }}
                    bodyStyle={{ padding: 12 }}
                  >
                    {/* FLOOR HEADER */}
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <div style={{ display: "flex", flexDirection: "column" }}>
                        <Text strong style={{ fontSize: 15 }}>
                          🏢 {floor.floorName}
                        </Text>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {floor.rooms?.length || 0} Rooms
                        </Text>
                      </div>

                      <Space>
                        <Button
                          size="small"
                          onClick={() => {
                            setEditingFloor(floor);
                            setShowEditFloorModal(true);
                          }}
                          style={{ borderRadius: 6 }}
                        >
                          Edit
                        </Button>

                        <Button
                          type="primary"
                          size="small"
                          onClick={() => {
                            setSelectedFloorId(floor.floorId);
                            setShowAddRoomModal(true);
                          }}
                          style={{ borderRadius: 6 }}
                        >
                          + Room
                        </Button>
                      </Space>
                    </div>

                    {/* ROOMS PREVIEW */}
                    {floor.rooms?.length > 0 && (
                      <div
                        style={{
                          marginTop: 10,
                          paddingLeft: 10,
                          borderLeft: "2px solid #e6f4ff",
                          display: "flex",
                          flexDirection: "column",
                          gap: 6,
                        }}
                      >
                        {floor.rooms.map((room) => (
                          <div
                            key={room.roomId}
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              padding: "6px 8px",
                              borderRadius: 6,
                              background: "#fafafa",
                            }}
                          >
                            <Text style={{ fontSize: 13 }}>
                              🛏️ {room.roomName}
                            </Text>

                            <Text type="secondary" style={{ fontSize: 12 }}>
                              {room.areas?.length || 0} Areas
                            </Text>
                          </div>
                        ))}
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </Card>
          {/* Products & Options */}
          <Card
            title="Products & Options"
            style={{
              borderRadius: 12,
            }}
            bodyStyle={{ padding: 12 }}
            extra={
              <Space>
                {/* PRODUCT SEARCH */}
                <Select
                  showSearch
                  style={{ width: 720 }}
                  size="large"
                  placeholder="Search and add main product"
                  onSearch={debouncedSearch}
                  onChange={addProduct}
                  filterOption={false}
                  notFoundContent={
                    isSearching ? <Spin size="small" /> : "No products found"
                  }
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

                {/* ADD OPTION */}
                {mainProducts.length > 0 && (
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => setShowAddOptionModal(true)}
                    style={{ borderRadius: 8 }}
                  >
                    Add Option
                  </Button>
                )}
              </Space>
            }
          >
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={formData.products.map((p) => p.productId)}
                strategy={verticalListSortingStrategy}
              >
                <Table
                  components={{ body: { row: SortableRow } }}
                  columns={[
                    {
                      title: "Drag",
                      width: 50,
                      render: () => (
                        <div
                          style={{
                            cursor: "grab",
                            color: "#999",
                            textAlign: "center",
                          }}
                        >
                          <DragOutlined style={{ fontSize: 18 }} />
                        </div>
                      ),
                    },
                    {
                      title: "Product",
                      width: 280,
                      render: (_, record) => (
                        <div
                          style={{ display: "flex", flexDirection: "column" }}
                        >
                          <Text strong style={{ fontSize: 14 }}>
                            {record.isOptionFor && (
                              <span style={{ color: "#1677ff" }}>↳ </span>
                            )}
                            {record.name}
                          </Text>
                        </div>
                      ),
                    },

                    {
                      title: "Qty",
                      width: 100,
                      render: (_, r) => (
                        <InputNumber
                          min={1}
                          value={r.qty}
                          onChange={(v) =>
                            updateProductField(r.productId, "qty", v)
                          }
                          style={{ width: "100%", borderRadius: 8 }}
                        />
                      ),
                    },

                    {
                      title: "Price",
                      width: 120,
                      render: (_, r) => (
                        <Text>₹{safeNum(r.sellingPrice, 0).toFixed(2)}</Text>
                      ),
                    },

                    {
                      title: "Discount",
                      width: 180,
                      render: (_, r) => (
                        <Space.Compact style={{ width: "100%" }}>
                          <InputNumber
                            min={0}
                            value={r.discount}
                            onChange={(v) =>
                              updateProductField(r.productId, "discount", v)
                            }
                            style={{ width: "60%" }}
                          />
                          <Select
                            value={r.discountType}
                            onChange={(v) =>
                              updateProductField(r.productId, "discountType", v)
                            }
                            style={{ width: "40%" }}
                          >
                            <Option value="fixed">₹</Option>
                            <Option value="percent">%</Option>
                          </Select>
                        </Space.Compact>
                      ),
                    },

                    {
                      title: "Priority",
                      width: 110,
                      render: (_, r) => (
                        <InputNumber
                          min={0}
                          value={r.priority}
                          onChange={(v) =>
                            updateProductField(r.productId, "priority", v)
                          }
                          style={{ width: "100%", borderRadius: 8 }}
                        />
                      ),
                    },

                    {
                      title: "Location",
                      width: 260,
                      render: (_, record) => {
                        const location = [
                          record.floorName,
                          record.roomName,
                          record.areaName,
                        ]
                          .filter(Boolean)
                          .join(" → ");

                        return (
                          <Button
                            type="link"
                            onClick={() => openAssignModal(record)}
                            style={{
                              padding: 0,
                              textAlign: "left",
                              height: "auto",
                              whiteSpace: "normal",
                            }}
                          >
                            {location || (
                              <Text type="secondary">Assign Location</Text>
                            )}
                          </Button>
                        );
                      },
                    },

                    {
                      title: "",
                      width: 60,
                      render: (_, r) => (
                        <Button
                          danger
                          size="small"
                          icon={<DeleteOutlined />}
                          onClick={() => removeProduct(r.productId)}
                          style={{ borderRadius: 6 }}
                        />
                      ),
                    },
                  ]}
                  dataSource={formData.products}
                  rowKey="productId"
                  pagination={false}
                  scroll={{ y: 420, x: "max-content" }}
                  size="middle"
                  bordered={false}
                  sticky
                  rowClassName={(record) =>
                    record.isOptionFor ? "option-row" : "main-row"
                  }
                />
              </SortableContext>
            </DndContext>
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
              {/* TOP KPIs */}
              <Col xs={24} sm={8}>
                <Card
                  size="small"
                  style={{
                    borderRadius: 10,
                    background: "#fafafa",
                  }}
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
                  style={{
                    borderRadius: 10,
                    background: "#fff1f0",
                  }}
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
                  style={{
                    borderRadius: 10,
                    background: "#fff7e6",
                  }}
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

              {/* INPUT CONTROLS */}
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

              {/* FINAL AMOUNT (HIGHLIGHTED) */}
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

              {/* OPTIONAL ITEMS */}
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
            form={floorForm}
          />

          <AddEditRoomModal
            visible={showAddRoomModal}
            onCancel={() => setShowAddRoomModal(false)}
            onFinish={addRoom}
            form={roomForm}
          />

          <AssignItemModal
            visible={showAssignModal}
            onCancel={() => setShowAssignModal(false)}
            onAssign={handleAssignLocation}
            item={itemToAssign}
            floors={formData.floors}
          />

          {/* Add Option Modal (Fixed) */}
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
            // Optional: if you want to pass customer for editing later
            // customer={null}
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
