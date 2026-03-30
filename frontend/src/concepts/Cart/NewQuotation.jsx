// src/pages/quotations/NewQuotation.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { message } from "antd";
import moment from "moment";
import { v4 as uuidv4 } from "uuid";
import { useOutletContext } from "react-router-dom";
import CartLayout from "./CartLayout";
import QuotationForm from "../../components/POS-NEW/QuotationForm";
import PreviewQuotation from "../../components/Quotation/PreviewQuotation";
import AddAddress from "../../components/Address/AddAddressModal";
import AddCustomerModal from "../../components/Customers/AddCustomerModal";

import { useCreateQuotationMutation } from "../../api/quotationApi";
import { useGetCustomersQuery } from "../../api/customerApi";
import {
  useGetAllAddressesQuery,
  useCreateAddressMutation,
} from "../../api/addressApi";
import { useAuth } from "../../context/AuthContext";

const buildFloorsFromProducts = (products) => {
  const floorMap = new Map();

  products.forEach((item) => {
    if (!item?.floorId) return;

    if (!floorMap.has(item.floorId)) {
      floorMap.set(item.floorId, {
        floorId: item.floorId,
        floorName: item.floorName || `Floor ${item.floorId}`, // fallback
        sortOrder: floorMap.size,
        rooms: [],
      });
    }

    const floor = floorMap.get(item.floorId);

    if (item.roomId) {
      let room = floor.rooms.find((r) => r.roomId === item.roomId);
      if (!room) {
        room = {
          roomId: item.roomId,
          roomName: item.roomName || "Unnamed Room",
          sortOrder: floor.rooms.length,
          type: item.roomType || "other",
          areas: [],
        };
        floor.rooms.push(room);
      }

      if (item.areaId) {
        if (!room.areas.some((a) => a.id === item.areaId)) {
          room.areas.push({
            id: item.areaId,
            name: item.areaName || "Area",
            value: item.areaValue || "",
          });
        }
      }
    }
  });

  return Array.from(floorMap.values());
};

