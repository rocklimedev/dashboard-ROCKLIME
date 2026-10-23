// src/pages/quotations/CartLayout.jsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Tabs, Modal, Typography, Segmented, Button, message } from 'antd';
import { ShoppingCartOutlined, CheckCircleOutlined, FileTextOutlined } from '@ant-design/icons';
import NewOrderModal from '../../components/Orders/QuotationPicker';
import { useDispatch } from 'react-redux';

import { quotationTotals } from '../../utils/quotationMath';
import CartTab from '../../components/POS-NEW/Cart';
import {
  useGetCartQuery,
  useUpdateCartMutation,
  useClearCartMutation,
  useRemoveFromCartMutation,
  cartApi,
} from '../../api/cartApi';
import useProductsData from '../../utils/useProductdata';
import { useAuth } from '../../context/AuthContext';
import { useGetProfileQuery } from '../../api/userApi';
import useAutoSave from '../../utils/useAutoSave';
import { reconcileQuotationItems } from '../../components/Quotation/quotationCartHelpers';
import QuotationCartSwitcher from '../../components/Quotation/QuotationCartSwitcher';

const { TabPane } = Tabs;
const { Text } = Typography;

const documentOptions = [
  { label: 'Quotation', value: 'quotation' },
  { label: 'Order', value: 'order' },
  { label: 'Purchase Order', value: 'purchase-order' },
];

const getDocumentTypeFromPath = (pathname) => {
  const path = pathname.toLowerCase();
  if (path.includes('purchase-order')) return 'purchase-order';
  if (path.includes('order')) return 'order';
  if (path.includes('quotation')) return 'quotation';
  return 'quotation';
};

