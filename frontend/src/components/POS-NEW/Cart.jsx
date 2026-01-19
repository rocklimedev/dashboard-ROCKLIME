// CartTab.jsx
import React from "react";
import {
  Card,
  Button,
  Space,
  Typography,
  Divider,
  Row,
  Col,
  Empty,
  InputNumber,
  Select,
} from "antd";
import { ArrowLeftOutlined, ShoppingCartOutlined } from "@ant-design/icons";
import { LazyLoadImage } from "react-lazy-load-image-component";
import { DeleteOutlined, DeleteFilled } from "@ant-design/icons";
import styled from "styled-components";
import OrderTotal from "./OrderTotal";
import { CheckCircleOutlined } from "@ant-design/icons";
import { useGetProductByIdQuery } from "../../api/productApi";
import CartItemRow from "./CartItemRow";
const { Title, Text } = Typography;
const { Option } = Select;

/* ────────────────────── Styled Components ────────────────────── */
const CartItemsCard = styled(Card)`
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 16px;
`;
const CartHeader = styled.div`
  width: 100%;
`;
const CartItem = styled.div`
  padding: 12px 0;
  transition: background-color 0.2s ease;

  &:hover {
    background: #ffebee; /* very light red – subtle & professional */
    /* Alternatives if you want stronger: */
    /* background: #ffcccc;       medium light red */
    /* background: #fecdd3;       tailwind-like red-100 */
  }
`;
const CartItemImage = styled(LazyLoadImage)`
  border-radius: 4px;
  object-fit: cover;
  width: 60px;
  height: 60px;
  @media (min-width: 768px) {
    width: 80px;
    height: 80px;
  }
`;
const QuantityButton = styled(Button)`
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
`;
const RemoveButton = styled(Button)`
  margin-left: 8px;
`;
const CartSummaryCard = styled(Card)`
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 16px;
`;
const CheckoutButton = styled(Button)`
  background: #e31e24;
  border-color: #e31e24;
  color: white; /* ensure text is always visible */

  &:hover,
  &:focus {
    background: #c41e1e; /* darker red – feels "pressed/engaged" */
    border-color: #c41e1e;
    color: white;
  }

  &:active {
    background: #a71a1a; /* even darker when clicked */
    border-color: #a71a1a;
  }
`;
const EmptyCartWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px 0;
`;
/* ────────────────────── End Styled ────────────────────── */

const CartTab = ({
  cartItems,
  cartProductsData,
  totalItems,
  shipping,
  discount,
  roundOff,
  subTotal,
  quotationData,
  itemDiscounts,
  itemDiscountTypes,
  itemTaxes,
  updatingItems,
  handleUpdateQuantity,
  handleRemoveItem,
  handleDiscountChange,
  handleDiscountTypeChange,
  handleTaxChange,
  setShowClearCartModal,
  setActiveTab,
  onShippingChange,
}) => {
  /* ────── Helper: line-item total (price × qty – discount + tax) ────── */
  const lineTotal = (item) => {
    const price = item.price || 0;
    const qty = item.quantity || 1;
    const subtotal = price * qty;

    const discVal = Number(itemDiscounts[item.productId]) || 0;
    const disc =
      itemDiscountTypes[item.productId] === "percent"
        ? (subtotal * discVal) / 100
        : discVal * qty;

    const taxPct = Number(itemTaxes[item.productId]) || 0;
    const tax = (subtotal * taxPct) / 100;

    return (subtotal - disc + tax).toFixed(2);
  };

  /* ────── Global totals (used in OrderTotal) ────── */
  const totalTax = cartItems.reduce((sum, it) => {
    const subtotal = (it.price || 0) * (it.quantity || 1);
    const taxPct = Number(itemTaxes[it.productId]) || 0;
    return sum + (subtotal * taxPct) / 100;
  }, 0);

  const totalDiscount = cartItems.reduce((sum, it) => {
    const subtotal = (it.price || 0) * (it.quantity || 1);
    const discVal = Number(itemDiscounts[it.productId]) || 0;
    const disc =
      itemDiscountTypes[it.productId] === "percent"
        ? (subtotal * discVal) / 100
        : discVal * (it.quantity || 1);
    return sum + disc;
  }, 0);

  /* ────── Safe image parser – works with array OR string ────── */
  const getFirstImage = (product) => {
    if (!product?.images) return null;
    if (Array.isArray(product.images) && product.images.length > 0) {
      return product.images[0];
    }
    if (typeof product.images === "string") {
      try {
        const parsed = JSON.parse(product.images);
        return Array.isArray(parsed) && parsed.length > 0 ? parsed[0] : null;
      } catch {
        return null;
      }
    }
    return null;
  };

  return (
    <Row gutter={[16, 16]}>
      {/* ────── LEFT – CART ITEMS ────── */}
      <Col xs={24} md={16} lg={16}>
        <CartItemsCard>
          <CartHeader>
            <Space style={{ justifyContent: "space-between", width: "100%" }}>
              <Title level={3} style={{ fontSize: "18px", margin: 0 }}>
                Your Cart <ShoppingCartOutlined /> ({totalItems} items)
              </Title>
              <Button
                type="button"
                danger
                onClick={() => setShowClearCartModal(true)}
                disabled={!cartItems.length}
              >
                Clear Cart
              </Button>
            </Space>
            <Divider />
          </CartHeader>

          {cartItems.length === 0 ? (
            <EmptyCartWrapper>
              <Empty
                description="Your cart is empty"
                image={<DeleteOutlined style={{ fontSize: 64 }} />}
              />
              <Button
                type="primary"
                icon={<ArrowLeftOutlined />}
                href="/store"
                style={{ marginTop: 16 }}
              >
                Continue Shopping
              </Button>
            </EmptyCartWrapper>
          ) : (
            cartItems.map((item) => (
              <CartItemRow
                key={item.productId}
                item={item}
                itemDiscounts={itemDiscounts}
                itemDiscountTypes={itemDiscountTypes}
                itemTaxes={itemTaxes}
                updatingItems={updatingItems}
                handleUpdateQuantity={handleUpdateQuantity}
                handleRemoveItem={handleRemoveItem}
                handleDiscountChange={handleDiscountChange}
                handleDiscountTypeChange={handleDiscountTypeChange}
                lineTotal={lineTotal}
              />
            ))
          )}
        </CartItemsCard>
      </Col>

      {/* ────── RIGHT – ORDER SUMMARY ────── */}
      <Col xs={24} md={8} lg={8}>
        <CartSummaryCard>
          <Title level={4} style={{ fontSize: "16px" }}>
            Order Summary
          </Title>
          <Divider />
          <OrderTotal
            shipping={shipping}
            tax={totalTax}
            discount={totalDiscount}
            roundOff={roundOff}
            subTotal={subTotal}
            onShippingChange={onShippingChange}
          />
          <Divider />
          <CheckoutButton
            type="primary"
            icon={<CheckCircleOutlined />}
            onClick={() => setActiveTab("checkout")}
            disabled={!cartItems.length}
            block
            size="large"
          >
            Proceed to Checkout
          </CheckoutButton>
          <Button
            type="default"
            href="/category-selector/products"
            block
            style={{ marginTop: 8 }}
          >
            Continue Shopping
          </Button>
        </CartSummaryCard>
      </Col>
    </Row>
  );
};

export default CartTab;
