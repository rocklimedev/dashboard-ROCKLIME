// src/pages/quotations/NewCart.jsx
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Tabs,
  Modal,
  Button,
  Typography,
  Segmented,
  Space,
  message,
} from "antd";
import { ShoppingCartOutlined, CheckCircleOutlined } from "@ant-design/icons";
import {
  useGetCustomersQuery,
  useCreateCustomerMutation,
  customerApi,
} from "../../api/customerApi";
import {
  useGetCartQuery,
  useUpdateCartMutation,
  useClearCartMutation,
  useRemoveFromCartMutation,
  cartApi,
} from "../../api/cartApi";
import { useGetProfileQuery } from "../../api/userApi";
import { useCreateQuotationMutation } from "../../api/quotationApi";
import { useCreateOrderMutation } from "../../api/orderApi";
import {
  useGetAllAddressesQuery,
  useCreateAddressMutation,
} from "../../api/addressApi";
import { useGetAllTeamsQuery } from "../../api/teamApi";
import {
  useGetVendorsQuery,
  useCreateVendorMutation,
} from "../../api/vendorApi";
import { useCreatePurchaseOrderMutation } from "../../api/poApi";
import { useGetAllProductsQuery } from "../../api/productApi";
import { v4 as uuidv4 } from "uuid";
import { useDispatch } from "react-redux";
import { debounce } from "lodash";
import moment from "moment";
import styled from "styled-components";
import CartTab from "./Cart";
import QuotationForm from "./QuotationForm";
import OrderForm from "./OrderForm";
import PurchaseOrderForm from "./PurchaseOrderForm";
import AddAddress from "../Address/AddAddressModal";
import AddVendorModal from "./AddVendorModal";
import AddNewTeam from "../Orders/AddNewTeam";
import { useGetAllUsersQuery } from "../../api/userApi";
import AddCustomerModal from "../Customers/AddCustomerModal";
import PreviewQuotation from "../Quotation/PreviewQuotation";
import { useAuth } from "../../context/AuthContext";
import { skipToken } from "@reduxjs/toolkit/query";
import useProductsData from "../../data/useProductdata";
import useUserAndCustomerData from "../../data/useUserAndCustomerData";
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

const RESTRICTED_ROLES = ["SUPER_ADMIN", "DEVELOPER", "ADMIN"];