const CartLayout = ({
  children,
  quotationData = { floors: [] },
  handleQuotationChange = () => {},
  quotationWorkspace = null,
  renderToolbar,
  onDocumentTypeChange,
  draftWorkspace = null,
}) => {
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
  const [activeTab, setActiveTab] = useState('cart');
  const [draftsOpen, setDraftsOpen] = useState(false);
  const [pickQuotation, setPickQuotation] = useState(false);

  const activeWorkspace = draftWorkspace?.active || quotationWorkspace;
  const initialLayout = activeWorkspace?.snapshot?.layout || {};
  const [localCartItems, setLocalCartItems] = useState(initialLayout.localCartItems || []);
  const [cartSyncReady, setCartSyncReady] = useState(false);
  const [showClearCartModal, setShowClearCartModal] = useState(false);

  const [itemDiscounts, setItemDiscounts] = useState(initialLayout.itemDiscounts || {});
  const [itemDiscountTypes, setItemDiscountTypes] = useState(initialLayout.itemDiscountTypes || {});
  const [itemTaxes, setItemTaxes] = useState(initialLayout.itemTaxes || {});
  const [updatingItems, setUpdatingItems] = useState({});

  const [shipping, setShipping] = useState(initialLayout.shipping || 0);
  const [gst, setGst] = useState(initialLayout.gst || 0);

  // API
  const { data: cartData } = useGetCartQuery(userId, { skip: !userId });
  const [updateCart] = useUpdateCartMutation();
  const [clearCart, { isLoading: clearingCart }] = useClearCartMutation();
  const [removeFromCart, { isLoading: removingCartItem }] = useRemoveFromCartMutation();

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
    !!DRAFT_KEY && !activeWorkspace && documentType !== 'quotation',
  );

  // Restore Draft
  useEffect(() => {
    if (!userId || activeWorkspace || documentType === 'quotation') return;
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
    if (location.pathname === '/cart' || location.pathname === '/cart/') {
      navigate('/cart/quotation', { replace: true });
    }
  }, [location.pathname, navigate]);

  useEffect(() => {
    const currentType = getDocumentTypeFromPath(location.pathname);
    if (currentType !== documentType) {
      setDocumentType(currentType);
    }
  }, [location.pathname]);

  // Sync Server Cart → Local (preserve location + option + priority)
  useEffect(() => {
    if (!cartData) return;
    setCartSyncReady(true);
    if (!allCartItems.length) {
      setLocalCartItems([]);
      return;
    }

    setLocalCartItems((previous) => reconcileQuotationItems(allCartItems, previous));
  }, [allCartItems, cartData]);

  // ─────────────────────────────────────────────────────────────
  // MAIN vs OPTIONAL
  // ─────────────────────────────────────────────────────────────

  const mainCartItems = useMemo(() => {
    return localCartItems.filter((i) => {
      const isOptional =
        Boolean(i.isOption) || Boolean(i.isOptionFor) || (i.optionType && i.optionType !== 'main');
      return !isOptional;
    });
  }, [localCartItems]);

  const optionalCartItems = useMemo(() => {
    return localCartItems.filter((i) => {
      return (
        Boolean(i.isOption) || Boolean(i.isOptionFor) || (i.optionType && i.optionType !== 'main')
      );
    });
  }, [localCartItems]);

  const calculationCartItems = mainCartItems;
  const payloadCartItems = useMemo(() => localCartItems, [localCartItems]);

  const { productsData: cartProductsData } = useProductsData(mainCartItems);

  // ─────────────────────────────────────────────────────────────
  // CALCULATIONS (MAIN ONLY)
  // ─────────────────────────────────────────────────────────────

  const subTotal = useMemo(() => {
    return mainCartItems.reduce(
      (sum, i) => sum + (Number(i.price) || 0) * (Number(i.quantity) || 0),
      0,
    );
  }, [mainCartItems]);

  const totalDiscount = useMemo(() => {
    return mainCartItems.reduce((sum, item) => {
      const subtotal = (Number(item.price) || 0) * (Number(item.quantity) || 1);
      const discVal = Number(itemDiscounts[item.productId]) || 0;
      const type = itemDiscountTypes[item.productId] || 'percent';
      const disc =
        type === 'percent' ? (subtotal * discVal) / 100 : discVal * (Number(item.quantity) || 1);
      return sum + disc;
    }, 0);
  }, [mainCartItems, itemDiscounts, itemDiscountTypes]);

  const tax = useMemo(() => {
    return mainCartItems.reduce((acc, item) => {
      const subtotal = (Number(item.price) || 0) * (Number(item.quantity) || 1);
      const discVal = Number(itemDiscounts[item.productId]) || 0;
      const type = itemDiscountTypes[item.productId] || 'percent';
      const discAmt = type === 'percent' ? (subtotal * discVal) / 100 : discVal;
      const taxable = subtotal - discAmt;
      const itemTax = Number(itemTaxes[item.productId]) || 0;
      return acc + (taxable * itemTax) / 100;
    }, 0);
  }, [mainCartItems, itemDiscounts, itemDiscountTypes, itemTaxes]);

  const optionalTotal = useMemo(() => {
    return optionalCartItems.reduce(
      (sum, i) => sum + (Number(i.price) || 0) * (Number(i.quantity) || 1),
      0,
    );
  }, [optionalCartItems]);

  // Same maths as the server and the PDF: GST on the taxable value, round at the end
  const totalsCalc = useMemo(
    () =>
      quotationTotals({
        items: mainCartItems.map((item) => ({
          ...item,
          discount: Number(itemDiscounts[item.productId]) || 0,
          discountType: itemDiscountTypes[item.productId] || 'percent',
        })),
        shipping,
        gstRate: gst,
        ...(documentType === 'quotation'
          ? {
              extraDiscount: Number(quotationData.discountAmount) || 0,
              extraDiscountType: quotationData.discountType || 'fixed',
              miscellaneousChargeItems: quotationData.miscellaneousChargeItems,
              additionalDiscount: quotationData.additionalDiscount,
              flatPrice: quotationData.flatPrice,
            }
          : {}),
      }),
    [mainCartItems, itemDiscounts, itemDiscountTypes, shipping, gst, documentType, quotationData],
  );
  const roundOff = totalsCalc.roundOff;
  const totalAmount = totalsCalc.grandTotal;

  // ─────────────────────────────────────────────────────────────
  // HANDLERS
  // ─────────────────────────────────────────────────────────────

  const handleCartOrderChange = useCallback(
    (newOrderedCart) => {
      const withPriority = newOrderedCart.map((item, index) => ({
        ...item,
        priority: index,
      }));

      setLocalCartItems(withPriority);

      dispatch(
        cartApi.util.updateQueryData('getCart', userId, (draft) => {
          if (!draft?.cart?.items) return;
          withPriority.forEach((item) => {
            const existing = draft.cart.items.find((i) => i.productId === item.productId);
            if (existing) existing.priority = item.priority;
          });
        }),
      );
    },
    [userId, dispatch],
  );

  const handleDocumentTypeChange = useCallback(
    (newType) => {
      if (draftWorkspace) {
        draftWorkspace
          .onAction(
            'document',
            { parent: draftWorkspace.parent, layout: { ...draftData, localCartItems } },
            draftWorkspace.workspace.activeId,
            { documentType: newType },
          )
          .catch((error) =>
            message.error(
              error?.data?.message || 'Could not switch carts. Your current cart is still open.',
            ),
          );
        return;
      }
      if (onDocumentTypeChange) {
        onDocumentTypeChange(newType);
        return;
      }
      setDocumentType(newType);
      const routeMap = {
        quotation: '/cart/quotation',
        order: '/cart/order',
        'purchase-order': '/cart/purchase-order',
      };
      navigate(routeMap[newType], { replace: true });
    },
    [navigate, onDocumentTypeChange, draftWorkspace, draftData, localCartItems],
  );

  const handleUpdateQuantity = useCallback(
    async (productId, newQty) => {
      if (!userId || newQty < 1) return;
      setUpdatingItems((prev) => ({ ...prev, [productId]: true }));

      // Clamp locations if total assigned > new qty
      setLocalCartItems((prev) =>
        prev.map((item) => {
          if ((item.productId || item.id) !== productId) return item;
          const locs = Array.isArray(item.locations) ? item.locations : [];
          if (!locs.length) return item;

          let remaining = Number(newQty) || 1;
          const clamped = locs
            .map((l) => {
              const q = Math.min(Number(l.assignedQuantity) || 0, remaining);
              remaining -= q;
              return { ...l, assignedQuantity: q };
            })
            .filter((l) => (Number(l.assignedQuantity) || 0) > 0);

          const primary = clamped[0] || null;
          return {
            ...item,
            locations: clamped,
            floorId: primary?.floorId || null,
            roomId: primary?.roomId || null,
            floorName: primary?.floorName || null,
            roomName: primary?.roomName || null,
            assignedQuantity: primary?.assignedQuantity ?? newQty,
          };
        }),
      );

      try {
        await updateCart({
          userId,
          productId,
          quantity: Number(newQty),
        }).unwrap();
      } catch (err) {
        message.error(err?.data?.message || 'Failed to update quantity');
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
      if (!userId) return message.error('User not logged in');

      dispatch(
        cartApi.util.updateQueryData('getCart', userId, (draft) => {
          draft.cart.items = draft.cart.items.filter((i) => i.productId !== productId);
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
        message.error(err?.data?.message || 'Failed to remove item');
      }
    },
    [userId, dispatch, removeFromCart],
  );

  /**
   * Single location assign (Floor/Room dropdowns).
   * replacePrimary (default) → one location entry.
   * append → multi-location fallback when handleSetItemLocations is missing.
   */
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
      options = {},
    ) => {
      if (!itemId) return;

      const { replacePrimary = true, append = false } = options;

      setLocalCartItems((prev) =>
        prev.map((item) => {
          const currentId = item.id || item.productId;
          if (currentId !== itemId) return item;

          const qty = assignedQuantity ?? item.quantity ?? 1;

          if (!floorId) {
            return {
              ...item,
              floorId: null,
              roomId: null,
              areaId: null,
              floorName: null,
              roomName: null,
              areaName: null,
              assignedQuantity: qty,
              locations: [],
            };
          }

          const newLoc = {
            floorId,
            roomId: roomId || null,
            areaId: areaId || null,
            floorName: floorName || null,
            roomName: roomName || null,
            areaName: areaName || null,
            assignedQuantity: qty,
          };

          let nextLocations;
          if (append) {
            const existing = Array.isArray(item.locations) ? [...item.locations] : [];
            const idx = existing.findIndex(
              (l) => l.floorId === floorId && (l.roomId || null) === (roomId || null),
            );
            if (idx >= 0) {
              existing[idx] = { ...existing[idx], ...newLoc };
            } else {
              existing.push(newLoc);
            }
            nextLocations = existing;
          } else if (replacePrimary) {
            nextLocations = [newLoc];
          } else {
            nextLocations = item.locations || [newLoc];
          }

          return {
            ...item,
            floorId,
            roomId: roomId || null,
            areaId: areaId || null,
            floorName: floorName || item.floorName || null,
            roomName: roomName || item.roomName || null,
            areaName: areaName || item.areaName || null,
            assignedQuantity: qty,
            locations: nextLocations,
          };
        }),
      );

      if (floorId) {
        message.success(
          floorName
            ? `Assigned to ${floorName}${roomName ? ` › ${roomName}` : ''}`
            : `Assigned to ${roomName || 'room'}`,
        );
      } else {
        message.info('Location cleared');
      }
    },
    [],
  );

  /**
   * Replace ALL locations (Split / AssignItemModal).
   * locations: [{ floorId, roomId, floorName, roomName, assignedQuantity }, ...]
   * Sum of assignedQuantity must be ≤ item.quantity.
   */
  const handleSetItemLocations = useCallback((itemId, locations = []) => {
    if (!itemId) return;

    setLocalCartItems((prev) => {
      const target = prev.find((i) => (i.id || i.productId) === itemId);
      if (!target) return prev;

      const totalQty = Number(target.quantity) || 1;
      const normalized = (locations || [])
        .filter((l) => l?.floorId)
        .map((l) => ({
          floorId: l.floorId,
          roomId: l.roomId || null,
          areaId: l.areaId || null,
          floorName: l.floorName || null,
          roomName: l.roomName || null,
          areaName: l.areaName || null,
          assignedQuantity: Number(l.assignedQuantity) || 1,
        }));

      const assignedSum = normalized.reduce((s, l) => s + (Number(l.assignedQuantity) || 0), 0);

      if (assignedSum > totalQty) {
        message.error(`Assigned qty (${assignedSum}) exceeds item quantity (${totalQty})`);
        return prev;
      }

      const primary = normalized[0] || null;

      return prev.map((item) => {
        if ((item.id || item.productId) !== itemId) return item;
        return {
          ...item,
          floorId: primary?.floorId || null,
          roomId: primary?.roomId || null,
          areaId: primary?.areaId || null,
          floorName: primary?.floorName || null,
          roomName: primary?.roomName || null,
          areaName: primary?.areaName || null,
          assignedQuantity: primary?.assignedQuantity ?? item.quantity ?? 1,
          locations: normalized,
        };
      });
    });

    // Toast after state update attempt (success only if we didn't early-return on error)
    // Use a microtask-friendly message: callers already toast in Cart for multi-assign;
    // keep a light confirmation here for split.
    // one location is a plain assignment (the cart already says where); only real splits get a note
    if (locations?.length > 1) message.success(`Split across ${locations.length} rooms`);
  }, []);

  const handleMakeOption = useCallback(
    (productId, optionType, parentProductId = null) => {
      if (!userId) return message.error('User not logged in');

      dispatch(
        cartApi.util.updateQueryData('getCart', userId, (draft) => {
          const item = draft.cart.items.find((i) => i.productId === productId);
          if (!item) return;

          if (optionType === null || optionType === 'main') {
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

      setLocalCartItems((prev) =>
        prev.map((item) => {
          if (item.productId !== productId) return item;

          if (optionType === null || optionType === 'main') {
            return {
              ...item,
              isOption: false,
              isOptionFor: null,
              optionType: null,
              parentProductId: null,
            };
          }
          return {
            ...item,
            isOption: true,
            isOptionFor: parentProductId || null,
            optionType,
            parentProductId: parentProductId || null,
          };
        }),
      );

      message.info(optionType ? `Item marked as ${optionType}` : 'Item reset to main product');
    },
    [userId, dispatch],
  );

  const getParentName = useCallback(
    (parentProductId) => {
      if (!parentProductId) return 'Unknown';
      const parentItem = localCartItems.find((i) => i.productId === parentProductId);
      return parentItem?.name || parentItem?.productId?.slice(0, 8) || 'Unknown';
    },
    [localCartItems],
  );

  const handleAssignOptionToParent = useCallback(
    (optionProductId, parentProductId) => {
      if (!optionProductId) return;

      setLocalCartItems((prev) =>
        prev.map((item) => {
          if (item.productId === optionProductId) {
            return {
              ...item,
              isOption: true,
              isOptionFor: parentProductId,
              parentProductId,
              optionType: item.optionType || 'addon',
            };
          }
          return item;
        }),
      );

      dispatch(
        cartApi.util.updateQueryData('getCart', userId, (draft) => {
          const item = draft.cart?.items?.find((i) => i.productId === optionProductId);
          if (item) {
            item.isOption = true;
            item.isOptionFor = parentProductId;
            item.parentProductId = parentProductId;
            item.optionType = item.optionType || 'addon';
          }
        }),
      );

      message.success('Optional item attached to main product');
    },
    [userId, dispatch],
  );

  const handleDiscountChange = useCallback(
    (productId, value) => setItemDiscounts((prev) => ({ ...prev, [productId]: value ?? 0 })),
    [],
  );

  const handleDiscountTypeChange = useCallback(
    (productId, newType) => {
      setItemDiscountTypes((prev) => {
        const currentType = prev[productId] || 'percent';
        const currentValue = itemDiscounts[productId] || 0;
        let newValue = currentValue;

        if (currentType !== newType && currentValue > 0) {
          const item = localCartItems.find((i) => i.productId === productId);
          if (item) {
            const subtotal = (item.price || 0) * (item.quantity || 1);
            if (newType === 'fixed' && currentType === 'percent') {
              newValue = (subtotal * currentValue) / 100;
            } else if (newType === 'percent' && currentType === 'fixed') {
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
    if (!userId) return message.error('User not logged in!');
    try {
      await clearCart({ userId }).unwrap();
      setLocalCartItems([]);
      setItemDiscounts({});
      setItemDiscountTypes({});
      setItemTaxes({});
      setShipping(0);
      setGst(0);
      if (documentType !== 'quotation') clearDraft();
      setShowClearCartModal(false);
      message.success('Cart cleared successfully');
    } catch (e) {
      message.error(e?.data?.message || 'Failed to clear cart');
    }
  }, [userId, clearCart, clearDraft, documentType]);

  // Common Props
  const commonProps = {
    cartSyncReady,
    localCartItems,
    mainCartItems,
    optionalCartItems,
    calculationCartItems,
    payloadCartItems,
    cartProductsData,
    subTotal,
    totalDiscount,
    tax,
    optionalTotal,
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
    handleSetItemLocations,
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
    handleAssignOptionToParent,
    onCartOrderChange: handleCartOrderChange,
    quotationData,
    handleQuotationChange,
  };

  return (
    <div className="page-wrapper">
      <div className="content">
        <div style={{ marginBottom: 24 }}>
          <Segmented
            disabled={
              !!draftWorkspace &&
              (draftWorkspace.busy ||
                !cartSyncReady ||
                clearingCart ||
                removingCartItem ||
                Object.values(updatingItems).some(Boolean))
            }
            value={documentType}
            onChange={handleDocumentTypeChange}
            options={documentOptions}
            block
            size="large"
          />
        </div>

        {documentType === 'order' && (
          <div className="cm-quote-hint">
            <FileTextOutlined />
            <span>
              Order for a quotation the customer agreed to? Start from it and skip adding products
              again.
            </span>
            <Button type="primary" size="small" onClick={() => setPickQuotation(true)}>
              Choose quotation
            </Button>
          </div>
        )}
        <NewOrderModal open={pickQuotation} onClose={() => setPickQuotation(false)} />
        {renderToolbar?.(commonProps)}
        {draftWorkspace && (
          <QuotationCartSwitcher
            {...draftWorkspace}
            open={draftsOpen}
            onClose={() => setDraftsOpen(false)}
            documentType={documentType}
            ready={
              cartSyncReady &&
              !clearingCart &&
              !removingCartItem &&
              !Object.values(updatingItems).some(Boolean)
            }
            snapshot={{ parent: draftWorkspace.parent, layout: { ...draftData, localCartItems } }}
          />
        )}

        <Tabs
          activeKey={activeTab}
          onChange={(key) => (key === 'drafts' ? setDraftsOpen(true) : setActiveTab(key))}
          type="card"
        >
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
          {draftWorkspace && (
            <TabPane tab={`Your Drafts (${draftWorkspace.workspace.drafts.length})`} key="drafts" />
          )}
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
