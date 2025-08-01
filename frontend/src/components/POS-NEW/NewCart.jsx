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
  Select,
  Tabs,
  Radio,
  Input,
  Row,
  Col,
  Checkbox,
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
import {
  useGetAllAddressesQuery,
  useCreateAddressMutation,
} from "../../api/addressApi";
import { useCreateQuotationMutation } from "../../api/quotationApi";
import { LazyLoadImage } from "react-lazy-load-image-component";
import AddCustomer from "../Customers/AddCustomer";
import OrderTotal from "./OrderTotal";
import PaymentMethod from "./PaymentMethod";
import InvoiceDetails from "../POS/InvoiceDetails";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import { FcEmptyTrash } from "react-icons/fc";
import { BiTrash } from "react-icons/bi";
import { PiPlus } from "react-icons/pi";
import styled from "styled-components";
import PropTypes from "prop-types";
import "react-lazy-load-image-component/src/effects/blur.css";

// ... (Styled Components remain unchanged)
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

// Add Address Modal styled component
const AddAddressModalWrapper = styled.div`
  .modal {
    display: block;
    background: rgba(0, 0, 0, 0.5);
  }
`;
const generateInvoiceNumber = () => {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(1000 + Math.random() * 9000);
  return `INV-${timestamp}-${random}`;
};

const generateQuotationNumber = () => {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(1000 + Math.random() * 9000);
  return `QUO-${timestamp}-${random}`;
};

// Add Address Modal Component (unchanged)
const AddAddressModal = ({ show, onClose, onSave }) => {
  const [addressData, setAddressData] = useState({
    name: "",
    street: "",
    city: "",
    state: "",
    country: "",
    postalCode: "",
  });

  const [createAddress, { isLoading: isCreatingAddress }] =
    useCreateAddressMutation();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setAddressData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const newAddress = await createAddress(addressData).unwrap();
      toast.success("Address created successfully!");
      onSave(newAddress.data.addressId);
      setAddressData({
        name: "",
        street: "",
        city: "",
        state: "",
        country: "",
        postalCode: "",
      });
      onClose();
    } catch (err) {
      toast.error(
        `Failed to create address: ${err.data?.message || "Unknown error"}`
      );
    }
  };

  if (!show) return null;

  return (
    <AddAddressModalWrapper>
      <div className="modal">
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Add New Address</h5>
              <button
                type="button"
                className="btn-close"
                onClick={onClose}
                aria-label="Close"
              ></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Name</label>
                  <input
                    type="text"
                    className="form-control"
                    name="name"
                    value={addressData.name}
                    onChange={handleChange}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Street *</label>
                  <input
                    type="text"
                    className="form-control"
                    name="street"
                    value={addressData.street}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">City *</label>
                  <input
                    type="text"
                    className="form-control"
                    name="city"
                    value={addressData.city}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">State</label>
                  <input
                    type="text"
                    className="form-control"
                    name="state"
                    value={addressData.state}
                    onChange={handleChange}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Country *</label>
                  <input
                    type="text"
                    className="form-control"
                    name="country"
                    value={addressData.country}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Postal Code</label>
                  <input
                    type="text"
                    className="form-control"
                    name="postalCode"
                    value={addressData.postalCode}
                    onChange={handleChange}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={onClose}
                  disabled={isCreatingAddress}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isCreatingAddress}
                >
                  {isCreatingAddress ? "Saving..." : "Save Address"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </AddAddressModalWrapper>
  );
};

