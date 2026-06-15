// src/components/POS-NEW/CartItemRow.jsx
import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Row,
  Col,
  Typography,
  Button,
  InputNumber,
  Select,
  Divider,
  Space,
  Tag,
} from "antd";
import { LazyLoadImage } from "react-lazy-load-image-component";
import { DeleteFilled, HolderOutlined } from "@ant-design/icons";
import styled from "styled-components";
import { useGetProductByIdQuery } from "../../api/productApi";

const { Text } = Typography;
const { Option } = Select;

/* ===================== STYLES ===================== */

const ItemContainer = styled.div`
  padding: 14px 10px;
  transition: all 0.2s;
  background: #fff;
  border-radius: 8px;
  position: relative;

  &:hover {
    background: #fafafa;
  }

  ${({ isDragging }) =>
    isDragging &&
    `
    opacity: 0.75;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
    z-index: 100;
  `}
`;

const DragHandle = styled.div`
  cursor: grab;
  padding: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #999;

  &:hover {
    color: #1677ff;
  }

  &:active {
    cursor: grabbing;
  }
`;

const CartItemImage = styled(LazyLoadImage)`
  border-radius: 8px;
  object-fit: cover;
  width: 64px;
  height: 64px;
  background: #f5f5f5;

  @media (min-width: 768px) {
    width: 80px;
    height: 80px;
  }
`;

const CartItemRow = ({
  item,
  itemDiscounts = {},
  itemDiscountTypes = {},
  updatingItems = {},
  handleUpdateQuantity,
  handleRemoveItem,
  handleDiscountChange,
  handleDiscountTypeChange,
  handleMakeOption,
  lineTotal,
  documentType,
  dragEnabled = false,

  /* New Props for Option Handling */
  mainCartItems = [],
  handleAssignOptionToParent,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: item?.productId || item?.id,
    disabled: !dragEnabled,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // Fetch product details as fallback
  const { data: product, isLoading } = useGetProductByIdQuery(item?.productId, {
    skip: !item?.productId,
  });

  // Priority: item.imageUrl (from cart/backend) > product.images > placeholder
  const imageUrl =
    item?.imageUrl ||
    (Array.isArray(product?.images) ? product?.images[0] : null) ||
    "https://via.placeholder.com/80";

  const isOption =
    Boolean(item?.isOption) ||
    Boolean(item?.isOptionFor) ||
    Boolean(item?.optionType && item?.optionType !== "main");

  const isQuotationMode = (documentType || "").toLowerCase() === "quotation";
  const showDiscountAndTax = ["quotation", "order"].includes(
    (documentType || "").toLowerCase(),
  );

  const currentParentName = item?.parentProductId
    ? mainCartItems.find((m) => m.productId === item.parentProductId)?.name
    : null;

  if (isLoading) return <div style={{ padding: "20px" }}>Loading...</div>;

  return (
    <ItemContainer ref={setNodeRef} style={style} isDragging={isDragging}>
      <Row gutter={[12, 12]} align="middle" wrap={false}>
        {/* DRAG HANDLE */}
        {dragEnabled && (
          <Col flex="0 0 36px">
            <DragHandle {...attributes} {...listeners}>
              <HolderOutlined style={{ fontSize: 18 }} />
            </DragHandle>
          </Col>
        )}

        {/* IMAGE */}
        <Col flex="0 0 80px">
          <CartItemImage src={imageUrl} alt={item?.name} />
        </Col>

        {/* CONTENT */}
        <Col flex="1 1 auto">
          <Text strong>{product?.name || item?.name}</Text>

          <div style={{ marginTop: 4 }}>
            <Text type="success">
              ₹{Number(item?.price || 0).toLocaleString()}
            </Text>
            {isOption && (
              <Tag color="orange" style={{ marginLeft: 8 }}>
                Optional
              </Tag>
            )}
          </div>

          {/* Option Type Selector */}
          {isQuotationMode && handleMakeOption && (
            <Space style={{ marginTop: 8 }}>
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
                style={{ width: 120 }}
              >
                <Option value="main">Main Product</Option>
                <Option value="addon">Add-on</Option>
                <Option value="upgrade">Upgrade</Option>
              </Select>
            </Space>
          )}

          {/* Parent Product Selector - Only for Optional Items */}
          {isOption && isQuotationMode && mainCartItems.length > 0 && (
            <div style={{ marginTop: 8 }}>
              <Text type="secondary" style={{ fontSize: "12px" }}>
                Attach to Main Product:
              </Text>
              <Select
                size="small"
                placeholder="Select main product..."
                value={item.parentProductId || item.isOptionFor || undefined}
                onChange={(parentId) =>
                  handleAssignOptionToParent?.(item.productId, parentId)
                }
                style={{ width: "100%", marginTop: 4 }}
                allowClear
              >
                {mainCartItems.map((main) => (
                  <Option key={main.productId} value={main.productId}>
                    {main.name}
                  </Option>
                ))}
              </Select>

              {currentParentName && (
                <Tag color="blue" style={{ marginTop: 6 }}>
                  Attached to: {currentParentName}
                </Tag>
              )}
            </div>
          )}

          {/* Discount Controls */}
          {showDiscountAndTax && (
            <Space style={{ marginTop: 8 }}>
              <Select
                size="small"
                value={itemDiscountTypes[item?.productId] || "percent"}
                onChange={(v) => handleDiscountTypeChange?.(item.productId, v)}
                style={{ width: 70 }}
              >
                <Option value="percent">%</Option>
                <Option value="fixed">₹</Option>
              </Select>

              <InputNumber
                size="small"
                value={itemDiscounts[item?.productId] ?? 0}
                onChange={(v) => handleDiscountChange?.(item.productId, v ?? 0)}
                style={{ width: 90 }}
              />
            </Space>
          )}
        </Col>

        {/* QUANTITY & TOTAL */}
        <Col flex="0 0 160px" style={{ textAlign: "right" }}>
          <Space>
            <Button
              onClick={() =>
                handleUpdateQuantity(
                  item.productId,
                  Math.max(1, (item.quantity || 1) - 1),
                )
              }
            >
              -
            </Button>

            <InputNumber
              min={1}
              value={item.quantity}
              onChange={(v) => handleUpdateQuantity(item.productId, Number(v))}
              style={{ width: 60 }}
            />

            <Button
              onClick={() =>
                handleUpdateQuantity(item.productId, (item.quantity || 1) + 1)
              }
            >
              +
            </Button>
          </Space>

          <div style={{ marginTop: 12 }}>
            <Text strong style={{ color: "#52c41a", fontSize: 16 }}>
              ₹{lineTotal?.(item) || "0.00"}
            </Text>
          </div>

          <div style={{ marginTop: 8 }}>
            <Button
              danger
              size="small"
              icon={<DeleteFilled />}
              onClick={(e) => handleRemoveItem?.(e, item.productId)}
            >
              Remove
            </Button>
          </div>
        </Col>
      </Row>

      <Divider style={{ margin: "12px 0 0 80px" }} />
    </ItemContainer>
  );
};

export default CartItemRow;
