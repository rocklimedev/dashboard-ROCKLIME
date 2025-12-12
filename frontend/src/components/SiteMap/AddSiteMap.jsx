// src/components/SiteMap/AddSiteMap.jsx

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  Spin,
  message,
  Input,
  Select,
  Table,
  InputNumber,
  Space,
  Button,
  Card,
  Row,
  Col,
  Collapse,
  Tag,
  Divider,
  Statistic,
  Typography,
  Modal,
  Form,
  Tabs,
  Badge,
  Alert,
} from "antd";
import {
  ArrowLeftOutlined,
  PlusOutlined,
  DeleteOutlined,
  SaveOutlined,
  FileTextOutlined,
  HomeOutlined,
  EditOutlined,
  EyeInvisibleOutlined,
  ToolOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import { debounce } from "lodash";
import { v4 as uuidv4 } from "uuid";

import PageHeader from "../Common/PageHeader";
import {
  useCreateSiteMapMutation,
  useGetSiteMapByIdQuery,
  useUpdateSiteMapMutation,
} from "../../api/siteMapApi";
import { useGetAllProductsQuery } from "../../api/productApi";
import { useGetCustomersQuery } from "../../api/customerApi";

const { Panel } = Collapse;
const { Text } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;

const CONCEALED_CATEGORIES = [
  "conduit-pipe",
  "wiring-cable",
  "junction-box",
  "distribution-board",
  "mcb-dp",
  "modular-box",
  "earthing",
  "network-cabling",
];

const AddSiteMap = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const isEditMode = Boolean(id);
  const fromQuotation = location.state?.fromQuotation === true;

  const [selectedConcealedProduct, setSelectedConcealedProduct] =
    useState(null);
  const [selectedFloor, setSelectedFloor] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState(null);

  // API
  const { data: customersData, isLoading: isCustomersLoading } =
    useGetCustomersQuery();
  const { data: productsData = [], isLoading: isProductsLoading } =
    useGetAllProductsQuery();
  const { data: existingSiteMapData, isLoading: isFetching } =
    useGetSiteMapByIdQuery(id, { skip: !isEditMode });

  const [createSiteMap, { isLoading: isCreating }] = useCreateSiteMapMutation();
  const [updateSiteMap, { isLoading: isUpdating }] = useUpdateSiteMapMutation();

  const customers = customersData?.data || [];
  const validProducts = productsData.filter(
    (p) => p && (p.name || p.product_code)
  );

  const [formData, setFormData] = useState({
    customerId: "",
    name: "",
    siteSizeInBHK: "",
    totalFloors: 1,
    floorDetails: [],
    items: [],
    quotationId: null,
  });

  const [productSearch, setProductSearch] = useState("");
  const [concealedSearch, setConcealedSearch] = useState("");
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [filteredConcealed, setFilteredConcealed] = useState([]);
  const [assignModal, setAssignModal] = useState({
    visible: false,
    itemIndex: null, // index in formData.items
  });
  const [roomModal, setRoomModal] = useState({
    visible: false,
    floor: null,
    room: null,
  });
  const [roomForm] = Form.useForm();

  // === Detect Concealed vs Normal Products ===
  const { normalProducts, concealedProducts } = useMemo(() => {
    const normal = [];
    const concealed = [];

    validProducts.forEach((p) => {
      const category = (p.category?.name || "").toLowerCase();
      const name = (p.name || "").toLowerCase();
      const code = (p.product_code || "").toLowerCase();

      const isConcealedItem =
        CONCEALED_CATEGORIES.some(
          (cat) =>
            category.includes(cat) || name.includes(cat) || code.includes(cat)
        ) ||
        name.includes("conduit") ||
        name.includes("concealed") ||
        name.includes("wiring") ||
        name.includes("cable") ||
        name.includes("junction") ||
        name.includes("mcb") ||
        name.includes("db");

      if (isConcealedItem) {
        concealed.push({ ...p, isConcealed: true });
      } else {
        normal.push({ ...p, isConcealed: false });
      }
    });

    return { normalProducts: normal, concealedProducts: concealed };
  }, [validProducts]);

  // === Load Data from Quotation or Edit Mode ===
  useEffect(() => {
    if (fromQuotation && location.state) {
      const {
        customerId,
        projectName,
        items = [],
        totalFloors = 1,
        quotationId,
      } = location.state;

      const mappedItems = items.map((it) => ({
        productId: it.productId,
        name: (it.name || "Unknown Product").trim(),
        imageUrl: it.imageUrl || null,
        quantity: Number(it.quantity) || 1,
        price: Number(it.price) || 0,
        discount: it.discount || 0,
        discountType: it.discountType || "percent",
        total: it.total || it.price,
        floor_number: null, // ← Crucial: unassigned
        room_id: null,
        productType: it.category?.name || "Quotation Item",
        isConcealed: false, // will be recalculated in useMemo
      }));

      setFormData((prev) => ({
        ...prev,
        customerId: customerId || "",
        name:
          projectName || `Site Map - ${new Date().toLocaleDateString("en-IN")}`,
        siteSizeInBHK: "",
        totalFloors: items.length > 0 ? totalFloors : 1,
        items: mappedItems,
        quotationId,
      }));
    } else if (isEditMode && existingSiteMapData?.data) {
      setFormData(existingSiteMapData.data);
    }
  }, [fromQuotation, location.state, isEditMode, existingSiteMapData]);

  // Auto-create Ground Floor if none exist (only when from quotation and no floors)
  useEffect(() => {
    if (
      fromQuotation &&
      formData.floorDetails.length === 0 &&
      formData.totalFloors >= 1
    ) {
      setFormData((prev) => ({
        ...prev,
        floorDetails: [
          {
            floor_number: 1,
            floor_name: "Ground Floor",
            floor_size: "",
            details: "",
            rooms: [],
          },
        ],
      }));
    }
  }, [fromQuotation, formData.floorDetails.length]);

  // Auto-manage floors based on totalFloors
  useEffect(() => {
    if (!formData.totalFloors) return;

    let newFloors = [...formData.floorDetails];
    if (newFloors.length < formData.totalFloors) {
      for (let i = newFloors.length; i < formData.totalFloors; i++) {
        const floorNum = i + 1;
        const floorName =
          floorNum === 1
            ? "Ground Floor"
            : `${floorNum - 1}${
                ["th", "st", "nd", "rd"][(floorNum - 1) % 10] || "th"
              } Floor`;
        newFloors.push({
          floor_number: floorNum,
          floor_name: floorName,
          floor_size: "",
          details: "",
          rooms: [],
        });
      }
    } else if (newFloors.length > formData.totalFloors) {
      newFloors = newFloors.slice(0, formData.totalFloors);
    }

    setFormData((prev) => ({ ...prev, floorDetails: newFloors }));
  }, [formData.totalFloors]);
  // Helper to get best possible display name
  const getDisplayName = (p) => {
    if (p.name && typeof p.name === "string" && p.name.trim())
      return p.name.trim();
    if (
      p.product_code &&
      typeof p.product_code === "string" &&
      p.product_code.trim()
    )
      return p.product_code.trim();
    if (
      p.meta?.["d11da9f9-3f2e-4536-8236-9671200cca4a"] &&
      typeof p.meta["d11da9f9-3f2e-4536-8236-9671200cca4a"] === "string"
    )
      return p.meta["d11da9f9-3f2e-4536-8236-9671200cca4a"].trim();
    return "Unknown Product";
  };

  // Helper for searchable text
  // Helper for searchable text — completely safe
  const getSearchableText = (p) => {
    const parts = [
      p.name,
      p.product_code,
      p.meta?.["d11da9f9-3f2e-4536-8236-9671200cca4a"],
      p.description,
      p.category?.name,
    ]
      .filter(Boolean) // removes null, undefined, "", false
      .map((s) => {
        if (typeof s === "string") {
          return s.toLowerCase().trim();
        }
        return "";
      })
      .filter(Boolean); // remove empty strings after trim

    return parts.join(" ");
  };

  // Live filtered lists — no debounce, no flicker, instant
  const filteredVisibleProducts = useMemo(() => {
    if (!productSearch.trim()) return normalProducts.slice(0, 50); // show recent/popular

    const term = productSearch.toLowerCase().trim();
    return normalProducts
      .filter((p) => getSearchableText(p).includes(term))
      .slice(0, 50);
  }, [productSearch, normalProducts]);

  const filteredConcealedProducts = useMemo(() => {
    if (!concealedSearch.trim()) return concealedProducts.slice(0, 50);

    const term = concealedSearch.toLowerCase().trim();
    return concealedProducts
      .filter((p) => getSearchableText(p).includes(term))
      .slice(0, 50);
  }, [concealedSearch, concealedProducts]);

  const getProductId = (p) => p.productId || p.id;

  // === Add Product (Visible) ===
  const addProduct = (floorNumber, roomId, productId, isConcealed = false) => {
    const list = isConcealed ? concealedProducts : normalProducts;
    const prod = list.find((p) => getProductId(p) === productId);
    if (!prod) return message.error("Product not found");

    const price = Number(
      prod.meta?.["9ba862ef-f993-4873-95ef-1fef10036aa5"] || 0
    );

    const newItem = {
      productId: getProductId(prod),
      name: prod.name?.trim() || prod.product_code || "Unknown",
      imageUrl: prod.images?.[0]?.url || null,
      quantity: 1,
      price,
      floor_number: floorNumber,
      room_id: roomId || null,
      productType: prod.category?.name || "Others",
      isConcealed,
    };

    setFormData((prev) => ({
      ...prev,
      items: [...prev.items, newItem],
    }));

    if (!isConcealed) {
      setProductSearch("");
      setFilteredProducts([]);
    }
  };

  // === Add Concealed Item ===
  const addSelectedConcealedItem = () => {
    if (!selectedConcealedProduct || !selectedFloor) return;

    const prod = concealedProducts.find(
      (p) => getProductId(p) === selectedConcealedProduct
    );
    if (!prod) return;

    const price = Number(
      prod.meta?.["9ba862ef-f993-4873-95ef-1fef10036aa5"] || 0
    );

    const newItem = {
      productId: getProductId(prod),
      name: prod.name?.trim() || prod.product_code || "Unknown Concealed Item",
      imageUrl: prod.images?.[0]?.url || null,
      quantity: 1,
      price,
      floor_number: selectedFloor,
      room_id: selectedRoom || null,
      productType: prod.category?.name || "Concealed Works",
      isConcealed: true,
    };

    setFormData((prev) => ({
      ...prev,
      items: [...prev.items, newItem],
    }));

    setSelectedConcealedProduct(null);
    setSelectedFloor(null);
    setSelectedRoom(null);
    setConcealedSearch("");
    setFilteredConcealed([]);
  };

  const removeItem = (index) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const updateItemQty = (index, qty) => {
    if (qty < 1) return;
    setFormData((prev) => {
      const items = [...prev.items];
      items[index].quantity = qty;
      return { ...prev, items };
    });
  };

  // Room Modal Logic
  const openRoomModal = (floor, room = null) => {
    roomForm.resetFields();
    setRoomModal({ visible: true, floor, room });
    if (room) roomForm.setFieldsValue(room);
  };

  const saveRoom = () => {
    roomForm.validateFields().then((values) => {
      setFormData((prev) => {
        const updatedFloors = prev.floorDetails.map((f) => ({
          ...f,
          rooms: [...f.rooms],
        }));
        const floorIndex = updatedFloors.findIndex(
          (f) => f.floor_number === roomModal.floor.floor_number
        );

        if (roomModal.room) {
          const roomIndex = updatedFloors[floorIndex].rooms.findIndex(
            (r) => r.room_id === roomModal.room.room_id
          );
          updatedFloors[floorIndex].rooms[roomIndex] = {
            ...updatedFloors[floorIndex].rooms[roomIndex],
            ...values,
          };
        } else {
          updatedFloors[floorIndex].rooms.push({
            room_id: uuidv4(),
            room_name: values.room_name,
            room_type: values.room_type || "General",
            room_size: values.room_size || "",
            details: values.details || "",
          });
        }

        return { ...prev, floorDetails: updatedFloors };
      });

      setRoomModal({ visible: false });
      roomForm.resetFields();
    });
  };

  const deleteRoom = (floorNumber, roomId) => {
    setFormData((prev) => ({
      ...prev,
      floorDetails: prev.floorDetails.map((f) => ({
        ...f,
        rooms: f.rooms.filter((r) => r.room_id !== roomId),
      })),
      items: prev.items.filter(
        (i) => !(i.floor_number === floorNumber && i.room_id === roomId)
      ),
    }));
  };

  const handleSubmit = async () => {
    if (!formData.customerId) return message.error("Select a customer");
    if (!formData.name.trim()) return message.error("Enter project name");

    try {
      const payload = {
        ...formData,
        items: formData.items.map((i) => ({
          ...i,
          quantity: Number(i.quantity) || 1,
          price: Number(i.price) || 0,
        })),
      };

      if (isEditMode) {
        await updateSiteMap({ id, updatedSiteMap: payload }).unwrap();
        message.success("Site Map updated successfully!");
      } else {
        await createSiteMap(payload).unwrap();
        message.success("Site Map created successfully!");
      }
      navigate("/site-map/list");
    } catch (err) {
      message.error(err?.data?.message || "Failed to save site map");
    }
  };

  // === Group Items by Location ===
  const itemsByLocation = useMemo(() => {
    const map = {};
    formData.items.forEach((item) => {
      const floorKey = item.floor_number || "unassigned";
      const roomKey = item.room_id || "floor-level";
      if (!map[floorKey]) map[floorKey] = {};
      if (!map[floorKey][roomKey]) map[floorKey][roomKey] = [];
      map[floorKey][roomKey].push(item);
    });
    return map;
  }, [formData.items]);

  // === Totals ===
  const { visibleTotal, concealedTotal, grandTotal } = useMemo(() => {
    let visible = 0,
      concealed = 0;
    formData.items.forEach((i) => {
      const amt = i.quantity * i.price;
      if (i.isConcealed) concealed += amt;
      else visible += amt;
    });
    return {
      visibleTotal: visible,
      concealedTotal: concealed,
      grandTotal: visible + concealed,
    };
  }, [formData.items]);

  const hasUnassignedItems = formData.items.some((i) => !i.floor_number);

  if (isFetching || isCustomersLoading || isProductsLoading) {
    return (
      <Spin tip="Loading..." style={{ display: "block", marginTop: 100 }} />
    );
  }

  return (
    <div className="page-wrapper">
      <div className="content">
        <PageHeader
          title={isEditMode ? "Edit Site Map" : "Create Site Map"}
          subtitle="Plan electrical layout by assigning products to floors and rooms"
        />

        <Space style={{ marginBottom: 16 }}>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
            Back
          </Button>
          <Button
            type="primary"
            size="large"
            icon={<SaveOutlined />}
            onClick={handleSubmit}
            loading={isCreating || isUpdating}
          >
            {isEditMode ? "Update" : "Save"} Site Map
          </Button>
        </Space>

        {/* Warning if items are unassigned */}
        {hasUnassignedItems && (
          <Alert
            message="Unassigned Items Detected"
            description="Some products are not yet assigned to any floor/room. Please assign them for accurate planning. They will still be saved."
            type="warning"
            showIcon
            icon={<WarningOutlined />}
            style={{ marginBottom: 20 }}
          />
        )}

        {/* Project Info */}
        <Card title="Project Information" style={{ marginBottom: 20 }}>
          <Row gutter={16}>
            <Col span={12}>
              <strong>Customer *</strong>
              <Select
                showSearch
                style={{ width: "100%", marginTop: 8 }}
                placeholder="Select customer"
                value={formData.customerId}
                onChange={(v) =>
                  setFormData((prev) => ({ ...prev, customerId: v }))
                }
              >
                {customers.map((c) => (
                  <Option key={c.customerId} value={c.customerId}>
                    {c.name}
                  </Option>
                ))}
              </Select>
            </Col>
            <Col span={12}>
              <strong>Project Name *</strong>
              <Input
                style={{ marginTop: 8 }}
                placeholder="e.g., Jethalal Gada 3BHK Residence"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
              />
            </Col>
          </Row>
          <Row gutter={16} style={{ marginTop: 16 }}>
            <Col span={8}>
              <strong>Size</strong>
              <Input
                style={{ marginTop: 8 }}
                value={formData.siteSizeInBHK}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    siteSizeInBHK: e.target.value,
                  }))
                }
              />
            </Col>
            <Col span={8}>
              <strong>Total Floors</strong>
              <InputNumber
                min={1}
                max={50}
                style={{ width: "100%", marginTop: 8 }}
                value={formData.totalFloors}
                onChange={(v) =>
                  setFormData((prev) => ({ ...prev, totalFloors: v }))
                }
              />
            </Col>
          </Row>
        </Card>

        <Tabs defaultActiveKey="visible" size="large">
          {/* ==================== VISIBLE PRODUCTS TAB ==================== */}
          <TabPane
            tab={
              <span>
                <HomeOutlined /> Visible Products
                <Badge
                  count={formData.items.filter((i) => !i.isConcealed).length}
                  style={{ marginLeft: 8, backgroundColor: "#52c41a" }}
                />
              </span>
            }
            key="visible"
          >
            {formData.items.some((i) => !i.isConcealed && !i.floor_number) && (
              <Card
                title={
                  <>
                    <WarningOutlined /> Unassigned Visible Products (From
                    Quotation)
                  </>
                }
                style={{
                  marginBottom: 24,
                  border: "2px dashed #1890ff",
                  backgroundColor: "#f0f8ff",
                }}
                extra={
                  <Tag color="blue">
                    {
                      formData.items.filter(
                        (i) => !i.isConcealed && !i.floor_number
                      ).length
                    }{" "}
                    items
                  </Tag>
                }
              >
                <Table
                  size="small"
                  pagination={false}
                  dataSource={formData.items.filter(
                    (i) => !i.isConcealed && !i.floor_number
                  )}
                  columns={[
                    { title: "Product", dataIndex: "name", width: "35%" },
                    {
                      title: "Qty",
                      width: 100,
                      render: (_, r) => (
                        <InputNumber
                          min={1}
                          value={r.quantity}
                          onChange={(v) =>
                            updateItemQty(formData.items.indexOf(r), v)
                          }
                        />
                      ),
                    },
                    {
                      title: "Price",
                      render: (_, r) => `₹${r.price.toLocaleString("en-IN")}`,
                    },
                    {
                      title: "Total",
                      render: (_, r) =>
                        `₹${(r.quantity * r.price).toLocaleString("en-IN")}`,
                    },
                    {
                      title: "Action",
                      width: 120,
                      render: (_, record) => (
                        <Button
                          type="primary"
                          size="small"
                          icon={<HomeOutlined />}
                          onClick={() => {
                            setAssignModal({
                              visible: true,
                              itemIndex: formData.items.indexOf(record),
                            });
                          }}
                        >
                          Assign
                        </Button>
                      ),
                    },
                    {
                      title: "",
                      render: (_, r) => (
                        <Button
                          danger
                          size="small"
                          icon={<DeleteOutlined />}
                          onClick={() => removeItem(formData.items.indexOf(r))}
                        />
                      ),
                    },
                  ]}
                />
                <div style={{ marginTop: 12, textAlign: "right" }}>
                  <Tag color="blue" size="large">
                    Total: ₹
                    {formData.items
                      .filter((i) => !i.isConcealed && !i.floor_number)
                      .reduce((s, i) => s + i.quantity * i.price, 0)
                      .toLocaleString("en-IN")}
                  </Tag>
                </div>
              </Card>
            )}

            <Collapse accordion>
              {formData.floorDetails.map((floor) => {
                const floorItems = itemsByLocation[floor.floor_number] || {};
                const visibleItems = Object.values(floorItems)
                  .flat()
                  .filter((i) => !i.isConcealed);
                const floorTotal = visibleItems.reduce(
                  (s, i) => s + i.quantity * i.price,
                  0
                );

                return (
                  <Panel
                    key={floor.floor_number}
                    header={
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          width: "100%",
                        }}
                      >
                        <span>
                          <HomeOutlined /> {floor.floor_name} (
                          {visibleItems.length} items)
                        </span>
                        <Tag color="green">
                          ₹{floorTotal.toLocaleString("en-IN")}
                        </Tag>
                      </div>
                    }
                  >
                    <Space
                      direction="vertical"
                      style={{ width: "100%", size: "large" }}
                    >
                      <Button
                        type="dashed"
                        block
                        icon={<PlusOutlined />}
                        onClick={() => openRoomModal(floor)}
                      >
                        Add Room
                      </Button>

                      {floor.rooms.length === 0 ? (
                        <Card size="small">
                          <Text type="secondary">
                            Add rooms to assign visible products
                          </Text>
                        </Card>
                      ) : (
                        floor.rooms.map((room) => {
                          const roomItems = (
                            floorItems[room.room_id] || []
                          ).filter((i) => !i.isConcealed);
                          const roomTotal = roomItems.reduce(
                            (s, i) => s + i.quantity * i.price,
                            0
                          );

                          return (
                            <Card
                              key={room.room_id}
                              size="small"
                              title={
                                <span>
                                  {room.room_name}{" "}
                                  {room.room_type && (
                                    <Tag color="blue">{room.room_type}</Tag>
                                  )}
                                </span>
                              }
                              extra={
                                <Space>
                                  <Button
                                    size="small"
                                    icon={<EditOutlined />}
                                    onClick={() => openRoomModal(floor, room)}
                                  />
                                  <Button
                                    danger
                                    size="small"
                                    icon={<DeleteOutlined />}
                                    onClick={() =>
                                      deleteRoom(
                                        floor.floor_number,
                                        room.room_id
                                      )
                                    }
                                  />
                                </Space>
                              }
                            >
                              <Select
                                showSearch
                                placeholder="Search & add visible product..."
                                onSearch={setProductSearch} // ← Direct, instant
                                onChange={(pid) => {
                                  addProduct(
                                    floor.floor_number,
                                    room.room_id,
                                    pid,
                                    false
                                  );
                                  setProductSearch(""); // ← Clear after select
                                }}
                                value={null}
                                filterOption={false} // ← We handle filtering
                                notFoundContent={
                                  productSearch
                                    ? "No products found"
                                    : "Start typing to search..."
                                }
                                style={{ width: "100%", marginBottom: 16 }}
                              >
                                {filteredVisibleProducts.map((p) => (
                                  <Option
                                    key={getProductId(p)}
                                    value={getProductId(p)}
                                  >
                                    <div
                                      style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                      }}
                                    >
                                      <div>
                                        <div>
                                          <strong>{getDisplayName(p)}</strong>
                                        </div>
                                        {(p.product_code ||
                                          p.meta?.[
                                            "d11da9f9-3f2e-4536-8236-9671200cca4a"
                                          ]) && (
                                          <div
                                            style={{
                                              fontSize: 11,
                                              color: "#888",
                                            }}
                                          >
                                            {p.product_code ||
                                              p.meta[
                                                "d11da9f9-3f2e-4536-8236-9671200cca4a"
                                              ]}
                                          </div>
                                        )}
                                      </div>
                                      <span
                                        style={{
                                          color: "#52c41a",
                                          fontWeight: "bold",
                                        }}
                                      >
                                        ₹
                                        {Number(
                                          p.meta?.[
                                            "9ba862ef-f993-4873-95ef-1fef10036aa5"
                                          ] || 0
                                        ).toLocaleString("en-IN")}
                                      </span>
                                    </div>
                                  </Option>
                                ))}
                              </Select>
                              <Table
                                size="small"
                                pagination={false}
                                dataSource={roomItems}
                                columns={[
                                  { title: "Product", dataIndex: "name" },
                                  {
                                    title: "Qty",
                                    render: (_, r, idx) => (
                                      <InputNumber
                                        min={1}
                                        value={r.quantity}
                                        onChange={(v) =>
                                          updateItemQty(
                                            formData.items.indexOf(r),
                                            v
                                          )
                                        }
                                      />
                                    ),
                                  },
                                  {
                                    title: "Price",
                                    render: (_, r) => `₹${r.price.toFixed(0)}`,
                                  },
                                  {
                                    title: "Total",
                                    render: (_, r) =>
                                      `₹${(r.quantity * r.price).toFixed(0)}`,
                                  },
                                  {
                                    title: "",
                                    render: (_, r) => (
                                      <Button
                                        danger
                                        size="small"
                                        icon={<DeleteOutlined />}
                                        onClick={() =>
                                          removeItem(formData.items.indexOf(r))
                                        }
                                      />
                                    ),
                                  },
                                ]}
                              />
                              <div style={{ textAlign: "right", marginTop: 8 }}>
                                <Tag color="green">
                                  Room Total: ₹
                                  {roomTotal.toLocaleString("en-IN")}
                                </Tag>
                              </div>
                            </Card>
                          );
                        })
                      )}
                    </Space>
                  </Panel>
                );
              })}
            </Collapse>
          </TabPane>

          {/* ==================== CONCEALED WORKS TAB ==================== */}
          <TabPane
            tab={
              <span>
                <EyeInvisibleOutlined /> Concealed Works
                <Badge
                  count={formData.items.filter((i) => i.isConcealed).length}
                  style={{ marginLeft: 8, backgroundColor: "#ff4d4f" }}
                />
              </span>
            }
            key="concealed"
          >
            {/* Add Concealed Item */}
            <Card
              title={
                <>
                  <ToolOutlined /> Add Concealed Item
                </>
              }
              style={{ marginBottom: 24 }}
            >
              <Space
                direction="vertical"
                style={{ width: "100%" }}
                size="middle"
              >
                <Select
                  showSearch
                  placeholder="Search concealed products..."
                  onSearch={setConcealedSearch}
                  onChange={setSelectedConcealedProduct}
                  value={selectedConcealedProduct || undefined}
                  filterOption={false}
                  notFoundContent={
                    concealedSearch
                      ? "No concealed items found"
                      : "Type to search concealed works..."
                  }
                  style={{ width: "100%" }}
                >
                  {filteredConcealedProducts.map((p) => (
                    <Option key={getProductId(p)} value={getProductId(p)}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <div>
                          <div>
                            <strong>{getDisplayName(p)}</strong>
                          </div>
                          <div style={{ fontSize: 11, color: "#888" }}>
                            {p.product_code ||
                              p.meta?.[
                                "d11da9f9-3f2e-4536-8236-9671200cca4a"
                              ] ||
                              "Concealed Item"}
                          </div>
                        </div>
                        <span style={{ color: "#ff4d4f", fontWeight: "bold" }}>
                          ₹
                          {Number(
                            p.meta?.["9ba862ef-f993-4873-95ef-1fef10036aa5"] ||
                              0
                          ).toLocaleString("en-IN")}
                        </span>
                      </div>
                    </Option>
                  ))}
                </Select>
                {selectedConcealedProduct && (
                  <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                    <Select
                      placeholder="Select Floor"
                      style={{ minWidth: 250 }}
                      value={selectedFloor}
                      onChange={setSelectedFloor}
                    >
                      {formData.floorDetails.map((f) => (
                        <Option key={f.floor_number} value={f.floor_number}>
                          {f.floor_name}
                        </Option>
                      ))}
                    </Select>
                    <Select
                      placeholder="Select Room (optional)"
                      style={{ minWidth: 250 }}
                      value={selectedRoom}
                      onChange={setSelectedRoom}
                      allowClear
                    >
                      {selectedFloor &&
                        formData.floorDetails
                          .find((f) => f.floor_number === selectedFloor)
                          ?.rooms.map((room) => (
                            <Option key={room.room_id} value={room.room_id}>
                              {room.room_name} ({room.room_type})
                            </Option>
                          ))}
                    </Select>
                    <Button
                      type="primary"
                      icon={<PlusOutlined />}
                      onClick={addSelectedConcealedItem}
                      disabled={!selectedFloor}
                    >
                      Add
                    </Button>
                    <Button
                      onClick={() => {
                        setSelectedConcealedProduct(null);
                        setSelectedFloor(null);
                        setSelectedRoom(null);
                      }}
                    >
                      Clear
                    </Button>
                  </div>
                )}
              </Space>
            </Card>

            {/* Unassigned Concealed Items */}
            {formData.items.some((i) => i.isConcealed && !i.floor_number) && (
              <Card
                title="Unassigned Concealed Items"
                style={{
                  marginBottom: 24,
                  border: "2px dashed #ff4d4f",
                  backgroundColor: "#fff2f0",
                }}
              >
                <Table
                  size="small"
                  dataSource={formData.items.filter(
                    (i) => i.isConcealed && !i.floor_number
                  )}
                  columns={[
                    { title: "Product", dataIndex: "name" },
                    {
                      title: "Qty",
                      render: (_, r) => (
                        <InputNumber
                          min={1}
                          value={r.quantity}
                          onChange={(v) =>
                            updateItemQty(formData.items.indexOf(r), v)
                          }
                        />
                      ),
                    },
                    {
                      title: "Price",
                      render: (_, r) => `₹${r.price.toLocaleString("en-IN")}`,
                    },
                    {
                      title: "Total",
                      render: (_, r) =>
                        `₹${(r.quantity * r.price).toLocaleString("en-IN")}`,
                    },
                    {
                      title: "",
                      render: (_, r) => (
                        <Button
                          danger
                          size="small"
                          icon={<DeleteOutlined />}
                          onClick={() => removeItem(formData.items.indexOf(r))}
                        />
                      ),
                    },
                  ]}
                />
              </Card>
            )}

            {/* Assigned Concealed Items by Floor */}
            <Collapse accordion>
              {formData.floorDetails.map((floor) => {
                const concealedInFloor = formData.items.filter(
                  (i) => i.isConcealed && i.floor_number === floor.floor_number
                );
                if (concealedInFloor.length === 0) return null;

                const byRoom = {};
                concealedInFloor.forEach((item) => {
                  const key = item.room_id || "floor-level";
                  if (!byRoom[key]) byRoom[key] = [];
                  byRoom[key].push(item);
                });

                return (
                  <Panel
                    key={floor.floor_number}
                    header={
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          width: "100%",
                        }}
                      >
                        <span>
                          <EyeInvisibleOutlined /> {floor.floor_name} -
                          Concealed ({concealedInFloor.length})
                        </span>
                        <Tag color="volcano">
                          ₹
                          {concealedInFloor
                            .reduce((s, i) => s + i.quantity * i.price, 0)
                            .toLocaleString("en-IN")}
                        </Tag>
                      </div>
                    }
                  >
                    <Space
                      direction="vertical"
                      style={{ width: "100%" }}
                      size="large"
                    >
                      {Object.entries(byRoom).map(([roomKey, items]) => {
                        const room =
                          roomKey !== "floor-level"
                            ? floor.rooms.find((r) => r.room_id === roomKey)
                            : null;

                        const roomTotal = items.reduce(
                          (s, i) => s + i.quantity * i.price,
                          0
                        );

                        return (
                          <Card
                            key={roomKey}
                            size="small"
                            title={
                              room ? (
                                <span>
                                  {room.room_name} <Tag>{room.room_type}</Tag>
                                </span>
                              ) : (
                                <span>
                                  <strong>Floor Level (Common Areas)</strong>
                                </span>
                              )
                            }
                            extra={
                              <Tag color="red">
                                {items.length} concealed items
                              </Tag>
                            }
                          >
                            <Table
                              size="small"
                              pagination={false}
                              dataSource={items}
                              rowKey={(_, i) =>
                                `conc-${floor.floor_number}-${roomKey}-${i}`
                              }
                              columns={[
                                {
                                  title: "Product",
                                  dataIndex: "name",
                                  width: "40%",
                                },
                                {
                                  title: "Category",
                                  render: (_, r) => (
                                    <Tag color="volcano">
                                      {r.concealedCategory
                                        ? r.concealedCategory
                                            .replace(/-/g, " ")
                                            .toUpperCase()
                                        : "OTHERS"}
                                    </Tag>
                                  ),
                                },
                                {
                                  title: "Qty",
                                  width: 100,
                                  render: (_, r) => (
                                    <InputNumber
                                      min={1}
                                      value={r.quantity}
                                      onChange={(v) =>
                                        updateItemQty(
                                          formData.items.indexOf(r),
                                          v
                                        )
                                      }
                                    />
                                  ),
                                },
                                {
                                  title: "Price",
                                  render: (_, r) =>
                                    `₹${r.price.toLocaleString("en-IN")}`,
                                },
                                {
                                  title: "Total",
                                  render: (_, r) =>
                                    `₹${(r.quantity * r.price).toLocaleString(
                                      "en-IN"
                                    )}`,
                                },
                                {
                                  title: "",
                                  width: 50,
                                  render: (_, r) => (
                                    <Button
                                      danger
                                      size="small"
                                      icon={<DeleteOutlined />}
                                      onClick={() =>
                                        removeItem(formData.items.indexOf(r))
                                      }
                                    />
                                  ),
                                },
                              ]}
                            />
                            <div style={{ marginTop: 12, textAlign: "right" }}>
                              <Tag color="red" size="large">
                                Total: ₹{roomTotal.toLocaleString("en-IN")}
                              </Tag>
                            </div>
                          </Card>
                        );
                      })}
                    </Space>
                  </Panel>
                );
              })}
            </Collapse>
          </TabPane>
        </Tabs>

        {/* Summary */}
        <div
          style={{
            marginTop: 32,
            padding: 24,
            background: "#f0f2f5",
            borderRadius: 8,
          }}
        >
          <Row gutter={32}>
            <Col>
              <Statistic
                title="Visible Items"
                value={`₹${visibleTotal.toLocaleString("en-IN")}`}
              />
            </Col>
            <Col>
              <Statistic
                title="Concealed Works"
                value={`₹${concealedTotal.toLocaleString("en-IN")}`}
                valueStyle={{ color: "#ff4d4f" }}
              />
            </Col>
            <Col>
              <Statistic
                title="Grand Total (excl. GST)"
                value={`₹${grandTotal.toLocaleString("en-IN")}`}
              />
            </Col>
            <Col>
              <Statistic
                title="With 18% GST"
                value={`₹${(grandTotal * 1.18).toLocaleString("en-IN", {
                  maximumFractionDigits: 0,
                })}`}
              />
            </Col>
          </Row>
          <Divider />
          <Button
            type="primary"
            size="large"
            icon={<SaveOutlined />}
            onClick={handleSubmit}
            loading={isCreating || isUpdating}
          >
            {isEditMode ? "Update" : "Save"} Site Map
          </Button>
        </div>

        {/* Room Modal */}
        <Modal
          title={roomModal.room ? "Edit Room" : "Add New Room"}
          open={roomModal.visible}
          onOk={saveRoom}
          onCancel={() => setRoomModal({ visible: false })}
        >
          <Form form={roomForm} layout="vertical">
            <Form.Item
              name="room_name"
              label="Room Name"
              rules={[{ required: true }]}
            >
              <Input />
            </Form.Item>
            <Form.Item name="room_type" label="Type">
              <Select>
                <Option value="Bathroom">Bathroom</Option>
                <Option value="Kitchen">Kitchen</Option>
                <Option value="Bedroom">Bedroom</Option>
                <Option value="Living Room">Living Room</Option>
                <Option value="General">General</Option>
              </Select>
            </Form.Item>
            <Form.Item name="room_size" label="Size">
              <Input />
            </Form.Item>
            <Form.Item name="details" label="Details">
              <Input.TextArea />
            </Form.Item>
          </Form>
        </Modal>
        {/* Assign Product Modal */}
        <Modal
          title="Assign Product to Location"
          open={assignModal.visible}
          onOk={() => {
            if (!selectedFloor) return message.error("Please select a floor");
            const index = assignModal.itemIndex;
            setFormData((prev) => {
              const items = [...prev.items];
              items[index] = {
                ...items[index],
                floor_number: selectedFloor,
                room_id: selectedRoom || null,
              };
              return { ...prev, items };
            });
            setAssignModal({ visible: false, itemIndex: null });
            setSelectedFloor(null);
            setSelectedRoom(null);
            message.success("Product assigned successfully!");
          }}
          onCancel={() => {
            setAssignModal({ visible: false, itemIndex: null });
            setSelectedFloor(null);
            setSelectedRoom(null);
          }}
          okText="Assign"
          cancelText="Cancel"
        >
          <Space direction="vertical" style={{ width: "100%" }}>
            <div>
              <strong>Select Floor *</strong>
              <Select
                placeholder="Choose floor"
                style={{ width: "100%", marginTop: 8 }}
                value={selectedFloor}
                onChange={setSelectedFloor}
              >
                {formData.floorDetails.map((f) => (
                  <Option key={f.floor_number} value={f.floor_number}>
                    {f.floor_name}
                  </Option>
                ))}
              </Select>
            </div>

            {selectedFloor && (
              <div>
                <strong>Select Room (optional)</strong>
                <Select
                  placeholder="Common area if not selected"
                  style={{ width: "100%", marginTop: 8 }}
                  value={selectedRoom}
                  onChange={setSelectedRoom}
                  allowClear
                >
                  {formData.floorDetails
                    .find((f) => f.floor_number === selectedFloor)
                    ?.rooms.map((room) => (
                      <Option key={room.room_id} value={room.room_id}>
                        {room.room_name} ({room.room_type})
                      </Option>
                    ))}
                </Select>
              </div>
            )}
          </Space>
        </Modal>
      </div>
    </div>
  );
};

export default AddSiteMap;
