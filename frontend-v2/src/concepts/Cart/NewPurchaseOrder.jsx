import './NewPurchaseOrder.styles.css';
// src/pages/quotations/NewPurchaseOrder.jsx
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import moment from 'moment';

import CartLayout from './CartLayout';
import PurchaseOrderForm from '../../components/POS-NEW/PurchaseOrderForm';

import { useCreatePurchaseOrderMutation } from '../../api/poApi';
import { useGetVendorsQuery } from '../../api/vendorApi';

import { useAuth } from '../../context/AuthContext';
import CartWorkspace from './CartWorkspace';

const NewPurchaseOrder = ({ workspace, active, onAction, busy }) => {
  const initial = active.snapshot?.parent || {};
  const navigate = useNavigate();
  const { auth } = useAuth();

  const [createPurchaseOrder] = useCreatePurchaseOrderMutation();

  // ==================== PURCHASE ORDER STATE ====================
  const [purchaseOrderData, setPurchaseOrderData] = useState({
    vendorId: '',
    orderDate: moment().format('YYYY-MM-DD'),
    expectDeliveryDate: null,
    items: [],
    totalAmount: 0,
    notes: '',
    ...initial.purchaseOrderData,
  });

  const [selectedVendor, setSelectedVendor] = useState(initial.selectedVendor || '');

  // ==================== DRAFT CHECKER STATE ====================

  // ==================== DATA FETCHING ====================
  const { data: vendorsData, isLoading: isVendorsLoading } = useGetVendorsQuery();

  const vendors = vendorsData || [];

  const draftData = useMemo(
    () => ({ purchaseOrderData, selectedVendor }),
    [purchaseOrderData, selectedVendor],
  );

  // ==================== CREATE PURCHASE ORDER ====================
  const handleCreatePurchaseOrder = async (layoutProps) => {
    if (!selectedVendor) {
      return toast.error('Please select a vendor.');
    }

    if (!layoutProps?.calculationCartItems || layoutProps.calculationCartItems.length === 0) {
      return toast.error('Cart is empty. Please add items.');
    }

    // the lines as edited on the checkout (qty, rate, discount, GST); the cart only if untouched
    const source = purchaseOrderData.items?.length
      ? purchaseOrderData.items
      : layoutProps.calculationCartItems;
    const formattedItems = source.map((item) => ({
      productId: item.productId || item.id,
      quantity: Number(item.quantity) || 1,
      unitPrice: Number(item.unitPrice ?? item.price ?? item.mrp) || 0.01,
      mrp: Number(item.mrp || item.price || item.unitPrice) || 0.01,
      tax: Number(item.tax) || 0,
      discount: Number(item.discount) || 0,
      discountType: item.discountType || 'percent',
    }));

    const payload = {
      vendorId: selectedVendor,
      items: formattedItems,
      expectDeliveryDate: purchaseOrderData.expectDeliveryDate
        ? moment(purchaseOrderData.expectDeliveryDate).format('YYYY-MM-DD')
        : null,
      notes: purchaseOrderData.notes || '',
      warehouseId: purchaseOrderData.warehouseId || null,
      vendorRef: purchaseOrderData.vendorRef || '',
      paymentTerms: purchaseOrderData.paymentTerms || '',
      deliveryTerms: purchaseOrderData.deliveryTerms || '',
      freight: Number(purchaseOrderData.freight) || 0,
    };

    try {
      const result = await createPurchaseOrder(payload).unwrap();

      toast.success(
        `Purchase Order ${result.purchaseOrder?.poNumber || ''} created successfully!`,
      );

      try {
        await onAction('complete', undefined, workspace.activeId, {
          claimedProductIds: formattedItems.map((item) => item.productId || item.id),
        });
      } catch {
        toast.warning(
          'Purchase order created, but its cart could not be removed. Refresh before reusing this draft.',
        );
      }
      // open the new PO (its PDF is ready to send)
      navigate(result.purchaseOrder?.id ? `/po/${result.purchaseOrder.id}` : '/purchase-manager');
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to create Purchase Order.');
    }
  };

  return (
    <>
      <fieldset className="fv2-newpurchaseorder-621ffa3d37" disabled={busy}>
        <CartLayout
          draftWorkspace={{ workspace, active, onAction, busy, parent: draftData, vendors }}
        >
          {(layoutProps) => (
            <>
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
      </fieldset>
    </>
  );
};

export default function MultiplePurchaseOrderCarts() {
  return (
    <CartWorkspace documentType="purchase-order">
      {(props) => <NewPurchaseOrder key={props.workspace.activeId} {...props} />}
    </CartWorkspace>
  );
}
