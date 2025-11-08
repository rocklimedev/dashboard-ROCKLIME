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
} from "antd";
import {
  CheckCircleOutlined,
  ArrowLeftOutlined,
  DeleteOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import { FcEmptyTrash } from "react-icons/fc";
import styled from "styled-components";
import moment from "moment";

const { Text, Title } = Typography;
const { Option } = Select;
const { Panel } = Collapse;

// === Styled ===
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

// === Main Component ===
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
  purchaseOrderNumber,
  documentType,
  setDocumentType,
  cartItems,
  setActiveTab,
  handleCreateDocument,
  setShowAddVendorModal,
}) => {
  // === Recompute Row & Grand Total ===
  const updateTotal = (index, qty) => {
    const items = [...purchaseOrderData.items];
    const item = items[index];
    if (item) {
      item.quantity = qty || 1;
      item.total = item.quantity * item.mrp;
      setPurchaseOrderData((p) => ({
        ...p,
        items,
        totalAmount: items.reduce((s, i) => s + i.total, 0).toFixed(2),
      }));
    }
  };

  const removeAndUpdate = (index) => {
    const newItems = purchaseOrderData.items.filter((_, i) => i !== index);
    setPurchaseOrderData((p) => ({
      ...p,
      items: newItems,
      totalAmount: newItems.reduce((s, i) => s + i.total, 0).toFixed(2),
    }));
  };

  // === Table Columns (Compact) ===
  const columns = [
    { title: "Product", dataIndex: "name", key: "name", width: 140 },
    {
      title: "Qty",
      key: "quantity",
      width: 70,
      render: (_, r, i) => (
        <MiniNumber
          min={1}
          value={r.quantity}
          onChange={(v) => updateTotal(i, v)}
        />
      ),
    },
    {
      title: "MRP (₹)",
      key: "mrp",
      width: 80,
      render: (_, r) => (
        <MiniNumber disabled value={Number(r.mrp).toFixed(2)} />
      ),
    },
    {
      title: "Total (₹)",
      key: "total",
      width: 80,
      render: (_, r) => Number(r.total).toFixed(2),
    },
    {
      title: "",
      key: "action",
      width: 40,
      render: (_, __, i) => (
        <Button
          type="text"
          danger
          size="small"
          icon={<DeleteOutlined />}
          onClick={() => removeAndUpdate(i)}
        />
      ),
    },
  ];

  // === Add Product from Search ===
  const handleAddProduct = (productId) => {
    const product = filteredProducts.find((p) => p.productId === productId);
    if (!product) return;
    const newItem = {
      id: product.productId,
      productId: product.productId,
      name: product.name,
      quantity: 1,
      mrp: product.price ?? 0.01,
      total: 1 * (product.price ?? 0.01),
    };
    setPurchaseOrderData((p) => ({
      ...p,
      items: [...p.items, newItem],
      totalAmount: (
        p.items.reduce((s, i) => s + i.total, 0) + newItem.total
      ).toFixed(2),
    }));
  };

  // === Empty State ===
  if (!cartItems.length && !purchaseOrderData.items.length) {
    return (
      <CompactCard>
        <Empty
          description="No products"
          image={<FcEmptyTrash style={{ fontSize: 48 }} />}
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

  return (
    <Row gutter={12}>
      {/* LEFT: FORM */}
      <Col xs={24} md={16}>
        <CompactCard title={<Title level={5}>Purchase Order</Title>}>
          <Collapse defaultActiveKey={["1", "2"]} ghost>
            {/* 1. Vendor & Document */}
            <Panel header="Vendor & Document" key="1">
              <TightRow gutter={8}>
                <Col span={8}>
                  <Text strong>Doc Type</Text>
                </Col>
                <Col span={16}>
                  <MiniSelect value={documentType} onChange={setDocumentType}>
                    {["Quotation", "Order", "Purchase Order"].map((v) => (
                      <Option key={v} value={v}>
                        {v}
                      </Option>
                    ))}
                  </MiniSelect>
                </Col>
              </TightRow>

              <TightRow gutter={8}>
                <Col span={8}>
                  <Text strong>
                    Vendor <span style={{ color: "red" }}>*</span>
                  </Text>
                </Col>
                <Col span={16}>
                  <Space.Compact block>
                    <MiniSelect
                      value={selectedVendor}
                      onChange={setSelectedVendor}
                      loading={isVendorsLoading}
                      showSearch
                      filterOption={(i, o) =>
                        o.children.toLowerCase().includes(i.toLowerCase())
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
                      onClick={() => setShowAddVendorModal(true)}
                    >
                      +
                    </Button>
                  </Space.Compact>
                </Col>
              </TightRow>
            </Panel>

            {/* 2. Products */}
            <Panel header="Products" key="2">
              <TightRow gutter={8} style={{ marginBottom: 8 }}>
                <Col span={24}>
                  <MiniSelect
                    showSearch
                    placeholder="Search product..."
                    onSearch={debouncedSearch}
                    onChange={handleAddProduct}
                    loading={isProductsLoading}
                    filterOption={false}
                    notFoundContent={
                      isProductsLoading ? <Spin size="small" /> : "No products"
                    }
                  >
                    {filteredProducts.map((p) => (
                      <Option key={p.productId} value={p.productId}>
                        {p.name} ({p.product_code || "N/A"})
                      </Option>
                    ))}
                  </MiniSelect>
                </Col>
              </TightRow>

              <CompactTable
                columns={columns}
                dataSource={purchaseOrderData.items}
                rowKey={(_, i) => `item-${i}`}
                pagination={false}
                locale={{ emptyText: "No items" }}
                size="small"
              />
            </Panel>

            {/* 3. Dates & Status */}
            <Panel header="Dates & Status" key="3">
              <TightRow gutter={8}>
                <Col span={8}>
                  <Text strong>Order Date</Text>
                </Col>
                <Col span={16}>
                  <MiniDate
                    selected={
                      purchaseOrderData.orderDate
                        ? moment(purchaseOrderData.orderDate).toDate()
                        : null
                    }
                    onChange={(d) =>
                      handlePurchaseOrderChange(
                        "orderDate",
                        d ? moment(d).format("YYYY-MM-DD") : null
                      )
                    }
                  />
                </Col>
              </TightRow>

              <TightRow gutter={8}>
                <Col span={8}>
                  <Text strong>Expected Delivery</Text>
                </Col>
                <Col span={16}>
                  <MiniDate
                    selected={
                      purchaseOrderData.expectedDeliveryDate
                        ? moment(
                            purchaseOrderData.expectedDeliveryDate
                          ).toDate()
                        : null
                    }
                    onChange={(d) =>
                      handlePurchaseOrderChange(
                        "expectedDeliveryDate",
                        d ? moment(d).format("YYYY-MM-DD") : null
                      )
                    }
                  />
                </Col>
              </TightRow>

              <TightRow gutter={8}>
                <Col span={8}>
                  <Text strong>Status</Text>
                </Col>
                <Col span={16}>
                  <MiniSelect
                    value={purchaseOrderData.status}
                    onChange={(v) => handlePurchaseOrderChange("status", v)}
                  >
                    {["pending", "confirmed", "delivered", "cancelled"].map(
                      (s) => (
                        <Option key={s} value={s}>
                          {s.charAt(0).toUpperCase() + s.slice(1)}
                        </Option>
                      )
                    )}
                  </MiniSelect>
                </Col>
              </TightRow>
            </Panel>
          </Collapse>
        </CompactCard>
      </Col>

      {/* RIGHT: SUMMARY */}
      <Col xs={24} md={8}>
        <CompactCard
          title={<Text strong>Summary</Text>}
          style={{ position: "sticky", top: 16 }}
        >
          <Text strong>PO #: {purchaseOrderNumber}</Text>
          <Divider style={{ margin: "8px 0" }} />
          <Text strong>Total: ₹{purchaseOrderTotal}</Text>
          <Divider style={{ margin: "8px 0" }} />
          <CheckoutBtn
            block
            icon={<CheckCircleOutlined />}
            onClick={handleCreateDocument}
            disabled={
              !selectedVendor ||
              (!cartItems.length && !purchaseOrderData.items.length)
            }
          >
            Create PO
          </CheckoutBtn>
          <Button
            block
            style={{ marginTop: 4 }}
            onClick={() => setActiveTab("cart")}
          >
            Back
          </Button>
        </CompactCard>
      </Col>
    </Row>
  );
};

export default React.memo(PurchaseOrderForm);
