import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Spin, Alert, Tabs, Modal, Button, Typography } from "antd";
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
import { toast } from "sonner";
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
  const dispatch = useDispatch();
  const {
    data: profileData,
    isLoading: profileLoading,
    error: profileError,
  } = useGetProfileQuery();
  const {
    data: usersData,
    isLoading: usersLoading,
    error: usersError,
  } = useGetAllUsersQuery();
  const users = Array.isArray(usersData?.users) ? usersData.users : [];
  const user = profileData?.user || {};
  const userId = user.userId;
  const [useBillingAddress, setUseBillingAddress] = useState(false);

  // State declarations
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
  const [quotationData, setQuotationData] = useState({
    quotationDate: new Date().toISOString().split("T")[0],
    dueDate: "",
    billTo: "",
    shipTo: null,
    signatureName: "CM TRADING CO",
    discountType: "percent",
    discountAmount: "",
    roundOff: "",
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
  const [itemTaxes, setItemTaxes] = useState({}); // New state for per-item taxes
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
    {
      skip: !selectedCustomer,
      refetchOnMountOrArgChange: false,
      refetchOnReconnect: false,
    }
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
  const [createCustomer, { isLoading: isCreatingCustomer }] =
    useCreateCustomerMutation();

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
          tax: itemTaxes[item.productId] || 0, // Include tax
        })),
        totalAmount: cartItems
          .reduce((sum, item) => {
            const price = item.price || 0.01;
            const quantity = item.quantity || 1;
            const tax = itemTaxes[item.productId] || 0;
            const itemTotal = price * quantity * (1 + tax / 100);
            return sum + itemTotal;
          }, 0)
          .toFixed(2),
      }));
    }
  }, [cartItems, itemTaxes, documentType]);

  // Total calculations
  const totalItems = useMemo(
    () => cartItems.reduce((acc, item) => acc + (item.quantity || 0), 0),
    [cartItems]
  );

  const totalDiscount = useMemo(() => {
    const baseTotal = cartItems.reduce(
      (acc, item) => acc + (item.price || 0) * (item.quantity || 0),
      0
    );
    const discountAmount = parseFloat(quotationData.discountAmount) || 0;
    if (quotationData.discountType === "percent") {
      return (baseTotal * discountAmount) / 100;
    }
    return discountAmount;
  }, [cartItems, quotationData.discountAmount, quotationData.discountType]);

  const subTotal = useMemo(
    () =>
      cartItems.reduce(
        (acc, item) => acc + (item.price || 0) * (item.quantity || 0),
        0
      ),
    [cartItems]
  );

  const tax = useMemo(
    () =>
      cartItems.reduce((acc, item) => {
        const itemSubtotal = (item.price || 0) * (item.quantity || 1);
        const itemTax = parseFloat(itemTaxes[item.productId]) || 0;
        return acc + (itemSubtotal * itemTax) / 100;
      }, 0),
    [cartItems, itemTaxes]
  );

  const shipping = 40;
  const roundOff = parseFloat(quotationData.roundOff) || 0;
  const totalAmount = subTotal + shipping + tax - totalDiscount + roundOff;

  // Purchase Order specific calculations
  const purchaseOrderTotal = useMemo(
    () =>
      purchaseOrderData.items
        .reduce((sum, item) => {
          const itemTotal =
            Number(item.total || 0) * (1 + (item.tax || 0) / 100);
          return sum + itemTotal;
        }, 0)
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
      const today = moment().format("DDMMYY");
      const todayOrders = orders.filter((order) =>
        moment(order.createdAt).isSame(moment(), "day")
      );
      const serialNumber = todayOrders.length + 101;
      const generatedOrderNo = `${today}${serialNumber}`;
      setOrderData((prev) => ({
        ...prev,
        orderNo: generatedOrderNo,
      }));
      setOrderNumber(generatedOrderNo);
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

  // Handlers
  const handleQuotationChange = (key, value) => {
    setQuotationData((prev) => ({ ...prev, [key]: value }));
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

  const handleTaxChange = (productId, value) => {
    setItemTaxes((prev) => ({
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
      setItemTaxes({}); // Clear taxes
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
        setItemTaxes((prev) => {
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
      setItemTaxes((prev) => {
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
    setOrderData((prev) => ({ ...prev, shipTo: newAddressId }));
    setShowAddAddressModal(false);
    await refetchAddresses();
    if (useBillingAddress) {
      setUseBillingAddress(true);
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
        toast.error(errorMessage);
      }
      return;
    }

    if (!selectedCustomer) return toast.error("Please select a customer.");
    if (!userId) return toast.error("User not logged in!");
    if (cartItems.length === 0)
      return toast.error("Cart is empty. Add items to proceed.");

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (documentType === "Order") {
      if (!orderData.dueDate || !dateRegex.test(orderData.dueDate)) {
        return toast.error("Invalid due date format. Use YYYY-MM-DD.");
      }
      if (moment(orderData.dueDate).isBefore(moment().startOf("day"))) {
        return toast.error("Due date cannot be in the past.");
      }
    } else {
      if (
        !quotationData.quotationDate ||
        !dateRegex.test(quotationData.quotationDate)
      ) {
        return toast.error("Invalid quotation date format. Use YYYY-MM-DD.");
      }
      if (!quotationData.dueDate || !dateRegex.test(quotationData.dueDate)) {
        return toast.error("Invalid due date format. Use YYYY-MM-DD.");
      }
      if (
        moment(quotationData.dueDate).isBefore(
          moment(quotationData.quotationDate)
        )
      ) {
        return toast.error("Due date must be after quotation date.");
      }
    }

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
          toast.error(
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
      return toast.error("Invalid shipping address selected.");
    }

    const selectedCustomerData = customerList.find(
      (customer) => customer.customerId === selectedCustomer
    );
    if (!selectedCustomerData)
      return toast.error("Selected customer not found.");

    if (documentType === "Order" && orderData.shipTo) {
      const selectedAddress = addresses.find(
        (addr) => addr.addressId === orderData.shipTo
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
        discountType: quotationData.discountType,
        discountAmount: parseFloat(quotationData.discountAmount) || 0,
        roundOff: parseFloat(quotationData.roundOff) || 0,
        finalAmount: parseFloat(totalAmount.toFixed(2)),
        signature_name: quotationData.signatureName || "CM TRADING CO",
        signature_image: "",
        customerId: selectedCustomerData.customerId,
        shipTo: quotationData.shipTo || null,
        createdBy: userId,
        followupDates: quotationData.followupDates.filter(
          (date) => date && moment(date).isValid()
        ),
        products: cartItems.map((item) => {
          const itemSubtotal = parseFloat(
            (item.price * item.quantity).toFixed(2)
          );
          const itemDiscount =
            quotationData.discountType === "percent"
              ? (itemSubtotal *
                  (parseFloat(quotationData.discountAmount) || 0)) /
                100
              : (parseFloat(quotationData.discountAmount) || 0) /
                cartItems.length;
          const itemTax = parseFloat(itemTaxes[item.productId]) || 0;
          const itemTaxAmount = (itemSubtotal * itemTax) / 100;
          const total = itemSubtotal + itemTaxAmount - itemDiscount;
          return {
            productId: item.productId,
            name: item.name || "Unnamed Product",
            quantity: item.quantity || 1,
            sellingPrice: parseFloat(item.price || 0),
            discount: itemDiscount,
            tax: itemTax,
            total: parseFloat(total.toFixed(2)),
          };
        }),
        items: cartItems.map((item) => {
          const itemSubtotal = parseFloat(
            (item.price * item.quantity).toFixed(2)
          );
          const itemDiscount =
            quotationData.discountType === "percent"
              ? (itemSubtotal *
                  (parseFloat(quotationData.discountAmount) || 0)) /
                100
              : (parseFloat(quotationData.discountAmount) || 0) /
                cartItems.length;
          const itemTax = parseFloat(itemTaxes[item.productId]) || 0;
          const itemTaxAmount = (itemSubtotal * itemTax) / 100;
          const total = itemSubtotal + itemTaxAmount - itemDiscount;
          return {
            productId: item.productId,
            quantity: item.quantity || 1,
            discount: itemDiscount,
            tax: itemTax,
            total: parseFloat(total.toFixed(2)),
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
          "Order Number must be in the format DDMM25XXX (e.g., 151025101)."
        );
      }

      if (!validateFollowupDates()) {
        return toast.error("Follow-up dates cannot be after the due date.");
      }

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
          const price = parseFloat(item.price) || 0.01;
          const quantity = parseInt(item.quantity, 10) || 1;
          const discount =
            quotationData.discountType === "percent"
              ? (price *
                  quantity *
                  (parseFloat(quotationData.discountAmount) || 0)) /
                100
              : (parseFloat(quotationData.discountAmount) || 0) /
                cartItems.length;
          const itemTax = parseFloat(itemTaxes[item.productId]) || 0;
          const itemSubtotal = parseFloat((price * quantity).toFixed(2));
          const itemTaxAmount = (itemSubtotal * itemTax) / 100;
          const total = itemSubtotal + itemTaxAmount - discount;
          return {
            id: item.productId,
            price: price,
            discount: discount,
            tax: itemTax,
            total: total >= 0 ? parseFloat(total.toFixed(2)) : 0,
          };
        }),
      };
      console.log("Order Payload:", JSON.stringify(orderPayload, null, 2));
      try {
        await createOrder(orderPayload).unwrap();
        await handleClearCart();
        resetForm();
        navigate("/orders/list");
      } catch (error) {
        console.error("Order creation error:", error); // Log the full error object
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
      discountType: "percent",
      discountAmount: "",
      roundOff: "",
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
      invoiceLink: null,
      orderNo: "",
      quotationId: "",
      masterPipelineNo: "",
      previousOrderNo: "",
      shipTo: null,
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
    setShowAddCustomerModal(true);
  };

  const handleCustomerSave = async (newCustomer) => {
    try {
      await createCustomer(newCustomer).unwrap();
      dispatch(customerApi.util.invalidateTags(["Customer"]));
      setSelectedCustomer(newCustomer.customerId || "");
      setShowAddCustomerModal(false);
    } catch (err) {
      toast.error(err?.data?.message || "Failed to create customer.");
    }
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
      <div className="content">
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
                  itemTaxes={itemTaxes}
                  updatingItems={updatingItems}
                  handleUpdateQuantity={handleUpdateQuantity}
                  handleRemoveItem={handleRemoveItem}
                  handleDiscountChange={handleDiscountChange}
                  handleTaxChange={handleTaxChange}
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
                            tax: 0, // Default tax
                          },
                        ];
                        const totalAmount = newItems
                          .reduce(
                            (sum, item) =>
                              sum +
                              Number(item.total || 0) *
                                (1 + (item.tax || 0) / 100),
                            0
                          )
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
                        const newItems = prev.items.filter(
                          (_, i) => i !== index
                        );
                        const totalAmount = newItems
                          .reduce(
                            (sum, item) =>
                              sum +
                              Number(item.total || 0) *
                                (1 + (item.tax || 0) / 100),
                            0
                          )
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
                      if (["quantity", "mrp", "tax"].includes(field)) {
                        const quantity =
                          Number(updatedItems[index].quantity) || 1;
                        const mrp = Number(updatedItems[index].mrp) || 0.01;
                        const tax = Number(updatedItems[index].tax) || 0;
                        updatedItems[index].total =
                          quantity * mrp * (1 + tax / 100);
                      }
                      const totalAmount = updatedItems
                        .reduce(
                          (sum, item) =>
                            sum +
                            Number(item.total || 0) *
                              (1 + (item.tax || 0) / 100),
                          0
                        )
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
                    itemDiscounts={itemDiscounts} // Add this
                    itemTaxes={itemTaxes} // Add this
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

            {showAddCustomerModal && (
              <AddCustomerModal
                visible={showAddCustomerModal}
                onClose={() => setShowAddCustomerModal(false)}
                customer={null}
              />
            )}
          </CartContainer>
        </PageWrapper>
      </div>
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