const NewQuotation = () => {
  const navigate = useNavigate();
  const { auth } = useAuth();
  const commonProps = useOutletContext();
  const [createQuotation] = useCreateQuotationMutation();
  const [createAddress] = useCreateAddressMutation();

  const [quotationData, setQuotationData] = useState({
    quotationDate: new Date().toISOString().split("T")[0],
    dueDate: "",
    shipTo: null,
    floors: [],
    signatureName: "CM TRADING CO",
    signatureImage: "",
    discountType: "fixed",
    discountAmount: "",
    followupDates: [],
  });

  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [useBillingAddress, setUseBillingAddress] = useState(false);
  const [billingAddressId, setBillingAddressId] = useState(null);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [showAddAddressModal, setShowAddAddressModal] = useState(false);
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);

  const { data: customersData } = useGetCustomersQuery({ limit: 500 });
  const { data: addressesData, refetch: refetchAddresses } =
    useGetAllAddressesQuery(selectedCustomer || undefined, {
      skip: !selectedCustomer,
    });

  const customers = customersData?.data || [];
  const addresses = addressesData || [];

  const handleCreateQuotation = async (layoutProps = {}) => {
    const {
      calculationCartItems = [],
      shipping = 0,
      gst = 0,
      itemDiscounts = {},
      itemDiscountTypes = {},
      itemTaxes = {},
      handleClearCart,
    } = layoutProps;

    // ==================== VALIDATIONS ====================
    if (!selectedCustomer) return message.error("Please select a customer.");

    if (calculationCartItems.length === 0)
      return message.error("Cart is empty.");

    if (!quotationData.dueDate)
      return message.error("Please select a valid due date.");

    if (moment(quotationData.dueDate).isBefore(moment(), "day")) {
      return message.error("Due date cannot be in the past.");
    }

    // ==================== SHIPPING ADDRESS LOGIC ====================
    let finalShipTo = quotationData.shipTo;

    if (useBillingAddress) {
      if (billingAddressId) {
        finalShipTo = billingAddressId;
      } else {
        const customer = customers.find(
          (c) => c.customerId === selectedCustomer,
        );
        if (!customer?.address) {
          return message.error(
            "Customer has no default address. Please add one first.",
          );
        }

        let parsedAddr;
        try {
          parsedAddr =
            typeof customer.address === "string"
              ? JSON.parse(customer.address)
              : customer.address;
        } catch {
          return message.error("Invalid default address format.");
        }

        const payload = {
          customerId: selectedCustomer,
          street: parsedAddr.street || "",
          city: parsedAddr.city || "",
          state: parsedAddr.state || "",
          postalCode: parsedAddr.zip || parsedAddr.postalCode || "",
          country: parsedAddr.country || "India",
          status: "SHIPPING",
        };

        try {
          const response = await createAddress(payload).unwrap();
          finalShipTo = response.addressId;
          message.success("Shipping address created successfully.");
        } catch (apiError) {
          return message.error(
            apiError?.data?.message || "Failed to create shipping address.",
          );
        }
      }
    }

    if (!finalShipTo) {
      return message.error("Please select or create a shipping address.");
    }

    // ==================== CLEAN FLOORS ====================
    const rawFloors = quotationData.floors || [];
    const cleanedFloors = rawFloors
      .map((floor) => ({
        ...floor,
        rooms: (floor.rooms || []).map((room) => ({
          ...room,
          areas: room.areas || [],
        })),
      }))
      .filter((floor) => {
        const hasRooms = floor.rooms && floor.rooms.length > 0;
        const hasAssignedItems = calculationCartItems.some(
          (item) => item.floorId === floor.floorId,
        );
        return hasRooms || hasAssignedItems;
      });

    let finalFloors = cleanedFloors;

    // Auto-build floors from assigned items if none exist
    if (finalFloors.length === 0) {
      const hasAnyAssignment = calculationCartItems.some((item) =>
        Boolean(item.floorId),
      );
      if (hasAnyAssignment) {
        finalFloors = buildFloorsFromProducts(calculationCartItems);
      }
    }

    // ==================== ENRICH ITEMS WITH DISCOUNTS & TAXES ====================
    const enrichedItems = calculationCartItems.map((item) => {
      const productId = item.productId || item.id;
      const price = Number(item.price) || 0;
      const qty = Number(item.quantity) || 1;
      const subtotal = price * qty;

      // Get item-level discount
      const discVal = Number(itemDiscounts[productId]) || 0;
      const discType = itemDiscountTypes[productId] || "percent";

      const discountAmount =
        discType === "percent" ? (subtotal * discVal) / 100 : discVal * qty;

      const itemTax = Number(itemTaxes[productId]) || 0;

      return {
        ...item,
        // Location names (preserve if already set)
        floorName: item.floorName || undefined,
        roomName: item.roomName || undefined,
        areaName: item.areaName || undefined,

        // IMPORTANT: Item-level discount & tax
        discount: discVal,
        discountType: discType,
        tax: itemTax,

        // Calculated values for backend
        subtotal: Number(subtotal.toFixed(2)),
        discountAmount: Number(discountAmount.toFixed(2)),

        // Optional: You can also send line total if backend needs it
        lineTotal: Number(
          (
            subtotal -
            discountAmount +
            ((subtotal - discountAmount) * itemTax) / 100
          ).toFixed(2),
        ),
      };
    });

    // ==================== FINAL PAYLOAD ====================
    const quotationPayload = {
      quotationId: uuidv4(),
      document_title: `Quotation for ${customers.find((c) => c.customerId === selectedCustomer)?.name || "Customer"} - ${moment().format("DD-MM-YYYY")}`,

      quotation_date:
        quotationData.quotationDate || moment().format("YYYY-MM-DD"),
      due_date: quotationData.dueDate,

      customerId: selectedCustomer,
      shipTo: finalShipTo,

      extraDiscount: Number(quotationData.discountAmount) || 0,
      extraDiscountType: quotationData.discountType || "fixed",

      shippingAmount: Number(shipping) || 0,
      gst: Number(gst) || 0,

      signature_name: quotationData.signatureName || "CM TRADING CO",
      signature_image: quotationData.signatureImage || "",

      floors: finalFloors,
      products: enrichedItems,

      followupDates: quotationData.followupDates?.filter(Boolean) || [],
      createdBy: auth?.userId,
    };

    try {
      const result = await createQuotation(quotationPayload).unwrap();

      message.success(
        `Quotation ${result.quotation?.reference_number || ""} created successfully!`,
      );

      // Clear cart after successful creation
      if (typeof handleClearCart === "function") {
        handleClearCart();
      }

      navigate("/quotations/list");
    } catch (err) {
      console.error("Create Quotation Error:", err);
      message.error(err?.data?.message || "Failed to create quotation.");
    }
  };

  const handleAddCustomer = () => setShowAddCustomerModal(true);
  const handleCustomerSave = (newCustomer) => {
    setSelectedCustomer(newCustomer.customerId || "");
    setShowAddCustomerModal(false);
    message.success("Customer created successfully");
  };

  const handleAddAddress = () => setShowAddAddressModal(true);

  const handleAddressSave = (addressId) => {
    setQuotationData((prev) => ({ ...prev, shipTo: addressId }));
    setShowAddAddressModal(false);
    refetchAddresses();
    message.success("Address added successfully");
  };

  return (
    <>
      <CartLayout>
        {(layoutProps) => (
          <>
            <QuotationForm
              {...layoutProps} // This already includes itemDiscounts, itemTaxes, etc.
              quotationData={quotationData}
              setQuotationData={setQuotationData}
              handleQuotationChange={(key, value) =>
                setQuotationData((prev) => ({ ...prev, [key]: value }))
              }
              selectedCustomer={selectedCustomer}
              setSelectedCustomer={setSelectedCustomer}
              customers={customers}
              addresses={addresses}
              useBillingAddress={useBillingAddress}
              setUseBillingAddress={setUseBillingAddress}
              setBillingAddressId={setBillingAddressId}
              previewVisible={previewVisible}
              setPreviewVisible={setPreviewVisible}
              handleAddCustomer={handleAddCustomer}
              handleAddAddress={handleAddAddress}
              handleCreateDocument={handleCreateQuotation}
              handleAssignItem={layoutProps.handleAssignItemToLocation}
              // Explicitly pass these for safety
              itemDiscounts={layoutProps.itemDiscounts}
              itemDiscountTypes={layoutProps.itemDiscountTypes}
              itemTaxes={layoutProps.itemTaxes}
              handleClearCart={layoutProps.handleClearCart}
            />

            <PreviewQuotation
              visible={previewVisible}
              onClose={() => setPreviewVisible(false)}
              cartItems={layoutProps.calculationCartItems}
              productsData={layoutProps.cartProductsData}
              customer={customers.find(
                (c) => c.customerId === selectedCustomer,
              )}
              address={addresses.find(
                (a) => a.addressId === quotationData.shipTo,
              )}
              quotationData={{ ...quotationData }}
              itemDiscounts={layoutProps.itemDiscounts}
              itemDiscountTypes={layoutProps.itemDiscountTypes}
              itemTaxes={layoutProps.itemTaxes}
              gstRate={layoutProps.gst}
              includeGst
            />
          </>
        )}
      </CartLayout>

      {showAddAddressModal && (
        <AddAddress
          visible={true}
          onClose={() => setShowAddAddressModal(false)}
          onSave={handleAddressSave}
          selectedCustomer={selectedCustomer}
        />
      )}

      {showAddCustomerModal && (
        <AddCustomerModal
          visible={showAddCustomerModal}
          onClose={() => setShowAddCustomerModal(false)}
          customer={null}
          onSave={handleCustomerSave}
        />
      )}
    </>
  );
};

export default NewQuotation;
