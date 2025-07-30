import React, { useState, useEffect, useMemo } from "react";
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
  Badge,
  Row,
  Col,
  Tabs,
  Select,
} from "antd";
import {
  ShoppingCartOutlined,
  UserAddOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  ArrowLeftOutlined,
} from "@ant-design/icons";
import { useGetCustomersQuery } from "../../api/customerApi";
import {
  useGetCartQuery,
  useUpdateCartMutation,
  useClearCartMutation,
  useRemoveFromCartMutation,
} from "../../api/cartApi";
import { useGetProfileQuery } from "../../api/userApi";
import { useCreateInvoiceMutation } from "../../api/invoiceApi";
import { useGetAllAddressesQuery } from "../../api/addressApi";
import { LazyLoadImage } from "react-lazy-load-image-component";
import AddCustomer from "../Customers/AddCustomer";
import OrderTotal from "./OrderTotal";
import PaymentMethod from "./PaymentMethod";
import InvoiceDetails from "../POS/InvoiceDetails";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import { FcEmptyTrash } from "react-icons/fc";
import { BiTrash } from "react-icons/bi";
import styled from "styled-components";
import PropTypes from "prop-types";
import "react-lazy-load-image-component/src/effects/blur.css";

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
  background: #1890ff;
  border-color: #1890ff;
  &:hover {
    background: #40a9ff;
    border-color: #40a9ff;
  }
`;

const EmptyCartWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px 0;
`;

const generateInvoiceNumber = () => {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(1000 + Math.random() * 9000);
  return `INV-${timestamp}-${random}`;
};

