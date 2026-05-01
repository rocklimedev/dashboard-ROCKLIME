// src/pages/quotations/CartLayout.jsx
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Tabs, Modal, Typography, Segmented, message } from "antd";
import { ShoppingCartOutlined, CheckCircleOutlined } from "@ant-design/icons";
import { useDispatch } from "react-redux";
import { v4 as uuidv4 } from "uuid";

import CartTab from "../../components/POS-NEW/Cart"; // Correct import
import {
  useGetCartQuery,
  useUpdateCartMutation,
  useClearCartMutation,
  useRemoveFromCartMutation,
  cartApi,
} from "../../api/cartApi";
import useProductsData from "../../utils/useProductdata";
import { useAuth } from "../../context/AuthContext";
import { useGetProfileQuery } from "../../api/userApi";
import useAutoSave from "../../utils/useAutoSave";

const { TabPane } = Tabs;
const { Text } = Typography;

const documentOptions = [
  { label: "Quotation", value: "quotation" },
  { label: "Order", value: "order" },
  { label: "Purchase Order", value: "purchase-order" },
];

const getDocumentTypeFromPath = (pathname) => {
  const path = pathname.toLowerCase();
  if (path.includes("purchase-order")) return "purchase-order";
  if (path.includes("order")) return "order";
  if (path.includes("quotation")) return "quotation";
  return "quotation";
};

