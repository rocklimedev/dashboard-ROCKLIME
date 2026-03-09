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
  Descriptions,
  ConfigProvider,
} from "antd";
import {
  ArrowLeftOutlined,
  ArrowRightOutlined,
  SaveOutlined,
  PlusOutlined,
  DeleteOutlined,
  HomeOutlined,
  UserOutlined,
  ApartmentOutlined,
  ShoppingOutlined,
  CheckCircleOutlined,
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

    const grandTotal = visible + concealed;

    return {
      visible: Math.round(visible),
      concealed: Math.round(concealed),
      grandTotal: Math.round(grandTotal),
    };
  }, [project.items]);

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
      navigate("/quotations/list");
    } catch (err) {
      message.error(err?.data?.message || "Failed to create project");
      console.error(err);
    }
  };

  const steps = [
    { title: "Customer", icon: <UserOutlined /> },
    { title: "Floors", icon: <ApartmentOutlined /> },
    { title: "Products", icon: <ShoppingOutlined /> },
    { title: "Review", icon: <CheckCircleOutlined /> },
  ];

  if (customersLoading || productsLoading) {
    return (
      <Spin
        tip="Loading required data..."
        size="large"
        style={{ margin: "180px auto", display: "block" }}
      />
    );
  }

  const renderProductTable = (items, isConcealed = false) => {
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
      };
    });

    return (
      <Table
        dataSource={data}
        size="small"
        pagination={false}
        rowClassName={() => (isConcealed ? "concealed-row" : "visible-row")}
      >
        <Table.Column title="Product" dataIndex="name" />
        <Table.Column title="Qty" dataIndex="qty" width={70} align="center" />
        <Table.Column
          title="Unit Price"
          render={(_, r) => `₹${r.price.toLocaleString()}`}
          width={110}
          align="right"
        />
        <Table.Column
          title="Disc"
          dataIndex="discount"
          width={90}
          align="center"
        />
        <Table.Column
          title="Line Total"
          render={(_, r) => `₹${r.total.toLocaleString()}`}
          width={120}
          align="right"
        />
      </Table>
    );
  };

  return (
    <div className="page-wrapper">
      <div className="content">
        <ConfigProvider
          theme={{
            token: {
              colorPrimary: "#4096ff",
              colorPrimaryHover: "#69b1ff",
              borderRadius: 10,
              controlHeightLG: 48,
              fontSizeLG: 16,
            },
          }}
        >
          <div
            style={{
              padding: "0 24px 160px",
              background: "#f9fafb",
              minHeight: "100vh",
            }}
          >
            <PageHeader
              title="Create New Project"
              subtitle="Quotation + Site Layout"
              extra={
                <Button
                  icon={<ArrowLeftOutlined />}
                  onClick={() => navigate(-1)}
                >
                  Back
                </Button>
              }
            />

            <Card
              bordered={false}
              style={{
                marginTop: 32,
                borderRadius: 16,
                boxShadow: "0 6px 24px rgba(0,0,0,0.08)",
                background: "white",
              }}
            >
              <Steps
                current={currentStep}
                labelPlacement="vertical"
                style={{ marginBottom: 56, padding: "0 8px" }}
              >
                {steps.map((item) => (
                  <Steps.Step
                    key={item.title}
                    title={item.title}
                    icon={item.icon}
                  />
                ))}
              </Steps>

              {/* STEP 1 ── Customer & Info */}
              {currentStep === 0 && (
                <Card
                  bordered={false}
                  style={{ background: "#fafafa", borderRadius: 12 }}
                >
                  <Title level={4} style={{ marginBottom: 32 }}>
                    Customer & Project Information
                  </Title>

                  <Row gutter={[24, 32]}>
                    <Col xs={24} lg={12}>
                      <Form.Item
                        label={
                          <Text strong>
                            Customer <span style={{ color: "#f5222d" }}>*</span>
                          </Text>
                        }
                      >
                        <Space.Compact block>
                          <Select
                            size="large"
                            showSearch
                            placeholder="Select or search customer"
                            value={project.customerId || undefined}
                            onChange={(v) =>
                              setProject((p) => ({
                                ...p,
                                customerId: v,
                                shipTo: "",
                              }))
                            }
                            style={{ flex: 1 }}
                            filterOption={(input, option) =>
                              (option?.label ?? "")
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
                          />
                        </Space.Compact>
                      </Form.Item>
                    </Col>

                    <Col xs={24} lg={12}>
                      <Form.Item label="Delivery Address">
                        <Space.Compact block>
                          <Select
                            size="large"
                            placeholder={
                              !project.customerId
                                ? "Select customer first"
                                : filteredAddresses.length === 0
                                  ? "No addresses — add one"
                                  : "Select address"
                            }
                            value={project.shipTo || undefined}
                            onChange={(v) =>
                              setProject((p) => ({ ...p, shipTo: v }))
                            }
                            disabled={!project.customerId}
                            style={{ flex: 1 }}
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
                            disabled={!project.customerId}
                            onClick={() => setShowAddressModal(true)}
                          />
                        </Space.Compact>
                      </Form.Item>
                    </Col>

                    <Col xs={24} md={12}>
                      <Form.Item
                        label={
                          <Text strong>
                            Project Name{" "}
                            <span style={{ color: "#f5222d" }}>*</span>
                          </Text>
                        }
                      >
                        <Input
                          size="large"
                          placeholder="e.g. Sharma Residence – 3BHK Modern"
                          value={project.projectName}
                          onChange={(e) =>
                            setProject((p) => ({
                              ...p,
                              projectName: e.target.value,
                            }))
                          }
                        />
                      </Form.Item>
                    </Col>

                    <Col xs={24} sm={12} md={6}>
                      <Form.Item label="Quotation Date">
                        <Input
                          size="large"
                          type="date"
                          value={
                            project.quotationDate
                              ?.toISOString()
                              .split("T")[0] || ""
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
                      </Form.Item>
                    </Col>

                    <Col xs={24} sm={12} md={6}>
                      <Form.Item label="Due Date">
                        <Input
                          size="large"
                          type="date"
                          value={
                            project.dueDate?.toISOString().split("T")[0] || ""
                          }
                          onChange={(e) =>
                            setProject((p) => ({
                              ...p,
                              dueDate: e.target.value
                                ? new Date(e.target.value)
                                : null,
                            }))
                          }
                        />
                      </Form.Item>
                    </Col>
                  </Row>
                </Card>
              )}

              {/* STEP 2 ── Floors & Rooms */}
              {currentStep === 1 && (
                <>
                  <Title level={4} style={{ marginBottom: 32 }}>
                    Define Floors & Rooms
                  </Title>

                  <Card bordered={false}>
                    <Row gutter={16} style={{ marginBottom: 32 }}>
                      <Col xs={24} sm={10} md={6}>
                        <Form.Item label={<Text strong>Total Floors</Text>}>
                          <InputNumber
                            min={1}
                            max={30}
                            size="large"
                            value={project.totalFloors}
                            onChange={(v) =>
                              setProject((p) => ({ ...p, totalFloors: v }))
                            }
                            style={{ width: "100%" }}
                          />
                        </Form.Item>
                      </Col>
                    </Row>

                    <Collapse ghost>
                      {project.floorDetails.map((floor) => (
                        <Panel
                          key={floor.floor_number}
                          header={
                            <Space size="middle">
                              <HomeOutlined
                                style={{ color: "#4096ff", fontSize: 18 }}
                              />
                              <Text strong style={{ fontSize: 16 }}>
                                {floor.floor_name}
                              </Text>
                              <Tag color="blue" bordered={false}>
                                {floor.rooms?.length || 0} rooms
                              </Tag>
                              <Tag color="default">
                                {
                                  project.items.filter(
                                    (i) =>
                                      i.floor_number === floor.floor_number,
                                  ).length
                                }{" "}
                                items
                              </Tag>
                            </Space>
                          }
                        >
                          <Button
                            type="dashed"
                            icon={<PlusOutlined />}
                            onClick={() =>
                              setRoomModal({ visible: true, floor, room: null })
                            }
                            style={{ marginBottom: 24 }}
                          >
                            Add Room
                          </Button>

                          {floor.rooms?.length === 0 ? (
                            <Empty
                              description="No rooms added yet"
                              imageStyle={{ height: 80 }}
                            />
                          ) : (
                            <Row gutter={[16, 16]}>
                              {floor.rooms.map((room) => (
                                <Col xs={24} sm={12} md={8} key={room.id}>
                                  <Card
                                    hoverable
                                    size="small"
                                    title={
                                      <Space>
                                        {room.name}
                                        {room.type && (
                                          <Tag color="geekblue">
                                            {room.type}
                                          </Tag>
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
                                            floorDetails: p.floorDetails.map(
                                              (f) =>
                                                f.floor_number ===
                                                floor.floor_number
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
                                    <Text type="secondary">
                                      {room.size || "—"}
                                    </Text>
                                  </Card>
                                </Col>
                              ))}
                            </Row>
                          )}
                        </Panel>
                      ))}
                    </Collapse>
                  </Card>
                </>
              )}

              {/* STEP 3 ── Products */}
              {currentStep === 2 && (
                <>
                  <Title level={4} style={{ marginBottom: 32 }}>
                    Add & Assign Products
                  </Title>

                  <Tabs defaultActiveKey="1" type="card" size="large">
                    <Tabs.TabPane tab="Visible Products" key="1">
                      <Select
                        showSearch
                        size="large"
                        placeholder="Search product to add..."
                        onSearch={debouncedSearch}
                        onChange={(val) => {
                          const prod = searchResult.find(
                            (p) => (p.id || p.productId) === val,
                          );
                          if (prod) addProduct(prod, false);
                        }}
                        filterOption={false}
                        style={{ width: "100%", marginBottom: 24 }}
                        notFoundContent={searching ? <Spin /> : "No results"}
                      >
                        {searchResult.map((p) => {
                          const price = Number(
                            p.meta?.["9ba862ef-f993-4873-95ef-1fef10036aa5"] ||
                              0,
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
                          align="right"
                        />
                        <Table.Column
                          title="Discount"
                          width={180}
                          render={(_, r) => (
                            <Space.Compact>
                              <InputNumber
                                min={0}
                                max={
                                  r.discountType === "percent" ? 100 : r.price
                                }
                                precision={2}
                                value={r.discount}
                                onChange={(v) =>
                                  updateItem(r.id, "discount", v)
                                }
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
                                  setAssignModal({
                                    visible: true,
                                    itemId: r.id,
                                  })
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

                    <Tabs.TabPane tab="Concealed Works" key="2">
                      <Select
                        showSearch
                        size="large"
                        placeholder="Search concealed product..."
                        onSearch={debouncedSearch}
                        onChange={(val) => {
                          const prod = searchResult.find(
                            (p) => (p.id || p.productId) === val,
                          );
                          if (prod) addProduct(prod, true);
                        }}
                        filterOption={false}
                        style={{ width: "100%", marginBottom: 24 }}
                        notFoundContent={searching ? <Spin /> : "No results"}
                      >
                        {searchResult.map((p) => {
                          const price = Number(
                            p.meta?.["9ba862ef-f993-4873-95ef-1fef10036aa5"] ||
                              0,
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
                          align="right"
                        />
                        <Table.Column
                          title="Discount"
                          width={180}
                          render={(_, r) => (
                            <Space.Compact>
                              <InputNumber
                                min={0}
                                max={
                                  r.discountType === "percent" ? 100 : r.price
                                }
                                precision={2}
                                value={r.discount}
                                onChange={(v) =>
                                  updateItem(r.id, "discount", v)
                                }
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
                              <Tag color="volcano">
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
                                  setAssignModal({
                                    visible: true,
                                    itemId: r.id,
                                  })
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
                  </Tabs>
                </>
              )}

              {/* STEP 4 ── Review */}
              {currentStep === 3 && (
                <>
                  <Title level={4} style={{ marginBottom: 32 }}>
                    Review & Final Confirmation
                  </Title>

                  <Row gutter={24}>
                    <Col xs={24} lg={15}>
                      <Card
                        title="Floor & Room wise Product Distribution"
                        bordered={false}
                        style={{ background: "#f8f9fa", borderRadius: 12 }}
                      >
                        <Collapse ghost>
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

                            const itemsByRoom = floorItems.reduce(
                              (acc, item) => {
                                const key = item.room_id || "whole-floor";
                                if (!acc[key]) acc[key] = [];
                                acc[key].push(item);
                                return acc;
                              },
                              {},
                            );

                            return (
                              <Panel
                                key={floor.floor_number}
                                header={
                                  <Space align="middle">
                                    <HomeOutlined
                                      style={{ color: "#4096ff" }}
                                    />
                                    <Text strong>{floor.floor_name}</Text>
                                    <Tag color="blue" bordered={false}>
                                      {floor.rooms?.length || 0} rooms
                                    </Tag>
                                    <Tag color="default">
                                      {floorItems.length} items
                                    </Tag>
                                    <Statistic
                                      title={null}
                                      value={floorTotal}
                                      prefix="₹"
                                      valueStyle={{
                                        fontSize: 18,
                                        color: "#52c41a",
                                      }}
                                    />
                                  </Space>
                                }
                                extra={
                                  <Space>
                                    <Tag color="green" bordered={false}>
                                      Visible: ₹{Math.round(floorVisibleTotal)}
                                    </Tag>
                                    <Tag color="volcano" bordered={false}>
                                      Concealed: ₹
                                      {Math.round(floorConcealedTotal)}
                                    </Tag>
                                  </Space>
                                }
                              >
                                {itemsByRoom["whole-floor"]?.length > 0 && (
                                  <div style={{ marginBottom: 24 }}>
                                    <Text strong>
                                      Whole Floor / Common Items
                                    </Text>
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
                                  <Empty description="No products assigned to this floor" />
                                )}
                              </Panel>
                            );
                          })}
                        </Collapse>

                        {project.items.some((i) => !i.floor_number) && (
                          <Alert
                            style={{ marginTop: 24 }}
                            message={`${
                              project.items.filter((i) => !i.floor_number)
                                .length
                            } items are still unassigned`}
                            type="warning"
                            showIcon
                          />
                        )}
                      </Card>
                    </Col>

                    <Col xs={24} lg={9}>
                      <Card
                        bordered={false}
                        style={{
                          background:
                            "linear-gradient(135deg, #e6f7ff 0%, #f0f5ff 100%)",
                          borderRadius: 12,
                        }}
                      >
                        <Statistic
                          title="Grand Total"
                          value={totals.grandTotal}
                          prefix="₹"
                          valueStyle={{
                            fontSize: 40,
                            color: "#1677ff",
                            fontWeight: 700,
                          }}
                        />
                        <Divider />
                        <Statistic
                          title="Visible Products"
                          value={totals.visible}
                          prefix="₹"
                        />
                        <Statistic
                          title="Concealed Works"
                          value={totals.concealed}
                          prefix="₹"
                          style={{ marginTop: 16 }}
                        />
                      </Card>

                      <Card
                        title="Project Overview"
                        bordered={false}
                        style={{ marginTop: 24 }}
                      >
                        <Descriptions column={1} size="small">
                          <Descriptions.Item label="Customer">
                            {customers.find(
                              (c) => c.customerId === project.customerId,
                            )?.name || "—"}
                          </Descriptions.Item>
                          <Descriptions.Item label="Project Name">
                            {project.projectName || "—"}
                          </Descriptions.Item>
                          <Descriptions.Item label="Floors">
                            {project.totalFloors}
                          </Descriptions.Item>
                          <Descriptions.Item label="Total Rooms">
                            {project.floorDetails.reduce(
                              (sum, f) => sum + (f.rooms?.length || 0),
                              0,
                            )}
                          </Descriptions.Item>
                          <Descriptions.Item label="Total Items">
                            {project.items.length}
                          </Descriptions.Item>
                          <Descriptions.Item label="Assigned Items">
                            {project.items.filter((i) => i.floor_number).length}{" "}
                            / {project.items.length}
                          </Descriptions.Item>
                        </Descriptions>
                      </Card>
                    </Col>
                  </Row>

                  {project.items.some(
                    (i) => !i.floor_number && !i.isConcealed,
                  ) && (
                    <Alert
                      style={{ marginTop: 32 }}
                      message="Action Required"
                      description="Some visible products are still unassigned. Please go back to Step 3 and assign them for accurate site mapping."
                      type="error"
                      showIcon
                    />
                  )}
                </>
              )}

              {/* Sticky Footer */}
              <div
                style={{
                  position: "fixed",
                  bottom: 0,
                  left: 0,
                  right: 0,
                  background: "white",
                  padding: "16px 32px",
                  borderTop: "1px solid #e8e8e8",
                  boxShadow: "0 -8px 24px rgba(0,0,0,0.08)",
                  zIndex: 1000,
                }}
              >
                <div
                  style={{
                    maxWidth: 1400,
                    margin: "0 auto",
                    textAlign: "right",
                  }}
                >
                  <Space size="large">
                    {currentStep > 0 && (
                      <Button
                        size="large"
                        onClick={() => setCurrentStep(currentStep - 1)}
                      >
                        ← Previous
                      </Button>
                    )}

                    {currentStep < 3 ? (
                      <Button
                        type="primary"
                        size="large"
                        onClick={handleNext}
                        disabled={!canGoNext()}
                      >
                        Next →
                      </Button>
                    ) : (
                      <Button
                        type="primary"
                        size="large"
                        icon={<SaveOutlined />}
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
              title={roomModal.room ? "Edit Room" : "Add New Room"}
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
                  message.success(
                    roomModal.room ? "Room updated" : "Room added",
                  );
                }}
                initialValues={roomModal.room || {}}
              >
                <Form.Item
                  name="name"
                  label="Room Name"
                  rules={[{ required: true }]}
                >
                  <Input size="large" placeholder="e.g. Master Bedroom" />
                </Form.Item>

                <Form.Item name="type" label="Room Type">
                  <Select
                    size="large"
                    placeholder="Optional (helps organization)"
                  >
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
                  <Input size="large" placeholder="e.g. 14 × 12 ft" />
                </Form.Item>
              </Form>
            </Modal>

            {/* ── Assign Modal ────────────────────────────────────────────── */}
            <Modal
              title={`Assign Product: ${
                project.items.find((i) => i.id === assignModal.itemId)?.name ||
                ""
              }`}
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
                message.success("Product assigned successfully");
                setAssignModal({ visible: false, itemId: null });
              }}
              width={520}
            >
              <div style={{ padding: "16px 0" }}>
                <Form.Item
                  label={
                    <Text strong>
                      Select Floor <span style={{ color: "#f5222d" }}>*</span>
                    </Text>
                  }
                >
                  <Select
                    size="large"
                    value={selectedAssignFloor}
                    onChange={(val) => {
                      setSelectedAssignFloor(val);
                      setSelectedAssignRoom(null);
                    }}
                    placeholder="Choose floor"
                  >
                    {project.floorDetails.map((f) => (
                      <Option key={f.floor_number} value={f.floor_number}>
                        {f.floor_name}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>

                {selectedAssignFloor && (
                  <Form.Item label="Select Room (optional — for better visualization)">
                    <Select
                      size="large"
                      value={selectedAssignRoom}
                      onChange={setSelectedAssignRoom}
                      allowClear
                      placeholder="Whole floor / common area"
                    >
                      {project.floorDetails
                        .find((f) => f.floor_number === selectedAssignFloor)
                        ?.rooms?.map((room) => (
                          <Option key={room.id} value={room.id}>
                            {room.name} {room.type ? `(${room.type})` : ""}
                          </Option>
                        ))}
                    </Select>
                  </Form.Item>
                )}
              </div>
            </Modal>

            {/* ── Add Address / Customer Modals ── */}
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

            {showAddCustomerModal && (
              <AddCustomerModal
                visible={showAddCustomerModal}
                onClose={() => setShowAddCustomerModal(false)}
                onCustomerCreated={(newCustomerId) => {
                  setProject((prev) => ({
                    ...prev,
                    customerId: newCustomerId,
                  }));
                  refetchCustomers();
                  message.success("New customer selected automatically");
                }}
              />
            )}
          </div>
        </ConfigProvider>
      </div>
    </div>
  );
}
