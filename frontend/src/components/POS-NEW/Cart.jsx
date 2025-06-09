import React, { useState, useEffect, useMemo } from "react";
import {
  Steps,
  Card,
  Select,
  Button,
  Modal,
  Table,
  InputNumber,
  Spin,
  Alert,
  Space,
  Typography,
  Divider,
  Empty,
  Badge,
} from "antd";
import {
  ShoppingCartOutlined,
  UserAddOutlined,
  FileTextOutlined,
  CreditCardOutlined,
  CheckCircleOutlined,
  DeleteOutlined,
  PrinterOutlined,
} from "@ant-design/icons";
import { useGetCustomersQuery } from "../../api/customerApi";
import {
  useGetCartQuery,
  useUpdateCartMutation,
  useClearCartMutation,
  useRemoveFromCartMutation,
} from "../../api/cartApi";
import AddCustomer from "../Customers/AddCustomer";
import { useGetProfileQuery } from "../../api/userApi";
import OrderTotal from "./OrderTotal";
import PaymentMethod from "./PaymentMethod";
import { toast } from "sonner";
import { useCreateInvoiceMutation } from "../../api/invoiceApi";
import InvoiceDetails from "../POS/InvoiceDetails";
import { v4 as uuidv4 } from "uuid";
import { useGetAllAddressesQuery } from "../../api/addressApi";
import { FcEmptyTrash } from "react-icons/fc";
const { Step } = Steps;
const { Title, Text } = Typography;
const { Option } = Select;

const generateInvoiceNumber = () => {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(1000 + Math.random() * 9000);
  return `INV-${timestamp}-${random}`;
};

