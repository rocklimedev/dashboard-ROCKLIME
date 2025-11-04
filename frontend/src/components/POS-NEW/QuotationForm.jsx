import React, { useState, useEffect, useMemo } from "react";
import {
  Card,
  Button,
  Select,
  InputNumber,
  Alert,
  Row,
  Col,
  Empty,
  Typography,
  Space,
  Divider,
  Collapse,
} from "antd";
import {
  UserAddOutlined,
  CheckCircleOutlined,
  ArrowLeftOutlined,
  DeleteOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import { FcEmptyTrash } from "react-icons/fc";
import { InfoCircleOutlined } from "@ant-design/icons";
import styled from "styled-components";
import OrderTotal from "./OrderTotal";
import { toast } from "sonner";
import { useCreateAddressMutation } from "../../api/addressApi";
import moment from "moment";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const { Text, Title } = Typography;
const { Option } = Select;
const { Panel } = Collapse;

// === Styled Components ===
const CompactCard = styled(Card)`
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  .ant-card-body {
    padding: 12px 16px;
  }
`;
const TightRow = styled(Row)`
  margin-bottom: 6px;
  .ant-col {
    padding: 0 4px;
  }
`;
const MiniSelect = styled(Select)`
  width: 100%;
  .ant-select-selector {
    padding: 0 6px;
    height: 28px;
  }
`;
const MiniNumber = styled(InputNumber)`
  width: 100%;
  height: 28px;
  .ant-input-number-input {
    height: 26px;
  }
`;
const MiniDate = styled(DatePicker)`
  width: 100%;
  height: 28px;
  .react-datepicker-wrapper,
  input {
    height: 28px;
  }
`;
const CheckoutBtn = styled(Button)`
  height: 36px;
  font-weight: 600;
  background: #e31e24;
  border-color: #e31e24;
  &:hover {
    background: #ff4d4f;
    border-color: #ff4d4f;
  }
`;

// === Helper ===
const momentToDate = (m) => (m ? m.toDate() : null);
const normalize = (s) => (s ? s.trim().toLowerCase() : "");

// === Main Component ===
const QuotationForm = ({
  quotationData,
  setQuotationData,
  handleQuotationChange,
  selectedCustomer,
  setSelectedCustomer,
  customers,
  customersLoading,
  customersError,
  addresses,
  addressesLoading,
  addressesError,
  error,
  quotationNumber,
  documentType,
  setDocumentType,
  cartItems,
  subTotal,
  shipping,
  tax,
  discount,
  itemDiscounts,
  itemTaxes,
  gst,
  gstAmount,
  setGst,
  handleAddCustomer,
  handleAddAddress,
  setActiveTab,
  handleCreateDocument,
  useBillingAddress,
  setUseBillingAddress,
}) => {
  const [isCreatingAddress, setIsCreatingAddress] = useState(false);
  const [createAddress] = useCreateAddressMutation();

  // === Memos ===
  const selectedCustomerData = useMemo(
    () => customers.find((c) => c.customerId === selectedCustomer),
    [customers, selectedCustomer]
  );

  const defaultAddress = useMemo(() => {
    const billing = addresses.find(
      (a) => a.customerId === selectedCustomer && a.status === "BILLING"
    );
    return billing || selectedCustomerData?.address || null;
  }, [addresses, selectedCustomerData, selectedCustomer]);

  const filteredAddresses = useMemo(
    () => addresses.filter((a) => a.customerId === selectedCustomer),
    [addresses, selectedCustomer]
  );

  const extraDiscount = useMemo(() => {
    const amount = parseFloat(quotationData.discountAmount) || 0;
    if (!amount) return 0;
    const base = subTotal - discount + tax;
    return quotationData.discountType === "percent"
      ? parseFloat(((base * amount) / 100).toFixed(2))
      : amount;
  }, [
    quotationData.discountType,
    quotationData.discountAmount,
    subTotal,
    discount,
    tax,
  ]);

  const finalRoundedTotal = useMemo(() => {
    const base =
      subTotal + shipping + tax - discount - extraDiscount + (gstAmount || 0);
    const rupees = Math.floor(Math.round(base * 100) / 100);
    const last = rupees % 10;
    if (last <= 4) return rupees - last;
    if (last >= 6) return rupees + (10 - last);
    return rupees;
  }, [subTotal, shipping, tax, discount, extraDiscount, gstAmount]);

  // === Address Sync ===
  useEffect(() => {
    if (!useBillingAddress || !defaultAddress || !selectedCustomer) return;

    const match = filteredAddresses.find(
      (a) =>
        normalize(a.street) === normalize(defaultAddress.street) &&
        normalize(a.city) === normalize(defaultAddress.city) &&
        normalize(a.state) === normalize(defaultAddress.state) &&
        normalize(a.postalCode || a.zip) ===
          normalize(defaultAddress.postalCode || defaultAddress.zip) &&
        normalize(a.country || "india") ===
          normalize(defaultAddress.country || "india")
    );

    if (match) {
      handleQuotationChange("shipTo", match.addressId);
    } else {
      const create = async () => {
        setIsCreatingAddress(true);
        try {
          const res = await createAddress({
            customerId: selectedCustomer,
            ...defaultAddress,
            status: "BILLING",
          }).unwrap();
          handleQuotationChange("shipTo", res.addressId);
          toast.success("Billing address created");
        } catch (e) {
          toast.error("Failed to create billing address");
        } finally {
          setIsCreatingAddress(false);
        }
      };
      create();
    }
  }, [useBillingAddress, defaultAddress, filteredAddresses, selectedCustomer]);

  // === Follow-up Dates ===
  const handleFollowup = (i, d) => {
    const arr = [...quotationData.followupDates];
    arr[i] = d ? moment(d).format("YYYY-MM-DD") : "";
    if (
      d &&
      quotationData.dueDate &&
      moment(d).isAfter(quotationData.dueDate)
    ) {
      toast.warning("Follow-up cannot be after due date");
    }
    handleQuotationChange("followupDates", arr);
  };
  const addFollow = () =>
    handleQuotationChange("followupDates", [
      ...quotationData.followupDates,
      "",
    ]);
  const rmFollow = (i) =>
    handleQuotationChange(
      "followupDates",
      quotationData.followupDates.filter((_, x) => x !== i)
    );

  // === Render ===
  if (!cartItems.length) {
    return (
      <CompactCard>
        <Empty
          description="Cart empty"
          image={<FcEmptyTrash style={{ fontSize: 48 }} />}
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
    <Row gutter={12}>
      {/* LEFT: FORM */}
      <Col xs={24} md={16}>
        <CompactCard title={<Title level={5}>Quotation Checkout</Title>}>
          <Collapse defaultActiveKey={["1", "2", "3"]} ghost>
            {/* 1. Customer & Document */}
            <Panel header="Customer & Document" key="1">
              <TightRow gutter={8}>
                <Col span={8}>
                  <Text strong>Doc Type</Text>
                </Col>
                <Col span={16}>
                  <MiniSelect value={documentType} onChange={setDocumentType}>
                    {["Quotation", "Order", "Purchase Order"].map((v) => (
                      <Option key={v} value={v}>
                        {v}
                      </Option>
                    ))}
                  </MiniSelect>
                </Col>
              </TightRow>

              <TightRow gutter={8}>
                <Col span={8}>
                  <Text strong>
                    Customer <span style={{ color: "red" }}>*</span>
                  </Text>
                </Col>
                <Col span={16}>
                  <MiniSelect
                    value={selectedCustomer}
                    onChange={(v) => {
                      setSelectedCustomer(v);
                      setQuotationData((p) => ({ ...p, shipTo: null }));
                      setUseBillingAddress(false);
                    }}
                    loading={customersLoading}
                  >
                    {customers.map((c) => (
                      <Option key={c.customerId} value={c.customerId}>
                        {c.name}
                      </Option>
                    ))}
                  </MiniSelect>
                  <Button
                    type="link"
                    icon={<UserAddOutlined />}
                    onClick={handleAddCustomer}
                    block
                    size="small"
                  >
                    Add
                  </Button>
                </Col>
              </TightRow>
            </Panel>

            {/* 2. Address */}
            <Panel header="Shipping Address" key="2">
              <TightRow gutter={8}>
                <Col span={8}>
                  <Text strong>
                    Address <span style={{ color: "red" }}>*</span>
                  </Text>
                </Col>
                <Col span={16}>
                  <MiniSelect
                    value={
                      useBillingAddress ? "sameAsBilling" : quotationData.shipTo
                    }
                    onChange={(v) => {
                      if (v === "sameAsBilling") setUseBillingAddress(true);
                      else {
                        setUseBillingAddress(false);
                        handleQuotationChange("shipTo", v);
                      }
                    }}
                    loading={addressesLoading || isCreatingAddress}
                    disabled={!selectedCustomer}
                  >
                    {defaultAddress && (
                      <Option value="sameAsBilling">Same as Billing</Option>
                    )}
                    {filteredAddresses.map((a) => (
                      <Option key={a.addressId} value={a.addressId}>
                        {`${a.street}, ${a.city} (${a.status})`}
                      </Option>
                    ))}
                  </MiniSelect>
                  <Button
                    type="link"
                    icon={<UserAddOutlined />}
                    onClick={handleAddAddress}
                    block
                    size="small"
                    disabled={!selectedCustomer}
                  >
                    Add
                  </Button>
                </Col>
              </TightRow>
            </Panel>

            {/* 3. Dates & Discount */}
            <Panel header="Dates & Discount" key="3">
              <TightRow gutter={8}>
                <Col span={8}>
                  <Text strong>
                    Due Date <span style={{ color: "red" }}>*</span>
                  </Text>
                </Col>
                <Col span={16}>
                  <MiniDate
                    selected={momentToDate(
                      quotationData.dueDate
                        ? moment(quotationData.dueDate)
                        : null
                    )}
                    onChange={(d) =>
                      handleQuotationChange(
                        "dueDate",
                        d ? moment(d).format("YYYY-MM-DD") : ""
                      )
                    }
                    minDate={new Date()}
                  />
                </Col>
              </TightRow>

              <TightRow gutter={8}>
                <Col span={8}>
                  <Text strong>Follow-ups</Text>
                </Col>
                <Col span={16}>
                  {quotationData.followupDates.map((d, i) => (
                    <Space key={i} style={{ width: "100%", marginBottom: 4 }}>
                      <MiniDate
                        selected={momentToDate(d ? moment(d) : null)}
                        onChange={(v) => handleFollowup(i, v)}
                        minDate={new Date()}
                        maxDate={
                          quotationData.dueDate
                            ? moment(quotationData.dueDate).toDate()
                            : null
                        }
                      />
                      <Button
                        danger
                        size="small"
                        icon={<DeleteOutlined />}
                        onClick={() => rmFollow(i)}
                      />
                    </Space>
                  ))}
                  <Button
                    size="small"
                    icon={<PlusOutlined />}
                    onClick={addFollow}
                  >
                    Add
                  </Button>
                </Col>
              </TightRow>

              <TightRow gutter={8}>
                <Col span={8}>
                  <Text strong>Extra Discount</Text>
                </Col>
                <Col span={16}>
                  <Space.Compact block>
                    <MiniSelect
                      value={quotationData.discountType}
                      onChange={(v) => {
                        handleQuotationChange("discountType", v);
                        handleQuotationChange("discountAmount", "");
                      }}
                      style={{ width: 80 }}
                    >
                      <Option value="percent">%</Option>
                      <Option value="fixed">₹</Option>
                    </MiniSelect>
                    <MiniNumber
                      value={quotationData.discountAmount}
                      onChange={(v) =>
                        handleQuotationChange("discountAmount", v)
                      }
                      placeholder={
                        quotationData.discountType === "percent" ? "5" : "250"
                      }
                    />
                  </Space.Compact>
                </Col>
              </TightRow>

              <TightRow gutter={8}>
                <Col span={8}>
                  <Text strong>
                    GST % <InfoCircleOutlined style={{ fontSize: 11 }} />
                  </Text>
                </Col>
                <Col span={16}>
                  <MiniNumber
                    value={gst}
                    onChange={(v) => setGst(v ?? 0)}
                    min={0}
                    max={100}
                    step={0.01}
                    addonAfter="%"
                  />
                  <Text type="secondary" style={{ fontSize: 11 }} block>
                    +₹{(gstAmount || 0).toFixed(2)}
                  </Text>
                </Col>
              </TightRow>

              <TightRow gutter={8}>
                <Col span={8}>
                  <Text strong>Round Off</Text>
                </Col>
                <Col span={16}>
                  <MiniNumber
                    value={quotationData.roundOff || 0}
                    disabled
                    prefix="₹"
                  />
                  <Text type="secondary" style={{ fontSize: 11 }} block>
                    Final: <strong>₹{finalRoundedTotal}</strong>
                  </Text>
                </Col>
              </TightRow>
            </Panel>
          </Collapse>
        </CompactCard>
      </Col>

      {/* RIGHT: SUMMARY */}
      <Col xs={24} md={8}>
        <CompactCard
          title={<Text strong>Summary</Text>}
          style={{ position: "sticky", top: 16 }}
        >
          <Text strong>#{quotationNumber}</Text>
          <Divider style={{ margin: "8px 0" }} />
          <OrderTotal
            subTotal={subTotal}
            discount={discount}
            extraDiscount={extraDiscount}
            tax={tax}
            shipping={shipping}
            roundOff={quotationData.roundOff || 0}
            gst={gst}
            gstAmount={gstAmount}
            finalTotal={finalRoundedTotal}
            items={cartItems.map((item) => ({
              ...item,
              discount: Number(itemDiscounts[item.productId]) || 0,
              tax: Number(itemTaxes[item.productId]) || 0,
            }))}
          />
          <Divider style={{ margin: "8px 0" }} />
          <CheckoutBtn
            block
            icon={<CheckCircleOutlined />}
            onClick={() => {
              if (!selectedCustomer) return toast.error("Select customer");
              if (!quotationData.dueDate) return toast.error("Select due date");
              if (!quotationData.shipTo && !useBillingAddress)
                return toast.error("Select shipping");
              handleCreateDocument({ gst, gstAmount });
            }}
          >
            Create {documentType}
          </CheckoutBtn>
          <Button
            block
            style={{ marginTop: 4 }}
            onClick={() => setActiveTab("cart")}
          >
            Back
          </Button>
        </CompactCard>
      </Col>
    </Row>
  );
};

export default React.memo(QuotationForm);
