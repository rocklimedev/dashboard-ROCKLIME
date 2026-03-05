// src/pages/CreateProject.jsx
import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Steps,
  Button,
  message,
  Card,
  Tabs,
  Space,
  Alert,
  Row,
  Col,
  Spin,
  Divider,
  Typography,
  Select,
  Input,
  InputNumber,
  Table,
  Modal,
  Form,
  Badge,
  Tag,
  Statistic,
  Collapse,
  Empty,
  Tooltip,
} from "antd";
import {
  ArrowLeftOutlined,
  ArrowRightOutlined,
  SaveOutlined,
  PlusOutlined,
  DeleteOutlined,
  HomeOutlined,
  EyeInvisibleOutlined,
  SearchOutlined,
  EditOutlined,
} from "@ant-design/icons";
import { v4 as uuidv4 } from "uuid";
import { debounce } from "lodash";

import PageHeader from "../Common/PageHeader";
import { useCreateQuotationMutation } from "../../api/quotationApi";
import { useCreateSiteMapMutation } from "../../api/siteMapApi";
import { useGetCustomersQuery } from "../../api/customerApi";
import {
  useSearchProductsQuery,
  useGetAllProductsQuery,
} from "../../api/productApi";

const { Title, Text } = Typography;
const { Option } = Select;
const { Panel } = Collapse;
const { TabPane } = Tabs;