const Cart = ({ onConvertToOrder }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const {
    data: profileData,
    isLoading: profileLoading,
    error: profileError,
  } = useGetProfileQuery();
  const userId = profileData?.user?.userId;

  const [createInvoice] = useCreateInvoiceMutation();
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

  const initialInvoiceData = {
    invoiceDate: "",
    dueDate: "",
    shipTo: null,
    signatureName: "CM TRADING CO",
    billTo: "",
  };

  const [invoiceData, setInvoiceData] = useState(initialInvoiceData);
  const [showModal, setShowModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [error, setError] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState(generateInvoiceNumber());

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
  const totalAmount = cartItems.reduce(
    (acc, item) => acc + (item.price || 0) * (item.quantity || 0),
    0
  );

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

          if (newBillTo !== prev.billTo || newShipTo !== prev.shipTo) {
            return { ...prev, billTo: newBillTo, shipTo: newShipTo };
          }
          return prev;
        });
      }
    } else if (selectedCustomer && addresses.length === 0) {
      setInvoiceData((prev) => ({
        ...prev,
        shipTo: null,
      }));
    }
  }, [selectedCustomer, customerList, addresses]);

  const validateDueDate = () => {
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
  };

  useEffect(() => {
    validateDueDate();
  }, [invoiceData.invoiceDate, invoiceData.dueDate]);

  const handleInvoiceChange = (key, value) => {
    setInvoiceData((prev) => ({ ...prev, [key]: value }));
  };

  const handleClearCart = async () => {
    if (!userId) {
      toast.error("User not logged in!");
      return;
    }
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
    if (!selectedCustomer) {
      toast.error("Please select a customer before placing an order.");
      return;
    }
    if (!userId) {
      toast.error("User not logged in!");
      return;
    }
    if (!invoiceData.invoiceDate || !invoiceData.dueDate) {
      toast.error("Please provide invoice and due dates.");
      return;
    }
    if (!invoiceData.billTo) {
      toast.error("Please provide a billing name or address.");
      return;
    }
    try {
      await refetchAddresses();
    } catch (err) {
      toast.error("Failed to load addresses. Please try again.");
      return;
    }
    if (
      invoiceData.shipTo &&
      !addresses.find((addr) => addr.addressId === invoiceData.shipTo)
    ) {
      toast.error(
        "Invalid shipping address selected. Please select a valid address or clear the selection."
      );
      return;
    }
    if (error) {
      toast.error("Please fix the errors before submitting.");
      return;
    }

    const selectedCustomerData = customerList.find(
      (customer) => customer.customerId === selectedCustomer
    );
    if (!selectedCustomerData) {
      toast.error("Selected customer not found.");
      return;
    }

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
        throw new Error(
          `Invalid response structure: invoiceId not found in response: ${JSON.stringify(
            response
          )}`
        );
      }

      orderData.invoiceId = invoiceId;
      onConvertToOrder(orderData);
      await handleClearCart();
      toast.success("Order placed");
      setInvoiceData(initialInvoiceData);
      setSelectedCustomer("");
      setInvoiceNumber(generateInvoiceNumber());
      setCurrentStep(0);
    } catch (error) {
      toast.error(
        `Failed to place order or create invoice: ${
          error.data?.message || error.message || "Unknown error"
        }`
      );
    }
  };

  const handleNext = () => {
    if (currentStep === 0 && !selectedCustomer) {
      toast.error("Please select a customer to proceed.");
      return;
    }
    if (currentStep === 1 && cartItems.length === 0) {
      toast.error("Please add items to the cart to proceed.");
      return;
    }
    if (
      currentStep === 2 &&
      (!invoiceData.invoiceDate || !invoiceData.dueDate || error)
    ) {
      toast.error("Please complete invoice details to proceed.");
      return;
    }
    setCurrentStep(currentStep + 1);
  };

  const handlePrev = () => {
    setCurrentStep(currentStep - 1);
  };

  const columns = [
    {
      title: "Product",
      dataIndex: "name",
      key: "name",
      render: (text, record) => (
        <Space>
          <Text>{text}</Text>
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleRemoveItem(record.productId)}
          />
        </Space>
      ),
    },
    {
      title: "Quantity",
      key: "quantity",
      render: (_, record) => (
        <InputNumber
          min={0}
          value={record.quantity}
          onChange={(value) => handleUpdateQuantity(record.productId, value)}
          style={{ width: 80 }}
        />
      ),
    },
    {
      title: "Price",
      key: "price",
      render: (_, record) => (
        <Text>₹{(record.price * record.quantity).toFixed(2)}</Text>
      ),
      align: "right",
    },
  ];

  const steps = [
    {
      title: "Select Customer",
      icon: <UserAddOutlined />,
      content: (
        <Card>
          <Space direction="vertical" style={{ width: "100%" }}>
            <Title level={4}>
              New Order{" "}
              <Badge
                count={`#${invoiceNumber}`}
                style={{ backgroundColor: "#722ed1" }}
              />
            </Title>
            <Select
              style={{ width: "100%" }}
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
                  <Option key={customer.customerId} value={customer.customerId}>
                    {customer.name} ({customer.email})
                  </Option>
                ))
              )}
            </Select>
            <Button
              type="link"
              icon={<UserAddOutlined />}
              onClick={() => setShowModal(true)}
            >
              Add New Customer
            </Button>
          </Space>
        </Card>
      ),
    },
    {
      title: "Cart Items",
      icon: <ShoppingCartOutlined />,
      content: (
        <Card>
          <Space direction="vertical" style={{ width: "100%" }}>
            <Space style={{ width: "100%", justifyContent: "space-between" }}>
              <Title level={4}>Order Details</Title>
              <Badge
                count={totalItems}
                showZero
                style={{ backgroundColor: "#13c2c2" }}
              />
            </Space>
            {cartItems.length === 0 ? (
              <Empty
                description="No Products Selected"
                image={<FcEmptyTrash style={{ fontSize: 48 }} />}
              >
                <Button type="primary" onClick={handleClearCart}>
                  Clear Cart
                </Button>
              </Empty>
            ) : (
              <Table
                dataSource={cartItems}
                columns={columns}
                rowKey="productId"
                pagination={false}
                bordered
              />
            )}
            <OrderTotal
              shipping={40}
              tax={25}
              coupon={25}
              discount={15}
              roundOff={0}
              subTotal={totalAmount}
            />
          </Space>
        </Card>
      ),
    },
    {
      title: "Invoice Details",
      icon: <FileTextOutlined />,
      content: (
        <Card>
          <InvoiceDetails
            invoiceData={invoiceData}
            onChange={handleInvoiceChange}
            error={error}
          />
        </Card>
      ),
    },
    {
      title: "Payment Method",
      icon: <CreditCardOutlined />,
      content: (
        <Card>
          <PaymentMethod />
        </Card>
      ),
    },
    {
      title: "Confirm Order",
      icon: <CheckCircleOutlined />,
      content: (
        <Card>
          <Space direction="vertical" style={{ width: "100%" }}>
            <Title level={4}>Order Summary</Title>
            <Text>
              Customer:{" "}
              {
                customerList.find((c) => c.customerId === selectedCustomer)
                  ?.name
              }
            </Text>
            <Text>Invoice Number: {invoiceNumber}</Text>
            <Text>Total Items: {totalItems}</Text>
            <Text>Total Amount: ₹{totalAmount.toFixed(2)}</Text>
            <Divider />
            <Button
              type="primary"
              icon={<CheckCircleOutlined />}
              onClick={handlePlaceOrder}
              disabled={
                cartItems.length === 0 ||
                error ||
                customersLoading ||
                addressesLoading ||
                !addressesData
              }
              block
            >
              Generate Invoice
            </Button>
            <Button type="default" icon={<PrinterOutlined />} block>
              Print Order
            </Button>
          </Space>
        </Card>
      ),
    },
  ];

  if (profileLoading || cartLoading || customersLoading || addressesLoading) {
    return (
      <div style={{ textAlign: "center", padding: 50 }}>
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
    <div style={{ padding: 24, maxWidth: 600, margin: "0 auto" }}>
      <Steps current={currentStep} style={{ marginBottom: 24 }}>
        {steps.map((step) => (
          <Step key={step.title} title={step.title} icon={step.icon} />
        ))}
      </Steps>
      <div style={{ marginBottom: 24 }}>{steps[currentStep].content}</div>
      <Space>
        {currentStep > 0 && <Button onClick={handlePrev}>Previous</Button>}
        {currentStep < steps.length - 1 && (
          <Button type="primary" onClick={handleNext}>
            Next
          </Button>
        )}
      </Space>
      <Modal
        title="Add Customer"
        open={showModal}
        onCancel={() => setShowModal(false)}
        footer={null}
      >
        <AddCustomer
          onClose={() => setShowModal(false)}
          existingCustomer={null}
        />
      </Modal>
    </div>
  );
};

export default Cart;
