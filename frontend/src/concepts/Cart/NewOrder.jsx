// src/pages/quotations/NewOrder.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { message } from "antd";
import moment from "moment";

import CartLayout from "./CartLayout";
import OrderForm from "../../components/POS-NEW/OrderForm";
import { useCreateOrderMutation } from "../../api/orderApi";
import { useGetCustomersQuery } from "../../api/customerApi";
import {
  useGetAllAddressesQuery,
  useCreateAddressMutation,
} from "../../api/addressApi";
import { useGetAllTeamsQuery } from "../../api/teamApi";
import { useGetAllUsersQuery } from "../../api/userApi";
import { useGetProfileQuery } from "../../api/userApi";
import { useAuth } from "../../context/AuthContext";

const NewOrder = () => {
  const navigate = useNavigate();
  const { auth } = useAuth();

  const [createOrder] = useCreateOrderMutation();
  const [createAddress] = useCreateAddressMutation();

  const [orderData, setOrderData] = useState({
    createdFor: "",
    createdBy: "",
    assignedTeamId: "",
    assignedUserId: "",
    secondaryUserId: "",
    status: "PREPARING",
    dueDate: moment().add(1, "days").format("YYYY-MM-DD"),
    followupDates: [],
    source: "",
    priority: "medium",
    description: "",
    shipTo: null,
    extraDiscount: 0,
    extraDiscountType: "fixed",
  });

  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [useBillingAddress, setUseBillingAddress] = useState(false);
  const [billingAddressId, setBillingAddressId] = useState(null);

  const { data: profileData } = useGetProfileQuery();
  const userId = profileData?.user?.userId || auth?.userId;

  const { data: customersData } = useGetCustomersQuery({ limit: 500 });
  const { data: addressesData } = useGetAllAddressesQuery(
    selectedCustomer || undefined,
    { skip: !selectedCustomer },
  );

  const { data: teamsData } = useGetAllTeamsQuery();
  const { data: usersData } = useGetAllUsersQuery();

  const customers = customersData?.data || [];
  const addresses = addressesData || [];
  const teams = teamsData?.teams || [];
  const users = usersData?.users || [];

  useEffect(() => {
    if (userId) setOrderData((prev) => ({ ...prev, createdBy: userId }));
  }, [userId]);

  const handleCreateOrder = async (layoutProps = {}) => {
    const {
      calculationCartItems = [],
      shipping = 0,
      gst = 0,
      itemDiscounts = {},
      itemDiscountTypes = {},
      itemTaxes = {},
      handleClearCart,
    } = layoutProps;

    if (!selectedCustomer) return message.error("Please select a customer.");
    if (calculationCartItems.length === 0)
      return message.error("Cart is empty.");
    if (!orderData.dueDate) return message.error("Please select a due date.");

    // Shipping Address
    let finalShipTo = orderData.shipTo;
    if (useBillingAddress && !billingAddressId) {
      const customer = customers.find((c) => c.customerId === selectedCustomer);
      if (!customer?.address)
        return message.error("Customer has no default address.");

      let parsedAddr;
      try {
        parsedAddr =
          typeof customer.address === "string"
            ? JSON.parse(customer.address)
            : customer.address;
      } catch {
        return message.error("Invalid address format.");
      }

      try {
        const res = await createAddress({
          customerId: selectedCustomer,
          street: parsedAddr.street || "",
          city: parsedAddr.city || "",
          state: parsedAddr.state || "",
          postalCode: parsedAddr.postalCode || parsedAddr.zip || "",
          country: "India",
          status: "SHIPPING",
        }).unwrap();
        finalShipTo = res.addressId;
      } catch (e) {
        return message.error(
          e?.data?.message || "Failed to create shipping address.",
        );
      }
    }

    if (!finalShipTo) return message.error("Shipping address is required.");

    // Simple enrichment - only what backend needs for validation
    // In NewOrder.jsx → inside handleCreateOrder function

    const enrichedProducts = calculationCartItems.map((item) => {
      const productId = item.productId || item.id;
      const price = Number(item.price) || 0;
      const quantity = Number(item.quantity) || 1;
      const discount = Number(itemDiscounts[productId]) || 0;
      const discountType = itemDiscountTypes[productId] || "percent";
      const tax = Number(itemTaxes[productId]) || 0;

      const subtotal = price * quantity;
      const discountAmount =
        discountType === "percent"
          ? (subtotal * discount) / 100
          : discount * quantity;

      const total = subtotal - discountAmount;

      return {
        id: productId,
        name: item.name || "Unknown Product",

        // ← THESE 3 FIELDS WERE MISSING
        imageUrl: item.imageUrl || "",
        productCode: item.productCode || "",
        companyCode: item.companyCode || "",

        quantity,
        price: Number(price.toFixed(2)),
        discount: Number(discount.toFixed(2)),
        discountType,
        tax,
        total: Number(total.toFixed(2)),
      };
    });
    console.log("Enriched Products:", enrichedProducts);
    const orderPayload = {
      createdFor: selectedCustomer,
      createdBy: userId,
      assignedTeamId: orderData.assignedTeamId || null,
      assignedUserId: orderData.assignedUserId || null,
      secondaryUserId: orderData.secondaryUserId || null,
      status: orderData.status || "PREPARING",
      dueDate: orderData.dueDate,
      followupDates: orderData.followupDates?.filter(Boolean) || [],
      source: orderData.source || null,
      priority: orderData.priority || "medium",
      description: orderData.description || null,
      shipTo: finalShipTo,

      shipping: Number(shipping) || 0,
      gst: Number(gst) || null,
      extraDiscount: Number(orderData.extraDiscount || 0),
      extraDiscountType: orderData.extraDiscountType || "fixed",

      products: enrichedProducts,
    };

    try {
      const result = await createOrder(orderPayload).unwrap();
      message.success(`Order #${result.orderNo} created successfully!`);

      if (typeof handleClearCart === "function") handleClearCart();
      navigate("/orders/list");
    } catch (err) {
      console.error("Create Order Error:", err);
      message.error(err?.data?.message || "Failed to create order.");
    }
  };

  return (
    <CartLayout>
      {(layoutProps) => (
        <OrderForm
          {...layoutProps}
          orderData={orderData}
          setOrderData={setOrderData}
          handleOrderChange={(key, value) =>
            setOrderData((prev) => ({ ...prev, [key]: value }))
          }
          selectedCustomer={selectedCustomer}
          setSelectedCustomer={setSelectedCustomer}
          customers={customers}
          addresses={addresses}
          teams={teams}
          users={users}
          useBillingAddress={useBillingAddress}
          setUseBillingAddress={setUseBillingAddress}
          setBillingAddressId={setBillingAddressId}
          handleAddCustomer={() => {}}
          handleAddAddress={() => {}}
          handleCreateDocument={handleCreateOrder}
          cartItems={layoutProps.calculationCartItems || []}
          itemDiscounts={layoutProps.itemDiscounts}
          itemDiscountTypes={layoutProps.itemDiscountTypes}
          itemTaxes={layoutProps.itemTaxes}
        />
      )}
    </CartLayout>
  );
};

export default NewOrder;
