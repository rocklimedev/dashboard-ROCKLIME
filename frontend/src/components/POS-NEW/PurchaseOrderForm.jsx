import React from "react";
import {
  Card,
  Button,
  Select,
  Table,
  DatePicker,
  Divider,
  Row,
  Col,
  Empty,
  InputNumber,
  Typography,
  Spin,
} from "antd";
import {
  CheckCircleOutlined,
  ArrowLeftOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import { FcEmptyTrash } from "react-icons/fc";
import styled from "styled-components";
import moment from "moment";

const { Text } = Typography;
const { Option } = Select;

const CartSummaryCard = styled(Card)`
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 16px;
  @media (min-width: 768px) {
    top: 20px;
  }
`;

const CheckoutButton = styled(Button)`
  background: #e31e24;
  border-color: #e31e24;
  &:hover {
    background: #e31e24;
    border-color: #e31e24;
  }
`;

const EmptyCartWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px 0;
  @media (min-width: 768px) {
    padding: 40px 0;
  }
`;

const PURCHASE_ORDER_STATUSES = [
  "pending",
  "confirmed",
  "delivered",
  "cancelled",
];

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
  const purchaseOrderColumns = [
    {
      title: "Product",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Quantity",
      key: "quantity",
      render: (_, record, index) => (
        <InputNumber
          min={1}
          value={record.quantity}
          onChange={(value) =>
            updatePurchaseOrderProductField(index, "quantity", value || 1)
          }
          aria-label={`Quantity for ${record.name}`}
        />
      ),
    },
    {
      title: "MRP (₹)",
      key: "mrp",
      render: (_, record, index) => (
        <InputNumber
          min={0.01}
          step={0.01}
          value={record.mrp}
          onChange={(value) =>
            updatePurchaseOrderProductField(index, "mrp", value || 0.01)
          }
          aria-label={`MRP for ${record.name}`}
        />
      ),
    },
    {
      title: "Total (₹)",
      dataIndex: "total",
      key: "total",
      render: (total) => Number(total || 0).toFixed(2),
    },
    {
      title: "Action",
      key: "action",
      render: (_, __, index) => (
        <Button
          type="text"
          danger
          icon={<DeleteOutlined />}
          onClick={() => removePurchaseOrderProduct(index)}
          aria-label={`Remove ${purchaseOrderData.items[index].name}`}
        />
      ),
    },
  ];

  return (
    <Row gutter={[16, 16]} justify="center">
      <Col xs={24} sm={24} md={16} lg={16}>
        <CartSummaryCard>
          <Text level={3} style={{ fontSize: "18px" }}>
            Checkout
          </Text>
          <Divider />
          {cartItems.length === 0 && purchaseOrderData.items.length === 0 ? (
            <EmptyCartWrapper>
              <Empty
                description="No products added"
                image={<FcEmptyTrash style={{ fontSize: 64 }} />}
              />
              <Button
                type="primary"
                icon={<ArrowLeftOutlined />}
                onClick={() => setActiveTab("cart")}
                style={{ marginTop: 16 }}
                aria-label="Back to cart"
              >
                Back to Cart
              </Button>
            </EmptyCartWrapper>
          ) : (
            <>
              <Text strong>Document Type</Text>
              <Select
                value={documentType}
                onChange={(value) => {
                  setDocumentType(value);
                  if (value === "Purchase Order") {
                    setPurchaseOrderData((prev) => ({
                      ...prev,
                      items: cartItems.map((item) => ({
                        id: item.productId,
                        productId: item.productId,
                        name: item.name || "Unknown",
                        quantity: item.quantity || 1,
                        mrp: item.price || 0.01,
                        total: (item.quantity || 1) * (item.price || 0.01),
                      })),
                      totalAmount: cartItems
                        .reduce(
                          (sum, item) =>
                            sum + (item.quantity || 1) * (item.price || 0),
                          0
                        )
                        .toFixed(2),
                    }));
                  }
                }}
                style={{ width: "100%", marginTop: 8 }}
                aria-label="Select document type"
              >
                <Option value="Quotation">Quotation</Option>
                <Option value="Order">Order</Option>
                <Option value="Purchase Order">Purchase Order</Option>
              </Select>
              <Divider />
              <Text strong>Vendor</Text>
              <div style={{ display: "flex", alignItems: "center" }}>
                <Select
                  style={{ width: "100%", marginTop: 8 }}
                  value={selectedVendor}
                  onChange={setSelectedVendor}
                  placeholder="Select a vendor"
                  disabled={isVendorsLoading}
                  aria-label="Select a vendor"
                  showSearch
                  filterOption={(input, option) =>
                    option.children.toLowerCase().includes(input.toLowerCase())
                  }
                >
                  {vendors.length === 0 ? (
                    <Option value="" disabled>
                      No vendors available
                    </Option>
                  ) : (
                    vendors.map((vendor) => (
                      <Option key={vendor.id} value={vendor.id}>
                        {vendor.vendorName}
                      </Option>
                    ))
                  )}
                </Select>
                <Button
                  type="primary"
                  style={{ marginLeft: 8, marginTop: 8 }}
                  onClick={() => setShowAddVendorModal(true)}
                  aria-label="Add new vendor"
                >
                  +
                </Button>
              </div>
              <Divider />
              <Text strong>Search Products</Text>
              <Select
                showSearch
                style={{ width: "100%", marginTop: 8 }}
                placeholder="Search by product name or code"
                onSearch={debouncedSearch}
                onChange={addPurchaseOrderProduct}
                filterOption={false}
                loading={isProductsLoading}
                aria-label="Search products"
                notFoundContent={
                  isProductsLoading ? (
                    <Spin size="small" />
                  ) : (
                    "No products found"
                  )
                }
              >
                {filteredProducts.map((product, index) => (
                  <Option
                    key={product.productId ?? `fallback-${index}`}
                    value={product.productId}
                  >
                    {product.name} ({product.product_code ?? "N/A"})
                  </Option>
                ))}
              </Select>
              <Divider />
              <Table
                columns={purchaseOrderColumns}
                dataSource={purchaseOrderData.items}
                rowKey={(record, index) => record.id ?? `item-${index}`}
                locale={{ emptyText: "No products added" }}
                pagination={false}
              />
              <Divider />
              <Text strong>Order Date</Text>
              <DatePicker
                style={{ width: "100%", marginTop: 8 }}
                value={
                  purchaseOrderData.orderDate
                    ? moment(purchaseOrderData.orderDate)
                    : null
                }
                onChange={(date) =>
                  handlePurchaseOrderChange(
                    "orderDate",
                    date ? date.format("YYYY-MM-DD") : null
                  )
                }
                format="YYYY-MM-DD"
              />
              <Divider />
              <Text strong>Expected Delivery Date</Text>
              <DatePicker
                style={{ width: "100%", marginTop: 8 }}
                value={
                  purchaseOrderData.expectedDeliveryDate
                    ? moment(purchaseOrderData.expectedDeliveryDate)
                    : null
                }
                onChange={(date) =>
                  handlePurchaseOrderChange(
                    "expectedDeliveryDate",
                    date ? date.format("YYYY-MM-DD") : null
                  )
                }
                format="YYYY-MM-DD"
              />
              <Divider />
              <Text strong>Status</Text>
              <Select
                value={purchaseOrderData.status}
                onChange={(value) => handlePurchaseOrderChange("status", value)}
                style={{ width: "100%", marginTop: 8 }}
                placeholder="Select status"
              >
                {PURCHASE_ORDER_STATUSES.map((status) => (
                  <Option key={status} value={status}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </Option>
                ))}
              </Select>
            </>
          )}
        </CartSummaryCard>
      </Col>
      <Col xs={24} sm={24} md={8} lg={8}>
        <CartSummaryCard>
          <Text strong>Purchase Order #: {purchaseOrderNumber}</Text>
          <Divider />
          <Text strong>Total Amount (₹)</Text>
          <p>{purchaseOrderTotal}</p>
          <Divider />
          <CheckoutButton
            type="primary"
            icon={<CheckCircleOutlined />}
            onClick={handleCreateDocument}
            disabled={
              (cartItems.length === 0 &&
                purchaseOrderData.items.length === 0) ||
              !selectedVendor
            }
            block
            size="large"
            aria-label="Create purchase order"
          >
            Create Purchase Order
          </CheckoutButton>
          <Button
            type="default"
            onClick={() => setActiveTab("cart")}
            block
            style={{ marginTop: 8 }}
            aria-label="Back to cart"
          >
            Back to Cart
          </Button>
        </CartSummaryCard>
      </Col>
    </Row>
  );
};

export default PurchaseOrderForm;
