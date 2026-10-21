// src/pages/quotations/NewQuotation.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { message, Button, Space } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { v4 as uuidv4 } from 'uuid';

import CreateProductModal from '../../components/modals/CreateProductModal';
import CartLayout from './CartLayout';
import QuotationForm from '../../components/POS-NEW/QuotationForm';
import DraftPdfPreview from '../../components/Quotation/DraftPdfPreview';
import QuotationCartDetails from '../../components/Quotation/QuotationCartDetails';
import AddAddress from '../../components/Address/AddAddressModal';
import AddCustomerModal from '../../components/Customers/AddCustomerModal';

import { useCreateQuotationMutation } from '../../api/quotationApi';
import { useLinkDealQuotationMutation } from '../../api/crmApi';
import { useGetCustomersQuery } from '../../api/customerApi';
import { useGetAllAddressesQuery, useCreateAddressMutation } from '../../api/addressApi';
import { useAuth } from '../../context/AuthContext';
import QuotationWorkspace from './QuotationWorkspace';

const buildFloorsFromProducts = (products) => {
  const floorMap = new Map();

  products.forEach((item) => {
    const locationList =
      Array.isArray(item.locations) && item.locations.length > 0
        ? item.locations
        : item.floorId
          ? [
              {
                floorId: item.floorId,
                floorName: item.floorName,
                roomId: item.roomId,
                roomName: item.roomName,
              },
            ]
          : [];

    locationList.forEach((loc) => {
      if (!loc.floorId) return;

      if (!floorMap.has(loc.floorId)) {
        floorMap.set(loc.floorId, {
          floorId: loc.floorId,
          floorName: loc.floorName || `Floor ${loc.floorId}`,
          sortOrder: Number(loc.floorSortOrder ?? floorMap.size),
          rooms: [],
        });
      }
      const floor = floorMap.get(loc.floorId);

      if (loc.roomId) {
        let room = floor.rooms.find((r) => r.roomId === loc.roomId);
        if (!room) {
          room = {
            roomId: loc.roomId,
            roomName: loc.roomName || 'Unnamed Room',
            sortOrder: Number(loc.roomSortOrder ?? floor.rooms.length),
            type: loc.roomType || 'other',
          };
          floor.rooms.push(room);
        }
      }
    });
  });

  return Array.from(floorMap.values())
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((floor) => ({
      ...floor,
      rooms: floor.rooms.sort((a, b) => a.sortOrder - b.sortOrder),
    }));
};