const NewCart = ({ onConvertToOrder }) => {
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
  const [createQuotation] = useCreateQuotationMutation();

  const [activeTab, setActiveTab] = useState("cart");
  const [documentType, setDocumentType] = useState("invoice");
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("Cash");
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [showClearCartModal, setShowClearCartModal] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [addressType, setAddressType] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState(generateInvoiceNumber());
  const [quotationNumber, setQuotationNumber] = useState(
    generateQuotationNumber()
  );
  const [error, setError] = useState("");
  const [updatingItems, setUpdatingItems] = useState({});

  // Initialize formData state
  const [formData, setFormData] = useState({
    document_title: "",
    quotation_date: new Date().toISOString().split("T")[0],
    due_date: "", // Consistent naming
    reference_number: "",
    include_gst: false,
    gst_value: "",
    discountType: "percent",
    roundOff: "",
    finalAmount: "",
    signature_name: "CM TRADING CO",
    signature_image: "",
    invoice_date: new Date().toISOString().split("T")[0], // Consistent naming
    bill_to: "",
    ship_to: null,
  });

  // Derived data
  const cartItems = useMemo(
    () => (Array.isArray(cartData?.cart?.items) ? cartData.cart.items : []),
    [cartData]
  );

  const totalItems = useMemo(() => cartItems.length, [cartItems]);
  const customerList = useMemo(() => customerData?.data || [], [customerData]);
  const addresses = useMemo(
    () =>
      Array.isArray(addressesData?.data)
        ? addressesData.data
        : Array.isArray(addressesData)
        ? addressesData
        : [],
    [addressesData]
  );
  const calculateTotals = useMemo(() => {
    const subTotal = cartItems.reduce(
      (sum, item) => sum + (item.price || 0) * (item.quantity || 1),
      0
    );
    const tax = formData.include_gst ? 0 : subTotal * 0.1; // Example tax rate
    const discount = 0; // Add discount logic if needed
    const shipping = 0; // Add shipping logic if needed
    const totalAmount =
      subTotal +
      (formData.include_gst
        ? (subTotal * (parseFloat(formData.gst_value) || 0)) / 100
        : tax) +
      shipping -
      discount +
      (parseFloat(formData.roundOff) || 0);

    return {
      subTotal: subTotal || 0,
      tax: tax || 0,
      discount: discount || 0,
      shipping: shipping || 0,
      totalAmount: totalAmount || 0,
    };
  }, [cartItems, formData.include_gst, formData.gst_value, formData.roundOff]);

  // Handle form changes
  const handleFormChange = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  // Handle quantity update
  const handleUpdateQuantity = async (productId, newQuantity) => {
    if (newQuantity < 1) return;
    setUpdatingItems((prev) => ({ ...prev, [productId]: true }));
    try {
      await updateCart({
        userId,
        productId,
        quantity: newQuantity,
      }).unwrap();
      toast.success("Cart updated successfully!");
      refetch();
    } catch (err) {
      toast.error(
        `Failed to update quantity: ${err.data?.message || "Unknown error"}`
      );
    } finally {
      setUpdatingItems((prev) => ({ ...prev, [productId]: false }));
    }
  };

  // Handle remove item
  const handleRemoveItem = async (productId) => {
    setUpdatingItems((prev) => ({ ...prev, [productId]: true }));
    try {
      await removeFromCart({ userId, productId }).unwrap();
      toast.success("Item removed from cart!");
      refetch();
    } catch (err) {
      toast.error(
        `Failed to remove item: ${err.data?.message || "Unknown error"}`
      );
    } finally {
      setUpdatingItems((prev) => ({ ...prev, [productId]: false }));
    }
  };

  // Handle clear cart
  const handleClearCart = async () => {
    try {
      await clearCart({ userId }).unwrap();
      toast.success("Cart cleared successfully!");
      setShowClearCartModal(false);
      refetch();
    } catch (err) {
      toast.error(
        `Failed to clear cart: ${err.data?.message || "Unknown error"}`
      );
    }
  };

  // Handle add address
  const handleAddAddress = (type) => {
    setAddressType(type);
    setShowAddressModal(true);
  };

  // Handle address save
  const handleAddressSave = (addressId) => {
    setFormData((prev) => ({ ...prev, [addressType]: addressId }));
    setShowAddressModal(false);
    refetchAddresses();
  };

  // Date validation
  useEffect(() => {
    const { invoice_date, due_date, quotation_date } = formData;
    const checkDate =
      documentType === "invoice" ? invoice_date : quotation_date;
    const due = due_date;
    if (checkDate && due) {
      const documentDate = new Date(checkDate);
      const dueDateObj = new Date(due);
      if (isNaN(dueDateObj) || isNaN(documentDate)) {
        setError("Invalid date format");
      } else if (dueDateObj <= documentDate) {
        setError("Due date must be after document date");
      } else {
        setError("");
      }
    } else if (!due) {
      setError("Due date is required");
    } else {
      setError("");
    }
  }, [
    formData.invoice_date,
    formData.due_date,
    formData.quotation_date,
    documentType,
  ]);

  // Handle place order
  const handlePlaceOrder = async () => {
    if (!selectedCustomer) return toast.error("Please select a customer.");
    if (!userId) return toast.error("User not logged in!");
    if (!formData.invoice_date || !formData.due_date) {
      return toast.error("Please provide valid document and due dates.");
    }
    if (!formData.bill_to && documentType === "invoice") {
      return toast.error("Please provide a billing name.");
    }
    if (error) return toast.error("Please fix the errors before submitting.");
    if (documentType === "invoice" && !selectedPaymentMethod) {
      return toast.error("Please select a payment method.");
    }

    // Validate date format
    const documentDate = new Date(
      documentType === "invoice"
        ? formData.invoice_date
        : formData.quotation_date
    );
    const dueDate = new Date(formData.due_date);
    if (isNaN(documentDate) || isNaN(dueDate)) {
      return toast.error("Invalid date format for document or due date.");
    }
    if (dueDate <= documentDate) {
      return toast.error("Due date must be after document date.");
    }

    try {
      await refetchAddresses().unwrap();
    } catch (err) {
      return toast.error("Failed to load addresses. Please try again.");
    }

    if (
      formData.ship_to &&
      !addresses.find((addr) => addr.addressId === formData.ship_to)
    ) {
      return toast.error("Invalid shipping address selected.");
    }

    const selectedCustomerData = customerList.find(
      (customer) => customer.customerId === selectedCustomer
    );
    if (!selectedCustomerData) {
      return toast.error("Selected customer not found.");
    }

    if (documentType === "invoice") {
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
        totalAmount: calculateTotals.totalAmount || 0,
        invoiceId: null,
      };

      const invoiceDataToSubmit = {
        invoiceId: uuidv4(),
        createdBy: userId,
        customerId: selectedCustomerData.customerId,
        bill_to: formData.bill_to,
        ship_to: formData.ship_to,
        amount: calculateTotals.totalAmount,
        invoice_date: formData.invoice_date,
        due_date: formData.due_date,
        paymentMethod: JSON.stringify({ method: selectedPaymentMethod }),
        status: selectedPaymentMethod === "Pay Later" ? "unpaid" : "paid",
        products: JSON.stringify(
          cartItems.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
          }))
        ),
        signature_name: formData.signature_name || "CM TRADING CO",
        invoice_no: invoiceNumber,
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
        toast.success("Invoice created successfully!");
        setFormData({
          document_title: "",
          quotation_date: new Date().toISOString().split("T")[0],
          due_date: "",
          reference_number: "",
          include_gst: false,
          gst_value: "",
          discountType: "percent",
          roundOff: "",
          finalAmount: "",
          signature_name: "CM TRADING CO",
          signature_image: "",
          invoice_date: new Date().toISOString().split("T")[0],
          bill_to: "",
          ship_to: null,
        });
        setSelectedCustomer("");
        setSelectedPaymentMethod("Cash");
        setInvoiceNumber(generateInvoiceNumber());
        setActiveTab("cart");
      } catch (error) {
        toast.error(
          `Failed to create invoice: ${
            error.data?.message || error.message || "Unknown error"
          }`
        );
      }
    } else {
      // Quotation logic
      const formattedProducts = cartItems.map((item) => ({
        productId: item.productId,
        quantity: Number(item.quantity) || 1,
        sellingPrice: Number(item.price) || 0,
        discount: 0,
        tax: 0,
        total: Number(item.price * item.quantity) || 0,
        name: item.name || "Unnamed Product",
      }));

      const formattedFormData = {
        document_title:
          formData.document_title ||
          `Quotation for ${selectedCustomerData.name}`,
        quotation_date: formData.quotation_date,
        due_date: formData.due_date,
        reference_number: formData.reference_number || quotationNumber,
        include_gst: formData.include_gst,
        gst_value: isNaN(formData.gst_value) ? 0 : Number(formData.gst_value),
        discountType: formData.discountType,
        roundOff: isNaN(formData.roundOff) ? 0 : Number(formData.roundOff),
        finalAmount: calculateTotals.totalAmount,
        signature_name: formData.signature_name || "CM TRADING CO",
        signature_image: formData.signature_image || "",
        customerId: selectedCustomerData.customerId,
        ship_to: formData.ship_to || null,
        createdBy: userId,
        products: formattedProducts,
      };

      try {
        await createQuotation(formattedFormData).unwrap();
        toast.success("Quotation created successfully!");
        await handleClearCart();
        setFormData({
          document_title: "",
          quotation_date: new Date().toISOString().split("T")[0],
          due_date: "",
          reference_number: "",
          include_gst: false,
          gst_value: "",
          discountType: "percent",
          roundOff: "",
          finalAmount: "",
          signature_name: "CM TRADING CO",
          signature_image: "",
          invoice_date: new Date().toISOString().split("T")[0],
          bill_to: "",
          ship_to: null,
        });
        setSelectedCustomer("");
        setQuotationNumber(generateQuotationNumber());
        setActiveTab("cart");
      } catch (error) {
        toast.error(
          `Failed to create quotation: ${
            error.data?.message || error.message || "Unknown error"
          }`
        );
      }
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
                        shipping={calculateTotals.shipping}
                        tax={formData.include_gst ? 0 : calculateTotals.tax}
                        coupon={0}
                        discount={calculateTotals.discount}
                        roundOff={formData.roundOff}
                        subTotal={calculateTotals.subTotal}
                        gstAmount={
                          formData.include_gst
                            ? (calculateTotals.subTotal *
                                (parseFloat(formData.gst_value) || 0)) /
                              100
                            : 0
                        }
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
                          <Text strong>Document Type</Text>
                          <Radio.Group
                            value={documentType}
                            onChange={(e) => setDocumentType(e.target.value)}
                            style={{ marginTop: 8, marginBottom: 16 }}
                          >
                            <Radio value="invoice">Invoice</Radio>
                            <Radio value="quotation">Quotation</Radio>
                          </Radio.Group>
                          <Divider />
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
                          {documentType === "invoice" ? (
                            <>
                              <InvoiceDetails
                                invoiceData={{
                                  invoice_date: formData.invoice_date,
                                  due_date: formData.due_date,
                                  bill_to: formData.bill_to,
                                  ship_to: formData.ship_to,
                                  signature_name: formData.signature_name,
                                }}
                                onChange={(key, value) =>
                                  handleFormChange(key, value)
                                }
                                error={error}
                              />
                              <Divider />
                            </>
                          ) : (
                            <>
                              <div>
                                <Text strong>Quotation Title *</Text>
                                <Input
                                  value={formData.document_title}
                                  onChange={(e) =>
                                    handleFormChange(
                                      "document_title",
                                      e.target.value
                                    )
                                  }
                                  placeholder="Enter quotation title"
                                  style={{ marginTop: 8 }}
                                  required
                                />
                              </div>
                              <Divider />
                              <div>
                                <Text strong>Quotation Date *</Text>
                                <Input
                                  type="date"
                                  value={formData.quotation_date}
                                  onChange={(e) =>
                                    handleFormChange(
                                      "quotation_date",
                                      e.target.value
                                    )
                                  }
                                  style={{ marginTop: 8 }}
                                  required
                                />
                              </div>
                              <div style={{ marginTop: 16 }}>
                                <Text strong>Due Date *</Text>
                                <Input
                                  type="date"
                                  value={formData.due_date}
                                  onChange={(e) =>
                                    handleFormChange("due_date", e.target.value)
                                  }
                                  style={{ marginTop: 8 }}
                                  required
                                />
                              </div>
                              <div style={{ marginTop: 16 }}>
                                <Text strong>Reference Number</Text>
                                <Input
                                  value={
                                    formData.reference_number || quotationNumber
                                  }
                                  onChange={(e) =>
                                    handleFormChange(
                                      "reference_number",
                                      e.target.value
                                    )
                                  }
                                  placeholder="Enter reference number"
                                  style={{ marginTop: 8 }}
                                />
                              </div>
                              <Divider />
                              <div>
                                <Text strong>Shipping Address</Text>
                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    marginTop: 8,
                                  }}
                                >
                                  <Select
                                    value={formData.ship_to}
                                    onChange={(value) =>
                                      handleFormChange("ship_to", value)
                                    }
                                    placeholder="Select shipping address"
                                    style={{ width: "100%" }}
                                    loading={addressesLoading}
                                  >
                                    {addressesLoading ? (
                                      <Option disabled>Loading...</Option>
                                    ) : addresses.length === 0 ? (
                                      <Option disabled>
                                        No addresses available
                                      </Option>
                                    ) : (
                                      addresses.map((address) => (
                                        <Option
                                          key={address.addressId}
                                          value={address.addressId}
                                        >
                                          {address.name ||
                                            `${address.street}, ${address.city}`}
                                        </Option>
                                      ))
                                    )}
                                  </Select>
                                  <Button
                                    type="link"
                                    icon={<PiPlus />}
                                    onClick={() => handleAddAddress("ship_to")}
                                    style={{ marginLeft: 8 }}
                                    aria-label="Add new shipping address"
                                  />
                                </div>
                              </div>
                              <Divider />
                              <div>
                                <Checkbox
                                  checked={formData.include_gst}
                                  onChange={(e) =>
                                    handleFormChange(
                                      "include_gst",
                                      e.target.checked
                                    )
                                  }
                                  style={{ marginTop: 8 }}
                                >
                                  Include GST
                                </Checkbox>
                                {formData.include_gst && (
                                  <div style={{ marginTop: 8 }}>
                                    <Text strong>GST Value (%)</Text>
                                    <Input
                                      type="number"
                                      value={formData.gst_value}
                                      onChange={(e) =>
                                        handleFormChange(
                                          "gst_value",
                                          e.target.value
                                        )
                                      }
                                      min="0"
                                      style={{ marginTop: 8 }}
                                    />
                                  </div>
                                )}
                              </div>
                              <div style={{ marginTop: 16 }}>
                                <Text strong>Discount Type</Text>
                                <Select
                                  value={formData.discountType}
                                  onChange={(value) =>
                                    handleFormChange("discountType", value)
                                  }
                                  style={{ width: "100%", marginTop: 8 }}
                                >
                                  <Option value="percent">Percent</Option>
                                  <Option value="fixed">Fixed</Option>
                                </Select>
                              </div>
                              <div style={{ marginTop: 16 }}>
                                <Text strong>Round Off</Text>
                                <Input
                                  type="number"
                                  value={formData.roundOff}
                                  onChange={(e) =>
                                    handleFormChange("roundOff", e.target.value)
                                  }
                                  style={{ marginTop: 8 }}
                                />
                              </div>
                              <div style={{ marginTop: 16 }}>
                                <Text strong>Signature Name</Text>
                                <Input
                                  value={formData.signature_name}
                                  onChange={(e) =>
                                    handleFormChange(
                                      "signature_name",
                                      e.target.value
                                    )
                                  }
                                  placeholder="Enter signature name"
                                  style={{ marginTop: 8 }}
                                />
                              </div>
                              <div style={{ marginTop: 16 }}>
                                <Text strong>Signature Image (URL)</Text>
                                <Input
                                  value={formData.signature_image}
                                  onChange={(e) =>
                                    handleFormChange(
                                      "signature_image",
                                      e.target.value
                                    )
                                  }
                                  placeholder="Enter signature image URL"
                                  style={{ marginTop: 8 }}
                                />
                              </div>
                              <Divider />
                            </>
                          )}
                        </>
                      )}
                    </CartSummaryCard>
                  </Col>
                  <Col xs={24} lg={8}>
                    <CartSummaryCard>
                      {documentType === "invoice" && (
                        <>
                          <PaymentMethod
                            subTotal={calculateTotals.totalAmount}
                            selectedMethod={selectedPaymentMethod}
                            onSelectMethod={setSelectedPaymentMethod}
                          />
                          <Divider />
                          <Text strong>Invoice #: {invoiceNumber}</Text>
                        </>
                      )}
                      {documentType === "quotation" && (
                        <>
                          <Text strong>Quotation #: {quotationNumber}</Text>
                        </>
                      )}
                      <Divider />
                      <OrderTotal
                        shipping={calculateTotals.shipping}
                        tax={formData.include_gst ? 0 : calculateTotals.tax}
                        coupon={0}
                        discount={calculateTotals.discount}
                        roundOff={formData.roundOff}
                        subTotal={calculateTotals.subTotal}
                        gstAmount={
                          formData.include_gst
                            ? (calculateTotals.subTotal *
                                (parseFloat(formData.gst_value) || 0)) /
                              100
                            : 0
                        }
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
                          !formData.invoice_date ||
                          !formData.due_date ||
                          (documentType === "invoice" &&
                            !selectedPaymentMethod) ||
                          (documentType === "quotation" &&
                            !formData.document_title)
                        }
                        block
                        size="large"
                        aria-label={
                          documentType === "invoice"
                            ? "Create Invoice"
                            : "Create Quotation"
                        }
                      >
                        {documentType === "invoice"
                          ? "Create Invoice"
                          : "Create Quotation"}
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

            <AddAddressModal
              show={showAddressModal}
              onClose={() => setShowAddressModal(false)}
              onSave={handleAddressSave}
            />
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
