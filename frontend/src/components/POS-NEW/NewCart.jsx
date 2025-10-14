import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Spin,
  Alert,
  Tabs,
  Modal,
  Button,
  Typography,
  InputNumber,
} from "antd";
import { ShoppingCartOutlined, CheckCircleOutlined } from "@ant-design/icons";
import {
  useGetCustomersQuery,
  useGetCustomerByIdQuery,
} from "../../api/customerApi";
import {
  useGetCartQuery,
  useUpdateCartMutation,
  useClearCartMutation,
  useRemoveFromCartMutation,
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
import { useGetVendorsQuery } from "../../api/vendorApi";
import { useCreatePurchaseOrderMutation } from "../../api/poApi";
import { useGetAllProductsQuery } from "../../api/productApi";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
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
import { useCreateVendorMutation } from "../../api/vendorApi";
import { useGetAllUsersQuery } from "../../api/userApi";

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

const CartContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 12px;
  @media (min-width: 768px) {
    padding: 20px;
  }
`;

const NewCart = ({ onConvertToOrder }) => {
  const navigate = useNavigate();
  const {
    data: profileData,
    isLoading: profileLoading,
    error: profileError,
  } = useGetProfileQuery();
  const {
    data: users,
    isLoading: usersLoading,
    error: usersError,
  } = useGetAllUsersQuery();

  const userId = profileData?.user?.userId;
  const [useBillingAddress, setUseBillingAddress] = useState(false);

  // State declarations
  const [activeTab, setActiveTab] = useState("cart");
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [selectedVendor, setSelectedVendor] = useState("");
  const [showClearCartModal, setShowClearCartModal] = useState(false);
  const [showAddAddressModal, setShowAddAddressModal] = useState(false);
  const [showAddVendorModal, setShowAddVendorModal] = useState(false);
  const [showAddTeamModal, setShowAddTeamModal] = useState(false);
  const [documentType, setDocumentType] = useState("Quotation");
  const [quotationNumber, setQuotationNumber] = useState(
    generateQuotationNumber()
  );
  const [orderNumber, setOrderNumber] = useState("");
  const [purchaseOrderNumber, setPurchaseOrderNumber] = useState("");
  const [quotationData, setQuotationData] = useState({
    quotationDate: new Date().toISOString().split("T")[0],
    dueDate: "",
    billTo: "",
    shipTo: null,
    signatureName: "CM TRADING CO",
    includeGst: false,
    gstValue: "",
    discountType: "percent",
    roundOff: "",
  });
  const [orderData, setOrderData] = useState({
    createdFor: "",
    createdBy: userId || "",
    assignedTo: "",
    pipeline: "",
    status: "CREATED",
    dueDate: "",
    followupDates: [],
    source: "",
    teamId: "",
    priority: "medium",
    description: "",
    invoiceLink: null,
    orderNo: "",
    quotationId: "",
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
  const [error, setError] = useState("");
  const [updatingItems, setUpdatingItems] = useState({});
  const [productSearch, setProductSearch] = useState("");
  const [filteredProducts, setFilteredProducts] = useState([]);

  // Queries
  const {
    data: cartData,
    isLoading: cartLoading,
    isError: cartError,
    refetch,
  } = useGetCartQuery(userId, { skip: !userId });
  const {
    data: customerData,
    isLoading: customersLoading,
    isError: customersError,
  } = useGetCustomersQuery();
  const {
    data: allOrdersData,
    isLoading: isAllOrdersLoading,
    error: allOrdersError,
  } = useGetAllOrdersQuery();
  const {
    data: teamsData,
    isLoading: teamsLoading,
    refetch: refetchTeams,
  } = useGetAllTeamsQuery();
  const {
    data: addressesData,
    isLoading: addressesLoading,
    isError: addressesError,
    refetch: refetchAddresses,
  } = useGetAllAddressesQuery(
    { customerId: selectedCustomer },
    { skip: !selectedCustomer }
  );
  const { data: productsData, isLoading: isProductsLoading } =
    useGetAllProductsQuery();
  const { data: vendorsData, isLoading: isVendorsLoading } =
    useGetVendorsQuery();
  const [updateCart] = useUpdateCartMutation();
  const [clearCart] = useClearCartMutation();
  const [removeFromCart] = useRemoveFromCartMutation();
  const [createQuotation] = useCreateQuotationMutation();
  const [createOrder] = useCreateOrderMutation();
  const [createPurchaseOrder] = useCreatePurchaseOrderMutation();
  const [createVendor, { isLoading: isCreatingVendor }] =
    useCreateVendorMutation();
  const [createAddress] = useCreateAddressMutation();

  // Memoized data
  const addresses = useMemo(
    () => (Array.isArray(addressesData) ? addressesData : []),
    [addressesData]
  );
  const userIds = useMemo(
    () => [...new Set(addresses.map((addr) => addr.userId).filter(Boolean))],
    [addresses]
  );
  const customerIds = useMemo(
    () => [
      ...new Set(addresses.map((addr) => addr.customerId).filter(Boolean)),
    ],
    [addresses]
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
  const { userMap, customerMap, userQueries, customerQueries } =
    useUserAndCustomerData(userIds, customerIds);
  const cartItems = useMemo(
    () => (Array.isArray(cartData?.cart?.items) ? cartData.cart.items : []),
    [cartData]
  );
  const {
    productsData: cartProductsData,
    errors: productErrors,
    loading: productsLoading,
  } = useProductsData(cartItems);
  const customers = customerData?.data || [];
  const customerList = useMemo(
    () => (Array.isArray(customers) ? customers : []),
    [customers]
  );

  // Sync purchaseOrderData.items with cartItems
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
        })),
        totalAmount: cartItems
          .reduce(
            (sum, item) => sum + (item.quantity || 1) * (item.price || 0),
            0
          )
          .toFixed(2),
      }));
    }
  }, [cartItems, documentType]);

  // Total calculations
  const totalItems = useMemo(
    () => cartItems.reduce((acc, item) => acc + (item.quantity || 0), 0),
    [cartItems]
  );
  const subTotal = useMemo(
    () =>
      cartItems.reduce(
        (acc, item) => acc + (item.price || 0) * (item.quantity || 0),
        0
      ),
    [cartItems]
  );
  const totalDiscount = useMemo(
    () =>
      cartItems.reduce((acc, item) => {
        const discount = parseFloat(itemDiscounts[item.productId]) || 0;
        const quantity = item.quantity || 1;
        const price = item.price || 0;
        if (quotationData.discountType === "percent") {
          return acc + (price * quantity * discount) / 100;
        }
        return acc + discount * quantity;
      }, 0),
    [cartItems, itemDiscounts, quotationData.discountType]
  );
  const shipping = 40;
  const tax = quotationData.includeGst
    ? (subTotal * (parseFloat(quotationData.gstValue) || 0)) / 100
    : 25;
  const roundOff = parseFloat(quotationData.roundOff) || 0;
  const totalAmount = subTotal + shipping + tax - totalDiscount + roundOff;

  // Purchase Order specific calculations
  const purchaseOrderTotal = useMemo(
    () =>
      purchaseOrderData.items
        .reduce((sum, item) => sum + Number(item.total || 0), 0)
        .toFixed(2),
    [purchaseOrderData.items]
  );

  // Debounced product search
  const debouncedSearch = useCallback(
    debounce((value) => {
      setProductSearch(value);
      if (value) {
        const filtered = products
          .filter(
            (product) =>
              product.productId &&
              (product.name.toLowerCase().includes(value.toLowerCase()) ||
                product.product_code
                  ?.toLowerCase()
                  .includes(value.toLowerCase()))
          )
          .slice(0, 5);
        setFilteredProducts(filtered);
      } else {
        setFilteredProducts([]);
      }
    }, 300),
    [products]
  );

  // Effects
  useEffect(() => {
    if (!orderNumber && !isAllOrdersLoading && allOrdersData !== undefined) {
      setOrderNumber(generateOrderNumber(orders));
    }
    if (
      !purchaseOrderNumber &&
      !isAllOrdersLoading &&
      allOrdersData !== undefined
    ) {
      setPurchaseOrderNumber(generatePurchaseOrderNumber(orders));
    }
  }, [
    isAllOrdersLoading,
    allOrdersData,
    orders,
    orderNumber,
    purchaseOrderNumber,
  ]);

  useEffect(() => {
    if (selectedCustomer) {
      const selectedCustomerData = customerList.find(
        (customer) => customer.customerId === selectedCustomer
      );
      if (selectedCustomerData) {
        setQuotationData((prev) => ({
          ...prev,
          billTo: selectedCustomerData.name || prev.billTo,
        }));
        setOrderData((prev) => ({
          ...prev,
          createdFor: selectedCustomerData.customerId,
        }));
      }
    }
  }, [selectedCustomer, customerList]);

  // Remove the redundant useEffect for address matching, as it's handled in QuotationForm/OrderForm
  useEffect(() => {
    const { quotationDate, dueDate } = quotationData;
    if (quotationDate && dueDate) {
      const quotation = new Date(quotationDate);
      const due = new Date(dueDate);
      if (due <= quotation) {
        setError("Due date must be after quotation date");
      } else {
        setError("");
      }
    }
    setOrderData((prev) => ({
      ...prev,
      dueDate: quotationData.dueDate,
    }));
  }, [quotationData.quotationDate, quotationData.dueDate]);

  // Handlers
  const handleQuotationChange = (key, value) => {
    setQuotationData((prev) => ({ ...prev, [key]: value }));
    if (key === "dueDate") {
      setOrderData((prev) => ({ ...prev, dueDate: value }));
    }
  };

  const handleOrderChange = (key, value) => {
    setOrderData((prev) => ({ ...prev, [key]: value }));
  };

  const handlePurchaseOrderChange = (key, value) => {
    setPurchaseOrderData((prev) => ({ ...prev, [key]: value }));
  };

  const handleDiscountChange = (productId, value) => {
    setItemDiscounts((prev) => ({
      ...prev,
      [productId]: value >= 0 ? value : 0,
    }));
  };

  const handleClearCart = async () => {
    if (!userId) return toast.error("User not logged in!");
    try {
      await clearCart({ userId }).unwrap();
      setQuotationNumber(generateQuotationNumber());
      setPurchaseOrderNumber(generatePurchaseOrderNumber(orders));
      setItemDiscounts({});
      setPurchaseOrderData((prev) => ({ ...prev, items: [] }));
      refetch();
      setShowClearCartModal(false);
      setActiveTab("cart");
    } catch (error) {
      toast.error(`Error: ${error.data?.message || "Failed to clear cart"}`);
    }
  };

  const handleUpdateQuantity = async (productId, newQuantity) => {
    if (!userId) return toast.error("User not logged in!");
    setUpdatingItems((prev) => ({ ...prev, [productId]: true }));
    try {
      if (newQuantity <= 0) {
        await removeFromCart({ userId, productId }).unwrap();
        setItemDiscounts((prev) => {
          const { [productId]: _, ...rest } = prev;
          return rest;
        });
      } else {
        await updateCart({
          userId,
          productId,
          quantity: Number(newQuantity),
        }).unwrap();
      }
      refetch();
    } catch (error) {
      toast.error(`Error: ${error.data?.message || "Unknown error"}`);
    } finally {
      setUpdatingItems((prev) => ({ ...prev, [productId]: false }));
    }
  };

  const handleRemoveItem = async (productId) => {
    if (!userId) return toast.error("User not logged in!");
    setUpdatingItems((prev) => ({ ...prev, [productId]: true }));
    try {
      await removeFromCart({ userId, productId }).unwrap();
      setItemDiscounts((prev) => {
        const { [productId]: _, ...rest } = prev;
        return rest;
      });
      refetch();
    } catch (error) {
      toast.error(`Error: ${error.data?.message || "Unknown error"}`);
    } finally {
      setUpdatingItems((prev) => ({ ...prev, [productId]: false }));
    }
  };

  const handleTeamAdded = (showModal) => {
    setShowAddTeamModal(showModal);
    if (!showModal) {
      refetchTeams();
    }
  };

  const handleAddressSave = async (newAddressId) => {
    setQuotationData((prev) => ({ ...prev, shipTo: newAddressId }));
    setOrderData((prev) => ({ ...prev, shipTo: newAddressId })); // Sync for OrderForm
    setShowAddAddressModal(false);
    await refetchAddresses();
    if (useBillingAddress) {
      setUseBillingAddress(true); // Re-trigger billing address matching
    }
  };

  const handleCreateDocument = async () => {
    if (documentType === "Purchase Order") {
      if (!selectedVendor) return toast.error("Please select a vendor.");
      if (cartItems.length === 0 && purchaseOrderData.items.length === 0)
        return toast.error("Please add at least one product.");
      if (purchaseOrderData.items.some((item) => item.mrp <= 0))
        return toast.error(
          "All products must have a valid MRP greater than 0."
        );
      if (
        purchaseOrderData.items.some(
          (item) => !products.some((p) => p.productId === item.productId)
        )
      )
        return toast.error(
          "Some products are no longer available. Please remove them."
        );

      const formattedItems = purchaseOrderData.items.map((item) => ({
        productId: item.productId,
        quantity: Number(item.quantity) || 1,
        mrp: Number(item.mrp) || 0.01,
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
        toast.error(errorMessage);
      }
      return;
    }

    if (!selectedCustomer) return toast.error("Please select a customer.");
    if (!userId) return toast.error("User not logged in!");
    if (!quotationData.quotationDate || !quotationData.dueDate)
      return toast.error("Please provide quotation and due dates.");
    if (!quotationData.billTo)
      return toast.error("Please provide a billing name.");
    if (error) return toast.error("Please fix the errors before submitting.");
    if (cartItems.length === 0)
      return toast.error("Cart is empty. Add items to proceed.");

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(quotationData.quotationDate))
      return toast.error("Invalid quotation date format. Use YYYY-MM-DD.");
    if (!dateRegex.test(quotationData.dueDate))
      return toast.error("Invalid due date format. Use YYYY-MM-DD.");

    if (isNaN(totalAmount) || totalAmount <= 0)
      return toast.error("Invalid total amount.");

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
      return toast.error(
        "Invalid cart items. Ensure all items have valid productId, quantity, and price."
      );
    }

    // Auto-create address if useBillingAddress is true and no shipTo is set
    if (useBillingAddress && !quotationData.shipTo && selectedCustomer) {
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
          setQuotationData((prev) => ({ ...prev, shipTo: result.addressId }));
          setOrderData((prev) => ({ ...prev, shipTo: result.addressId }));
          await refetchAddresses();
        } catch (err) {
          toast.error(
            `Failed to create address: ${err.data?.message || "Unknown error"}`
          );
          return;
        }
      }
    }

    if (
      quotationData.shipTo &&
      !addresses.find((addr) => addr.addressId === quotationData.shipTo)
    ) {
      return toast.error("Invalid shipping address selected.");
    }

    const selectedCustomerData = customerList.find(
      (customer) => customer.customerId === selectedCustomer
    );
    if (!selectedCustomerData)
      return toast.error("Selected customer not found.");

    if (quotationData.shipTo) {
      const selectedAddress = addresses.find(
        (addr) => addr.addressId === quotationData.shipTo
      );
      if (selectedAddress && selectedAddress.customerId !== selectedCustomer) {
        return toast.error(
          "Selected address does not belong to the chosen customer."
        );
      }
    }

    if (documentType === "Quotation") {
      const quotationPayload = {
        quotationId: uuidv4(),
        document_title: `Quotation for ${selectedCustomerData.name}`,
        quotation_date: quotationData.quotationDate,
        due_date: quotationData.dueDate,
        reference_number: quotationNumber,
        include_gst: quotationData.includeGst,
        gst_value: parseFloat(quotationData.gstValue) || 0,
        discountType: quotationData.discountType,
        roundOff: parseFloat(quotationData.roundOff) || 0,
        finalAmount: parseFloat(totalAmount.toFixed(2)),
        signature_name: quotationData.signatureName || "CM TRADING CO",
        signature_image: "",
        customerId: selectedCustomerData.customerId,
        shipTo: quotationData.shipTo || null,
        createdBy: userId,
        products: cartItems.map((item) => {
          const itemSubtotal = parseFloat(
            (item.price * item.quantity).toFixed(2)
          );
          const itemDiscount = parseFloat(itemDiscounts[item.productId]) || 0;
          return {
            productId: item.productId,
            name: item.name || "Unnamed Product",
            quantity: item.quantity || 1,
            sellingPrice: parseFloat(item.price || 0),
            discount: itemDiscount,
            tax: quotationData.includeGst
              ? parseFloat(quotationData.gstValue) || 0
              : 0,
            total: parseFloat((itemSubtotal - itemDiscount).toFixed(2)),
          };
        }),
        items: cartItems.map((item) => {
          const itemSubtotal = parseFloat(
            (item.price * item.quantity).toFixed(2)
          );
          const itemDiscount = parseFloat(itemDiscounts[item.productId]) || 0;
          return {
            productId: item.productId,
            quantity: item.quantity || 1,
            discount: itemDiscount,
            tax: quotationData.includeGst
              ? parseFloat(quotationData.gstValue) || 0
              : 0,
            total: parseFloat((itemSubtotal - itemDiscount).toFixed(2)),
          };
        }),
      };

      try {
        await createQuotation(quotationPayload).unwrap();
        await handleClearCart();
        resetForm();
        navigate("/quotations/list");
      } catch (error) {
        toast.error(
          `Failed to create quotation: ${
            error.data?.message || error.message || "Unknown error"
          }`
        );
      }
    } else if (documentType === "Order") {
      const orderNoRegex = /^\d{1,2}\d{1,2}25\d{3,}$/;
      if (!orderData.orderNo || !orderNoRegex.test(orderData.orderNo)) {
        return toast.error(
          "Order Number must be in the format DDMM25XXX (e.g., 2825101)."
        );
      }

      if (!validateFollowupDates()) {
        return toast.error("Follow-up dates cannot be after the due date.");
      }

      const orderPayload = {
        orderNo: orderData.orderNo,
        createdFor: selectedCustomerData.customerId,
        createdBy: userId,
        assignedTo: orderData.teamId || null,
        pipeline: orderData.pipeline || "",
        status: orderData.status || "CREATED",
        dueDate: orderData.dueDate || quotationData.dueDate,
        followupDates: orderData.followupDates.filter(
          (date) => date && moment(date).isValid()
        ),
        source: orderData.source || "",
        teamId: orderData.teamId || "",
        priority: orderData.priority || "medium",
        description: orderData.description || "",
        invoiceLink: null,
        quotationId: "",
        shipTo: orderData.shipTo || null, // Include shipTo
        products: cartItems.map((item) => {
          const itemSubtotal = parseFloat(
            (item.price * item.quantity).toFixed(2)
          );
          const itemDiscount = parseFloat(itemDiscounts[item.productId]) || 0;
          return {
            productId: item.productId,
            name: item.name || "Unnamed Product",
            quantity: item.quantity || 1,
            sellingPrice: parseFloat(item.price || 0),
            discount: itemDiscount,
            tax: quotationData.includeGst
              ? parseFloat(quotationData.gstValue) || 0
              : 0,
            total: parseFloat((itemSubtotal - itemDiscount).toFixed(2)),
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
            ? "Server error. Please try again later."
            : "Something went wrong. Please try again.";
        toast.error(errorMessage);
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
      includeGst: false,
      gstValue: "",
      discountType: "percent",
      roundOff: "",
    });
    setOrderData({
      createdFor: "",
      createdBy: userId || "",
      assignedTo: "",
      pipeline: "",
      status: "CREATED",
      dueDate: "",
      followupDates: [],
      source: "",
      teamId: "",
      priority: "medium",
      description: "",
      invoiceLink: null,
      orderNo: "",
      quotationId: "",
      shipTo: null, // Reset shipTo
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
    return orderData.followupDates.every((followupDate) => {
      if (!followupDate || new Date(followupDate).toString() === "Invalid Date")
        return true;
      return moment(followupDate).isSameOrBefore(dueDate, "day");
    });
  };

  const handleAddCustomer = () => {
    navigate("/customers/add");
  };

  const handleAddAddress = () => {
    setShowAddAddressModal(true);
  };

  if (
    profileLoading ||
    cartLoading ||
    productsLoading ||
    isAllOrdersLoading ||
    teamsLoading ||
    isProductsLoading ||
    isVendorsLoading
  ) {
    return (
      <PageWrapper>
        <Spin size="large" style={{ display: "block", margin: "50px auto" }} />
      </PageWrapper>
    );
  }

  if (profileError || cartError || productErrors.length > 0 || allOrdersError) {
    return (
      <PageWrapper>
        <Alert
          message="Error loading data"
          description={
            profileError?.message ||
            cartError?.message ||
            productErrors.map((err) => err.error).join(", ") ||
            allOrdersError?.data?.message ||
            "An unexpected error occurred"
          }
          type="error"
          action={
            <Button type="primary" onClick={refetch}>
              Retry
            </Button>
          }
          showIcon
        />
      </PageWrapper>
    );
  }

  return (
    <div className="page-wrapper">
      <PageWrapper>
        <CartContainer>
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            type="card"
            style={{ marginBottom: 16 }}
            role="tablist"
          >
            <TabPane
              tab={
                <span
                  role="tab"
                  aria-label={`Cart tab with ${totalItems} items`}
                >
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
                updatingItems={updatingItems}
                handleUpdateQuantity={handleUpdateQuantity}
                handleRemoveItem={handleRemoveItem}
                handleDiscountChange={handleDiscountChange}
                setShowClearCartModal={setShowClearCartModal}
                setActiveTab={setActiveTab}
              />
            </TabPane>
            <TabPane
              tab={
                <span role="tab" aria-label="Checkout tab">
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
                  isVendorsLoading={isVendorsLoading}
                  products={products}
                  isProductsLoading={isProductsLoading}
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
                        (item) => item.productId === productId
                      ) ||
                      cartItems.some((item) => item.productId === productId)
                    ) {
                      if (!product) toast.error("Product not found.");
                      else toast.error("Product already added.");
                      return;
                    }
                    const sellingPrice =
                      product.metaDetails?.find(
                        (meta) => meta.slug === "sellingPrice"
                      )?.value || 0;
                    if (sellingPrice <= 0) {
                      toast.error(
                        `Product ${product.name} has an invalid MRP (₹${sellingPrice}).`
                      );
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
                          name: product.name || "Unknown",
                          quantity,
                          mrp: sellingPrice,
                          total,
                        },
                      ];
                      const totalAmount = newItems
                        .reduce((sum, item) => sum + Number(item.total || 0), 0)
                        .toFixed(2);
                      return {
                        ...prev,
                        items: newItems,
                        totalAmount,
                      };
                    });
                    setProductSearch("");
                    setFilteredProducts([]);
                  }}
                  removePurchaseOrderProduct={(index) => {
                    setPurchaseOrderData((prev) => {
                      const newItems = prev.items.filter((_, i) => i !== index);
                      const totalAmount = newItems
                        .reduce((sum, item) => sum + Number(item.total || 0), 0)
                        .toFixed(2);
                      return {
                        ...prev,
                        items: newItems,
                        totalAmount,
                      };
                    });
                  }}
                  updatePurchaseOrderProductField={(index, field, value) => {
                    const updatedItems = [...purchaseOrderData.items];
                    updatedItems[index][field] = value;
                    if (["quantity", "mrp"].includes(field)) {
                      const quantity =
                        Number(updatedItems[index].quantity) || 1;
                      const mrp = Number(updatedItems[index].mrp) || 0.01;
                      updatedItems[index].total = quantity * mrp;
                    }
                    const totalAmount = updatedItems
                      .reduce((sum, item) => sum + Number(item.total || 0), 0)
                      .toFixed(2);
                    setPurchaseOrderData({
                      ...purchaseOrderData,
                      items: updatedItems,
                      totalAmount,
                    });
                  }}
                  handlePurchaseOrderChange={handlePurchaseOrderChange}
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
                  handleOrderChange={handleOrderChange}
                  selectedCustomer={selectedCustomer}
                  setSelectedCustomer={setSelectedCustomer}
                  customers={customerList}
                  customersLoading={customersLoading}
                  customersError={customersError}
                  addresses={addresses}
                  addressesLoading={addressesLoading}
                  addressesError={addressesError}
                  userMap={userMap}
                  customerMap={customerMap}
                  userQueries={userQueries}
                  customerQueries={customerQueries}
                  teams={teams}
                  teamsLoading={teamsLoading}
                  users={users}
                  usersLoading={usersLoading}
                  usersError={usersError}
                  quotationData={quotationData}
                  setQuotationData={setQuotationData}
                  handleQuotationChange={handleQuotationChange}
                  error={error}
                  orderNumber={orderData.orderNo}
                  documentType={documentType}
                  setDocumentType={setDocumentType}
                  cartItems={cartItems}
                  totalAmount={totalAmount}
                  shipping={shipping}
                  tax={tax}
                  discount={totalDiscount}
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
                  setSelectedCustomer={setSelectedCustomer}
                  customers={customerList}
                  customersLoading={customersLoading}
                  customersError={customersError}
                  addresses={addresses}
                  addressesLoading={addressesLoading}
                  addressesError={addressesError}
                  userMap={userMap}
                  customerMap={customerMap}
                  userQueries={userQueries}
                  customerQueries={customerQueries}
                  error={error}
                  quotationNumber={quotationNumber}
                  documentType={documentType}
                  setDocumentType={setDocumentType}
                  cartItems={cartItems}
                  totalAmount={totalAmount}
                  shipping={shipping}
                  tax={tax}
                  discount={totalDiscount}
                  roundOff={roundOff}
                  subTotal={subTotal}
                  handleAddCustomer={handleAddCustomer}
                  handleAddAddress={handleAddAddress}
                  setActiveTab={setActiveTab}
                  handleCreateDocument={handleCreateDocument}
                  useBillingAddress={useBillingAddress}
                  setUseBillingAddress={setUseBillingAddress}
                />
              )}
            </TabPane>
          </Tabs>

          <Modal
            title="Confirm Clear Cart"
            open={showClearCartModal}
            onOk={handleClearCart}
            onCancel={() => setShowClearCartModal(false)}
            okText="Clear"
            okButtonProps={{ danger: true }}
            cancelText="Cancel"
            width={window.innerWidth < 576 ? "90%" : 520}
          >
            <Text>
              Are you sure you want to clear all items from your cart?
            </Text>
          </Modal>

          {showAddAddressModal && (
            <AddAddress
              onClose={() => setShowAddAddressModal(false)}
              onSave={handleAddressSave}
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
              onClose={() => handleTeamAdded(false)}
              onTeamAdded={(newTeamId) => {
                handleTeamAdded(false);
                setOrderData((prev) => ({
                  ...prev,
                  assignedTeamId: newTeamId,
                }));
              }}
              visible={showAddTeamModal}
            />
          )}
        </CartContainer>
      </PageWrapper>
    </div>
  );
};

NewCart.propTypes = {
  onConvertToOrder: PropTypes.func,
};

NewCart.defaultProps = {
  onConvertToOrder: (orderData) => {
    console.warn("onConvertToOrder not provided. Order data:", orderData);
  },
};

export default NewCart;
