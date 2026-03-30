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

    if (!selectedCustomer) return message.error("Please select a customer.");
    if (calculationCartItems.length === 0)
      return message.error("Cart is empty.");

    // Shipping Address - OPTIONAL
    let finalShipTo = quotationData.shipTo;

    if (useBillingAddress) {
      if (billingAddressId) {
        finalShipTo = billingAddressId;
      } else {
        const customer = customers.find(
          (c) => c.customerId === selectedCustomer,
        );
        if (customer?.address) {
          try {
            const parsedAddr =
              typeof customer.address === "string"
                ? JSON.parse(customer.address)
                : customer.address;

            const payload = {
              customerId: selectedCustomer,
              street: parsedAddr.street || "",
              city: parsedAddr.city || "",
              state: parsedAddr.state || "",
              postalCode: parsedAddr.postalCode || parsedAddr.zip || "",
              country: "India",
              status: "SHIPPING",
            };

            const response = await createAddress(payload).unwrap();
            finalShipTo = response.addressId;
          } catch (err) {
            console.warn("Failed to auto-create shipping address:", err);
            // Continue without address (optional)
          }
        }
      }
    }

    // Clean floors
    const rawFloors = quotationData.floors || [];
    const cleanedFloors = rawFloors
      .map((floor) => ({
        ...floor,
        rooms: (floor.rooms || []).map((room) => ({
          ...room,
          areas: room.areas || [],
        })),
      }))
      .filter(
        (floor) =>
          (floor.rooms && floor.rooms.length > 0) ||
          calculationCartItems.some((item) => item.floorId === floor.floorId),
      );

    let finalFloors = cleanedFloors;

    if (finalFloors.length === 0) {
      const hasAssignments = calculationCartItems.some((item) =>
        Boolean(item.floorId),
      );
      if (hasAssignments) {
        finalFloors = buildFloorsFromProducts(calculationCartItems);
      }
    }

    // Enrich items
    const enrichedItems = calculationCartItems.map((item) => {
      const productId = item.productId || item.id;
      const price = Number(item.price) || 0;
      const qty = Number(item.quantity) || 1;
      const subtotal = price * qty;

      const discVal = Number(itemDiscounts[productId]) || 0;
      const discType = itemDiscountTypes[productId] || "percent";
      const discountAmount =
        discType === "percent" ? (subtotal * discVal) / 100 : discVal * qty;

      const itemTax = Number(itemTaxes[productId]) || 0;

      return {
        ...item,
        floorName: item.floorName || undefined,
        roomName: item.roomName || undefined,
        areaName: item.areaName || undefined,
        discount: discVal,
        discountType: discType,
        tax: itemTax,
        subtotal: Number(subtotal.toFixed(2)),
        discountAmount: Number(discountAmount.toFixed(2)),
        lineTotal: Number(
          (
            subtotal -
            discountAmount +
            ((subtotal - discountAmount) * itemTax) / 100
          ).toFixed(2),
        ),
      };
    });

    const quotationPayload = {
      quotationId: uuidv4(),
      document_title: `Quotation for ${customers.find((c) => c.customerId === selectedCustomer)?.name || "Customer"} - ${moment().format("DD-MM-YYYY")}`,

      quotation_date:
        quotationData.quotationDate || moment().format("YYYY-MM-DD"),
      due_date: quotationData.dueDate || null,

      customerId: selectedCustomer,
      shipTo: finalShipTo || null, // ← Now can be null

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
        `Quotation created successfully!${result.quotation?.reference_number ? ` Ref: ${result.quotation.reference_number}` : ""}`,
      );

      if (typeof handleClearCart === "function") handleClearCart();

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
