import React from "react";
import {
  Card,
  Button,
  Select,
  Table,
  DatePicker,
  Row,
  Col,
  Empty,
  InputNumber,
  Typography,
  Spin,
  Collapse,
  Space,
  Divider,
  Image,
} from "antd";
import {
  CheckCircleOutlined,
  ArrowLeftOutlined,
  DeleteOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import styled from "styled-components";
import moment from "moment";

const { Text, Title } = Typography;
const { Option } = Select;
const { Panel } = Collapse;

// ─────────────────────────────────────────────────────────────
// Styled Components
// ─────────────────────────────────────────────────────────────

const CompactCard = styled(Card)`
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  .ant-card-body {
    padding: 12px 16px;
  }
`;

const TightRow = styled(Row)`
  margin-bottom: 6px;
  .ant-col {
    padding: 0 4px;
  }
`;

const MiniSelect = styled(Select)`
  width: 100%;
  .ant-select-selector {
    padding: 0 6px;
    height: 28px;
  }
`;

const MiniNumber = styled(InputNumber)`
  width: 100%;
  height: 28px;
  .ant-input-number-input {
    height: 26px;
  }
`;

const MiniDate = styled(DatePicker)`
  width: 100%;
  height: 28px;
  .ant-picker-input input {
    height: 28px;
  }
`;

const CheckoutBtn = styled(Button)`
  height: 36px;
  font-weight: 600;
  background: #e31e24;
  border-color: #e31e24;
  &:hover {
    background: #ff4d4f;
    border-color: #ff4d4f;
  }
`;

const CompactTable = styled(Table)`
  .ant-table-tbody > tr > td {
    padding: 6px 8px;
  }
  .ant-table-thead > tr > th {
    padding: 8px;
    font-size: 12px;
  }
`;

// ─────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────

const PurchaseOrderForm = ({
  purchaseOrderData,
  setPurchaseOrderData,
  selectedVendor,
  setSelectedVendor,
  vendors,
  isVendorsLoading,
  products,
  isProductsLoading,
  productSearch,
  filteredProducts,
  debouncedSearch,
  addPurchaseOrderProduct,
  removePurchaseOrderProduct,
  updatePurchaseOrderProductField,
  handlePurchaseOrderChange,
  purchaseOrderTotal,
  documentType,
  setDocumentType,
  cartItems,
  setActiveTab,
  handleCreateDocument,
  setShowAddVendorModal,
}) => {
  // ─────────────────────────────────────────────────────────────
  // Helpers
  // ─────────────────────────────────────────────────────────────

  const updateItem = (index, field, value) => {
    setPurchaseOrderData((prev) => {
      const items = [...prev.items];
      items[index] = { ...items[index], [field]: value };

      // Recalculate line total (client-side preview only)
      if (["quantity", "unitPrice", "tax"].includes(field)) {
        const q = Number(items[index].quantity) || 1;
        const p = Number(items[index].unitPrice) || 0.01;
        const t = Number(items[index].tax) || 0;
        items[index].total = q * p * (1 + t / 100);
      }

      const totalAmount = items
        .reduce((sum, item) => sum + (item.total || 0), 0)
        .toFixed(2);

      return { ...prev, items, totalAmount };
    });
  };

  const removeAndUpdate = (index) => {
    setPurchaseOrderData((prev) => {
      const newItems = prev.items.filter((_, i) => i !== index);
      const totalAmount = newItems
        .reduce((sum, item) => sum + (item.total || 0), 0)
        .toFixed(2);

      return { ...prev, items: newItems, totalAmount };
    });
  };

  // ─────────────────────────────────────────────────────────────
  // Table Columns
  // ─────────────────────────────────────────────────────────────

  const columns = [
    {
      title: "Product",
      dataIndex: "name",
      key: "name",
      width: 180,
      render: (_, record) => (
        <Space>
          {record.imageUrl && (
            <Image
              src={record.imageUrl}
              alt={record.name}
              width={40}
              height={40}
              preview={false}
              fallback="/placeholder-product.png"
            />
          )}
          {record.name}
        </Space>
      ),
    },
    {
      title: "Qty",
      key: "quantity",
      width: 80,
      render: (_, record, index) => (
        <MiniNumber
          min={1}
          value={record.quantity}
          onChange={(v) => updateItem(index, "quantity", v)}
        />
      ),
    },
    {
      title: "Unit Price (₹)",
      key: "unitPrice",
      width: 110,
      render: (_, record, index) => (
        <MiniNumber
          min={0.01}
          step={0.01}
          precision={2}
          value={record.unitPrice}
          onChange={(v) => updateItem(index, "unitPrice", v)}
        />
      ),
    },
    {
      title: "Tax %",
      key: "tax",
      width: 90,
      render: (_, record, index) => (
        <MiniNumber
          min={0}
          max={100}
          step={0.1}
          precision={1}
          value={record.tax ?? 0}
          onChange={(v) => updateItem(index, "tax", v)}
        />
      ),
    },
    {
      title: "Line Total (₹)",
      key: "total",
      width: 110,
      render: (_, record) =>
        (
          record.quantity *
          record.unitPrice *
          (1 + (record.tax || 0) / 100)
        ).toFixed(2),
    },
    {
      title: "",
      key: "action",
      width: 50,
      render: (_, __, index) => (
        <Button
          type="text"
          danger
          size="small"
          icon={<DeleteOutlined />}
          onClick={() => removeAndUpdate(index)}
        />
      ),
    },
  ];

  // ─────────────────────────────────────────────────────────────
  // Add Product from Search
  // ─────────────────────────────────────────────────────────────

  const handleAddProduct = (productId) => {
    const product = filteredProducts.find((p) => p.productId === productId);
    if (!product) return;

    // Prevent duplicates
    if (purchaseOrderData.items.some((item) => item.productId === productId)) {
      return;
    }

    const unitPrice = Number(product.price ?? product.mrp ?? 0.01);
    if (unitPrice <= 0) {
      return;
    }

    const quantity = 1;
    const tax = 0; // default
    const total = quantity * unitPrice * (1 + tax / 100);

    const newItem = {
      productId: product.productId,
      name: product.name || "Unnamed Product",
      unitPrice,
      quantity,
      tax,
      total,
      imageUrl: product.images?.[0] || null,
      productCode: product.product_code || product.code || "",
    };

    setPurchaseOrderData((prev) => {
      const newItems = [...prev.items, newItem];
      const totalAmount = newItems
        .reduce((sum, item) => sum + (item.total || 0), 0)
        .toFixed(2);

      return { ...prev, items: newItems, totalAmount };
    });

    // Clear search
    debouncedSearch("");
  };

  // ─────────────────────────────────────────────────────────────
  // Empty State
  // ─────────────────────────────────────────────────────────────

  if (!cartItems.length && !purchaseOrderData.items.length) {
    return (
      <CompactCard>
        <Empty
          description="No products selected for Purchase Order"
          image={<DeleteOutlined style={{ fontSize: 48 }} />}
        />
        <Button
          type="primary"
          icon={<ArrowLeftOutlined />}
          onClick={() => setActiveTab("cart")}
          block
        >
          Back to Cart
        </Button>
      </CompactCard>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────

  return (
    <Row gutter={12}>
      {/* LEFT: FORM */}
      <Col xs={24} md={16}>
        <CompactCard title={<Title level={5}>Create Purchase Order</Title>}>
          <Collapse defaultActiveKey={["1", "2"]} ghost>
            {/* Vendor & Document */}
            <Panel header="Vendor & Basic Info" key="1">
              <TightRow gutter={8}>
                <Col span={8}>
                  <Text strong>
                    Vendor <span style={{ color: "red" }}>*</span>
                  </Text>
                </Col>
                <Col span={16}>
                  <Space.Compact block style={{ width: "100%" }}>
                    <MiniSelect
                      value={selectedVendor}
                      onChange={setSelectedVendor}
                      loading={isVendorsLoading}
                      showSearch
                      placeholder="Select vendor"
                      filterOption={(input, option) =>
                        option.children
                          .toLowerCase()
                          .includes(input.toLowerCase())
                      }
                    >
                      {vendors.map((v) => (
                        <Option key={v.id} value={v.id}>
                          {v.vendorName}
                        </Option>
                      ))}
                    </MiniSelect>
                    <Button
                      type="primary"
                      size="small"
                      onClick={() => setShowAddVendorModal(true)}
                    >
                      +
                    </Button>
                  </Space.Compact>
                </Col>
              </TightRow>

              <TightRow gutter={8} style={{ marginTop: 12 }}>
                <Col span={8}>
                  <Text strong>Order Date</Text>
                </Col>
                <Col span={16}>
                  <MiniDate
                    value={moment(purchaseOrderData.orderDate || new Date())}
                    disabled
                  />
                </Col>
              </TightRow>

              <TightRow gutter={8} style={{ marginTop: 12 }}>
                <Col span={8}>
                  <Text strong>Expected Delivery</Text>
                </Col>
                <Col span={16}>
                  <MiniDate
                    value={
                      purchaseOrderData.expectDeliveryDate
                        ? moment(purchaseOrderData.expectDeliveryDate)
                        : null
                    }
                    onChange={(date) =>
                      handlePurchaseOrderChange(
                        "expectDeliveryDate",
                        date ? date.format("YYYY-MM-DD") : null,
                      )
                    }
                    disabledDate={(current) =>
                      current && current < moment().startOf("day")
                    }
                  />
                </Col>
              </TightRow>
            </Panel>

            {/* Products */}
            <Panel header="Products" key="2">
              <TightRow gutter={8} style={{ marginBottom: 12 }}>
                <Col span={24}>
                  <MiniSelect
                    showSearch
                    placeholder="Search and add product..."
                    onSearch={debouncedSearch}
                    onChange={handleAddProduct}
                    loading={isProductsLoading}
                    filterOption={false}
                    notFoundContent={
                      isProductsLoading ? (
                        <Spin size="small" />
                      ) : (
                        "No matching products"
                      )
                    }
                  >
                    {filteredProducts.map((p) => (
                      <Option key={p.productId} value={p.productId}>
                        {p.name} {p.product_code ? `(${p.product_code})` : ""}
                      </Option>
                    ))}
                  </MiniSelect>
                </Col>
              </TightRow>

              <CompactTable
                columns={columns}
                dataSource={purchaseOrderData.items}
                rowKey={(record, index) => `po-item-${index}`}
                pagination={false}
                locale={{ emptyText: "No items added yet" }}
                size="small"
              />

              {purchaseOrderData.items.length > 0 && (
                <div style={{ marginTop: 12, textAlign: "right" }}>
                  <Text strong>Total: ₹{purchaseOrderTotal}</Text>
                </div>
              )}
            </Panel>
          </Collapse>
        </CompactCard>
      </Col>

      {/* RIGHT: SUMMARY */}
      <Col xs={24} md={8}>
        <CompactCard
          title={<Text strong>Order Summary</Text>}
          style={{ position: "sticky", top: 16 }}
        >
          <Space direction="vertical" style={{ width: "100%" }}>
            <div>
              <Text type="secondary">Vendor</Text>
              <div>
                {vendors.find((v) => v.id === selectedVendor)?.vendorName ||
                  "Not selected"}
              </div>
            </div>

            <Divider style={{ margin: "12px 0" }} />

            <div>
              <Text type="secondary">Items</Text>
              <div>{purchaseOrderData.items.length}</div>
            </div>

            <div>
              <Text type="secondary">Grand Total</Text>
              <div style={{ fontSize: 18, fontWeight: 600 }}>
                ₹{purchaseOrderTotal}
              </div>
            </div>

            <Divider style={{ margin: "12px 0" }} />

            <CheckoutBtn
              block
              icon={<CheckCircleOutlined />}
              onClick={handleCreateDocument}
              disabled={
                !selectedVendor ||
                purchaseOrderData.items.length === 0 ||
                purchaseOrderData.items.some((item) => item.unitPrice <= 0)
              }
            >
              Create Purchase Order
            </CheckoutBtn>

            <Button block onClick={() => setActiveTab("cart")}>
              Back to Cart
            </Button>
          </Space>
        </CompactCard>
      </Col>
    </Row>
  );
};

export default React.memo(PurchaseOrderForm);
