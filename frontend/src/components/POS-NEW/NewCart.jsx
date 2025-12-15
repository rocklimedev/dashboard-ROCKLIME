import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Alert, Tabs, Modal, Button, Typography } from "antd";
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
import {
  generateQuotationNumber,
  generateOrderNumber,
  generatePurchaseOrderNumber,
} from "../../data/cartUtils";
import { useGetAllUsersQuery } from "../../api/userApi";
import AddCustomerModal from "../Customers/AddCustomerModal";
import PreviewQuotation from "../Quotation/PreviewQuotation";

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

const NewCart = ({ onConvertToOrder }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

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
  const [quotationNumber, setQuotationNumber] = useState(
    generateQuotationNumber()
  );
  const [orderNumber, setOrderNumber] = useState("");
  const [purchaseOrderNumber, setPurchaseOrderNumber] = useState("");
  const [useBillingAddress, setUseBillingAddress] = useState(false);

  // Form data
  const [quotationData, setQuotationData] = useState({
    quotationDate: new Date().toISOString().split("T")[0],
    dueDate: "",
    billTo: "",
    shipTo: null,
    signatureName: "CM TRADING CO",
    discountType: "percent",
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
  const [gst, setGst] = useState(0); // GST is now always 0
  const [billingAddressId, setBillingAddressId] = useState(null);
  // ────────────────────── QUERIES ──────────────────────
  const { data: cartData } = useGetCartQuery(userId, { skip: !userId });
  const { data: customerData } = useGetCustomersQuery();
  const { data: allOrdersData } = useGetAllOrdersQuery();
  const { data: teamsData, refetch: refetchTeams } = useGetAllTeamsQuery();
  const { data: addressesData, refetch: refetchAddresses } =
    useGetAllAddressesQuery(
      { customerId: selectedCustomer },
      { skip: !selectedCustomer }
    );
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
    () => (Array.isArray(addressesData) ? addressesData : []),
    [addressesData]
  );
  const orders = useMemo(
    () => (Array.isArray(allOrdersData?.orders) ? allOrdersData.orders : []),
    [allOrdersData]
  );
  const teams = useMemo(
    () => (Array.isArray(teamsData?.teams) ? teamsData.teams : []),
    [teamsData]
  );
  const vendors = useMemo(() => vendorsData || [], [vendorsData]);
  const products = useMemo(() => productsData || [], [productsData]);
  const customers = customerData?.data || [];
  const customerList = useMemo(
    () => (Array.isArray(customers) ? customers : []),
    [customers]
  );

  const cartItems = useMemo(
    () => (Array.isArray(cartData?.cart?.items) ? cartData.cart.items : []),
    [cartData]
  );

  const { productsData: cartProductsData, errors: productErrors } =
    useProductsData(cartItems);

  const userIds = useMemo(
    () => [...new Set(addresses.map((a) => a.userId).filter(Boolean))],
    [addresses]
  );
  const customerIds = useMemo(
    () => [...new Set(addresses.map((a) => a.customerId).filter(Boolean))],
    [addresses]
  );
  const { userMap, customerMap, userQueries, customerQueries } =
    useUserAndCustomerData(userIds, customerIds);

  // ────────────────────── TOTALS & CALCULATIONS ──────────────────────
  const totalItems = useMemo(
    () => cartItems.reduce((a, i) => a + (i.quantity || 0), 0),
    [cartItems]
  );
  const subTotal = useMemo(
    () => cartItems.reduce((a, i) => a + (i.price || 0) * (i.quantity || 0), 0),
    [cartItems]
  );

  const totalDiscount = useMemo(() => {
    return cartItems.reduce((sum, item) => {
      const subtotal = (item.price || 0) * (item.quantity || 1);
      const discVal = Number(itemDiscounts[item.productId]) || 0;
      const type = itemDiscountTypes[item.productId] || "percent";
      const disc =
        type === "percent"
          ? (subtotal * discVal) / 100
          : discVal * (item.quantity || 1);
      return sum + disc;
    }, 0);
  }, [cartItems, itemDiscounts, itemDiscountTypes]);

  const tax = useMemo(() => {
    return cartItems.reduce((acc, item) => {
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
  }, [cartItems, itemDiscounts, itemDiscountTypes, itemTaxes]);

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

  // ────────────────────── EFFECTS ──────────────────────
  // Sync discount types for newly added items
  useEffect(() => {
    const missing = cartItems
      .filter((it) => !(it.productId in itemDiscountTypes))
      .reduce((acc, it) => ({ ...acc, [it.productId]: "percent" }), {});
    if (Object.keys(missing).length) {
      setItemDiscountTypes((prev) => ({ ...prev, ...missing }));
    }
  }, [cartItems]);

  // Purchase order sync
  useEffect(() => {
    if (documentType === "Purchase Order") {
      setPurchaseOrderData((prev) => ({
        ...prev,
        items: cartItems.map((item) => ({
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
  }, [cartItems, itemTaxes, documentType]);

  // Generate order / PO numbers
  useEffect(() => {
    if (!orderNumber && allOrdersData) {
      const today = moment().format("DDMMYY");
      const todayOrders = orders.filter((o) =>
        moment(o.createdAt).isSame(moment(), "day")
      );
      const serial = todayOrders.length + 101;
      const generated = `${today}${serial}`;
      setOrderData((prev) => ({ ...prev, orderNo: generated }));
      setOrderNumber(generated);
    }
    if (!purchaseOrderNumber && allOrdersData) {
      setPurchaseOrderNumber(generatePurchaseOrderNumber(orders));
    }
  }, [allOrdersData, orders, orderNumber, purchaseOrderNumber]);

  // Auto-fill customer name
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

  // Sync extra discount between Order & Quotation forms
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

      // Optimistic UI
      dispatch(
        cartApi.util.updateQueryData("getCart", userId, (draft) => {
          draft.cart.items = draft.cart.items.filter(
            (i) => i.productId !== productId
          );
        })
      );

      // Clean local state
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
            cart: { items: cartItems },
          }))
        );
      } finally {
        setUpdatingItems((p) => ({ ...p, [productId]: false }));
      }
    },
    [userId, cartItems, dispatch, removeFromCart]
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
    [userId, updateCart]
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
          0
        )
        .toFixed(2),
    [purchaseOrderData.items]
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
                p.product_code?.toLowerCase().includes(value.toLowerCase()))
          )
          .slice(0, 5);
        setFilteredProducts(filtered);
      } else {
        setFilteredProducts([]);
      }
    }, 300),
    [products]
  );

  // ────────────────────── CREATE DOCUMENT (main handler) ──────────────────────
  const handleCreateDocument = async () => {
    if (documentType === "Purchase Order") {
      if (!selectedVendor) return message.error("Please select a vendor.");
      if (cartItems.length === 0 && purchaseOrderData.items.length === 0)
        return message.error("Please add at least one product.");
      if (purchaseOrderData.items.some((item) => item.mrp <= 0))
        return message.error(
          "All products must have a valid MRP greater than 0."
        );
      if (
        purchaseOrderData.items.some(
          (item) => !products.some((p) => p.productId === item.productId)
        )
      )
        return message.error(
          "Some products are no longer available. Please remove them."
        );

      const formattedItems = purchaseOrderData.items.map((item) => ({
        productId: item.productId,
        quantity: Number(item.quantity) || 1,
        mrp: Number(item.mrp) || 0.01,
        tax: Number(item.tax) || 0, // Include tax
      }));

      const formattedFormData = {
        vendorId: selectedVendor,
        items: formattedItems,
        expectedDeliveryDate: purchaseOrderData.expectedDeliveryDate
          ? moment(purchaseOrderData.expectedDeliveryDate).format("YYYY-MM-DD")
          : null,
        status: purchaseOrderData.status || "pending",
      };

      try {
        await createPurchaseOrder(formattedFormData).unwrap();
        await handleClearCart();
        resetForm();
        navigate("/po/list");
      } catch (err) {
        const errorMessage =
          err.status === 404
            ? "Vendor not found."
            : err.status === 400
            ? `Invalid request: ${
                err.data?.error || err.data?.message || "Check your input data."
              }`
            : err.data?.message || "Failed to create purchase order";
        message.error(errorMessage);
      }
      return;
    }

    if (!selectedCustomer) return message.error("Please select a customer.");
    if (!userId) return message.error("User not logged in!");
    if (cartItems.length === 0)
      return message.error("Cart is empty. Add items to proceed.");

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (documentType === "Order") {
      if (!orderData.dueDate || !dateRegex.test(orderData.dueDate)) {
        return message.error("Invalid due date format. Use YYYY-MM-DD.");
      }
      if (moment(orderData.dueDate).isBefore(moment().startOf("day"))) {
        return message.error("Due date cannot be in the past.");
      }
    } else {
      if (
        !quotationData.quotationDate ||
        !dateRegex.test(quotationData.quotationDate)
      ) {
        return message.error("Invalid quotation date format. Use YYYY-MM-DD.");
      }
      if (!quotationData.dueDate || !dateRegex.test(quotationData.dueDate)) {
        return message.error("Invalid due date format. Use YYYY-MM-DD.");
      }
      if (
        moment(quotationData.dueDate).isBefore(
          moment(quotationData.quotationDate)
        )
      ) {
        return message.error("Due date must be after quotation date.");
      }
    }

    if (isNaN(totalAmount) || totalAmount <= 0)
      return message.error("Invalid total amount.");

    if (
      !cartItems.every(
        (item) =>
          item.productId &&
          typeof item.quantity === "number" &&
          item.quantity > 0 &&
          typeof item.price === "number" &&
          item.price >= 0
      )
    ) {
      return message.error(
        "Invalid cart items. Ensure all items have valid productId, quantity, and price."
      );
    }

    // Auto-create address if useBillingAddress is true and no shipTo is set
    if (
      useBillingAddress &&
      !orderData.shipTo &&
      selectedCustomer &&
      documentType === "Order"
    ) {
      const selectedCustomerData = customerList.find(
        (customer) => customer.customerId === selectedCustomer
      );
      const defaultAddress = selectedCustomerData?.address;
      if (defaultAddress) {
        try {
          const newAddress = {
            customerId: selectedCustomer,
            addressDetails: {
              street: defaultAddress.street,
              city: defaultAddress.city,
              state: defaultAddress.state,
              postalCode: defaultAddress.zip || defaultAddress.postalCode,
              country: defaultAddress.country || "India",
            },
          };
          const result = await createAddress(newAddress).unwrap();
          setOrderData((prev) => ({ ...prev, shipTo: result.addressId }));
          await refetchAddresses();
        } catch (err) {
          message.error(
            `Failed to create address: ${err.data?.message || "Unknown error"}`
          );
          return;
        }
      }
    }

    if (
      documentType === "Order" &&
      orderData.shipTo &&
      !addresses.find((addr) => addr.addressId === orderData.shipTo)
    ) {
      return message.error("Invalid shipping address selected.");
    }

    const selectedCustomerData = customerList.find(
      (customer) => customer.customerId === selectedCustomer
    );
    if (!selectedCustomerData)
      return message.error("Selected customer not found.");

    if (documentType === "Order" && orderData.shipTo) {
      const selectedAddress = addresses.find(
        (addr) => addr.addressId === orderData.shipTo
      );
      if (selectedAddress && selectedAddress.customerId !== selectedCustomer) {
        return message.error(
          "Selected address does not belong to the chosen customer."
        );
      }
    }
    if (documentType === "Quotation") {
      // === BUILD PAYLOAD ===
      // === BUILD PAYLOAD (MATCH BACKEND EXACTLY) ===
      const quotationPayload = {
        quotationId: uuidv4(),
        document_title: `Quotation for ${selectedCustomerData.name}`,
        quotation_date: quotationData.quotationDate,
        due_date: quotationData.dueDate,
        reference_number: quotationNumber,

        // === GLOBAL DISCOUNT: Use backend field names ===
        extraDiscount: parseFloat(quotationData.discountAmount) || 0,
        extraDiscountType: quotationData.discountType || "percent",

        shippingAmount: Number(shipping),
        gst: gst,

        // === FINAL VALUES (calculated on frontend) ===

        finalAmount: totalAmount,

        products: cartItems.map((item) => {
          const price = Number(item.price) || 0;
          const quantity = Number(item.quantity) || 1;
          const rawDiscount = Number(itemDiscounts[item.productId]) || 0;
          const discountType = itemDiscountTypes[item.productId] || "percent";

          // Calculate correct line total AFTER item discount
          let lineTotalAfterDiscount;
          if (discountType === "percent") {
            lineTotalAfterDiscount = price * quantity * (1 - rawDiscount / 100);
          } else {
            // fixed discount = amount per unit
            lineTotalAfterDiscount = (price - rawDiscount) * quantity;
          }

          return {
            productId: item.productId,
            name: item.name || "Unknown Product",
            price: Number(price.toFixed(2)),
            quantity,
            discount: Number(rawDiscount.toFixed(2)),
            discountType,
            tax: Number(itemTaxes[item.productId] || 0),
            total: parseFloat(lineTotalAfterDiscount.toFixed(2)), // ← THIS IS KEY
          };
        }),

        followupDates: quotationData.followupDates.filter(Boolean),

        customerId: selectedCustomerData.customerId,
        shipTo: quotationData.shipTo || null,
        createdBy: userId,
        signature_name: quotationData.signatureName || "CM TRADING CO",
        signature_image: "",
      };

      try {
        await createQuotation(quotationPayload).unwrap();
        await handleClearCart();
        resetForm();
        navigate("/quotations/list");
      } catch (e) {
        message.error(e?.data?.message || "Failed to create quotation");
      }
    } else if (documentType === "Order") {
      const orderNoRegex = /^\d{1,2}\d{2}25\d{3,}$/;
      if (!orderData.orderNo || !orderNoRegex.test(orderData.orderNo)) {
        return message.error(
          "Order Number must be in the format DDMM25XXX (e.g., 151025101)."
        );
      }

      if (!validateFollowupDates()) {
        return message.error("Follow-up dates cannot be after the due date.");
      }

      // Calculate extra discount value FIRST
      const taxableBase = subTotal - totalDiscount + tax;
      const afterTax = taxableBase + shipping;

      const extraDiscountValue =
        quotationData.discountType === "percent"
          ? (afterTax * parseFloat(quotationData.discountAmount || 0)) / 100
          : parseFloat(quotationData.discountAmount || 0);

      const amountForGst =
        subTotal + shipping + tax - totalDiscount - extraDiscountValue;
      const gstAmount = Math.round((amountForGst * gst) / 100); // ← Integer

      const orderPayload = {
        id: uuidv4(),
        orderNo: orderData.orderNo,
        createdFor: selectedCustomerData.customerId,
        createdBy: userId,
        assignedTeamId: orderData.assignedTeamId || null,
        assignedUserId: orderData.assignedUserId || null,
        secondaryUserId: orderData.secondaryUserId || null,
        pipeline: orderData.pipeline || null,
        status: orderData.status || "PREPARING",
        gst: gst,
        gstValue: Number(gstAmount),
        extraDiscount: parseFloat(quotationData.discountAmount || 0),
        extraDiscountType: quotationData.discountType || "percent",
        extraDiscountValue: Number(extraDiscountValue.toFixed(2)),

        dueDate: orderData.dueDate,
        followupDates: orderData.followupDates.filter(
          (date) => date && moment(date).isValid()
        ),
        source: orderData.source || null,
        priority: orderData.priority || "medium",
        description: orderData.description || null,
        invoiceLink: null,
        quotationId: orderData.quotationId || null,
        masterPipelineNo: orderData.masterPipelineNo || null,
        previousOrderNo: orderData.previousOrderNo || null,
        shipTo: orderData.shipTo || null,
        products: cartItems.map((item) => {
          const price = parseFloat(item.price) || 0;
          const quantity = parseInt(item.quantity, 10) || 1;

          const rawDiscount = Number(itemDiscounts[item.productId]) || 0;
          const discountType = itemDiscountTypes[item.productId] || "percent"; // ← CRITICAL

          // CORRECT: Apply discount per unit
          const unitPriceAfterDiscount =
            discountType === "percent"
              ? price * (1 - rawDiscount / 100)
              : price - rawDiscount;

          // CORRECT: Line total (NO TAX)
          const total = Number((unitPriceAfterDiscount * quantity).toFixed(2));

          return {
            id: item.productId,
            price: Number(price.toFixed(2)),
            discount: Number(rawDiscount.toFixed(2)),
            total, // ← will be 63.00 → 63
            quantity,
          };
        }),
      };

      try {
        await createOrder(orderPayload).unwrap();
        await handleClearCart();
        resetForm();
        navigate("/orders/list");
      } catch (error) {
        const errorMessage =
          error?.status === 400
            ? `Bad Request: ${error.data?.message || "Invalid data provided."}`
            : error?.status === 404
            ? `Not Found: ${error.data?.message || "Resource not found."}`
            : error?.status === 500
            ? `Server error: ${
                error.data?.message || "Please try again later."
              }`
            : `Something went wrong: ${
                error.data?.message || "Please try again."
              }`;

        message.error(errorMessage);
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
      discountType: "percent",
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
    setQuotationNumber(generateQuotationNumber());
    setOrderNumber("");
    setPurchaseOrderNumber("");
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
  // Global loader handles loading → only show real errors here
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
        <Tabs activeKey={activeTab} onChange={setActiveTab} type="card">
          <TabPane
            tab={
              <span>
                <ShoppingCartOutlined /> Cart ({totalItems})
              </span>
            }
            key="cart"
          >
            <CartTab
              cartItems={cartItems}
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
                    (p) => p.productId === productId
                  );
                  if (
                    !product ||
                    purchaseOrderData.items.some(
                      (i) => i.productId === productId
                    ) ||
                    cartItems.some((i) => i.productId === productId)
                  ) {
                    message.error(
                      product ? "Product already added." : "Product not found."
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
                  setPurchaseOrderData((prev) => ({
                    ...prev,
                    [key]: value,
                  }))
                }
                purchaseOrderTotal={purchaseOrderTotal}
                purchaseOrderNumber={purchaseOrderNumber}
                documentType={documentType}
                setDocumentType={setDocumentType}
                cartItems={cartItems}
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
                userQueries={userQueries}
                customerQueries={customerQueries}
                teams={teams}
                users={users}
                orderNumber={orderData.orderNo}
                documentType={documentType}
                setDocumentType={setDocumentType}
                cartItems={cartItems}
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
                userQueries={userQueries}
                customerQueries={customerQueries}
                quotationNumber={quotationNumber}
                documentType={documentType}
                setDocumentType={setDocumentType}
                cartItems={cartItems}
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
            onClose={() => setShowAddAddressModal(false)}
            onSave={() => {}}
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
          cartItems={cartItems}
          productsData={cartProductsData}
          customer={customerList.find((c) => c.customerId === selectedCustomer)}
          address={addresses.find((a) => a.addressId === quotationData.shipTo)}
          quotationData={{
            ...quotationData,
            reference_number: quotationNumber,
          }}
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
