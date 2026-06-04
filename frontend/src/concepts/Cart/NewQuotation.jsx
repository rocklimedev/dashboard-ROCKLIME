// src/pages/quotations/NewQuotation.jsx
import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { message, Button, Modal, Descriptions, Typography, Space } from "antd";
import {
  DeleteOutlined,
  SaveOutlined,
  InfoCircleOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import moment from "moment";
import { v4 as uuidv4 } from "uuid";

import CreateProductModal from "../../components/modals/CreateProductModal";
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
import useAutoSave from "../../utils/useAutoSave";

const { Text } = Typography;

const buildFloorsFromProducts = (products) => {
  const floorMap = new Map();

  products.forEach((item) => {
    if (!item?.floorId) return;

    if (!floorMap.has(item.floorId)) {
      floorMap.set(item.floorId, {
        floorId: item.floorId,
        floorName: item.floorName || `Floor ${item.floorId}`,
        sortOrder: Number(item.floorSortOrder ?? floorMap.size),
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
          sortOrder: Number(item.roomSortOrder ?? floor.rooms.length),
          type: item.roomType || "other",
          areas: [],
        };
        floor.rooms.push(room);
      }

      if (item.areaId) {
        const exists = room.areas.some((a) => a.id === item.areaId);
        if (!exists) {
          room.areas.push({
            id: item.areaId,
            name: item.areaName || "Area",
            value: item.areaValue || "",
            sortOrder: Number(item.areaSortOrder ?? room.areas.length),
          });
        }
      }
    }
  });

  return Array.from(floorMap.values())
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((floor) => ({
      ...floor,
      rooms: floor.rooms
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((room) => ({
          ...room,
          areas: room.areas.sort(
            (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0),
          ),
        })),
    }));
};

const NewQuotation = () => {
  const navigate = useNavigate();
  const { auth } = useAuth();

  const [createQuotation] = useCreateQuotationMutation();
  const [createAddress] = useCreateAddressMutation();

  // ==================== MODAL STATES ====================
  const [showCreateProductModal, setShowCreateProductModal] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [showAddAddressModal, setShowAddAddressModal] = useState(false);
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [showDraftModal, setShowDraftModal] = useState(false);
  const [currentDraft, setCurrentDraft] = useState(null);

  // ==================== MAIN STATE ====================
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

  // ==================== DATA FETCHING ====================
  const { data: customersData } = useGetCustomersQuery({ limit: 500 });
  const { data: addressesData, refetch: refetchAddresses } =
    useGetAllAddressesQuery(selectedCustomer || undefined, {
      skip: !selectedCustomer,
    });

  const customers = customersData?.data || [];
  const addresses = addressesData || [];

  // ==================== AUTOSAVE ====================
  const draftKey = `draft_quotation_${auth?.userId || "guest"}`;

  const draftData = useMemo(
    () => ({
      quotationData,
      selectedCustomer,
      useBillingAddress,
      billingAddressId,
      lastSaved: new Date().toISOString(),
    }),
    [quotationData, selectedCustomer, useBillingAddress, billingAddressId],
  );

  const { loadDraft, clearDraft } = useAutoSave(draftKey, draftData, 2500);

  // Load draft
  useEffect(() => {
    const savedDraft = loadDraft();
    if (savedDraft) {
      if (savedDraft.quotationData) {
        setQuotationData((prev) => ({ ...prev, ...savedDraft.quotationData }));
      }
      if (savedDraft.selectedCustomer) {
        setSelectedCustomer(savedDraft.selectedCustomer);
      }
      if (savedDraft.useBillingAddress !== undefined) {
        setUseBillingAddress(savedDraft.useBillingAddress);
      }
      if (savedDraft.billingAddressId) {
        setBillingAddressId(savedDraft.billingAddressId);
      }

      message.info("Previous draft has been restored", 2);
    }
  }, [loadDraft]);

  // ==================== DRAFT HANDLERS ====================
  const checkCurrentDraft = () => {
    const saved = loadDraft();
    if (saved) {
      setCurrentDraft(saved);
      setShowDraftModal(true);
    } else {
      message.info("No saved draft found.");
    }
  };

  const handleDeleteDraft = () => {
    clearDraft();
    setShowDraftModal(false);
    setCurrentDraft(null);
    message.success("Draft deleted successfully");
  };

  // ==================== CREATE QUOTATION ====================
  const handleCreateQuotation = async (layoutProps = {}) => {
    const {
      payloadCartItems = [],
      shipping = 0,
      gst = 0,
      itemDiscounts = {},
      itemDiscountTypes = {},
      itemTaxes = {},
      handleClearCart,
    } = layoutProps;

    if (!selectedCustomer) return message.error("Please select a customer.");
    if (payloadCartItems.length === 0) return message.error("Cart is empty.");

    // Shipping Address Logic
    let finalShipTo = quotationData.shipTo;
    if (useBillingAddress && billingAddressId) {
      finalShipTo = billingAddressId;
    }

    // Floors
    let finalFloors = quotationData.floors || [];
    if (finalFloors.length === 0) {
      const hasLocation = payloadCartItems.some(
        (item) => item.floorId || item.roomId || item.areaId,
      );
      if (hasLocation) finalFloors = buildFloorsFromProducts(payloadCartItems);
    }

    // Enrich Items for Payload
    const enrichedItems = payloadCartItems.map((item, index) => {
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
        priority: Number(item.priority ?? index), // ← FORCE HERE
        discount: discVal,
        discountType: discType,
        tax: itemTax,
        subtotal: Number(subtotal.toFixed(2)),
        discountAmount: Number(discountAmount.toFixed(2)),
        lineTotal: Number(
          subtotal -
            discountAmount +
            ((subtotal - discountAmount) * itemTax) / 100,
        ).toFixed(2),

        isOption: Boolean(item.isOption) || Boolean(item.isOptionFor),
        parentProductId: item.parentProductId || null,
        optionType: item.optionType || null,
      };
    });

    const quotationPayload = {
      quotationId: uuidv4(),
      document_title: `${
        customers.find((c) => c.customerId === selectedCustomer)?.name ||
        "Customer"
      } - ${moment().format("DD-MM-YYYY")}`,

      quotation_date:
        quotationData.quotationDate || moment().format("YYYY-MM-DD"),
      due_date: quotationData.dueDate || null,

      customerId: selectedCustomer,
      shipTo: finalShipTo || null,

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
        `Quotation created successfully!${
          result.quotation?.reference_number
            ? ` Ref: ${result.quotation.reference_number}`
            : ""
        }`,
      );

      clearDraft();
      if (typeof handleClearCart === "function") handleClearCart();
      navigate("/quotations/list");
    } catch (err) {
      message.error(err?.data?.message || "Failed to create quotation.");
    }
  };

  // ==================== OTHER HANDLERS ====================
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

  const handleProductCreated = (newProduct) => {
    message.success(`Product "${newProduct.name}" created successfully!`);
  };

  return (
    <>
      <CartLayout>
        {(layoutProps) => (
          <>
            {/* Header Buttons */}
            <div style={{ marginBottom: 16, textAlign: "right" }}>
              <Space>
                <Button
                  icon={<PlusOutlined />}
                  onClick={() => setShowCreateProductModal(true)}
                  type="primary"
                >
                  Add Optional Product
                </Button>

                <Button
                  icon={<InfoCircleOutlined />}
                  onClick={checkCurrentDraft}
                  type="default"
                >
                  Manage Draft
                </Button>
              </Space>
            </div>

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
              handleCreateDocument={handleCreateQuotation}
              handleAssignItem={layoutProps.handleAssignItemToLocation}
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
              quotationData={quotationData}
              itemDiscounts={layoutProps.itemDiscounts}
              itemDiscountTypes={layoutProps.itemDiscountTypes}
              itemTaxes={layoutProps.itemTaxes}
              gstRate={layoutProps.gst}
              includeGst
            />
          </>
        )}
      </CartLayout>

      {/* Modals */}
      <CreateProductModal
        open={showCreateProductModal}
        onClose={() => setShowCreateProductModal(false)}
        onSuccess={handleProductCreated}
      />

      <Modal
        title="Draft Information"
        open={showDraftModal}
        onCancel={() => setShowDraftModal(false)}
        footer={[
          <Button key="close" onClick={() => setShowDraftModal(false)}>
            Close
          </Button>,
          <Button
            key="delete"
            danger
            icon={<DeleteOutlined />}
            onClick={handleDeleteDraft}
          >
            Delete Draft
          </Button>,
        ]}
      >
        {currentDraft && (
          <Descriptions column={1} bordered>
            <Descriptions.Item label="Customer">
              {customers.find(
                (c) => c.customerId === currentDraft.selectedCustomer,
              )?.name || "Not selected"}
            </Descriptions.Item>
            <Descriptions.Item label="Quotation Date">
              {currentDraft.quotationData?.quotationDate || "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Last Saved">
              {moment(currentDraft.lastSaved).fromNow()}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>

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
          onSave={handleCustomerSave}
        />
      )}
    </>
  );
};

export default NewQuotation;
