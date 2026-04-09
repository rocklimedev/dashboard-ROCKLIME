// src/pages/quotations/NewPurchaseOrder.jsx
import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { message, Button, Modal, Descriptions, Space } from "antd";
import { DeleteOutlined, SaveOutlined, InfoCircleOutlined } from "@ant-design/icons";
import moment from "moment";

import CartLayout from "./CartLayout";
import PurchaseOrderForm from "../../components/POS-NEW/PurchaseOrderForm";

import { useCreatePurchaseOrderMutation } from "../../api/poApi";
import { useGetVendorsQuery } from "../../api/vendorApi";
import { useClearCartMutation } from "../../api/cartApi";

import { useAuth } from "../../context/AuthContext";
import useAutoSave from "../../utils/useAutoSave";

const NewPurchaseOrder = () => {
  const navigate = useNavigate();
  const { auth } = useAuth();

  const [createPurchaseOrder] = useCreatePurchaseOrderMutation();
  const [clearCart] = useClearCartMutation();

  // ==================== PURCHASE ORDER STATE ====================
  const [purchaseOrderData, setPurchaseOrderData] = useState({
    vendorId: "",
    orderDate: moment().format("YYYY-MM-DD"),
    expectDeliveryDate: null,
    items: [],
    totalAmount: 0,
    notes: "",
  });

  const [selectedVendor, setSelectedVendor] = useState("");

  // ==================== DRAFT CHECKER STATE ====================
  const [showDraftModal, setShowDraftModal] = useState(false);
  const [currentDraft, setCurrentDraft] = useState(null);

  // ==================== DATA FETCHING ====================
  const { data: vendorsData, isLoading: isVendorsLoading } =
    useGetVendorsQuery();

  const vendors = vendorsData || [];

  // ==================== AUTOSAVE SETUP ====================
  const draftKey = `draft_purchaseorder_${auth?.userId || "guest"}`;

  const draftData = useMemo(() => ({
    purchaseOrderData,
    selectedVendor,
    lastSaved: new Date().toISOString(),
  }), [purchaseOrderData, selectedVendor]);

  const { loadDraft, clearDraft } = useAutoSave(draftKey, draftData, 2500);

  // Load saved draft on mount
  useEffect(() => {
    const savedDraft = loadDraft();
    if (savedDraft) {
      if (savedDraft.purchaseOrderData) {
        setPurchaseOrderData((prev) => ({
          ...prev,
          ...savedDraft.purchaseOrderData,
        }));
      }
      if (savedDraft.selectedVendor) {
        setSelectedVendor(savedDraft.selectedVendor);
      }

      message.info("Previous Purchase Order draft has been restored", 2);
    }
  }, [loadDraft]);

  // ==================== DRAFT CHECKER FUNCTIONS ====================
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
    message.success("Draft has been deleted successfully");
  };

  // ==================== CREATE PURCHASE ORDER ====================
  const handleCreatePurchaseOrder = async (layoutProps) => {
    if (!selectedVendor) {
      return message.error("Please select a vendor.");
    }

    if (!layoutProps?.calculationCartItems || layoutProps.calculationCartItems.length === 0) {
      return message.error("Cart is empty. Please add items.");
    }

    const formattedItems = layoutProps.calculationCartItems.map((item) => ({
      productId: item.productId || item.id,
      quantity: Number(item.quantity) || 1,
      unitPrice: Number(item.price || item.mrp) || 0.01,
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
      notes: purchaseOrderData.notes || "",
    };

    try {
      const result = await createPurchaseOrder(payload).unwrap();

      message.success(
        `Purchase Order ${result.purchaseOrder?.poNumber || ""} created successfully!`
      );

      // Clear draft and cart after successful creation
      clearDraft();

      if (layoutProps?.userId) {
        try {
          await clearCart({ userId: layoutProps.userId }).unwrap();
        } catch (clearErr) {
          console.error("Failed to clear cart after PO creation:", clearErr);
        }
      }

      // Reset local state
      setPurchaseOrderData({
        vendorId: "",
        orderDate: moment().format("YYYY-MM-DD"),
        expectDeliveryDate: null,
        items: [],
        totalAmount: 0,
        notes: "",
      });
      setSelectedVendor("");

      // Redirect after showing success message
      setTimeout(() => {
        navigate("/purchase-manager");
      }, 1500);
    } catch (err) {
      console.error("Create Purchase Order Error:", err);
      message.error(err?.data?.message || "Failed to create Purchase Order.");
    }
  };

  return (
    <>
      <CartLayout>
        {(layoutProps) => (
          <>
            {/* Manage Draft Button */}
            <div style={{ marginBottom: 16, textAlign: "right" }}>
              <Button
                icon={<InfoCircleOutlined />}
                onClick={checkCurrentDraft}
                type="default"
              >
                Manage Draft
              </Button>
            </div>

            <PurchaseOrderForm
              purchaseOrderData={purchaseOrderData}
              setPurchaseOrderData={setPurchaseOrderData}
              selectedVendor={selectedVendor}
              setSelectedVendor={setSelectedVendor}
              vendors={vendors}
              isVendorsLoading={isVendorsLoading}
              cartItems={layoutProps.localCartItems}
              calculationCartItems={layoutProps.calculationCartItems}
              setActiveTab={layoutProps.setActiveTab}
              handleCreateDocument={() => handleCreatePurchaseOrder(layoutProps)}
              userId={layoutProps.userId}
              subTotal={layoutProps.subTotal}
              totalAmount={layoutProps.totalAmount}
            />
          </>
        )}
      </CartLayout>

      {/* Draft Info Modal */}
      <Modal
        title={
          <Space>
            <SaveOutlined />
            Purchase Order Draft Information
          </Space>
        }
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
        {currentDraft ? (
          <Descriptions column={1} bordered>
            <Descriptions.Item label="Vendor">
              {vendors.find((v) => v.vendorId === currentDraft.selectedVendor)?.name || 
               currentDraft.selectedVendor || "Not selected"}
            </Descriptions.Item>
            <Descriptions.Item label="Order Date">
              {currentDraft.purchaseOrderData?.orderDate || "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Expected Delivery">
              {currentDraft.purchaseOrderData?.expectDeliveryDate || "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Notes">
              {currentDraft.purchaseOrderData?.notes || "No notes"}
            </Descriptions.Item>
            <Descriptions.Item label="Last Saved">
              {currentDraft.lastSaved
                ? moment(currentDraft.lastSaved).fromNow()
                : "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Status">
              <span style={{ color: "#52c41a" }}>✓ Draft Saved Automatically</span>
            </Descriptions.Item>
          </Descriptions>
        ) : (
          <p>No draft data available.</p>
        )}
      </Modal>
    </>
  );
};

export default NewPurchaseOrder;