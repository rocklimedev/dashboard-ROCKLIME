import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  Button,
  Modal,
  Spin,
  Alert,
  Space,
  Typography,
  Divider,
  Empty,
  Row,
  Col,
  Tabs,
  Select,
  InputNumber,
} from "antd";
import {
  ShoppingCartOutlined,
  UserAddOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  ArrowLeftOutlined,
} from "@ant-design/icons";
import {
  useGetCustomersQuery,
  useGetCustomerByIdQuery,
} from "../../api/customerApi";
import useUserAndCustomerData from "../../data/useUserAndCustomerData";
import {
  useGetCartQuery,
  useUpdateCartMutation,
  useClearCartMutation,
  useRemoveFromCartMutation,
} from "../../api/cartApi";
import { useGetAllUsersQuery, useGetUserByIdQuery } from "../../api/userApi";
import { useGetProfileQuery } from "../../api/userApi";
import { useCreateQuotationMutation } from "../../api/quotationApi";
import {
  useGetAllAddressesQuery,
  useCreateAddressMutation,
} from "../../api/addressApi";
import { LazyLoadImage } from "react-lazy-load-image-component";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import { FcEmptyTrash } from "react-icons/fc";
import { BiTrash } from "react-icons/bi";
import styled from "styled-components";
import PropTypes from "prop-types";
import "react-lazy-load-image-component/src/effects/blur.css";
import OrderTotal from "./OrderTotal";
import useProductsData from "../../data/useProductdata";
import AddAddress from "../Address/AddAddressModal";

const { Title, Text } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;

// Styled Components
const PageWrapper = styled.div`
  padding: 20px;
  background-color: #f5f5f5;
  min-height: 100vh;
`;

const CartContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
`;

const CartItemsCard = styled(Card)`
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 24px;
`;

const CartHeader = styled.div`
  width: 100%;
`;

const CartItem = styled.div`
  padding: 16px 0;
  &:hover {
    background: #fafafa;
  }
`;

const CartItemImage = styled(LazyLoadImage)`
  border-radius: 4px;
  object-fit: cover;
`;

const QuantityButton = styled(Button)`
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const RemoveButton = styled(Button)`
  margin-left: 8px;
`;

const CartSummaryCard = styled(Card)`
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 20px;
`;

const CustomerSelect = styled(Select)`
  width: 100%;
  margin-top: 8px;
`;

const CheckoutButton = styled(Button)`
  background: #e31e24;
  border-color: #e31e24;
  &:hover {
    background: #e31e24;
    border-color: #e31e24;
  }
`;

const EmptyCartWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px 0;
`;

const DiscountInput = styled(InputNumber)`
  width: 100px;
  margin-left: 8px;
