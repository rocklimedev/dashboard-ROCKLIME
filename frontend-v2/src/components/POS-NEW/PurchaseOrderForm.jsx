// src/pages/quotations/PurchaseOrderForm.jsx
import React, { useEffect } from "react";
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
  Collapse,
  Space,
  Divider,
  Image,
} from "antd";
import {
  CheckCircleOutlined,
  ArrowLeftOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import styled from "styled-components";
import moment from "moment";

const { Text, Title } = Typography;
const { Option } = Select;
const { Panel } = Collapse;

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

const PurchaseOrderForm = ({
  purchaseOrderData,
  setPurchaseOrderData,
  selectedVendor,
  setSelectedVendor,
  vendors = [], // Default empty array
  isVendorsLoading = false,
  cartItems = [],
  setActiveTab,
  handleCreateDocument,
}) => {
  // Sync Cart Items → Purchase Order Items (runs when switching to checkout tab)
  useEffect(() => {
    if (!cartItems?.length || (purchaseOrderData?.items?.length || 0) > 0) {
      return;
    }

    const mappedItems = cartItems.map((item) => {
      const price = Number(item.price || item.mrp || item.unitPrice || 0.01);
      return {
        productId: item.productId || item.id,
        name: item.name || "Unnamed Product",
        quantity: Number(item.quantity) || 1,
        unitPrice: price,
        mrp: price,
        tax: 0,
        total: price * (Number(item.quantity) || 1),
        imageUrl: item.imageUrl || item.images?.[0],
        productCode: item.product_code || item.code || "",
      };
    });

    const totalAmount = mappedItems
      .reduce((sum, item) => sum + (item.total || 0), 0)
      .toFixed(2);

    setPurchaseOrderData((prev) => ({
      ...prev,
      items: mappedItems,
      totalAmount,
    }));
  }, [cartItems, purchaseOrderData?.items?.length, setPurchaseOrderData]);

  // Update single item field
  const updateItem = (index, field, value) => {
    setPurchaseOrderData((prev) => {
      const items = [...(prev.items || [])];
      items[index] = { ...items[index], [field]: value };

      // Recalculate line total
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

  // Remove item
  const removeItem = (index) => {
    setPurchaseOrderData((prev) => {
      const newItems = (prev.items || []).filter((_, i) => i !== index);
      const totalAmount = newItems
        .reduce((sum, item) => sum + (item.total || 0), 0)
        .toFixed(2);

      return { ...prev, items: newItems, totalAmount };
    });
  };

  // Table Columns
  const columns = [
    {
      title: "Product",
      dataIndex: "name",
      key: "name",
      width: 200,
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
          <div>
            {record.name}
            {record.productCode && (
              <div style={{ fontSize: 12, color: "#666" }}>
                {record.productCode}
              </div>
            )}
          </div>
        </Space>
      ),
    },
    {
      title: "Qty",
      key: "quantity",
      width: 90,
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
      width: 120,
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
      width: 100,
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
      width: 120,
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
      width: 60,
      render: (_, __, index) => (
        <Button
          type="text"
          danger
          size="small"
          icon={<DeleteOutlined />}
          onClick={() => removeItem(index)}
        />
      ),
    },
  ];

  const hasItems = (purchaseOrderData?.items || []).length > 0;

  // Empty State
  if (!hasItems) {
    return (
      <CompactCard>
        <Empty
          description="No items in cart for Purchase Order"
          image={<DeleteOutlined style={{ fontSize: 48 }} />}
        />
        <Button
          type="primary"
          icon={<ArrowLeftOutlined />}
          onClick={() => setActiveTab?.("cart")}
          block
        >
          Back to Cart
        </Button>
      </CompactCard>
    );
  }

  return (
    <Row gutter={12}>
      {/* LEFT: FORM SECTION */}
      <Col xs={24} md={16}>
        <CompactCard title={<Title level={5}>Create Purchase Order</Title>}>
          <Collapse defaultActiveKey={["1", "2"]} ghost>
            {/* Vendor & Basic Info */}
            <Panel header="Vendor & Basic Info" key="1">
              <TightRow gutter={8}>
                <Col span={8}>
                  <Text strong>
                    Vendor <span style={{ color: "red" }}>*</span>
                  </Text>
                </Col>
                <Col span={16}>
                  <MiniSelect
                    value={selectedVendor}
                    onChange={setSelectedVendor}
                    loading={isVendorsLoading}
                    showSearch
                    placeholder="Select vendor"
                    filterOption={(input, option) =>
                      (option?.children || "")
                        .toLowerCase()
                        .includes(input.toLowerCase())
                    }
                  >
                    {Array.isArray(vendors) &&
                      vendors.map((v) => (
                        <Option key={v.id || v._id} value={v.id || v._id}>
                          {v.vendorName || v.name || "Unnamed Vendor"}
                        </Option>
                      ))}
                  </MiniSelect>
                </Col>
              </TightRow>

              <TightRow gutter={8} style={{ marginTop: 12 }}>
                <Col span={8}>
                  <Text strong>Order Date</Text>
                </Col>
                <Col span={16}>
                  <MiniDate
                    value={moment(purchaseOrderData.orderDate)}
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
                      setPurchaseOrderData((prev) => ({
                        ...prev,
                        expectDeliveryDate: date
                          ? date.format("YYYY-MM-DD")
                          : null,
                      }))
                    }
                    disabledDate={(current) =>
                      current && current < moment().startOf("day")
                    }
                  />
                </Col>
              </TightRow>
            </Panel>

            {/* Products Table */}
            <Panel header="Products" key="2">
              <CompactTable
                columns={columns}
                dataSource={purchaseOrderData?.items || []}
                rowKey={(record, index) => `po-item-${index}`}
                pagination={false}
                size="small"
              />

              {hasItems && (
                <div style={{ marginTop: 12, textAlign: "right" }}>
                  <Text strong>Total: ₹{purchaseOrderData.totalAmount}</Text>
                </div>
              )}
            </Panel>
          </Collapse>
        </CompactCard>
      </Col>

      {/* RIGHT: SUMMARY SECTION */}
      <Col xs={24} md={8}>
        <CompactCard
          title={<Text strong>Order Summary</Text>}
          style={{ position: "sticky", top: 16 }}
        >
          <Space direction="vertical" style={{ width: "100%" }}>
            <div>
              <Text type="secondary">Vendor</Text>
              <div>
                {Array.isArray(vendors)
                  ? vendors.find((v) => (v.id || v._id) === selectedVendor)
                      ?.vendorName || "Not selected"
                  : "Not selected"}
              </div>
            </div>

            <Divider style={{ margin: "12px 0" }} />

            <div>
              <Text type="secondary">Items</Text>
              <div>{(purchaseOrderData?.items || []).length}</div>
            </div>

            <div>
              <Text type="secondary">Grand Total</Text>
              <div style={{ fontSize: 18, fontWeight: 600 }}>
                ₹{purchaseOrderData.totalAmount || 0}
              </div>
            </div>

            <Divider style={{ margin: "12px 0" }} />

            <CheckoutBtn
              block
              icon={<CheckCircleOutlined />}
              onClick={handleCreateDocument}
              disabled={
                !selectedVendor || (purchaseOrderData?.items || []).length === 0
              }
            >
              Create Purchase Order
            </CheckoutBtn>

            <Button block onClick={() => setActiveTab?.("cart")}>
              Back to Cart
            </Button>
          </Space>
        </CompactCard>
      </Col>
    </Row>
  );
};

export default React.memo(PurchaseOrderForm);