export default function CreateProject() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const customerIdFromUrl = searchParams.get("customerId");

  // ── API ───────────────────────────────────────────────────────
  const { data: customersData, isLoading: customersLoading } =
    useGetCustomersQuery({ limit: 500 });
  const { data: productsResponse, isLoading: productsLoading } =
    useGetAllProductsQuery();

  const [createQuotation, { isLoading: creatingQuotation }] =
    useCreateQuotationMutation();
  const [createSiteMap, { isLoading: creatingSiteMap }] =
    useCreateSiteMapMutation();

  const customers = customersData?.data || [];
  const allProducts = productsResponse?.data || [];

  // ── Wizard Step ───────────────────────────────────────────────
  const [currentStep, setCurrentStep] = useState(0);

  // ── Main form state ───────────────────────────────────────────
  const [project, setProject] = useState({
    customerId: customerIdFromUrl || "",
    projectName: "",
    quotationDate: new Date(),
    dueDate: null,
    gst: 18,

    totalFloors: 1,
    floorDetails: [],

    items: [], // unified → visible + concealed (we'll strip room_id on save)
  });

  // ── Product search ────────────────────────────────────────────
  const [searchTerm, setSearchTerm] = useState("");
  const { data: searchResult = [], isFetching: searching } =
    useSearchProductsQuery(searchTerm.trim(), {
      skip: searchTerm.trim().length < 2,
    });

  const debouncedSearch = debounce((val) => setSearchTerm(val.trim()), 400);

  // ── Modals ────────────────────────────────────────────────────
  const [roomModal, setRoomModal] = useState({
    visible: false,
    floor: null,
    room: null,
  });

  const [assignModal, setAssignModal] = useState({
    visible: false,
    itemId: null,
  });

  const [selectedAssignFloor, setSelectedAssignFloor] = useState(null);
  const [selectedAssignRoom, setSelectedAssignRoom] = useState(null);

  const [roomForm] = Form.useForm();

  // ── Reset assignment modal selections ─────────────────────────
  useEffect(() => {
    if (assignModal.visible) {
      const item = project.items.find((i) => i.id === assignModal.itemId);
      if (item) {
        setSelectedAssignFloor(item.floor_number || null);
        setSelectedAssignRoom(item.room_id || null);
      } else {
        setSelectedAssignFloor(null);
        setSelectedAssignRoom(null);
      }
    } else {
      setSelectedAssignFloor(null);
      setSelectedAssignRoom(null);
    }
  }, [assignModal.visible, assignModal.itemId, project.items]);

  // ── Auto-create Ground floor ─────────────────────────────────
  useEffect(() => {
    if (project.floorDetails.length === 0 && project.totalFloors >= 1) {
      setProject((prev) => ({
        ...prev,
        floorDetails: [
          {
            floor_number: 1,
            floor_name: "Ground Floor",
            rooms: [],
          },
        ],
      }));
    }
  }, [project.totalFloors]);

  // ── Auto-sync floors count ────────────────────────────────────
  useEffect(() => {
    let floors = [...project.floorDetails];

    while (floors.length < project.totalFloors) {
      const num = floors.length + 1;
      const name =
        num === 1
          ? "Ground Floor"
          : `${num - 1}${["st", "nd", "rd"][(num - 2) % 3] || "th"} Floor`;
      floors.push({
        floor_number: num,
        floor_name: name,
        rooms: [],
      });
    }

    if (floors.length > project.totalFloors) {
      floors = floors.slice(0, project.totalFloors);
    }

    setProject((prev) => ({ ...prev, floorDetails: floors }));
  }, [project.totalFloors]);

  // ── Calculations ──────────────────────────────────────────────
  const totals = useMemo(() => {
    let visible = 0;
    let concealed = 0;

    project.items.forEach((item) => {
      const line = item.quantity * item.price;
      if (item.isConcealed) concealed += line;
      else visible += line;
    });

    const subtotal = visible + concealed;
    const gstAmount = subtotal * (project.gst / 100);
    const grandTotal = subtotal + gstAmount;

    return {
      visible,
      concealed,
      subtotal: Math.round(subtotal),
      gstAmount: Math.round(gstAmount),
      grandTotal: Math.round(grandTotal),
    };
  }, [project.items, project.gst]);

  // ── Helpers ───────────────────────────────────────────────────
  const addProduct = (product, isConcealed = false) => {
    const price = Number(
      product.meta?.["9ba862ef-f993-4873-95ef-1fef10036aa5"] || 0,
    );

    const newItem = {
      id: uuidv4(),
      productId: product.id || product.productId,
      name: product.name || "Unknown",
      quantity: 1,
      price,
      imageUrl: product.images?.[0]?.url || null,
      floor_number: null,
      room_id: null, // kept internally for UI
      isConcealed,
    };

    setProject((prev) => ({
      ...prev,
      items: [...prev.items, newItem],
    }));
    setSearchTerm("");
  };

  const updateItem = (id, field, value) => {
    setProject((prev) => ({
      ...prev,
      items: prev.items.map((item) =>
        item.id === id ? { ...item, [field]: value } : item,
      ),
    }));
  };

  const removeItem = (id) => {
    setProject((prev) => ({
      ...prev,
      items: prev.items.filter((i) => i.id !== id),
    }));
  };

  const assignItem = (itemId, floor_number, room_id = null) => {
    setProject((prev) => ({
      ...prev,
      items: prev.items.map((i) =>
        i.id === itemId ? { ...i, floor_number, room_id } : i,
      ),
    }));
  };

  // ── Submit both ───────────────────────────────────────────────
  const handleSave = async () => {
    if (!project.customerId) return message.error("Customer is required");
    if (!project.projectName.trim())
      return message.error("Project name is required");
    if (project.items.length === 0)
      return message.error("Add at least one product");

    // Prepare cleaned items — keep room_id for UI, but STRIP it from backend payload
    const cleanedItemsForBackend = project.items.map((item) => {
      const { room_id, ...rest } = item; // remove room_id completely
      return rest;
    });

    const quotationPayload = {
      customerId: project.customerId,
      document_title: project.projectName,
      quotation_date: project.quotationDate?.toISOString().split("T")[0],
      due_date: project.dueDate?.toISOString().split("T")[0] || null,
      gst: project.gst,
      products: project.items
        .filter((i) => !i.isConcealed)
        .map((i) => ({
          productId: i.productId,
          name: i.name,
          quantity: i.quantity,
          price: i.price,
          discount: 0,
          discountType: "percent",
          total: i.quantity * i.price,
        })),
    };

    const siteMapPayload = {
      customerId: project.customerId,
      name: project.projectName,
      totalFloors: project.totalFloors,
      floorDetails: project.floorDetails,
      items: cleanedItemsForBackend.map((i) => ({
        productId: i.productId,
        name: i.name,
        quantity: i.quantity,
        price: i.price,
        floor_number: i.floor_number,
        isConcealed: i.isConcealed,
        // NO room_id included — deliberately omitted
      })),
    };

    try {
      const quotRes = await createQuotation(quotationPayload).unwrap();

      const quotationId = quotRes?.quotation?.quotationId;

      if (!quotationId) {
        throw new Error("No quotation ID returned from server");
      }

      const siteRes = await createSiteMap({
        ...siteMapPayload,
        quotationId,
      }).unwrap();

      message.success("Project, Quotation & Site Map created successfully!");
      navigate("/projects/list"); // adjust route as needed
    } catch (err) {
      message.error(
        err?.data?.message ||
          err?.message ||
          "Failed to create project – check console/server logs",
      );
    }
  };

  const steps = [
    { title: "Customer & Info" },
    { title: "Rooms & Floors" },
    { title: "Products" },
    { title: "Review" },
  ];

  if (customersLoading || productsLoading) {
    return (
      <Spin
        tip="Loading data..."
        size="large"
        style={{ margin: "120px auto", display: "block" }}
      />
    );
  }

  return (
    <div className="page-wrapper">
      <div className="content">
        <PageHeader
          title="Create New Project"
          subtitle="Quotation + Site Layout"
          exportOptions={{ pdf: false, excel: false }}
          extra={
            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
              Back
            </Button>
          }
        />

        <Card style={{ marginTop: 24 }}>
          <Steps current={currentStep} style={{ marginBottom: 40 }}>
            {steps.map((item) => (
              <Steps.Step key={item.title} title={item.title} />
            ))}
          </Steps>

          {/* STEP 1 – Customer & Basic Info */}
          {currentStep === 0 && (
            <>
              <Title level={4}>Customer & Project Information</Title>

              <Row gutter={24}>
                <Col xs={24} md={12}>
                  <label style={{ fontWeight: 500 }}>
                    Customer <span style={{ color: "red" }}>*</span>
                  </label>
                  <Select
                    showSearch
                    placeholder="Select customer"
                    value={project.customerId || undefined}
                    onChange={(v) =>
                      setProject((p) => ({ ...p, customerId: v }))
                    }
                    style={{ width: "100%", marginTop: 8 }}
                    size="large"
                  >
                    {customers.map((c) => (
                      <Option key={c.customerId} value={c.customerId}>
                        {c.name}
                      </Option>
                    ))}
                  </Select>
                </Col>

                <Col xs={24} md={12}>
                  <label style={{ fontWeight: 500 }}>
                    Project Name <span style={{ color: "red" }}>*</span>
                  </label>
                  <Input
                    size="large"
                    placeholder="e.g. Sharma 3BHK – Vasant Kunj"
                    value={project.projectName}
                    onChange={(e) =>
                      setProject((p) => ({ ...p, projectName: e.target.value }))
                    }
                    style={{ marginTop: 8 }}
                  />
                </Col>
              </Row>

              <Row gutter={16} style={{ marginTop: 24 }}>
                <Col xs={24} sm={8}>
                  <label>Quotation Date</label>
                  <Input
                    type="date"
                    value={
                      project.quotationDate?.toISOString().split("T")[0] || ""
                    }
                    onChange={(e) =>
                      setProject((p) => ({
                        ...p,
                        quotationDate: e.target.value
                          ? new Date(e.target.value)
                          : null,
                      }))
                    }
                  />
                </Col>
                <Col xs={24} sm={8}>
                  <label>Due Date</label>
                  <Input
                    type="date"
                    value={project.dueDate?.toISOString().split("T")[0] || ""}
                    onChange={(e) =>
                      setProject((p) => ({
                        ...p,
                        dueDate: e.target.value
                          ? new Date(e.target.value)
                          : null,
                      }))
                    }
                  />
                </Col>
                <Col xs={24} sm={8}>
                  <label>GST Rate (%)</label>
                  <InputNumber
                    min={0}
                    max={100}
                    value={project.gst}
                    onChange={(v) => setProject((p) => ({ ...p, gst: v }))}
                    style={{ width: "100%" }}
                  />
                </Col>
              </Row>
            </>
          )}

          {/* STEP 2 – Rooms & Floors (rooms kept for UX) */}
          {currentStep === 1 && (
            <>
              <Title level={4}>Define Floors & Rooms</Title>

              <Row gutter={16} style={{ marginBottom: 24 }}>
                <Col xs={24} sm={8} md={6}>
                  <label>Total Floors</label>
                  <InputNumber
                    min={1}
                    max={30}
                    value={project.totalFloors}
                    onChange={(v) =>
                      setProject((p) => ({ ...p, totalFloors: v }))
                    }
                    style={{ width: "100%" }}
                  />
                </Col>
              </Row>

              <Collapse accordion defaultActiveKey={["1"]}>
                {project.floorDetails.map((floor) => (
                  <Panel
                    header={
                      <Space>
                        <HomeOutlined style={{ color: "#1890ff" }} />
                        <strong>{floor.floor_name}</strong>
                      </Space>
                    }
                    key={floor.floor_number}
                  >
                    <Button
                      type="dashed"
                      icon={<PlusOutlined />}
                      onClick={() =>
                        setRoomModal({ visible: true, floor, room: null })
                      }
                      style={{ marginBottom: 16 }}
                    >
                      Add Room
                    </Button>

                    {floor.rooms?.length === 0 ? (
                      <Empty description="No rooms added yet" />
                    ) : (
                      <Row gutter={[16, 16]}>
                        {floor.rooms.map((room) => (
                          <Col xs={24} sm={12} md={8} key={room.id}>
                            <Card
                              size="small"
                              title={
                                <Space>
                                  {room.name}
                                  {room.type && (
                                    <Tag color="blue">{room.type}</Tag>
                                  )}
                                </Space>
                              }
                              extra={
                                <Button
                                  danger
                                  size="small"
                                  icon={<DeleteOutlined />}
                                  onClick={() => {
                                    setProject((p) => ({
                                      ...p,
                                      floorDetails: p.floorDetails.map((f) =>
                                        f.floor_number === floor.floor_number
                                          ? {
                                              ...f,
                                              rooms: f.rooms.filter(
                                                (r) => r.id !== room.id,
                                              ),
                                            }
                                          : f,
                                      ),
                                      // When room deleted → clear room_id from items (but keep floor)
                                      items: p.items.map((i) =>
                                        i.room_id === room.id
                                          ? { ...i, room_id: null }
                                          : i,
                                      ),
                                    }));
                                  }}
                                />
                              }
                            >
                              <Text type="secondary">{room.size || "—"}</Text>
                            </Card>
                          </Col>
                        ))}
                      </Row>
                    )}
                  </Panel>
                ))}
              </Collapse>
            </>
          )}

          {/* STEP 3 – Products */}
          {currentStep === 2 && (
            <>
              <Title level={4}>Add Products & Assign Locations</Title>

              <Tabs defaultActiveKey="1">
                <TabPane tab="Visible Products" key="1">
                  <Select
                    showSearch
                    placeholder="Search product to add..."
                    onSearch={debouncedSearch}
                    onChange={(val) => {
                      const prod = searchResult.find(
                        (p) => (p.id || p.productId) === val,
                      );
                      if (prod) addProduct(prod, false);
                    }}
                    filterOption={false}
                    style={{ width: "100%", marginBottom: 16 }}
                    size="large"
                    notFoundContent={searching ? <Spin /> : "No results"}
                  >
                    {searchResult.map((p) => {
                      const price = Number(
                        p.meta?.["9ba862ef-f993-4873-95ef-1fef10036aa5"] || 0,
                      );
                      return (
                        <Option
                          key={p.id || p.productId}
                          value={p.id || p.productId}
                        >
                          {p.name} — ₹{price.toLocaleString()}
                        </Option>
                      );
                    })}
                  </Select>

                  <Table
                    dataSource={project.items.filter((i) => !i.isConcealed)}
                    rowKey="id"
                    pagination={false}
                    size="middle"
                  >
                    <Table.Column title="Product" dataIndex="name" />
                    <Table.Column
                      title="Qty"
                      render={(_, r) => (
                        <InputNumber
                          min={1}
                          value={r.quantity}
                          onChange={(v) => updateItem(r.id, "quantity", v)}
                        />
                      )}
                    />
                    <Table.Column
                      title="Location"
                      render={(_, record) => {
                        if (!record.floor_number)
                          return <Tag color="orange">Unassigned</Tag>;

                        const floor = project.floorDetails.find(
                          (f) => f.floor_number === record.floor_number,
                        );
                        const room = record.room_id
                          ? floor?.rooms?.find((r) => r.id === record.room_id)
                          : null;

                        return (
                          <Tag color="green">
                            {floor?.floor_name}
                            {room ? ` → ${room.name}` : ""}
                          </Tag>
                        );
                      }}
                    />
                    <Table.Column
                      title="Action"
                      width={160}
                      render={(_, r) => (
                        <Space>
                          <Button
                            size="small"
                            icon={<HomeOutlined />}
                            onClick={() =>
                              setAssignModal({ visible: true, itemId: r.id })
                            }
                          >
                            Assign
                          </Button>
                          <Button
                            danger
                            size="small"
                            icon={<DeleteOutlined />}
                            onClick={() => removeItem(r.id)}
                          />
                        </Space>
                      )}
                    />
                  </Table>
                </TabPane>

                <TabPane tab="Concealed Works" key="2">
                  <Select
                    showSearch
                    placeholder="Add concealed product..."
                    onSearch={debouncedSearch}
                    onChange={(val) => {
                      const prod = searchResult.find(
                        (p) => (p.id || p.productId) === val,
                      );
                      if (prod) addProduct(prod, true);
                    }}
                    filterOption={false}
                    style={{ width: "100%", marginBottom: 16 }}
                    size="large"
                  >
                    {searchResult.map((p) => {
                      const price = Number(
                        p.meta?.["9ba862ef-f993-4873-95ef-1fef10036aa5"] || 0,
                      );
                      return (
                        <Option
                          key={p.id || p.productId}
                          value={p.id || p.productId}
                        >
                          {p.name} — ₹{price.toLocaleString()}
                        </Option>
                      );
                    })}
                  </Select>

                  <Table
                    dataSource={project.items.filter((i) => i.isConcealed)}
                    rowKey="id"
                    pagination={false}
                  >
                    <Table.Column title="Product" dataIndex="name" />
                    <Table.Column title="Qty" dataIndex="quantity" />
                    <Table.Column
                      title="Location"
                      render={(_, r) => {
                        const floor = project.floorDetails.find(
                          (f) => f.floor_number === r.floor_number,
                        );
                        const room = r.room_id
                          ? floor?.rooms?.find((rm) => rm.id === r.room_id)
                          : null;
                        return floor ? (
                          <Tag color="volcano">
                            {floor.floor_name}
                            {room ? ` → ${room.name}` : ""}
                          </Tag>
                        ) : (
                          <Tag color="orange">Unassigned</Tag>
                        );
                      }}
                    />
                    <Table.Column
                      title=""
                      render={(_, r) => (
                        <Button
                          danger
                          size="small"
                          icon={<DeleteOutlined />}
                          onClick={() => removeItem(r.id)}
                        />
                      )}
                    />
                  </Table>
                </TabPane>
              </Tabs>
            </>
          )}

          {/* STEP 4 – Review */}
          {currentStep === 3 && (
            <>
              <Title level={4}>Review & Finalize</Title>

              <Row gutter={24}>
                <Col xs={24} md={12}>
                  <Card title="Project Information">
                    <p>
                      <strong>Customer:</strong>{" "}
                      {customers.find(
                        (c) => c.customerId === project.customerId,
                      )?.name || "—"}
                    </p>
                    <p>
                      <strong>Project:</strong> {project.projectName || "—"}
                    </p>
                    <p>
                      <strong>Floors:</strong> {project.totalFloors}
                    </p>
                    <p>
                      <strong>Rooms total:</strong>{" "}
                      {project.floorDetails.reduce(
                        (sum, f) => sum + (f.rooms?.length || 0),
                        0,
                      )}
                    </p>
                  </Card>
                </Col>

                <Col xs={24} md={12}>
                  <Card title="Financial Summary">
                    <Statistic
                      title="Visible Products"
                      value={totals.visible}
                      prefix="₹"
                    />
                    <Statistic
                      title="Concealed Works"
                      value={totals.concealed}
                      prefix="₹"
                      style={{ marginTop: 12 }}
                    />
                    <Divider />
                    <Statistic
                      title="Subtotal"
                      value={totals.subtotal}
                      prefix="₹"
                    />
                    <Statistic
                      title={`GST (${project.gst}%)`}
                      value={totals.gstAmount}
                      prefix="₹"
                    />
                    <Statistic
                      title="Grand Total"
                      value={totals.grandTotal}
                      prefix="₹"
                      valueStyle={{ fontSize: 24, color: "#1890ff" }}
                      style={{ marginTop: 16 }}
                    />
                  </Card>
                </Col>
              </Row>

              {project.items.some((i) => !i.floor_number && !i.isConcealed) && (
                <Alert
                  style={{ marginTop: 24 }}
                  message="Warning"
                  description="Some visible products are not yet assigned to any floor."
                  type="warning"
                  showIcon
                />
              )}
            </>
          )}

          <Divider />

          <div style={{ textAlign: "right", marginTop: 32 }}>
            <Space size="middle">
              {currentStep > 0 && (
                <Button onClick={() => setCurrentStep(currentStep - 1)}>
                  Previous
                </Button>
              )}

              {currentStep < 3 ? (
                <Button
                  type="primary"
                  onClick={() => setCurrentStep(currentStep + 1)}
                  disabled={
                    (currentStep === 0 &&
                      (!project.customerId || !project.projectName?.trim())) ||
                    (currentStep === 1 && project.totalFloors < 1)
                  }
                >
                  Next <ArrowRightOutlined />
                </Button>
              ) : (
                <Button
                  type="primary"
                  icon={<SaveOutlined />}
                  size="large"
                  loading={creatingQuotation || creatingSiteMap}
                  onClick={handleSave}
                >
                  Create Quotation & Site Map
                </Button>
              )}
            </Space>
          </div>
        </Card>

        {/* ── Room Modal (still used for UI) ──────────────────────── */}
        <Modal
          title={roomModal.room ? "Edit Room" : "Add Room"}
          open={roomModal.visible}
          onOk={() => roomForm.submit()}
          onCancel={() => {
            setRoomModal({ visible: false });
            roomForm.resetFields();
          }}
          okText="Save Room"
        >
          <Form
            form={roomForm}
            layout="vertical"
            onFinish={(values) => {
              const newRoom = {
                id: uuidv4(),
                name: values.name,
                type: values.type,
                size: values.size || "",
              };

              setProject((prev) => ({
                ...prev,
                floorDetails: prev.floorDetails.map((f) =>
                  f.floor_number === roomModal.floor.floor_number
                    ? {
                        ...f,
                        rooms: roomModal.room
                          ? f.rooms.map((r) =>
                              r.id === roomModal.room.id ? newRoom : r,
                            )
                          : [...(f.rooms || []), newRoom],
                      }
                    : f,
                ),
              }));

              setRoomModal({ visible: false });
              roomForm.resetFields();
            }}
          >
            <Form.Item
              name="name"
              label="Room Name"
              rules={[{ required: true, message: "Room name is required" }]}
            >
              <Input placeholder="e.g. Master Bedroom" />
            </Form.Item>

            <Form.Item name="type" label="Room Type">
              <Select placeholder="Select type (optional)">
                <Option value="Bedroom">Bedroom</Option>
                <Option value="Living Room">Living / Drawing Room</Option>
                <Option value="Kitchen">Kitchen</Option>
                <Option value="Bathroom">Bathroom</Option>
                <Option value="Balcony">Balcony / Terrace</Option>
                <Option value="Puja Room">Puja Room</Option>
                <Option value="Other">Other</Option>
              </Select>
            </Form.Item>

            <Form.Item name="size" label="Size (optional)">
              <Input placeholder="e.g. 12 × 14 ft" />
            </Form.Item>
          </Form>
        </Modal>

        {/* ── Assign Modal (floor + room for UI only) ─────────────── */}
        <Modal
          title={`Assign: ${
            project.items.find((i) => i.id === assignModal.itemId)?.name ||
            "Product"
          }`}
          open={assignModal.visible}
          okText="Assign"
          cancelText="Cancel"
          onOk={() => {
            if (!selectedAssignFloor) {
              return message.error("Please select a floor");
            }

            assignItem(
              assignModal.itemId,
              selectedAssignFloor,
              selectedAssignRoom,
            );

            message.success("Product assigned!");
            setAssignModal({ visible: false, itemId: null });
          }}
          onCancel={() => setAssignModal({ visible: false, itemId: null })}
          width={500}
        >
          <div style={{ padding: "16px 0" }}>
            <label
              style={{ display: "block", marginBottom: 8, fontWeight: 500 }}
            >
              Select Floor <span style={{ color: "red" }}>*</span>
            </label>
            <Select
              placeholder="Choose floor"
              value={selectedAssignFloor}
              onChange={(val) => {
                setSelectedAssignFloor(val);
                setSelectedAssignRoom(null);
              }}
              style={{ width: "100%" }}
              size="large"
            >
              {project.floorDetails.map((f) => (
                <Option key={f.floor_number} value={f.floor_number}>
                  {f.floor_name}
                </Option>
              ))}
            </Select>

            {selectedAssignFloor && (
              <>
                <label
                  style={{
                    display: "block",
                    margin: "24px 0 8px",
                    fontWeight: 500,
                  }}
                >
                  Select Room (optional — for visualization only)
                </label>
                <Select
                  placeholder="Common area / whole floor"
                  value={selectedAssignRoom}
                  onChange={setSelectedAssignRoom}
                  allowClear
                  style={{ width: "100%" }}
                  size="large"
                >
                  {project.floorDetails
                    .find((f) => f.floor_number === selectedAssignFloor)
                    ?.rooms?.map((room) => (
                      <Option key={room.id} value={room.id}>
                        {room.name} {room.type ? `(${room.type})` : ""}
                      </Option>
                    ))}
                </Select>
              </>
            )}
          </div>
        </Modal>
      </div>
    </div>
  );
}