const CartLayout = ({ children }) => {
  const { auth } = useAuth();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  // User Info
  const { data: profileData } = useGetProfileQuery();
  const user = profileData?.user ?? {};
  const userId = user.userId;

  // State
  const [documentType, setDocumentType] = useState(() =>
    getDocumentTypeFromPath(location.pathname),
  );
  const [activeTab, setActiveTab] = useState("cart");

  const [localCartItems, setLocalCartItems] = useState([]);
  const [showClearCartModal, setShowClearCartModal] = useState(false);

  const [itemDiscounts, setItemDiscounts] = useState({});
  const [itemDiscountTypes, setItemDiscountTypes] = useState({});
  const [itemTaxes, setItemTaxes] = useState({});
  const [updatingItems, setUpdatingItems] = useState({});

  const [shipping, setShipping] = useState(0);
  const [gst, setGst] = useState(0);

  // API
  const { data: cartData } = useGetCartQuery(userId, { skip: !userId });
  const [updateCart] = useUpdateCartMutation();
  const [clearCart] = useClearCartMutation();
  const [removeFromCart] = useRemoveFromCartMutation();

  const allCartItems = useMemo(() => cartData?.cart?.items || [], [cartData]);

  // Auto Save Draft
  const DRAFT_KEY = userId ? `cart-draft-${userId}` : null;

  const draftData = useMemo(
    () => ({
      itemDiscounts,
      itemDiscountTypes,
      itemTaxes,
      shipping,
      gst,
    }),
    [itemDiscounts, itemDiscountTypes, itemTaxes, shipping, gst],
  );

  const { forceSave, loadDraft, clearDraft } = useAutoSave(
    DRAFT_KEY,
    draftData,
    2000,
    !!DRAFT_KEY,
  );

  // Restore Draft
  useEffect(() => {
    if (!userId) return;
    const draft = loadDraft();
    if (!draft) return;

    if (draft.itemDiscounts) setItemDiscounts(draft.itemDiscounts);
    if (draft.itemDiscountTypes) setItemDiscountTypes(draft.itemDiscountTypes);
    if (draft.itemTaxes) setItemTaxes(draft.itemTaxes);
    if (draft.shipping != null) setShipping(Number(draft.shipping) || 0);
    if (draft.gst != null) setGst(Number(draft.gst) || 0);
  }, [userId]);

  // Routing
  useEffect(() => {
    if (location.pathname === "/cart" || location.pathname === "/cart/") {
      navigate("/cart/quotation", { replace: true });
    }
  }, [location.pathname, navigate]);

  useEffect(() => {
    const currentType = getDocumentTypeFromPath(location.pathname);
    if (currentType !== documentType) {
      setDocumentType(currentType);
    }
  }, [location.pathname]);

  // Initialize discount/tax for new items
  // Sync Server Cart to Local — PRESERVE OPTION FLAGS
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

        return {
          ...serverItem,
          id,
          // Preserve location fields
          floorId: local?.floorId || serverItem.floorId,
          roomId: local?.roomId || serverItem.roomId,
          areaId: local?.areaId || serverItem.areaId,
          floorName: local?.floorName || serverItem.floorName,
          roomName: local?.roomName || serverItem.roomName,
          areaName: local?.areaName || serverItem.areaName,
          assignedQuantity: local?.assignedQuantity || serverItem.quantity || 1,

          // CRITICAL: Preserve option-related fields
          isOption: local?.isOption ?? serverItem.isOption ?? false,
          isOptionFor: local?.isOptionFor ?? serverItem.isOptionFor ?? null,
          optionType: local?.optionType ?? serverItem.optionType ?? null,
          parentProductId:
            local?.parentProductId ?? serverItem.parentProductId ?? null,
        };
      });
    });
  }, [allCartItems]);
  // ─────────────────────────────────────────────────────────────
  // CALCULATIONS
  // ─────────────────────────────────────────────────────────────

  // For UI Totals → Exclude optional items
  const calculationCartItems = useMemo(() => {
    return localCartItems.filter((i) => !i?.isOption);
  }, [localCartItems]);

  // For Quotation Payload → Include all items (main + optional)
  const payloadCartItems = useMemo(() => {
    return localCartItems;
  }, [localCartItems]);

  const { productsData: cartProductsData } =
    useProductsData(calculationCartItems);

  const subTotal = useMemo(() => {
    return calculationCartItems.reduce(
      (sum, i) => sum + (Number(i.price) || 0) * (Number(i.quantity) || 0),
      0,
    );
  }, [calculationCartItems]);

  const totalDiscount = useMemo(() => {
    return calculationCartItems.reduce((sum, item) => {
      const subtotal = (Number(item.price) || 0) * (Number(item.quantity) || 1);
      const discVal = Number(itemDiscounts[item.productId]) || 0;
      const type = itemDiscountTypes[item.productId] || "percent";
      const disc =
        type === "percent"
          ? (subtotal * discVal) / 100
          : discVal * (Number(item.quantity) || 1);
      return sum + disc;
    }, 0);
  }, [calculationCartItems, itemDiscounts, itemDiscountTypes]);

  const tax = useMemo(() => {
    return calculationCartItems.reduce((acc, item) => {
      const subtotal = (Number(item.price) || 0) * (Number(item.quantity) || 1);
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

  // ─────────────────────────────────────────────────────────────
  // HANDLERS
  // ─────────────────────────────────────────────────────────────

  const handleDocumentTypeChange = useCallback(
    (newType) => {
      setDocumentType(newType);
      const routeMap = {
        quotation: "/cart/quotation",
        order: "/cart/order",
        "purchase-order": "/cart/purchase-order",
      };
      navigate(routeMap[newType], { replace: true });
    },
    [navigate],
  );

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
      setItemDiscountTypes((prev) => {
        const { [productId]: _, ...rest } = prev;
        return rest;
      });
      setItemTaxes((prev) => {
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
    (
      itemId,
      floorId,
      roomId = null,
      areaId = null,
      floorName = null,
      roomName = null,
      areaName = null,
      assignedQuantity = null,
    ) => {
      if (!itemId) return;

      setLocalCartItems((prev) =>
        prev.map((item) => {
          const currentId = item.id || item.productId;
          if (currentId !== itemId) return item;

          return {
            ...item,
            floorId,
            roomId,
            areaId,
            assignedQuantity: assignedQuantity || item.quantity,
            floorName: floorName || item.floorName,
            roomName: roomName || item.roomName,
            areaName: areaName || item.areaName,
            locations: [
              ...(item.locations || []),
              {
                floorId,
                roomId,
                areaId,
                floorName,
                roomName,
                areaName,
                assignedQuantity: assignedQuantity || item.quantity,
              },
            ],
          };
        }),
      );

      message.success(`Assigned to ${floorName || "floor"}`);
    },
    [],
  );

  const handleMakeOption = useCallback(
    (productId, optionType, parentProductId = null) => {
      if (!userId) return message.error("User not logged in");

      dispatch(
        cartApi.util.updateQueryData("getCart", userId, (draft) => {
          const item = draft.cart.items.find((i) => i.productId === productId);
          if (!item) return;

          if (optionType === null || optionType === "main") {
            item.isOption = false;
            item.isOptionFor = null;
            item.optionType = null;
            item.parentProductId = null;
          } else {
            item.isOption = true;
            item.isOptionFor = parentProductId || null;
            item.optionType = optionType;
            item.parentProductId = parentProductId || null;
          }
        }),
      );

      // Also update localCartItems immediately so UI and payload stay in sync
      setLocalCartItems((prev) =>
        prev.map((item) => {
          if (item.productId !== productId) return item;

          if (optionType === null || optionType === "main") {
            return {
              ...item,
              isOption: false,
              isOptionFor: null,
              optionType: null,
              parentProductId: null,
            };
          } else {
            return {
              ...item,
              isOption: true,
              isOptionFor: parentProductId || null,
              optionType: optionType,
              parentProductId: parentProductId || null,
            };
          }
        }),
      );

      message.info(
        optionType
          ? `Item marked as ${optionType}`
          : "Item reset to main product",
      );
    },
    [userId, dispatch],
  );
  const getParentName = useCallback(
    (parentProductId) => {
      if (!parentProductId) return "Unknown";
      const parentItem = localCartItems.find(
        (i) => i.productId === parentProductId,
      );
      return (
        parentItem?.name || parentItem?.productId?.slice(0, 8) || "Unknown"
      );
    },
    [localCartItems],
  );

  const handleDiscountChange = useCallback(
    (productId, value) =>
      setItemDiscounts((prev) => ({ ...prev, [productId]: value ?? 0 })),
    [],
  );

  const handleDiscountTypeChange = useCallback(
    (productId, newType) => {
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

        setItemDiscounts((d) => ({ ...d, [productId]: newValue }));
        return { ...prev, [productId]: newType };
      });
    },
    [itemDiscounts, localCartItems],
  );

  const handleTaxChange = useCallback(
    (productId, value) =>
      setItemTaxes((prev) => ({
        ...prev,
        [productId]: value >= 0 ? value : 0,
      })),
    [],
  );

  const handleClearCart = useCallback(async () => {
    if (!userId) return message.error("User not logged in!");
    try {
      await clearCart({ userId }).unwrap();
      setLocalCartItems([]);
      setItemDiscounts({});
      setItemDiscountTypes({});
      setItemTaxes({});
      setShipping(0);
      setGst(0);
      clearDraft();
      setShowClearCartModal(false);
      message.success("Cart cleared successfully");
    } catch (e) {
      message.error(e?.data?.message || "Failed to clear cart");
    }
  }, [userId, clearCart, clearDraft]);

  // Common Props
  const commonProps = {
    localCartItems,
    calculationCartItems,
    payloadCartItems,
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
    handleMakeOption,
    getParentName,
    forceSave,
    clearDraft,
  };

  return (
    <div className="page-wrapper">
      <div className="content">
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
            <CartTab {...commonProps} onShippingChange={setShipping} />
          </TabPane>

          <TabPane
            tab={
              <span>
                <CheckCircleOutlined /> Checkout
              </span>
            }
            key="checkout"
          >
            {children(commonProps)}
          </TabPane>
        </Tabs>

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
