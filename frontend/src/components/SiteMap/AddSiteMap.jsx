// src/components/SiteMap/AddSiteMap.jsx
import React, { useState, useEffect, useMemo } from "react";
import {
  useParams,
  useNavigate,
  useLocation,
  useSearchParams,
} from "react-router-dom";
import {
  Spin,
  message,
  Input,
  Select,
  Table,
  InputNumber,
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
  Space,
  Empty,
  Tooltip,
} from "antd";
import {
  ArrowLeftOutlined,
  PlusOutlined,
  DeleteOutlined,
  SaveOutlined,
  HomeOutlined,
  EditOutlined,
  EyeInvisibleOutlined,
  ToolOutlined,
  WarningOutlined,
  SearchOutlined,
  ApartmentOutlined,
  TagsOutlined,
} from "@ant-design/icons";
import { v4 as uuidv4 } from "uuid";

import PageHeader from "../Common/PageHeader";
import {
  useCreateSiteMapMutation,
  useGetSiteMapByIdQuery,
  useUpdateSiteMapMutation,
} from "../../api/siteMapApi";
import {
  useGetAllProductsQuery,
  useSearchProductsQuery,
} from "../../api/productApi";
import { useGetCustomersQuery } from "../../api/customerApi";

const { Panel } = Collapse;
const { Title, Text } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;

