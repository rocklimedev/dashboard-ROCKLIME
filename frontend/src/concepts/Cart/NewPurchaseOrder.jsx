// src/pages/quotations/NewPurchaseOrder.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { message } from "antd";
import moment from "moment";

import CartLayout from "./CartLayout";
import PurchaseOrderForm from "../../components/POS-NEW/PurchaseOrderForm";
import { useCreatePurchaseOrderMutation } from "../../api/poApi";
import { useGetVendorsQuery } from "../../api/vendorApi";
import { useClearCartMutation } from "../../api/cartApi"; // ← Add this

const NewPurchaseOrder = () => {
  const navigate = useNavigate();
  const [createPurchaseOrder] = useCreatePurchaseOrderMutation();
  const [clearCart] = useClearCartMutation(); // ← Add this

  // Purchase Order Specific State
  const [purchaseOrderData, setPurchaseOrderData] = useState({
    vendorId: "",
    orderDate: moment().format("YYYY-MM-DD"),
    expectDeliveryDate: null,
    items: [],
    totalAmount: 0,
  });

  const [selectedVendor, setSelectedVendor] = useState("");

  // Queries
  const { data: vendorsData, isLoading: isVendorsLoading } =
    useGetVendorsQuery();
  const vendors = vendorsData || [];

  const handleCreatePurchaseOrder = async (layoutProps) => {
    if (!selectedVendor) {
      return message.error("Please select a vendor.");
    }

    if (purchaseOrderData.items.length === 0) {
      return message.error(
        "Please add at least one item to the Purchase Order.",
      );
    }

    const formattedItems = purchaseOrderData.items.map((item) => ({
      productId: item.productId,
      quantity: Number(item.quantity) || 1,
      unitPrice: Number(item.unitPrice || item.mrp || item.price) || 0.01,
      mrp: Number(item.mrp || item.price) || 0.01,
      tax: Number(item.tax) || 0,
      discount: Number(item.discount) || 0,
      discountType: item.discountType || "percent",
    }));

    const payload = {
      vendorId: selectedVendor,
      items: formattedItems,
      expectDeliveryDate: purchaseOrderData.expectDeliveryDate
        ? moment(purchaseOrderData.expectDeliveryDate).format("YYYY-MM-DD")
        : null,
    };

    try {
      const result = await createPurchaseOrder(payload).unwrap();

      message.success(
        `Purchase Order ${result.purchaseOrder?.poNumber} created successfully!`,
      );

      // === CLEAR CART AFTER SUCCESS ===
      if (layoutProps?.userId) {
        try {
          await clearCart({ userId: layoutProps.userId }).unwrap();
          message.info("Cart has been cleared.");
        } catch (clearErr) {
          console.error("Failed to clear cart:", clearErr);
          // Don't block success message even if clear fails
        }
      }

      // Reset local PO state
      setPurchaseOrderData({
        vendorId: "",
        orderDate: moment().format("YYYY-MM-DD"),
        expectDeliveryDate: null,
        items: [],
        totalAmount: 0,
      });
      setSelectedVendor("");

      // Redirect after short delay so user can see success message
      setTimeout(() => {
        navigate("/purchase-manager");
      }, 1200);
    } catch (err) {
      message.error(err?.data?.message || "Failed to create Purchase Order.");
    }
  };

  return (
    <CartLayout>
      {(layoutProps) => (
        <PurchaseOrderForm
          purchaseOrderData={purchaseOrderData}
          setPurchaseOrderData={setPurchaseOrderData}
          selectedVendor={selectedVendor}
          setSelectedVendor={setSelectedVendor}
          vendors={vendors}
          isVendorsLoading={isVendorsLoading}
          cartItems={layoutProps.localCartItems}
          setActiveTab={layoutProps.setActiveTab}
          handleCreateDocument={() => handleCreatePurchaseOrder(layoutProps)}
          userId={layoutProps.userId} // ← Pass userId if needed
        />
      )}
    </CartLayout>
  );
};

export default NewPurchaseOrder;