const NewQuotation = ({ workspace, active, onAction, busy, userId }) => {
  const navigate = useNavigate();
  const { auth } = useAuth();
  const initial = active.snapshot?.parent || {};

  const [createQuotation] = useCreateQuotationMutation();
  const [createAddress] = useCreateAddressMutation();

  // ==================== MODAL STATES ====================
  const [showCreateProductModal, setShowCreateProductModal] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [showAddAddressModal, setShowAddAddressModal] = useState(false);
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);

  // ==================== MAIN STATE ====================
  const [quotationData, setQuotationData] = useState({
    quotationDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    shipTo: null,
    floors: [],
    signatureName: 'CM TRADING CO',
    signatureImage: '',
    discountType: 'fixed',
    discountAmount: '',
    followupDates: [],
    ...initial.quotationData,
  });

  const [selectedCustomer, setSelectedCustomer] = useState(initial.selectedCustomer || '');
  // opened from a CRM deal: /cart/quotation?customer=…&deal=…
  const [searchParams] = useSearchParams();
  const dealId = initial.dealId || searchParams.get('deal');
  const presetCustomer = searchParams.get('customer');
  const [linkDealQuotation] = useLinkDealQuotationMutation();
  const [useBillingAddress, setUseBillingAddress] = useState(initial.useBillingAddress || false);
  const [billingAddressId, setBillingAddressId] = useState(initial.billingAddressId || null);

  // ==================== DATA FETCHING ====================
  const { data: customersData } = useGetCustomersQuery({ limit: 10000 });
  const { data: addressesData, refetch: refetchAddresses } = useGetAllAddressesQuery(
    selectedCustomer || undefined,
    {
      skip: !selectedCustomer,
    },
  );

  const customers = customersData?.data || [];
  const addresses = addressesData || [];

  const draftData = useMemo(
    () => ({ quotationData, selectedCustomer, useBillingAddress, billingAddressId, dealId }),
    [quotationData, selectedCustomer, useBillingAddress, billingAddressId, dealId],
  );
  useEffect(() => {
    if (presetCustomer && !initial.selectedCustomer) setSelectedCustomer(presetCustomer);
  }, [presetCustomer]);
  // ==================== QUOTATION DATA CHANGE ====================
  // Shared by both the Checkout form (QuotationForm) and the Cart tab's
  // Site Layout section (CartTab), since floors now live/render there.
  const handleQuotationChange = (key, value) =>
    setQuotationData((prev) => ({ ...prev, [key]: value }));

  // ==================== CREATE QUOTATION ====================
  // One payload for saving and for the PDF preview
  const buildQuotationPayload = (layoutProps = {}) => {
    const {
      payloadCartItems = [],
      shipping = 0,
      gst = 0,
      itemDiscounts = {},
      itemDiscountTypes = {},
      itemTaxes = {},
    } = layoutProps;

    if (!selectedCustomer) return { error: 'Please select a customer.' };
    if (payloadCartItems.length === 0) return { error: 'Cart is empty.' };

    // Shipping Address Logic
    let finalShipTo = quotationData.shipTo;
    if (useBillingAddress && billingAddressId) {
      finalShipTo = billingAddressId;
    }

    // Floors
    let finalFloors = quotationData.floors || [];
    if (finalFloors.length === 0) {
      const hasLocation = payloadCartItems.some((item) => item.floorId || item.roomId);
      if (hasLocation) finalFloors = buildFloorsFromProducts(payloadCartItems);
    }

    // Enrich Items for Payload
    const enrichedItems = payloadCartItems.map((item, index) => {
      const productId = item.productId || item.id;
      const isOption =
        Boolean(item.isOption) ||
        Boolean(item.isOptionFor) ||
        Boolean(item.optionType && item.optionType !== 'main');

      return {
        ...item,
        productId,
        priority: Number(item.priority ?? index),

        isOption: isOption,
        optionType: item.optionType || null,
        isOptionFor: isOption ? item.parentProductId || item.isOptionFor : null,
        parentProductId: item.parentProductId || item.isOptionFor || null,

        discount: Number(itemDiscounts[productId] || 0),
        discountType: itemDiscountTypes[productId] || 'percent',
        tax: Number(itemTaxes[productId] || 0),

        discountAmount: Number(
          (itemDiscountTypes[productId] === 'percent'
            ? (item.price * item.quantity * (itemDiscounts[productId] || 0)) / 100
            : (itemDiscounts[productId] || 0) * item.quantity
          ).toFixed(2),
        ),
      };
    });

    const quotationPayload = {
      quotationId: uuidv4(),
      document_title:
        quotationData.documentTitle ||
        `${
          customers.find((c) => c.customerId === selectedCustomer)?.name || 'Customer'
        } - ${moment().format('DD-MM-YYYY')}`,

      quotation_date: quotationData.quotationDate || moment().format('YYYY-MM-DD'),
      due_date: quotationData.dueDate || null,

      customerId: selectedCustomer,
      shipTo: finalShipTo || null,

      extraDiscount: Number(quotationData.discountAmount) || 0,
      extraDiscountType: quotationData.discountType || 'fixed',

      shippingAmount: Number(shipping) || 0,
      gst: Number(gst) || 0,
      miscellaneousChargeItems: quotationData.miscellaneousChargeItems || [],
      additionalDiscount: Number(quotationData.additionalDiscount) || 0,
      flatPrice: quotationData.flatPrice ?? null,

      signature_name: quotationData.signatureName ?? 'CM TRADING CO',
      signature_image: quotationData.signatureImage || '',

      floors: finalFloors,
      products: enrichedItems,
      followupDates: quotationData.followupDates?.filter(Boolean) || [],
      createdBy: auth?.user?.userId,
    };
    return { payload: quotationPayload };
  };

  const handleCreateQuotation = async (layoutProps = {}) => {
    const { payload: quotationPayload, error } = buildQuotationPayload(layoutProps);
    if (error) return message.error(error);
    try {
      const result = await createQuotation(quotationPayload).unwrap();
      message.success(
        `Quotation created successfully!${
          result.quotation?.reference_number ? ` Ref: ${result.quotation.reference_number}` : ''
        }`,
      );

      try {
        await onAction('complete', undefined, workspace.activeId, {
          claimedProductIds: quotationPayload.products.map((item) => item.productId || item.id),
        });
      } catch {
        message.warning(
          'Quotation created, but its cart could not be removed. Refresh before reusing this draft.',
        );
      }
      if (dealId) {
        const quotationId = result.quotation?.quotationId || quotationPayload.quotationId;
        try {
          await linkDealQuotation({ id: dealId, quotationId }).unwrap();
          message.success('Linked to the CRM deal');
        } catch {
          message.warning('Quotation saved, but it could not be linked to the deal');
        }
        navigate(`/quotation/${quotationId}`);
        return;
      }
      navigate('/quotations/list');
    } catch (err) {
      message.error(err?.data?.message || 'Failed to create quotation.');
    }
  };

  // ==================== OTHER HANDLERS ====================
  const handleAddCustomer = () => setShowAddCustomerModal(true);
  const handleCustomerSave = (newCustomer) => {
    setSelectedCustomer(newCustomer.customerId || '');
    setShowAddCustomerModal(false);
    message.success('Customer created successfully');
  };

  const handleAddAddress = () => setShowAddAddressModal(true);
  const handleAddressSave = (addressId) => {
    setQuotationData((prev) => ({ ...prev, shipTo: addressId }));
    setShowAddAddressModal(false);
    refetchAddresses();
    message.success('Address added successfully');
  };

  const handleProductCreated = (newProduct) => {
    message.success(`Product "${newProduct.name}" created successfully!`);
  };

  return (
    <>
      <fieldset disabled={busy} style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }}>
        <CartLayout
          quotationData={quotationData}
          handleQuotationChange={handleQuotationChange}
          draftWorkspace={{ workspace, active, onAction, busy, parent: draftData, customers }}
        >
          {(layoutProps) => (
            <>
              {/* Header Buttons */}
              <div style={{ marginBottom: 16, textAlign: 'right' }}>
                <Space>
                  <Button
                    icon={<PlusOutlined />}
                    onClick={() => setShowCreateProductModal(true)}
                    type="primary"
                  >
                    Add Optional Product
                  </Button>
                </Space>
              </div>

              <QuotationCartDetails
                data={quotationData}
                onChange={handleQuotationChange}
                items={layoutProps.localCartItems}
                setItems={layoutProps.setLocalCartItems}
              />
              <QuotationForm
                {...layoutProps}
                quotationData={quotationData}
                setQuotationData={setQuotationData}
                handleQuotationChange={handleQuotationChange}
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
                itemDiscounts={layoutProps.itemDiscounts}
                itemDiscountTypes={layoutProps.itemDiscountTypes}
                itemTaxes={layoutProps.itemTaxes}
                handleClearCart={layoutProps.handleClearCart}
              />

              <DraftPdfPreview
                open={previewVisible}
                onClose={() => setPreviewVisible(false)}
                getDraft={() => buildQuotationPayload(layoutProps)}
              />
            </>
          )}
        </CartLayout>
      </fieldset>

      {/* Modals */}
      <CreateProductModal
        open={showCreateProductModal}
        onClose={() => setShowCreateProductModal(false)}
        onSuccess={handleProductCreated}
      />

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

export default function MultipleQuotationCarts() {
  return (
    <QuotationWorkspace>
      {(props) => <NewQuotation key={props.workspace.activeId} {...props} />}
    </QuotationWorkspace>
  );
}
