// src/pages/quotations/CartLayout.jsx
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Tabs, Modal, Typography, Segmented, message } from "antd";
import { ShoppingCartOutlined, CheckCircleOutlined } from "@ant-design/icons";
import { useDispatch } from "react-redux";
import { v4 as uuidv4 } from "uuid";
import CartTab from "./CartTab";

import {
  useGetCartQuery,
  useUpdateCartMutation,
  useClearCartMutation,
  useRemoveFromCartMutation,
  cartApi,
} from "../../api/cartApi";

import useProductsData from "../../utils/useProductdata"; // or useProductsData.js
import { useAuth } from "../../context/AuthContext";
import { useGetProfileQuery } from "../../api/userApi";
const { TabPane } = Tabs;
const { Text } = Typography;

const documentOptions = [
  { label: "Quotation", value: "quotation" },
  { label: "Order", value: "order" },
  { label: "Purchase Order", value: "purchase-order" },
];

const CartLayout = ({ children }) => {
  const { auth } = useAuth();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { data: profileData } = useGetProfileQuery();
  const location = useLocation();
  const user = profileData?.user ?? {};
  const userId = user.userId;

  // Determine document type from route
  const getInitialDocumentType = () => {
    const path = location.pathname.toLowerCase();
    if (path.includes("purchase-order")) return "purchase-order";
    if (path.includes("order")) return "order";
    return "quotation";
  };

  const [activeTab, setActiveTab] = useState("cart");
  const [documentType, setDocumentType] = useState(getInitialDocumentType);

  // ── Core State ─────────────────────────────────────────────
  const [localCartItems, setLocalCartItems] = useState([]);
  const [showClearCartModal, setShowClearCartModal] = useState(false);

  // ── Item-level adjustments ────────────────────────────────
  const [itemDiscounts, setItemDiscounts] = useState({});
  const [itemTaxes, setItemTaxes] = useState({});
  const [itemDiscountTypes, setItemDiscountTypes] = useState({});
  const [updatingItems, setUpdatingItems] = useState({});

  // ── Common fields ─────────────────────────────────────────
  const [shipping, setShipping] = useState(0);
  const [gst, setGst] = useState(0);

  // ── Queries & Mutations ───────────────────────────────────
  const { data: cartData } = useGetCartQuery(userId, { skip: !userId });

  const [updateCart] = useUpdateCartMutation();
  const [clearCart] = useClearCartMutation();
  const [removeFromCart] = useRemoveFromCartMutation();

  const allCartItems = useMemo(() => cartData?.cart?.items || [], [cartData]);
  console.log(allCartItems);
  // Sync local cart with server data + migration logic
  // Sync local cart with server data + migration logic
  useEffect(() => {
    // Only update when we actually have cartData (even if empty)
    if (!cartData) return; // Wait for query to resolve at least once

    setLocalCartItems((prev) => {
      const prevMap = new Map(
        prev.map((item) => [item.id || item.productId, item]),
      );

      // If server cart is empty, clear local cart
      if (!allCartItems.length) {
        return [];
      }

      return allCartItems.map((serverItem) => {
        const id = serverItem.id || serverItem.productId || uuidv4();
        const local = prevMap.get(id);

        return {
          ...serverItem,
          id,
          floorId: local?.floorId || serverItem.floorId,
          floorName: local?.floorName || serverItem.floorName,
          roomId: local?.roomId || serverItem.roomId,
          roomName: local?.roomName || serverItem.roomName,
          areaId: local?.areaId || serverItem.areaId,
          areaName: local?.areaName || serverItem.areaName,
          assignedQuantity: local?.assignedQuantity || serverItem.quantity || 1,
        };
      });
    });
  }, [allCartItems, cartData]); // ← Important: depend on cartData too
  // ── Calculations ──────────────────────────────────────────
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

  const amountBeforeGst = useMemo(
    () => parseFloat((subTotal - totalDiscount + tax + shipping).toFixed(2)),
    [subTotal, totalDiscount, tax, shipping],
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

  // ── Document Type Change Handler ─────────────────────────
  const handleDocumentTypeChange = (newType) => {
    setDocumentType(newType);
    const routeMap = {
      quotation: "/cart/quotation",
      order: "/cart/order",
      "purchase-order": "/cart/purchase-order",
    };
    navigate(routeMap[newType] || "/cart/quotation");
  };

  // ── Cart Handlers ─────────────────────────────────────────
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

      // Clean up local adjustment states
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

  // Props to be passed down to QuotationForm / OrderForm / PurchaseOrderForm
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
    itemDiscounts,
    itemDiscountTypes,
    itemTaxes,
    updatingItems,
    activeTab,
    setActiveTab,
    documentType,
    handleUpdateQuantity,
    handleRemoveItem,
    handleAssignItemToLocation,
    handleDiscountChange,
    handleDiscountTypeChange,
    handleTaxChange,
    setShipping,
    setGst,
    setLocalCartItems,
    setShowClearCartModal,
    handleClearCart,
    userId,
  };

  return (
    <div className="page-wrapper">
      <div className="content">
        {/* Document Type Switcher */}
        <div style={{ marginBottom: 24 }}>
          <Segmented
            value={documentType}
            onChange={handleDocumentTypeChange}
            options={documentOptions}
            block
            size="large"
          />
        </div>

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
              localCartItems={localCartItems} // ← Explicitly pass this
              {...layoutProps} // You can keep spread if you want, but explicit is safer
              discount={totalDiscount}
              onShippingChange={setShipping}
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
