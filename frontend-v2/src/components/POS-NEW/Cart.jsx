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
} from "antd";
import {
  ArrowLeftOutlined,
  ShoppingCartOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import styled from "styled-components";
import OrderTotal from "./OrderTotal";
import { CheckCircleOutlined } from "@ant-design/icons";
import CartItemRow from "./CartItemRow";

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

  &:active {
    background: #a71a1a;
    border-color: #a71a1a;
  }
`;

const EmptyCartWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px 0;
`;

const OptionGroupWrapper = styled.div`
  margin-left: 40px;
  opacity: 0.92;
  border-left: 2px solid #ff4d4f;
  padding-left: 12px;
`;

/* ────────────────────── Component ────────────────────── */
const CartTab = ({
  cartItems,
  totalItems,
  shipping,
  discount,
  roundOff,
  subTotal,
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
  handleMakeOption,
  getParentName,
  documentType,
}) => {
  const isQuotationMode = documentType === "Quotation";

  // Define lineTotal function
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

  // ────── Group items: main + their options ──────
  const groupedItems = React.useMemo(() => {
    const mains = cartItems.filter((item) => !item.isOption);
    const options = cartItems.filter((item) => item.isOption);

    const grouped = mains.map((main) => ({
      main,
      options: options.filter((opt) => opt.parentProductId === main.productId),
    }));

    const ungroupedOptions = options.filter((opt) => !opt.parentProductId);

    return { grouped, ungroupedOptions };
  }, [cartItems]);

  const renderCartContent = () => {
    if (cartItems.length === 0) {
      return (
        <EmptyCartWrapper>
          <Empty
            description="Your cart is empty"
            image={<DeleteOutlined style={{ fontSize: 64 }} />}
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
        {/* Main items + their attached options */}
        {groupedItems.grouped.map(({ main, options }) => (
          <React.Fragment key={main.productId}>
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
              cartItems={cartItems}
              lineTotal={lineTotal} // ← FIXED: added here
            />

            {options.map((opt) => (
              <OptionGroupWrapper key={opt.productId}>
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
                  cartItems={cartItems}
                  lineTotal={lineTotal} // ← FIXED: added here
                />
              </OptionGroupWrapper>
            ))}
          </React.Fragment>
        ))}

        {/* Ungrouped optional items */}
        {groupedItems.ungroupedOptions.length > 0 && isQuotationMode && (
          <>
            <Divider orientation="left" plain>
              Ungrouped Optional Items
            </Divider>
            {groupedItems.ungroupedOptions.map((opt) => (
              <CartItemRow
                key={opt.productId}
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
                cartItems={cartItems}
                lineTotal={lineTotal} // ← already had it, kept for consistency
              />
            ))}
          </>
        )}
      </>
    );
  };

  return (
    <Row gutter={[16, 16]}>
      {/* LEFT – CART ITEMS */}
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

          {renderCartContent()}
        </CartItemsCard>
      </Col>

      {/* RIGHT – ORDER SUMMARY */}
      <Col xs={24} md={8} lg={8}>
        <CartSummaryCard>
          <Title level={4} style={{ fontSize: "16px" }}>
            Order Summary
          </Title>
          <Divider />
          <OrderTotal
            shipping={shipping}
            tax={0} // ← you can replace with real tax calculation later
            discount={discount}
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
