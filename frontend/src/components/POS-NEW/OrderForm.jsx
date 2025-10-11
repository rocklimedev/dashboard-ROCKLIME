import { useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  Button,
  Alert,
  Typography,
  Divider,
  Select,
  DatePicker,
  Input,
} from "antd";
import {
  UserAddOutlined,
  DeleteOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import { useGetCustomersQuery } from "../../api/customerApi";
import { useClearCartMutation } from "../../api/cartApi";
import { useCreateOrderMutation } from "../../api/orderApi";
import { useGetAllAddressesQuery } from "../../api/addressApi";
import { useGetAllTeamsQuery } from "../../api/teamApi";
import { useGetProductsByIdsQuery } from "../../api/productApi";
import { toast } from "sonner";
import styled from "styled-components";
import PropTypes from "prop-types";
import moment from "moment";

const { Title, Text } = Typography;
const { Option } = Select;

const CartSummaryCard = styled(Card)`
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 16px;
  @media (min-width: 768px) {
    top: 20px;
  }
`;

const CustomerSelect = styled(Select)`
  width: 100%;
  margin-top: 8px;
`;

const STATUS_VALUES = [
  "CREATED",
  "PREPARING",
  "CHECKING",
  "INVOICE",
  "DISPATCHED",
  "DELIVERED",
  "PARTIALLY_DELIVERED",
  "CANCELED",
  "DRAFT",
  "ONHOLD",
];

const OrderForm = ({
  selectedCustomer,
  setSelectedCustomer,
  quotationData,
  setQuotationData,
  orderData,
  setOrderData,
  itemDiscounts,
  cartItems,
  userId,
  orderNumber,
  totalAmount,
  setError,
  error,
  setShowAddAddressModal,
  resetForm,
  setActiveTab,
}) => {
  const navigate = useNavigate();
  const {
    data: customerData,
    isLoading: customersLoading,
    error: customersError,
  } = useGetCustomersQuery();
  const {
    data: addressesData,
    isLoading: addressesLoading,
    isFetching: addressesFetching,
    error: addressesError,
    refetch: refetchAddresses,
  } = useGetAllAddressesQuery(
    { customerId: selectedCustomer },
    { skip: !selectedCustomer }
  );
  const { data: teamsData, isLoading: teamsLoading } = useGetAllTeamsQuery();
  const [createOrder] = useCreateOrderMutation();
  const [clearCart] = useClearCartMutation();

  const productIds = useMemo(
    () => cartItems.map((item) => item.productId),
    [cartItems]
  );
  const { data: productsData, isLoading: productsLoading } =
    useGetProductsByIdsQuery(productIds, { skip: !productIds.length });

  const customers = customerData?.data || [];
  const customerList = useMemo(
    () => (Array.isArray(customers) ? customers : []),
    [customers]
  );
  const addresses = useMemo(
    () => (Array.isArray(addressesData) ? addressesData : []),
    [addressesData]
  );
  console.log(addresses);
  const teams = useMemo(
    () => (Array.isArray(teamsData?.teams) ? teamsData.teams : []),
    [teamsData]
  );
  const products = useMemo(
    () => (Array.isArray(productsData?.products) ? productsData.products : []),
    [productsData]
  );

  // Debugging logs to diagnose address fetching
  useEffect(() => {
    console.log("OrderForm: selectedCustomer:", selectedCustomer);
    console.log(
      "OrderForm: addressesLoading:",
      addressesLoading,
      "addressesFetching:",
      addressesFetching
    );
    console.log("OrderForm: addresses:", addresses);
    console.log("OrderForm: addressesError:", addressesError);
  }, [
    selectedCustomer,
    addressesLoading,
    addressesFetching,
    addresses,
    addressesError,
  ]);

  // Set orderNo from orderNumber prop
  useEffect(() => {
    setOrderData((prev) => ({ ...prev, orderNo: orderNumber }));
  }, [orderNumber, setOrderData]);

  // Set billTo and shipTo based on selected customer
  useEffect(() => {
    if (!selectedCustomer || addressesLoading || addressesFetching) return;

    const selectedCustomerData = customerList.find(
      (customer) => customer.customerId === selectedCustomer
    );
    if (!selectedCustomerData) {
      console.log("OrderForm: No customer data found for", selectedCustomer);
      return;
    }

    setQuotationData((prev) => {
      const newBillTo = selectedCustomerData.name || prev.billTo;
      let newShipTo = prev.shipTo;

      // Set default shipping address if available
      if (addresses.length > 0) {
        const currentAddressValid = addresses.some(
          (addr) => addr.addressId === prev.shipTo
        );
        if (!currentAddressValid) {
          newShipTo = addresses[0].addressId; // Set to first available address
          console.log("OrderForm: Setting shipTo to first address:", newShipTo);
        }
      } else {
        newShipTo = ""; // Clear shipTo if no addresses are available
        console.log("OrderForm: No addresses available, clearing shipTo");
      }

      return { ...prev, billTo: newBillTo, shipTo: newShipTo };
    });

    setOrderData((prev) => ({
      ...prev,
      createdFor: selectedCustomerData.customerId,
      dueDate: orderData.dueDate,
    }));

    // Trigger refetch to ensure fresh address data
    refetchAddresses();
  }, [
    selectedCustomer,
    customerList,
    addresses,
    addressesLoading,
    addressesFetching,
    setQuotationData,
    setOrderData,
    orderData.dueDate,
    refetchAddresses,
  ]);

  // Validate quotation and due dates
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
  }, [orderData.quotationDate, orderData.dueDate, setError]);

  const handleQuotationChange = (key, value) => {
    setQuotationData((prev) => ({ ...prev, [key]: value }));
    if (key === "dueDate") {
      setOrderData((prev) => ({ ...prev, dueDate: value }));
    }
  };

  const handleOrderChange = (key, value) => {
    setOrderData((prev) => ({ ...prev, [key]: value }));
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

  const handleCreateOrder = async () => {
    if (!selectedCustomer) return toast.error("Please select a customer.");
    if (!userId) return toast.error("User not logged in!");
    if (error) return toast.error("Please fix the errors before submitting.");
    if (cartItems.length === 0)
      return toast.error("Cart is empty. Add items to proceed.");
    if (productsLoading)
      return toast.error("Product details are still loading. Please wait.");
    if (isNaN(totalAmount) || totalAmount <= 0)
      return toast.error("Invalid total amount.");

    const orderNoRegex =
      /^[1-3]?[0-9][1-9][0-1][0-9](25|2[6-9]|[3-9][0-9])[1-9][0-9]{2,}$/;
    if (!orderData.orderNo || !orderNoRegex.test(orderData.orderNo)) {
      return toast.error(
        "Invalid order number format. Expected format: DDMMYYXXX (e.g., 111025101)."
      );
    }

    if (!validateFollowupDates()) {
      return toast.error("Follow-up dates cannot be after the due date.");
    }

    try {
      await refetchAddresses().unwrap();
    } catch (err) {
      return toast.error("Failed to load addresses. Please try again.");
    }

    const selectedCustomerData = customerList.find(
      (customer) => customer.customerId === selectedCustomer
    );
    if (!selectedCustomerData)
      return toast.error("Selected customer not found.");

    if (
      orderData.shipTo &&
      !addresses.find((addr) => addr.addressId === orderData.shipTo)
    ) {
      return toast.error("Invalid shipping address selected.");
    }

    const productsPayload = cartItems.map((item) => {
      const product = products.find((p) => p.productId === item.productId);
      const discountType = product?.discountType || "fixed";
      const itemSubtotal = parseFloat((item.price * item.quantity).toFixed(2));
      const itemDiscount = parseFloat(itemDiscounts[item.productId]) || 0;
      let total;

      if (discountType === "percent") {
        total = parseFloat(
          (itemSubtotal * (1 - itemDiscount / 100)).toFixed(2)
        );
      } else {
        total = parseFloat((itemSubtotal - itemDiscount).toFixed(2));
      }

      return {
        id: item.productId,
        price: parseFloat(item.price || 0),
        discount: itemDiscount,
        total,
      };
    });

    for (const product of productsPayload) {
      if (
        !product.id ||
        product.price === undefined ||
        product.discount === undefined ||
        product.total === undefined
      ) {
        return toast.error(
          "Each product must have id, price, discount, and total."
        );
      }
      if (product.price < 0 || product.discount < 0 || product.total < 0) {
        return toast.error(
          "Product price, discount, and total must be non-negative."
        );
      }
      const productRecord = products.find((p) => p.productId === product.id);
      if (!productRecord) {
        return toast.error(`Product with ID ${product.id} not found.`);
      }
    }

    const orderPayload = {
      orderNo: orderData.orderNo,
      createdFor: selectedCustomerData.customerId,
      createdBy: userId,
      assignedTo: orderData.teamId || null,
      pipeline: orderData.pipeline || "",
      status: orderData.status || "CREATED",
      dueDate: orderData.dueDate || orderData.dueDate,
      followupDates: orderData.followupDates.filter(
        (date) => date && moment(date).isValid()
      ),
      source: orderData.source || "",
      priority: orderData.priority || "medium",
      description: orderData.description || "",
      invoiceLink: null,
      quotationId: orderData.quotationId || "",
      products: productsPayload,
    };

    try {
      await createOrder(orderPayload).unwrap();
      await clearCart({ userId }).unwrap();
      resetForm();
      navigate("/orders/list");
      toast.success("Order created successfully!");
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
  };

  const handleFollowupDateChange = (index, date) => {
    const updatedDates = [...orderData.followupDates];
    updatedDates[index] = date ? date.format("YYYY-MM-DD") : "";
    if (date && moment(date).isAfter(moment(orderData.dueDate), "day")) {
      toast.warning(
        `Follow-up date ${index + 1} cannot be after the due date.`
      );
    }
    if (date && moment(date).isBefore(moment().startOf("day"))) {
      toast.warning(`Follow-up date ${index + 1} cannot be before today.`);
    }
    setOrderData({ ...orderData, followupDates: updatedDates });
  };

  const addFollowupDate = () => {
    setOrderData({
      ...orderData,
      followupDates: [...orderData.followupDates, ""],
    });
  };

  const removeFollowupDate = (index) => {
    setOrderData({
      ...orderData,
      followupDates: orderData.followupDates.filter((_, i) => i !== index),
    });
  };

  return (
    <CartSummaryCard>
      <Title level={3} style={{ fontSize: "18px" }}>
        Order Details
      </Title>
      <Divider />
      <Text strong>Select Customer</Text>
      <CustomerSelect
        value={selectedCustomer}
        onChange={(value) => {
          setSelectedCustomer(value);
          setQuotationData((prev) => ({ ...prev, shipTo: "" }));
        }}
        placeholder="Select a customer"
        loading={customersLoading}
        disabled={customersLoading}
        aria-label="Select customer"
      >
        {customersLoading ? (
          <Option disabled>Loading customers...</Option>
        ) : customersError ? (
          <Option disabled>Error loading customers</Option>
        ) : customerList.length === 0 ? (
          <Option disabled>No customers available</Option>
        ) : (
          customerList.map((customer) => (
            <Option key={customer.customerId} value={customer.customerId}>
              {customer.name} ({customer.email})
            </Option>
          ))
        )}
      </CustomerSelect>
      <Button
        type="link"
        icon={<UserAddOutlined />}
        onClick={() => navigate("/customers/add")}
      >
        Add New Customer
      </Button>
      <Divider />
      <Text strong>Shipping Address</Text>
      <Select
        value={orderData.shipTo}
        onChange={(value) => handleQuotationChange("shipTo", value)}
        placeholder={
          !selectedCustomer
            ? "Select a customer first"
            : addressesLoading || addressesFetching
            ? "Loading addresses..."
            : addresses.length === 0
            ? "No addresses available"
            : "Select shipping address"
        }
        loading={addressesLoading || addressesFetching}
        disabled={!selectedCustomer || addressesLoading || addressesFetching}
        style={{ width: "100%", marginTop: 8 }}
        aria-label="Select shipping address"
      >
        {addressesError ? (
          <Option disabled>Error loading addresses</Option>
        ) : addresses.length === 0 &&
          !addressesLoading &&
          !addressesFetching ? (
          <Option disabled>No addresses available</Option>
        ) : (
          addresses.map((address) => (
            <Option key={address.addressId} value={address.addressId}>
              {`${address.street}, ${address.city}${
                address.state ? `, ${address.state}` : ""
              }, ${address.country}${
                address.postalCode ? `, ${address.postalCode}` : ""
              }`}
            </Option>
          ))
        )}
      </Select>
      <Button
        type="link"
        icon={<UserAddOutlined />}
        onClick={() => setShowAddAddressModal(true)}
        style={{ padding: 0, marginTop: 8 }}
        aria-label="Add new address"
        disabled={!selectedCustomer}
      >
        Add New Address
      </Button>
      {addressesError && (
        <Alert
          message="Error loading addresses"
          description={
            <span>
              {addressesError?.data?.message || "Unknown error"}
              <Button
                type="link"
                onClick={() => refetchAddresses()}
                style={{ padding: 0, marginLeft: 8 }}
              >
                Retry
              </Button>
            </span>
          }
          type="error"
          showIcon
          style={{ marginTop: 8 }}
        />
      )}
      <Divider />
      <Text strong>Order Date</Text>
      <input
        type="date"
        className="form-control"
        value={orderData.quotationDate}
        onChange={(e) => handleQuotationChange("quotationDate", e.target.value)}
        style={{ marginTop: 8, width: "100%" }}
      />
      <Text strong>Due Date</Text>
      <input
        type="date"
        className="form-control"
        value={orderData.dueDate}
        onChange={(e) => handleQuotationChange("dueDate", e.target.value)}
        style={{ marginTop: 8, width: "100%" }}
      />
      {error && (
        <Alert message={error} type="error" showIcon style={{ marginTop: 8 }} />
      )}
      <Divider />
      <Text strong>Order Number</Text>
      <Input
        value={orderData.orderNo}
        placeholder="System-generated order number (e.g., 111025101)"
        style={{ marginTop: 8 }}
        readOnly
      />
      <Divider />
      <Text strong>Status</Text>
      <Select
        value={orderData.status}
        onChange={(value) => handleOrderChange("status", value)}
        style={{ width: "100%", marginTop: 8 }}
      >
        {STATUS_VALUES.map((status) => (
          <Option key={status} value={status}>
            {status.charAt(0).toUpperCase() +
              status.slice(1).toLowerCase().replace("_", " ")}
          </Option>
        ))}
      </Select>
      <Divider />
      <Text strong>Priority</Text>
      <Select
        value={orderData.priority}
        onChange={(value) => handleOrderChange("priority", value)}
        style={{ width: "100%", marginTop: 8 }}
        placeholder="Select priority"
      >
        <Option value="high">High</Option>
        <Option value="medium">Medium</Option>
        <Option value="low">Low</Option>
      </Select>
      <Divider />
      <Text strong>Assigned To</Text>
      <Select
        value={orderData.teamId}
        onChange={(value) => handleOrderChange("teamId", value)}
        style={{ width: "100%", marginTop: 8 }}
        placeholder="Select team"
        disabled={teamsLoading}
      >
        {teams.length > 0 ? (
          teams.map((team) => (
            <Option key={team.id} value={team.id}>
              {team.teamName}
            </Option>
          ))
        ) : (
          <Option value="" disabled>
            No teams available
          </Option>
        )}
      </Select>
      <Divider />
      <Text strong>Follow-up Dates</Text>
      {orderData.followupDates.map((date, index) => (
        <div
          key={index}
          style={{ display: "flex", alignItems: "center", marginTop: 8 }}
        >
          <DatePicker
            style={{ width: "100%" }}
            value={date ? moment(date) : null}
            onChange={(date) => handleFollowupDateChange(index, date)}
            format="YYYY-MM-DD"
            disabledDate={(current) =>
              current &&
              (current < moment().startOf("day") ||
                (orderData.dueDate &&
                  current > moment(orderData.dueDate).endOf("day")))
            }
          />
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            onClick={() => removeFollowupDate(index)}
            aria-label="Remove follow-up date"
            style={{ marginLeft: 8 }}
          />
        </div>
      ))}
      <Button
        type="primary"
        onClick={addFollowupDate}
        style={{ marginTop: 8 }}
        aria-label="Add follow-up date"
      >
        <PlusOutlined /> Add Follow-up Date
      </Button>
      <Divider />
      <Text strong>Source</Text>
      <Input
        value={orderData.source}
        onChange={(e) => handleOrderChange("source", e.target.value)}
        placeholder="Enter source"
        style={{ marginTop: 8 }}
        maxLength={255}
      />
      <Divider />
      <Text strong>Description</Text>
      <Input.TextArea
        value={orderData.description}
        onChange={(e) => handleOrderChange("description", e.target.value)}
        rows={4}
        placeholder="Enter description"
        style={{ marginTop: 8 }}
        maxLength={60}
      />
      <Text
        style={{ color: orderData.description.length > 60 ? "red" : "inherit" }}
      >
        {orderData.description.length}/60 Characters (Recommended)
      </Text>
      <Button
        id="order-submit"
        style={{ display: "none" }}
        onClick={handleCreateOrder}
      />
    </CartSummaryCard>
  );
};

OrderForm.propTypes = {
  selectedCustomer: PropTypes.string,
  setSelectedCustomer: PropTypes.func.isRequired,
  quotationData: PropTypes.object.isRequired,
  setQuotationData: PropTypes.func.isRequired,
  orderData: PropTypes.object.isRequired,
  setOrderData: PropTypes.func.isRequired,
  itemDiscounts: PropTypes.object.isRequired,
  cartItems: PropTypes.array.isRequired,
  userId: PropTypes.string,
  orderNumber: PropTypes.string.isRequired,
  totalAmount: PropTypes.number.isRequired,
  setError: PropTypes.func.isRequired,
  error: PropTypes.string,
  setShowAddAddressModal: PropTypes.func.isRequired,
  resetForm: PropTypes.func.isRequired,
  setActiveTab: PropTypes.func.isRequired,
};

export default OrderForm;
