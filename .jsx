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
  Cascader,
} from "antd";
import {
  ArrowLeftOutlined,
  PlusOutlined,
  DeleteOutlined,
  SaveOutlined,
  SearchOutlined,
  HomeOutlined,
  ApartmentOutlined,
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
    extraDiscountType: "percent",
    signature_name: "",
    signature_image: "",
    customerId: "",
    shipTo: "",
    createdBy: userId,
    products: [],
    floors: [],
    followupDates: [],
  };

  const [formData, setFormData] = useState(initialFormData);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [showVersionsModal, setShowVersionsModal] = useState(false);
  const [showFloorsModal, setShowFloorsModal] = useState(false);
  const [showRoomsModal, setShowRoomsModal] = useState(false);
  const [selectedFloorForRooms, setSelectedFloorForRooms] = useState(null);
  const [showAddOptionModal, setShowAddOptionModal] = useState(false);
  const [selectedParentId, setSelectedParentId] = useState(null);
  const [optionType, setOptionType] = useState("addon");

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

  const generateFloorId = () => `fl_${uuidv4().slice(0, 8)}`;
  const generateRoomId = (floorId) => `${floorId}_rm_${uuidv4().slice(0, 6)}`;
  const generateAreaId = (roomId) => `${roomId}_ar_${uuidv4().slice(0, 6)}`;

  // ── Load existing quotation ───────────────────────────────────────
  useEffect(() => {
    if (!isEditMode || !existingQuotation) return;

    const parsedProducts = safeJsonParse(existingQuotation.products, []);
    const parsedFloors = safeJsonParse(existingQuotation.floors, []);

    const mappedProducts = parsedProducts.map((p) => ({
      productId: p.productId,
      name: p.name || "Unknown",
      qty: safeNum(p.quantity ?? p.qty, 1),
      sellingPrice: safeNum(p.price ?? p.sellingPrice, 0),
      discount: safeNum(p.discount, 0),
      discountType: p.discountType || "percent",
      tax: 0,
      isOptionFor: p.isOptionFor || null,
      optionType: p.optionType || null,
      groupId: p.groupId || null,
      // Support new locations structure
      locations:
        p.locations ||
        (p.floorId
          ? [
              {
                floorId: p.floorId,
                floorName: p.floorName,
                roomId: p.roomId,
                roomName: p.roomName,
                areaId: p.areaId,
                areaName: p.areaName,
                assignedQuantity: p.quantity,
              },
            ]
          : []),
      imageUrl: p.imageUrl || null,
      companyCode: p.companyCode || null,
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
      gst: safeNum(existingQuotation.gst, 0),
      shippingAmount: safeNum(existingQuotation.shippingAmount, 0),
      extraDiscount: safeNum(existingQuotation.extraDiscount, 0),
      extraDiscountType: existingQuotation.extraDiscountType || "percent",
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

  // ── Floor Options for Cascader ────────────────────────────────────
  const floorOptions = useMemo(() => {
    return (formData.floors || []).map((f) => ({
      value: f.floorId,
      label: f.floorName,
      children: (f.rooms || []).map((r) => ({
        value: r.roomId,
        label: r.roomName,
        children: (r.areas || []).map((a) => ({
          value: a.id,
          label: a.name ? `${a.name} (${a.value})` : a.value || "(unnamed)",
        })),
      })),
    }));
  }, [formData.floors]);

  // ── Floor / Room / Area Management ───────────────────────────────
  const addFloor = (name) => {
    if (!name.trim()) return message.error("Floor name is required");
    const newFloor = {
      floorId: generateFloorId(),
      floorName: name.trim(),
      sortOrder: formData.floors.length,
      rooms: [],
    };
    setFormData((prev) => ({
      ...prev,
      floors: [...prev.floors, newFloor],
    }));
    message.success("Floor added");
  };

  const addRoom = (floorId, name) => {
    if (!name.trim()) return message.error("Room name is required");
    setFormData((prev) => ({
      ...prev,
      floors: prev.floors.map((f) =>
        f.floorId === floorId
          ? {
              ...f,
              rooms: [
                ...(f.rooms || []),
                {
                  roomId: generateRoomId(f.floorId),
                  roomName: name.trim(),
                  areas: [],
                  sortOrder: (f.rooms || []).length,
                },
              ],
            }
          : f,
      ),
    }));
    message.success("Room added");
  };

  const addAreaToRoom = (floorId, roomId, areaName = "", areaValue = "") => {
    setFormData((prev) => ({
      ...prev,
      floors: prev.floors.map((f) =>
        f.floorId === floorId
          ? {
              ...f,
              rooms: (f.rooms || []).map((r) =>
                r.roomId === roomId
                  ? {
                      ...r,
                      areas: [
                        ...(r.areas || []),
                        {
                          id: generateAreaId(r.roomId),
                          name: areaName.trim(),
                          value: areaValue.trim(),
                        },
                      ],
                    }
                  : r,
              ),
            }
          : f,
      ),
    }));
    message.success("Area added");
  };

  const removeArea = (floorId, roomId, areaId) => {
    setFormData((prev) => {
      const updatedProducts = prev.products.map((p) => {
        if (!p.locations) return p;
        return {
          ...p,
          locations: p.locations.filter((loc) => loc.areaId !== areaId),
        };
      });

      const updatedFloors = prev.floors.map((f) =>
        f.floorId === floorId
          ? {
              ...f,
              rooms: (f.rooms || []).map((r) =>
                r.roomId === roomId
                  ? {
                      ...r,
                      areas: (r.areas || []).filter((a) => a.id !== areaId),
                    }
                  : r,
              ),
            }
          : f,
      );

      return { ...prev, products: updatedProducts, floors: updatedFloors };
    });
    message.success("Area removed");
  };

  // ── Assign Location to Product (with quantity) ───────────────────
  const assignLocationToProduct = (
    productId,
    selectedPath,
    assignedQty = null,
  ) => {
    if (!selectedPath || selectedPath.length < 2) {
      setFormData((prev) => ({
        ...prev,
        products: prev.products.map((p) =>
          p.productId === productId ? { ...p, locations: [] } : p,
        ),
      }));
      return;
    }

    const [floorId, roomId, areaId] = selectedPath;
    const floor = formData.floors.find((f) => f.floorId === floorId);
    const room = floor?.rooms?.find((r) => r.roomId === roomId);
    const area = room?.areas?.find((a) => a.id === areaId);

    const product = formData.products.find((p) => p.productId === productId);
    const currentQty = safeNum(product?.qty, 1);

    setFormData((prev) => ({
      ...prev,
      products: prev.products.map((p) =>
        p.productId === productId
          ? {
              ...p,
              locations: [
                {
                  floorId,
                  floorName: floor?.floorName || null,
                  roomId,
                  roomName: room?.roomName || null,
                  areaId: area?.id || null,
                  areaName: area?.name || null,
                  areaValue: area?.value || null,
                  assignedQuantity: assignedQty || currentQty,
                },
              ],
            }
          : p,
      ),
    }));
  };

  // ── Memoized Products ─────────────────────────────────────────────
  const { mainProducts } = useMemo(() => {
    const main = formData.products.filter((p) => !p.isOptionFor);
    return { mainProducts: main };
  }, [formData.products]);

  // ── Calculations ──────────────────────────────────────────────────
  const calculations = useMemo(() => {
    let mainSubtotal = 0;
    let mainLineDiscount = 0;

    formData.products.forEach((p) => {
      if (p.isOptionFor) return;

      const qty = safeNum(p.qty, 1);
      const price = safeNum(p.sellingPrice, 0);
      const disc = safeNum(p.discount, 0);
      const discType = p.discountType || "percent";

      const lineGross = price * qty;
      const lineDisc =
        discType === "percent" ? (lineGross * disc) / 100 : disc * qty;
      const lineNet = lineGross - lineDisc;

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

    // Optional items potential
    let optionalPotential = 0;
    formData.products.forEach((p) => {
      if (p.isOptionFor) {
        optionalPotential += safeNum(p.sellingPrice, 0) * safeNum(p.qty, 1);
      }
    });

    return {
      mainSubtotal: Number(mainSubtotal.toFixed(2)),
      mainLineDiscount: Number(mainLineDiscount.toFixed(2)),
      extraDiscAmt: Number(extraDiscAmt.toFixed(2)),
      shipping,
      roundOff: Number(roundOff.toFixed(2)),
      finalAmount: Number(rounded.toFixed(0)),
      optionalPotential: Number(optionalPotential.toFixed(2)),
    };
  }, [
    formData.products,
    formData.shippingAmount,
    formData.extraDiscount,
    formData.extraDiscountType,
  ]);

  // ── Product Handlers ──────────────────────────────────────────────
  const addProduct = (productId) => {
    const prod = searchResult.find((p) => (p.id || p.productId) === productId);
    if (!prod) return message.warning("Product not found");

    if (formData.products.some((item) => item.productId === productId)) {
      return message.info("Product already added");
    }

    const price = safeNum(
      prod.meta?.["9ba862ef-f993-4873-95ef-1fef10036aa5"],
      0,
    );
    const newGroupId = `grp-${uuidv4().slice(0, 8)}`;

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
          discountType: "percent",
          tax: 0,
          isOptionFor: null,
          optionType: null,
          groupId: newGroupId,
          locations: [],
          imageUrl: prod.images?.[0] || null,
          companyCode:
            prod.meta?.["d11da9f9-3f2e-4536-8236-9671200cca4a"] || null,
        },
      ],
    }));

    setSearchTerm("");
  };

  const addOption = (productId) => {
    if (!selectedParentId) return message.error("Select a main product first");

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
          discountType: "percent",
          tax: 0,
          isOptionFor: selectedParentId,
          optionType,
          groupId: parent.groupId,
          locations: parent.locations ? [...parent.locations] : [],
          imageUrl: prod.images?.[0] || null,
          companyCode:
            prod.meta?.["d11da9f9-3f2e-4536-8236-9671200cca4a"] || null,
        },
      ],
    }));

    setShowAddOptionModal(false);
    setSearchTerm("");
    message.success(`Added ${optionType}`);
  };

  const removeProduct = (productId) => {
    setFormData((prev) => {
      const product = prev.products.find((p) => p.productId === productId);
      let updated = prev.products.filter((p) => p.productId !== productId);

      if (product && !product.isOptionFor) {
        updated = updated.filter((p) => p.isOptionFor !== productId);
      }
      return { ...prev, products: updated };
    });
  };

  const updateProductField = (productId, field, value) => {
    setFormData((prev) => ({
      ...prev,
      products: prev.products.map((p) =>
        p.productId === productId ? { ...p, [field]: value } : p,
      ),
    }));
  };

  // ── Follow-up Dates ───────────────────────────────────────────────
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

  // ── Submit Handler (Updated for new backend) ─────────────────────
  const handleSubmit = async () => {
    if (!formData.customerId) return message.error("Please select customer");
    if (formData.products.length === 0)
      return message.error("Add at least one product");

    const payloadProducts = formData.products.map((p) => ({
      productId: p.productId,
      name: p.name,
      price: Number(safeNum(p.sellingPrice, 0).toFixed(2)),
      quantity: safeNum(p.qty, 1),
      discount: Number(safeNum(p.discount, 0).toFixed(2)),
      discountType: p.discountType || "percent",
      tax: 0,
      total: Number(
        p.discountType === "percent"
          ? p.sellingPrice * p.qty * (1 - p.discount / 100)
          : (p.sellingPrice - p.discount) * p.qty,
      ).toFixed(2),

      isOptionFor: p.isOptionFor || null,
      optionType: p.optionType || null,
      groupId: p.groupId || null,

      locations: p.locations || null,
      imageUrl: p.imageUrl || null,
      companyCode: p.companyCode || null,
    }));

    const payload = {
      ...formData,
      quotation_date: formData.quotation_date
        ? format(formData.quotation_date, "yyyy-MM-dd")
        : null,
      due_date: formData.due_date
        ? format(formData.due_date, "yyyy-MM-dd")
        : null,
      gst: 0,
      shippingAmount: safeNum(formData.shippingAmount),
      extraDiscount: safeNum(formData.extraDiscount),
      extraDiscountType: formData.extraDiscountType || "percent",
      roundOff: calculations.roundOff,
      finalAmount: calculations.finalAmount,
      products: payloadProducts,
      floors: formData.floors,
      followupDates: formData.followupDates
        .filter(Boolean)
        .map((d) => format(d, "yyyy-MM-dd")),
      shipTo: formData.shipTo || null,
    };

    try {
      if (isEditMode) {
        await updateQuotation({ id, updatedQuotation: payload }).unwrap();
        message.success("Quotation updated successfully");
      } else {
        await createQuotation(payload).unwrap();
        message.success("Quotation created successfully");
        setFormData(initialFormData);
      }
      navigate("/quotations/list");
    } catch (err) {
      message.error(err?.data?.message || "Failed to save quotation");
    }
  };

  // ── Table Columns (Updated) ───────────────────────────────────────
  const columns = [
    {
      title: "Floor / Room / Area",
      width: 280,
      render: (_, record) => {
        if (!record.locations?.length)
          return <Text type="secondary">Unassigned</Text>;

        return record.locations.map((loc, idx) => (
          <div
            key={idx}
            style={{ marginBottom: idx < record.locations.length - 1 ? 8 : 0 }}
          >
            <div>
              <HomeOutlined /> {loc.floorName}
            </div>
            {loc.roomName && (
              <div style={{ marginLeft: 20 }}>
                <ApartmentOutlined /> {loc.roomName}
              </div>
            )}
            {loc.areaName && (
              <div style={{ marginLeft: 40, color: "#666" }}>
                {loc.areaName} ({loc.areaValue})
              </div>
            )}
            {loc.assignedQuantity && (
              <div style={{ marginLeft: 20, fontSize: "0.9em" }}>
                Qty: {loc.assignedQuantity}
              </div>
            )}
          </div>
        ));
      },
    },
    {
      title: "Type",
      width: 100,
      render: (_, record) =>
        !record.isOptionFor ? (
          <Tag color="blue">Main</Tag>
        ) : (
          <Tag
            color={
              record.optionType === "addon"
                ? "green"
                : record.optionType === "upgrade"
                  ? "geekblue"
                  : "purple"
            }
          >
            {record.optionType || "Option"}
          </Tag>
        ),
    },
    {
      title: "Product",
      dataIndex: "name",
      key: "name",
      render: (text, record) => (
        <div style={{ paddingLeft: record.isOptionFor ? 32 : 0 }}>
          {record.isOptionFor && <Text type="secondary">↳ </Text>}
          {text}
        </div>
      ),
    },
    {
      title: "Qty",
      width: 90,
      render: (_, record) => (
        <InputNumber
          min={1}
          value={record.qty}
          onChange={(v) => updateProductField(record.productId, "qty", v)}
        />
      ),
    },
    {
      title: "Price (₹)",
      width: 110,
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
            value={r.discountType || "percent"}
            onChange={(v) => updateProductField(r.productId, "discountType", v)}
            style={{ width: 70 }}
          >
            <Option value="percent">%</Option>
            <Option value="fixed">₹</Option>
          </Select>
        </Space.Compact>
      ),
    },
    {
      title: "Location",
      width: 220,
      render: (_, record) => (
        <Cascader
          options={floorOptions}
          value={
            record.locations?.[0]
              ? [
                  record.locations[0].floorId,
                  record.locations[0].roomId,
                  record.locations[0].areaId,
                ].filter(Boolean)
              : undefined
          }
          onChange={(val) => assignLocationToProduct(record.productId, val)}
          placeholder="Select Floor → Room → Area"
          allowClear
          style={{ width: "100%" }}
        />
      ),
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

        {/* Rest of your UI remains mostly same — only major changes are in product handling and columns */}

        {/* ... (Keep your existing Customer, Quotation Details, Project Structure, Financial Summary, Signature sections) ... */}

        {/* Products Card */}
        <Card
          title="Products & Options"
          style={{ marginBottom: 24 }}
          extra={
            <Space>
              <Select
                showSearch
                prefix={<SearchOutlined />}
                placeholder="Add main product..."
                value={null}
                onSearch={debouncedSearch}
                onChange={addProduct}
                filterOption={false}
                style={{ width: 380 }}
                notFoundContent={
                  isSearching ? (
                    <Spin size="small" />
                  ) : searchTerm ? (
                    "No products found"
                  ) : (
                    "Search products"
                  )
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
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                        }}
                      >
                        <div>
                          <strong>{p.name}</strong>
                          <div style={{ fontSize: "0.9em", color: "#666" }}>
                            {p.product_code}
                          </div>
                        </div>
                        <div>₹{price.toFixed(2)}</div>
                      </div>
                    </Option>
                  );
                })}
              </Select>

              {mainProducts.length > 0 && (
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => setShowAddOptionModal(true)}
                >
                  Add Option
                </Button>
              )}
            </Space>
          }
        >
          <Table
            columns={columns}
            dataSource={formData.products}
            rowKey="productId"
            pagination={false}
            scroll={{ y: 500 }}
          />
        </Card>

        {/* Keep your existing Financial Summary, Signature, and Modals */}

        {/* Update the Floors and Rooms modals if needed — they are already quite compatible */}

        {/* Submit Buttons */}
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
              disabled={!formData.customerId || formData.products.length === 0}
            >
              {isEditMode ? "Update Quotation" : "Create Quotation"}
            </Button>
          </Space>
        </div>
      </div>
    </div>
  );
};

export default AddQuotation;
