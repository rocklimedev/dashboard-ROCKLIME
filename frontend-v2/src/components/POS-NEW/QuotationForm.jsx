import './QuotationForm.styles.css';
// src/components/Quotation/QuotationForm.jsx
import React, { useState, useEffect, useMemo } from 'react';
import {
  Card,
  Button,
  Select,
  InputNumber,
  Row,
  Col,
  Empty,
  Typography,
  Space,
  Divider,
  Collapse,
} from 'antd';
import { toast } from 'sonner';
import {
  CheckCircleOutlined,
  ArrowLeftOutlined,
  DeleteOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import styled from 'styled-components';
import OrderTotal from '../../components/POS-NEW/OrderTotal';
import moment from 'moment';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const { Text, Title } = Typography;
const { Panel } = Collapse;
const { Option } = Select;

const CompactCard = styled(Card).attrs({ className: 'fv2-quotationform-compact-card' })``;

const TightRow = styled(Row).attrs({ className: 'fv2-quotationform-tight-row' })``;

const MiniSelect = styled(Select).attrs({ className: 'fv2-quotationform-mini-select' })``;

const MiniDate = styled(DatePicker).attrs({ className: 'fv2-quotationform-mini-date' })``;

const CheckoutBtn = styled(Button).attrs({ className: 'fv2-quotationform-checkout-btn' })``;

// Helpers
const momentToDate = (m) => (m ? m.toDate() : null);

const QuotationForm = ({
  // From CartLayout
  localCartItems = [],
  calculationCartItems = [],
  subTotal = 0,
  totalDiscount: discount = 0,
  tax = 0,
  shipping = 0,
  gst = 0,
  setGst,
  setShipping,
  mainCartItems = [],
  optionalTotal = 0,

  // Quotation props from NewQuotation
  quotationData = {
    followupDates: [],
    discountAmount: '',
    dueDate: '',
  },
  // Item-level adjustments (Add these lines)
  itemDiscounts = {},
  itemDiscountTypes = {},
  itemTaxes = {},
  handleClearCart,
  setQuotationData,
  handleQuotationChange,
  selectedCustomer = '',
  setSelectedCustomer,
  customers = [],
  addresses = [],
  useBillingAddress = false,
  setUseBillingAddress,
  billingAddressId = null,
  setBillingAddressId,
  previewVisible = false,
  setPreviewVisible,
  handleAddCustomer,
  handleAddAddress,
  setActiveTab,
  handleCreateDocument,
}) => {
  // ==================== KEY FIX ====================
  // Use this as the single source of truth for cart items
  const effectiveCartItems = useMemo(() => {
    if (Array.isArray(calculationCartItems) && calculationCartItems.length > 0) {
      return calculationCartItems;
    }
    if (Array.isArray(localCartItems) && localCartItems.length > 0) {
      return localCartItems;
    }
    return [];
  }, [calculationCartItems, localCartItems]);

  // Customer & Address Logic
  const customerOptions = useMemo(() => {
    return customers.map((cust) => ({
      value: cust.customerId,
      label: (
        <div className="fv2-quotationform-c01074c60c">
          <strong>{cust.name || 'Unnamed Customer'}</strong>
          {cust.mobileNumber && (
            <span className="fv2-quotationform-effae430c4">{cust.mobileNumber}</span>
          )}
          {cust.companyName && (
            <div className="fv2-quotationform-f139c54703">{cust.companyName}</div>
          )}
        </div>
      ),
      searchText:
        `${cust.name || ''} ${cust.mobileNumber || ''} ${cust.companyName || ''}`.toLowerCase(),
    }));
  }, [customers]);

  const defaultAddress = useMemo(() => {
    const billing = addresses.find(
      (a) => a.customerId === selectedCustomer && a.status === 'BILLING',
    );
    if (billing) return billing;

    const cust = customers.find((c) => c.customerId === selectedCustomer);
    if (!cust?.address) return null;

    try {
      return typeof cust.address === 'string' ? JSON.parse(cust.address) : cust.address;
    } catch {
      return null;
    }
  }, [addresses, selectedCustomer, customers]);

  const filteredAddresses = useMemo(
    () => addresses.filter((a) => a.customerId === selectedCustomer),
    [addresses, selectedCustomer],
  );

  const hasBillingAddress = useMemo(
    () => addresses.some((a) => a.customerId === selectedCustomer && a.status === 'BILLING'),
    [addresses, selectedCustomer],
  );

  const dropdownValue = useMemo(() => {
    if (useBillingAddress) return billingAddressId || 'sameAsBilling';
    return quotationData.shipTo;
  }, [useBillingAddress, billingAddressId, quotationData.shipTo]);

  // Follow-up Handlers
  const handleFollowup = (index, date) => {
    const dates = [...(quotationData.followupDates || [])];
    dates[index] = date ? moment(date).format('YYYY-MM-DD') : '';
    handleQuotationChange('followupDates', dates);
  };

  const addFollowup = () =>
    handleQuotationChange('followupDates', [...(quotationData.followupDates || []), '']);

  const removeFollowup = (index) =>
    handleQuotationChange(
      'followupDates',
      (quotationData.followupDates || []).filter((_, i) => i !== index),
    );

  // ==================== EMPTY CART CHECK ====================
  if (!effectiveCartItems.length) {
    return (
      <CompactCard>
        <Empty
          description="Cart is empty"
          image={<DeleteOutlined className="fv2-quotationform-a49b5c65b4" />}
        />
        <Button
          type="primary"
          icon={<ArrowLeftOutlined />}
          onClick={() => setActiveTab('cart')}
          block
        >
          Back to Cart
        </Button>
      </CompactCard>
    );
  }

  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} md={16}>
        <CompactCard title={<Title level={5}>Quotation Details</Title>}>
          <Collapse defaultActiveKey={['1', '2']} ghost>
            {/* Customer & Address Panel */}
            <Panel header="Customer & Address" key="1">
              <TightRow gutter={8}>
                <Col span={8}>
                  <Text strong>
                    Customer <span className="fv2-quotationform-3a5dde9a96">*</span>
                  </Text>
                </Col>
                <Col span={16}>
                  <Space.Compact className="fv2-quotationform-546b26e06d">
                    <Select
                      className="fv2-quotationform-66f3d31af2"
                      showSearch
                      placeholder="Search by name, phone, company..."
                      value={selectedCustomer}
                      onChange={setSelectedCustomer}
                      options={customerOptions}
                      filterOption={(input, option) =>
                        option?.searchText?.includes(input.toLowerCase())
                      }

                      allowClear
                    />
                    <Button
                      className="fv2-quotationform-a3ab9af0ea"
                      type="primary"
                      icon={<PlusOutlined />}
                      onClick={handleAddCustomer}
                    />
                  </Space.Compact>
                </Col>
              </TightRow>

              <TightRow gutter={8}>
                <Col span={8}>
                  <Text strong>Shipping Address</Text>
                </Col>
                <Col span={16}>
                  <Space.Compact className="fv2-quotationform-546b26e06d">
                    <MiniSelect
                      value={dropdownValue}
                      onChange={(v) => {
                        if (v === 'sameAsBilling') {
                          setUseBillingAddress(true);
                          setBillingAddressId(null);
                          handleQuotationChange('shipTo', null);
                        } else {
                          setUseBillingAddress(false);
                          setBillingAddressId(v);
                          handleQuotationChange('shipTo', v);
                        }
                      }}
                      disabled={!selectedCustomer}
                    >
                      {defaultAddress && !hasBillingAddress && (
                        <Option value="sameAsBilling">Same as Billing Address</Option>
                      )}
                      {filteredAddresses.map((a) => (
                        <Option key={a.addressId} value={a.addressId}>
                          {a.street?.slice(0, 40)}
                          {a.street?.length > 40 ? '...' : ''}, {a.city} ({a.status})
                        </Option>
                      ))}
                    </MiniSelect>
                    <Button
                      className="fv2-quotationform-a3ab9af0ea"
                      type="primary"
                      onClick={handleAddAddress}
                      disabled={!selectedCustomer}
                    >
                      +
                    </Button>
                  </Space.Compact>
                </Col>
              </TightRow>
            </Panel>

            {/* Dates & Follow-ups Panel */}
            <Panel header="Dates & Follow-ups" key="2">
              <TightRow gutter={8}>
                <Col span={8}>
                  <Text strong>Due Date</Text>
                </Col>
                <Col span={16}>
                  <MiniDate
                    selected={momentToDate(
                      quotationData.dueDate ? moment(quotationData.dueDate) : null,
                    )}
                    onChange={(d) =>
                      handleQuotationChange('dueDate', d ? moment(d).format('YYYY-MM-DD') : '')
                    }
                    minDate={new Date()}
                    dateFormat="dd/MM/yyyy"
                    isClearable
                  />
                </Col>
              </TightRow>

              <TightRow gutter={8}>
                <Col span={8}>
                  <Text strong>Follow-ups</Text>
                </Col>
                <Col span={16}>
                  {(quotationData.followupDates || []).map((d, i) => (
                    <Space className="fv2-quotationform-835610a8f1" key={i}>
                      <MiniDate
                        selected={momentToDate(d ? moment(d) : null)}
                        onChange={(date) => handleFollowup(i, date)}
                        minDate={new Date()}
                        isClearable
                      />
                      <Button
                        danger
                        size="small"
                        icon={<DeleteOutlined />}
                        onClick={() => removeFollowup(i)}
                      />
                    </Space>
                  ))}
                  <Button size="small" icon={<PlusOutlined />} onClick={addFollowup}>
                    Add Follow-up
                  </Button>
                </Col>
              </TightRow>
            </Panel>
          </Collapse>
        </CompactCard>
      </Col>

      {/* Summary Sidebar */}
      <Col xs={24} md={8}>
        <CompactCard className="fv2-quotationform-6cf7b44543" title="Order Summary">
          <OrderTotal
            items={localCartItems.map((item) => ({
              ...item,
              discount: Number(itemDiscounts[item.productId]) || 0,
              discountType: itemDiscountTypes[item.productId] || 'percent',
            }))}
            miscellaneousChargeItems={quotationData.miscellaneousChargeItems}
            additionalDiscount={quotationData.additionalDiscount}
            flatPrice={quotationData.flatPrice}
            subTotal={subTotal}
            discount={discount}
            shipping={shipping}
            gst={gst}
            extraDiscount={Number(quotationData.discountAmount) || 0}
            extraDiscountType={quotationData.discountType || 'fixed'}
            itemCount={mainCartItems.length || null}
            optionalTotal={optionalTotal}
            gstInclusive={quotationData.gstInclusive === true}
            onGstInclusiveChange={(value) => {
              handleQuotationChange('gstInclusive', value);
              if (value) setGst(0);
            }}
            onGstChange={setGst}
            onShippingChange={setShipping}
          />
          <Divider />
          <Button block size="large" onClick={() => setPreviewVisible(true)}>
            Preview Quotation
          </Button>

          <CheckoutBtn
            block
            size="large"
            icon={<CheckCircleOutlined />}
            onClick={() => {
              if (!selectedCustomer) {
                return toast.error('Please select a customer');
              }

              // Pass the correct key: payloadCartItems
              handleCreateDocument({
                payloadCartItems: localCartItems, // ← Changed from calculationCartItems
                calculationCartItems: calculationCartItems, // for totals
                shipping,
                gst,
                itemDiscounts,
                itemDiscountTypes,
                itemTaxes,
                handleClearCart,
              });
            }}
          >
            Create Quotation
          </CheckoutBtn>
        </CompactCard>
      </Col>
    </Row>
  );
};

export default React.memo(QuotationForm);
