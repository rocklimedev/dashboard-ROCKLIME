// src/pages/quotations/CartLayout.jsx
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Tabs, Modal, Typography, message } from "antd";
import { ShoppingCartOutlined, CheckCircleOutlined } from "@ant-design/icons";
import { useDispatch } from "react-redux";
import { v4 as uuidv4 } from "uuid";
import moment from "moment";
import styled from "styled-components";

import CartTab from "../../components/POS-NEW/Cart";
import {
  useGetCartQuery,
  useUpdateCartMutation,
  useClearCartMutation,
  useRemoveFromCartMutation,
  cartApi,
} from "../../api/cartApi";

import useProductsData from "../../utils/useProductdata";
import { useAuth } from "../../context/AuthContext";

const { TabPane } = Tabs;
const { Text } = Typography;

const PageWrapper = styled.div`
  padding: 16px;
  background-color: #f5f5f5;
  min-height: 100vh;
  @media (min-width: 768px) {
    padding: 24px;
  }
`;

const CartLayout = ({ documentType, children }) => {
  const { auth } = useAuth();
  const dispatch = useDispatch();
  const userId = auth?.userId;

  // ── Core Cart State ─────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState("cart");
  const [localCartItems, setLocalCartItems] = useState([]);
  const [showClearCartModal, setShowClearCartModal] = useState(false);

  // ── Item Level Adjustments ──────────────────────────────────────
  const [itemDiscounts, setItemDiscounts] = useState({});
  const [itemTaxes, setItemTaxes] = useState({});
  const [itemDiscountTypes, setItemDiscountTypes] = useState({});
  const [updatingItems, setUpdatingItems] = useState({});

  // ── Shared Document Fields ──────────────────────────────────────
  const [shipping, setShipping] = useState(0);
  const [gst, setGst] = useState(0);

  // ── Queries & Mutations ─────────────────────────────────────────
  const { data: cartData } = useGetCartQuery(userId, { skip: !userId });
  const [updateCart] = useUpdateCartMutation();
  const [clearCart] = useClearCartMutation();
  const [removeFromCart] = useRemoveFromCartMutation();

  const allCartItems = useMemo(() => cartData?.cart?.items || [], [cartData]);

  // ── Sync Local Cart + Migration ─────────────────────────────────
  useEffect(() => {
    if (!allCartItems.length) {
      setLocalCartItems([]);
      return;
    }

    setLocalCartItems((prev) => {
      const prevMap = new Map(
        prev.map((item) => [item.id || item.productId, item]),
      );

      return allCartItems.map((serverItem) => {
        const id = serverItem.id || serverItem.productId || uuidv4();
        const local = prevMap.get(id);

        let floorId = local?.floorId || serverItem.floorId;
        let floorName = local?.floorName || serverItem.floorName;
        let roomId = local?.roomId || serverItem.roomId;
        let roomName = local?.roomName || serverItem.roomName;
        let areaId = local?.areaId || serverItem.areaId;
        let areaName = local?.areaName || serverItem.areaName;

        // Migration for old keys
        if (serverItem.floor_number && !floorId) {
          floorId = `fl_${serverItem.floor_number}`;
          floorName = `Floor ${serverItem.floor_number}`;
        }

        return {
          ...serverItem,
          id,
          floorId,
          floorName,
          roomId,
          roomName,
          areaId,
          areaName,
        };
      });
    });
  }, [allCartItems]);

  // ── Calculations ────────────────────────────────────────────────
  const calculationCartItems = useMemo(
    () => localCartItems.filter((i) => !i.isOption),
    [localCartItems],
  );

  const { productsData: cartProductsData } =
    useProductsData(calculationCartItems);

  const subTotal = useMemo(
    () =>
      calculationCartItems.reduce(
        (sum, i) => sum + (i.price || 0) * (i.quantity || 0),
        0,
      ),
    [calculationCartItems],
  );

  const totalDiscount = useMemo(() => {
    return calculationCartItems.reduce((sum, item) => {
      const subtotal = (item.price || 0) * (item.quantity || 1);
      const discVal = Number(itemDiscounts[item.productId]) || 0;
      const type = itemDiscountTypes[item.productId] || "percent";
      const disc =
        type === "percent"
          ? (subtotal * discVal) / 100
          : discVal * (item.quantity || 1);
      return sum + disc;
    }, 0);
  }, [calculationCartItems, itemDiscounts, itemDiscountTypes]);

  const tax = useMemo(() => {
    return calculationCartItems.reduce((acc, item) => {
      const subtotal = (item.price || 0) * (item.quantity || 1);
      const discVal = Number(itemDiscounts[item.productId]) || 0;
      const type = itemDiscountTypes[item.productId] || "percent";
      const discAmt = type === "percent" ? (subtotal * discVal) / 100 : discVal;
      const taxable = subtotal - discAmt;
      const itemTax = Number(itemTaxes[item.productId]) || 0;
      return acc + (taxable * itemTax) / 100;
    }, 0);
  }, [calculationCartItems, itemDiscounts, itemDiscountTypes, itemTaxes]);

  const extraDiscount = 0; // Can be overridden by child (Quotation/Order)

  const amountBeforeGst = useMemo(
    () =>
      parseFloat(
        (subTotal - totalDiscount + tax + shipping - extraDiscount).toFixed(2),
      ),
    [subTotal, totalDiscount, tax, shipping, extraDiscount],
  );

  const roundOff = useMemo(() => {
    const rupees = Math.floor(amountBeforeGst);
    const paise = Math.round((amountBeforeGst - rupees) * 100);
    if (paise > 0 && paise <= 50) return -paise / 100;
    if (paise > 50) return (100 - paise) / 100;
    return 0;
  }, [amountBeforeGst]);

  const roundedAmount = amountBeforeGst + roundOff;
  const gstAmount =
    gst > 0 ? parseFloat(((roundedAmount * gst) / 100).toFixed(2)) : 0;
  const totalAmount = parseFloat((roundedAmount + gstAmount).toFixed(2));

  // ── Handlers ────────────────────────────────────────────────────
  const handleUpdateQuantity = useCallback(
    async (productId, newQty) => {
      if (!userId || newQty < 1) return;
      setUpdatingItems((prev) => ({ ...prev, [productId]: true }));
      try {
        await updateCart({
          userId,
          productId,
          quantity: Number(newQty),
        }).unwrap();
      } catch (err) {
        message.error(err?.data?.message || "Failed to update quantity");
      } finally {
        setUpdatingItems((prev) => ({ ...prev, [productId]: false }));
      }
    },
    [userId, updateCart],
  );

  const handleRemoveItem = useCallback(
    async (e, productId) => {
      e?.preventDefault?.();
      e?.stopPropagation?.();
      if (!userId) return message.error("User not logged in");

      dispatch(
        cartApi.util.updateQueryData("getCart", userId, (draft) => {
          draft.cart.items = draft.cart.items.filter(
            (i) => i.productId !== productId,
          );
        }),
      );

      setItemDiscounts((prev) => {
        const { [productId]: _, ...rest } = prev;
        return rest;
      });
      setItemTaxes((prev) => {
        const { [productId]: _, ...rest } = prev;
        return rest;
      });
      setItemDiscountTypes((prev) => {
        const { [productId]: _, ...rest } = prev;
        return rest;
      });

      try {
        await removeFromCart({ userId, productId }).unwrap();
      } catch (err) {
        message.error(err?.data?.message || "Failed to remove item");
      }
    },
    [userId, dispatch, removeFromCart],
  );

  const handleAssignItemToLocation = useCallback(
    (itemId, floorId, roomId = null, areaId = null) => {
      if (!floorId) return message.error("Please select a floor");

      setLocalCartItems((prev) =>
        prev.map((item) =>
          item.id === itemId
            ? {
                ...item,
                floorId,
                floorName: null,
                roomId: roomId || null,
                roomName: null,
                areaId: areaId || null,
                areaName: null,
                assignedQuantity: item.assignedQuantity || item.quantity || 1,
              }
            : item,
        ),
      );
      message.success("Item assigned successfully");
    },
    [],
  );

  const handleDiscountChange = (productId, value) => {
    setItemDiscounts((prev) => ({ ...prev, [productId]: value ?? 0 }));
  };

  const handleDiscountTypeChange = (productId, newType) => {
    setItemDiscountTypes((prev) => {
      const currentType = prev[productId] || "percent";
      const currentValue = itemDiscounts[productId] || 0;
      let newValue = currentValue;

      if (currentType !== newType && currentValue > 0) {
        const item = localCartItems.find((i) => i.productId === productId);
        if (item) {
          const subtotal = (item.price || 0) * (item.quantity || 1);
          if (newType === "fixed" && currentType === "percent") {
            newValue = (subtotal * currentValue) / 100;
          } else if (newType === "percent" && currentType === "fixed") {
            newValue = subtotal > 0 ? (currentValue / subtotal) * 100 : 0;
          }
        }
      }
      return { ...prev, [productId]: newType };
    });
  };

  const handleTaxChange = (productId, value) => {
    setItemTaxes((p) => ({ ...p, [productId]: value >= 0 ? value : 0 }));
  };

  const handleShippingChange = (v) => setShipping(v);
  const handleGstChange = (v) => setGst(Number(v) || 0);

  const handleClearCart = async () => {
    if (!userId) return message.error("User not logged in!");
    try {
      await clearCart({ userId }).unwrap();
      setLocalCartItems([]);
      setShowClearCartModal(false);
      setActiveTab("cart");
      message.success("Cart cleared");
    } catch (e) {
      message.error(e?.data?.message || "Failed to clear cart");
    }
  };

  // All props passed to child components
  const layoutProps = {
    localCartItems,
    calculationCartItems,
    cartProductsData,
    subTotal,
    totalDiscount,
    tax,
    shipping,
    gst,
    totalAmount,
    roundOff,
    extraDiscount,
    itemDiscounts,
    itemDiscountTypes,
    itemTaxes,
    updatingItems,
    activeTab,
    setActiveTab,
    handleUpdateQuantity,
    handleRemoveItem,
    handleAssignItemToLocation,
    handleDiscountChange,
    handleDiscountTypeChange,
    handleTaxChange,
    handleShippingChange,
    handleGstChange,
    setLocalCartItems,
    setShowClearCartModal,
    handleClearCart,
    userId,
  };

  return (
    <div className="page-wrapper">
      <div className="content">
        <Tabs activeKey={activeTab} onChange={setActiveTab} type="card">
          <TabPane
            tab={
              <span>
                <ShoppingCartOutlined /> Cart ({localCartItems.length})
              </span>
            }
            key="cart"
          >
            <CartTab
              cartItems={localCartItems}
              cartProductsData={cartProductsData}
              totalItems={localCartItems.length}
              shipping={shipping}
              tax={tax}
              discount={totalDiscount}
              roundOff={roundOff}
              subTotal={subTotal}
              itemDiscounts={itemDiscounts}
              itemDiscountTypes={itemDiscountTypes}
              itemTaxes={itemTaxes}
              updatingItems={updatingItems}
              handleUpdateQuantity={handleUpdateQuantity}
              handleRemoveItem={handleRemoveItem}
              handleDiscountChange={handleDiscountChange}
              handleDiscountTypeChange={handleDiscountTypeChange}
              handleTaxChange={handleTaxChange}
              setShowClearCartModal={setShowClearCartModal}
              setActiveTab={setActiveTab}
              onShippingChange={handleShippingChange}
              documentType={documentType}
            />
          </TabPane>

          <TabPane
            tab={
              <span>
                <CheckCircleOutlined /> Checkout
              </span>
            }
            key="checkout"
          >
            {children(layoutProps)}
          </TabPane>
        </Tabs>

        {/* Clear Cart Modal */}
        <Modal
          title="Confirm Clear Cart"
          open={showClearCartModal}
          onOk={handleClearCart}
          onCancel={() => setShowClearCartModal(false)}
          okText="Clear"
          okButtonProps={{ danger: true }}
        >
          <Text>Are you sure you want to clear all items from your cart?</Text>
        </Modal>
      </div>
    </div>
  );
};

export default CartLayout;
