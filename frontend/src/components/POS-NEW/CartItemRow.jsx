// src/pages/quotations/CartItemRow.jsx
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
  getParentName,
  documentType,
  cartItems = [],

  /* DRAG */
  dragEnabled = false,
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

  const { data: product, isLoading } = useGetProductByIdQuery(item?.productId, {
    skip: !item?.productId,
  });

  const imageUrl = product?.images?.[0] || "https://via.placeholder.com/80";
  const discType = itemDiscountTypes[item?.productId] || "percent";
  const isQuotationMode = (documentType || "").toLowerCase() === "quotation";
  const showDiscountAndTax = ["quotation", "order"].includes(
    (documentType || "").toLowerCase(),
  );

  if (isLoading) return <div>Loading...</div>;

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
          <CartItemImage src={imageUrl} alt={product?.name} />
        </Col>

        {/* CONTENT */}
        <Col flex="1 1 auto">
          <Text strong>{product?.name || item?.name}</Text>

          <div>
            <Text type="success">₹{item?.price}</Text>
          </div>

          {/* OPTIONS */}
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
                style={{ width: 110 }}
              >
                <Option value="main">Main</Option>
                <Option value="addon">Add-on</Option>
                <Option value="upgrade">Upgrade</Option>
              </Select>
            </Space>
          )}

          {/* DISCOUNT */}
          {showDiscountAndTax && (
            <Space style={{ marginTop: 8 }}>
              <Select
                size="small"
                value={discType}
                onChange={(v) => handleDiscountTypeChange?.(item.productId, v)}
                style={{ width: 70 }}
              >
                <Option value="percent">%</Option>
                <Option value="fixed">₹</Option>
              </Select>

              <InputNumber
                size="small"
                value={itemDiscounts[item.productId] ?? 0}
                onChange={(v) => handleDiscountChange?.(item.productId, v ?? 0)}
                style={{ width: 90 }}
              />
            </Space>
          )}
        </Col>

        {/* QTY */}
        <Col flex="0 0 140px" style={{ textAlign: "center" }}>
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
        </Col>

        {/* TOTAL */}
        <Col flex="0 0 120px" style={{ textAlign: "right" }}>
          <Text strong style={{ color: "#52c41a" }}>
            ₹{lineTotal?.(item)}
          </Text>

          <div style={{ marginTop: 6 }}>
            <Button
              danger
              size="small"
              icon={<DeleteFilled />}
              onClick={(e) => handleRemoveItem?.(e, item.productId)}
            />
          </div>
        </Col>
      </Row>

      <Divider style={{ margin: "0 0 0 80px" }} />
    </ItemContainer>
  );
};

export default CartItemRow;
