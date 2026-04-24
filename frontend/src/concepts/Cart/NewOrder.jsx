// src/pages/quotations/NewOrder.jsx
import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { message, Button, Modal, Descriptions, Space } from "antd";
import {
  DeleteOutlined,
  SaveOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
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
import useAutoSave from "../../utils/useAutoSave";
import AddCustomerModal from "../../components/Customers/AddCustomerModal";
const NewOrder = () => {
  const navigate = useNavigate();
  const { auth } = useAuth();

  const [createOrder] = useCreateOrderMutation();
  const [createAddress] = useCreateAddressMutation();

  // ==================== ORDER STATE ====================
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

  // ==================== ADD CUSTOMER MODAL STATE ====================
  const [addCustomerModalVisible, setAddCustomerModalVisible] = useState(false);

  // ==================== DRAFT CHECKER STATE ====================
  const [showDraftModal, setShowDraftModal] = useState(false);
  const [currentDraft, setCurrentDraft] = useState(null);

  // ==================== QUERIES ====================
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

  // Set createdBy when userId is available
  useEffect(() => {
    if (userId) {
      setOrderData((prev) => ({ ...prev, createdBy: userId }));
    }
  }, [userId]);

  // ==================== AUTOSAVE SETUP ====================
  const draftKey = `draft_order_${auth?.userId || "guest"}`;

  const draftData = useMemo(
    () => ({
      orderData,
      selectedCustomer,
      useBillingAddress,
      billingAddressId,
      lastSaved: new Date().toISOString(),
    }),
    [orderData, selectedCustomer, useBillingAddress, billingAddressId],
  );

  const { loadDraft, clearDraft } = useAutoSave(draftKey, draftData, 2500);

  // Load draft on component mount
  useEffect(() => {
    const savedDraft = loadDraft();
    if (savedDraft) {
      if (savedDraft.orderData) {
        setOrderData((prev) => ({ ...prev, ...savedDraft.orderData }));
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

      message.info("Previous Order draft has been restored", 2);
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

  // ==================== CREATE ORDER ====================
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

    // Shipping Address Logic
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

    // Enrich products with discount and tax info
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

      const total = Number(
        (
          subtotal -
          discountAmount +
          ((subtotal - discountAmount) * tax) / 100
        ).toFixed(2),
      );

      return {
        id: productId,
        name: item.name || "Unknown Product",
        imageUrl: item.imageUrl || "",
        productCode: item.productCode || "",
        companyCode: item.companyCode || "",
        quantity,
        price: Number(price.toFixed(2)),
        discount: Number(discount.toFixed(2)),
        discountType,
        tax,
        total,
      };
    });

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

      message.success(`Order #${result.orderNo || ""} created successfully!`);

      // Clear draft and cart on success
      clearDraft();
      if (typeof handleClearCart === "function") handleClearCart();

      navigate("/orders/list");
    } catch (err) {
      console.error("Create Order Error:", err);
      message.error(err?.data?.message || "Failed to create order.");
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
              // ✅ Fixed: Proper handler to open Add Customer Modal
              handleAddCustomer={() => setAddCustomerModalVisible(true)}
              handleAddAddress={() => {}} // You can implement this later
              handleCreateDocument={handleCreateOrder}
              cartItems={layoutProps.calculationCartItems || []}
              itemDiscounts={layoutProps.itemDiscounts}
              itemDiscountTypes={layoutProps.itemDiscountTypes}
              itemTaxes={layoutProps.itemTaxes}
            />
          </>
        )}
      </CartLayout>

      {/* Draft Info Modal */}
      <Modal
        title={
          <Space>
            <SaveOutlined />
            Sales Order Draft Information
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
            <Descriptions.Item label="Customer">
              {customers.find(
                (c) => c.customerId === currentDraft.selectedCustomer,
              )?.name || "Not selected"}
            </Descriptions.Item>
            <Descriptions.Item label="Due Date">
              {currentDraft.orderData?.dueDate || "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Priority">
              {currentDraft.orderData?.priority || "medium"}
            </Descriptions.Item>
            <Descriptions.Item label="Status">
              {currentDraft.orderData?.status || "PREPARING"}
            </Descriptions.Item>
            <Descriptions.Item label="Last Saved">
              {currentDraft.lastSaved
                ? moment(currentDraft.lastSaved).fromNow()
                : "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Status">
              <span style={{ color: "#52c41a" }}>
                ✓ Draft Saved Automatically
              </span>
            </Descriptions.Item>
          </Descriptions>
        ) : (
          <p>No draft data available.</p>
        )}
      </Modal>

      {/* Add Customer Modal */}
      <AddCustomerModal
        visible={addCustomerModalVisible}
        onClose={() => setAddCustomerModalVisible(false)}
      />
    </>
  );
};

export default NewOrder;