const AddSiteMap = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const isEditMode = Boolean(id);
  const fromQuotation = location.state?.fromQuotation === true;

  const [selectedConcealedProduct, setSelectedConcealedProduct] =
    useState(null);
  const [selectedFloor, setSelectedFloor] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState(null);

  // ─── API ────────────────────────────────────────────────
  const { data: customersData, isLoading: customersLoading } =
    useGetCustomersQuery({ limit: 500 });
  const { data: productsResponse, isLoading: productsLoading } =
    useGetAllProductsQuery();
  const { data: existingData, isLoading: fetchingExisting } =
    useGetSiteMapByIdQuery(id, { skip: !isEditMode });

  const [searchTerm, setSearchTerm] = useState("");
  const { data: searchResult = [], isFetching: searching } =
    useSearchProductsQuery(searchTerm, {
      skip: !searchTerm.trim(),
    });

  const [createSiteMap, { isLoading: creating }] = useCreateSiteMapMutation();
  const [updateSiteMap, { isLoading: updating }] = useUpdateSiteMapMutation();

  const customers = customersData?.data || [];
  const products = productsResponse?.data || [];

  // ─── Form State ─────────────────────────────────────────
  const [formData, setFormData] = useState({
    customerId: "",
    name: "",
    siteSizeInBHK: "",
    totalFloors: 1,
    floorDetails: [],
    items: [],
    quotationId: null,
  });

  const [assignModal, setAssignModal] = useState({
    visible: false,
    itemIndex: null,
  });
  const [roomModal, setRoomModal] = useState({
    visible: false,
    floor: null,
    room: null,
  });
  const [roomForm] = Form.useForm();

  // ─── Load initial data ──────────────────────────────────
  useEffect(() => {
    if (fromQuotation && location.state) {
      const {
        customerId,
        projectName,
        items = [],
        totalFloors = 1,
        quotationId,
      } = location.state;

      const mapped = items.map((it) => ({
        productId: it.productId,
        name: (it.name || "Unknown").trim(),
        imageUrl: it.imageUrl || null,
        quantity: Number(it.quantity) || 1,
        price: Number(it.price) || 0,
        discount: it.discount || 0,
        discountType: it.discountType || "percent",
        total: it.total || it.price,
        floor_number: null,
        room_id: null,
        productType: it.category?.name || "Quotation Item",
        isConcealed: false,
      }));

      setFormData((prev) => ({
        ...prev,
        customerId: customerId || "",
        name:
          projectName || `Site Map - ${new Date().toLocaleDateString("en-IN")}`,
        totalFloors: items.length > 0 ? totalFloors : 1,
        items: mapped,
        quotationId,
      }));
    } else if (isEditMode && existingData?.data) {
      setFormData(existingData.data);
    }
  }, [fromQuotation, location.state, isEditMode, existingData]);

  // Auto select customer from query param
  useEffect(() => {
    const cid = searchParams.get("customerId");
    if (cid && customers.length > 0 && !formData.customerId) {
      if (customers.some((c) => c.customerId === cid)) {
        setFormData((p) => ({ ...p, customerId: cid }));
      }
    }
  }, [searchParams, customers, formData.customerId]);

  // Auto-create Ground Floor
  useEffect(() => {
    if (
      fromQuotation &&
      formData.floorDetails.length === 0 &&
      formData.totalFloors >= 1
    ) {
      setFormData((p) => ({
        ...p,
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
  }, [fromQuotation, formData.floorDetails.length, formData.totalFloors]);

  // Auto-sync floors count
  useEffect(() => {
    if (!formData.totalFloors) return;
    let floors = [...formData.floorDetails];

    while (floors.length < formData.totalFloors) {
      const num = floors.length + 1;
      const name =
        num === 1
          ? "Ground Floor"
          : `${num - 1}${["st", "nd", "rd"][(num - 2) % 3] || "th"} Floor`;
      floors.push({
        floor_number: num,
        floor_name: name,
        floor_size: "",
        details: "",
        rooms: [],
      });
    }

    if (floors.length > formData.totalFloors) {
      floors = floors.slice(0, formData.totalFloors);
    }

    setFormData((p) => ({ ...p, floorDetails: floors }));
  }, [formData.totalFloors]);

  // ─── Helpers ────────────────────────────────────────────
  const getProductDisplayName = (p) =>
    p.name?.trim() ||
    p.product_code?.trim() ||
    p.meta?.["d11da9f9-3f2e-4536-8236-9671200cca4a"]?.trim() ||
    "Unknown";

  const getProductId = (p) => p.productId || p.id;

  const searchOptions = useMemo(() => {
    return (searchResult.length ? searchResult : products).map((p) => ({
      value: getProductId(p),
      label: (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <div style={{ fontWeight: 500 }}>{getProductDisplayName(p)}</div>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {p.product_code || "—"}
            </Text>
          </div>
          <Text strong style={{ color: "#52c41a" }}>
            ₹
            {(
              Number(p.meta?.["9ba862ef-f993-4873-95ef-1fef10036aa5"]) || 0
            ).toLocaleString("en-IN")}
          </Text>
        </div>
      ),
    }));
  }, [searchResult, products]);

  // ─── Actions ────────────────────────────────────────────
  const addVisibleProduct = (floorNumber, roomId, productId) => {
    const prod =
      searchResult.find((p) => getProductId(p) === productId) ||
      products.find((p) => getProductId(p) === productId);

    if (!prod) return message.error("Product not found");

    const price = Number(
      prod.meta?.["9ba862ef-f993-4873-95ef-1fef10036aa5"] || 0,
    );

    const item = {
      productId: getProductId(prod),
      name: getProductDisplayName(prod),
      imageUrl: prod.images?.[0]?.url || null,
      quantity: 1,
      price,
      floor_number: floorNumber,
      room_id: roomId || null,
      productType: prod.category?.name || "Visible",
      isConcealed: false,
    };

    setFormData((p) => ({ ...p, items: [...p.items, item] }));
    setSearchTerm("");
  };

  const addConcealedProduct = () => {
    if (!selectedConcealedProduct || !selectedFloor) return;

    const prod = products.find(
      (p) => getProductId(p) === selectedConcealedProduct,
    );
    if (!prod) return message.error("Product not found");

    const price = Number(
      prod.meta?.["9ba862ef-f993-4873-95ef-1fef10036aa5"] || 0,
    );

    const item = {
      productId: getProductId(prod),
      name: getProductDisplayName(prod),
      imageUrl: prod.images?.[0]?.url || null,
      quantity: 1,
      price,
      floor_number: selectedFloor,
      room_id: selectedRoom || null,
      productType: prod.category?.name || "Concealed",
      isConcealed: true,
    };

    setFormData((p) => ({ ...p, items: [...p.items, item] }));
    setSelectedConcealedProduct(null);
    setSelectedFloor(null);
    setSelectedRoom(null);
    setSearchTerm("");
  };

  const removeItem = (idx) => {
    setFormData((p) => ({
      ...p,
      items: p.items.filter((_, i) => i !== idx),
    }));
  };

  const updateQuantity = (idx, qty) => {
    if (qty < 1) return;
    setFormData((p) => {
      const items = [...p.items];
      items[idx].quantity = qty;
      return { ...p, items };
    });
  };

  // ─── Totals ─────────────────────────────────────────────
  const { visibleTotal, concealedTotal, grandTotal } = useMemo(() => {
    let v = 0,
      c = 0;
    formData.items.forEach((i) => {
      const amt = i.quantity * i.price;
      if (i.isConcealed) c += amt;
      else v += amt;
    });
    return {
      visibleTotal: v,
      concealedTotal: c,
      grandTotal: v + c,
    };
  }, [formData.items]);

  const hasUnassigned = formData.items.some((i) => !i.floor_number);

  if (fetchingExisting || customersLoading || productsLoading) {
    return (
      <Spin
        tip="Loading project data..."
        size="large"
        style={{ margin: "120px auto", display: "block" }}
      />
    );
  }

  return (
    <div className="page-wrapper">
      <div className="content">
        <PageHeader
          title={isEditMode ? "Edit Site Map" : "New Site Map"}
          subtitle="Electrical layout planning & product assignment"
          extra={[
            <Button
              key="back"
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate(-1)}
            >
              Back
            </Button>,
          ]}
        />

        {hasUnassigned && (
          <Alert
            message="There are unassigned items"
            description="Some products from quotation are not yet placed. Assign them to floors/rooms for better visualization."
            type="warning"
            showIcon
            closable
            style={{ marginBottom: 24 }}
          />
        )}

        {/* ─── Project Header ──────────────────────────────────────── */}
        <Card
          bordered={false}
          className="shadow-sm"
          style={{ marginBottom: 24, background: "#fafafa" }}
        >
          <Row gutter={[24, 16]} align="middle">
            <Col xs={24} md={8}>
              <label className="ant-form-item-required">Customer</label>
              <Select
                showSearch
                placeholder="Select customer"
                value={formData.customerId}
                onChange={(v) => setFormData((p) => ({ ...p, customerId: v }))}
                style={{ width: "100%" }}
                size="large"
                optionFilterProp="children"
              >
                {customers.map((c) => (
                  <Option key={c.customerId} value={c.customerId}>
                    {c.name}
                  </Option>
                ))}
              </Select>
            </Col>

            <Col xs={24} md={10}>
              <label className="ant-form-item-required">Project Name</label>
              <Input
                size="large"
                placeholder="e.g. Jethalal Gada 3BHK – Goregaon"
                value={formData.name}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, name: e.target.value }))
                }
              />
            </Col>

            <Col xs={24} md={6}>
              <label>Total Floors</label>
              <InputNumber
                min={1}
                max={50}
                size="large"
                style={{ width: "100%" }}
                value={formData.totalFloors}
                onChange={(v) => setFormData((p) => ({ ...p, totalFloors: v }))}
              />
            </Col>
          </Row>
        </Card>

        {/* ─── Main Tabs ───────────────────────────────────────────── */}
        <Tabs
          defaultActiveKey="visible"
          size="large"
          type="card"
          tabBarStyle={{ marginBottom: 0 }}
        >
          {/* VISIBLE PRODUCTS */}
          <TabPane
            tab={
              <Space>
                <HomeOutlined />
                Visible Products
                <Badge
                  count={formData.items.filter((i) => !i.isConcealed).length}
                  color="#52c41a"
                />
              </Space>
            }
            key="visible"
          >
            {formData.items.some((i) => !i.isConcealed && !i.floor_number) && (
              <Card
                title={
                  <Space>
                    <WarningOutlined /> Unassigned Products (from Quotation)
                  </Space>
                }
                extra={
                  <Tag color="processing">
                    {
                      formData.items.filter(
                        (i) => !i.isConcealed && !i.floor_number,
                      ).length
                    }{" "}
                    items
                  </Tag>
                }
                bordered={false}
                style={{ marginBottom: 24, background: "#fffbe6" }}
              >
                <Table
                  size="middle"
                  pagination={false}
                  dataSource={formData.items.filter(
                    (i) => !i.isConcealed && !i.floor_number,
                  )}
                  rowKey={(r, idx) => `unassigned-${idx}`}
                  columns={[
                    { title: "Product", dataIndex: "name", ellipsis: true },
                    {
                      title: "Qty",
                      width: 120,
                      render: (_, r) => (
                        <InputNumber
                          min={1}
                          value={r.quantity}
                          onChange={(v) =>
                            updateQuantity(formData.items.indexOf(r), v)
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
                      title: "Action",
                      width: 140,
                      render: (_, r) => (
                        <Space>
                          <Button
                            type="primary"
                            size="small"
                            icon={<ApartmentOutlined />}
                            onClick={() =>
                              setAssignModal({
                                visible: true,
                                itemIndex: formData.items.indexOf(r),
                              })
                            }
                          >
                            Assign
                          </Button>
                          <Button
                            danger
                            size="small"
                            icon={<DeleteOutlined />}
                            onClick={() =>
                              removeItem(formData.items.indexOf(r))
                            }
                          />
                        </Space>
                      ),
                    },
                  ]}
                />
              </Card>
            )}

            <Collapse
              defaultActiveKey={formData.floorDetails.map(
                (f) => f.floor_number,
              )}
              accordion
              ghost
            >
              {formData.floorDetails.map((floor) => {
                const floorItems = formData.items.filter(
                  (i) =>
                    i.floor_number === floor.floor_number && !i.isConcealed,
                );
                const total = floorItems.reduce(
                  (s, i) => s + i.quantity * i.price,
                  0,
                );

                return (
                  <Panel
                    key={floor.floor_number}
                    header={
                      <Space
                        style={{
                          width: "100%",
                          justifyContent: "space-between",
                        }}
                      >
                        <Space>
                          <HomeOutlined style={{ color: "#1890ff" }} />
                          <Text strong>{floor.floor_name}</Text>
                          <Text type="secondary">({floorItems.length})</Text>
                        </Space>
                        <Tag
                          color="green"
                          style={{ fontSize: 14, padding: "4px 12px" }}
                        >
                          ₹{total.toLocaleString("en-IN")}
                        </Tag>
                      </Space>
                    }
                  >
                    <Space
                      direction="vertical"
                      style={{ width: "100%" }}
                      size="middle"
                    >
                      <Button
                        type="dashed"
                        icon={<PlusOutlined />}
                        onClick={() =>
                          setRoomModal({ visible: true, floor, room: null })
                        }
                        block
                      >
                        Add Room
                      </Button>

                      {floor.rooms.length === 0 ? (
                        <Empty
                          image={Empty.PRESENTED_IMAGE_SIMPLE}
                          description="No rooms yet — add rooms to start assigning products"
                        />
                      ) : (
                        floor.rooms.map((room) => {
                          const roomItems = floorItems.filter(
                            (i) => i.room_id === room.room_id,
                          );
                          const roomTotal = roomItems.reduce(
                            (s, i) => s + i.quantity * i.price,
                            0,
                          );

                          return (
                            <Card
                              key={room.room_id}
                              size="small"
                              title={
                                <Space>
                                  <Text strong>{room.room_name}</Text>
                                  <Tag color="blue">
                                    {room.room_type || "General"}
                                  </Tag>
                                </Space>
                              }
                              extra={
                                <Space>
                                  <Tooltip title="Edit room">
                                    <Button
                                      size="small"
                                      icon={<EditOutlined />}
                                      onClick={() =>
                                        setRoomModal({
                                          visible: true,
                                          floor,
                                          room,
                                        })
                                      }
                                    />
                                  </Tooltip>
                                  <Tooltip title="Delete room">
                                    <Button
                                      danger
                                      size="small"
                                      icon={<DeleteOutlined />}
                                      onClick={() => {
                                        if (
                                          window.confirm(
                                            "Delete room and all assigned items?",
                                          )
                                        ) {
                                          setFormData((p) => ({
                                            ...p,
                                            floorDetails: p.floorDetails.map(
                                              (f) =>
                                                f.floor_number ===
                                                floor.floor_number
                                                  ? {
                                                      ...f,
                                                      rooms: f.rooms.filter(
                                                        (r) =>
                                                          r.room_id !==
                                                          room.room_id,
                                                      ),
                                                    }
                                                  : f,
                                            ),
                                            items: p.items.filter(
                                              (i) =>
                                                !(
                                                  i.floor_number ===
                                                    floor.floor_number &&
                                                  i.room_id === room.room_id
                                                ),
                                            ),
                                          }));
                                        }
                                      }}
                                    />
                                  </Tooltip>
                                </Space>
                              }
                            >
                              <div style={{ marginBottom: 12 }}>
                                <Select
                                  showSearch
                                  placeholder="Search product..."
                                  prefix={<SearchOutlined />}
                                  value={null}
                                  onSearch={setSearchTerm}
                                  onChange={(val) => {
                                    addVisibleProduct(
                                      floor.floor_number,
                                      room.room_id,
                                      val,
                                    );
                                  }}
                                  filterOption={false}
                                  options={searchOptions}
                                  notFoundContent={
                                    searching ? (
                                      <Spin size="small" />
                                    ) : searchTerm ? (
                                      "No match"
                                    ) : (
                                      "Type to search"
                                    )
                                  }
                                  style={{ width: "100%" }}
                                  size="large"
                                  dropdownStyle={{ maxHeight: 380 }}
                                />
                              </div>

                              {roomItems.length > 0 ? (
                                <Table
                                  size="small"
                                  pagination={false}
                                  dataSource={roomItems}
                                  rowKey={(_, idx) => `room-item-${idx}`}
                                  columns={[
                                    {
                                      title: "Product",
                                      dataIndex: "name",
                                      ellipsis: true,
                                    },
                                    {
                                      title: "Qty",
                                      width: 100,
                                      render: (_, r) => (
                                        <InputNumber
                                          min={1}
                                          value={r.quantity}
                                          onChange={(v) =>
                                            updateQuantity(
                                              formData.items.indexOf(r),
                                              v,
                                            )
                                          }
                                        />
                                      ),
                                    },
                                    {
                                      title: "Total",
                                      width: 140,
                                      render: (_, r) =>
                                        `₹${(
                                          r.quantity * r.price
                                        ).toLocaleString("en-IN")}`,
                                    },
                                    {
                                      title: "",
                                      width: 60,
                                      render: (_, r) => (
                                        <Button
                                          danger
                                          size="small"
                                          icon={<DeleteOutlined />}
                                          onClick={() =>
                                            removeItem(
                                              formData.items.indexOf(r),
                                            )
                                          }
                                        />
                                      ),
                                    },
                                  ]}
                                />
                              ) : (
                                <Text type="secondary">
                                  No products assigned yet
                                </Text>
                              )}

                              {roomItems.length > 0 && (
                                <div
                                  style={{ textAlign: "right", marginTop: 12 }}
                                >
                                  <Tag
                                    color="green"
                                    style={{
                                      fontSize: 14,
                                      padding: "6px 12px",
                                    }}
                                  >
                                    Room Total: ₹
                                    {roomTotal.toLocaleString("en-IN")}
                                  </Tag>
                                </div>
                              )}
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

          {/* CONCEALED WORKS */}
          <TabPane
            tab={
              <Space>
                <EyeInvisibleOutlined />
                Concealed Works
                <Badge
                  count={formData.items.filter((i) => i.isConcealed).length}
                  color="#ff4d4f"
                />
              </Space>
            }
            key="concealed"
          >
            <Card
              title={
                <Space>
                  <ToolOutlined /> Add Concealed Item
                </Space>
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
                  prefix={<SearchOutlined />}
                  placeholder="Search product for concealed work..."
                  value={selectedConcealedProduct}
                  onSearch={setSearchTerm}
                  onChange={setSelectedConcealedProduct}
                  filterOption={false}
                  options={searchOptions}
                  notFoundContent={searching ? <Spin /> : "No results"}
                  style={{ width: "100%" }}
                  size="large"
                />

                {selectedConcealedProduct && (
                  <Row gutter={16}>
                    <Col xs={24} sm={10} md={8}>
                      <Select
                        placeholder="Select Floor"
                        value={selectedFloor}
                        onChange={setSelectedFloor}
                        style={{ width: "100%" }}
                        size="large"
                      >
                        {formData.floorDetails.map((f) => (
                          <Option key={f.floor_number} value={f.floor_number}>
                            {f.floor_name}
                          </Option>
                        ))}
                      </Select>
                    </Col>

                    <Col xs={24} sm={10} md={8}>
                      <Select
                        placeholder="Room (optional)"
                        value={selectedRoom}
                        onChange={setSelectedRoom}
                        allowClear
                        style={{ width: "100%" }}
                        size="large"
                        disabled={!selectedFloor}
                      >
                        {selectedFloor &&
                          formData.floorDetails
                            .find((f) => f.floor_number === selectedFloor)
                            ?.rooms.map((r) => (
                              <Option key={r.room_id} value={r.room_id}>
                                {r.room_name} ({r.room_type || "—"})
                              </Option>
                            ))}
                      </Select>
                    </Col>

                    <Col xs={24} sm={4} md={4}>
                      <Space>
                        <Button
                          type="primary"
                          icon={<PlusOutlined />}
                          onClick={addConcealedProduct}
                          disabled={!selectedFloor}
                          size="large"
                          block
                        >
                          Add
                        </Button>
                        <Button
                          size="large"
                          onClick={() => {
                            setSelectedConcealedProduct(null);
                            setSelectedFloor(null);
                            setSelectedRoom(null);
                          }}
                        >
                          Clear
                        </Button>
                      </Space>
                    </Col>
                  </Row>
                )}
              </Space>
            </Card>

            {/* Concealed items per floor */}
            <Collapse accordion ghost>
              {formData.floorDetails.map((floor) => {
                const concealed = formData.items.filter(
                  (i) => i.isConcealed && i.floor_number === floor.floor_number,
                );
                if (concealed.length === 0) return null;

                const byRoom = {};
                concealed.forEach((i) => {
                  const key = i.room_id || "floor";
                  if (!byRoom[key]) byRoom[key] = [];
                  byRoom[key].push(i);
                });

                const floorTotal = concealed.reduce(
                  (s, i) => s + i.quantity * i.price,
                  0,
                );

                return (
                  <Panel
                    key={floor.floor_number}
                    header={
                      <Space
                        style={{
                          width: "100%",
                          justifyContent: "space-between",
                        }}
                      >
                        <Space>
                          <EyeInvisibleOutlined style={{ color: "#ff4d4f" }} />
                          <Text strong>{floor.floor_name}</Text>
                          <Text type="secondary">({concealed.length})</Text>
                        </Space>
                        <Tag
                          color="volcano"
                          style={{ fontSize: 14, padding: "4px 12px" }}
                        >
                          ₹{floorTotal.toLocaleString("en-IN")}
                        </Tag>
                      </Space>
                    }
                  >
                    <Space
                      direction="vertical"
                      style={{ width: "100%" }}
                      size="middle"
                    >
                      {Object.entries(byRoom).map(([key, items]) => {
                        const room =
                          key !== "floor"
                            ? floor.rooms.find((r) => r.room_id === key)
                            : null;
                        const total = items.reduce(
                          (s, i) => s + i.quantity * i.price,
                          0,
                        );

                        return (
                          <Card
                            key={key}
                            size="small"
                            title={
                              room ? (
                                <Space>
                                  {room.room_name}{" "}
                                  <Tag color="default">
                                    {room.room_type || "General"}
                                  </Tag>
                                </Space>
                              ) : (
                                <Text strong>Floor-level (common areas)</Text>
                              )
                            }
                            extra={<Tag color="red">{items.length} items</Tag>}
                          >
                            <Table
                              size="small"
                              pagination={false}
                              dataSource={items}
                              columns={[
                                {
                                  title: "Product",
                                  dataIndex: "name",
                                  ellipsis: true,
                                },
                                {
                                  title: "Qty",
                                  width: 100,
                                  render: (_, r) => (
                                    <InputNumber
                                      min={1}
                                      value={r.quantity}
                                      onChange={(v) =>
                                        updateQuantity(
                                          formData.items.indexOf(r),
                                          v,
                                        )
                                      }
                                    />
                                  ),
                                },
                                {
                                  title: "Total",
                                  width: 140,
                                  render: (_, r) =>
                                    `₹${(r.quantity * r.price).toLocaleString(
                                      "en-IN",
                                    )}`,
                                },
                                {
                                  title: "",
                                  width: 60,
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
                            <div style={{ textAlign: "right", marginTop: 12 }}>
                              <Tag
                                color="red"
                                style={{ fontSize: 14, padding: "6px 12px" }}
                              >
                                Subtotal: ₹{total.toLocaleString("en-IN")}
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

        {/* ─── Summary Footer ──────────────────────────────────────── */}
        <Card
          bordered={false}
          style={{
            marginTop: 32,
            background: "linear-gradient(135deg, #f6f9fc 0%, #ffffff 100%)",
            boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
          }}
        >
          <Row gutter={[24, 24]} justify="space-around">
            <Col xs={12} sm={6}>
              <Statistic
                title="Visible Products"
                value={visibleTotal}
                precision={0}
                formatter={(v) => `₹${v.toLocaleString("en-IN")}`}
                valueStyle={{ color: "#52c41a", fontSize: 28 }}
              />
            </Col>
            <Col xs={12} sm={6}>
              <Statistic
                title="Concealed Works"
                value={concealedTotal}
                precision={0}
                formatter={(v) => `₹${v.toLocaleString("en-IN")}`}
                valueStyle={{ color: "#ff4d4f", fontSize: 28 }}
              />
            </Col>
            <Col xs={12} sm={6}>
              <Statistic
                title="Grand Total"
                value={grandTotal}
                precision={0}
                formatter={(v) => `₹${v.toLocaleString("en-IN")}`}
                valueStyle={{ fontWeight: 600, fontSize: 28 }}
              />
            </Col>
            <Col xs={12} sm={6}>
              <Statistic
                title="incl. 18% GST"
                value={grandTotal * 1.18}
                precision={0}
                formatter={(v) => `₹${Math.round(v).toLocaleString("en-IN")}`}
                valueStyle={{ color: "#722ed1", fontSize: 28 }}
              />
            </Col>
          </Row>

          <Divider />

          <div style={{ textAlign: "center" }}>
            <Button
              type="primary"
              size="large"
              icon={<SaveOutlined />}
              loading={creating || updating}
              onClick={async () => {
                if (!formData.customerId)
                  return message.error("Please select customer");
                if (!formData.name.trim())
                  return message.error("Project name is required");

                const payload = {
                  ...formData,
                  items: formData.items.map((i) => ({
                    ...i,
                    quantity: Number(i.quantity),
                    price: Number(i.price),
                  })),
                };

                try {
                  if (isEditMode) {
                    await updateSiteMap({
                      id,
                      updatedSiteMap: payload,
                    }).unwrap();
                    message.success("Site map updated");
                  } else {
                    await createSiteMap(payload).unwrap();
                    message.success("Site map created");
                  }
                  navigate("/site-map/list");
                } catch (err) {
                  message.error(err?.data?.message || "Save failed");
                }
              }}
              style={{ height: 48, fontSize: 16, minWidth: 180 }}
            >
              {isEditMode ? "Update Site Map" : "Create Site Map"}
            </Button>
          </div>
        </Card>

        {/* ─── Modals ──────────────────────────────────────────────── */}
        <Modal
          title={roomModal.room ? "Edit Room" : "Add Room"}
          open={roomModal.visible}
          onOk={() => roomForm.submit()}
          onCancel={() => {
            setRoomModal({ visible: false });
            roomForm.resetFields();
          }}
          okText="Save Room"
          width={500}
        >
          <Form
            form={roomForm}
            layout="vertical"
            onFinish={(values) => {
              setFormData((prev) => {
                const floors = prev.floorDetails.map((f) => ({
                  ...f,
                  rooms: [...f.rooms],
                }));
                const floorIdx = floors.findIndex(
                  (f) => f.floor_number === roomModal.floor.floor_number,
                );

                if (roomModal.room) {
                  const roomIdx = floors[floorIdx].rooms.findIndex(
                    (r) => r.room_id === roomModal.room.room_id,
                  );
                  floors[floorIdx].rooms[roomIdx] = {
                    ...floors[floorIdx].rooms[roomIdx],
                    ...values,
                  };
                } else {
                  floors[floorIdx].rooms.push({
                    room_id: uuidv4(),
                    room_name: values.room_name,
                    room_type: values.room_type,
                    room_size: values.room_size,
                    details: values.details,
                  });
                }

                return { ...prev, floorDetails: floors };
              });
              setRoomModal({ visible: false });
              roomForm.resetFields();
            }}
          >
            <Form.Item
              name="room_name"
              label="Room Name"
              rules={[{ required: true }]}
            >
              <Input placeholder="e.g. Master Bedroom" />
            </Form.Item>

            <Form.Item name="room_type" label="Room Type">
              <Select placeholder="Select type">
                <Option value="Bedroom">Bedroom</Option>
                <Option value="Living Room">Living / Drawing</Option>
                <Option value="Kitchen">Kitchen</Option>
                <Option value="Bathroom">Bathroom</Option>
                <Option value="Balcony">Balcony / Terrace</Option>
                <Option value="Parking">Parking</Option>
                <Option value="Puja Room">Puja Room</Option>
                <Option value="General">Other / General</Option>
              </Select>
            </Form.Item>

            <Form.Item name="room_size" label="Size (optional)">
              <Input placeholder="e.g. 12 × 14 ft" />
            </Form.Item>

            <Form.Item name="details" label="Notes / Details">
              <Input.TextArea
                rows={3}
                placeholder="Any special requirements..."
              />
            </Form.Item>
          </Form>
        </Modal>

        <Modal
          title="Assign Product"
          open={assignModal.visible}
          onOk={() => {
            if (!selectedFloor) return message.error("Select floor");
            const idx = assignModal.itemIndex;
            setFormData((p) => {
              const items = [...p.items];
              items[idx] = {
                ...items[idx],
                floor_number: selectedFloor,
                room_id: selectedRoom || null,
              };
              return { ...p, items };
            });
            setAssignModal({ visible: false, itemIndex: null });
            setSelectedFloor(null);
            setSelectedRoom(null);
            message.success("Assigned successfully");
          }}
          onCancel={() => {
            setAssignModal({ visible: false, itemIndex: null });
            setSelectedFloor(null);
            setSelectedRoom(null);
          }}
          okText="Assign Now"
        >
          <Space direction="vertical" style={{ width: "100%" }}>
            <div>
              <strong style={{ display: "block", marginBottom: 8 }}>
                Floor *
              </strong>
              <Select
                placeholder="Choose floor"
                value={selectedFloor}
                onChange={setSelectedFloor}
                style={{ width: "100%" }}
                size="large"
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
                <strong style={{ display: "block", marginBottom: 8 }}>
                  Room (optional)
                </strong>
                <Select
                  placeholder="Common area"
                  value={selectedRoom}
                  onChange={setSelectedRoom}
                  allowClear
                  style={{ width: "100%" }}
                  size="large"
                >
                  {formData.floorDetails
                    .find((f) => f.floor_number === selectedFloor)
                    ?.rooms.map((r) => (
                      <Option key={r.room_id} value={r.room_id}>
                        {r.room_name} ({r.room_type || "—"})
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
