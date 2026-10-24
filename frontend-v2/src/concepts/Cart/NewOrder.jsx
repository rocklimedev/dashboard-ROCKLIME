import './NewOrder.styles.css';
// src/pages/quotations/NewOrder.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import moment from 'moment';

import CartLayout from './CartLayout';
import OrderForm from '../../components/POS-NEW/OrderForm';

import { useCreateOrderMutation } from '../../api/orderApi';
import { useGetCustomersQuery } from '../../api/customerApi';
import { useGetAllAddressesQuery, useCreateAddressMutation } from '../../api/addressApi';
import { useGetAllTeamsQuery } from '../../api/teamApi';
import { useGetAllUsersQuery } from '../../api/userApi';
import { useGetProfileQuery } from '../../api/userApi';

import { useAuth } from '../../context/AuthContext';
import CartWorkspace from './CartWorkspace';
import AddCustomerModal from '../../components/Customers/AddCustomerModal';
import CreditAlert from '../../components/Customers/CreditAlert';
const NewOrder = ({ workspace, active, onAction, busy }) => {
  const initial = active.snapshot?.parent || {};
  const navigate = useNavigate();
  const { auth } = useAuth();

  const [createOrder] = useCreateOrderMutation();
  const [createAddress] = useCreateAddressMutation();

  // ==================== ORDER STATE ====================
  const [orderData, setOrderData] = useState({
    createdFor: '',
    createdBy: '',
    assignedTeamId: '',
    assignedUserId: '',
    secondaryUserId: '',
    status: 'PREPARING',
    dueDate: moment().add(1, 'days').format('YYYY-MM-DD'),
    followupDates: [],
    source: '',
    priority: 'medium',
    description: '',
    shipTo: null,
    extraDiscount: 0,
    extraDiscountType: 'fixed',
    ...initial.orderData,
  });

  const [selectedCustomer, setSelectedCustomer] = useState(initial.selectedCustomer || '');
  const [useBillingAddress, setUseBillingAddress] = useState(initial.useBillingAddress || false);
  const [billingAddressId, setBillingAddressId] = useState(initial.billingAddressId || null);

  // ==================== ADD CUSTOMER MODAL STATE ====================
  const [addCustomerModalVisible, setAddCustomerModalVisible] = useState(false);

  // ==================== DRAFT CHECKER STATE ====================

  // ==================== QUERIES ====================
  const { data: profileData } = useGetProfileQuery();
  const userId = profileData?.user?.userId || auth?.user?.userId;

  const { data: customersData } = useGetCustomersQuery({ limit: 10000 });
  const { data: addressesData } = useGetAllAddressesQuery(selectedCustomer || undefined, {
    skip: !selectedCustomer,
  });

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

  const draftData = useMemo(
    () => ({ orderData, selectedCustomer, useBillingAddress, billingAddressId }),
    [orderData, selectedCustomer, useBillingAddress, billingAddressId],
  );

  // ==================== CREATE ORDER ====================
  const handleCreateOrder = async (layoutProps = {}) => {
    const {
      calculationCartItems = [],
      shipping = 0,
      gst = 0,
      itemDiscounts = {},
      itemDiscountTypes = {},
      itemTaxes = {},
    } = layoutProps;

    if (!selectedCustomer) return toast.error('Please select a customer.');
    if (calculationCartItems.length === 0) return toast.error('Cart is empty.');
    if (!orderData.dueDate) return toast.error('Please select a due date.');

    // Shipping Address Logic
    let finalShipTo = orderData.shipTo;

    if (useBillingAddress && !billingAddressId) {
      const customer = customers.find((c) => c.customerId === selectedCustomer);
      if (!customer?.address) return toast.error('Customer has no default address.');

      let parsedAddr;
      try {
        parsedAddr =
          typeof customer.address === 'string' ? JSON.parse(customer.address) : customer.address;
      } catch {
        return toast.error('Invalid address format.');
      }

      try {
        const res = await createAddress({
          customerId: selectedCustomer,
          street: parsedAddr.street || '',
          city: parsedAddr.city || '',
          state: parsedAddr.state || '',
          postalCode: parsedAddr.postalCode || parsedAddr.zip || '',
          country: 'India',
          status: 'SHIPPING',
        }).unwrap();
        finalShipTo = res.addressId;
      } catch (e) {
        return toast.error(e?.data?.message || 'Failed to create shipping address.');
      }
    }

    if (!finalShipTo) return toast.error('Shipping address is required.');

    // Enrich products with discount and tax info
    // Replace the enrichedProducts map with this improved version
    const enrichedProducts = calculationCartItems.map((item) => {
      const productId = item.productId || item.id;
      const price = Number(item.price) || 0;
      const quantity = Number(item.quantity) || 1;
      const discount = Number(itemDiscounts[productId]) || 0;
      const discountType = itemDiscountTypes[productId] || 'percent';
      const tax = Number(itemTaxes[productId]) || 0;

      const subtotal = price * quantity;
      const discountAmount =
        discountType === 'percent' ? (subtotal * discount) / 100 : discount * quantity;

      const total = Number(
        (subtotal - discountAmount + ((subtotal - discountAmount) * tax) / 100).toFixed(2),
      );

      return {
        // Use "productId" consistently (better than "id")
        productId: productId,
        name: item.name || 'Unknown Product',
        imageUrl: item.imageUrl || item.images?.[0] || '', // ← Extra safety
        productCode: item.productCode || '',
        companyCode: item.companyCode || '',
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
      status: orderData.status || 'PREPARING',
      dueDate: orderData.dueDate,
      followupDates: orderData.followupDates?.filter(Boolean) || [],
      source: orderData.source || null,
      priority: orderData.priority || 'medium',
      description: orderData.description || null,
      shipTo: finalShipTo,

      shipping: Number(shipping) || 0,
      gst: Number(gst) || null,
      extraDiscount: Number(orderData.extraDiscount || 0),
      extraDiscountType: orderData.extraDiscountType || 'fixed',

      products: enrichedProducts,
    };

    try {
      const result = await createOrder(orderPayload).unwrap();

      toast.success(`Order #${result.orderNo || ''} created successfully!`);

      // Clear draft and cart on success
      try {
        await onAction('complete', undefined, workspace.activeId, {
          claimedProductIds: orderPayload.products.map((item) => item.productId || item.id),
        });
      } catch {
        toast.warning(
          'Order created, but its cart could not be removed. Refresh before reusing this draft.',
        );
      }

      navigate('/orders/list');
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to create order.');
    }
  };

  return (
    <>
      <fieldset className="fv2-neworder-b5185a27e2" disabled={busy}>
        <CartLayout
          draftWorkspace={{ workspace, active, onAction, busy, parent: draftData, customers }}
        >
          {(layoutProps) => (
            <>
              <CreditAlert
                className="fv2-neworder-56d5b8b454"
                customerId={selectedCustomer}
                amount={layoutProps.totalAmount}
              />

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
      </fieldset>

      {/* Add Customer Modal */}
      <AddCustomerModal
        visible={addCustomerModalVisible}
        onClose={() => setAddCustomerModalVisible(false)}
      />
    </>
  );
};

export default function MultipleOrderCarts() {
  return (
    <CartWorkspace documentType="order">
      {(props) => <NewOrder key={props.workspace.activeId} {...props} />}
    </CartWorkspace>
  );
}
