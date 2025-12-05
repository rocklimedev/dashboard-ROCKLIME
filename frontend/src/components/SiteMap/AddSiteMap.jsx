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
} from "antd";
import {
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
} from "../../api/siteMapApi";
import { useGetAllProductsQuery } from "../../api/productApi";
import { useGetCustomersQuery } from "../../api/customerApi";

const { Panel } = Collapse;
const { Text } = Typography;
const { Option } = Select;

// Safe string helper
const safeLower = (val) => {
  if (val === null || val === undefined) return "";
  return String(val).toLowerCase();
};

const AddSiteMap = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const isEditMode = Boolean(id);
  const fromQuotation = location.state?.fromQuotation === true;

  // API Queries
  const { data: customersData, isLoading: isCustomersLoading } =
    useGetCustomersQuery();
  const { data: productsData = [], isLoading: isProductsLoading } =
    useGetAllProductsQuery();
  const { data: existingSiteMapData, isLoading: isFetching } =
    useGetSiteMapByIdQuery(id, {
      skip: !isEditMode,
    });

  const [createSiteMap, { isCreating }] = useCreateSiteMapMutation();
  const [updateSiteMap, isUpdating] = useUpdateSiteMapMutation();

  const customers = customersData?.data || [];
  const validProducts = productsData.filter(
    (p) => p && (p.name || p.product_code)
  );

  const existingSiteMap = existingSiteMapData?.data || null;

  const initialFormData = {
    customerId: "",
    name: "",
    siteSizeInBHK: "",
    totalFloors: 1,
    floorDetails: [],
    items: [],
    quotationId: null, // optional link
  };

  const [formData, setFormData] = useState(initialFormData);
  const [productSearch, setProductSearch] = useState("");
  const [filteredProducts, setFilteredProducts] = useState([]);

  // Load data from quotation or existing sitemap
  useEffect(() => {
    if (fromQuotation && location.state) {
      const {
        customerId = "",
        projectName = "",
        items = [],
        totalFloors = 1,
        quotationId = null,
      } = location.state;

      setFormData((prev) => ({
        ...prev,
        customerId,
        name: projectName || "Site Map from Quotation",
        totalFloors,
        items: items.map((it) => ({
          ...it,
          floor_number: it.floor_number || 1, // default to ground floor
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

  // Auto manage floor details when totalFloors changes
  useEffect(() => {
    if (!formData.totalFloors) return;

    const currentCount = formData.floorDetails.length;
    let newFloors = [...formData.floorDetails];

    if (currentCount < formData.totalFloors) {
      for (let i = currentCount; i < formData.totalFloors; i++) {
        const floorNum = i + 1;
        newFloors.push({
          floor_number: floorNum,
          floor_name:
            floorNum === 1
              ? "Ground Floor"
              : floorNum === 2
              ? "First Floor"
              : floorNum === 3
              ? "Second Floor"
              : `${floorNum - 1}th Floor`,
          floor_size: "",
          details: "",
        });
      }
    } else if (currentCount > formData.totalFloors) {
      newFloors = newFloors.slice(0, formData.totalFloors);
      // Remove items from deleted floors
      setFormData((prev) => ({
        ...prev,
        items: prev.items.filter(
          (item) => item.floor_number <= formData.totalFloors
        ),
      }));
    }

    setFormData((prev) => ({ ...prev, floorDetails: newFloors }));
  }, [formData.totalFloors]);

  // Debounced product search
  const debouncedSearch = useCallback(
    debounce((val) => {
      if (!val?.trim()) {
        setFilteredProducts([]);
        return;
      }
      const term = val.toLowerCase();
      const filtered = validProducts
        .filter((p) => {
          const name = safeLower(p.name);
          const code = safeLower(p.product_code);
          const companyCode = safeLower(
            p.meta?.["d11da9f9-3f2e-4536-8236-9671200cca4a"]
          );
          return (
            name.includes(term) ||
            code.includes(term) ||
            companyCode.includes(term)
          );
        })
        .slice(0, 12);
      setFilteredProducts(filtered);
    }, 300),
    [validProducts]
  );

  const handleProductSearch = (value) => {
    setProductSearch(value);
    debouncedSearch(value);
  };

  const addProductToFloor = (floorNumber, productId) => {
    const prod = validProducts.find((p) => (p.id || p.productId) === productId);
    if (!prod) return message.error("Product not found");

    const price =
      Number(prod.meta?.["9ba862ef-f993-4873-95ef-1fef10036aa5"]) || 0;
    const productType = prod.category?.name || "Others";

    const newItem = {
      productId: prod.id || prod.productId,
      name: prod.name?.trim() || "Unknown Product",
      imageUrl: Array.isArray(prod.images) ? prod.images[0] : null,
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
    if (qty < 1) return;
    setFormData((prev) => {
      const items = [...prev.items];
      items[index].quantity = qty;
      return { ...prev, items };
    });
  };

  const handleSubmit = async () => {
    if (!formData.customerId) return message.error("Please select a customer");
    if (!formData.name.trim())
      return message.error("Please enter project name");
    if (formData.items.length === 0)
      return message.error("Add at least one product");

    try {
      const payload = {
        ...formData,
        items: formData.items.map((item) => ({
          ...item,
          quantity: Number(item.quantity) || 1,
          price: Number(item.price) || 0,
        })),
      };

      if (isEditMode) {
        await updateSiteMap({ id, updatedSiteMap: payload }).unwrap();
        message.success("Site Map updated successfully!");
      } else {
        await createSiteMap(payload).unwrap();
        message.success("Site Map created successfully!");
      }
      navigate("/site-maps/list");
    } catch (err) {
      message.error(err?.data?.message || "Failed to save Site Map");
    }
  };

  // Group items by floor
  const itemsByFloor = {};
  formData.items.forEach((item) => {
    const floor = item.floor_number || 999;
    if (!itemsByFloor[floor]) itemsByFloor[floor] = [];
    itemsByFloor[floor].push(item);
  });

  // Totals
  const totalAmount = formData.items.reduce(
    (sum, i) => sum + i.quantity * i.price,
    0
  );
  const totalQty = formData.items.reduce((sum, i) => sum + i.quantity, 0);

  if (isFetching || isCustomersLoading || isProductsLoading) {
    return (
      <Spin tip="Loading..." style={{ display: "block", marginTop: 100 }} />
    );
  }

  return (
    <div className="page-wrapper">
      <div className="content">
        <PageHeader
          title={isEditMode ? "Edit Site Map" : "Create New Site Map"}
          subtitle={
            fromQuotation
              ? "Generated from Quotation – distribute products across floors"
              : "Plan sanitaryware & tiles across floors for better visualization"
          }
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
            loading={isCreating?.isLoading || isUpdating?.isLoading}
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
                optionFilterProp="children"
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
              <strong>Size (e.g., 3BHK)</strong>
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

        {/* Floors */}
        <Collapse
          accordion
          defaultActiveKey={formData.floorDetails.length > 0 ? ["1"] : []}
        >
          {formData.floorDetails.map((floor) => (
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
                    {itemsByFloor[floor.floor_number]?.length || 0} items)
                  </span>
                  <Tag color="blue">
                    ₹
                    {(itemsByFloor[floor.floor_number] || [])
                      .reduce((s, i) => s + i.quantity * i.price, 0)
                      .toLocaleString("en-IN")}
                  </Tag>
                </div>
              }
            >
              <Space
                direction="vertical"
                style={{ width: "100%" }}
                size="middle"
              >
                <Select
                  showSearch
                  placeholder="Search products by name, code or company code..."
                  onSearch={handleProductSearch}
                  onChange={(pid) => addProductToFloor(floor.floor_number, pid)}
                  value={null}
                  style={{ width: "100%" }}
                  dropdownMatchSelectWidth={false}
                >
                  {filteredProducts.map((p) => (
                    <Option
                      key={p.productId || p.id}
                      value={p.productId || p.id}
                    >
                      <div>
                        <strong>{p.name || "No Name"}</strong>
                        <Text type="secondary" style={{ marginLeft: 8 }}>
                          ({p.product_code || "N/A"}) — ₹
                          {Number(
                            p.meta?.["9ba862ef-f993-4873-95ef-1fef10036aa5"] ||
                              0
                          ).toFixed(2)}
                        </Text>
                      </div>
                    </Option>
                  ))}
                </Select>

                <Table
                  size="small"
                  pagination={false}
                  dataSource={itemsByFloor[floor.floor_number] || []}
                  rowKey={(r) => `${r.productId}-${Math.random()}`}
                  columns={[
                    { title: "Product", dataIndex: "name", key: "name" },
                    {
                      title: "Qty",
                      width: 100,
                      render: (_, record, idx) => (
                        <InputNumber
                          min={1}
                          value={record.quantity}
                          onChange={(v) =>
                            updateItemQty(formData.items.indexOf(record), v)
                          }
                        />
                      ),
                    },
                    {
                      title: "Price",
                      render: (_, r) => `₹${Number(r.price).toFixed(2)}`,
                    },
                    {
                      title: "Total",
                      render: (_, r) => `₹${(r.quantity * r.price).toFixed(2)}`,
                    },
                    {
                      title: "",
                      width: 60,
                      render: (_, record) => (
                        <Button
                          danger
                          size="small"
                          icon={<DeleteOutlined />}
                          onClick={() =>
                            removeItem(formData.items.indexOf(record))
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
              <Statistic title="Total Products" value={formData.items.length} />
            </Col>
            <Col>
              <Statistic title="Total Quantity" value={totalQty} />
            </Col>
            <Col>
              <Statistic
                title="Estimated Value"
                value={`₹${totalAmount.toLocaleString("en-IN")}`}
                precision={0}
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
              loading={isCreating?.isLoading || isUpdating?.isLoading}
            >
              {isEditMode ? "Update" : "Save"} Site Map
            </Button>
            <Button
              size="large"
              icon={<FileTextOutlined />}
              type="dashed"
              disabled
            >
              Generate Quotation (Coming Soon)
            </Button>
          </Space>
        </div>
      </div>
    </div>
  );
};

export default AddSiteMap;
