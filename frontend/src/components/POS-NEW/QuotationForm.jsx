// src/components/Quotation/QuotationForm.jsx
import React, { useState, useEffect, useMemo } from "react";
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
  message,
} from "antd";
import {
  CheckCircleOutlined,
  ArrowLeftOutlined,
  DeleteOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import styled from "styled-components";
import OrderTotal from "../../components/POS-NEW/OrderTotal";
import moment from "moment";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const { Text, Title } = Typography;
const { Panel } = Collapse;
const { Option } = Select;

const CompactCard = styled(Card)`
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  .ant-card-body {
    padding: 12px 16px;
  }
`;

const TightRow = styled(Row)`
  margin-bottom: 8px;
  .ant-col {
    padding: 0 6px;
  }
`;

const MiniSelect = styled(Select)`
  width: 100%;
  .ant-select-selector {
    padding: 0 8px;
    height: 30px;
  }
`;

const MiniDate = styled(DatePicker)`
  width: 100%;
  height: 30px;
  .react-datepicker-wrapper,
  input {
    height: 30px;
    padding: 4px 8px;
  }
`;

const CheckoutBtn = styled(Button)`
  height: 40px;
  font-weight: 600;
  background: #e31e24;
  border-color: #e31e24;
  color: white;
  &:hover {
    background: #ff4d4f;
    border-color: #ff4d4f;
  }
`;

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

  // Quotation props from NewQuotation
  quotationData = {
    followupDates: [],
    discountAmount: "",
    dueDate: "",
  },
  // Item-level adjustments (Add these lines)
  itemDiscounts = {},
  itemDiscountTypes = {},
  itemTaxes = {},
  handleClearCart,
  setQuotationData,
  handleQuotationChange,
  selectedCustomer = "",
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
    if (
      Array.isArray(calculationCartItems) &&
      calculationCartItems.length > 0
    ) {
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
        <div style={{ lineHeight: 1.3 }}>
          <strong>{cust.name || "Unnamed Customer"}</strong>
          {cust.mobileNumber && (
            <span style={{ marginLeft: 8, color: "#555" }}>
              {cust.mobileNumber}
            </span>
          )}
          {cust.companyName && (
            <div style={{ fontSize: "0.85em", color: "#777" }}>
              {cust.companyName}
            </div>
          )}
        </div>
      ),
      searchText:
        `${cust.name || ""} ${cust.mobileNumber || ""} ${cust.companyName || ""}`.toLowerCase(),
    }));
  }, [customers]);

  const defaultAddress = useMemo(() => {
    const billing = addresses.find(
      (a) => a.customerId === selectedCustomer && a.status === "BILLING",
    );
    if (billing) return billing;

    const cust = customers.find((c) => c.customerId === selectedCustomer);
    if (!cust?.address) return null;

    try {
      return typeof cust.address === "string"
        ? JSON.parse(cust.address)
        : cust.address;
    } catch {
      return null;
    }
  }, [addresses, selectedCustomer, customers]);

  const filteredAddresses = useMemo(
    () => addresses.filter((a) => a.customerId === selectedCustomer),
    [addresses, selectedCustomer],
  );

  const hasBillingAddress = useMemo(
    () =>
      addresses.some(
        (a) => a.customerId === selectedCustomer && a.status === "BILLING",
      ),
    [addresses, selectedCustomer],
  );

  const dropdownValue = useMemo(() => {
    if (useBillingAddress) return billingAddressId || "sameAsBilling";
    return quotationData.shipTo;
  }, [useBillingAddress, billingAddressId, quotationData.shipTo]);

  // Follow-up Handlers
  const handleFollowup = (index, date) => {
    const dates = [...(quotationData.followupDates || [])];
    dates[index] = date ? moment(date).format("YYYY-MM-DD") : "";
    handleQuotationChange("followupDates", dates);
  };

  const addFollowup = () =>
    handleQuotationChange("followupDates", [
      ...(quotationData.followupDates || []),
      "",
    ]);

  const removeFollowup = (index) =>
    handleQuotationChange(
      "followupDates",
      (quotationData.followupDates || []).filter((_, i) => i !== index),
    );

  // ==================== EMPTY CART CHECK ====================
  if (!effectiveCartItems.length) {
    return (
      <CompactCard>
        <Empty
          description="Cart is empty"
          image={<DeleteOutlined style={{ fontSize: 48 }} />}
        />
        <Button
          type="primary"
          icon={<ArrowLeftOutlined />}
          onClick={() => setActiveTab("cart")}
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
          <Collapse defaultActiveKey={["1", "2"]} ghost>
            {/* Customer & Address Panel */}
            <Panel header="Customer & Address" key="1">
              <TightRow gutter={8}>
                <Col span={8}>
                  <Text strong>
                    Customer <span style={{ color: "red" }}>*</span>
                  </Text>
                </Col>
                <Col span={16}>
                  <Space.Compact style={{ width: "100%" }}>
                    <Select
                      showSearch
                      placeholder="Search by name, phone, company..."
                      value={selectedCustomer}
                      onChange={setSelectedCustomer}
                      options={customerOptions}
                      filterOption={(input, option) =>
                        option?.searchText?.includes(input.toLowerCase())
                      }
                      style={{ flex: 1 }}
                      allowClear
                    />
                    <Button
                      type="primary"
                      icon={<PlusOutlined />}
                      onClick={handleAddCustomer}
                      style={{ minWidth: 40 }}
                    />
                  </Space.Compact>
                </Col>
              </TightRow>

              <TightRow gutter={8}>
                <Col span={8}>
                  <Text strong>Shipping Address</Text>
                </Col>
                <Col span={16}>
                  <Space.Compact style={{ width: "100%" }}>
                    <MiniSelect
                      value={dropdownValue}
                      onChange={(v) => {
                        if (v === "sameAsBilling") {
                          setUseBillingAddress(true);
                          setBillingAddressId(null);
                          handleQuotationChange("shipTo", null);
                        } else {
                          setUseBillingAddress(false);
                          setBillingAddressId(v);
                          handleQuotationChange("shipTo", v);
                        }
                      }}
                      disabled={!selectedCustomer}
                    >
                      {defaultAddress && !hasBillingAddress && (
                        <Option value="sameAsBilling">
                          Same as Billing Address
                        </Option>
                      )}
                      {filteredAddresses.map((a) => (
                        <Option key={a.addressId} value={a.addressId}>
                          {a.street?.slice(0, 40)}
                          {a.street?.length > 40 ? "..." : ""}, {a.city} (
                          {a.status})
                        </Option>
                      ))}
                    </MiniSelect>
                    <Button
                      type="primary"
                      onClick={handleAddAddress}
                      disabled={!selectedCustomer}
                      style={{ minWidth: 40 }}
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
                      quotationData.dueDate
                        ? moment(quotationData.dueDate)
                        : null,
                    )}
                    onChange={(d) =>
                      handleQuotationChange(
                        "dueDate",
                        d ? moment(d).format("YYYY-MM-DD") : "",
                      )
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
                    <Space key={i} style={{ width: "100%", marginBottom: 8 }}>
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
                  <Button
                    size="small"
                    icon={<PlusOutlined />}
                    onClick={addFollowup}
                  >
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
        <CompactCard
          title="Order Summary"
          style={{ position: "sticky", top: 16 }}
        >
          <OrderTotal
            subTotal={subTotal}
            discount={discount}
            tax={tax}
            shipping={shipping}
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
                return message.error("Please select a customer");
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
