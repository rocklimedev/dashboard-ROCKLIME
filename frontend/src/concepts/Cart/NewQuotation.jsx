// src/pages/quotations/NewQuotation.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { message } from "antd";
import moment from "moment";
import { v4 as uuidv4 } from "uuid";

import CartLayout from "./CartLayout";
import QuotationForm from "./QuotationForm";
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

const NewQuotation = () => {
  const navigate = useNavigate();
  const { auth } = useAuth();

  const [createQuotation] = useCreateQuotationMutation();
  const [createAddress] = useCreateAddressMutation();

  // ── Quotation Specific State ─────────────────────────────────
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

  // ── Queries ──────────────────────────────────────────────────
  const { data: customersData } = useGetCustomersQuery({ limit: 500 });
  const { data: addressesData, refetch: refetchAddresses } =
    useGetAllAddressesQuery(selectedCustomer, {
      skip: !selectedCustomer,
    });

  const customers = customersData?.data || [];
  const addresses = addressesData || [];

  // ── Create Quotation Handler ─────────────────────────────────
  const handleCreateQuotation = async (layoutProps) => {
    const { localCartItems, shipping, gst } = layoutProps;

    if (!selectedCustomer) {
      return message.error("Please select a customer.");
    }
    if (localCartItems.length === 0) {
      return message.error("Cart is empty. Please add items.");
    }
    if (!quotationData.dueDate) {
      return message.error("Please select a valid due date (YYYY-MM-DD).");
    }
    if (moment(quotationData.dueDate).isBefore(moment(), "day")) {
      return message.error("Due date cannot be in the past.");
    }

    // Shipping Address Logic
    let finalShipTo = null;

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
          message.success("Shipping address created from default.");
        } catch (apiError) {
          return message.error(
            apiError?.data?.message || "Failed to create shipping address.",
          );
        }
      }
    } else {
      finalShipTo = quotationData.shipTo;
      if (finalShipTo) {
        const addr = addresses.find((a) => a.addressId === finalShipTo);
        if (!addr) {
          return message.error("Selected shipping address was deleted.");
        }
      }
    }

    if (!finalShipTo) {
      return message.error("Please select or create a shipping address.");
    }

    // Prepare Items
    const safeItems = localCartItems.map((item) => ({
      ...item,
      floorId: item.floorId || null,
      floorName: item.floorName || null,
      roomId: item.roomId || null,
      roomName: item.roomName || null,
      areaId: item.areaId || null,
      areaName: item.areaName || null,
    }));

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
      floors: quotationData.floors || [],
      products: safeItems,
      followupDates: quotationData.followupDates?.filter(Boolean) || [],
      createdBy: auth?.userId,
    };

    try {
      const result = await createQuotation(quotationPayload).unwrap();
      message.success(
        `Quotation ${result.quotation?.reference_number} created!`,
      );
      navigate("/quotations/list");
    } catch (err) {
      message.error(err?.data?.message || "Failed to create quotation.");
    }
  };

  // Modal Handlers
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
      <CartLayout documentType="Quotation">
        {(layoutProps) => (
          <>
            <QuotationForm
              {...layoutProps}
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
              handleCreateDocument={() => handleCreateQuotation(layoutProps)}
              handleAssignItem={layoutProps.handleAssignItemToLocation}
            />

            {/* PreviewQuotation - Now fully connected with layoutProps */}
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

      {/* Global Modals */}
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
