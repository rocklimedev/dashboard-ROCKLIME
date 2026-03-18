import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Tabs,
  Modal,
  Button,
  Typography,
  Segmented,
  Space,
  Tag,
  Select,
  Form,
  Input,
  message,
} from "antd";
import {
  ShoppingCartOutlined,
  CheckCircleOutlined,
  HomeOutlined,
} from "@ant-design/icons";
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
import {
  useCreateOrderMutation,
  useGetAllOrdersQuery,
} from "../../api/orderApi";
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
import useUserAndCustomerData from "../../data/useUserAndCustomerData";
import useProductsData from "../../data/useProductdata";
import { debounce } from "lodash";
import moment from "moment";
import styled from "styled-components";
import PropTypes from "prop-types";
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
import { useCreateSiteMapMutation } from "../../api/siteMapApi";

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

const NewCart = ({ onConvertToOrder }) => {
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

  const [createSiteMap] = useCreateSiteMapMutation();

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

  const [localCartItems, setLocalCartItems] = useState([]);
  const [assignModal, setAssignModal] = useState({
    visible: false,
    itemId: null,
  });
  const [selectedFloorForAssign, setSelectedFloorForAssign] = useState(null);
  const [selectedRoomForAssign, setSelectedRoomForAssign] = useState(null);

  const [quotationData, setQuotationData] = useState({
    quotationDate: new Date().toISOString().split("T")[0],
    dueDate: "",
    billTo: "",
    shipTo: null,
    floors: [{ number: 1, name: "Ground Floor", rooms: [] }],
    signatureName: "CM TRADING CO",
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

  const [itemDiscounts, setItemDiscounts] = useState({});
  const [itemTaxes, setItemTaxes] = useState({});
  const [itemDiscountTypes, setItemDiscountTypes] = useState({});
  const [previewVisible, setPreviewVisible] = useState(false);
  const [updatingItems, setUpdatingItems] = useState({});
  const [productSearch, setProductSearch] = useState("");
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [shipping, setShipping] = useState(0);
  const [gst, setGst] = useState(0);
  const [billingAddressId, setBillingAddressId] = useState(null);

  // ── Queries & Mutations ────────────────────────────────────
  const { data: cartData } = useGetCartQuery(userId, { skip: !userId });
  const { data: customerData } = useGetCustomersQuery(
    { limit: 500 },
    { skip: activeTab !== "checkout" },
  );
  const { data: allOrdersData } = useGetAllOrdersQuery();
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

  // ── Debounced product search (memory-leak fix) ─────────────
  const debouncedSearchRef = useRef(null);

  const handleProductSearch = useCallback((value) => {
    debouncedSearchRef.current?.(value);
  }, []);

  // ── Sync local cart items (optimized) ──────────────────────
  useEffect(() => {
    if (!allCartItems.length) return;

    setLocalCartItems((prev) => {
      const prevMap = new Map(
        prev.map((item) => [item.id || item.productId, item]),
      );

      return allCartItems.map((serverItem) => {
        const id = serverItem.id || serverItem.productId || uuidv4();
        const local = prevMap.get(id);

        if (local) {
          return {
            ...serverItem,
            id,
            floor_number: local.floor_number ?? serverItem.floor_number ?? null,
            room_id: local.room_id ?? serverItem.room_id ?? null,
          };
        }

        return {
          ...serverItem,
          id,
          floor_number: serverItem.floor_number ?? null,
          room_id: serverItem.room_id ?? null,
        };
      });
    });
  }, [allCartItems]);

  const customers = customerData?.data || [];
  const customerList = useMemo(() => customers, [customers]);
  const addresses = addressesData || [];
  const products = productsData?.data || productsData || [];
  const teams = useMemo(() => teamsData?.teams || [], [teamsData]);
  const vendors = useMemo(() => vendorsData || [], [vendorsData]);
  useEffect(() => {
    debouncedSearchRef.current = debounce((value) => {
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
    }, 300);

    return () => {
      debouncedSearchRef.current?.cancel();
    };
  }, [products]);

  // ── Calculations ───────────────────────────────────────────
  const calculationCartItems = useMemo(
    () => localCartItems.filter((i) => !i.isOption),
    [localCartItems],
  );
  const displayCartItems = allCartItems;

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
  const handleProductSearchChange = useCallback(
    (e) => {
      handleProductSearch(e.target.value);
    },
    [handleProductSearch],
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
  const handleTeamAdded = (showModal) => {
    setShowAddTeamModal(showModal);
    if (!showModal) refetchTeams();
  };

  const handleQuotationChange = useCallback((key, value) => {
    setQuotationData((prev) => ({ ...prev, [key]: value }));
  }, []);

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

      setUpdatingItems((prev) => ({ ...prev, [productId]: true }));

      try {
        await removeFromCart({ userId, productId }).unwrap();
      } catch (err) {
        message.error(err?.data?.message || "Failed to remove item");
      } finally {
        setUpdatingItems((prev) => ({ ...prev, [productId]: false }));
      }
    },
    [userId, dispatch, removeFromCart],
  );

  const assignItemToLocation = useCallback(() => {
    if (!selectedFloorForAssign) return message.error("Please select a floor");

    setLocalCartItems((prev) =>
      prev.map((item) =>
        item.id === assignModal.itemId
          ? {
              ...item,
              floor_number: selectedFloorForAssign,
              room_id: selectedRoomForAssign || null,
            }
          : item,
      ),
    );

    message.success("Item assigned successfully");
    setAssignModal({ visible: false, itemId: null });
    setSelectedFloorForAssign(null);
    setSelectedRoomForAssign(null);
  }, [assignModal.itemId, selectedFloorForAssign, selectedRoomForAssign]);

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
      resetForm();
      setShowClearCartModal(false);
      setActiveTab("cart");
    } catch (e) {
      message.error(e.data?.message || "Failed to clear cart");
    }
  };
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
  const debouncedSearch = useCallback(
    debounce((value) => {
      setProductSearch(value);
      if (value) {
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
  const handleCreateDocument = async () => {
    if (!userId) {
      return message.error("User not logged in!");
    }

    // ────────────────────────────────────────────────
    // Helper: Clean invalid floor_number / room_id references
    // ────────────────────────────────────────────────
    // Helper: Remove references to floors/rooms that no longer exist
    // Helper: Remove references to non-existent floors/rooms before sending to backend
    const cleanItemAssignments = (items, floors) => {
      if (!floors?.length || !items?.length) {
        return items.map((item) => ({
          ...item,
          floor_number: null,
          room_id: null,
        }));
      }

      // Known good floors and their rooms
      const validFloors = new Set(floors.map((f) => f.number));
      const floorToRooms = new Map(
        floors.map((floor) => [
          floor.number,
          new Set(floor.rooms?.map((r) => r.id) || []),
        ]),
      );

      return items.map((item) => {
        let { floor_number, room_id, ...rest } = item;

        // 1. Floor no longer exists → clear both
        if (floor_number && !validFloors.has(floor_number)) {
          floor_number = null;
          room_id = null;
        }

        // 2. Room no longer exists on that floor → keep floor, clear room
        if (
          room_id &&
          floor_number &&
          !floorToRooms.get(floor_number)?.has(room_id)
        ) {
          room_id = null;
        }

        return { ...rest, floor_number, room_id };
      });
    };
    // Helper: Transform floors to match backend's expected room key (room_id instead of id)
    // Helper: Transform floors → match backend DB structure + validation expectation
    const normalizeFloorsForBackend = (floors) => {
      if (!floors?.length) return [];

      return floors.map((floor) => ({
        floor_number: floor.number, // backend field
        floor_name: floor.name, // backend field
        rooms: (floor.rooms || []).map((room) => ({
          room_id: room.id, // ← must match backend validation: r.room_id
          name: room.name || room.room_name, // consistent
          type: room.type || room.room_type,
          // add size/details if you have them later
        })),
        // Do NOT include extra keys like number/name — keep only what DB expects
      }));
    };
    // ────────────────────────────────────────────────
    //  1. Common validations
    // ────────────────────────────────────────────────
    if (localCartItems.length === 0) {
      return message.error("Cart is empty. Please add items.");
    }

    if (documentType !== "Purchase Order" && !selectedCustomer) {
      return message.error("Please select a customer.");
    }

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

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
      if (orderData.followupDates?.length > 0 && !validateFollowupDates()) {
        return message.error("Follow-up dates cannot be after the due date.");
      }
    }

    // ────────────────────────────────────────────────
    //  2. Resolve final shipping address
    // ────────────────────────────────────────────────
    let finalShipTo = null;

    if (documentType !== "Purchase Order") {
      if (useBillingAddress) {
        if (billingAddressId) {
          finalShipTo = billingAddressId;
        } else {
          const customer = customerList.find(
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
          if (addr.customerId !== selectedCustomer) {
            message.error("Selected address does not belong to this customer.");
            return;
          }
        }
      }

      if (!finalShipTo) {
        message.error("Please select or create a shipping address.");
        return;
      }
    }

    // ────────────────────────────────────────────────
    //  3. Prepare & CLEAN common product payload
    // ────────────────────────────────────────────────
    const safeItems = cleanItemAssignments(
      localCartItems,
      quotationData.floors,
    );

    // Debug: Log how many assignments were cleaned (remove in production)
    const cleanedCount = safeItems.filter((safe, idx) => {
      const original = localCartItems[idx];
      return (
        safe.floor_number !== original?.floor_number ||
        safe.room_id !== original?.room_id
      );
    }).length;

    if (cleanedCount > 0) {
      console.warn(
        `Cleaned ${cleanedCount} invalid floor/room assignments before creation`,
      );
    }

    // ────────────────────────────────────────────────
    //  4. Document-type specific creation
    // ────────────────────────────────────────────────

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

    const selectedCustomerData = customerList.find(
      (c) => c.customerId === selectedCustomer,
    );
    if (!selectedCustomerData) {
      return message.error("Selected customer not found.");
    }

    // ────────────────────────────────────────────────
    // Quotation Creation
    // ────────────────────────────────────────────────
    if (documentType === "Quotation") {
      const quotationPayload = {
        quotationId: uuidv4(),
        document_title: `Quotation for ${selectedCustomerData.name || "Customer"}`,
        quotation_date:
          quotationData.quotationDate || moment().format("YYYY-MM-DD"),
        due_date: quotationData.dueDate,
        extraDiscount: Number(quotationData.discountAmount) || 0,
        extraDiscountType: quotationData.discountType || "fixed",
        shippingAmount: Number(shipping) || 0,
        gst: Number(gst) || 0,
        finalAmount: totalAmount,
        floors: quotationData.floors || [],
        products: safeItems, // ← cleaned version
        followupDates: quotationData.followupDates.filter(Boolean),
        customerId: selectedCustomer,
        shipTo: finalShipTo,
        createdBy: userId,
        signature_name: quotationData.signatureName || "CM TRADING CO",
        signature_image: "",
      };

      let quotationId = null;

      try {
        const result = await createQuotation(quotationPayload).unwrap();
        message.success(
          `Quotation ${result.quotation?.reference_number} created!`,
        );
        quotationId = result.quotation?.quotationId || result.quotation?.id;
      } catch (err) {
        message.error(err?.data?.message || "Failed to create quotation.");
        return;
      }

      // Inside handleCreateDocument → site-map block
      if (quotationId && quotationData.floors?.length > 0) {
        try {
          const normalizedFloorDetails = normalizeFloorsForBackend(
            quotationData.floors,
          );

          await createSiteMap({
            customerId: selectedCustomer,
            name: `Site Map - ${selectedCustomerData?.name || "Customer"} - ${moment().format("DD-MM-YY")}`,
            totalFloors: quotationData.floors.length,
            floorDetails: normalizedFloorDetails, // ← KEY CHANGE: floorDetails, not floors
            items: safeItems,
            quotationId: quotationId,
          }).unwrap();

          message.success("Site Map created and linked to quotation!");
        } catch (siteMapErr) {
          console.error("Site Map creation failed:", siteMapErr);
          message.warning(
            "Quotation created, but Site Map failed – check console/network tab.",
          );
        }
      }

      await handleClearCart();
      resetForm();
      navigate("/quotations/list");
      return;
    }

    // ────────────────────────────────────────────────
    // Order Creation
    // ────────────────────────────────────────────────
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
      signatureName: "CM TRADING CO",
      discountType: "fixed",
      discountAmount: "",
      followupDates: [],
    });
    setOrderData((prev) => ({
      ...prev,
      createdFor: "",
      assignedTeamId: "",
      assignedUserId: "",
      secondaryUserId: "",
      pipeline: "",
      dueDate: moment().add(1, "days").format("YYYY-MM-DD"),
      followupDates: [],
      source: "",
      priority: "medium",
      description: "",
      orderNo: "",
      shipTo: null,
    }));
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
  if (productErrors.length > 0) {
    return (
      <PageWrapper>
        <Alert
          message="Error loading cart products"
          description={productErrors.map((e) => e.error).join(", ")}
          type="error"
          showIcon
        />
      </PageWrapper>
    );
  }

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
              handleDiscountChange={handleDiscountChange}
              handleDiscountTypeChange={handleDiscountTypeChange}
              handleTaxChange={handleTaxChange}
              setShowClearCartModal={setShowClearCartModal}
              setActiveTab={setActiveTab}
              onShippingChange={(v) => setShipping(v)}
              handleMakeOption={handleMakeOption}
              getParentName={getParentName}
              documentType={documentType}
              setDocumentType={setDocumentType}
              setAssignModal={setAssignModal} // NEW - trigger assignment
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
                cartItems={displayCartItems}
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
                customers={customerList}
                shipping={shipping}
                onShippingChange={handleShippingChange}
                addresses={addresses}
                userMap={userMap}
                customerMap={customerMap}
                teams={teams}
                users={users}
                documentType={documentType}
                setDocumentType={setDocumentType}
                cartItems={displayCartItems}
                totalAmount={totalAmount}
                tax={tax}
                totalDiscount={totalDiscount}
                extraDiscount={orderData.extraDiscount}
                extraDiscountType={orderData.extraDiscountType}
                roundOff={roundOff}
                subTotal={subTotal}
                handleAddCustomer={handleAddCustomer}
                handleAddAddress={handleAddAddress}
                setActiveTab={setActiveTab}
                handleCreateDocument={handleCreateDocument}
                handleTeamAdded={handleTeamAdded}
                useBillingAddress={useBillingAddress}
                setUseBillingAddress={setUseBillingAddress}
              />
            ) : (
              <QuotationForm
                quotationData={quotationData}
                setQuotationData={setQuotationData}
                handleQuotationChange={handleQuotationChange}
                selectedCustomer={selectedCustomer}
                onShippingChange={handleShippingChange}
                setSelectedCustomer={setSelectedCustomer}
                customers={customerList}
                addresses={addresses}
                userMap={userMap}
                customerMap={customerMap}
                documentType={documentType}
                setDocumentType={setDocumentType}
                cartItems={localCartItems}
                setCartItems={setLocalCartItems}
                totalAmount={totalAmount}
                gst={gst}
                gstAmount={gstAmount}
                setGst={setGst}
                shipping={shipping}
                tax={tax}
                discount={totalDiscount}
                extraDiscount={extraDiscount}
                roundOff={roundOff}
                subTotal={subTotal}
                handleAddCustomer={handleAddCustomer}
                handleAddAddress={handleAddAddress}
                setActiveTab={setActiveTab}
                handleCreateDocument={handleCreateDocument}
                useBillingAddress={useBillingAddress}
                setBillingAddressId={setBillingAddressId}
                setUseBillingAddress={setUseBillingAddress}
                itemDiscounts={itemDiscounts}
                itemTaxes={itemTaxes}
                previewVisible={previewVisible}
                setPreviewVisible={setPreviewVisible} // ── These 6 lines were missing ────────────────────────────────
                // assignModal={assignModal}
                // setAssignModal={setAssignModal}
                // selectedFloorForAssign={selectedFloorForAssign}
                // setSelectedFloorForAssign={setSelectedFloorForAssign}
                // selectedRoomForAssign={selectedRoomForAssign}
                // setSelectedRoomForAssign={setSelectedRoomForAssign}
              />
            )}
          </TabPane>
        </Tabs>

        {/* Assignment Modal */}
        <Modal
          title="Assign Item to Floor / Room"
          open={assignModal.visible}
          onOk={assignItemToLocation}
          onCancel={() => {
            setAssignModal({ visible: false, itemId: null });
            setSelectedFloorForAssign(null);
            setSelectedRoomForAssign(null);
          }}
          okText="Assign"
          width={500}
        >
          <Space direction="vertical" style={{ width: "100%" }} size="middle">
            <div>
              <Text strong>Product:</Text>{" "}
              <Text>
                {localCartItems.find((i) => i.id === assignModal.itemId)
                  ?.name || "—"}
              </Text>
            </div>

            <div>
              <Text strong>
                Floor <span style={{ color: "red" }}>*</span>
              </Text>
              <Select
                placeholder="Select floor"
                value={selectedFloorForAssign}
                onChange={(v) => {
                  setSelectedFloorForAssign(v);
                  setSelectedRoomForAssign(null);
                }}
                style={{ width: "100%", marginTop: 8 }}
              >
                {(quotationData.floors || []).map((floor) => (
                  <Select.Option key={floor.number} value={floor.number}>
                    {floor.name}
                  </Select.Option>
                ))}
              </Select>
            </div>

            {selectedFloorForAssign && (
              <div>
                <Text strong>Room (optional)</Text>
                <Select
                  placeholder="Whole floor / common area"
                  allowClear
                  value={selectedRoomForAssign}
                  onChange={setSelectedRoomForAssign}
                  style={{ width: "100%", marginTop: 8 }}
                >
                  {(quotationData.floors || [])
                    .find((f) => f.number === selectedFloorForAssign)
                    ?.rooms?.map((r) => (
                      <Select.Option key={r.id} value={r.id}>
                        {r.name} {r.type && `(${r.type})`}
                      </Select.Option>
                    ))}
                </Select>
              </div>
            )}
          </Space>
        </Modal>

        {/* Your existing modals */}
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
              if (documentType === "Order")
                setOrderData((p) => ({ ...p, shipTo: addressId }));
              setShowAddAddressModal(false);
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
          cartItems={calculationCartItems} // ← only main items
          productsData={cartProductsData}
          customer={customerList.find((c) => c.customerId === selectedCustomer)}
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

NewCart.propTypes = {
  onConvertToOrder: PropTypes.func,
};

NewCart.defaultProps = {
  onConvertToOrder: () => {},
};

export default NewCart;
