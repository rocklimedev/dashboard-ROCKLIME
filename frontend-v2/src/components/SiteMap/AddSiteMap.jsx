// src/components/SiteMap/AddSiteMap.jsx
import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Spin,
  message,
  Input,
  Select,
  Table,
  InputNumber,
  Space,
  Button,
  Modal,
  List,
  Typography,
  Form,
  Card,
  Row,
  Col,
  Collapse,
  Tag,
  Divider,
  Statistic,
} from "antd";
import {
  SearchOutlined,
  ArrowLeftOutlined,
  PlusOutlined,
  DeleteOutlined,
  SaveOutlined,
  FileTextOutlined,
  HomeOutlined,
} from "@ant-design/icons";
import { debounce } from "lodash";

import PageHeader from "../Common/PageHeader";
import {
  useCreateSiteMapMutation,
  useGetSiteMapByIdQuery,
  useUpdateSiteMapMutation,
  useGetSiteMapsByCustomerQuery,
} from "../../api/siteMapApi";
import { useGetAllProductsQuery } from "../../api/productApi";
import { useGetCustomersQuery } from "../../api/customerApi";
import { useGetProfileQuery } from "../../api/userApi";

const { Panel } = Collapse;
const { Text, Title } = Typography;
const { Option } = Select;

const AddSiteMap = () => {
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const navigate = useNavigate();

  // ────────────────────── RTK QUERIES ──────────────────────
  const { data: userData } = useGetProfileQuery();
  const { data: customersData, isLoading: isCustomersLoading } =
    useGetCustomersQuery();
  const { data: productsData, isLoading: isProductsLoading } =
    useGetAllProductsQuery();

  const { data: existingSiteMap, isLoading: isFetching } =
    useGetSiteMapByIdQuery(id, { skip: !isEditMode });

  const [createSiteMap, { isLoading: isCreating }] = useCreateSiteMapMutation();
  const [updateSiteMap, { isLoading: isUpdating }] = useUpdateSiteMapMutation();

  // ────────────────────── DATA ──────────────────────
  const userId = userData?.user?.userId || "unknown";
  const customers = customersData?.data || [];
  const products = productsData || [];

  // ────────────────────── STATE ──────────────────────
  const initialFormData = {
    customerId: "",
    name: "",
    siteSizeInBHK: "",
    totalFloors: 1,
    floorDetails: [],
    items: [],
    summaries: { overall: {}, perFloor: {}, perType: {} },
  };

  const [formData, setFormData] = useState(initialFormData);
  const [productSearch, setProductSearch] = useState("");
  const [filteredProducts, setFilteredProducts] = useState([]);

  // ────────────────────── EFFECTS ──────────────────────
  useEffect(() => {
    if (isEditMode && existingSiteMap) {
      setFormData({
        customerId: existingSiteMap.customerId || "",
        name: existingSiteMap.name || "",
        siteSizeInBHK: existingSiteMap.siteSizeInBHK || "",
        totalFloors: existingSiteMap.totalFloors || 1,
        floorDetails: existingSiteMap.floorDetails || [],
        items: existingSiteMap.items || [],
        summaries: existingSiteMap.summaries || initialFormData.summaries,
      });
    }
  }, [existingSiteMap, isEditMode]);

  // Initialize floorDetails when totalFloors changes
  useEffect(() => {
    if (!formData.totalFloors) return;

    const currentFloors = formData.floorDetails.length;
    let updatedFloors = [...formData.floorDetails];

    if (currentFloors < formData.totalFloors) {
      for (let i = currentFloors; i < formData.totalFloors; i++) {
        updatedFloors.push({
          floor_number: i + 1,
          floor_name: i === 0 ? "Ground Floor" : `${i}th Floor`,
          floor_size: "",
          details: "",
        });
      }
    } else if (currentFloors > formData.totalFloors) {
      updatedFloors = updatedFloors.slice(0, formData.totalFloors);
    }

    setFormData((prev) => ({ ...prev, floorDetails: updatedFloors }));
  }, [formData.totalFloors]);

  // Debounced product search
  const debouncedSearch = useCallback(
    debounce((val) => {
      if (!val.trim()) {
        setFilteredProducts([]);
        return;
      }
      const term = val.toLowerCase();
      const filtered = products
        .filter((p) => {
          const name = p.name?.toLowerCase() || "";
          const code = p.product_code?.toLowerCase() || "";
          const companyCode = (
            p.meta?.["d11da9f9-3f2e-4536-8236-9671200cca4a"] || ""
          ).toLowerCase();
          return (
            name.includes(term) ||
            code.includes(term) ||
            companyCode.includes(term)
          );
        })
        .slice(0, 10);
      setFilteredProducts(filtered);
    }, 300),
    [products]
  );

  // ────────────────────── PRODUCT HANDLERS ──────────────────────
  const addProductToFloor = (floorNumber, productId) => {
    const prod = products.find((p) => (p.id || p.productId) === productId);
    if (!prod) return message.error("Product not found");

    const price =
      Number(prod.meta?.["9ba862ef-f993-4873-95ef-1fef10036aa5"]) || 0;
    const productType = prod.category?.name || "Others"; // Adjust based on your product schema

    const newItem = {
      productId: prod.id || prod.productId,
      name: prod.name,
      imageUrl: prod.images?.[0] || null,
      quantity: 1,
      price,
      floor_number: floorNumber,
      productType,
    };

    setFormData((prev) => ({
      ...prev,
      items: [...prev.items, newItem],
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
    setFormData((prev) => {
      const copy = [...prev.items];
      copy[index].quantity = qty;
      return { ...prev, items: copy };
    });
  };

  // ────────────────────── SUBMIT ──────────────────────
  const handleSubmit = async () => {
    if (!formData.customerId) return message.error("Select a customer");
    if (!formData.name) return message.error("Enter project name");
    if (formData.items.length === 0)
      return message.error("Add at least one product");

    const payload = {
      ...formData,
      items: formData.items.map((item) => ({
        ...item,
        quantity: Number(item.quantity),
        price: Number(item.price),
      })),
    };

    try {
      if (isEditMode) {
        await updateSiteMap({ id, updatedSiteMap: payload }).unwrap();
        message.success("Site Map updated successfully");
      } else {
        await createSiteMap(payload).unwrap();
        message.success("Site Map created successfully");
      }
      navigate("/site-maps/list");
    } catch (err) {
      message.error(err.data?.message || "Failed to save Site Map");
    }
  };

  // ────────────────────── RENDER ──────────────────────
  if (isFetching || isCustomersLoading) {
    return (
      <div
        className="page-wrapper"
        style={{ padding: 40, textAlign: "center" }}
      >
        <Spin size="large" />
      </div>
    );
  }

  const groupedByFloor = {};
  formData.items.forEach((item) => {
    const floor = item.floor_number || "Unassigned";
    if (!groupedByFloor[floor]) groupedByFloor[floor] = [];
    groupedByFloor[floor].push(item);
  });

  const overall = formData.summaries?.overall || {
    totalQty: 0,
    totalAmount: 0,
  };
  const totalPages = Object.values(formData.summaries?.perType || {}).reduce(
    (acc, t) => acc + (t.pages || 0),
    0
  );

  return (
    <div className="page-wrapper">
      <div className="content">
        <PageHeader
          title={isEditMode ? "Edit Site Map" : "Create Site Map"}
          subtitle="Plan product allocation across floors"
        />

        <Space style={{ marginBottom: 16 }}>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
            Back
          </Button>
          <Button
            type="primary"
            icon={<FileTextOutlined />}
            onClick={handleSubmit}
            loading={isCreating || isUpdating}
          >
            {isEditMode ? "Update" : "Save"} Site Map
          </Button>
        </Space>

        <Form layout="vertical">
          {/* Project Info */}
          <Card title="Project Details" style={{ marginBottom: 16 }}>
            <Row gutter={16}>
              <Col xs={24} md={8}>
                <Form.Item label="Customer" required>
                  <Select
                    showSearch
                    placeholder="Select customer"
                    value={formData.customerId}
                    onChange={(v) =>
                      setFormData({ ...formData, customerId: v })
                    }
                    loading={isCustomersLoading}
                  >
                    {customers.map((c) => (
                      <Option key={c.customerId} value={c.customerId}>
                        {c.name}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col xs={24} md={8}>
                <Form.Item label="Project Name" required>
                  <Input
                    placeholder="e.g., Dhruv Verma Residence, Galaxy Mall"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={4}>
                <Form.Item label="Size">
                  <Input
                    placeholder="3BHK / 5000 sqft"
                    value={formData.siteSizeInBHK}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        siteSizeInBHK: e.target.value,
                      })
                    }
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={4}>
                <Form.Item label="Total Floors">
                  <InputNumber
                    min={1}
                    max={50}
                    style={{ width: "100%" }}
                    value={formData.totalFloors}
                    onChange={(v) =>
                      setFormData({ ...formData, totalFloors: v })
                    }
                  />
                </Form.Item>
              </Col>
            </Row>
          </Card>

          {/* Floor-wise Allocation */}
          <Collapse accordion defaultActiveKey="1">
            {formData.floorDetails.map((floor, idx) => (
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
                      {groupedByFloor[floor.floor_number]?.length || 0} items)
                    </span>
                    <Tag color="blue">
                      ₹
                      {(groupedByFloor[floor.floor_number] || [])
                        .reduce((sum, i) => sum + i.quantity * i.price, 0)
                        .toFixed(0)}
                    </Tag>
                  </div>
                }
              >
                <Space direction="vertical" style={{ width: "100%" }}>
                  <Select
                    showSearch
                    placeholder="Search & add product..."
                    onSearch={debouncedSearch}
                    onChange={(pid) =>
                      addProductToFloor(floor.floor_number, pid)
                    }
                    value={null}
                    style={{ width: "100%" }}
                    notFoundContent="Type to search"
                  >
                    {filteredProducts.map((p) => (
                      <Option
                        key={p.id || p.productId}
                        value={p.id || p.productId}
                      >
                        <div>
                          <strong>{p.name}</strong> ({p.product_code})
                          <Text type="secondary" style={{ marginLeft: 8 }}>
                            ₹
                            {Number(
                              p.meta?.[
                                "9ba862ef-f993-4873-95ef-1fef10036aa5"
                              ] || 0
                            ).toFixed(2)}
                          </Text>
                        </div>
                      </Option>
                    ))}
                  </Select>

                  <Table
                    size="small"
                    pagination={false}
                    dataSource={groupedByFloor[floor.floor_number] || []}
                    columns={[
                      { title: "Product", dataIndex: "name", key: "name" },
                      {
                        title: "Qty",
                        key: "qty",
                        width: 100,
                        render: (_, rec, idx) => (
                          <InputNumber
                            min={1}
                            size="small"
                            value={rec.quantity}
                            onChange={(v) =>
                              updateItemQty(formData.items.indexOf(rec), v)
                            }
                          />
                        ),
                      },
                      {
                        title: "Price",
                        dataIndex: "price",
                        key: "price",
                        render: (v) => `₹${Number(v).toFixed(2)}`,
                      },
                      {
                        title: "Total",
                        key: "total",
                        render: (_, rec) =>
                          `₹${(rec.quantity * rec.price).toFixed(2)}`,
                      },
                      {
                        title: "",
                        key: "action",
                        width: 60,
                        render: (_, __, idx) => (
                          <Button
                            danger
                            size="small"
                            icon={<DeleteOutlined />}
                            onClick={() =>
                              removeItem(formData.items.indexOf(__))
                            }
                          />
                        ),
                      },
                    ]}
                  />
                </Space>
              </Panel>
            ))}
          </Collapse>

          {/* Summary Bar (Sticky Bottom) */}
          <div
            style={{
              marginTop: 24,
              padding: "16px 24px",
              background: "#f9f9f9",
              borderRadius: 8,
              border: "1px solid #e8e8e8",
            }}
          >
            <Row gutter={24}>
              <Col span={6}>
                <Statistic
                  title="Total Products"
                  value={formData.items.length}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="Total Quantity"
                  value={overall.totalQty || 0}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="Total Amount"
                  value={`₹${(overall.totalAmount || 0).toFixed(0)}`}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="Estimated Pages (PDF)"
                  value={totalPages || 0}
                  suffix="pages"
                />
              </Col>
            </Row>
            <Divider />
            <Space>
              <Button
                size="large"
                icon={<SaveOutlined />}
                onClick={handleSubmit}
                type="primary"
                loading={isCreating || isUpdating}
              >
                {isEditMode ? "Update Site Map" : "Save & Continue"}
              </Button>
              <Button size="large" icon={<FileTextOutlined />} type="dashed">
                Generate Quotation →
              </Button>
            </Space>
          </div>
        </Form>
      </div>
    </div>
  );
};

export default AddSiteMap;
