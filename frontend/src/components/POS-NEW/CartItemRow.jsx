// src/pages/quotations/CartItemRow.jsx
import React from "react";
import {
  Row,
  Col,
  Typography,
  Button,
  InputNumber,
  Select,
  Divider,
  Space,
} from "antd";
import { LazyLoadImage } from "react-lazy-load-image-component";
import { DeleteFilled } from "@ant-design/icons";
import styled from "styled-components";
import { useGetProductByIdQuery } from "../../api/productApi";

const { Text } = Typography;
const { Option } = Select;

const ItemContainer = styled.div`
  padding: 16px 0;
  transition: background 0.2s;

  &:hover {
    background: #fafafa;
  }
`;

const CartItemImage = styled(LazyLoadImage)`
  border-radius: 6px;
  object-fit: cover;
  width: 64px;
  height: 64px;
  background: #f5f5f5;

  @media (min-width: 768px) {
    width: 80px;
    height: 80px;
  }
`;

const QuantityButton = styled(Button)`
  width: 32px;
  height: 32px;
  padding: 0;
`;

const RemoveButton = styled(Button)`
  color: #ff4d4f;
  border: none;
  background: transparent;
  &:hover {
    background: #fff1f0;
  }
`;

const CartItemRow = ({
  item,
  itemDiscounts = {},
  itemDiscountTypes = {},
  itemTaxes = {},
  updatingItems = {},
  handleUpdateQuantity,
  handleRemoveItem,
  handleDiscountChange,
  handleDiscountTypeChange,
  handleTaxChange, // ← We have it but not using UI yet
  lineTotal,
  handleMakeOption,
  getParentName,
  documentType,
  cartItems = [], // full list for parent selector
}) => {
  const { data: product, isLoading } = useGetProductByIdQuery(item?.productId, {
    skip: !item?.productId,
  });

  const imageUrl =
    product?.images?.[0] ||
    (typeof product?.images === "string"
      ? JSON.parse(product.images)[0]
      : null) ||
    "https://via.placeholder.com/80";

  const discType = itemDiscountTypes[item?.productId] || "percent";
  const currentTax = itemTaxes[item?.productId] || 0;

  // With this:
  const normalizedDocType = documentType?.toLowerCase() || "";

  const isQuotationMode = normalizedDocType === "quotation";

  const showDiscountAndTax =
    normalizedDocType === "quotation" || normalizedDocType === "order";
  // Possible parents for option
  const possibleParents = cartItems.filter(
    (i) => i.productId !== item?.productId && !i.isOption,
  );

  if (isLoading) {
    return (
      <div style={{ padding: "20px 0", textAlign: "center" }}>
        Loading product...
      </div>
    );
  }

  return (
    <>
      <ItemContainer>
        <Row gutter={[12, 12]} align="middle" wrap={false}>
          {/* Image */}
          <Col flex="0 0 80px">
            <CartItemImage
              src={imageUrl}
              alt={product?.name || item?.name}
              effect="blur"
              placeholderSrc="https://via.placeholder.com/80?text=..."
            />
          </Col>

          {/* Main Content */}
          <Col flex="1 1 auto">
            <div style={{ marginBottom: 4 }}>
              <Text strong>{product?.name || item?.name || "—"}</Text>

              {item?.isOption && item?.parentProductId && (
                <Text
                  type="secondary"
                  style={{ fontSize: "0.9em", marginLeft: 12 }}
                >
                  ↳ for {getParentName?.(item.parentProductId) || "Unknown"}
                </Text>
              )}
            </div>

            <Text type="success" strong>
              ₹{(item?.price || 0).toFixed(2)}
            </Text>

            {/* Option Controls - Only for Quotation */}
            {isQuotationMode && handleMakeOption && (
              <div style={{ marginTop: 12 }}>
                <Space wrap size={[12, 8]}>
                  <Select
                    size="small"
                    value={item.optionType || "main"}
                    onChange={(v) =>
                      handleMakeOption(
                        item.productId,
                        v === "main" ? null : v,
                        item.parentProductId,
                      )
                    }
                    style={{ width: 110 }}
                  >
                    <Option value="main">Main item</Option>
                    <Option value="addon">Add-on</Option>
                    <Option value="upgrade">Upgrade</Option>
                    <Option value="variant">Variant</Option>
                  </Select>

                  {item.isOption && (
                    <Select
                      size="small"
                      placeholder="Select parent"
                      value={item.parentProductId || undefined}
                      onChange={(parentId) =>
                        handleMakeOption(
                          item.productId,
                          item.optionType,
                          parentId,
                        )
                      }
                      style={{ width: 180 }}
                      allowClear
                      onClear={() =>
                        handleMakeOption(item.productId, item.optionType, null)
                      }
                    >
                      {possibleParents.map((p) => (
                        <Option key={p.productId} value={p.productId}>
                          {p.name || p.productId?.slice(0, 8)}
                        </Option>
                      ))}
                    </Select>
                  )}
                </Space>
              </div>
            )}

            {/* Discount & Tax Controls */}
            {/* Discount & Tax Controls */}
            {showDiscountAndTax && (
              <div style={{ marginTop: 12 }}>
                <Space wrap size={[12, 8]} align="center">
                  <Space.Compact>
                    <Select
                      size="small"
                      value={discType}
                      onChange={(v) =>
                        handleDiscountTypeChange?.(item?.productId, v)
                      }
                      style={{ width: 70 }}
                    >
                      <Option value="percent">%</Option>
                      <Option value="fixed">₹</Option>
                    </Select>

                    <InputNumber
                      size="small"
                      min={0}
                      max={discType === "percent" ? 100 : undefined}
                      precision={discType === "percent" ? 1 : 2}
                      value={itemDiscounts[item?.productId] ?? 0}
                      onChange={(v) =>
                        handleDiscountChange?.(item?.productId, v ?? 0)
                      }
                      addonAfter={discType === "percent" ? "%" : "₹"}
                      style={{ width: 110 }}
                    />
                  </Space.Compact>
                </Space>
              </div>
            )}
          </Col>

          {/* Quantity Controls */}
          <Col flex="0 0 140px" style={{ textAlign: "center" }}>
            <Space size="small">
              <QuantityButton
                onClick={() =>
                  handleUpdateQuantity(
                    item.productId,
                    Math.max(1, (item.quantity || 1) - 1),
                  )
                }
                disabled={
                  (item.quantity || 1) <= 1 || updatingItems[item.productId]
                }
                loading={updatingItems[item.productId]}
              >
                −
              </QuantityButton>

              <InputNumber
                min={1}
                value={item.quantity || 1}
                onChange={(v) =>
                  v && handleUpdateQuantity(item.productId, Number(v))
                }
                style={{ width: 70, textAlign: "center" }}
                controls={false}
                disabled={updatingItems[item.productId]}
              />

              <QuantityButton
                onClick={() =>
                  handleUpdateQuantity(item.productId, (item.quantity || 1) + 1)
                }
                disabled={updatingItems[item.productId]}
                loading={updatingItems[item.productId]}
              >
                +
              </QuantityButton>
            </Space>
          </Col>

          {/* Line Total + Remove */}
          <Col flex="0 0 120px" style={{ textAlign: "right" }}>
            <Text strong style={{ fontSize: "1.1em", color: "#52c41a" }}>
              ₹{lineTotal ? lineTotal(item) : "0.00"}
            </Text>
            <RemoveButton
              danger
              icon={<DeleteFilled />}
              onClick={(e) => handleRemoveItem?.(e, item.productId)}
              disabled={updatingItems[item.productId]}
              loading={updatingItems[item.productId]}
              style={{ marginTop: 8 }}
            />
          </Col>
        </Row>
      </ItemContainer>

      <Divider style={{ margin: "0 0 0 80px" }} />
    </>
  );
};

export default CartItemRow;
