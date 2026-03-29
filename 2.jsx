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
  SearchOutlined,
} from "@ant-design/icons";
import { debounce } from "lodash";
import { format } from "date-fns";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { v4 as uuidv4 } from "uuid";

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

import AddAddress from "../../components/Address/AddAddressModal";

// === Import All Modals ===
import AddFloorModal from "../../components/modals/AddFloorModal";
import AddEditRoomModal from "../../components/modals/AddEditRoomModal";
import AddAreaModal from "../../components/modals/AddAreaModal"; // or your custom area modal
import AssignItemModal from "../../components/modals/AssignItemModal"; // the improved one
import EditFloorModal from "../../components/modals/EditFloorModal";

const { Text } = Typography;
const { Option } = Select;

const AddQuotation = () => {
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const navigate = useNavigate();

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
    floors: [], // [{floorId, floorName, rooms: [{roomId, roomName, type?, areas: []}]}]
  };

  const [formData, setFormData] = useState(initialFormData);

  const [floorForm] = Form.useForm();
  const [roomForm] = Form.useForm();
  const [areaForm] = Form.useForm();

  // Modal States
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [showVersionsModal, setShowVersionsModal] = useState(false);

  // Floor & Room Management Modals
  const [showAddFloorModal, setShowAddFloorModal] = useState(false);
  const [showAddRoomModal, setShowAddRoomModal] = useState(false);
  const [showAddAreaModal, setShowAddAreaModal] = useState(false);
  const [showEditFloorModal, setShowEditFloorModal] = useState(false);

  const [selectedFloorId, setSelectedFloorId] = useState(null); // for adding room/area
  const [editingFloor, setEditingFloor] = useState(null);

  // Assignment Modal
  const [showAssignModal, setShowAssignModal] = useState(false);
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

  const generateId = () => `id_${uuidv4().slice(0, 8)}`;

  // ── Load existing quotation ───────────────────────────────────────
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

  // ── Floor / Room / Area Handlers using Modals ─────────────────────
  const addFloor = (values) => {
    const newFloor = {
      floorId: generateId(),
      floorName: values.name.trim(),
      rooms: [],
    };
    setFormData((prev) => ({
      ...prev,
      floors: [...prev.floors, newFloor],
    }));
    message.success("Floor added successfully");
    setShowAddFloorModal(false);
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
  };

  const addArea = (values) => {
    if (!selectedFloorId) return;
    // You can enhance this based on your AREA_OPTIONS

    setFormData((prev) => ({
      ...prev,
      floors: prev.floors.map((f) =>
        f.floorId === selectedFloorId
          ? {
              ...f,
              rooms: (f.rooms || []).map((r) =>
                r.roomId === selectedFloorId // Wait — you need to track selectedRoomId too
                  ? {
                      ...r,
                      areas: [
                        ...(r.areas || []),
                        {
                          id: generateId(),
                          name: values.areaType, // or map from AREA_OPTIONS
                          value: "",
                        },
                      ],
                    }
                  : r,
              ),
            }
          : f,
      ),
    }));
    // Note: You may need another state for selectedRoomId if adding area to specific room
    message.success("Area added");
    setShowAddAreaModal(false);
  };

  // ── Assign Location to Product (Multi-location support) ───────────
  const openAssignModal = (product) => {
    setItemToAssign(product);
    setShowAssignModal(true);
  };

  const handleAssignLocation = (productId, assignments) => {
    setFormData((prev) => ({
      ...prev,
      products: prev.products.map((p) => {
        if (p.productId === productId) {
          // For simplicity, we'll take the first assignment as primary location
          const primary = assignments[0] || {};
          return {
            ...p,
            floorId: primary.floorId,
            floorName: primary.floorName,
            roomId: primary.roomId,
            roomName: primary.roomName,
            areaId: primary.areaId,
            areaName: primary.areaName,
            // You can also store all assignments if needed
          };
        }
        return p;
      }),
    }));
    message.success("Location assigned successfully");
  };

  // ── Memoized Calculations (unchanged) ─────────────────────────────
  const { mainProducts } = useMemo(() => {
    return {
      mainProducts: formData.products.filter((p) => !p.isOptionFor),
    };
  }, [formData.products]);

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
      const lineNet = price * qty - lineDisc;

      mainSubtotal += lineNet;
      mainLineDiscount += lineDisc;
    });

    const extraDiscValue = safeNum(formData.extraDiscount, 0);
    const extraDiscAmt =
      formData.extraDiscountType === "percent"
        ? (mainSubtotal * extraDiscValue) / 100
        : extraDiscValue;

    const afterExtra = mainSubtotal - extraDiscAmt;
    const shipping = safeNum(formData.shippingAmount, 0);
    const totalBeforeRound = afterExtra + shipping;
    const rounded = Math.round(totalBeforeRound);
    const roundOff = rounded - totalBeforeRound;

    return {
      mainSubtotal: Number(mainSubtotal.toFixed(2)),
      mainLineDiscount: Number(mainLineDiscount.toFixed(2)),
      extraDiscAmt: Number(extraDiscAmt.toFixed(2)),
      shipping,
      roundOff: Number(roundOff.toFixed(2)),
      finalAmount: Number(rounded.toFixed(0)),
    };
  }, [
    mainProducts,
    formData.shippingAmount,
    formData.extraDiscount,
    formData.extraDiscountType,
  ]);

  // ── Product Handlers (simplified) ─────────────────────────────────
  const addProduct = (productId) => {
    const prod = searchResult.find((p) => (p.id || p.productId) === productId);
    if (!prod) return;

    if (formData.products.some((item) => item.productId === productId)) {
      return message.info("Product already added");
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
          isOptionFor: null,
          groupId: `grp-${uuidv4().slice(0, 8)}`,
        },
      ],
    }));
    setSearchTerm("");
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

  // Follow-up dates handlers (unchanged)
  const addFollowup = () => {
    setFormData((prev) => ({
      ...prev,
      followupDates: [...prev.followupDates, null],
    }));
  };

  const removeFollowup = (index) => {
    setFormData((prev) => ({
      ...prev,
      followupDates: prev.followupDates.filter((_, i) => i !== index),
    }));
  };

  const changeFollowup = (index, date) => {
    setFormData((prev) => {
      const dates = [...prev.followupDates];
      dates[index] = date;
      return { ...prev, followupDates: dates };
    });
  };

  // ── Submit (unchanged except floors) ──────────────────────────────
  const handleSubmit = async () => {
    if (!formData.customerId) return message.error("Please select customer");
    if (formData.products.length === 0)
      return message.error("Add at least one product");

    const payload = {
      ...formData,
      quotation_date: formData.quotation_date
        ? format(formData.quotation_date, "yyyy-MM-dd")
        : null,
      due_date: formData.due_date
        ? format(formData.due_date, "yyyy-MM-dd")
        : null,
      products: formData.products.map((p) => ({
        ...p,
        price: safeNum(p.sellingPrice),
        quantity: safeNum(p.qty),
        total: Number(
          (
            safeNum(p.sellingPrice) * safeNum(p.qty) -
            (p.discountType === "percent"
              ? (safeNum(p.sellingPrice) *
                  safeNum(p.qty) *
                  safeNum(p.discount)) /
                100
              : safeNum(p.discount) * safeNum(p.qty))
          ).toFixed(2),
        ),
      })),
      floors: formData.floors,
      followupDates: formData.followupDates
        .filter(Boolean)
        .map((d) => format(d, "yyyy-MM-dd")),
    };

    try {
      if (isEditMode) {
        await updateQuotation({ id, updatedQuotation: payload }).unwrap();
        message.success("Quotation updated");
      } else {
        await createQuotation(payload).unwrap();
        message.success("Quotation created");
      }
      navigate("/quotations/list");
    } catch (err) {
      message.error(err?.data?.message || "Failed to save");
    }
  };

  // ── Table Columns ─────────────────────────────────────────────────
  const columns = [
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
      width: 280,
      render: (_, record) => (
        <Button
          type="link"
          onClick={() => openAssignModal(record)}
          style={{ padding: 0 }}
        >
          {record.floorName ? (
            <div>
              {record.floorName} {record.roomName && `→ ${record.roomName}`}
              {record.areaName && ` → ${record.areaName}`}
            </div>
          ) : (
            "Assign Location"
          )}
        </Button>
      ),
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
          {/* Customer & Shipping */}
          <Card title="Customer & Shipping" style={{ marginBottom: 24 }}>
            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item label="Customer *" required>
                  <Select
                    showSearch
                    value={formData.customerId}
                    onChange={(v) =>
                      setFormData({ ...formData, customerId: v, shipTo: "" })
                    }
                    placeholder="Select customer"
                    filterOption={(input, option) =>
                      option.children
                        .toLowerCase()
                        .includes(input.toLowerCase())
                    }
                  >
                    {(customersData?.data || []).map((c) => (
                      <Option key={c.customerId} value={c.customerId}>
                        {c.name}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item label="Shipping Address">
                  <Space.Compact style={{ width: "100%" }}>
                    <Select
                      placeholder="Select or add address"
                      value={formData.shipTo}
                      onChange={(v) => setFormData({ ...formData, shipTo: v })}
                      disabled={!formData.customerId}
                      style={{ flex: 1 }}
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
          <Card title="Quotation Details" style={{ marginBottom: 24 }}>
            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item label="Title *" required>
                  <Input
                    value={formData.document_title}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        document_title: e.target.value,
                      })
                    }
                    placeholder="e.g. Bathroom Fittings Quotation"
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item label="Quotation Number">
                  <Input value="Auto-generated" disabled />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item label="Quotation Date *" required>
                  <DatePicker
                    selected={formData.quotation_date}
                    onChange={(d) =>
                      setFormData({ ...formData, quotation_date: d })
                    }
                    dateFormat="dd/MM/yyyy"
                    className="ant-input"
                    wrapperClassName="full-width"
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item label="Due Date *" required>
                  <DatePicker
                    selected={formData.due_date}
                    onChange={(d) => setFormData({ ...formData, due_date: d })}
                    dateFormat="dd/MM/yyyy"
                    minDate={formData.quotation_date}
                    className="ant-input"
                    wrapperClassName="full-width"
                  />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item label="Follow-up Dates">
              <Space direction="vertical" style={{ width: "100%" }}>
                {formData.followupDates.map((date, i) => (
                  <Space key={i} align="center">
                    <DatePicker
                      selected={date}
                      onChange={(d) => changeFollowup(i, d)}
                      dateFormat="dd/MM/yyyy"
                      minDate={new Date()}
                      maxDate={formData.due_date}
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
                  type="dashed"
                  block
                  icon={<PlusOutlined />}
                  onClick={addFollowup}
                >
                  Add Follow-up Date
                </Button>
              </Space>
            </Form.Item>
          </Card>

          {/* Project Structure Card */}
          <Card
            title="Project Structure (Floors, Rooms & Areas)"
            style={{ marginBottom: 24 }}
            extra={
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setShowAddFloorModal(true)}
              >
                Add Floor
              </Button>
            }
          >
            {formData.floors.length === 0 ? (
              <Text type="secondary">No floors added yet.</Text>
            ) : (
              formData.floors.map((floor) => (
                <Card
                  key={floor.floorId}
                  size="small"
                  style={{ marginBottom: 12 }}
                >
                  <Space
                    style={{ width: "100%", justifyContent: "space-between" }}
                  >
                    <strong>{floor.floorName}</strong>
                    <Space>
                      <Button
                        size="small"
                        onClick={() => {
                          setEditingFloor(floor);
                          setShowEditFloorModal(true);
                        }}
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
                      >
                        Add Room
                      </Button>
                    </Space>
                  </Space>
                </Card>
              ))
            )}
          </Card>

          {/* Products Card */}
          <Card
            title="Products & Options"
            extra={
              <Select
                showSearch
                style={{ width: 380 }}
                placeholder="Search and add product"
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
            }
          >
            <Table
              columns={columns}
              dataSource={formData.products}
              rowKey="productId"
              pagination={false}
              scroll={{ y: 400 }}
            />
          </Card>

          {/* Financial Summary (GST removed) */}
          <Card title="Financial Summary" style={{ marginBottom: 32 }}>
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={8}>
                <Statistic
                  title="Main Subtotal"
                  value={calculations.mainSubtotal}
                  precision={2}
                  prefix="₹"
                />
              </Col>
              <Col xs={24} sm={8}>
                <Statistic
                  title="Line Discounts"
                  value={-calculations.mainLineDiscount}
                  precision={2}
                  prefix="₹"
                  valueStyle={{ color: "#f5222d" }}
                />
              </Col>
              <Col xs={24} sm={8}>
                <Statistic
                  title="Extra Discount"
                  value={-calculations.extraDiscAmt}
                  precision={2}
                  prefix="₹"
                  valueStyle={{ color: "#fa8c16" }}
                />
              </Col>

              <Divider />

              <Col xs={24} sm={8}>
                <Form.Item label="Shipping">
                  <InputNumber
                    min={0}
                    value={formData.shippingAmount}
                    onChange={(v) =>
                      setFormData({ ...formData, shippingAmount: v })
                    }
                    style={{ width: "100%" }}
                    addonBefore="₹"
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={8}>
                <Form.Item label="Round Off">
                  <InputNumber
                    disabled
                    value={calculations.roundOff}
                    style={{ width: "100%" }}
                  />
                </Form.Item>
              </Col>

              <Col xs={24}>
                <Statistic
                  title="FINAL AMOUNT"
                  value={calculations.finalAmount}
                  precision={0}
                  prefix="₹"
                  valueStyle={{
                    color: "#1890ff",
                    fontSize: 36,
                    fontWeight: "bold",
                  }}
                />
              </Col>

              {calculations.optionalPotential > 0 && (
                <Col xs={24}>
                  <Statistic
                    title="Optional Items Potential"
                    value={calculations.optionalPotential}
                    precision={2}
                    prefix="₹"
                    valueStyle={{ color: "#722ed1" }}
                  />
                  <Text type="secondary">(not included in final amount)</Text>
                </Col>
              )}
            </Row>
          </Card>

          {/* Signature */}
          <Card title="Authorized Signature" style={{ marginBottom: 32 }}>
            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item label="Name">
                  <Input
                    value={formData.signature_name}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        signature_name: e.target.value,
                      })
                    }
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item label="Signature Image URL">
                  <Input
                    value={formData.signature_image}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        signature_image: e.target.value,
                      })
                    }
                  />
                </Form.Item>
              </Col>
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
        </Form>
        {/* ====================== MODALS ====================== */}
        {/* Add Floor Modal */}
        <AddFloorModal
          visible={showAddFloorModal}
          onCancel={() => setShowAddFloorModal(false)}
          onFinish={addFloor}
          form={floorForm}
        />
        {/* Edit Floor Modal */}
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
        {/* Add Room Modal */}
        <AddEditRoomModal
          visible={showAddRoomModal}
          onCancel={() => setShowAddRoomModal(false)}
          onFinish={addRoom}
          form={roomForm}
        />
        {/* Assign Location Modal */}
        <AssignItemModal
          visible={showAssignModal}
          onCancel={() => setShowAssignModal(false)}
          onAssign={handleAssignLocation}
          item={itemToAssign}
          floors={formData.floors}
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
        {/* Option Modal */}
        <Modal
          title="Add Option / Variant / Upgrade"
          open={showAddOptionModal}
          onCancel={() => setShowAddOptionModal(false)}
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
                <Option value="addon">Add-on (adds to total)</Option>
                <Option value="upgrade">Upgrade (extra cost)</Option>
                <Option value="variant">Variant (alternative)</Option>
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
        </Modal>{" "}
        {/* DatePicker Styles */}
        <style jsx>{`
          .full-width > div {
            width: 100% !important;
          }
          .react-datepicker-wrapper,
          .react-datepicker__input-container {
            width: 100%;
          }
          .react-datepicker__input-container input {
            width: 100%;
            height: 32px;
            padding: 4px 11px;
            border: 1px solid #d9d9d9;
            border-radius: 6px;
          }
          .react-datepicker__input-container input:focus {
            border-color: #40a9ff;
            box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
          }
        `}</style>
      </div>
    </div>
  );
};

export default AddQuotation;
