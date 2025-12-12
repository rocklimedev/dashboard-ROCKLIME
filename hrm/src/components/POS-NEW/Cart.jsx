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
import { FcEmptyTrash } from "react-icons/fc";
import { BiTrash } from "react-icons/bi";
import styled from "styled-components";
import OrderTotal from "./OrderTotal";
import { CheckCircleOutlined } from "@ant-design/icons";
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
  &:hover {
    background: #fafafa;
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
                image={<FcEmptyTrash style={{ fontSize: 64 }} />}
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
            cartItems.map((item) => {
              const product = cartProductsData?.find(
                (p) => p.productId === item.productId
              );
              const imageUrl = getFirstImage(product);
              const discType = itemDiscountTypes[item.productId] || "percent";

              return (
                <CartItem key={item.productId}>
                  <Row gutter={[12, 12]} align="middle">
                    {/* IMAGE */}
                    <Col xs={6} sm={4}>
                      <CartItemImage
                        src={imageUrl}
                        alt={item.name}
                        effect="blur"
                        placeholderSrc="https://via.placeholder.com/100"
                      />
                    </Col>

                    {/* NAME / PRICE / DISCOUNT */}
                    <Col xs={18} sm={10}>
                      <Text strong>{item.name}</Text>
                      <br />
                      <Text type="secondary" style={{ color: "green" }}>
                        ₹{item.price?.toFixed(2)}
                      </Text>

                      {/* ---- Discount selector ---- */}
                      <div style={{ marginTop: 8 }}>
                        <Space>
                          <Select
                            size="small"
                            value={discType}
                            onChange={(v) =>
                              handleDiscountTypeChange(item.productId, v)
                            }
                            style={{ width: 80 }}
                          >
                            <Option value="percent">%</Option>
                            <Option value="fixed">₹</Option>
                          </Select>

                          <InputNumber
                            min={0}
                            size="small"
                            value={itemDiscounts[item.productId] ?? 0}
                            onChange={(v) =>
                              handleDiscountChange(item.productId, v)
                            }
                            addonAfter={discType === "percent" ? "%" : "₹"}
                            style={{ width: 90 }}
                          />
                        </Space>
                      </div>
                    </Col>

                    {/* QUANTITY */}
                    <Col xs={12} sm={6}>
                      <Space size="small">
                        <QuantityButton
                          type="button"
                          size="small"
                          onClick={(e) => {
                            e.preventDefault();
                            handleUpdateQuantity(
                              item.productId,
                              item.quantity - 1
                            );
                          }}
                          disabled={
                            item.quantity <= 1 || updatingItems[item.productId]
                          }
                          loading={updatingItems[item.productId]}
                        >
                          -
                        </QuantityButton>

                        <Text>{item.quantity}</Text>

                        <QuantityButton
                          type="button"
                          size="small"
                          onClick={(e) => {
                            e.preventDefault();
                            handleUpdateQuantity(
                              item.productId,
                              item.quantity + 1
                            );
                          }}
                          disabled={updatingItems[item.productId]}
                          loading={updatingItems[item.productId]}
                        >
                          +
                        </QuantityButton>
                      </Space>
                    </Col>

                    {/* LINE TOTAL + REMOVE */}
                    <Col xs={12} sm={4} style={{ textAlign: "right" }}>
                      <Text strong style={{ color: "green" }}>
                        ₹{lineTotal(item)}
                      </Text>
                      <RemoveButton
                        type="button"
                        danger
                        icon={<BiTrash />}
                        onClick={(e) => handleRemoveItem(e, item.productId)}
                        disabled={updatingItems[item.productId]}
                        loading={updatingItems[item.productId]}
                      />
                    </Col>
                  </Row>
                  <Divider />
                </CartItem>
              );
            })
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