`;

const generateQuotationNumber = () => {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(1000 + Math.random() * 9000);
  return `QUO-${timestamp}-${random}`;
};

const NewCart = ({ onConvertToOrder }) => {
  const navigate = useNavigate();
  const {
    data: profileData,
    isLoading: profileLoading,
    error: profileError,
  } = useGetProfileQuery();
  const userId = profileData?.user?.userId;

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

  const [activeTab, setActiveTab] = useState("cart");
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [showClearCartModal, setShowClearCartModal] = useState(false);
  const [showAddAddressModal, setShowAddAddressModal] = useState(false);
  const [quotationNumber, setQuotationNumber] = useState(
    generateQuotationNumber()
  );
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
  const [itemDiscounts, setItemDiscounts] = useState({});
  const [error, setError] = useState("");
  const [updatingItems, setUpdatingItems] = useState({});

  // Inside NewCart.jsx
  const {
    data: addressesData,
    isLoading: addressesLoading,
    isError: addressesError,
    refetch: refetchAddresses,
  } = useGetAllAddressesQuery(
    { customerId: selectedCustomer },
    { skip: !selectedCustomer }
  );

  const addresses = useMemo(() => {
    if (!addressesData) return [];
    if (Array.isArray(addressesData?.data)) return addressesData.data;
    if (Array.isArray(addressesData)) return addressesData;
    return [];
  }, [addressesData]);
  // Inside the component
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

  // Inside NewCart.jsx
  const { userMap, customerMap, userQueries, customerQueries } =
    useUserAndCustomerData(userIds, customerIds);
  const [updateCart] = useUpdateCartMutation();
  const [clearCart] = useClearCartMutation();
  const [removeFromCart] = useRemoveFromCartMutation();
  const [createQuotation] = useCreateQuotationMutation();

  // Use the custom hook to fetch product details
  const cartItems = useMemo(
    () => (Array.isArray(cartData?.cart?.items) ? cartData.cart.items : []),
    [cartData]
  );
  const {
    productsData,
    errors: productErrors,
    loading: productsLoading,
  } = useProductsData(cartItems);

  const customers = customerData?.data || [];
  const customerList = useMemo(
    () => (Array.isArray(customers) ? customers : []),
    [customers]
  );

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

  useEffect(() => {
    console.log("addressesData:", addressesData);
    console.log("addresses:", addresses);
    console.log("selectedCustomer:", selectedCustomer);
    if (selectedCustomer && addresses.length > 0) {
      const selectedCustomerData = customerList.find(
        (customer) => customer.customerId === selectedCustomer
      );
      if (selectedCustomerData) {
        setQuotationData((prev) => {
          const newBillTo = selectedCustomerData.name || prev.billTo;
          let newShipTo = prev.shipTo;
          if (selectedCustomerData.address) {
            const customerAddress = selectedCustomerData.address;
            const matchingAddress = addresses.find((addr) => {
              const addrDetails = addr.addressDetails || addr;
              return (
                addrDetails.street === customerAddress.street &&
                addrDetails.city === customerAddress.city &&
                addrDetails.state === customerAddress.state &&
                (addrDetails.postalCode === customerAddress.zipCode ||
                  addrDetails.postalCode === customerAddress.postalCode) &&
                addrDetails.country === customerAddress.country
              );
            });
            if (matchingAddress && matchingAddress.addressId) {
              newShipTo = matchingAddress.addressId;
            }
          }
          return { ...prev, billTo: newBillTo, shipTo: newShipTo };
        });
      }
    }
  }, [selectedCustomer, customerList, addresses]);

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
  }, [quotationData.quotationDate, quotationData.dueDate]);

  const handleQuotationChange = (key, value) => {
    setQuotationData((prev) => ({ ...prev, [key]: value }));
  };

  const handleDiscountChange = (productId, value) => {
    setItemDiscounts((prev) => ({
      ...prev,
      [productId]: value >= 0 ? value : 0,
    }));
  };

  const handleAddCustomer = () => {
    navigate("/customers/add");
  };

  const handleClearCart = async () => {
    if (!userId) return toast.error("User not logged in!");
    try {
      await clearCart({ userId }).unwrap();
      setQuotationNumber(generateQuotationNumber());
      setItemDiscounts({});
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

  const handleCreateQuotation = async () => {
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

    try {
      await refetchAddresses().unwrap();
    } catch (err) {
      return toast.error("Failed to load addresses. Please try again.");
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

    // Validate that the selected shipTo address belongs to the selected customer
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
      toast.success("Quotation created successfully!");
      navigate("/quotations/list");
    } catch (error) {
      console.error("Quotation creation error:", error);
      toast.error(
        `Failed to create quotation: ${
          error.data?.message || error.message || "Unknown error"
        }`
      );
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
    setSelectedCustomer("");
    setItemDiscounts({});
    setQuotationNumber(generateQuotationNumber());
    setActiveTab("cart");
  };

  const handleAddAddress = () => {
    setShowAddAddressModal(true);
  };

  const handleAddressSave = async (newAddressId) => {
    setQuotationData((prev) => ({ ...prev, shipTo: newAddressId }));
    setShowAddAddressModal(false);
    await refetchAddresses();
  };

  if (profileLoading || cartLoading || productsLoading) {
    return (
      <PageWrapper>
        <Spin size="large" style={{ display: "block", margin: "50px auto" }} />
      </PageWrapper>
    );
  }

  if (profileError || cartError || productErrors.length > 0) {
    return (
      <PageWrapper>
        <Alert
          message="Error loading data"
          description={
            profileError?.message ||
            cartError?.message ||
            productErrors.map((err) => err.error).join(", ") ||
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
            style={{ marginBottom: 24 }}
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
              <Row gutter={[24, 24]}>
                <Col xs={24} lg={16}>
                  <CartItemsCard>
                    <CartHeader>
                      <Space
                        align="center"
                        style={{
                          justifyContent: "space-between",
                          width: "100%",
                        }}
                      >
                        <Title level={3}>
                          Your Cart <ShoppingCartOutlined /> ({totalItems}{" "}
                          items)
                        </Title>
                        <Button
                          type="link"
                          danger
                          onClick={() => setShowClearCartModal(true)}
                          disabled={cartItems.length === 0}
                          aria-label="Clear cart"
                        >
                          Clear Cart
                        </Button>
                      </Space>
                      <Divider />
                    </CartHeader>

                    {cartItems.length === 0 ? (
                      <EmptyCartWrapper>
                        <Empty
                          description="Your cart is empty"
                          image={<FcEmptyTrash style={{ fontSize: 64 }} />}
                        />
                        <Button
                          type="primary"
                          icon={<ArrowLeftOutlined />}
                          href="/inventory/products"
                          style={{ marginTop: 16 }}
                          aria-label="Continue shopping"
                        >
                          Continue Shopping
                        </Button>
                      </EmptyCartWrapper>
                    ) : (
                      <div>
                        {cartItems.map((item) => {
                          const product = productsData?.find(
                            (p) => p.productId === item.productId
                          );
                          let imageUrl = null;
                          try {
                            if (product?.images) {
                              const imgs = JSON.parse(product.images);
                              imageUrl = Array.isArray(imgs) ? imgs[0] : null;
                            }
                          } catch {
                            imageUrl = null;
                          }
                          return (
                            <CartItem key={item.productId}>
                              <Row gutter={[16, 16]} align="middle">
                                <Col xs={6} sm={4}>
                                  <CartItemImage
                                    src={imageUrl}
                                    alt={item.name}
                                    width={80}
                                    height={80}
                                    effect="blur"
                                    placeholderSrc="https://via.placeholder.com/100"
                                  />
                                </Col>
                                <Col xs={18} sm={10}>
                                  <Text strong>{item.name}</Text>
                                  <br />
                                  <Text
                                    type="secondary"
                                    block
                                    style={{ color: "green" }}
                                  >
                                    Price: ₹{item.price?.toFixed(2) || "0.00"}
                                  </Text>
                                  <br />
                                  <Text>Discount:</Text>
                                  <DiscountInput
                                    min={0}
                                    value={itemDiscounts[item.productId] || 0}
                                    onChange={(value) =>
                                      handleDiscountChange(
                                        item.productId,
                                        value
                                      )
                                    }
                                    addonAfter={
                                      quotationData.discountType === "percent"
                                        ? "%"
                                        : "₹"
                                    }
                                    aria-label={`Discount for ${item.name}`}
                                  />
                                </Col>
                                <Col xs={12} sm={6}>
                                  <Space>
                                    <QuantityButton
                                      size="small"
                                      onClick={() =>
                                        handleUpdateQuantity(
                                          item.productId,
                                          item.quantity - 1
                                        )
                                      }
                                      disabled={
                                        item.quantity <= 1 ||
                                        updatingItems[item.productId]
                                      }
                                      loading={updatingItems[item.productId]}
                                      aria-label={`Decrease quantity of ${item.name}`}
                                    >
                                      -
                                    </QuantityButton>
                                    <Text>{item.quantity}</Text>
                                    <QuantityButton
                                      size="small"
                                      onClick={() =>
                                        handleUpdateQuantity(
                                          item.productId,
                                          item.quantity + 1
                                        )
                                      }
                                      disabled={updatingItems[item.productId]}
                                      loading={updatingItems[item.productId]}
                                      aria-label={`Increase quantity of ${item.name}`}
                                    >
                                      +
                                    </QuantityButton>
                                  </Space>
                                </Col>
                                <Col
                                  xs={12}
                                  sm={4}
                                  style={{ textAlign: "right" }}
                                >
                                  <Text strong style={{ color: "green" }}>
                                    ₹
                                    {(
                                      item.price * item.quantity -
                                      (itemDiscounts[item.productId] || 0)
                                    ).toFixed(2)}
                                  </Text>
                                  <RemoveButton
                                    type="text"
                                    danger
                                    icon={<BiTrash />}
                                    onClick={() =>
                                      handleRemoveItem(item.productId)
                                    }
                                    disabled={updatingItems[item.productId]}
                                    loading={updatingItems[item.productId]}
                                    aria-label={`Remove ${item.name} from cart`}
                                  />
                                </Col>
                              </Row>
                              <Divider />
                            </CartItem>
                          );
                        })}
                      </div>
                    )}
                  </CartItemsCard>
                </Col>
                <Col xs={24} lg={8}>
                  <CartSummaryCard>
                    <Title level={4}>Order Summary</Title>
                    <Divider />
                    <OrderTotal
                      shipping={shipping}
                      tax={tax}
                      coupon={0}
                      discount={totalDiscount}
                      roundOff={roundOff}
                      subTotal={subTotal}
                      items={cartItems.map((item) => ({
                        productId: item.productId,
                        name: item.name,
                        discount:
                          parseFloat(itemDiscounts[item.productId]) || 0,
                        quantity: item.quantity || 1,
                      }))}
                    />
                    <Divider />
                    <CheckoutButton
                      type="primary"
                      icon={<CheckCircleOutlined />}
                      onClick={() => setActiveTab("checkout")}
                      disabled={cartItems.length === 0}
                      block
                      size="large"
                      aria-label="Proceed to checkout"
                    >
                      Proceed to Checkout
                    </CheckoutButton>
                    <Button
                      type="default"
                      href="/inventory/products"
                      block
                      style={{ marginTop: 8 }}
                      aria-label="Continue shopping"
                    >
                      Continue Shopping
                    </Button>
                  </CartSummaryCard>
                </Col>
              </Row>
            </TabPane>

            <TabPane
              tab={
                <span role="tab" aria-label="Checkout tab">
                  <CheckCircleOutlined /> Checkout
                </span>
              }
              key="checkout"
            >
              <Row gutter={[24, 24]} justify="center">
                <Col xs={24} lg={16}>
                  <CartSummaryCard>
                    <Title level={3}>Checkout</Title>
                    <Divider />
                    {cartItems.length === 0 ? (
                      <EmptyCartWrapper>
                        <Empty
                          description="Your cart is empty"
                          image={<FcEmptyTrash style={{ fontSize: 64 }} />}
                        />
                        <Button
                          type="primary"
                          icon={<ArrowLeftOutlined />}
                          onClick={() => setActiveTab("cart")}
                          style={{ marginTop: 16 }}
                          aria-label="Back to cart"
                        >
                          Back to Cart
                        </Button>
                      </EmptyCartWrapper>
                    ) : (
                      <>
                        <Text strong>Select Customer</Text>
                        <CustomerSelect
                          value={selectedCustomer}
                          onChange={(value) => {
                            setSelectedCustomer(value);
                            setQuotationData((prev) => ({
                              ...prev,
                              shipTo: null,
                            }));
                          }}
                          placeholder="Select a customer"
                          loading={customersLoading}
                          disabled={customersLoading || customersError}
                          aria-label="Select customer"
                        >
                          {customersLoading ? (
                            <Option disabled>Select a customer</Option>
                          ) : customersError ? (
                            <Option disabled>Error fetching customers</Option>
                          ) : customerList.length === 0 ? (
                            <Option disabled>No customers available</Option>
                          ) : (
                            customerList.map((customer) => (
                              <Option
                                key={customer.customerId}
                                value={customer.customerId}
                              >
                                {customer.name} ({customer.email})
                              </Option>
                            ))
                          )}
                        </CustomerSelect>
                        <Button
                          type="link"
                          icon={<UserAddOutlined />}
                          onClick={handleAddCustomer}
                        >
                          Add New Customer
                        </Button>
                        <Divider />
                        <Text strong>Shipping Address</Text>

                        <Select
                          value={quotationData.shipTo}
                          onChange={(value) =>
                            handleQuotationChange("shipTo", value)
                          }
                          placeholder="Select shipping address"
                          loading={
                            addressesLoading ||
                            userQueries.some((q) => q.isLoading) ||
                            customerQueries.some((q) => q.isLoading)
                          }
                          disabled={
                            addressesLoading ||
                            addressesError ||
                            !selectedCustomer ||
                            userQueries.some((q) => q.isLoading) ||
                            customerQueries.some((q) => q.isLoading)
                          }
                          style={{ width: "100%", marginTop: 8 }}
                          aria-label="Select shipping address"
                        >
                          {addressesLoading ? (
                            <Option disabled>Loading...</Option>
                          ) : addressesError ? (
                            <Option disabled>
                              Error fetching addresses:{" "}
                              {addressesError?.data?.message || "Unknown error"}
                            </Option>
                          ) : addresses.length === 0 ? (
                            <Option disabled>No addresses available</Option>
                          ) : (
                            addresses.map((address) => (
                              <Option
                                key={address.addressId}
                                value={address.addressId}
                              >
                                {`${address.street}, ${address.city}${
                                  address.state ? `, ${address.state}` : ""
                                }, ${address.country} (${
                                  address.customerId
                                    ? customerMap[address.customerId] ||
                                      "Unknown Customer"
                                    : address.userId
                                    ? userMap[address.userId] || "Unknown User"
                                    : "No associated name"
                                })`}
                              </Option>
                            ))
                          )}
                        </Select>
                        <Button
                          type="link"
                          icon={<UserAddOutlined />}
                          onClick={handleAddAddress}
                          style={{ padding: 0, marginTop: 8 }}
                          aria-label="Add new address"
                          disabled={!selectedCustomer}
                        >
                          Add New Address
                        </Button>

                        <Divider />
                        <Text strong>Quotation Date</Text>
                        <input
                          type="date"
                          className="form-control"
                          value={quotationData.quotationDate}
                          onChange={(e) =>
                            handleQuotationChange(
                              "quotationDate",
                              e.target.value
                            )
                          }
                          style={{ marginTop: 8 }}
                        />
                        <Text strong>Due Date</Text>
                        <input
                          type="date"
                          className="form-control"
                          value={quotationData.dueDate}
                          onChange={(e) =>
                            handleQuotationChange("dueDate", e.target.value)
                          }
                          style={{ marginTop: 8 }}
                        />
                        {error && (
                          <Alert
                            message={error}
                            type="error"
                            showIcon
                            style={{ marginTop: 8 }}
                          />
                        )}
                        <Divider />
                        <Text strong>Include GST</Text>
                        <div>
                          <input
                            type="checkbox"
                            checked={quotationData.includeGst}
                            onChange={(e) =>
                              handleQuotationChange(
                                "includeGst",
                                e.target.checked
                              )
                            }
                            className="form-check-input"
                          />
                        </div>
                        {quotationData.includeGst && (
                          <>
                            <Text strong>GST Value (%)</Text>
                            <input
                              type="number"
                              className="form-control"
                              value={quotationData.gstValue}
                              onChange={(e) =>
                                handleQuotationChange(
                                  "gstValue",
                                  e.target.value
                                )
                              }
                              min="0"
                              style={{ marginTop: 8 }}
                            />
                          </>
                        )}
                        <Divider />
                        <Text strong>Discount Type</Text>
                        <Select
                          value={quotationData.discountType}
                          onChange={(value) =>
                            handleQuotationChange("discountType", value)
                          }
                          style={{ width: "100%", marginTop: 8 }}
                        >
                          <Option value="percent">Percent</Option>
                          <Option value="fixed">Fixed</Option>
                        </Select>
                        <Divider />
                        <Text strong>Round Off</Text>
                        <input
                          type="number"
                          className="form-control"
                          value={quotationData.roundOff}
                          onChange={(e) =>
                            handleQuotationChange("roundOff", e.target.value)
                          }
                          style={{ marginTop: 8 }}
                        />
                        <Divider />
                      </>
                    )}
                  </CartSummaryCard>
                </Col>
                <Col xs={24} lg={8}>
                  <CartSummaryCard>
                    <Text strong>Quotation #: {quotationNumber}</Text>
                    <Divider />
                    <OrderTotal
                      shipping={shipping}
                      tax={tax}
                      coupon={0}
                      discount={totalDiscount}
                      roundOff={roundOff}
                      subTotal={subTotal}
                    />
                    <Divider />
                    <CheckoutButton
                      type="primary"
                      icon={<CheckCircleOutlined />}
                      onClick={handleCreateQuotation}
                      disabled={
                        cartItems.length === 0 ||
                        !selectedCustomer ||
                        error ||
                        !quotationData.quotationDate ||
                        !quotationData.dueDate
                      }
                      block
                      size="large"
                      aria-label="Create quotation"
                    >
                      Create Quotation
                    </CheckoutButton>
                    <Button
                      type="default"
                      onClick={() => setActiveTab("cart")}
                      block
                      style={{ marginTop: 8 }}
                      aria-label="Back to cart"
                    >
                      Back to Cart
                    </Button>
                  </CartSummaryCard>
                </Col>
              </Row>
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
