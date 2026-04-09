// src/components/POS-NEW/CartTab.jsx
import React, { useMemo } from "react";
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
} from "@ant-design/icons";
import styled from "styled-components";
import OrderTotal from "../../components/POS-NEW/OrderTotal";
import CartItemRow from "../../components/POS-NEW/CartItemRow";
import { CheckCircleOutlined } from "@ant-design/icons";

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
  // Main props from CartLayout
  localCartItems = [], // ← Use this instead of cartItems
  cartItems, // Keep for backward compatibility (optional)

  totalItems,
  shipping = 0,
  discount = 0,
  roundOff = 0,
  subTotal = 0,
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
}) => {
  // Use localCartItems with fallback (most reliable)
  const safeCartItems = useMemo(() => {
    return Array.isArray(localCartItems)
      ? localCartItems
      : Array.isArray(cartItems)
        ? cartItems
        : [];
  }, [localCartItems, cartItems]);

  const isQuotationMode =
    documentType === "Quotation" ||
    documentType === "quotation" ||
    documentType === "Quotation";

  // Calculate line total for each item
  const lineTotal = (item) => {
    if (!item) return "0.00";
    const price = Number(item.price) || 0;
    const qty = Number(item.quantity) || 1;
    const subtotal = price * qty;

    const productKey = item.productId || item.id;
    const discVal = Number(itemDiscounts[productKey]) || 0;
    const discType = itemDiscountTypes[productKey] || "percent";

    let discountAmount = 0;
    if (discType === "percent") {
      discountAmount = (subtotal * discVal) / 100;
    } else {
      discountAmount = discVal * qty;
    }

    const taxPct = Number(itemTaxes[productKey]) || 0;
    const taxAmount = (subtotal * taxPct) / 100;

    return (subtotal - discountAmount + taxAmount).toFixed(2);
  };

  // Group main items + their options
  const groupedItems = useMemo(() => {
    const mains = safeCartItems.filter((item) => !item?.isOption);
    const options = safeCartItems.filter((item) => item?.isOption === true);

    const grouped = mains.map((main) => ({
      main,
      options: options.filter(
        (opt) => opt?.parentProductId === (main?.productId || main?.id),
      ),
    }));

    const ungroupedOptions = options.filter((opt) => !opt?.parentProductId);

    return { grouped, ungroupedOptions };
  }, [safeCartItems]);

  const renderCartContent = () => {
    if (safeCartItems.length === 0) {
      return (
        <EmptyCartWrapper>
          <Empty
            description="Your cart is empty"
            image={<DeleteOutlined style={{ fontSize: 64, color: "#999" }} />}
          />
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
    }

    return (
      <>
        {/* Main Items + Their Options */}
        {groupedItems.grouped.map(({ main, options }) => (
          <React.Fragment key={main?.productId || main?.id || Math.random()}>
            <CartItemRow
              item={main}
              itemDiscounts={itemDiscounts}
              itemDiscountTypes={itemDiscountTypes}
              itemTaxes={itemTaxes}
              updatingItems={updatingItems}
              handleUpdateQuantity={handleUpdateQuantity}
              handleRemoveItem={handleRemoveItem}
              handleDiscountChange={handleDiscountChange}
              handleDiscountTypeChange={handleDiscountTypeChange}
              handleTaxChange={handleTaxChange}
              handleMakeOption={handleMakeOption}
              getParentName={getParentName}
              documentType={documentType}
              cartItems={safeCartItems}
              lineTotal={lineTotal}
            />

            {options.map((opt) => (
              <OptionGroupWrapper
                key={opt?.productId || opt?.id || Math.random()}
              >
                <CartItemRow
                  item={opt}
                  itemDiscounts={itemDiscounts}
                  itemDiscountTypes={itemDiscountTypes}
                  itemTaxes={itemTaxes}
                  updatingItems={updatingItems}
                  handleUpdateQuantity={handleUpdateQuantity}
                  handleRemoveItem={handleRemoveItem}
                  handleDiscountChange={handleDiscountChange}
                  handleDiscountTypeChange={handleDiscountTypeChange}
                  handleTaxChange={handleTaxChange}
                  handleMakeOption={handleMakeOption}
                  getParentName={getParentName}
                  documentType={documentType}
                  cartItems={safeCartItems}
                  lineTotal={lineTotal}
                />
              </OptionGroupWrapper>
            ))}
          </React.Fragment>
        ))}

        {/* Ungrouped Optional Items */}
        {groupedItems.ungroupedOptions.length > 0 && isQuotationMode && (
          <>
            <Divider orientation="left" plain>
              Optional Items (Ungrouped)
            </Divider>
            {groupedItems.ungroupedOptions.map((opt) => (
              <CartItemRow
                key={opt?.productId || opt?.id || Math.random()}
                item={opt}
                itemDiscounts={itemDiscounts}
                itemDiscountTypes={itemDiscountTypes}
                itemTaxes={itemTaxes}
                updatingItems={updatingItems}
                handleUpdateQuantity={handleUpdateQuantity}
                handleRemoveItem={handleRemoveItem}
                handleDiscountChange={handleDiscountChange}
                handleDiscountTypeChange={handleDiscountTypeChange}
                handleTaxChange={handleTaxChange}
                handleMakeOption={handleMakeOption}
                getParentName={getParentName}
                documentType={documentType}
                cartItems={safeCartItems}
                lineTotal={lineTotal}
              />
            ))}
          </>
        )}
      </>
    );
  };

  return (
    <Row gutter={[16, 16]}>
      {/* Cart Items Section */}
      <Col xs={24} md={16} lg={16}>
        <CartItemsCard>
          <CartHeader>
            <Space style={{ justifyContent: "space-between", width: "100%" }}>
              <Title level={3} style={{ fontSize: "18px", margin: 0 }}>
                Your Cart <ShoppingCartOutlined /> ({safeCartItems.length}{" "}
                items)
              </Title>
              <Button
                danger
                onClick={() => setShowClearCartModal?.(true)}
                disabled={safeCartItems.length === 0}
              >
                Clear Cart
              </Button>
            </Space>
            <Divider />
          </CartHeader>

          {renderCartContent()}
        </CartItemsCard>
      </Col>

      {/* Order Summary Sidebar */}
      <Col xs={24} md={8} lg={8}>
        <CartSummaryCard>
          <Title level={4} style={{ fontSize: "16px", marginBottom: 16 }}>
            Order Summary
          </Title>
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
            type="primary"
            icon={<CheckCircleOutlined />}
            onClick={() => setActiveTab?.("checkout")}
            disabled={safeCartItems.length === 0}
            block
            size="large"
          >
            Proceed to Checkout
          </CheckoutButton>

          <Button
            type="default"
            href="/category-selector"
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