const NewCart = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { auth } = useAuth();
  const canCreatePurchaseOrder =
    auth?.role && RESTRICTED_ROLES.includes(auth.role);

  // ── Profile & Users ───────────────────────────────────────
  const { data: profileData } = useGetProfileQuery();
  const { data: usersData } = useGetAllUsersQuery();
  const users = usersData?.users ?? [];
  const user = profileData?.user ?? {};
  const userId = user.userId;

  // ── State ──────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState("cart");
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [selectedVendor, setSelectedVendor] = useState("");
  const [showClearCartModal, setShowClearCartModal] = useState(false);
  const [showAddAddressModal, setShowAddAddressModal] = useState(false);
  const [showAddVendorModal, setShowAddVendorModal] = useState(false);
  const [showAddTeamModal, setShowAddTeamModal] = useState(false);
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [documentType, setDocumentType] = useState("Quotation");
  const [useBillingAddress, setUseBillingAddress] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(false);

  const [localCartItems, setLocalCartItems] = useState([]);
  const [itemDiscounts, setItemDiscounts] = useState({});
  const [itemTaxes, setItemTaxes] = useState({});
  const [itemDiscountTypes, setItemDiscountTypes] = useState({});
  const [updatingItems, setUpdatingItems] = useState({});
  const [productSearch, setProductSearch] = useState("");
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [shipping, setShipping] = useState(0);
  const [gst, setGst] = useState(0);
  const [billingAddressId, setBillingAddressId] = useState(null);

  const [quotationData, setQuotationData] = useState({
    quotationDate: new Date().toISOString().split("T")[0],
    dueDate: "",
    billTo: "",
    shipTo: null,
    floors: [],
    signatureName: "CM TRADING CO",
    signatureImage: "",
    discountType: "fixed",
    discountAmount: "",
    followupDates: [],
  });

  const [orderData, setOrderData] = useState({
    createdFor: "",
    createdBy: userId || "",
    assignedTeamId: "",
    assignedUserId: "",
    secondaryUserId: "",
    pipeline: "",
    status: "PREPARING",
    dueDate: moment().add(1, "days").format("YYYY-MM-DD"),
    followupDates: [],
    source: "",
    priority: "medium",
    description: "",
    invoiceLink: null,
    orderNo: "",
    quotationId: "",
    masterPipelineNo: "",
    previousOrderNo: "",
    shipTo: "",
  });

  const [purchaseOrderData, setPurchaseOrderData] = useState({
    vendorId: "",
    orderDate: moment().format("YYYY-MM-DD"),
    expectedDeliveryDate: null,
    items: [],
    totalAmount: 0,
    status: "pending",
  });

  // ── Queries & Mutations ────────────────────────────────────
  const { data: cartData } = useGetCartQuery(userId, { skip: !userId });
  const { data: customerData } = useGetCustomersQuery(
    { limit: 500 },
    { skip: activeTab !== "checkout" },
  );
  const { data: teamsData, refetch: refetchTeams } = useGetAllTeamsQuery();
  const { data: addressesData, refetch: refetchAddresses } =
    useGetAllAddressesQuery(selectedCustomer || skipToken, {
      skip: !selectedCustomer || activeTab !== "checkout",
    });
  const { data: productsData } = useGetAllProductsQuery();
  const { data: vendorsData } = useGetVendorsQuery();

  const [updateCart] = useUpdateCartMutation();
  const [clearCart] = useClearCartMutation();
  const [removeFromCart] = useRemoveFromCartMutation();
  const [createQuotation] = useCreateQuotationMutation();
  const [createOrder] = useCreateOrderMutation();
  const [createPurchaseOrder] = useCreatePurchaseOrderMutation();
  const [createVendor, { isLoading: isCreatingVendor }] =
    useCreateVendorMutation();
  const [createAddress] = useCreateAddressMutation();
  const [createCustomer] = useCreateCustomerMutation();

  // ── Memoized values ────────────────────────────────────────
  const allCartItems = useMemo(() => cartData?.cart?.items || [], [cartData]);

  // Sync local cart items + migrate old keys
  useEffect(() => {
    if (!allCartItems.length) return;

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

        // Migration fallback (old keys)
        if (serverItem.floor_number && !floorId) {
          floorId = `fl_${serverItem.floor_number}`;
          floorName =
            quotationData.floors?.find(
              (f) => f.number === serverItem.floor_number,
            )?.name || `Floor ${serverItem.floor_number}`;
        }
        if (serverItem.room_id && !roomId) {
          roomId = `${floorId || "rm_"}${serverItem.room_id}`;
          roomName =
            quotationData.floors
              ?.find((f) => f.number === serverItem.floor_number)
              ?.rooms?.find((r) => r.id === serverItem.room_id)?.name || "Room";
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
  }, [allCartItems, quotationData.floors]);

  const customers = customerData?.data || [];
  const addresses = addressesData || [];
  const products = productsData?.data || [];
  const teams = teamsData?.teams || [];
  const vendors = vendorsData || [];
  const purchaseOrderTotal = useMemo(
    () =>
      purchaseOrderData.items
        .reduce(
          (sum, item) =>
            sum + Number(item.total || 0) * (1 + (item.tax || 0) / 100),
          0,
        )
        .toFixed(2),
    [purchaseOrderData.items],
  );
  const debouncedSearch = useMemo(
    () =>
      debounce((value) => {
        setProductSearch(value);
        if (value.trim()) {
          const filtered = products
            .filter(
              (p) =>
                p.productId &&
                (p.name?.toLowerCase().includes(value.toLowerCase()) ||
                  p.product_code?.toLowerCase().includes(value.toLowerCase())),
            )
            .slice(0, 5);
          setFilteredProducts(filtered);
        } else {
          setFilteredProducts([]);
        }
      }, 300),
    [products],
  );

  // ── Calculations (unchanged) ────────────────────────────────────────
  const calculationCartItems = useMemo(
    () => localCartItems.filter((i) => !i.isOption),
    [localCartItems],
  );

  const { productsData: cartProductsData, errors: productErrors } =
    useProductsData(calculationCartItems);

  const subTotal = useMemo(
    () =>
      calculationCartItems.reduce(
        (sum, i) => sum + (i.price || 0) * (i.quantity || 0),
        0,
      ),
    [calculationCartItems],
  );
  const debouncedAddresses = useMemo(() => {
    return addresses; // or use lodash debounce if needed
  }, [addresses]);

  const userIds = useMemo(
    () => [...new Set(debouncedAddresses.map((a) => a.userId).filter(Boolean))],
    [debouncedAddresses],
  );

  const customerIds = useMemo(
    () => [
      ...new Set(debouncedAddresses.map((a) => a.customerId).filter(Boolean)),
    ],
    [debouncedAddresses],
  );
  const { userMap, customerMap } = useUserAndCustomerData(
    userIds,
    customerIds,
    {
      skip: activeTab !== "checkout" || !addresses.length || !selectedCustomer,
    }, // Add !selectedCustomer
  );
  const totalDiscount = useMemo(
    () =>
      calculationCartItems.reduce((sum, item) => {
        const subtotal = (item.price || 0) * (item.quantity || 1);
        const discVal = Number(itemDiscounts[item.productId]) || 0;
        const type = itemDiscountTypes[item.productId] || "percent";
        const disc =
          type === "percent"
            ? (subtotal * discVal) / 100
            : discVal * (item.quantity || 1);
        return sum + disc;
      }, 0),
    [calculationCartItems, itemDiscounts, itemDiscountTypes],
  );

  const tax = useMemo(
    () =>
      calculationCartItems.reduce((acc, item) => {
        const subtotal = (item.price || 0) * (item.quantity || 1);
        const discVal = Number(itemDiscounts[item.productId]) || 0;
        const type = itemDiscountTypes[item.productId] || "percent";
        const discAmt =
          type === "percent" ? (subtotal * discVal) / 100 : discVal;
        const taxable = subtotal - discAmt;
        const itemTax = Number(itemTaxes[item.productId]) || 0;
        return acc + (taxable * itemTax) / 100;
      }, 0),
    [calculationCartItems, itemDiscounts, itemDiscountTypes, itemTaxes],
  );

  const extraDiscount = useMemo(() => {
    const amount = Number(quotationData.discountAmount) || 0;
    if (!amount) return 0;
    const base = subTotal - totalDiscount + tax + shipping;
    return quotationData.discountType === "percent"
      ? (base * amount) / 100
      : amount;
  }, [
    quotationData.discountAmount,
    quotationData.discountType,
    subTotal,
    totalDiscount,
    tax,
    shipping,
  ]);

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

  // ── Handlers ───────────────────────────────────────────────
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
  const handleTeamAdded = (showModal) => {
    setShowAddTeamModal(showModal);
    if (!showModal) refetchTeams();
  };

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
  const assignItemToLocation = useCallback(() => {
    if (!selectedFloorId) return message.error("Please select a floor");

    setLocalCartItems((prev) =>
      prev.map((item) =>
        item.id === assignModal.itemId
          ? {
              ...item,
              floorId: selectedFloorId,
              floorName:
                quotationData.floors.find((f) => f.floorId === selectedFloorId)
                  ?.floorName || `Floor ${selectedFloorId}`,
              roomId: selectedRoomId || null,
              roomName: selectedRoomId
                ? quotationData.floors
                    .find((f) => f.floorId === selectedFloorId)
                    ?.rooms?.find((r) => r.roomId === selectedRoomId)?.roomName
                : null,
            }
          : item,
      ),
    );

    message.success("Item assigned successfully");
    setAssignModal({ visible: false, itemId: null });
    setSelectedFloorId(null);
    setSelectedRoomId(null);
  }, [
    assignModal.itemId,
    selectedFloorId,
    selectedRoomId,
    quotationData.floors,
  ]);

  // ... (rest of your handlers: handleMakeOption, handleClearCart, handleCreateDocument, resetForm, etc.)
  const handleMakeOption = (productId, optionType, parentProductId = null) => {
    if (!userId) return message.error("User not logged in");

    dispatch(
      cartApi.util.updateQueryData("getCart", userId, (draft) => {
        const item = draft.cart.items.find((i) => i.productId === productId);
        if (item) {
          if (optionType === null) {
            item.isOption = false;
            item.optionType = null;
            item.parentProductId = null;
            item.selected = true;
          } else {
            item.isOption = true;
            item.optionType = optionType;
            item.parentProductId = parentProductId || null;
            item.selected = true;
          }
        }
      }),
    );

    message.info(
      optionType
        ? `Item marked as ${optionType}${parentProductId ? ` for ${getParentName(parentProductId)}` : ""}`
        : "Item reset to main product",
    );
  };
  const getParentName = (parentProductId) => {
    if (!parentProductId) return "Unknown";
    const parentItem = allCartItems.find(
      (i) => i.productId === parentProductId,
    );
    return parentItem?.name || "Deleted/Unknown product";
  };
  // ────────────────────── HANDLERS ──────────────────────
  const handleShippingChange = useCallback((v) => setShipping(v), []);

  const handleDiscountChange = (productId, value) =>
    setItemDiscounts((p) => ({ ...p, [productId]: value >= 0 ? value : 0 }));

  const handleDiscountTypeChange = (productId, type) =>
    setItemDiscountTypes((p) => ({ ...p, [productId]: type }));

  const handleTaxChange = (productId, value) =>
    setItemTaxes((p) => ({ ...p, [productId]: value >= 0 ? value : 0 }));

  const handleClearCart = async () => {
    if (!userId) return message.error("User not logged in!");
    try {
      await clearCart({ userId }).unwrap();
      setLocalCartItems([]);
      setShowClearCartModal(false);
      setActiveTab("cart");
      message.success("Cart cleared");
    } catch (e) {
      message.error(e.data?.message || "Failed to clear cart");
    }
  };

  const handleCreateDocument = async () => {
    if (!userId) return message.error("User not logged in!");

    if (localCartItems.length === 0) {
      return message.error("Cart is empty. Please add items.");
    }

    if (documentType !== "Purchase Order" && !selectedCustomer) {
      return message.error("Please select a customer.");
    }

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    const selectedCustomerData = customerList.find(
      (c) => c.customerId === selectedCustomer,
    );
    if (!selectedCustomerData) {
      return message.error("Selected customer not found.");
    }

    if (documentType === "Quotation") {
      if (!quotationData.dueDate || !dateRegex.test(quotationData.dueDate)) {
        return message.error("Please select a valid due date (YYYY-MM-DD).");
      }
      if (moment(quotationData.dueDate).isBefore(moment(), "day")) {
        return message.error("Due date cannot be in the past.");
      }
    } else if (documentType === "Order") {
      if (!orderData.dueDate || !dateRegex.test(orderData.dueDate)) {
        return message.error("Please select a valid due date (YYYY-MM-DD).");
      }
      if (moment(orderData.dueDate).isBefore(moment(), "day")) {
        return message.error("Due date cannot be in the past.");
      }
    }

    let finalShipTo = null;

    if (documentType !== "Purchase Order") {
      if (useBillingAddress) {
        if (billingAddressId) {
          finalShipTo = billingAddressId;
        } else {
          const customer = customers.find(
            (c) => c.customerId === selectedCustomer,
          );
          if (!customer?.address) {
            message.error(
              "Customer has no default address. Please add one first.",
            );
            return;
          }

          let parsedAddr;
          try {
            parsedAddr =
              typeof customer.address === "string"
                ? JSON.parse(customer.address)
                : customer.address;
          } catch {
            message.error("Customer's default address format is invalid.");
            return;
          }

          const street = (parsedAddr.street || "").trim();
          const city = (parsedAddr.city || "").trim();
          const state = (parsedAddr.state || "").trim();
          const postalCode = (
            parsedAddr.zip ||
            parsedAddr.postalCode ||
            ""
          ).trim();
          const country = (parsedAddr.country || "India").trim();

          if (!street || !city || !state || !country) {
            message.error("Default address is missing required fields.");
            return;
          }

          const payload = {
            customerId: selectedCustomer,
            street,
            city,
            state,
            postalCode,
            country,
            status: "SHIPPING",
          };

          try {
            const response = await createAddress(payload).unwrap();
            finalShipTo = response.addressId;
            message.success(
              "Shipping address created automatically from default.",
            );
          } catch (apiError) {
            message.error(
              apiError?.data?.message || "Failed to create shipping address.",
            );
            return;
          }
        }
      } else {
        finalShipTo =
          documentType === "Quotation"
            ? quotationData.shipTo
            : orderData.shipTo;

        if (finalShipTo) {
          const addr = addresses.find((a) => a.addressId === finalShipTo);
          if (!addr) {
            message.error("Selected shipping address was deleted.");
            return;
          }
        }
      }

      if (!finalShipTo) {
        message.error("Please select or create a shipping address.");
        return;
      }
    }

    const safeItems = localCartItems.map((item) => ({
      ...item,
      floorId: item.floorId || null,
      floorName: item.floorName || null,
      roomId: item.roomId || null,
      roomName: item.roomName || null,
      areaId: item.areaId || null,
      areaName: item.areaName || null,
    }));
    if (documentType === "Purchase Order") {
      if (!selectedVendor) {
        return message.error("Please select a vendor.");
      }

      const formattedItems = purchaseOrderData.items.map((item) => ({
        productId: item.productId,
        quantity: Number(item.quantity) || 1,
        unitPrice: Number(item.mrp) || Number(item.unitPrice) || 0.01,
        mrp: Number(item.mrp) || 0.01,
        tax: Number(item.tax) || 0,
        discount: Number(item.discount) || 0,
        discountType: item.discountType || "percent",
      }));

      if (formattedItems.some((i) => i.mrp <= 0)) {
        return message.error("All items must have MRP > 0.");
      }

      const payload = {
        vendorId: selectedVendor,
        items: formattedItems,
        expectDeliveryDate: purchaseOrderData.expectedDeliveryDate
          ? moment(purchaseOrderData.expectedDeliveryDate).format("YYYY-MM-DD")
          : null,
      };

      try {
        const result = await createPurchaseOrder(payload).unwrap();
        message.success(
          `Purchase Order ${result.purchaseOrder?.poNumber} created!`,
        );
        await handleClearCart();
        resetForm();
        navigate("/purchase-manager");
      } catch (err) {
        message.error(err?.data?.message || "Failed to create Purchase Order.");
      }
      return;
    }
    if (documentType === "Quotation") {
      const quotationPayload = {
        quotationId: uuidv4(),
        document_title: `Quotation for ${customers.find((c) => c.customerId === selectedCustomer)?.name || "Customer"} - ${moment().format("DD-MM-YYYY")}`,
        quotation_date:
          quotationData.quotationDate || moment().format("YYYY-MM-DD"),
        due_date: quotationData.dueDate,
        customerId: selectedCustomer,
        shipTo: finalShipTo,
        extraDiscount: Number(quotationData.discountAmount) || 0,
        extraDiscountType: quotationData.discountType || "fixed",
        shippingAmount: Number(shipping) || 0,
        gst: Number(gst) || 0,
        signature_name: quotationData.signatureName || "CM TRADING CO",
        signature_image: quotationData.signatureImage || "",
        floors: quotationData.floors || [],
        products: safeItems,
        followupDates: quotationData.followupDates?.filter(Boolean) || [],
        createdBy: auth?.userId || "system",
      };

      try {
        const result = await createQuotation(quotationPayload).unwrap();
        message.success(
          `Quotation ${result.quotation?.reference_number} created!`,
        );
        await handleClearCart();
        navigate("/quotations/list");
      } catch (err) {
        message.error(err?.data?.message || "Failed to create quotation.");
      }
      return;
    }

    if (documentType === "Order") {
      const taxableBase = subTotal - totalDiscount + tax;
      const afterTaxAndShipping = taxableBase + shipping;
      const extraDiscValue =
        quotationData.discountType === "percent"
          ? (afterTaxAndShipping * Number(quotationData.discountAmount || 0)) /
            100
          : Number(quotationData.discountAmount || 0);

      const amountForGst =
        subTotal + shipping + tax - totalDiscount - extraDiscValue;
      const gstAmount = Math.round((amountForGst * gst) / 100);

      const orderPayload = {
        id: uuidv4(),
        createdFor: selectedCustomer,
        createdBy: userId,
        assignedTeamId: orderData.assignedTeamId || null,
        assignedUserId: orderData.assignedUserId || null,
        secondaryUserId: orderData.secondaryUserId || null,
        pipeline: orderData.pipeline || null,
        status: orderData.status || "PREPARING",
        gst: Number(gst),
        gstValue: Number(gstAmount),
        extraDiscount: Number(quotationData.discountAmount) || 0,
        extraDiscountType: quotationData.discountType || "percent",
        extraDiscountValue: Number(extraDiscValue.toFixed(2)),
        dueDate: orderData.dueDate,
        followupDates: orderData.followupDates?.filter(Boolean) || [],
        source: orderData.source || null,
        priority: orderData.priority || "medium",
        description: orderData.description || null,
        invoiceLink: null,
        quotationId: orderData.quotationId || null,
        masterPipelineNo: orderData.masterPipelineNo || null,
        previousOrderNo: orderData.previousOrderNo || null,
        shipTo: finalShipTo,
        floors: quotationData.floors || [],
        products: safeItems, // ← cleaned version (if Order backend validates too)
      };

      try {
        const result = await createOrder(orderPayload).unwrap();
        message.success(`Order ${result.orderNo} created successfully!`);
        await handleClearCart();
        resetForm();
        navigate("/orders/list");
      } catch (err) {
        const msg =
          err?.data?.message ||
          err?.data?.error ||
          err?.data ||
          "Unknown error – check network tab";
        message.error(msg);
      }
    }
  };

  const resetForm = () => {
    setQuotationData({
      quotationDate: new Date().toISOString().split("T")[0],
      dueDate: "",
      billTo: "",
      shipTo: null,
      floors: [],
      signatureName: "CM TRADING CO",
      discountType: "fixed",
      discountAmount: "",
      followupDates: [],
    });
    setOrderData({
      createdFor: "",
      createdBy: userId || "",
      assignedTeamId: "",
      assignedUserId: "",
      secondaryUserId: "",
      pipeline: "",
      status: "PREPARING",
      dueDate: moment().add(1, "days").format("YYYY-MM-DD"),
      followupDates: [],
      source: "",
      priority: "medium",
      description: "",
      orderNo: "",
      shipTo: "",
    });
    setPurchaseOrderData({
      vendorId: "",
      orderDate: moment().format("YYYY-MM-DD"),
      expectedDeliveryDate: null,
      items: [],
      totalAmount: 0,
      status: "pending",
    });
    setSelectedCustomer("");
    setSelectedVendor("");
    setItemDiscounts({});
    setItemTaxes({});
    setItemDiscountTypes({});
    setDocumentType("Quotation");
    setActiveTab("cart");
    setProductSearch("");
    setFilteredProducts([]);
    setUseBillingAddress(false);
  };
  const validateFollowupDates = () => {
    if (!orderData.dueDate || orderData.followupDates.length === 0) return true;
    const dueDate = moment(orderData.dueDate);
    return orderData.followupDates.every((date) => {
      if (!date || new Date(date).toString() === "Invalid Date") return true;
      return moment(date).isSameOrBefore(dueDate, "day");
    });
  };

  const handleAddCustomer = () => setShowAddCustomerModal(true);

  const handleCustomerSave = async (newCustomer) => {
    try {
      await createCustomer(newCustomer).unwrap();
      dispatch(customerApi.util.invalidateTags(["Customer"]));
      setSelectedCustomer(newCustomer.customerId || "");
      setShowAddCustomerModal(false);
    } catch (err) {
      message.error(err?.data?.message || "Failed to create customer.");
    }
  };

  const handleAddAddress = () => setShowAddAddressModal(true);

  // ── Render ─────────────────────────────────────────────────
  return (
    <div className="page-wrapper">
      <div className="content">
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          type="card"
          tabBarExtraContent={
            <Segmented
              value={documentType}
              onChange={setDocumentType}
              options={[
                { label: "Quotation", value: "Quotation" },
                { label: "Order", value: "Order" },
                ...(canCreatePurchaseOrder
                  ? [{ label: "Purchase Order", value: "Purchase Order" }]
                  : []),
              ]}
            />
          }
        >
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
              quotationData={quotationData}
              itemDiscounts={itemDiscounts}
              itemDiscountTypes={itemDiscountTypes}
              itemTaxes={itemTaxes}
              updatingItems={updatingItems}
              handleUpdateQuantity={handleUpdateQuantity}
              handleRemoveItem={handleRemoveItem}
              handleDiscountChange={(id, val) =>
                setItemDiscounts((prev) => ({ ...prev, [id]: val }))
              }
              handleDiscountTypeChange={(id, type) =>
                setItemDiscountTypes((prev) => ({ ...prev, [id]: type }))
              }
              handleTaxChange={(id, val) =>
                setItemTaxes((prev) => ({ ...prev, [id]: val }))
              }
              setShowClearCartModal={setShowClearCartModal}
              setActiveTab={setActiveTab}
              onShippingChange={setShipping}
              documentType={documentType}
              setDocumentType={setDocumentType}
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
            {documentType === "Purchase Order" ? (
              <PurchaseOrderForm
                purchaseOrderData={purchaseOrderData}
                setPurchaseOrderData={setPurchaseOrderData}
                selectedVendor={selectedVendor}
                setSelectedVendor={setSelectedVendor}
                vendors={vendors}
                products={products}
                productSearch={productSearch}
                filteredProducts={filteredProducts}
                debouncedSearch={debouncedSearch}
                addPurchaseOrderProduct={(productId) => {
                  const product = products.find(
                    (p) => p.productId === productId,
                  );
                  if (
                    !product ||
                    purchaseOrderData.items.some(
                      (i) => i.productId === productId,
                    ) ||
                    allCartItems.some((i) => i.productId === productId)
                  ) {
                    message.error(
                      product ? "Product already added." : "Product not found.",
                    );
                    return;
                  }
                  const sellingPrice =
                    product.metaDetails?.find((m) => m.slug === "sellingPrice")
                      ?.value || 0;
                  if (sellingPrice <= 0) {
                    message.error(`Invalid MRP for ${product.name}`);
                    return;
                  }
                  const quantity = 1;
                  const total = quantity * sellingPrice;
                  setPurchaseOrderData((prev) => {
                    const newItems = [
                      ...prev.items,
                      {
                        id: product.productId,
                        productId: product.productId,
                        name: product.name,
                        quantity,
                        mrp: sellingPrice,
                        total,
                        tax: 0,
                      },
                    ];
                    const totalAmount = newItems
                      .reduce((s, i) => s + i.total * (1 + i.tax / 100), 0)
                      .toFixed(2);
                    return { ...prev, items: newItems, totalAmount };
                  });
                  setProductSearch("");
                  setFilteredProducts([]);
                }}
                removePurchaseOrderProduct={(index) => {
                  setPurchaseOrderData((prev) => {
                    const newItems = prev.items.filter((_, i) => i !== index);
                    const totalAmount = newItems
                      .reduce((s, i) => s + i.total * (1 + i.tax / 100), 0)
                      .toFixed(2);
                    return { ...prev, items: newItems, totalAmount };
                  });
                }}
                updatePurchaseOrderProductField={(index, field, value) => {
                  const items = [...purchaseOrderData.items];
                  items[index][field] = value;
                  if (["quantity", "mrp", "tax"].includes(field)) {
                    const q = Number(items[index].quantity) || 1;
                    const m = Number(items[index].mrp) || 0.01;
                    const t = Number(items[index].tax) || 0;
                    items[index].total = q * m * (1 + t / 100);
                  }
                  const totalAmount = items
                    .reduce((s, i) => s + i.total * (1 + i.tax / 100), 0)
                    .toFixed(2);
                  setPurchaseOrderData({
                    ...purchaseOrderData,
                    items,
                    totalAmount,
                  });
                }}
                handlePurchaseOrderChange={(key, value) =>
                  setPurchaseOrderData((prev) => ({ ...prev, [key]: value }))
                }
                purchaseOrderTotal={purchaseOrderTotal}
                documentType={documentType}
                setDocumentType={setDocumentType}
                cartItems={localCartItems}
                setActiveTab={setActiveTab}
                handleCreateDocument={handleCreateDocument}
                setShowAddVendorModal={setShowAddVendorModal}
              />
            ) : documentType === "Order" ? (
              <OrderForm
                orderData={orderData}
                setOrderData={setOrderData}
                handleOrderChange={(key, value) =>
                  setOrderData((prev) => ({ ...prev, [key]: value }))
                }
                selectedCustomer={selectedCustomer}
                setSelectedCustomer={setSelectedCustomer}
                customers={customers}
                shipping={shipping}
                onShippingChange={setShipping}
                addresses={addresses}
                teams={teams}
                users={users}
                documentType={documentType}
                setDocumentType={setDocumentType}
                cartItems={localCartItems}
                totalAmount={totalAmount}
                tax={tax}
                totalDiscount={totalDiscount}
                extraDiscount={extraDiscount}
                extraDiscountType={quotationData.discountType}
                roundOff={roundOff}
                subTotal={subTotal}
                handleAddCustomer={() => setShowAddCustomerModal(true)}
                handleAddAddress={() => setShowAddAddressModal(true)}
                setActiveTab={setActiveTab}
                handleCreateDocument={handleCreateDocument}
                useBillingAddress={useBillingAddress}
                setUseBillingAddress={setUseBillingAddress}
              />
            ) : (
              <QuotationForm
                quotationData={quotationData}
                setQuotationData={setQuotationData}
                handleQuotationChange={(key, value) =>
                  setQuotationData((prev) => ({ ...prev, [key]: value }))
                }
                selectedCustomer={selectedCustomer}
                setSelectedCustomer={setSelectedCustomer}
                customers={customers}
                addresses={addresses}
                userMap={userMap}
                teams={teams}
                users={users}
                customerMap={customerMap}
                cartItems={localCartItems}
                setCartItems={setLocalCartItems}
                subTotal={subTotal}
                shipping={shipping}
                setShipping={setShipping}
                tax={tax}
                discount={totalDiscount}
                extraDiscount={extraDiscount}
                gst={gst}
                setGst={setGst}
                totalAmount={totalAmount}
                handleAddCustomer={() => setShowAddCustomerModal(true)}
                handleAddAddress={() => setShowAddAddressModal(true)}
                setActiveTab={setActiveTab}
                handleCreateDocument={handleCreateDocument}
                useBillingAddress={useBillingAddress}
                setUseBillingAddress={setUseBillingAddress}
                setBillingAddressId={setBillingAddressId}
                previewVisible={previewVisible}
                setPreviewVisible={setPreviewVisible}
              />
            )}
          </TabPane>
        </Tabs>

        {/* ── Modals (only global ones) ─────────────────────────────────────── */}
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

        {showAddAddressModal && (
          <AddAddress
            visible={true}
            onClose={() => setShowAddAddressModal(false)}
            onSave={(addressId) => {
              if (documentType === "Order") {
                setOrderData((p) => ({ ...p, shipTo: addressId }));
              }
              setShowAddAddressModal(false);
              refetchAddresses();
            }}
            selectedCustomer={selectedCustomer}
          />
        )}

        <AddVendorModal
          show={showAddVendorModal}
          onClose={() => setShowAddVendorModal(false)}
          onSave={createVendor}
          isCreatingVendor={isCreatingVendor}
        />

        {showAddTeamModal && (
          <AddNewTeam
            onClose={() => setShowAddTeamModal(false)}
            visible={showAddTeamModal}
          />
        )}

        {showAddCustomerModal && (
          <AddCustomerModal
            visible={showAddCustomerModal}
            onClose={() => setShowAddCustomerModal(false)}
            customer={null}
            onSave={() => {}}
          />
        )}

        <PreviewQuotation
          visible={previewVisible}
          onClose={() => setPreviewVisible(false)}
          cartItems={calculationCartItems}
          productsData={cartProductsData}
          customer={customers.find((c) => c.customerId === selectedCustomer)}
          address={addresses.find((a) => a.addressId === quotationData.shipTo)}
          quotationData={{ ...quotationData }}
          itemDiscounts={itemDiscounts}
          itemDiscountTypes={itemDiscountTypes}
          itemTaxes={itemTaxes}
          gstRate={gst}
          includeGst
        />
      </div>
    </div>
  );
};

export default NewCart;
