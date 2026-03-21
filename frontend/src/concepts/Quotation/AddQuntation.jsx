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
  FileTextOutlined,
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
    extraDiscountType: "fixed",
    signature_name: "",
    signature_image: "",
    customerId: "",
    shipTo: "",
    createdBy: userId,
    products: [],
    followupDates: [],
    floors: [], // [{floorId, floorName, rooms: [{roomId, roomName, areas: [{id, name?, value}]}]}]
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
      discountType: p.discountType || "fixed",
      tax: safeNum(p.tax, 0),
      isOptionFor: p.isOptionFor || null,
      optionType: p.optionType || null,
      groupId: p.groupId || null,
      floorId: p.floorId || null,
      floorName: p.floorName || null,
      roomId: p.roomId || null,
      roomName: p.roomName || null,
      areaId: p.areaId || null,
      areaName: p.areaName || null,
      areaValue: p.areaValue || "",
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
      gst: 0,
      shippingAmount: safeNum(existingQuotation.shippingAmount, 0),
      extraDiscount: safeNum(existingQuotation.extraDiscount, 0),
      extraDiscountType: existingQuotation.extraDiscountType || "fixed",
      signature_name: existingQuotation.signature_name || "",
      signature_image: existingQuotation.signature_image || "",
      customerId: existingQuotation.customerId || "",
      shipTo: existingQuotation.shipTo || "",
      createdBy: userId,
      products: mappedProducts,
      floors: parsedFloors.map((floor) => ({
        ...floor,
        rooms: (floor.rooms || []).map((room) => ({
          ...room,
          areas: room.areas || [], // ensure array exists
        })),
      })),
      followupDates: safeJsonParse(existingQuotation.followupDates, [])
        .map((d) => (d ? new Date(d) : null))
        .filter(Boolean),
    });
  }, [isEditMode, existingQuotation, userId]);

  // ── Floor / Room / Area options for Cascader ──────────────────────
  const floorOptions = useMemo(() => {
    return (formData.floors || []).map((f) => ({
      value: f.floorId,
      label: f.floorName,
      children: (f.rooms || []).map((r) => ({
        value: r.roomId,
        label: r.roomName,
        children: (r.areas || []).map((a) => ({
          value: a.id,
          label: a.name
            ? `${a.name} (${a.value})`
            : a.value || "(unnamed area)",
        })),
      })),
    }));
  }, [formData.floors]);
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
  const updateFloorArea = (floorId, area) => {
    setFormData((prev) => ({
      ...prev,
      floors: prev.floors.map((f) =>
        f.floorId === floorId ? { ...f, area: area.trim() } : f,
      ),
    }));
  };
  const addRoom = (floorId, name) => {
    if (!name.trim()) return message.error("Room name is required");
    setFormData((prev) => {
      const updatedFloors = prev.floors.map((f) =>
        f.floorId === floorId
          ? {
              ...f,
              rooms: [
                ...(f.rooms || []),
                {
                  roomId: generateRoomId(f.floorId),
                  roomName: name.trim(),
                  areas: [],
                },
              ],
            }
          : f,
      );
      return { ...prev, floors: updatedFloors };
    });
    message.success("Room added");
  };

  const addAreaToRoom = (floorId, roomId, areaName = "", areaValue = "") => {
    setFormData((prev) => {
      const updatedFloors = prev.floors.map((f) =>
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
      );
      return { ...prev, floors: updatedFloors };
    });
    message.success("Area added");
  };

  const updateArea = (floorId, roomId, areaId, field, value) => {
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
                      areas: (r.areas || []).map((a) =>
                        a.id === areaId ? { ...a, [field]: value.trim() } : a,
                      ),
                    }
                  : r,
              ),
            }
          : f,
      ),
    }));
  };

  const removeArea = (floorId, roomId, areaId) => {
    setFormData((prev) => {
      // Also clear area from any products using this areaId
      const updatedProducts = prev.products.map((p) =>
        p.areaId === areaId
          ? { ...p, areaId: null, areaName: null, areaValue: null }
          : p,
      );

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

  const openRoomsForFloor = (floorId) => {
    setSelectedFloorForRooms(floorId);
    setShowRoomsModal(true);
  };

  const assignFloorRoomArea = (productId, selectedPath) => {
    if (!selectedPath || selectedPath.length < 2) {
      setFormData((prev) => ({
        ...prev,
        products: prev.products.map((p) =>
          p.productId === productId
            ? {
                ...p,
                floorId: null,
                floorName: null,
                roomId: null,
                roomName: null,
                areaId: null,
                areaName: null,
                areaValue: null,
              }
            : p,
        ),
      }));
      return;
    }

    const [floorId, roomId, areaId] = selectedPath;
    const floor = formData.floors.find((f) => f.floorId === floorId);
    const room = floor?.rooms?.find((r) => r.roomId === roomId);
    const area = room?.areas?.find((a) => a.id === areaId);

    setFormData((prev) => ({
      ...prev,
      products: prev.products.map((p) =>
        p.productId === productId
          ? {
              ...p,
              floorId,
              floorName: floor?.floorName || null,
              roomId,
              roomName: room?.roomName || null,
              areaId: area?.id || null,
              areaName: area?.name || null,
              areaValue: area?.value || null,
            }
          : p,
      ),
    }));
  };

  // ── Memoized data & calculations (unchanged except products reference) ──
  const { mainProducts, groupedItems } = useMemo(() => {
    const main = [];
    const groups = {};

    formData.products.forEach((p) => {
      const gid = p.groupId || "ungrouped";
      if (!groups[gid]) groups[gid] = { main: null, options: [] };
      if (!p.isOptionFor) {
        main.push(p);
        groups[gid].main = p;
      } else {
        groups[gid].options.push(p);
      }
    });

    return {
      mainProducts: main,
      groupedItems: Object.values(groups),
    };
  }, [formData.products]);

  // ── Calculations (GST always 0) ───────────────────────────────────
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

    let optionalPotential = 0;
    formData.products.forEach((p) => {
      if (p.isOptionFor) {
        optionalPotential += safeNum(p.sellingPrice, 0) * safeNum(p.qty, 1);
      }
    });

    const extraDiscValue = safeNum(formData.extraDiscount, 0);
    const extraDiscAmt =
      formData.extraDiscountType === "percent"
        ? (mainSubtotal * extraDiscValue) / 100
        : extraDiscValue;

    const afterExtra = mainSubtotal - extraDiscAmt;
    const gstRate = 0; // Always 0
    const gstAmt = 0; // No GST
    const shipping = safeNum(formData.shippingAmount, 0);
    const totalBeforeRound = afterExtra + gstAmt + shipping;

    const rounded = Math.round(totalBeforeRound);
    const roundOff = rounded - totalBeforeRound;

    return {
      mainSubtotal: Number(mainSubtotal.toFixed(2)),
      mainLineDiscount: Number(mainLineDiscount.toFixed(2)),
      extraDiscAmt: Number(extraDiscAmt.toFixed(2)),
      gstAmt: 0,
      shipping,
      roundOff: Number(roundOff.toFixed(2)),
      finalAmount: Number(rounded.toFixed(0)),
      optionalPotential: Number(optionalPotential.toFixed(2)),
    };
  }, [
    mainProducts,
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
          discountType: "fixed",
          tax: 0,
          isOptionFor: null,
          optionType: null,
          groupId: newGroupId,
          floorId: null,
          floorName: null,
          roomId: null,
          roomName: null,
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
          discountType: "fixed",
          tax: 0,
          isOptionFor: selectedParentId,
          optionType,
          groupId: parent.groupId,
          floorId: parent.floorId,
          floorName: parent.floorName,
          roomId: parent.roomId,
          roomName: parent.roomName,
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

  // ── Product Handlers ──────────────────────────────────────────────
  const updateProductField = (productId, field, value) => {
    setFormData((prev) => ({
      ...prev,
      products: prev.products.map((p) =>
        p.productId === productId ? { ...p, [field]: value } : p,
      ),
    }));
  };

  // ── Follow-up dates handlers ──────────────────────────────────────
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
  // ── Submit handler ────────────────────────────────────────────────
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
      discountType: p.discountType || "fixed",
      tax: 0,
      total: Number(
        (
          safeNum(p.sellingPrice, 0) * safeNum(p.qty, 1) -
          (p.discountType === "percent"
            ? (safeNum(p.sellingPrice, 0) *
                safeNum(p.qty, 1) *
                safeNum(p.discount, 0)) /
              100
            : safeNum(p.discount, 0) * safeNum(p.qty, 1))
        ).toFixed(2),
      ),
      isOptionFor: p.isOptionFor || null,
      optionType: p.optionType || null,
      groupId: p.groupId || null,
      floorId: p.floorId || null,
      floorName: p.floorName || null,
      roomId: p.roomId || null,
      roomName: p.roomName || null,
      areaId: p.areaId || null,
      areaName: p.areaName || null,
      areaValue: p.areaValue || null,
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
      extraDiscountType: formData.extraDiscountType || "fixed",
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
        message.success("Quotation updated");
      } else {
        await createQuotation(payload).unwrap();
        message.success("Quotation created");
        setFormData(initialFormData);
      }
      navigate("/quotations/list");
    } catch (err) {
      message.error(err?.data?.message || "Failed to save");
    }
  };

  // ── Table Columns ─────────────────────────────────────────────────
  const columns = [
    {
      title: "Floor / Room",
      width: 220,
      render: (_, record) => {
        if (!record.floorId && !record.roomId)
          return <Text type="secondary">Unassigned</Text>;

        return (
          <div>
            {record.floorName && (
              <div>
                <HomeOutlined /> {record.floorName}
              </div>
            )}
            {record.roomName && (
              <div style={{ marginLeft: 16, color: "#555" }}>
                <ApartmentOutlined /> {record.roomName}
              </div>
            )}
          </div>
        );
      },
    },
    {
      title: "Type",
      width: 110,
      render: (_, record) => {
        if (!record.isOptionFor) return <Tag color="blue">Main</Tag>;

        const colors = {
          variant: "purple",
          upgrade: "geekblue",
          addon: "green",
        };

        return (
          <Tag color={colors[record.optionType] || "default"}>
            {record.optionType || "Option"}
          </Tag>
        );
      },
    },
    {
      title: "Product / Option",
      dataIndex: "name",
      key: "name",
      render: (text, record) => {
        const indent = record.isOptionFor ? 32 : 0;
        return (
          <div style={{ paddingLeft: indent }}>
            {record.isOptionFor && (
              <Text type="secondary" style={{ marginRight: 8 }}>
                ↳
              </Text>
            )}
            {text}
          </div>
        );
      },
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
      title: "Disc",
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
            value={r.discountType || "fixed"}
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
      title: "Tax %",
      width: 90,
      render: (_, r) => "0", // Always show 0
    },
    {
      title: "Line Total",
      render: (_, r) => {
        const qty = safeNum(r.qty, 1);
        const price = safeNum(r.sellingPrice, 0);
        const disc = safeNum(r.discount, 0);
        const discType = r.discountType || "fixed";

        const discAmt =
          discType === "percent" ? (price * qty * disc) / 100 : disc * qty;
        const lineTotal = price * qty - discAmt; // No tax

        return lineTotal.toFixed(2);
      },
    },
    {
      title: "Location",
      width: 180,
      render: (_, record) => (
        <Cascader
          options={floorOptions}
          value={
            record.floorId && record.roomId && record.areaId
              ? [record.floorId, record.roomId, record.areaId]
              : record.floorId && record.roomId
                ? [record.floorId, record.roomId]
                : record.floorId
                  ? [record.floorId]
                  : undefined
          }
          onChange={(val) => assignFloorRoomArea(record.productId, val)}
          placeholder="Floor / Room / Area"
          allowClear
          expandTrigger="hover"
          style={{ width: "100%" }}
        />
      ),
    },
    {
      title: "Area / Section",
      width: 160,
      render: (_, record) => {
        if (!record.roomId) return <Text type="secondary">—</Text>;

        const room = formData.floors
          .find((f) => f.floorId === record.floorId)
          ?.rooms?.find((r) => r.roomId === record.roomId);

        if (!room?.areas?.length) {
          return <Text type="secondary">No areas defined</Text>;
        }

        return (
          <Select
            value={record.areaId}
            onChange={(areaId) => {
              const area = room.areas.find((a) => a.id === areaId);
              updateProductField(record.productId, {
                areaId,
                areaName: area?.name || null,
                areaValue: area?.value || null,
              });
            }}
            placeholder="Select area"
            style={{ width: "100%" }}
            allowClear
            onClear={() =>
              updateProductField(record.productId, {
                areaId: null,
                areaName: null,
                areaValue: null,
              })
            }
          >
            {room.areas.map((ar) => (
              <Option key={ar.id} value={ar.id}>
                {ar.name ? `${ar.name} (${ar.value})` : ar.value || "(unnamed)"}
              </Option>
            ))}
          </Select>
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
  // ── Render ────────────────────────────────────────────────────────
  return (
    <div className="page-wrapper">
      <div className="content">
        <PageHeader
          exportOptions={{ pdf: false, excel: false }}
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
            title="Project Structure (Floors & Rooms)"
            style={{ marginBottom: 24 }}
            extra={
              <Space>
                <Button
                  type="primary"
                  icon={<HomeOutlined />}
                  onClick={() => setShowFloorsModal(true)}
                >
                  Manage Floors
                </Button>
                {formData.floors.length > 0 && (
                  <Button
                    icon={<ApartmentOutlined />}
                    onClick={() => setShowRoomsModal(true)}
                  >
                    Manage Rooms & Areas
                  </Button>
                )}
              </Space>
            }
          >
            {formData.floors.length === 0 ? (
              <Text type="secondary">
                No floors/rooms defined yet. Add them to organize products by
                location.
              </Text>
            ) : (
              <ul style={{ paddingLeft: 20 }}>
                {formData.floors.map((floor) => (
                  <li key={floor.floorId}>
                    <strong>{floor.floorName}</strong>
                    {floor.rooms?.length > 0 && (
                      <ul style={{ paddingLeft: 30, marginTop: 4 }}>
                        {floor.rooms.map((room) => (
                          <li key={room.roomId}>{room.roomName}</li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Card>
          {/* Products & Options */}
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
                  notFoundContent={
                    isSearching ? (
                      <Spin size="small" />
                    ) : searchTerm ? (
                      "No products found"
                    ) : (
                      "Search products"
                    )
                  }
                  style={{ width: 380 }}
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
                              {p.product_code || "—"}
                            </div>
                          </div>
                          <div style={{ color: "#52c41a" }}>
                            ₹{price.toFixed(2)}
                          </div>
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
              rowKey={(record) => record.productId}
              pagination={false}
              scroll={{ y: 400 }}
              locale={{ emptyText: "No products added yet" }}
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
        {/* Floors Modal (unchanged – no area per floor for simplicity) */}
        <Modal
          title="Manage Floors"
          open={showFloorsModal}
          onCancel={() => setShowFloorsModal(false)}
          footer={null}
          width={700}
        >
          <Divider orientation="left">Add New Floor</Divider>
          <Space.Compact style={{ width: "100%", marginBottom: 24 }}>
            <Input
              placeholder="Floor name (Ground Floor, First Floor...)"
              onPressEnter={(e) => {
                addFloor(e.target.value);
                e.target.value = "";
              }}
              style={{ flex: 1 }}
            />
            <Button
              type="primary"
              onClick={() => {
                const input = document.querySelector(".ant-input");
                if (input?.value?.trim()) {
                  addFloor(input.value.trim());
                  input.value = "";
                }
              }}
            >
              Add Floor
            </Button>
          </Space.Compact>

          <Divider orientation="left">Existing Floors</Divider>
          {formData.floors.length === 0 ? (
            <Text type="secondary">No floors added yet.</Text>
          ) : (
            <div>
              {formData.floors.map((floor) => (
                <Card
                  key={floor.floorId}
                  size="small"
                  style={{ marginBottom: 12 }}
                  bodyStyle={{ padding: "12px 16px" }}
                >
                  <Space
                    align="center"
                    style={{ width: "100%", justifyContent: "space-between" }}
                  >
                    <strong>{floor.floorName}</strong>
                    <Space>
                      <Input
                        placeholder="Area (e.g. 2200 sq.ft)"
                        value={floor.area || ""}
                        onChange={(e) =>
                          updateFloorArea(floor.floorId, e.target.value)
                        }
                        style={{ width: 180 }}
                        addonAfter="sq.ft"
                        allowClear
                      />
                      <Button
                        type="link"
                        onClick={() => openRoomsForFloor(floor.floorId)}
                      >
                        Rooms ({floor.rooms?.length || 0})
                      </Button>
                    </Space>
                  </Space>
                </Card>
              ))}
            </div>
          )}
        </Modal>
        {/* Rooms & Areas Modal */}
        <Modal
          title={
            selectedFloorForRooms
              ? `Manage Rooms & Areas - ${
                  formData.floors.find(
                    (f) => f.floorId === selectedFloorForRooms,
                  )?.floorName || "Floor"
                }`
              : "Manage Rooms & Areas"
          }
          open={showRoomsModal}
          onCancel={() => {
            setShowRoomsModal(false);
            setSelectedFloorForRooms(null);
          }}
          footer={null}
          width={800}
        >
          {selectedFloorForRooms ? (
            <>
              <Divider orientation="left">Add New Room</Divider>
              <Space.Compact style={{ width: "100%", marginBottom: 24 }}>
                <Input
                  placeholder="Room name (e.g. Living Room, Master Bedroom)"
                  onPressEnter={(e) => {
                    addRoom(selectedFloorForRooms, e.target.value);
                    e.target.value = "";
                  }}
                  style={{ flex: 1 }}
                />
                <Button
                  type="primary"
                  onClick={() => {
                    const input = document.querySelector(".ant-input");
                    if (input?.value?.trim()) {
                      addRoom(selectedFloorForRooms, input.value.trim());
                      input.value = "";
                    }
                  }}
                >
                  Add Room
                </Button>
              </Space.Compact>

              <Divider orientation="left">Rooms & Their Areas</Divider>
              {(() => {
                const currentFloor = formData.floors.find(
                  (f) => f.floorId === selectedFloorForRooms,
                );
                if (!currentFloor?.rooms?.length) {
                  return <Text type="secondary">No rooms added yet.</Text>;
                }

                return currentFloor.rooms.map((room) => (
                  <Card
                    key={room.roomId}
                    title={room.roomName}
                    size="small"
                    style={{ marginBottom: 16 }}
                    extra={
                      <Button
                        type="dashed"
                        size="small"
                        icon={<PlusOutlined />}
                        onClick={() =>
                          addAreaToRoom(currentFloor.floorId, room.roomId)
                        }
                      >
                        Add Area/Section
                      </Button>
                    }
                  >
                    {room.areas?.length === 0 ? (
                      <Text type="secondary" style={{ fontSize: "0.9em" }}>
                        No areas/sections defined yet
                      </Text>
                    ) : (
                      room.areas.map((area) => (
                        <Card
                          key={area.id}
                          size="small"
                          style={{ marginBottom: 8, background: "#fafafa" }}
                        >
                          <Space
                            style={{
                              width: "100%",
                              justifyContent: "space-between",
                            }}
                          >
                            <Input
                              placeholder="Area name (Main floor, Skirting, Ceiling...)"
                              value={area.name || ""}
                              onChange={(e) =>
                                updateArea(
                                  currentFloor.floorId,
                                  room.roomId,
                                  area.id,
                                  "name",
                                  e.target.value,
                                )
                              }
                              style={{ width: 220 }}
                            />
                            <Input
                              placeholder="Measurement (e.g. 245 sq.ft)"
                              value={area.value || ""}
                              onChange={(e) =>
                                updateArea(
                                  currentFloor.floorId,
                                  room.roomId,
                                  area.id,
                                  "value",
                                  e.target.value,
                                )
                              }
                              style={{ width: 180 }}
                              addonAfter="sq.ft"
                            />
                            <Button
                              danger
                              size="small"
                              icon={<DeleteOutlined />}
                              onClick={() =>
                                removeArea(
                                  currentFloor.floorId,
                                  room.roomId,
                                  area.id,
                                )
                              }
                            />
                          </Space>
                        </Card>
                      ))
                    )}
                  </Card>
                ));
              })()}
            </>
          ) : (
            <Select
              placeholder="Select a floor to manage rooms & areas"
              style={{ width: "100%" }}
              onChange={(v) => setSelectedFloorForRooms(v)}
            >
              {formData.floors.map((f) => (
                <Option key={f.floorId} value={f.floorId}>
                  {f.floorName}
                </Option>
              ))}
            </Select>
          )}
        </Modal>
        {/* Address Modal */}
        {showAddressModal && (
          <AddAddress
            onClose={() => setShowAddressModal(false)}
            onSave={(addrId) => {
              setFormData((prev) => ({ ...prev, shipTo: addrId }));
              setShowAddressModal(false);
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
<<<<<<< HEAD:frontend/src/concepts/Quotation/AddQuntation.jsx

   
=======
>>>>>>> 4419bbe (added area feature also):frontend/src/components/Quotation/AddQuntation.jsx
    </div>
  );
};

export default AddQuotation;
