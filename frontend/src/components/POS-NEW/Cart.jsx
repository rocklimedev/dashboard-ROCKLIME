import React, { useState, useEffect, useMemo } from "react";
import {
  Card,
  Select,
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
  Image,
} from "antd";
import {
  ShoppingCartOutlined,
  UserAddOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
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
import AddCustomer from "../Customers/AddCustomer";
import OrderTotal from "./OrderTotal";
import PaymentMethod from "./PaymentMethod";
import InvoiceDetails from "../POS/InvoiceDetails";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import { FcEmptyTrash } from "react-icons/fc";
import { BiTrash } from "react-icons/bi";
import "./cart.css";

const { Title, Text } = Typography;
const { Option } = Select;

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

  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [invoiceNumber, setInvoiceNumber] = useState(generateInvoiceNumber());
  const [invoiceData, setInvoiceData] = useState({
    invoiceDate: new Date().toISOString().split("T")[0],
    dueDate: "",
    billTo: "",
    shipTo: null,
    signatureName: "CM TRADING CO",
  });
  const [error, setError] = useState("");

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

  const totalItems = cartItems.reduce(
    (acc, item) => acc + (item.quantity || 0),
    0
  );
  const subTotal = cartItems.reduce(
    (acc, item) => acc + (item.price || 0) * (item.quantity || 0),
    0
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
    } catch (error) {
      toast.error(`Error: ${error.data?.message || "Failed to clear cart"}`);
    }
  };

  const handleUpdateQuantity = async (productId, newQuantity) => {
    if (!userId) return toast.error("User not logged in!");
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
    }
  };

  const handleRemoveItem = async (productId) => {
    if (!userId) return toast.error("User not logged in!");
    try {
      await removeFromCart({ userId, productId }).unwrap();
      toast.success("Item removed from cart!");
      refetch();
    } catch (error) {
      toast.error(`Error: ${error.data?.message || "Unknown error"}`);
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
      paymentMethod: JSON.stringify({ method: "Cash" }),
      status: "unpaid",
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
      onConvertToOrder(orderData);
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
      setInvoiceNumber(generateInvoiceNumber());
    } catch (error) {
      toast.error(
        `Failed to place order: ${
          error.data?.message || error.message || "Unknown error"
        }`
      );
    }
  };

  if (profileLoading || cartLoading || customersLoading || addressesLoading) {
    return (
      <div className="cart-loading">
        <Spin size="large" />
      </div>
    );
  }

  if (profileError || cartError || customersError || addressesError) {
    return (
      <Alert
        message="Error loading data"
        description={
          profileError?.message ||
          cartError?.message ||
          customersError?.message ||
          addressesError?.message
        }
        type="error"
        action={
          <Button type="primary" onClick={refetch}>
            Retry
          </Button>
        }
        showIcon
      />
    );
  }

  return (
    <div className="page-wrapper">
      <div className="content">
        <div className="cart-container">
          <Row gutter={[24, 24]}>
            {/* Cart Items */}
            <Col xs={24} lg={16}>
              <Card className="cart-items-card">
                <Space
                  direction="vertical"
                  style={{ width: "100%" }}
                  className="cart-header"
                >
                  <Space
                    align="center"
                    style={{ justifyContent: "space-between", width: "100%" }}
                  >
                    <Title level={3}>
                      Your Cart <ShoppingCartOutlined /> ({totalItems} items)
                    </Title>
                    <Button type="link" danger onClick={handleClearCart}>
                      Clear Cart
                    </Button>
                  </Space>
                  <Divider />
                </Space>

                {cartItems.length === 0 ? (
                  <Empty
                    description="Your cart is empty"
                    image={<FcEmptyTrash style={{ fontSize: 64 }} />}
                    className="empty-cart"
                  />
                ) : (
                  <div className="cart-items-list">
                    {cartItems.map((item) => (
                      <div key={item.productId} className="cart-item">
                        <Row gutter={[16, 16]} align="middle">
                          <Col xs={6} sm={4}>
                            <Image
                              src={
                                item.image || "https://via.placeholder.com/100"
                              }
                              alt={item.name}
                              width={80}
                              height={80}
                              className="cart-item-image"
                            />
                          </Col>
                          <Col xs={18} sm={10}>
                            <Text strong>{item.name}</Text>
                            <Text type="secondary" block>
                              Price: ₹{item.price.toFixed(2)}
                            </Text>
                          </Col>
                          <Col xs={12} sm={6}>
                            <Space>
                              <Button
                                size="small"
                                onClick={() =>
                                  handleUpdateQuantity(
                                    item.productId,
                                    item.quantity - 1
                                  )
                                }
                                disabled={item.quantity <= 1}
                              >
                                -
                              </Button>
                              <Text>{item.quantity}</Text>
                              <Button
                                size="small"
                                onClick={() =>
                                  handleUpdateQuantity(
                                    item.productId,
                                    item.quantity + 1
                                  )
                                }
                              >
                                +
                              </Button>
                            </Space>
                          </Col>
                          <Col xs={12} sm={4} style={{ textAlign: "right" }}>
                            <Text strong>
                              ₹{(item.price * item.quantity).toFixed(2)}
                            </Text>
                            <Button
                              type="text"
                              danger
                              icon={<BiTrash />}
                              onClick={() => handleRemoveItem(item.productId)}
                              className="remove-item"
                            />
                          </Col>
                        </Row>
                        <Divider />
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </Col>

            {/* Cart Summary */}
            <Col xs={24} lg={8}>
              <Card
                className="cart-summary-card"
                style={{ position: "sticky", top: 24 }}
              >
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
                <Text strong>Select Customer</Text>
                <Select
                  className="customer-select"
                  value={selectedCustomer}
                  onChange={setSelectedCustomer}
                  placeholder="Select a customer"
                  loading={customersLoading}
                  disabled={customersLoading || customersError}
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
                </Select>
                <Button
                  type="link"
                  icon={<UserAddOutlined />}
                  onClick={() => setShowAddCustomerModal(true)}
                  style={{ padding: 0, marginTop: 8 }}
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
                <PaymentMethod />
                <Divider />
                <Text strong>Invoice #: {invoiceNumber}</Text>
                <Divider />
                <Button
                  type="primary"
                  icon={<CheckCircleOutlined />}
                  onClick={handlePlaceOrder}
                  disabled={
                    cartItems.length === 0 ||
                    !selectedCustomer ||
                    error ||
                    !invoiceData.invoiceDate ||
                    !invoiceData.dueDate
                  }
                  block
                  size="large"
                  className="checkout-button"
                >
                  Proceed to Checkout
                </Button>
              </Card>
            </Col>
          </Row>

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
        </div>
      </div>
    </div>
  );
};

export default Cart;
