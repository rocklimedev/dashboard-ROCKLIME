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
  SearchOutlined,
  InfoCircleOutlined,
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
import { useGetAllAddressesQuery } from "../../api/addressApi";

import AddAddress from "../Address/AddAddressModal";
import AddCustomerModal from "../Customers/AddCustomerModal";

const { Title, Text } = Typography;
const { Option } = Select;
const { Panel } = Collapse;

export default function CreateProject() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const customerIdFromUrl = searchParams.get("customerId");

  // ── API ───────────────────────────────────────────────────────
  const {
    data: customersData,
    isLoading: customersLoading,
    refetch: refetchCustomers,
  } = useGetCustomersQuery({ limit: 500 });
  const { data: productsResponse, isLoading: productsLoading } =
    useGetAllProductsQuery();
  const { data: addressesData, refetch: refetchAddresses } =
    useGetAllAddressesQuery();

  const [createQuotation, { isLoading: creatingQuotation }] =
    useCreateQuotationMutation();
  const [createSiteMap, { isLoading: creatingSiteMap }] =
    useCreateSiteMapMutation();

  const customers = customersData?.data || [];
  const allProducts = productsResponse?.data || [];

  // ── Modals ────────────────────────────────────────────────────
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);

  // ── Wizard ────────────────────────────────────────────────────
  const [currentStep, setCurrentStep] = useState(0);

  // ── Form State ────────────────────────────────────────────────
  const [project, setProject] = useState({
    customerId: customerIdFromUrl || "",
    projectName: "",
    quotationDate: new Date(),
    dueDate: null,
    gst: 18,
    shipTo: "",
    totalFloors: 1,
    floorDetails: [],
    items: [],
  });

  // ── Product Search ────────────────────────────────────────────
  const [searchTerm, setSearchTerm] = useState("");
  const { data: searchResult = [], isFetching: searching } =
    useSearchProductsQuery(searchTerm.trim(), {
      skip: searchTerm.trim().length < 2,
    });

  const debouncedSearch = debounce((val) => setSearchTerm(val.trim()), 400);

  // ── Room & Assign modals ──────────────────────────────────────
  const [roomModal, setRoomModal] = useState({
    visible: false,
    floor: null,
    room: null,
  });
  const [roomForm] = Form.useForm();

  const [assignModal, setAssignModal] = useState({
    visible: false,
    itemId: null,
  });
  const [selectedAssignFloor, setSelectedAssignFloor] = useState(null);
  const [selectedAssignRoom, setSelectedAssignRoom] = useState(null);

  // ── Address Helpers ───────────────────────────────────────────
  const shortAddress = (addr) => {
    if (!addr) return "—";
    const parts = [
      addr.street || "",
      addr.landmark ? `(${addr.landmark})` : "",
      addr.city || "",
      addr.pincode ? `- ${addr.pincode}` : "",
    ].filter(Boolean);
    return parts.join(", ") || "Unnamed address";
  };

  const filteredAddresses = useMemo(() => {
    if (!project.customerId) return [];
    return (addressesData || []).filter(
      (a) => a.customerId === project.customerId,
    );
  }, [addressesData, project.customerId]);

  // ── Auto-create & sync floors ─────────────────────────────────
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

  useEffect(() => {
    let floors = [...project.floorDetails];

    while (floors.length < project.totalFloors) {
      const num = floors.length + 1;
      const name =
        num === 1
          ? "Ground Floor"
          : `${num - 1}${["st", "nd", "rd"][(num - 2) % 3] || "th"} Floor`;
      floors.push({ floor_number: num, floor_name: name, rooms: [] });
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
      const qty = Number(item.quantity) || 1;
      const price = Number(item.price) || 0;
      const discount = Number(item.discount) || 0;
      const discountType = item.discountType || "percent";

      let lineTotal =
        discountType === "percent"
          ? qty * price * (1 - discount / 100)
          : qty * (price - discount);
      lineTotal = Math.max(0, lineTotal);

      if (item.isConcealed) concealed += lineTotal;
      else visible += lineTotal;
    });

    const subtotal = visible + concealed;
    const gstAmount = subtotal * (project.gst / 100);
    const grandTotal = subtotal + gstAmount;

    return {
      visible: Math.round(visible),
      concealed: Math.round(concealed),
      subtotal: Math.round(subtotal),
      gstAmount: Math.round(gstAmount),
      grandTotal: Math.round(grandTotal),
    };
  }, [project.items, project.gst]);

  // ── Product Actions ───────────────────────────────────────────
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
      discount: 0,
      discountType: "percent",
      imageUrl: product.images?.[0]?.url || null,
      floor_number: null,
      room_id: null,
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

  // ── Validation & Navigation ───────────────────────────────────
  const canGoNext = () => {
    if (currentStep === 0)
      return !!project.customerId && !!project.projectName.trim();
    if (currentStep === 1) return project.totalFloors >= 1;
    return true;
  };

  const handleNext = () => {
    if (!canGoNext()) {
      if (currentStep === 0) {
        if (!project.customerId) message.error("Please select a customer");
        if (!project.projectName.trim())
          message.error("Project name is required");
      }
      return;
    }
    setCurrentStep(currentStep + 1);
  };

  const handleSave = async () => {
    if (!project.customerId) return message.error("Customer is required");
    if (!project.projectName.trim())
      return message.error("Project name is required");
    if (project.items.length === 0)
      return message.error("Add at least one product");

    const cleanedItems = project.items.map(({ room_id, ...rest }) => rest);

    const quotationPayload = {
      customerId: project.customerId,
      document_title: project.projectName,
      quotation_date: project.quotationDate?.toISOString().split("T")[0],
      due_date: project.dueDate?.toISOString().split("T")[0] || null,
      gst: project.gst,
      shipTo: project.shipTo || null,
      products: project.items
        .filter((i) => !i.isConcealed)
        .map((i) => ({
          productId: i.productId,
          name: i.name,
          quantity: i.quantity,
          price: i.price,
          discount: Number(i.discount) || 0,
          discountType: i.discountType || "percent",
          total:
            i.discountType === "percent"
              ? i.quantity * i.price * (1 - (Number(i.discount) || 0) / 100)
              : i.quantity * (i.price - (Number(i.discount) || 0)),
        })),
    };

    const siteMapPayload = {
      customerId: project.customerId,
      name: project.projectName,
      totalFloors: project.totalFloors,
      floorDetails: project.floorDetails,
      items: cleanedItems.map((i) => ({
        productId: i.productId,
        name: i.name,
        quantity: i.quantity,
        price: i.price,
        floor_number: i.floor_number,
        isConcealed: i.isConcealed,
      })),
    };

    try {
      const quotRes = await createQuotation(quotationPayload).unwrap();
      const quotationId = quotRes?.quotation?.quotationId;

      if (!quotationId) throw new Error("No quotation ID returned");

      await createSiteMap({ ...siteMapPayload, quotationId }).unwrap();

      message.success("Project, Quotation & Site Map created successfully!");
      // navigate("/projects"); // optional
    } catch (err) {
      message.error(err?.data?.message || "Failed to create project");
      console.error(err);
    }
  };

  const steps = [
    { title: "Customer & Info" },
    { title: "Floors & Rooms" },
    { title: "Products" },
    { title: "Review" },
  ];

  if (customersLoading || productsLoading) {
    return (
      <Spin
        tip="Loading required data..."
        size="large"
        style={{ margin: "140px auto", display: "block" }}
      />
    );
  }

  // ── Helper: Small product table for review ────────────────────
  const renderProductTable = (items) => {
    const data = items.map((item) => {
      const qty = item.quantity || 1;
      const price = item.price || 0;
      const disc = item.discount || 0;
      const lineTotal =
        item.discountType === "percent"
          ? qty * price * (1 - disc / 100)
          : qty * (price - disc);

      return {
        key: item.id,
        name: item.name,
        qty,
        price,
        discount: `${disc}${item.discountType === "percent" ? "%" : "₹"}`,
        total: Math.round(lineTotal),
        type: item.isConcealed ? "concealed" : "visible",
      };
    });

    return (
      <Table
        dataSource={data}
        size="small"
        pagination={false}
        style={{ marginTop: 12 }}
        rowClassName={(record) =>
          record.type === "concealed" ? "review-concealed-row" : ""
        }
      >
        <Table.Column title="Product" dataIndex="name" />
        <Table.Column title="Qty" dataIndex="qty" width={60} align="center" />
        <Table.Column
          title="Unit Price"
          render={(_, r) => `₹${r.price.toLocaleString()}`}
          width={100}
          align="right"
        />
        <Table.Column
          title="Disc"
          dataIndex="discount"
          width={80}
          align="center"
        />
        <Table.Column
          title="Line Total"
          render={(_, r) => `₹${r.total.toLocaleString()}`}
          width={110}
          align="right"
        />
      </Table>
    );
  };

  return (
    <div className="page-wrapper" style={{ paddingBottom: 120 }}>
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

          {/* ── STEP 1 ── */}
          {currentStep === 0 && (
            <>
              <Title level={4}>Customer & Project Details</Title>
              <Row gutter={24}>
                <Col xs={24} lg={12}>
                  <label
                    style={{
                      fontWeight: 500,
                      display: "block",
                      marginBottom: 8,
                    }}
                  >
                    Customer <span style={{ color: "red" }}>*</span>
                  </label>
                  <Space.Compact style={{ width: "100%" }}>
                    <Select
                      showSearch
                      placeholder="Select customer"
                      value={project.customerId || undefined}
                      onChange={(v) =>
                        setProject((p) => ({ ...p, customerId: v, shipTo: "" }))
                      }
                      style={{ flex: 1 }}
                      size="large"
                      filterOption={(input, option) =>
                        (option.label || "")
                          .toLowerCase()
                          .includes(input.toLowerCase())
                      }
                    >
                      {customers.map((c) => {
                        const label = `${c.name}${c.mobile ? ` (${c.mobile})` : ""}`;
                        return (
                          <Option
                            key={c.customerId}
                            value={c.customerId}
                            label={label}
                          >
                            {label}
                          </Option>
                        );
                      })}
                    </Select>
                    <Button
                      type="primary"
                      icon={<PlusOutlined />}
                      onClick={() => setShowAddCustomerModal(true)}
                      size="large"
                    />
                  </Space.Compact>
                </Col>

                <Col xs={24} lg={12}>
                  <label
                    style={{
                      fontWeight: 500,
                      display: "block",
                      marginBottom: 8,
                    }}
                  >
                    Delivery Address
                  </label>
                  <Space.Compact style={{ width: "100%" }}>
                    <Select
                      placeholder={
                        !project.customerId
                          ? "Select customer first"
                          : filteredAddresses.length === 0
                            ? "No addresses — add one"
                            : "Select address"
                      }
                      value={project.shipTo || undefined}
                      onChange={(v) => setProject((p) => ({ ...p, shipTo: v }))}
                      disabled={!project.customerId}
                      style={{ flex: 1 }}
                      size="large"
                    >
                      {filteredAddresses.map((a) => (
                        <Option key={a.addressId} value={a.addressId}>
                          {shortAddress(a)}
                          {a.isDefault && (
                            <Tag color="green" style={{ marginLeft: 8 }}>
                              Default
                            </Tag>
                          )}
                        </Option>
                      ))}
                    </Select>
                    <Button
                      type="primary"
                      icon={<PlusOutlined />}
                      onClick={() => setShowAddressModal(true)}
                      disabled={!project.customerId}
                      size="large"
                    />
                  </Space.Compact>
                </Col>
              </Row>

              <Row gutter={16} style={{ marginTop: 24 }}>
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

          {/* ── STEP 2 ── */}
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

              <Collapse accordion>
                {project.floorDetails.map((floor) => (
                  <Panel
                    key={floor.floor_number}
                    header={
                      <Space>
                        <HomeOutlined style={{ color: "#1890ff" }} />
                        <strong>{floor.floor_name}</strong>
                        <Text type="secondary">
                          ({floor.rooms?.length || 0} rooms •{" "}
                          {
                            project.items.filter(
                              (i) => i.floor_number === floor.floor_number,
                            ).length
                          }{" "}
                          items)
                        </Text>
                      </Space>
                    }
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
                                      items: p.items.map((i) =>
                                        i.room_id === room.id
                                          ? { ...i, room_id: null }
                                          : i,
                                      ),
                                    }));
                                    message.success("Room removed");
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

          {/* ── STEP 3 ── */}
          {currentStep === 2 && (
            <>
              <Title level={4}>Add & Assign Products</Title>

              <Tabs defaultActiveKey="1">
                <Tabs.TabPane tab="Visible Products" key="1">
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
                      width={100}
                      render={(_, r) => (
                        <InputNumber
                          min={1}
                          value={r.quantity}
                          onChange={(v) => updateItem(r.id, "quantity", v)}
                        />
                      )}
                    />
                    <Table.Column
                      title="Price"
                      width={120}
                      render={(_, r) =>
                        `₹${Number(r.price || 0).toLocaleString()}`
                      }
                    />
                    <Table.Column
                      title="Discount"
                      width={180}
                      render={(_, r) => (
                        <Space.Compact>
                          <InputNumber
                            min={0}
                            max={r.discountType === "percent" ? 100 : r.price}
                            precision={2}
                            value={r.discount}
                            onChange={(v) => updateItem(r.id, "discount", v)}
                            style={{ width: 90 }}
                          />
                          <Select
                            value={r.discountType}
                            onChange={(v) =>
                              updateItem(r.id, "discountType", v)
                            }
                            style={{ width: 80 }}
                          >
                            <Option value="percent">%</Option>
                            <Option value="fixed">₹</Option>
                          </Select>
                        </Space.Compact>
                      )}
                    />
                    <Table.Column
                      title="Location"
                      render={(_, r) =>
                        r.floor_number ? (
                          <Tag color="green">
                            {project.floorDetails.find(
                              (f) => f.floor_number === r.floor_number,
                            )?.floor_name || "?"}
                            {r.room_id &&
                              ` → ${project.floorDetails.find((f) => f.floor_number === r.floor_number)?.rooms.find((rm) => rm.id === r.room_id)?.name || ""}`}
                          </Tag>
                        ) : (
                          <Tag color="orange">Unassigned</Tag>
                        )
                      }
                    />
                    <Table.Column
                      title="Action"
                      width={140}
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
                </Tabs.TabPane>

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
                    size="middle"
                  >
                    <Table.Column title="Product" dataIndex="name" />
                    <Table.Column
                      title="Qty"
                      width={100}
                      render={(_, r) => (
                        <InputNumber
                          min={1}
                          value={r.quantity}
                          onChange={(v) => updateItem(r.id, "quantity", v)}
                        />
                      )}
                    />
                    <Table.Column
                      title="Price"
                      width={120}
                      render={(_, r) =>
                        `₹${Number(r.price || 0).toLocaleString()}`
                      }
                    />
                    <Table.Column
                      title="Discount"
                      width={180}
                      render={(_, r) => (
                        <Space.Compact>
                          <InputNumber
                            min={0}
                            max={r.discountType === "percent" ? 100 : r.price}
                            precision={2}
                            value={r.discount}
                            onChange={(v) => updateItem(r.id, "discount", v)}
                            style={{ width: 90 }}
                          />
                          <Select
                            value={r.discountType}
                            onChange={(v) =>
                              updateItem(r.id, "discountType", v)
                            }
                            style={{ width: 80 }}
                          >
                            <Option value="percent">%</Option>
                            <Option value="fixed">₹</Option>
                          </Select>
                        </Space.Compact>
                      )}
                    />
                    <Table.Column
                      title="Location"
                      render={(_, r) => {
                        if (!r.floor_number)
                          return <Tag color="orange">Unassigned</Tag>;

                        const floor = project.floorDetails.find(
                          (f) => f.floor_number === r.floor_number,
                        );
                        const room = r.room_id
                          ? floor?.rooms?.find((rm) => rm.id === r.room_id)
                          : null;

                        return (
                          <Tag color="volcano">
                            {floor?.floor_name}
                            {room ? ` → ${room.name}` : ""}
                          </Tag>
                        );
                      }}
                    />
                    <Table.Column
                      title="Action"
                      width={140}
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
              </Tabs>
            </>
          )}

          {/* ── STEP 4 – Enhanced Review ── */}
          {currentStep === 3 && (
            <>
              <Title level={4}>Review & Final Confirmation</Title>

              <Row gutter={24}>
                {/* Left: Detailed Floor & Room Breakdown */}
                <Col xs={24} lg={14}>
                  <Card
                    title="Floor & Room wise Product Distribution"
                    size="small"
                    extra={
                      <Text type="secondary">
                        {project.items.filter((i) => i.floor_number).length} /{" "}
                        {project.items.length} items assigned
                      </Text>
                    }
                  >
                    {project.floorDetails.length === 0 ? (
                      <Empty description="No floors defined yet" />
                    ) : (
                      <Collapse
                        defaultActiveKey={project.floorDetails.map((f) =>
                          f.floor_number.toString(),
                        )}
                      >
                        {project.floorDetails.map((floor) => {
                          const floorItems = project.items.filter(
                            (i) => i.floor_number === floor.floor_number,
                          );
                          const visibleInFloor = floorItems.filter(
                            (i) => !i.isConcealed,
                          );
                          const concealedInFloor = floorItems.filter(
                            (i) => i.isConcealed,
                          );

                          const floorVisibleTotal = visibleInFloor.reduce(
                            (sum, i) => {
                              const qty = i.quantity || 1;
                              const price = i.price || 0;
                              const disc = i.discount || 0;
                              return (
                                sum +
                                (i.discountType === "percent"
                                  ? qty * price * (1 - disc / 100)
                                  : qty * (price - disc))
                              );
                            },
                            0,
                          );

                          const floorConcealedTotal = concealedInFloor.reduce(
                            (sum, i) => {
                              const qty = i.quantity || 1;
                              const price = i.price || 0;
                              const disc = i.discount || 0;
                              return (
                                sum +
                                (i.discountType === "percent"
                                  ? qty * price * (1 - disc / 100)
                                  : qty * (price - disc))
                              );
                            },
                            0,
                          );

                          const floorTotal = Math.round(
                            floorVisibleTotal + floorConcealedTotal,
                          );

                          // Group by room (null = whole floor)
                          const itemsByRoom = floorItems.reduce((acc, item) => {
                            const key = item.room_id || "whole-floor";
                            if (!acc[key]) acc[key] = [];
                            acc[key].push(item);
                            return acc;
                          }, {});

                          return (
                            <Panel
                              key={floor.floor_number}
                              header={
                                <Space>
                                  <HomeOutlined style={{ color: "#1890ff" }} />
                                  <strong>{floor.floor_name}</strong>
                                  <Tag color="blue">
                                    {floor.rooms?.length || 0} rooms
                                  </Tag>
                                  <Tag color="default">
                                    {floorItems.length} items
                                  </Tag>
                                  <Statistic
                                    title="Total"
                                    value={floorTotal}
                                    prefix="₹"
                                    size="small"
                                  />
                                </Space>
                              }
                              extra={
                                <Space>
                                  <Tag color="green">
                                    Visible: ₹{Math.round(floorVisibleTotal)}
                                  </Tag>
                                  <Tag color="volcano">
                                    Concealed: ₹
                                    {Math.round(floorConcealedTotal)}
                                  </Tag>
                                </Space>
                              }
                            >
                              {itemsByRoom["whole-floor"]?.length > 0 && (
                                <div style={{ marginBottom: 24 }}>
                                  <Text strong>Common / Whole Floor Items</Text>
                                  {renderProductTable(
                                    itemsByRoom["whole-floor"],
                                  )}
                                </div>
                              )}

                              {floor.rooms?.map((room) => {
                                const roomItems = itemsByRoom[room.id] || [];
                                if (roomItems.length === 0) return null;
                                return (
                                  <div
                                    key={room.id}
                                    style={{ marginBottom: 24 }}
                                  >
                                    <Text strong>
                                      {room.name}{" "}
                                      {room.type && (
                                        <Tag color="blue">{room.type}</Tag>
                                      )}
                                    </Text>
                                    {renderProductTable(roomItems)}
                                  </div>
                                );
                              })}

                              {floorItems.length === 0 && (
                                <Empty
                                  description="No products assigned to this floor yet"
                                  imageStyle={{ height: 60 }}
                                />
                              )}
                            </Panel>
                          );
                        })}
                      </Collapse>
                    )}

                    {project.items.some((i) => !i.floor_number) && (
                      <Alert
                        style={{ marginTop: 16 }}
                        message={`There are ${project.items.filter((i) => !i.floor_number).length} unassigned items`}
                        description="It's recommended to assign all visible products before finalizing."
                        type="warning"
                        showIcon
                      />
                    )}
                  </Card>
                </Col>

                {/* Right: Summary */}
                <Col xs={24} lg={10}>
                  <Card title="Financial Summary" size="small">
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
                      valueStyle={{
                        fontSize: 28,
                        color: "#1890ff",
                        fontWeight: 600,
                      }}
                      style={{ marginTop: 20 }}
                    />
                  </Card>

                  <Card
                    title="Project Overview"
                    size="small"
                    style={{ marginTop: 24 }}
                  >
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
                      <strong>Rooms:</strong>{" "}
                      {project.floorDetails.reduce(
                        (sum, f) => sum + (f.rooms?.length || 0),
                        0,
                      )}
                    </p>
                    <p>
                      <strong>Total Items:</strong> {project.items.length}
                    </p>
                    <p>
                      <strong>Assigned Items:</strong>{" "}
                      {project.items.filter((i) => i.floor_number).length}
                    </p>
                  </Card>
                </Col>
              </Row>

              {project.items.some((i) => !i.floor_number && !i.isConcealed) && (
                <Alert
                  style={{ marginTop: 24 }}
                  message="Action Required"
                  description="Some visible products are still unassigned. Please go back to Step 3 to assign them."
                  type="error"
                  showIcon
                />
              )}
            </>
          )}

          {/* Sticky Footer Navigation */}
          <div
            style={{
              position: "fixed",
              bottom: 0,
              left: 0,
              right: 0,
              background: "white",
              padding: "16px 24px",
              borderTop: "1px solid #f0f0f0",
              boxShadow: "0 -4px 12px rgba(0,0,0,0.08)",
              zIndex: 1000,
            }}
          >
            <div
              style={{ maxWidth: 1200, margin: "0 auto", textAlign: "right" }}
            >
              <Space size="middle">
                {currentStep > 0 && (
                  <Button
                    size="large"
                    onClick={() => setCurrentStep(currentStep - 1)}
                  >
                    Previous
                  </Button>
                )}

                {currentStep < 3 ? (
                  <Button
                    type="primary"
                    size="large"
                    onClick={handleNext}
                    disabled={!canGoNext()}
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
          </div>
        </Card>

        {/* ── Room Modal ──────────────────────────────────────────────── */}
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
                id: roomModal.room?.id || uuidv4(),
                name: values.name,
                type: values.type,
                size: values.size || "",
              };

              setProject((prev) => ({
                ...prev,
                floorDetails: prev.floorDetails.map((f) =>
                  f.floor_number === roomModal.floor?.floor_number
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
              message.success(roomModal.room ? "Room updated" : "Room added");
            }}
            initialValues={roomModal.room || {}}
          >
            <Form.Item
              name="name"
              label="Room Name"
              rules={[{ required: true }]}
            >
              <Input placeholder="e.g. Master Bedroom" />
            </Form.Item>

            <Form.Item name="type" label="Room Type">
              <Select placeholder="Optional">
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

        {/* ── Assign Modal ────────────────────────────────────────────── */}
        <Modal
          title={`Assign: ${project.items.find((i) => i.id === assignModal.itemId)?.name || "Product"}`}
          open={assignModal.visible}
          okText="Assign"
          onCancel={() => setAssignModal({ visible: false, itemId: null })}
          onOk={() => {
            if (!selectedAssignFloor)
              return message.error("Please select a floor");
            assignItem(
              assignModal.itemId,
              selectedAssignFloor,
              selectedAssignRoom,
            );
            message.success("Assigned successfully");
            setAssignModal({ visible: false, itemId: null });
          }}
          width={500}
        >
          <div style={{ padding: "16px 0" }}>
            <label
              style={{ display: "block", marginBottom: 8, fontWeight: 500 }}
            >
              Select Floor <span style={{ color: "red" }}>*</span>
            </label>
            <Select
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
                  value={selectedAssignRoom}
                  onChange={setSelectedAssignRoom}
                  allowClear
                  style={{ width: "100%" }}
                  size="large"
                  placeholder="Common area / whole floor"
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

        {/* ── Add Address Modal ───────────────────────────────────────── */}
        {showAddressModal && (
          <AddAddress
            visible={showAddressModal}
            onClose={() => setShowAddressModal(false)}
            onSave={(newAddrId) => {
              setProject((p) => ({ ...p, shipTo: newAddrId }));
              setShowAddressModal(false);
              refetchAddresses?.();
            }}
            selectedCustomer={project.customerId}
          />
        )}

        {/* ── Add Customer Modal ──────────────────────────────────────── */}
        {showAddCustomerModal && (
          <AddCustomerModal
            visible={showAddCustomerModal}
            onClose={() => setShowAddCustomerModal(false)}
            onCustomerCreated={(newCustomerId) => {
              setProject((prev) => ({ ...prev, customerId: newCustomerId }));
              refetchCustomers();
              message.success("New customer selected automatically");
            }}
          />
        )}
      </div>
    </div>
  );
}
