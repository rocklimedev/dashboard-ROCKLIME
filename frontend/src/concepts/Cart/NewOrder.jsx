// src/pages/quotations/NewOrder.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { message } from "antd";
import moment from "moment";
import { v4 as uuidv4 } from "uuid";

import CartLayout from "./CartLayout";
import OrderForm from "../../components/POS-NEW/OrderForm";
import { useCreateOrderMutation } from "../../api/orderApi";
import { useGetCustomersQuery } from "../../api/customerApi";
import { useGetAllAddressesQuery } from "../../api/addressApi"; // Adjust import if needed
import { useGetAllTeamsQuery } from "../../api/teamApi";
import { useGetAllUsersQuery } from "../../api/userApi";
import { useGetProfileQuery } from "../../api/userApi";
import { useAuth } from "../../context/AuthContext";

const NewOrder = () => {
  const navigate = useNavigate();
  const { auth } = useAuth();

  const [createOrder] = useCreateOrderMutation();

  // ── Order Specific State ─────────────────────────────────────
  const [orderData, setOrderData] = useState({
    createdFor: "",
    createdBy: "",
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
    quotationId: "",
    masterPipelineNo: "",
    previousOrderNo: "",
    shipTo: "",
  });

  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [useBillingAddress, setUseBillingAddress] = useState(false);

  // ── Queries ─────────────────────────────────────────────────
  const { data: profileData } = useGetProfileQuery();
  const userId = profileData?.user?.userId || auth?.userId;

  const { data: customersData } = useGetCustomersQuery({ limit: 500 });
  const { data: addressesData, refetch: refetchAddresses } =
    useGetAllAddressesQuery(selectedCustomer, {
      skip: !selectedCustomer,
    });

  const { data: teamsData } = useGetAllTeamsQuery();
  const { data: usersData } = useGetAllUsersQuery();

  const customers = customersData?.data || [];
  const addresses = addressesData || [];
  const teams = teamsData?.teams || [];
  const users = usersData?.users || [];

  // Update createdBy when userId is available
  React.useEffect(() => {
    if (userId) {
      setOrderData((prev) => ({ ...prev, createdBy: userId }));
    }
  }, [userId]);

  // ── Create Order Handler ────────────────────────────────────
  const handleCreateOrder = async (layoutProps) => {
    const {
      localCartItems,
      subTotal,
      totalDiscount,
      tax,
      shipping = 0,
      gst = 0,
    } = layoutProps;

    if (!selectedCustomer) {
      return message.error("Please select a customer.");
    }

    if (!orderData.dueDate) {
      return message.error("Please select a due date.");
    }

    // Shipping Address Logic
    let finalShipTo = orderData.shipTo;

    if (useBillingAddress) {
      if (!finalShipTo) {
        // Create shipping address from customer's default address (reuse your logic)
        const customer = customers.find(
          (c) => c.customerId === selectedCustomer,
        );
        if (!customer?.address) {
          return message.error(
            "Customer has no default address. Please add one.",
          );
        }
        // ... (Add your address creation logic here or extract to a hook)
        message.error(
          "Shipping address creation from billing not fully implemented in this split.",
        );
        return;
      }
    } else if (!finalShipTo) {
      return message.error("Please select a shipping address.");
    }

    const safeItems = localCartItems.map((item) => ({
      ...item,
      floorId: item.floorId || null,
      floorName: item.floorName || null,
      roomId: item.roomId || null,
      roomName: item.roomName || null,
      areaId: item.areaId || null,
      areaName: item.areaName || null,
    }));

    // Calculate GST (your existing logic)
    const taxableBase = subTotal - totalDiscount + tax;
    const afterTaxAndShipping = taxableBase + shipping;
    const extraDiscValue =
      orderData.extraDiscountType === "percent"
        ? (afterTaxAndShipping * Number(orderData.extraDiscount || 0)) / 100
        : Number(orderData.extraDiscount || 0);

    const amountForGst =
      subTotal + shipping + tax - totalDiscount - extraDiscValue;
    const gstAmount = Math.round((amountForGst * gst) / 100);

    const orderPayload = {
      id: uuidv4(),
      createdFor: selectedCustomer,
      createdBy: userId,
      assignedTeamId: orderData.assignedTeamId || null,
      assignedUserId: orderData.assignedUserId || null,
      secondaryUserId: orderData.secondaryUserId || null,
      pipeline: orderData.pipeline || null,
      status: orderData.status || "PREPARING",
      gst: Number(gst),
      gstValue: Number(gstAmount),
      extraDiscount: Number(orderData.extraDiscount || 0),
      extraDiscountType: orderData.extraDiscountType || "percent",
      extraDiscountValue: Number(extraDiscValue.toFixed(2)),
      dueDate: orderData.dueDate,
      followupDates: orderData.followupDates?.filter(Boolean) || [],
      source: orderData.source || null,
      priority: orderData.priority || "medium",
      description: orderData.description || null,
      invoiceLink: null,
      quotationId: orderData.quotationId || null,
      masterPipelineNo: orderData.masterPipelineNo || null,
      previousOrderNo: orderData.previousOrderNo || null,
      shipTo: finalShipTo,
      floors: orderData.floors || [], // if you have floors in order
      products: safeItems,
    };

    try {
      const result = await createOrder(orderPayload).unwrap();
      message.success(
        `Order ${result.orderNo || result.id} created successfully!`,
      );
      navigate("/orders/list");
    } catch (err) {
      const msg =
        err?.data?.message || err?.data?.error || "Failed to create order.";
      message.error(msg);
    }
  };

  return (
    <CartLayout documentType="Order" onCreateDocument={handleCreateOrder}>
      {(layoutProps) => (
        <OrderForm
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
          shipping={layoutProps.shipping || 0} // if passed from layout
          onShippingChange={layoutProps.onShippingChange}
          documentType="Order"
          cartItems={layoutProps.localCartItems}
          totalAmount={layoutProps.totalAmount}
          tax={layoutProps.tax}
          totalDiscount={layoutProps.totalDiscount}
          extraDiscount={layoutProps.extraDiscount}
          extraDiscountType={orderData.extraDiscountType}
          roundOff={layoutProps.roundOff}
          subTotal={layoutProps.subTotal}
          handleAddCustomer={() => {
            /* Open AddCustomerModal if needed */
          }}
          handleAddAddress={() => {
            /* Open AddAddressModal if needed */
          }}
          setActiveTab={layoutProps.setActiveTab}
          handleCreateDocument={() => handleCreateOrder(layoutProps)}
          useBillingAddress={useBillingAddress}
          setUseBillingAddress={setUseBillingAddress}
        />
      )}
    </CartLayout>
  );
};

export default NewOrder;
