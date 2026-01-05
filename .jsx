// src/components/SiteMap/AddSiteMap.jsx

import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useSearchParams } from "react-router-dom";
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
  HomeOutlined,
  EditOutlined,
  EyeInvisibleOutlined,
  ToolOutlined,
  WarningOutlined,
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
const { Text } = Typography;
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

  // API
  const { data: customersData, isLoading: isCustomersLoading } =
    useGetCustomersQuery();
  const { data: response, isLoading: isProductsLoading } =
    useGetAllProductsQuery();

  const productsData = response?.data || [];
  const { data: existingSiteMapData, isLoading: isFetching } =
    useGetSiteMapByIdQuery(id, { skip: !isEditMode });

  // SINGLE SHARED SEARCH
  const [searchTerm, setSearchTerm] = useState("");
  const { data: searchResult = [], isFetching: isSearching } =
    useSearchProductsQuery(searchTerm, {
      skip: !searchTerm.trim(),
    });

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
        siteSizeInBHK: "",
        totalFloors: items.length > 0 ? totalFloors : 1,
        items: mappedItems,
        quotationId,
      }));
    } else if (isEditMode && existingSiteMapData?.data) {
      setFormData(existingSiteMapData.data);
    }
  }, [fromQuotation, location.state, isEditMode, existingSiteMapData]);

  // === Auto-select customer from URL query param ===
  useEffect(() => {
    const urlCustomerId = searchParams.get("customerId");
    if (urlCustomerId && customers.length > 0) {
      const customerExists = customers.some(
        (c) => c.customerId === urlCustomerId
      );
      if (customerExists && !formData.customerId) {
        setFormData((prev) => ({ ...prev, customerId: urlCustomerId }));
      }
    }
  }, [searchParams, customers, formData.customerId]);

  // Auto-create Ground Floor if none exist
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
    if (p.meta?.["d11da9f9-3f2e-4536-8236-9671200cca4a"])
      return p.meta["d11da9f9-3f2e-4536-8236-9671200cca4a"].trim();
    return "Unknown Product";
  };

  const getProductId = (p) => p.productId || p.id;

  // === Shared Search Options ===
  const searchOptions = useMemo(() => {
    const items = searchResult || [];
    console.log("Shared Search - Term:", searchTerm);
    console.log("Shared Search - Results count:", items.length);

    return items.map((p) => ({
      value: getProductId(p),
      label: (
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <div>
            <strong>{getDisplayName(p)}</strong>
            <div style={{ fontSize: 12, color: "#888" }}>
              {p.product_code ||
                p.meta?.["d11da9f9-3f2e-4536-8236-9671200cca4a"] ||
                "—"}
            </div>
          </div>
          <span>
            ₹
            {Number(
              p.meta?.["9ba862ef-f993-4873-95ef-1fef10036aa5"] || 0
            ).toLocaleString("en-IN")}
          </span>
        </div>
      ),
    }));
  }, [searchResult, searchTerm]);

  // === Add Product (Visible) ===
  const addProduct = (floorNumber, roomId, productId, isConcealed = false) => {
    let prod = searchResult.find((p) => getProductId(p) === productId);

    if (!prod) {
      prod = validProducts.find((p) => getProductId(p) === productId);
    }

    if (!prod) {
      message.error("Product not found");
      return;
    }

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
      productType:
        prod.category?.name || (isConcealed ? "Concealed" : "Others"),
      isConcealed,
    };

    setFormData((prev) => ({ ...prev, items: [...prev.items, newItem] }));
    setSearchTerm(""); // Clear search after adding
  };

  // === Add Concealed Item ===
  const addSelectedConcealedItem = () => {
    if (!selectedConcealedProduct || !selectedFloor) return;

    const prod = validProducts.find(
      (p) => getProductId(p) === selectedConcealedProduct
    );
    if (!prod) return message.error("Concealed product not found");

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

    setFormData((prev) => ({ ...prev, items: [...prev.items, newItem] }));

    setSelectedConcealedProduct(null);
    setSelectedFloor(null);
    setSelectedRoom(null);
    setSearchTerm(""); // Clear search
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

  // === Group Items by Location & Totals ===
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
          exportOptions={{ pdf: false, excel: false }}
          subtitle="Plan electrical layout by assigning products to floors and rooms"
        />

        <Space style={{ marginBottom: 16 }}>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
            Back
          </Button>
        </Space>

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
          {/* VISIBLE PRODUCTS TAB */}
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
                                placeholder="Search & select product..."
                                searchValue={searchTerm}
                                onSearch={setSearchTerm}
                                onChange={(value) => {
                                  addProduct(
                                    floor.floor_number,
                                    room.room_id,
                                    value,
                                    false
                                  );
                                  setSearchTerm("");
                                }}
                                filterOption={false}
                                options={searchOptions}
                                notFoundContent={
                                  isSearching ? (
                                    <Spin size="small" />
                                  ) : searchTerm ? (
                                    "No products found"
                                  ) : (
                                    "Start typing..."
                                  )
                                }
                                style={{ width: "100%" }}
                                dropdownMatchSelectWidth={false}
                                dropdownStyle={{
                                  maxHeight: 400,
                                  overflow: "auto",
                                }}
                              />
                              {/* Table and totals unchanged */}
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

          {/* CONCEALED WORKS TAB */}
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
                  placeholder="Search any product..."
                  searchValue={searchTerm}
                  onSearch={setSearchTerm}
                  onChange={setSelectedConcealedProduct}
                  filterOption={false}
                  options={searchOptions}
                  notFoundContent={
                    isSearching ? (
                      <Spin size="small" />
                    ) : searchTerm ? (
                      "No products found"
                    ) : (
                      "Start typing to search..."
                    )
                  }
                  style={{ width: "100%" }}
                />
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
                                <strong>Floor Level (Common Areas)</strong>
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
                                  width: "40%",
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
                <Option value="Terrace">Terrace</Option>
                <Option value="Parking">Parking</Option>
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