const Cart = ({ onConvertToOrder }) => {
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

  const {
    data: addressesData,
    isLoading: addressesLoading,
    isError: addressesError,
    refetch: refetchAddresses,
  } = useGetAllAddressesQuery(userId, { skip: !userId });

  const [updateCart] = useUpdateCartMutation();
  const [clearCart] = useClearCartMutation();
  const [removeFromCart] = useRemoveFromCartMutation();
  const [createInvoice] = useCreateInvoiceMutation();

  const [activeTab, setActiveTab] = useState("cart");
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("Cash");
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [showClearCartModal, setShowClearCartModal] = useState(false);
  const [invoiceNumber, setInvoiceNumber] = useState(generateInvoiceNumber());
  const [invoiceData, setInvoiceData] = useState({
    invoiceDate: new Date().toISOString().split("T")[0],
    dueDate: "",
    billTo: "",
    shipTo: null,
    signatureName: "CM TRADING CO",
  });
  const [error, setError] = useState("");
  const [updatingItems, setUpdatingItems] = useState({});

  const customers = customerData?.data || [];
  const customerList = useMemo(
    () => (Array.isArray(customers) ? customers : []),
    [customers]
  );
  const addresses = useMemo(
    () =>
      Array.isArray(addressesData?.data)
        ? addressesData.data
        : Array.isArray(addressesData)
        ? addressesData
        : [],
    [addressesData]
  );
  const cartItems = useMemo(
    () => (Array.isArray(cartData?.cart?.items) ? cartData.cart.items : []),
    [cartData]
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
  const shipping = 40;
  const tax = 25;
  const discount = 15;
  const totalAmount = subTotal + shipping + tax - discount;

  useEffect(() => {
    if (selectedCustomer && addresses.length > 0) {
      const selectedCustomerData = customerList.find(
        (customer) => customer.customerId === selectedCustomer
      );
      if (selectedCustomerData) {
        setInvoiceData((prev) => {
          const newBillTo = selectedCustomerData.name || prev.billTo;
          let newShipTo = null;
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
    const { invoiceDate, dueDate } = invoiceData;
    if (invoiceDate && dueDate) {
      const invoice = new Date(invoiceDate);
      const due = new Date(dueDate);
      if (due <= invoice) {
        setError("Due date must be after invoice date");
      } else {
        setError("");
      }
    }
  }, [invoiceData.invoiceDate, invoiceData.dueDate]);

  const handleInvoiceChange = (key, value) => {
    setInvoiceData((prev) => ({ ...prev, [key]: value }));
  };

  const handleClearCart = async () => {
    if (!userId) return toast.error("User not logged in!");
    try {
      await clearCart({ userId }).unwrap();
      toast.success("Cart cleared!");
      setInvoiceNumber(generateInvoiceNumber());
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
        toast.success("Item removed from cart!");
      } else {
        await updateCart({
          userId,
          productId,
          quantity: Number(newQuantity),
        }).unwrap();
        toast.success("Quantity updated!");
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
      toast.success("Item removed from cart!");
      refetch();
    } catch (error) {
      toast.error(`Error: ${error.data?.message || "Unknown error"}`);
    } finally {
      setUpdatingItems((prev) => ({ ...prev, [productId]: false }));
    }
  };

  const handlePlaceOrder = async () => {
    if (!selectedCustomer) return toast.error("Please select a customer.");
    if (!userId) return toast.error("User not logged in!");
    if (!invoiceData.invoiceDate || !invoiceData.dueDate)
      return toast.error("Please provide invoice and due dates.");
    if (!invoiceData.billTo)
      return toast.error("Please provide a billing name.");
    if (error) return toast.error("Please fix the errors before submitting.");
    if (!selectedPaymentMethod)
      return toast.error("Please select a payment method.");

    try {
      await refetchAddresses();
    } catch (err) {
      return toast.error("Failed to load addresses. Please try again.");
    }

    if (
      invoiceData.shipTo &&
      !addresses.find((addr) => addr.addressId === invoiceData.shipTo)
    ) {
      return toast.error("Invalid shipping address selected.");
    }

    const selectedCustomerData = customerList.find(
      (customer) => customer.customerId === selectedCustomer
    );
    if (!selectedCustomerData)
      return toast.error("Selected customer not found.");

    const orderId = uuidv4();
    const orderData = {
      id: orderId,
      title: `Order for ${selectedCustomerData.name}`,
      createdFor: selectedCustomerData.customerId,
      createdBy: userId,
      status: "INVOICE",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      products: cartItems.map((item) => ({
        id: item?.productId || "",
        name: item?.name || "Unnamed Product",
        price: item?.price || 0,
        quantity: item?.quantity || 1,
        total: (item?.price || 0) * (item?.quantity || 1),
      })),
      totalAmount: totalAmount || 0,
      invoiceId: null,
    };

    const invoiceDataToSubmit = {
      invoiceId: uuidv4(),
      createdBy: userId,
      customerId: selectedCustomerData.customerId,
      billTo: invoiceData.billTo,
      shipTo: invoiceData.shipTo,
      amount: totalAmount,
      invoiceDate: invoiceData.invoiceDate,
      dueDate: invoiceData.dueDate,
      paymentMethod: JSON.stringify({ method: selectedPaymentMethod }),
      status: selectedPaymentMethod === "Pay Later" ? "unpaid" : "paid",
      products: JSON.stringify(
        cartItems.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
        }))
      ),
      signatureName: invoiceData.signatureName || "CM TRADING CO",
      invoiceNo: invoiceNumber,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      const response = await createInvoice(invoiceDataToSubmit).unwrap();
      const invoiceId =
        response?.invoice?.invoiceId ||
        response?.invoiceId ||
        response?.data?.invoiceId ||
        response?.data?.invoice?.invoiceId;

      if (!invoiceId) {
        throw new Error("Invalid response structure: invoiceId not found.");
      }

      orderData.invoiceId = invoiceId;
      if (typeof onConvertToOrder === "function") {
        onConvertToOrder(orderData);
      } else {
        console.warn(
          "onConvertToOrder is not a function. Skipping order conversion."
        );
        toast.info(
          "Order created but not converted. Please check parent component configuration."
        );
      }
      await handleClearCart();
      toast.success("Order placed successfully!");
      setInvoiceData({
        invoiceDate: new Date().toISOString().split("T")[0],
        dueDate: "",
        billTo: "",
        shipTo: null,
        signatureName: "CM TRADING CO",
      });
      setSelectedCustomer("");
      setSelectedPaymentMethod("Cash");
      setInvoiceNumber(generateInvoiceNumber());
      setActiveTab("cart");
    } catch (error) {
      toast.error(
        `Failed to place order: ${
          error.data?.message || error.message || "Unknown error"
        }`
      );
    }
  };

  if (profileLoading || cartLoading) {
    return (
      <PageWrapper>
        <Spin size="large" style={{ display: "block", margin: "50px auto" }} />
      </PageWrapper>
    );
  }

  if (profileError || cartError) {
    return (
      <PageWrapper>
        <Alert
          message="Error loading data"
          description={
            profileError?.message ||
            cartError?.message ||
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
        <CartContainer>
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            type="card"
            style={{ marginBottom: 24 }}
          >
            {/* Cart Tab */}
            <TabPane
              tab={
                <span>
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
                          href="/shop"
                          style={{ marginTop: 16 }}
                          aria-label="Continue shopping"
                        >
                          Continue Shopping
                        </Button>
                      </EmptyCartWrapper>
                    ) : (
                      <div>
                        {cartItems.map((item) => (
                          <CartItem key={item.productId}>
                            <Row gutter={[16, 16]} align="middle">
                              <Col xs={6} sm={4}>
                                <CartItemImage
                                  src={
                                    item.image ||
                                    "https://via.placeholder.com/100"
                                  }
                                  alt={item.name}
                                  width={80}
                                  height={80}
                                  effect="blur"
                                  placeholderSrc="https://via.placeholder.com/100"
                                />
                              </Col>
                              <Col xs={18} sm={10}>
                                <Text strong>{item.name}</Text>
                                <Text type="secondary" block>
                                  Price: ₹{item.price?.toFixed(2) || "0.00"}
                                </Text>
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
                                <Text strong>
                                  ₹{(item.price * item.quantity).toFixed(2)}
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
                        ))}
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
                      discount={discount}
                      roundOff={0}
                      subTotal={subTotal}
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

            {/* Checkout Tab */}
            <TabPane
              tab={
                <span>
                  <CheckCircleOutlined /> Checkout
                </span>
              }
              key="checkout"
            >
              <Row gutter={[24, 24]} justify="center">
                <Col xs={24} lg={8}>
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
                          onChange={setSelectedCustomer}
                          placeholder="Select a customer"
                          loading={customersLoading}
                          disabled={customersLoading || customersError}
                          aria-label="Select customer"
                        >
                          {customersLoading ? (
                            <Option disabled>Loading...</Option>
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
                          onClick={() => setShowAddCustomerModal(true)}
                          style={{ padding: 0, marginTop: 8 }}
                          aria-label="Add new customer"
                        >
                          Add New Customer
                        </Button>
                        <Divider />
                        <InvoiceDetails
                          invoiceData={invoiceData}
                          onChange={handleInvoiceChange}
                          error={error}
                        />
                        <Divider />
                        <PaymentMethod
                          subTotal={totalAmount}
                          selectedMethod={selectedPaymentMethod}
                          onSelectMethod={setSelectedPaymentMethod}
                        />
                        <Divider />
                        <Text strong>Invoice #: {invoiceNumber}</Text>
                        <Divider />
                        <OrderTotal
                          shipping={shipping}
                          tax={tax}
                          coupon={0}
                          discount={discount}
                          roundOff={0}
                          subTotal={subTotal}
                        />
                        <Divider />
                        <CheckoutButton
                          type="primary"
                          icon={<CheckCircleOutlined />}
                          onClick={handlePlaceOrder}
                          disabled={
                            cartItems.length === 0 ||
                            !selectedCustomer ||
                            error ||
                            !invoiceData.invoiceDate ||
                            !invoiceData.dueDate ||
                            !selectedPaymentMethod
                          }
                          block
                          size="large"
                          aria-label="Place order"
                        >
                          Place Order
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
                      </>
                    )}
                  </CartSummaryCard>
                </Col>
              </Row>
            </TabPane>
          </Tabs>

          <Modal
            title="Add Customer"
            open={showAddCustomerModal}
            onCancel={() => setShowAddCustomerModal(false)}
            footer={null}
          >
            <AddCustomer
              onClose={() => setShowAddCustomerModal(false)}
              existingCustomer={null}
            />
          </Modal>

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
        </CartContainer>
      </div>
    </div>
  );
};

Cart.propTypes = {
  onConvertToOrder: PropTypes.func,
};

Cart.defaultProps = {
  onConvertToOrder: () => {
    console.warn("onConvertToOrder not provided. Order data:", {});
  },
};

export default Cart;
