// src/components/SiteMap/AddSiteMap.jsx

import React, { useState, useEffect, useCallback } from "react";
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
} from "antd";
import {
  ArrowLeftOutlined,
  PlusOutlined,
  DeleteOutlined,
  SaveOutlined,
  FileTextOutlined,
  HomeOutlined,
  EditOutlined,
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

const safeLower = (val) =>
  val === null || val === undefined ? "" : String(val).toLowerCase();

const AddSiteMap = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const isEditMode = Boolean(id);
  const fromQuotation = location.state?.fromQuotation === true;

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
  const existingSiteMap = existingSiteMapData?.data || null;

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
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [roomModal, setRoomModal] = useState({
    visible: false,
    floor: null,
    room: null,
  });
  const [roomForm] = Form.useForm();

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
        })),
        quotationId,
      }));
    } else if (isEditMode && existingSiteMap) {
      setFormData({
        customerId: existingSiteMap.customerId || "",
        name: existingSiteMap.name || "",
        siteSizeInBHK: existingSiteMap.siteSizeInBHK || "",
        totalFloors: existingSiteMap.totalFloors || 1,
        floorDetails: existingSiteMap.floorDetails || [],
        items: existingSiteMap.items || [],
        quotationId: existingSiteMap.quotationId || null,
      });
    }
  }, [fromQuotation, location.state, isEditMode, existingSiteMap]);

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
          rooms: [], // no default rooms
        });
      }
    } else if (newFloors.length > formData.totalFloors) {
      newFloors = newFloors.slice(0, formData.totalFloors);
      setFormData((prev) => ({
        ...prev,
        items: prev.items.filter(
          (item) => item.floor_number <= formData.totalFloors
        ),
      }));
    }

    setFormData((prev) => ({ ...prev, floorDetails: newFloors }));
  }, [formData.totalFloors]);

  // Product search
  const debouncedSearch = useCallback(
    debounce((val) => {
      if (!val?.trim()) {
        setFilteredProducts([]);
        return;
      }
      const term = val.toLowerCase().trim();

      const filtered = validProducts
        .filter((p) => {
          // Extract meaningful fields once
          const name = (p.name || "").toLowerCase().trim();
          const code = (p.product_code || "").toLowerCase().trim();
          const companyCode = (
            p.meta?.["d11da9f9-3f2e-4536-8236-9671200cca4a"] || ""
          )
            .toString()
            .toLowerCase()
            .trim();

          // Better fallback: use company code as primary when name is missing
          const displayName = name || companyCode || code;

          // Search in all relevant fields
          return (
            name.includes(term) ||
            code.includes(term) ||
            companyCode.includes(term) ||
            displayName.includes(term)
          );
        })
        .slice(0, 30); // increase limit if needed

      setFilteredProducts(filtered);
    }, 300),
    [validProducts]
  );

  const handleProductSearch = (value) => {
    setProductSearch(value);
    debouncedSearch(value);
  };
  const getProductId = (p) => p.productId || p.id;
  const addProduct = (floorNumber, roomId, productId) => {
    const prod = validProducts.find((p) => getProductId(p) === productId);
    if (!prod) return message.error("Product not found");

    const price =
      Number(prod.meta?.["9ba862ef-f993-4873-95ef-1fef10036aa5"]) || 0;
    const productType = prod.category?.name || "Others";

    const newItem = {
      productId: getProductId(prod),
      name: prod.name?.trim() || "Unknown",
      imageUrl: prod.images?.[0]?.url || prod.images?.[0] || null,
      quantity: 1,
      price,
      floor_number: floorNumber,
      room_id: roomId || null,
      productType,
    };

    setFormData((prev) => ({
      ...prev,
      items: [...prev.items, newItem], // ← immutable push
    }));

    setProductSearch("");
    setFilteredProducts([]);
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
    if (room) {
      roomForm.setFieldsValue(room);
    }
  };

  const saveRoom = () => {
    roomForm
      .validateFields()
      .then((values) => {
        setFormData((prev) => {
          // Deep clone to break any Immer/proxy/freeze
          const updatedFloors = prev.floorDetails.map((f) => ({
            ...f,
            rooms: [...f.rooms], // clone rooms array
          }));

          const floorIndex = updatedFloors.findIndex(
            (f) => f.floor_number === roomModal.floor.floor_number
          );

          if (floorIndex === -1) return prev;

          const floor = updatedFloors[floorIndex];

          if (roomModal.room) {
            // Edit existing room
            const roomIndex = floor.rooms.findIndex(
              (r) => r.room_id === roomModal.room.room_id
            );
            if (roomIndex !== -1) {
              floor.rooms[roomIndex] = {
                ...floor.rooms[roomIndex],
                // keep original props
                ...values, // override with new values
              };
            }
          } else {
            // Add new room
            floor.rooms.push({
              room_id: uuidv4(),
              room_name: values.room_name,
              room_type: values.room_type || "General",
              room_size: values.room_size || "",
              details: values.details || "",
            });
          }

          return {
            ...prev,
            floorDetails: updatedFloors,
          };
        });

        setRoomModal({ visible: false });
        roomForm.resetFields();
      })
      .catch(() => {});
  };

  const deleteRoom = (floorNumber, roomId) => {
    setFormData((prev) => {
      const updatedFloors = prev.floorDetails.map((f) => ({
        ...f,
        rooms: f.rooms.filter((r) => r.room_id !== roomId),
      }));

      const newItems = prev.items.filter(
        (i) => !(i.floor_number === floorNumber && i.room_id === roomId)
      );

      return {
        ...prev,
        floorDetails: updatedFloors,
        items: newItems,
      };
    });
  };
  const handleSubmit = async () => {
    if (!formData.customerId) return message.error("Select a customer");
    if (!formData.name.trim()) return message.error("Enter project name");
    if (formData.items.length === 0)
      return message.error("Add at least one product");

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

  // Group items: floor → room
  const itemsByLocation = {};
  formData.items.forEach((item) => {
    const floorKey = item.floor_number || "Unassigned";
    const roomKey = item.room_id || "floor-level";
    if (!itemsByLocation[floorKey]) itemsByLocation[floorKey] = {};
    if (!itemsByLocation[floorKey][roomKey])
      itemsByLocation[floorKey][roomKey] = [];
    itemsByLocation[floorKey][roomKey].push(item);
  });

  // Totals
  const totalAmount = formData.items.reduce(
    (s, i) => s + i.quantity * i.price,
    0
  );
  const totalQty = formData.items.reduce((s, i) => s + i.quantity, 0);

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
          subtitle="Assign products to specific rooms (e.g., Master Bathroom, Kitchen) for precise planning"
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
                value={formData.customerId || undefined}
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

        {/* Floors & Rooms */}
        <Collapse accordion defaultActiveKey={["1"]}>
          {formData.floorDetails.map((floor) => {
            const floorItems = itemsByLocation[floor.floor_number] || {};
            const floorTotal = Object.values(floorItems)
              .flat()
              .reduce((s, i) => s + i.quantity * i.price, 0);

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
                      <HomeOutlined /> {floor.floor_name} ({floor.rooms.length}{" "}
                      rooms,{" "}
                      {Object.keys(floorItems).reduce(
                        (s, k) => s + floorItems[k].length,
                        0
                      )}{" "}
                      items)
                    </span>
                    <Tag color="blue">
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
                  {/* Add Room Button */}
                  <Button
                    type="dashed"
                    block
                    icon={<PlusOutlined />}
                    onClick={() => openRoomModal(floor)}
                  >
                    Add Room (Bathroom, Kitchen, etc.)
                  </Button>

                  {/* Rooms */}
                  {floor.rooms.length === 0 ? (
                    <Card size="small" title="No rooms defined yet">
                      <Text type="secondary">
                        Add rooms to assign products precisely
                      </Text>
                    </Card>
                  ) : (
                    floor.rooms.map((room) => {
                      const roomItems = floorItems[room.room_id] || [];
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
                              {room.room_size && (
                                <Text type="secondary">
                                  {" "}
                                  • {room.room_size}
                                </Text>
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
                                  deleteRoom(floor.floor_number, room.room_id)
                                }
                              />
                            </Space>
                          }
                        >
                          {/* Product Search for this room */}
                          <Select
                            showSearch
                            placeholder="Search & add product to this room..."
                            onSearch={handleProductSearch}
                            onChange={(pid) =>
                              addProduct(floor.floor_number, room.room_id, pid)
                            }
                            value={null}
                            style={{ width: "100%", marginBottom: 16 }}
                            dropdownMatchSelectWidth={false}
                          >
                            {filteredProducts.map((p) => (
                              <Option
                                key={getProductId(p)}
                                value={getProductId(p)}
                              >
                                <div>
                                  <div
                                    style={{
                                      display: "flex",
                                      justifyContent: "space-between",
                                      width: "100%",
                                    }}
                                  >
                                    <div>
                                      <strong>
                                        {p.name?.trim()
                                          ? p.name.trim()
                                          : p.meta?.[
                                              "d11da9f9-3f2e-4536-8236-9671200cca4a"
                                            ]
                                          ? `(${p.meta["d11da9f9-3f2e-4536-8236-9671200cca4a"]})`
                                          : p.product_code || "Unnamed Product"}
                                      </strong>
                                      <br />
                                      <small style={{ color: "#888" }}>
                                        {p.product_code &&
                                          `Code: ${p.product_code}`}
                                        {p.product_code &&
                                          (p.name ||
                                            p.meta?.[
                                              "d11da9f9-3f2e-4536-8236-9671200cca4a"
                                            ]) &&
                                          " | "}
                                        {p.meta?.[
                                          "d11da9f9-3f2e-4536-8236-9671200cca4a"
                                        ] &&
                                          `Ref: ${p.meta["d11da9f9-3f2e-4536-8236-9671200cca4a"]}`}
                                      </small>
                                    </div>
                                    <div style={{ textAlign: "right" }}>
                                      <strong>
                                        ₹
                                        {Number(
                                          p.meta?.[
                                            "9ba862ef-f993-4873-95ef-1fef10036aa5"
                                          ] || 0
                                        ).toLocaleString("en-IN")}
                                      </strong>
                                    </div>
                                  </div>
                                  {p.product_code &&
                                    p.name &&
                                    ` (${p.product_code})`}
                                  {" — ₹"}
                                  {Number(
                                    p.meta?.[
                                      "9ba862ef-f993-4873-95ef-1fef10036aa5"
                                    ] || 0
                                  ).toLocaleString("en-IN")}
                                </div>
                              </Option>
                            ))}
                          </Select>

                          {/* Items Table */}
                          <Table
                            size="small"
                            pagination={false}
                            dataSource={roomItems}
                            rowKey={(record, index) =>
                              `${record.productId}-${record.floor_number}-${record.room_id}-${index}`
                            }
                            columns={[
                              { title: "Product", dataIndex: "name" },
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
                                render: (_, r) => `₹${r.price.toFixed(2)}`,
                              },
                              {
                                title: "Total",
                                render: (_, r) =>
                                  `₹${(r.quantity * r.price).toFixed(2)}`,
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

                          <div style={{ marginTop: 12, textAlign: "right" }}>
                            <Tag color="green">
                              Room Total: ₹{roomTotal.toLocaleString("en-IN")}
                            </Tag>
                          </div>
                        </Card>
                      );
                    })
                  )}

                  {/* Floor-level items (no room assigned) */}
                  {floorItems["floor-level"] &&
                    floorItems["floor-level"].length > 0 && (
                      <Card title="Unassigned to Room (Floor Level)">
                        <Table
                          size="small"
                          pagination={false}
                          dataSource={floorItems["floor-level"]}
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
                              render: (_, r) => `₹${r.price.toFixed(2)}`,
                            },
                            {
                              title: "Total",
                              render: (_, r) =>
                                `₹${(r.quantity * r.price).toFixed(2)}`,
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
                      </Card>
                    )}
                </Space>
              </Panel>
            );
          })}
        </Collapse>

        {/* Summary */}
        <div
          style={{
            marginTop: 32,
            padding: 24,
            background: "#f9f9f9",
            borderRadius: 8,
          }}
        >
          <Row gutter={32}>
            <Col>
              <Statistic title="Total Items" value={formData.items.length} />
            </Col>
            <Col>
              <Statistic title="Total Quantity" value={totalQty} />
            </Col>
            <Col>
              <Statistic
                title="Estimated Value (excl. GST)"
                value={`₹${totalAmount.toLocaleString("en-IN")}`}
              />
            </Col>
            <Col>
              <Statistic
                title="With 18% GST"
                value={`₹${(totalAmount * 1.18).toLocaleString("en-IN", {
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
            <Button
              size="large"
              icon={<FileTextOutlined />}
              type="dashed"
              disabled
            >
              Generate Quotation (Soon)
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
              <Input placeholder="e.g., Master Bathroom" />
            </Form.Item>
            <Form.Item name="room_type" label="Type">
              <Select placeholder="Select type">
                <Option value="Bathroom">Bathroom</Option>
                <Option value="Toilet">Toilet</Option>
                <Option value="Kitchen">Kitchen</Option>
                <Option value="Living Room">Living Room</Option>
                <Option value="Bedroom">Bedroom</Option>
                <Option value="Balcony">Balcony</Option>
                <Option value="General">General</Option>
              </Select>
            </Form.Item>
            <Form.Item name="room_size" label="Size (optional)">
              <Input placeholder="e.g., 8x6 ft" />
            </Form.Item>
            <Form.Item name="details" label="Details">
              <Input.TextArea placeholder="e.g., Attached to Master Bedroom" />
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </div>
  );
};

export default AddSiteMap;
