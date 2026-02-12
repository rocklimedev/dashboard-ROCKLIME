import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Alert, Tabs, Modal, Button, Typography, Segmented } from "antd";
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
import { message } from "antd";
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

  // ────────────────────── PROFILE & USER ──────────────────────
  const { data: profileData } = useGetProfileQuery();
  const { data: usersData } = useGetAllUsersQuery();
  const users = Array.isArray(usersData?.users) ? usersData.users : [];
  const user = profileData?.user || {};
  const userId = user.userId;

  // ────────────────────── STATE ──────────────────────
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

  // Form data
  const [quotationData, setQuotationData] = useState({
    quotationDate: new Date().toISOString().split("T")[0],
    dueDate: "",
    billTo: "",
    shipTo: null,
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

  // Per-item overrides
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

  // ────────────────────── QUERIES ──────────────────────
  const { data: cartData } = useGetCartQuery(userId, {
    skip: !userId,
    refetchOnMountOrArgChange: false,
    refetchOnFocus: false,
    refetchOnReconnect: false,
  });
  const customerQueryArgs = useMemo(() => ({ limit: 500 }), []);
  const shouldFetchCustomers = activeTab === "checkout";
  const customerQueryOptions = useMemo(
    () => ({
      skip: !userId || !shouldFetchCustomers,
      refetchOnMountOrArgChange: false,
      refetchOnFocus: false, // ← add this
      refetchOnReconnect: false, // ← add this
    }),
    [userId, shouldFetchCustomers], // ← important: include shouldFetchCustomers
  );
  const { data: customerData } = useGetCustomersQuery(
    customerQueryArgs,
    customerQueryOptions,
  );
  const { data: allOrdersData } = useGetAllOrdersQuery();
  const { data: teamsData, refetch: refetchTeams } = useGetAllTeamsQuery();
  const { data: addressesData, refetch: refetchAddresses } =
    useGetAllAddressesQuery(selectedCustomer || skipToken, {
      skip: !selectedCustomer || activeTab !== "checkout", // Add tab check to skip if not in checkout
      refetchOnMountOrArgChange: false,
      refetchOnFocus: false,
      refetchOnReconnect: false,
    });
  const { data: productsData } = useGetAllProductsQuery();
  const { data: vendorsData } = useGetVendorsQuery();

  // Mutations
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

  // ────────────────────── MEMOIZED VALUES ──────────────────────
  const addresses = useMemo(
    () =>
      Array.isArray(addressesData)
        ? addressesData.filter((a) => a.customerId === selectedCustomer)
        : [],
    [addressesData, selectedCustomer],
  );
  const orders = useMemo(
    () => (Array.isArray(allOrdersData?.orders) ? allOrdersData.orders : []),
    [allOrdersData],
  );
  const teams = useMemo(
    () => (Array.isArray(teamsData?.teams) ? teamsData.teams : []),
    [teamsData],
  );
  const vendors = useMemo(() => vendorsData || [], [vendorsData]);
  const products = useMemo(() => {
    if (!productsData) return [];
    if (Array.isArray(productsData)) return productsData;
    if (Array.isArray(productsData?.data)) return productsData.data;
    if (Array.isArray(productsData?.products)) return productsData.products;
    console.warn("useGetAllProductsQuery returned non-array:", productsData);
    return [];
  }, [productsData]);

  const customers = customerData?.data || [];
  const customerList = useMemo(
    () => (Array.isArray(customers) ? customers : []),
    [customers],
  );

  // ── Cart items separation ──
  const allCartItems = useMemo(
    () => (Array.isArray(cartData?.cart?.items) ? cartData.cart.items : []),
    [cartData],
  );

  // Only main (non-optional) items – used for financial calculations
  const calculationCartItems = useMemo(
    () => allCartItems.filter((i) => !i.isOption),
    [allCartItems],
  );

  // Full list for UI rendering (main + optional)
  const displayCartItems = allCartItems;

  const { productsData: cartProductsData, errors: productErrors } =
    useProductsData(calculationCartItems);

  // Add this
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
  // Only run when really needed (e.g. when rendering specific address details)
  const { userMap, customerMap } = useUserAndCustomerData(
    userIds,
    customerIds,
    {
      skip: activeTab !== "checkout" || !addresses.length || !selectedCustomer,
    }, // Add !selectedCustomer
  );
  // ────────────────────── TOTALS & CALCULATIONS ──────────────────────
  const totalItems = useMemo(
    () => allCartItems.reduce((a, i) => a + (i.quantity || 0), 0),
    [allCartItems],
  );

  const subTotal = useMemo(
    () =>
      calculationCartItems.reduce(
        (a, i) => a + (i.price || 0) * (i.quantity || 0),
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
      const price = item.price || 0;
      const qty = item.quantity || 1;
      const subtotal = price * qty;
      const discVal = Number(itemDiscounts[item.productId]) || 0;
      const type = itemDiscountTypes[item.productId] || "percent";
      const discAmt =
        type === "percent" ? (subtotal * discVal) / 100 : discVal * qty;
      const taxable = subtotal - discAmt;
      const itemTax = parseFloat(itemTaxes[item.productId]) || 0;
      return acc + (taxable * itemTax) / 100;
    }, 0);
  }, [calculationCartItems, itemDiscounts, itemDiscountTypes, itemTaxes]);

  const extraDiscount = useMemo(() => {
    const amount = parseFloat(quotationData.discountAmount) || 0;
    if (!amount) return 0;
    const base = subTotal - totalDiscount + tax + shipping;
    return quotationData.discountType === "percent"
      ? parseFloat(((base * amount) / 100).toFixed(2))
      : parseFloat(amount.toFixed(2));
  }, [
    quotationData.discountAmount,
    quotationData.discountType,
    subTotal,
    totalDiscount,
    tax,
    shipping,
  ]);

  const amountBeforeGstRaw =
    subTotal - totalDiscount + tax + shipping - extraDiscount;
  const amountBeforeGst = parseFloat(amountBeforeGstRaw.toFixed(2));

  const rupees = Math.floor(amountBeforeGst);
  const paise = Math.round((amountBeforeGst - rupees) * 100);
  let roundOff = 0;
  if (paise > 0 && paise <= 50)
    roundOff = parseFloat((-paise / 100).toFixed(2));
  else if (paise > 50) roundOff = parseFloat(((100 - paise) / 100).toFixed(2));

  const roundedAmount = parseFloat((amountBeforeGst + roundOff).toFixed(2));
  const gstAmount =
    gst > 0 ? parseFloat(((roundedAmount * gst) / 100).toFixed(2)) : 0;
  const totalAmount = parseFloat((roundedAmount + gstAmount).toFixed(2));

  const handleMakeOption = (productId, optionType, parentProductId = null) => {
    if (!userId) {
      message.error("User not logged in");
      return;
    }

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

  // ────────────────────── EFFECTS ──────────────────────
  useEffect(() => {
    const missing = calculationCartItems
      .filter((it) => !(it.productId in itemDiscountTypes))
      .reduce((acc, it) => ({ ...acc, [it.productId]: "percent" }), {});
    if (Object.keys(missing).length) {
      setItemDiscountTypes((prev) => ({ ...prev, ...missing }));
    }
  }, [calculationCartItems]);

  useEffect(() => {
    if (documentType === "Purchase Order") {
      setPurchaseOrderData((prev) => ({
        ...prev,
        items: calculationCartItems.map((item) => ({
          id: item.productId,
          productId: item.productId,
          name: item.name || "Unknown",
          quantity: item.quantity || 1,
          mrp: item.price || 0.01,
          total: (item.quantity || 1) * (item.price || 0.01),
          tax: itemTaxes[item.productId] || 0,
        })),
      }));
    }
  }, [calculationCartItems, itemTaxes, documentType]);

  useEffect(() => {
    if (selectedCustomer) {
      const cust = customerList.find((c) => c.customerId === selectedCustomer);
      if (cust) {
        setQuotationData((prev) => ({
          ...prev,
          billTo: cust.name || prev.billTo,
        }));
        setOrderData((prev) => ({ ...prev, createdFor: cust.customerId }));
      }
    }
  }, [selectedCustomer, customerList]);

  useEffect(() => {
    if (documentType === "Order") {
      setQuotationData((prev) => ({
        ...prev,
        discountType: orderData.extraDiscountType || "percent",
        discountAmount: orderData.extraDiscount?.toString() || "",
      }));
    }
  }, [documentType, orderData.extraDiscountType, orderData.extraDiscount]);

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

  const handleRemoveItem = useCallback(
    async (e, productId) => {
      e?.preventDefault?.();
      e?.stopPropagation?.();

      if (!userId) return message.error("User not logged in!");

      dispatch(
        cartApi.util.updateQueryData("getCart", userId, (draft) => {
          draft.cart.items = draft.cart.items.filter(
            (i) => i.productId !== productId,
          );
        }),
      );

      setItemDiscounts((p) => {
        const { [productId]: _, ...rest } = p;
        return rest;
      });
      setItemTaxes((p) => {
        const { [productId]: _, ...rest } = p;
        return rest;
      });
      setItemDiscountTypes((p) => {
        const { [productId]: _, ...rest } = p;
        return rest;
      });

      setUpdatingItems((p) => ({ ...p, [productId]: true }));

      try {
        await removeFromCart({ userId, productId }).unwrap();
      } catch (err) {
        message.error(err?.data?.message || "Failed");
        dispatch(
          cartApi.util.updateQueryData("getCart", userId, () => ({
            cart: { items: allCartItems },
          })),
        );
      } finally {
        setUpdatingItems((p) => ({ ...p, [productId]: false }));
      }
    },
    [userId, allCartItems, dispatch, removeFromCart],
  );

  const handleUpdateQuantity = useCallback(
    async (productId, newQty) => {
      if (!userId || newQty < 1) return;
      setUpdatingItems((p) => ({ ...p, [productId]: true }));
      try {
        await updateCart({
          userId,
          productId,
          quantity: Number(newQty),
        }).unwrap();
      } catch (err) {
        message.error(err?.data?.message || "Failed");
      } finally {
        setUpdatingItems((p) => ({ ...p, [productId]: false }));
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
  const getFinalShipTo = () => {
    if (!useBillingAddress) {
      // user manually selected an existing address
      return quotationData.shipTo || orderData.shipTo || null;
    }

    // ── useBillingAddress === true ──

    if (billingAddressId) {
      // user selected an existing BILLING address to use as shipping
      return billingAddressId;
    }

    // No existing billing → we need to create one from customer's default address
    const customer = customerList.find(
      (c) => c.customerId === selectedCustomer,
    );
    if (!customer?.address) return null;

    let defaultAddr;
    try {
      defaultAddr =
        typeof customer.address === "string"
          ? JSON.parse(customer.address)
          : customer.address;
    } catch {
      return null;
    }

    if (!defaultAddr?.street || !defaultAddr?.city) return null;

    return {
      // flag telling backend or mutation: please create this address
      createFromDefault: true,
      addressDetails: {
        street: defaultAddr.street?.trim() || "",
        city: defaultAddr.city || "",
        state: defaultAddr.state || "",
        postalCode: defaultAddr.zip || defaultAddr.postalCode || "",
        country: defaultAddr.country || "India",
      },
      status: "SHIPPING", // or "BILLING_AND_SHIPPING" if your backend supports it
    };
  };
  // ────────────────────── CREATE DOCUMENT ──────────────────────
  const handleCreateDocument = async () => {
    if (!userId) {
      return message.error("User not logged in!");
    }

    // ────────────────────────────────────────────────
    //  1. Common validations
    // ────────────────────────────────────────────────
    if (calculationCartItems.length === 0) {
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
    let createdShippingAddressId = null;

    if (documentType !== "Purchase Order") {
      if (useBillingAddress) {
        if (billingAddressId) {
          // User selected an existing billing address → use it for shipping
          finalShipTo = billingAddressId;
        } else {
          // "Same as Billing" → create from customer's default address
          const customer = customerList.find(
            (c) => c.customerId === selectedCustomer,
          );
          if (!customer?.address) {
            return message.error(
              "Customer has no default address to use as billing/shipping.",
            );
          }

          let parsedAddr;
          try {
            parsedAddr =
              typeof customer.address === "string"
                ? JSON.parse(customer.address)
                : customer.address;
          } catch (e) {
            console.error(
              "Failed to parse customer default address:",
              e,
              customer.address,
            );
            return message.error(
              "Invalid format in customer's default address field.",
            );
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
            console.warn("Incomplete default address:", {
              street,
              city,
              state,
              postalCode,
              country,
            });
            return message.error(
              "Cannot create shipping address: customer's default address is missing required fields (street, city, state, country).",
            );
          }

          const newAddressPayload = {
            customerId: selectedCustomer,
            street: street,
            city: city,
            state: state,
            postalCode: postalCode,
            country: country,
            status: "ADDITIONAL", // ← must match ENUM: BILLING, PRIMARY, ADDITIONAL
          };

          // Debug log
          console.log(
            "[DEBUG] Creating shipping address (flat payload):",
            JSON.stringify(newAddressPayload, null, 2),
          );

          try {
            const res = await createAddress(newAddressPayload).unwrap();
            console.log("[DEBUG] Address created successfully:", res);

            createdShippingAddressId = res.addressId;
            finalShipTo = res.addressId;

            refetchAddresses?.();
            message.success(
              "Shipping address automatically created from default.",
            );
          } catch (err) {
            console.error("[ERROR] Address creation failed:", {
              status: err.status,
              response: err.data,
              payloadSent: newAddressPayload,
            });
            return message.error(
              err?.data?.message ||
                "Failed to create shipping address from default.",
            );
          }
        }
      } else {
        // Manually selected existing address
        finalShipTo =
          documentType === "Quotation"
            ? quotationData.shipTo
            : orderData.shipTo;

        if (finalShipTo) {
          const addr = addresses.find((a) => a.addressId === finalShipTo);
          if (!addr) {
            return message.error("Selected shipping address no longer exists.");
          }
          if (addr.customerId !== selectedCustomer) {
            return message.error(
              "Selected address does not belong to the chosen customer.",
            );
          }
        }
      }

      // Final check
      if (!finalShipTo) {
        return message.error("Please select or create a shipping address.");
      }
    }

    // ────────────────────────────────────────────────
    //  3. Document-type specific creation
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

        products: allCartItems.map((item) => {
          const price = Number(item.price) || 0;
          const qty = Number(item.quantity) || 1;
          const discVal = Number(itemDiscounts[item.productId]) || 0;
          const discType = itemDiscountTypes[item.productId] || "percent";

          const lineTotal =
            discType === "percent"
              ? price * qty * (1 - discVal / 100)
              : (price - discVal) * qty;

          return {
            productId: item.productId,
            name: item.name || "Unknown Product",
            price: Number(price.toFixed(2)),
            quantity: qty,
            discount: Number(discVal.toFixed(2)),
            discountType: discType,
            imageUrl: item.imageUrl || "", // optional – nice to have
            productCode: item.productCode || "", // if you have it
            companyCode: item.companyCode || "", // if you have it
            tax: Number(itemTaxes[item.productId]) || 0,
            total: Number(lineTotal.toFixed(2)),
            isOptionFor: item.parentProductId || null,
            optionType: item.optionType || null,
            groupId: item.groupId || null,
          };
        }),

        followupDates: quotationData.followupDates.filter(Boolean),
        customerId: selectedCustomer,
        shipTo: finalShipTo,
        createdBy: userId,
        signature_name: quotationData.signatureName || "CM TRADING CO",
        signature_image: "",
      };

      try {
        const result = await createQuotation(quotationPayload).unwrap();
        message.success(
          `Quotation ${result.quotation?.reference_number} created!`,
        );
        await handleClearCart();
        resetForm();
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

        products: allCartItems.map((item) => {
          const price = Number(item.price || 0);
          const qty = Number(item.quantity || 1);
          const discVal = Number(itemDiscounts[item.productId] || 0);
          const discType = itemDiscountTypes[item.productId] || "percent";
          const taxRate = Number(itemTaxes[item.productId] || 0);

          const subtotal = price * qty;
          const discountAmt =
            discType === "percent" ? (subtotal * discVal) / 100 : discVal;
          const afterDisc = subtotal - discountAmt;
          const taxAmt = (afterDisc * taxRate) / 100;
          const lineTotalRaw = afterDisc + taxAmt;

          return {
            id: item.productId, // ← CHANGE THIS: use "id" instead of "productId"
            name: item.name || "Unnamed Product",
            imageUrl: item.imageUrl || "",
            productCode: item.productCode || "",
            companyCode: item.companyCode || "",
            quantity: qty,
            price: Number(price.toFixed(2)),
            discount: Number(discVal.toFixed(2)),
            discountType: discType,
            tax: taxRate,
            total: Number(lineTotalRaw.toFixed(2)),
          };
        }),
      };

      try {
        console.log(
          "ORDER PAYLOAD BEING SENT:",
          JSON.stringify(orderPayload, null, 2),
        );
        const result = await createOrder(orderPayload).unwrap();
        message.success(`Order ${result.orderNo} created successfully!`);
        await handleClearCart();
        resetForm();
        navigate("/orders/list");
      } catch (err) {
        console.error("Create order failed – full error:", err);
        console.log("Response data:", err?.data);
        console.log("Status:", err?.status);
        console.log("Response headers:", err?.headers);

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

  // ────────────────────── RENDER ──────────────────────
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
            <div
              style={{
                paddingRight: 16,
                display: "flex",
                alignItems: "center",
                gap: 12,
              }}
            >
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
            </div>
          }
        >
          <TabPane
            tab={
              <span>
                <ShoppingCartOutlined /> Cart ({totalItems})
              </span>
            }
            key="cart"
          >
            <CartTab
              cartItems={displayCartItems}
              cartProductsData={cartProductsData}
              totalItems={totalItems}
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
              onShippingChange={handleShippingChange}
              handleMakeOption={handleMakeOption}
              getParentName={getParentName}
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
                cartItems={displayCartItems}
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
                setPreviewVisible={setPreviewVisible}
              />
            )}
          </TabPane>
        </Tabs>

        {/* Modals */}
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
              console.log("New address created:", addressId);
              if (documentType === "Order") {
                setOrderData((prev) => ({ ...prev, shipTo: addressId }));
              }
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
