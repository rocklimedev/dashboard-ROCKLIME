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
  Spin,
  message,
} from "antd";
import {
  UserAddOutlined,
  CheckCircleOutlined,
  ArrowLeftOutlined,
  DeleteOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import styled from "styled-components";
import OrderTotal from "./OrderTotal";
import { useGetCustomersQuery } from "../../api/customerApi";
import moment from "moment";
import DatePicker from "react-datepicker";
import { useAuth } from "../../context/AuthContext";
import "react-datepicker/dist/react-datepicker.css";

const RESTRICTED_ROLES = ["SUPER_ADMIN", "DEVELOPER", "ADMIN"];
const { Text, Title } = Typography;
const { Panel } = Collapse;
const { Option } = Select;
/* ────────────────────── Styled Components ────────────────────── */
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

/* ────────────────────── Helpers ────────────────────── */
const momentToDate = (m) => (m ? m.toDate() : null);
const normalize = (s) => (s ? s.trim().toLowerCase() : "");

/* ────────────────────── Main Component ────────────────────── */
const QuotationForm = ({
  quotationData,
  setQuotationData,
  handleQuotationChange,
  selectedCustomer,
  setSelectedCustomer,
  addresses,
  addressesLoading,
  addressesError,
  quotationNumber,
  documentType,
  setDocumentType,
  cartItems,
  subTotal,
  shipping,
  tax,
  discount,
  extraDiscount,
  gst,
  setGst,
  billingAddressId,
  handleAddCustomer,
  handleAddAddress,
  setActiveTab,
  handleCreateDocument,
  useBillingAddress,
  setBillingAddressId,
  setUseBillingAddress,
  previewVisible,
  setPreviewVisible,
}) => {
  const { auth } = useAuth();
  const canCreatePurchaseOrder =
    auth?.role && RESTRICTED_ROLES.includes(auth.role);

  const [isCreatingAddress, setIsCreatingAddress] = useState(false);

  // ────────────────────────────────────────────────
  //           PAGINATED CUSTOMER SELECT LOGIC
  // ────────────────────────────────────────────────
  const [customerSearch, setCustomerSearch] = useState("");
  const [customerPage, setCustomerPage] = useState(1);
  const [accumulatedCustomers, setAccumulatedCustomers] = useState([]);
  const [hasMore, setHasMore] = useState(true);

  const { data: pageData, isFetching: isPageFetching } = useGetCustomersQuery(
    {
      page: customerPage,
      limit: 30,
      search: customerSearch.trim() || undefined,
    },
    { skip: !hasMore },
  );

  useEffect(() => {
    if (!pageData?.data) return;

    setAccumulatedCustomers((prev) => {
      const newCustomers = pageData.data.filter(
        (newCust) => !prev.some((old) => old.customerId === newCust.customerId),
      );
      return [...prev, ...newCustomers];
    });

    const pagination = pageData.pagination;
    if (
      pageData.data.length < 30 ||
      (pagination && pagination.page >= pagination.totalPages)
    ) {
      setHasMore(false);
    }
  }, [pageData]);

  useEffect(() => {
    setAccumulatedCustomers([]);
    setCustomerPage(1);
    setHasMore(true);
  }, [customerSearch]);

  const customerOptions = useMemo(() => {
    return accumulatedCustomers.map((cust) => ({
      value: cust.customerId,
      label: (
        <div style={{ lineHeight: 1.3 }}>
          <strong>{cust.name || "Unnamed Customer"}</strong>
          {cust.mobileNumber && (
            <span style={{ marginLeft: 8, color: "#555", fontSize: "0.9em" }}>
              {cust.mobileNumber}
            </span>
          )}
          {cust.companyName && (
            <div style={{ fontSize: "0.85em", color: "#777", marginTop: 2 }}>
              {cust.companyName}
            </div>
          )}
        </div>
      ),
      // This controls what is displayed in the input box after selection
      title: `${cust.name || "Unnamed"}${cust.mobileNumber ? ` • ${cust.mobileNumber}` : ""}`,
      searchText:
        `${cust.name || ""} ${cust.mobileNumber || ""} ${cust.email || ""} ${cust.companyName || ""}`.toLowerCase(),
    }));
  }, [accumulatedCustomers]);

  /* ────── Address-related memos ────── */
  const selectedCustomerData = useMemo(
    () => accumulatedCustomers.find((c) => c.customerId === selectedCustomer),
    [accumulatedCustomers, selectedCustomer],
  );

  const defaultAddress = useMemo(() => {
    const billing = addresses.find(
      (a) => a.customerId === selectedCustomer && a.status === "BILLING",
    );
    if (billing) return billing;

    const cust = selectedCustomerData;
    if (!cust?.address) return null;

    let parsed;
    try {
      parsed =
        typeof cust.address === "string"
          ? JSON.parse(cust.address)
          : cust.address;
    } catch {
      return null;
    }

    return {
      street:
        parsed.street === "null" || !parsed.street ? "" : parsed.street.trim(),
      city: parsed.city || "",
      state: parsed.state || "",
      postalCode: parsed.zip || parsed.postalCode || "",
      country: parsed.country || "India",
    };
  }, [addresses, selectedCustomerData, selectedCustomer]);

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
    if (useBillingAddress) {
      if (billingAddressId) return billingAddressId;
      if (isCreatingAddress) return "creating";
      if (defaultAddress && !hasBillingAddress) return "sameAsBilling";
    }
    return quotationData.shipTo;
  }, [
    useBillingAddress,
    billingAddressId,
    isCreatingAddress,
    defaultAddress,
    hasBillingAddress,
    quotationData.shipTo,
  ]);

  /* ────── Totals calculation ────── */
  const amountBeforeGst = useMemo(
    () => subTotal + tax + shipping - discount - extraDiscount,
    [subTotal, tax, shipping, discount, extraDiscount],
  );

  const gstAmount = useMemo(() => {
    if (!gst || gst <= 0) return 0;
    return parseFloat(((amountBeforeGst * gst) / 100).toFixed(2));
  }, [amountBeforeGst, gst]);

  const totalBeforeRoundOff = useMemo(
    () => amountBeforeGst + gstAmount,
    [amountBeforeGst, gstAmount],
  );

  const autoRoundOff = useMemo(() => {
    const rupees = Math.floor(totalBeforeRoundOff);
    const paise = Math.round((totalBeforeRoundOff - rupees) * 100);
    if (paise === 0) return 0;
    if (paise <= 50) return -(paise / 100);
    return (100 - paise) / 100;
  }, [totalBeforeRoundOff]);

  /* ────── Effects ────── */
  useEffect(() => {
    setGst(0);
  }, [setGst]);

  useEffect(() => {
    if (quotationData.discountType !== "fixed") {
      handleQuotationChange("discountType", "fixed");
    }
  }, [quotationData.discountType, handleQuotationChange]);

  /* ────── Follow-up dates handlers ────── */
  const handleFollowup = (index, date) => {
    const dates = [...quotationData.followupDates];
    dates[index] = date ? moment(date).format("YYYY-MM-DD") : "";
    if (
      date &&
      quotationData.dueDate &&
      moment(date).isAfter(quotationData.dueDate)
    ) {
      message.warning("Follow-up date cannot be after due date");
    }
    handleQuotationChange("followupDates", dates);
  };

  const addFollowup = () =>
    handleQuotationChange("followupDates", [
      ...quotationData.followupDates,
      "",
    ]);

  const removeFollowup = (index) =>
    handleQuotationChange(
      "followupDates",
      quotationData.followupDates.filter((_, i) => i !== index),
    );

  /* ────── Render ────── */
  if (!cartItems.length) {
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
    <Row gutter={12}>
      {/* Left Column - Form */}
      <Col xs={24} md={16}>
        <CompactCard title={<Title level={5}>Quotation Checkout</Title>}>
          <Collapse defaultActiveKey={["1", "3"]} ghost>
            {/* Customer & Document Panel */}
            <Panel header="Customer & Document" key="1">
              <TightRow gutter={8}>
                <Col span={8}>
                  <Text strong>Document Type</Text>
                </Col>
                <Col span={16}>
                  <MiniSelect value={documentType} onChange={setDocumentType}>
                    <Option value="Quotation">Quotation</Option>
                    <Option value="Order">Order</Option>
                    {canCreatePurchaseOrder && (
                      <Option value="Purchase Order">Purchase Order</Option>
                    )}
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
                  <Space.Compact style={{ width: "100%" }}>
                    <Select
                      showSearch
                      placeholder="Search by name, phone, email, company..."
                      value={selectedCustomer}
                      onChange={(value) => {
                        setSelectedCustomer(value);
                        setQuotationData((prev) => ({ ...prev, shipTo: null }));
                        setUseBillingAddress(false);
                      }}
                      onSearch={setCustomerSearch}
                      filterOption={(input, option) =>
                        option?.searchText?.includes(input.toLowerCase())
                      }
                      onPopupScroll={(e) => {
                        const target = e.target;
                        if (
                          target.scrollTop + target.offsetHeight >=
                            target.scrollHeight - 60 &&
                          !isPageFetching &&
                          hasMore
                        ) {
                          setCustomerPage((prev) => prev + 1);
                        }
                      }}
                      options={customerOptions}
                      loading={isPageFetching && customerPage === 1}
                      notFoundContent={
                        isPageFetching ? (
                          <Spin size="small" tip="Loading customers..." />
                        ) : (
                          "No customers found"
                        )
                      }
                      dropdownRender={(menu) => (
                        <>
                          {menu}
                          {hasMore && isPageFetching && (
                            <div
                              style={{
                                textAlign: "center",
                                padding: "12px 0",
                                color: "#888",
                              }}
                            >
                              <Spin size="small" /> Loading more customers...
                            </div>
                          )}
                        </>
                      )}
                      style={{ flex: 1 }}
                      allowClear
                      clearIcon={
                        <DeleteOutlined style={{ color: "#ff4d4f" }} />
                      }
                      optionLabelProp="title" // ← This ensures name (+ phone) is shown after selection
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
                  <Text strong>Address</Text>
                </Col>
                <Col span={16}>
                  <Space.Compact>
                    <MiniSelect
                      value={dropdownValue}
                      onChange={(v) => {
                        if (v === "sameAsBilling" || v === "creating") {
                          setUseBillingAddress(true);
                        } else {
                          setUseBillingAddress(false);
                          setBillingAddressId(null);
                          handleQuotationChange("shipTo", v);
                        }
                      }}
                      loading={addressesLoading || isCreatingAddress}
                      disabled={!selectedCustomer}
                      // ────── NEW ──────
                      optionLabelProp="title" // Use short title when selected
                      maxTagCount={1} // Optional: if multiple in future
                      showSearch={false} // Usually not needed for address
                      dropdownMatchSelectWidth={false} // Prevent dropdown from being too narrow
                      popupMatchSelectWidth={300} // Make dropdown wider so full text visible
                      // ────── END NEW ──────
                    >
                      {/* Options with title + label */}
                      {defaultAddress && !hasBillingAddress && (
                        <Option
                          value="sameAsBilling"
                          disabled={isCreatingAddress}
                          title="Use customer's default billing address"
                        >
                          Same as Billing –{" "}
                          {defaultAddress.street?.slice(0, 40)}...
                        </Option>
                      )}

                      {isCreatingAddress && (
                        <Option value="creating" disabled>
                          Creating billing address...
                        </Option>
                      )}

                      {filteredAddresses.map((a) => (
                        <Option
                          key={a.addressId}
                          value={a.addressId}
                          // ────── IMPORTANT: short display + full tooltip ──────
                          title={`${a.street}, ${a.city}, ${a.state || ""} ${a.postalCode || ""} (${a.status})`}
                        >
                          {a.street?.slice(0, 35)}
                          {a.street?.length > 35 ? "..." : ""}, {a.city} (
                          {a.status})
                        </Option>
                      ))}
                    </MiniSelect>
                    <Button
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

            {/* Dates & Discount Panel */}
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
                    placeholderText="DD/MM/YYYY"
                  />
                </Col>
              </TightRow>

              <TightRow gutter={8}>
                <Col span={8}>
                  <Text strong>Follow-ups</Text>
                </Col>
                <Col span={16}>
                  {quotationData.followupDates.map((d, i) => (
                    <Space key={i} style={{ width: "100%", marginBottom: 8 }}>
                      <MiniDate
                        selected={momentToDate(d ? moment(d) : null)}
                        onChange={(date) => handleFollowup(i, date)}
                        minDate={new Date()}
                        dateFormat="dd/MM/yyyy"
                        placeholderText="DD/MM/YYYY"
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

              <TightRow gutter={16} align="middle" style={{ marginTop: 16 }}>
                <Col span={8}>
                  <Text strong>Global Discount</Text>
                </Col>
                <Col span={16}>
                  <Space.Compact style={{ width: "100%" }}>
                    <InputNumber
                      value={quotationData.discountAmount || ""}
                      onChange={(val) =>
                        handleQuotationChange(
                          "discountAmount",
                          val === null ? "" : val.toString(),
                        )
                      }
                      placeholder="500"
                      min={0}
                      precision={2}
                      addonBefore="₹"
                      style={{ width: "100%" }}
                    />
                  </Space.Compact>
                  <Text
                    type="secondary"
                    style={{ fontSize: 11, display: "block", marginTop: 4 }}
                  >
                    Fixed amount discount (applied after subtotal, tax &
                    shipping)
                  </Text>
                </Col>
              </TightRow>
            </Panel>
          </Collapse>
        </CompactCard>
      </Col>

      {/* Right Column - Summary */}
      <Col xs={24} md={8}>
        <CompactCard
          title={<Text strong>Summary</Text>}
          style={{ position: "sticky", top: 16 }}
        >
          <Text strong>#{quotationNumber || "New"}</Text>
          <Divider style={{ margin: "8px 0" }} />

          <OrderTotal
            subTotal={subTotal}
            discount={discount}
            extraDiscount={extraDiscount}
            tax={tax}
            gst={gst}
            gstAmount={gstAmount}
            roundOff={autoRoundOff}
          />

          <Divider style={{ margin: "8px 0" }} />

          <Button
            type="default"
            size="large"
            block
            style={{
              marginBottom: 8,
              background: "#aa0f1f",
              color: "white",
              border: "none",
            }}
            onClick={() => setPreviewVisible(true)}
          >
            Preview Quotation
          </Button>

          <CheckoutBtn
            block
            style={{ marginBottom: 8 }}
            icon={<CheckCircleOutlined />}
            onClick={() => {
              if (!selectedCustomer)
                return message.error("Please select a customer");
              if (!quotationData.dueDate)
                return message.error("Please select due date");

              const hasValidShipping =
                quotationData.shipTo ||
                (useBillingAddress && (billingAddressId || isCreatingAddress));

              if (!hasValidShipping)
                return message.error(
                  "Please select or create shipping address",
                );

              handleCreateDocument();
            }}
          >
            Create {documentType}
          </CheckoutBtn>

          <Button block onClick={() => setActiveTab("cart")}>
            Back to Cart
          </Button>
        </CompactCard>
      </Col>
    </Row>
  );
};

export default React.memo(QuotationForm);
