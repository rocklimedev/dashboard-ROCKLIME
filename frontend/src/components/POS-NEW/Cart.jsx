// src/components/POS-NEW/Cart.jsx
import React, { useMemo, useState, useEffect } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";

import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";

import {
  Card,
  Button,
  Space,
  Typography,
  Divider,
  Row,
  Col,
  Empty,
} from "antd";
import {
  ArrowLeftOutlined,
  ShoppingCartOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  DragOutlined,
} from "@ant-design/icons";
import styled from "styled-components";
import OrderTotal from "../../components/POS-NEW/OrderTotal";
import CartItemRow from "../../components/POS-NEW/CartItemRow";

const { Title } = Typography;

/* ────────────────────── Styled Components ────────────────────── */

const CartItemsCard = styled(Card)`
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 16px;
`;

const CartHeader = styled.div`
  width: 100%;
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
  color: white;

  &:hover,
  &:focus {
    background: #c41e1e;
    border-color: #c41e1e;
    color: white;
  }
`;

const EmptyCartWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px 0;
`;

const OptionGroupWrapper = styled.div`
  margin-left: 40px;
  opacity: 0.92;
  border-left: 2px solid #ff4d4f;
  padding-left: 12px;
`;

/* ────────────────────── Component ────────────────────── */

const CartTab = ({
  localCartItems = [],
  cartItems, // fallback
  subTotal = 0,
  discount = 0,
  roundOff = 0,
  shipping = 0,
  itemDiscounts = {},
  itemDiscountTypes = {},
  itemTaxes = {},
  updatingItems = {},
  handleUpdateQuantity,
  handleRemoveItem,
  handleDiscountChange,
  handleDiscountTypeChange,
  handleTaxChange,
  setShowClearCartModal,
  setActiveTab,
  onShippingChange,
  handleMakeOption,
  getParentName,
  documentType = "quotation",
  onCartOrderChange, // ← From parent
}) => {
  const [dragMode, setDragMode] = useState(false);
  const [orderedIds, setOrderedIds] = useState([]);

  const safeCartItems = useMemo(() => {
    return Array.isArray(localCartItems) && localCartItems.length > 0
      ? localCartItems
      : Array.isArray(cartItems)
        ? cartItems
        : [];
  }, [localCartItems, cartItems]);

  // Sync orderedIds
  useEffect(() => {
    const ids = safeCartItems.map((item) => item.productId || item.id);
    setOrderedIds(ids);
  }, [safeCartItems]);

  const isQuotationMode = documentType?.toLowerCase() === "quotation";

  const lineTotal = (item) => {
    if (!item) return "0.00";
    const price = Number(item.price) || 0;
    const qty = Number(item.quantity) || 1;
    const subtotal = price * qty;

    const key = item.productId || item.id;
    const discVal = Number(itemDiscounts[key]) || 0;
    const discType = itemDiscountTypes[key] || "percent";

    let discountAmount =
      discType === "percent" ? (subtotal * discVal) / 100 : discVal * qty;

    const taxPct = Number(itemTaxes[key]) || 0;
    const taxAmount = (subtotal * taxPct) / 100;

    return (subtotal - discountAmount + taxAmount).toFixed(2);
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = orderedIds.indexOf(active.id);
    const newIndex = orderedIds.indexOf(over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    const newOrderedIds = arrayMove(orderedIds, oldIndex, newIndex);
    setOrderedIds(newOrderedIds);

    const newCartItems = arrayMove(safeCartItems, oldIndex, newIndex);

    // IMPORTANT: Add priority to each item
    const itemsWithPriority = newCartItems.map((item, index) => ({
      ...item,
      priority: index, // ← This is what backend expects
    }));

    onCartOrderChange?.(itemsWithPriority);
  };
  const groupedItems = useMemo(() => {
    const mains = safeCartItems.filter((i) => !i?.isOption);
    const options = safeCartItems.filter((i) => i?.isOption);

    const grouped = mains.map((main) => ({
      main,
      options: options.filter(
        (opt) => opt?.parentProductId === (main?.productId || main?.id),
      ),
    }));

    const ungroupedOptions = options.filter((o) => !o?.parentProductId);

    return { grouped, ungroupedOptions };
  }, [safeCartItems]);

  const renderEmpty = () => (
    <EmptyCartWrapper>
      <Empty description="Your cart is empty" />
      <Button
        type="primary"
        icon={<ArrowLeftOutlined />}
        href="/category-selector"
        style={{ marginTop: 16 }}
      >
        Continue Shopping
      </Button>
    </EmptyCartWrapper>
  );

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={orderedIds}
        strategy={verticalListSortingStrategy}
      >
        <Row gutter={[16, 16]}>
          <Col xs={24} md={16}>
            <CartItemsCard>
              <CartHeader>
                <Space
                  style={{ justifyContent: "space-between", width: "100%" }}
                >
                  <Title level={3} style={{ margin: 0 }}>
                    <ShoppingCartOutlined /> Cart ({safeCartItems.length})
                  </Title>

                  <Space>
                    <Button
                      icon={<DragOutlined />}
                      type={dragMode ? "primary" : "default"}
                      onClick={() => setDragMode((p) => !p)}
                    >
                      {dragMode ? "Drag ON" : "Drag Mode"}
                    </Button>

                    <Button
                      danger
                      onClick={() => setShowClearCartModal?.(true)}
                    >
                      Clear Cart
                    </Button>
                  </Space>
                </Space>
                <Divider />
              </CartHeader>

              {!safeCartItems.length ? (
                renderEmpty()
              ) : (
                <>
                  {groupedItems.grouped.map(({ main, options }) => (
                    <React.Fragment key={main?.productId || main?.id}>
                      <CartItemRow
                        item={main}
                        itemDiscounts={itemDiscounts}
                        itemDiscountTypes={itemDiscountTypes}
                        updatingItems={updatingItems}
                        handleUpdateQuantity={handleUpdateQuantity}
                        handleRemoveItem={handleRemoveItem}
                        handleDiscountChange={handleDiscountChange}
                        handleDiscountTypeChange={handleDiscountTypeChange}
                        handleMakeOption={handleMakeOption}
                        lineTotal={lineTotal}
                        documentType={documentType}
                        dragEnabled={dragMode}
                      />

                      {options.map((opt) => (
                        <OptionGroupWrapper key={opt?.productId || opt?.id}>
                          <CartItemRow
                            item={opt}
                            itemDiscounts={itemDiscounts}
                            itemDiscountTypes={itemDiscountTypes}
                            updatingItems={updatingItems}
                            handleUpdateQuantity={handleUpdateQuantity}
                            handleRemoveItem={handleRemoveItem}
                            handleDiscountChange={handleDiscountChange}
                            handleDiscountTypeChange={handleDiscountTypeChange}
                            handleMakeOption={handleMakeOption}
                            lineTotal={lineTotal}
                            documentType={documentType}
                            dragEnabled={dragMode}
                          />
                        </OptionGroupWrapper>
                      ))}
                    </React.Fragment>
                  ))}

                  {groupedItems.ungroupedOptions.length > 0 &&
                    isQuotationMode && (
                      <>
                        <Divider orientation="left">
                          Optional Items (Ungrouped)
                        </Divider>
                        {groupedItems.ungroupedOptions.map((opt) => (
                          <CartItemRow
                            key={opt?.productId || opt?.id}
                            item={opt}
                            itemDiscounts={itemDiscounts}
                            itemDiscountTypes={itemDiscountTypes}
                            updatingItems={updatingItems}
                            handleUpdateQuantity={handleUpdateQuantity}
                            handleRemoveItem={handleRemoveItem}
                            handleDiscountChange={handleDiscountChange}
                            handleDiscountTypeChange={handleDiscountTypeChange}
                            handleMakeOption={handleMakeOption}
                            lineTotal={lineTotal}
                            documentType={documentType}
                            dragEnabled={dragMode}
                          />
                        ))}
                      </>
                    )}
                </>
              )}
            </CartItemsCard>
          </Col>

          <Col xs={24} md={8}>
            <CartSummaryCard>
              <Title level={4}>Order Summary</Title>
              <Divider />

              <OrderTotal
                shipping={shipping}
                tax={0}
                discount={discount}
                roundOff={roundOff}
                subTotal={subTotal}
                onShippingChange={onShippingChange}
              />

              <Divider />

              <CheckoutButton
                icon={<CheckCircleOutlined />}
                onClick={() => setActiveTab?.("checkout")}
                disabled={!safeCartItems.length}
                block
              >
                Proceed to Checkout
              </CheckoutButton>

              <Button block href="/category-selector" style={{ marginTop: 8 }}>
                Continue Shopping
              </Button>
            </CartSummaryCard>
          </Col>
        </Row>
      </SortableContext>
    </DndContext>
  );
};

export default CartTab;
