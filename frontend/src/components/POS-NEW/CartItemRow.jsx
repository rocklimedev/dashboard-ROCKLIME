// src/components/POS-NEW/CartItemRow.jsx
import React from "react";
import {
  Row,
  Col,
  Typography,
  Space,
  Button,
  InputNumber,
  Select,
  Divider,
} from "antd";
import { LazyLoadImage } from "react-lazy-load-image-component";
import { DeleteFilled } from "@ant-design/icons";
import { useGetProductByIdQuery } from "../../api/productApi";
import styled from "styled-components";
const { Text } = Typography;
const { Option } = Select;

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

const CartItemRow = ({
  item,
  itemDiscounts,
  itemDiscountTypes,
  itemTaxes,
  updatingItems,
  handleUpdateQuantity,
  handleRemoveItem,
  handleDiscountChange,
  handleDiscountTypeChange,
  lineTotal,
}) => {
  const { data: product, isLoading } = useGetProductByIdQuery(item.productId, {
    skip: !item.productId,
  });

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

  const imageUrl = getFirstImage(product);
  const discType = itemDiscountTypes[item.productId] || "percent";

  if (isLoading) {
    return (
      <div style={{ padding: "12px 0", textAlign: "center" }}>
        <Text type="secondary">Loading product...</Text>
        <Divider />
      </div>
    );
  }

  return (
    <div style={{ padding: "12px 0" }}>
      <Row gutter={[12, 12]} align="middle">
        {/* IMAGE */}
        <Col xs={6} sm={4}>
          <CartItemImage
            src={imageUrl || "https://via.placeholder.com/100"}
            alt={product?.name || item.name}
            effect="blur"
            placeholderSrc="https://via.placeholder.com/100"
          />
        </Col>

        {/* NAME / PRICE / DISCOUNT */}
        <Col xs={18} sm={10}>
          <Text strong>{product?.name || item.name || "Unknown Product"}</Text>
          <br />
          <Text type="secondary" style={{ color: "green" }}>
            ₹{item.price?.toFixed(2)}
          </Text>

          <div style={{ marginTop: 8 }}>
            <Space>
              <Select
                size="small"
                value={discType}
                onChange={(v) => handleDiscountTypeChange(item.productId, v)}
                style={{ width: 80 }}
              >
                <Option value="percent">%</Option>
                <Option value="fixed">₹</Option>
              </Select>

              <InputNumber
                min={0}
                size="small"
                value={itemDiscounts[item.productId] ?? 0}
                onChange={(v) => handleDiscountChange(item.productId, v)}
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
              onClick={() =>
                handleUpdateQuantity(
                  item.productId,
                  Math.max(1, item.quantity - 1)
                )
              }
              disabled={item.quantity <= 1 || updatingItems[item.productId]}
              loading={updatingItems[item.productId]}
            >
              -
            </QuantityButton>

            <InputNumber
              min={1}
              value={item.quantity}
              onChange={(value) =>
                value &&
                value > 0 &&
                handleUpdateQuantity(item.productId, Number(value))
              }
              style={{ width: 70 }}
              controls={false}
              disabled={updatingItems[item.productId]}
            />

            <QuantityButton
              onClick={() =>
                handleUpdateQuantity(item.productId, item.quantity + 1)
              }
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
          <br />
          <RemoveButton
            danger
            icon={<DeleteFilled />}
            onClick={(e) => handleRemoveItem(e, item.productId)}
            disabled={updatingItems[item.productId]}
            loading={updatingItems[item.productId]}
          />
        </Col>
      </Row>
      <Divider />
    </div>
  );
};

export default CartItemRow;
