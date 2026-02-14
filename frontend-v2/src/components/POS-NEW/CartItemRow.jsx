// CartItemRow.jsx
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
  itemDiscounts,
  itemDiscountTypes,
  itemTaxes,
  updatingItems,
  handleUpdateQuantity,
  handleRemoveItem,
  handleDiscountChange,
  handleDiscountTypeChange,
  handleTaxChange,
  lineTotal,
  handleMakeOption,
  getParentName,
  documentType,
  cartItems, // full list – used for parent selector
}) => {
  const { data: product, isLoading } = useGetProductByIdQuery(item.productId, {
    skip: !item.productId,
  });

  const imageUrl = (() => {
    if (!product?.images) return "https://via.placeholder.com/80";
    if (Array.isArray(product.images) && product.images.length) {
      return product.images[0];
    }
    try {
      const parsed = JSON.parse(product.images);
      return Array.isArray(parsed) && parsed.length
        ? parsed[0]
        : "https://via.placeholder.com/80";
    } catch {
      return "https://via.placeholder.com/80";
    }
  })();

  const discType = itemDiscountTypes[item.productId] || "percent";

  const isQuotationMode = documentType === "Quotation";
  const showDiscountAndTax = ["Quotation", "Order"].includes(documentType);

  // Possible parents: all main (non-option) items except self
  const possibleParents = cartItems.filter(
    (i) => i.productId !== item.productId && !i.isOption,
  );

  if (isLoading) {
    return (
      <div style={{ padding: "20px 0", textAlign: "center" }}>Loading...</div>
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
              alt={product?.name || item.name}
              effect="blur"
              placeholderSrc="https://via.placeholder.com/80?text=..."
            />
          </Col>

          {/* Main content – name + controls */}
          <Col flex="1 1 auto">
            <div style={{ marginBottom: 4 }}>
              <Text strong>{product?.name || item.name || "—"}</Text>

              {item.isOption && item.parentProductId && (
                <Text
                  type="secondary"
                  style={{ fontSize: "0.9em", marginLeft: 12 }}
                >
                  ↳ for {getParentName(item.parentProductId)}
                </Text>
              )}
            </div>

            <Text type="success" strong>
              ₹{(item.price || 0).toFixed(2)}
            </Text>

            {/* Option Type + Parent Selector → Only in Quotation */}
            {isQuotationMode && (
              <div style={{ marginTop: 12 }}>
                <Space wrap size={[12, 8]}>
                  {/* Option Type Selector */}
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

                  {/* Parent selector – shown only when item is option */}
                  {item.isOption && (
                    <Select
                      size="small"
                      placeholder="Select parent item"
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
                          {p.name || p.productId.slice(0, 8)}
                        </Option>
                      ))}
                    </Select>
                  )}
                </Space>
              </div>
            )}

            {/* Discount & Tax → Both Quotation and Order */}
            {showDiscountAndTax && (
              <div style={{ marginTop: 12 }}>
                <Space wrap size={[12, 8]}>
                  {/* Discount controls */}
                  <Space.Compact>
                    <Select
                      size="small"
                      value={discType}
                      onChange={(v) =>
                        handleDiscountTypeChange(item.productId, v)
                      }
                      style={{ width: 70 }}
                    >
                      <Option value="percent">%</Option>
                      <Option value="fixed">₹</Option>
                    </Select>

                    <InputNumber
                      size="small"
                      min={0}
                      precision={discType === "percent" ? 1 : 2}
                      value={itemDiscounts[item.productId] ?? 0}
                      onChange={(v) => handleDiscountChange(item.productId, v)}
                      addonAfter={discType === "percent" ? "%" : "₹"}
                      style={{ width: 110 }}
                    />
                  </Space.Compact>

                  {/* Tax */}
                  <InputNumber
                    size="small"
                    min={0}
                    max={100}
                    precision={1}
                    value={itemTaxes[item.productId] ?? 0}
                    onChange={(v) => handleTaxChange(item.productId, v)}
                    addonAfter="% Tax"
                    style={{ width: 100 }}
                  />
                </Space>
              </div>
            )}
          </Col>

          {/* Quantity */}
          <Col flex="0 0 140px" style={{ textAlign: "center" }}>
            <Space size="small">
              <QuantityButton
                onClick={() =>
                  handleUpdateQuantity(
                    item.productId,
                    Math.max(1, item.quantity - 1),
                  )
                }
                disabled={item.quantity <= 1 || updatingItems[item.productId]}
                loading={updatingItems[item.productId]}
              >
                −
              </QuantityButton>

              <InputNumber
                min={1}
                value={item.quantity}
                onChange={(v) =>
                  v && handleUpdateQuantity(item.productId, Number(v))
                }
                style={{ width: 70, textAlign: "center" }}
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

          {/* Total + Remove */}
          <Col flex="0 0 120px" style={{ textAlign: "right" }}>
            <div>
              <Text strong style={{ fontSize: "1.1em", color: "#52c41a" }}>
                ₹{lineTotal(item)}
              </Text>
            </div>
            <RemoveButton
              danger
              icon={<DeleteFilled />}
              onClick={(e) => handleRemoveItem(e, item.productId)}
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
