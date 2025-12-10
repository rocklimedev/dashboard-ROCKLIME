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
  const [roomModal, setRoomModal] = useState({
    visible: false,
    floor: null,
    room: null,
  });
  const [roomForm] = Form.useForm();

  // === Detect Concealed Products ===
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
        name.includes("db") ||
        category.includes("wiring") ||
        category.includes("concealed");

      if (isConcealedItem) {
        concealed.push({ ...p, isConcealed: true });
      } else {
        normal.push({ ...p, isConcealed: false });
      }
    });

    return { normalProducts: normal, concealedProducts: concealed };
  }, [validProducts]);

  // Load initial data
  useEffect(() => {
    if (fromQuotation && location.state) {
      const {
        customerId,
        projectName,
        items = [],
        totalFloors = 1,
        quotationId,
      } = location.state;
      setFormData((prev) => ({
        ...prev,
        customerId,
        name: projectName || "Site Map from Quotation",
        totalFloors,
        items: items.map((it) => ({
          ...it,
          floor_number: it.floor_number || 1,
          room_id: null,
          isConcealed: it.isConcealed || false,
        })),
        quotationId,
      }));
    } else if (isEditMode && existingSiteMapData?.data) {
      setFormData(existingSiteMapData.data);
    }
  }, [fromQuotation, location.state, isEditMode, existingSiteMapData]);

  // Auto-manage floors
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

  // Search Handlers
  const debouncedSearch = useCallback(
    debounce((val, list, setter) => {
      if (!val?.trim()) return setter([]);
      const term = val.toLowerCase().trim();
      const filtered = list
        .filter((p) => {
          const name = (
            p.name ||
            p.meta?.["d11da9f9-3f2e-4536-8236-9671200cca4a"] ||
            ""
          ).toLowerCase();
          const code = (p.product_code || "").toLowerCase();
          return name.includes(term) || code.includes(term);
        })
        .slice(0, 30);
      setter(filtered);
    }, 300),
    []
  );
  const addSelectedConcealedItem = () => {
    if (!selectedConcealedProduct || !selectedFloor) return;

    const prod = concealedProducts.find(
      (p) => getProductId(p) === selectedConcealedProduct
    );
    if (!prod) return;

    const price =
      Number(prod.meta?.["9ba862ef-f993-4873-95ef-1fef10036aa5"]) || 0;
    const categoryName = (prod.category?.name || "").toLowerCase();

    let concealedCategory = "others";
    if (categoryName.includes("conduit")) concealedCategory = "conduit-pipe";
    else if (categoryName.includes("wiring") || categoryName.includes("cable"))
      concealedCategory = "wiring-cable";
    else if (categoryName.includes("junction"))
      concealedCategory = "junction-box";
    else if (
      categoryName.includes("db") ||
      categoryName.includes("distribution")
    )
      concealedCategory = "distribution-board";
    else if (categoryName.includes("mcb")) concealedCategory = "mcb-dp";

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
      concealedCategory,
    };

    setFormData((prev) => ({
      ...prev,
      items: [...prev.items, newItem],
    }));

    // Reset
    setSelectedConcealedProduct(null);
    setSelectedFloor(null);
    setSelectedRoom(null);
    setConcealedSearch("");
    setFilteredConcealed([]);
  };
  const handleProductSearch = (val) => {
    setProductSearch(val);
    debouncedSearch(val, normalProducts, setFilteredProducts);
  };

  const handleConcealedSearch = (val) => {
    setConcealedSearch(val);
    debouncedSearch(val, concealedProducts, setFilteredConcealed);
  };

  const getProductId = (p) => p.productId || p.id;

  const addProduct = (floorNumber, roomId, productId, isConcealed = false) => {
    const list = isConcealed ? concealedProducts : normalProducts;
    const prod = list.find((p) => getProductId(p) === productId);
    if (!prod) return message.error("Product not found");

    const price =
      Number(prod.meta?.["9ba862ef-f993-4873-95ef-1fef10036aa5"]) || 0;
    const productType = prod.category?.name || "Others";

    const newItem = {
      productId: getProductId(prod),
      name: prod.name?.trim() || prod.product_code || "Unknown",
      imageUrl: prod.images?.[0]?.url || null,
      quantity: 1,
      price,
      floor_number: floorNumber,
      room_id: roomId || null,
      productType,
      isConcealed,
      concealedCategory: isConcealed
        ? (prod.category?.name?.toLowerCase().includes("conduit") &&
            "conduit-pipe") ||
          (prod.category?.name?.toLowerCase().includes("wiring") &&
            "wiring-cable") ||
          "others"
        : null,
    };

    setFormData((prev) => ({
      ...prev,
      items: [...prev.items, newItem],
    }));

    if (isConcealed) {
      setConcealedSearch("");
      setFilteredConcealed([]);
    } else {
      setProductSearch("");
      setFilteredProducts([]);
    }
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

  // === Room Modal Logic (unchanged) ===
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
        message.success("Site Map updated!");
      } else {
        await createSiteMap(payload).unwrap();
        message.success("Site Map created!");
      }
      navigate("/site-map/list");
    } catch (err) {
      message.error(err?.data?.message || "Failed to save");
    }
  };

  // === Group Items by Location ===
  const itemsByLocation = useMemo(() => {
    const map = {};
    formData.items.forEach((item) => {
      const floorKey = item.floor_number || "Unassigned";
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
          subtitle="Assign visible & concealed products to rooms for accurate electrical planning"
        />

        <Space style={{ marginBottom: 20 }}>
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
                placeholder="e.g., Dhruv Verma 3BHK Residence"
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

        {/* Tabs: Visible vs Concealed */}
        <Tabs defaultActiveKey="visible" size="large">
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
                          {visibleItems.length} visible items)
                        </span>
                        <Tag color="green">
                          ₹{floorTotal.toLocaleString("en-IN")}
                        </Tag>
                      </div>
                    }
                  >
                    <Space
                      direction="vertical"
                      style={{ width: "100%" }}
                      size="large"
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
                            Add rooms to assign products
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
                                  {room.room_name} <Tag>{room.room_type}</Tag>
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
                                placeholder="Add visible product..."
                                onSearch={handleProductSearch}
                                onChange={(pid) =>
                                  addProduct(
                                    floor.floor_number,
                                    room.room_id,
                                    pid,
                                    false
                                  )
                                }
                                value={null}
                                style={{ width: "100%", marginBottom: 16 }}
                              >
                                {filteredProducts.map((p) => (
                                  <Option
                                    key={getProductId(p)}
                                    value={getProductId(p)}
                                  >
                                    <div
                                      style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                      }}
                                    >
                                      <div>
                                        <strong>
                                          {p.name || p.product_code}
                                        </strong>
                                      </div>
                                      <div>
                                        ₹
                                        {Number(
                                          p.meta?.[
                                            "9ba862ef-f993-4873-95ef-1fef10036aa5"
                                          ] || 0
                                        ).toLocaleString("en-IN")}
                                      </div>
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
            {/* Add Concealed Item with Floor/Room Selector */}
            <Card
              title={
                <>
                  <ToolOutlined /> Add Concealed Item (Wiring, Conduit, DB,
                  etc.)
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
                  onSearch={handleConcealedSearch}
                  onChange={setSelectedConcealedProduct}
                  value={selectedConcealedProduct || undefined}
                  style={{ width: "100%" }}
                  dropdownMatchSelectWidth={false}
                >
                  {filteredConcealed.map((p) => (
                    <Option key={getProductId(p)} value={getProductId(p)}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                        }}
                      >
                        <div>
                          <strong>{p.name || p.product_code}</strong>
                          <Tag
                            color="volcano"
                            size="small"
                            style={{ marginLeft: 8 }}
                          >
                            Concealed
                          </Tag>
                        </div>
                        <div>
                          ₹
                          {Number(
                            p.meta?.["9ba862ef-f993-4873-95ef-1fef10036aa5"] ||
                              0
                          ).toLocaleString("en-IN")}
                        </div>
                      </div>
                    </Option>
                  ))}
                </Select>

                {selectedConcealedProduct && (
                  <>
                    <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                      <Select
                        placeholder="Select Floor"
                        style={{ width: 300 }}
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
                        style={{ width: 300 }}
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
                        Add to Location
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
                  </>
                )}
              </Space>
            </Card>

            {/* Concealed Items Table - Grouped by Floor → Room */}
            <Collapse accordion>
              {formData.floorDetails.map((floor) => {
                const concealedInFloor = formData.items.filter(
                  (i) => i.isConcealed && i.floor_number === floor.floor_number
                );

                if (concealedInFloor.length === 0) return null;

                // Group by room
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
                          Concealed Works
                          <Tag color="red" style={{ marginLeft: 8 }}>
                            {concealedInFloor.length} items
                          </Tag>
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

            {/* Optional: Show unassigned concealed items */}
            {formData.items.some((i) => i.isConcealed && !i.floor_number) && (
              <Card
                title="Unassigned Concealed Items"
                style={{ marginTop: 16, borderColor: "#ff4d4f" }}
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
                title="Visible Items Value"
                value={`₹${visibleTotal.toLocaleString("en-IN")}`}
              />
            </Col>
            <Col>
              <Statistic
                title="Concealed Works Value"
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
          <Space>
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
      </div>
    </div>
  );
};

export default AddSiteMap;
