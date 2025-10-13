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
} from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import { LazyLoadImage } from "react-lazy-load-image-component";
import { FcEmptyTrash } from "react-icons/fc";
import { BiTrash } from "react-icons/bi";
import styled from "styled-components";
import OrderTotal from "./OrderTotal";
import { ShoppingCartOutlined, CheckCircleOutlined } from "@ant-design/icons";
const { Title, Text } = Typography;

const CartItemsCard = styled(Card)`
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 16px;
  @media (min-width: 768px) {
    margin-bottom: 24px;
  }
`;

const CartHeader = styled.div`
  width: 100%;
`;

const CartItem = styled.div`
  padding: 12px 0;
  &:hover {
    background: #fafafa;
  }
  @media (min-width: 768px) {
    padding: 16px 0;
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
  @media (min-width: 768px) {
    width: 32px;
    height: 32px;
  }
`;

const RemoveButton = styled(Button)`
  margin-left: 8px;
`;

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

const DiscountInput = styled(InputNumber)`
  width: 80px;
  margin-left: 8px;
  @media (min-width: 768px) {
    width: 100px;
  }
`;

const CartTab = ({
  cartItems,
  cartProductsData,
  totalItems,
  shipping,
  tax,
  discount,
  roundOff,
  subTotal,
  quotationData,
  itemDiscounts,
  updatingItems,
  handleUpdateQuantity,
  handleRemoveItem,
  handleDiscountChange,
  setShowClearCartModal,
  setActiveTab,
}) => {
  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} sm={24} md={16} lg={16}>
        <CartItemsCard>
          <CartHeader>
            <Space
              align="center"
              style={{
                justifyContent: "space-between",
                width: "100%",
                flexWrap: "wrap",
              }}
            >
              <Title level={3} style={{ fontSize: "18px", marginBottom: 0 }}>
                Your Cart <ShoppingCartOutlined /> ({totalItems} items)
              </Title>
              <Button
                type="link"
                danger
                onClick={() => setShowClearCartModal(true)}
                disabled={cartItems.length === 0}
                aria-label="Clear cart"
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
                href="/inventory/products"
                style={{ marginTop: 16 }}
                aria-label="Continue shopping"
              >
                Continue Shopping
              </Button>
            </EmptyCartWrapper>
          ) : (
            <div>
              {cartItems.map((item) => {
                const product = cartProductsData?.find(
                  (p) => p.productId === item.productId
                );
                let imageUrl = null;
                try {
                  if (product?.images) {
                    const imgs = JSON.parse(product.images);
                    imageUrl = Array.isArray(imgs) ? imgs[0] : null;
                  }
                } catch {
                  imageUrl = null;
                }
                return (
                  <CartItem key={item.productId}>
                    <Row gutter={[12, 12]} align="middle">
                      <Col xs={6} sm={4}>
                        <CartItemImage
                          src={imageUrl}
                          alt={item.name}
                          effect="blur"
                          placeholderSrc="https://via.placeholder.com/100"
                        />
                      </Col>
                      <Col xs={18} sm={10}>
                        <Text strong>{item.name}</Text>
                        <br />
                        <Text type="secondary" block style={{ color: "green" }}>
                          Price: ₹
                          {(
                            item.price +
                            (quotationData.includeGst
                              ? (item.price *
                                  (parseFloat(quotationData.gstValue) || 0)) /
                                100
                              : 0)
                          ).toFixed(2)}
                        </Text>
                        <br />
                        <Text>Discount:</Text>
                        <DiscountInput
                          min={0}
                          value={itemDiscounts[item.productId] || 0}
                          onChange={(value) =>
                            handleDiscountChange(item.productId, value)
                          }
                          addonAfter={
                            quotationData.discountType === "percent" ? "%" : "₹"
                          }
                          aria-label={`Discount for ${item.name}`}
                        />
                      </Col>
                      <Col xs={12} sm={6}>
                        <Space size="small">
                          <QuantityButton
                            size="small"
                            onClick={() =>
                              handleUpdateQuantity(
                                item.productId,
                                item.quantity - 1
                              )
                            }
                            disabled={
                              item.quantity <= 1 ||
                              updatingItems[item.productId]
                            }
                            loading={updatingItems[item.productId]}
                            aria-label={`Decrease quantity of ${item.name}`}
                          >
                            -
                          </QuantityButton>
                          <Text>{item.quantity}</Text>
                          <QuantityButton
                            size="small"
                            onClick={() =>
                              handleUpdateQuantity(
                                item.productId,
                                item.quantity + 1
                              )
                            }
                            disabled={updatingItems[item.productId]}
                            loading={updatingItems[item.productId]}
                            aria-label={`Increase quantity of ${item.name}`}
                          >
                            +
                          </QuantityButton>
                        </Space>
                      </Col>
                      <Col xs={12} sm={4} style={{ textAlign: "right" }}>
                        <Text strong style={{ color: "green" }}>
                          ₹
                          {(
                            (item.price +
                              (quotationData.includeGst
                                ? (item.price *
                                    (parseFloat(quotationData.gstValue) || 0)) /
                                  100
                                : 0)) *
                              item.quantity -
                            (quotationData.discountType === "percent"
                              ? (item.price *
                                  item.quantity *
                                  (itemDiscounts[item.productId] || 0)) /
                                100
                              : (itemDiscounts[item.productId] || 0) *
                                item.quantity)
                          ).toFixed(2)}
                        </Text>
                        <RemoveButton
                          type="text"
                          danger
                          icon={<BiTrash />}
                          onClick={() => handleRemoveItem(item.productId)}
                          disabled={updatingItems[item.productId]}
                          loading={updatingItems[item.productId]}
                          aria-label={`Remove ${item.name} from cart`}
                        />
                      </Col>
                    </Row>
                    <Divider />
                  </CartItem>
                );
              })}
            </div>
          )}
        </CartItemsCard>
      </Col>
      <Col xs={24} sm={24} md={8} lg={8}>
        <CartSummaryCard>
          <Title level={4} style={{ fontSize: "16px" }}>
            Order Summary
          </Title>
          <Divider />
          <OrderTotal
            shipping={shipping}
            tax={tax}
            coupon={0}
            discount={discount}
            roundOff={roundOff}
            subTotal={subTotal}
            items={cartItems.map((item) => ({
              productId: item.productId,
              name: item.name,
              discount: parseFloat(itemDiscounts[item.productId]) || 0,
              quantity: item.quantity || 1,
            }))}
          />
          <Divider />
          <CheckoutButton
            type="primary"
            icon={<CheckCircleOutlined />}
            onClick={() => setActiveTab("checkout")}
            disabled={cartItems.length === 0}
            block
            size="large"
            aria-label="Proceed to checkout"
          >
            Proceed to Checkout
          </CheckoutButton>
          <Button
            type="default"
            href="/inventory/products"
            block
            style={{ marginTop: 8 }}
            aria-label="Continue shopping"
          >
            Continue Shopping
          </Button>
        </CartSummaryCard>
      </Col>
    </Row>
  );
};

export default CartTab;
