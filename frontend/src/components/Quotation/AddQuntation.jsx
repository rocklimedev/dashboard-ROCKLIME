// src/components/Quotation/AddQuotation.jsx
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  message,
  Input,
  Select,
  Table,
  InputNumber,
  Space,
  Button,
  Modal,
  Typography,
  Form,
  Card,
  Row,
  Col,
  Spin,
  Divider,
  Statistic,
  Tag,
} from "antd";
import {
  ArrowLeftOutlined,
  PlusOutlined,
  DeleteOutlined,
  SaveOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { debounce } from "lodash";
import { format, isAfter, isBefore, startOfDay } from "date-fns";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { v4 as uuidv4 } from "uuid";

import PageHeader from "../Common/PageHeader";
import {
  useCreateQuotationMutation,
  useGetQuotationByIdQuery,
  useUpdateQuotationMutation,
  useGetQuotationVersionsQuery,
} from "../../api/quotationApi";
import { useSearchProductsQuery } from "../../api/productApi";
import { useGetCustomersQuery } from "../../api/customerApi";
import { useGetAllAddressesQuery } from "../../api/addressApi";
import { useGetProfileQuery } from "../../api/userApi";
import AddAddress from "../Address/AddAddressModal";

const { Text } = Typography;
const { Option } = Select;

const AddQuotation = () => {
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const navigate = useNavigate();

  // ── API Hooks ─────────────────────────────────────────────────────
  const { data: existingQuotation, isLoading: loadingQuotation } =
    useGetQuotationByIdQuery(id, { skip: !isEditMode });

  const { data: versionsData = [] } = useGetQuotationVersionsQuery(id, {
    skip: !isEditMode,
  });

  const { data: userData } = useGetProfileQuery();
  const { data: customersData } = useGetCustomersQuery({ limit: 500 });
  const { data: addressesData, refetch: refetchAddresses } =
    useGetAllAddressesQuery();

  const [createQuotation, { isLoading: isCreating }] =
    useCreateQuotationMutation();
  const [updateQuotation, { isLoading: isUpdating }] =
    useUpdateQuotationMutation();

  // ── Product Search ────────────────────────────────────────────────
  const [searchTerm, setSearchTerm] = useState("");
  const { data: searchResult = [], isFetching: isSearching } =
    useSearchProductsQuery(searchTerm.trim(), {
      skip: searchTerm.trim().length < 2,
    });

  const debouncedSearch = useCallback(
    debounce((value) => setSearchTerm(value.trim()), 400),
    [],
  );

  // ── State ─────────────────────────────────────────────────────────
  const userId = userData?.user?.userId || "system";

  const initialFormData = {
    document_title: "",
    quotation_date: null,
    due_date: null,
    gst: 18,
    shippingAmount: 0,
    extraDiscount: 0,
    extraDiscountType: "fixed",
    signature_name: "",
    signature_image: "",
    customerId: "",
    shipTo: "",
    createdBy: userId,
    products: [],
    followupDates: [],
  };

  const [formData, setFormData] = useState(initialFormData);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [showVersionsModal, setShowVersionsModal] = useState(false);

  // Option modal state
  const [showAddOptionModal, setShowAddOptionModal] = useState(false);
  const [selectedParentId, setSelectedParentId] = useState(null);
  const [optionType, setOptionType] = useState("addon");

  // ── Helpers ───────────────────────────────────────────────────────
  const safeNum = (val, fallback = 0) =>
    Number.isFinite(Number(val)) ? Number(val) : fallback;

  const safeJsonParse = (value, fallback = []) => {
    if (Array.isArray(value)) return value;
    if (!value) return fallback;
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : fallback;
    } catch {
      return fallback;
    }
  };

  // ── Load existing quotation ───────────────────────────────────────
  useEffect(() => {
    if (!isEditMode || !existingQuotation) return;

    const parsedProducts = safeJsonParse(existingQuotation.products, []);

    const mappedProducts = parsedProducts.map((p) => ({
      productId: p.productId,
      name: p.name || "Unknown",
      qty: safeNum(p.quantity ?? p.qty, 1),
      sellingPrice: safeNum(p.price ?? p.sellingPrice, 0),
      discount: safeNum(p.discount, 0),
      discountType: p.discountType || "fixed",
      tax: safeNum(p.tax, 0),
      isOptionFor: p.isOptionFor || null,
      optionType: p.optionType || null,
      groupId: p.groupId || null,
    }));

    setFormData({
      ...initialFormData,
      quotationId: id,
      document_title: existingQuotation.document_title || "",
      quotation_date: existingQuotation.quotation_date
        ? new Date(existingQuotation.quotation_date)
        : null,
      due_date: existingQuotation.due_date
        ? new Date(existingQuotation.due_date)
        : null,
      gst: safeNum(existingQuotation.gst, 18),
      shippingAmount: safeNum(existingQuotation.shippingAmount, 0),
      extraDiscount: safeNum(existingQuotation.extraDiscount, 0),
      extraDiscountType: existingQuotation.extraDiscountType || "fixed",
      signature_name: existingQuotation.signature_name || "",
      signature_image: existingQuotation.signature_image || "",
      customerId: existingQuotation.customerId || "",
      shipTo: existingQuotation.shipTo || "",
      createdBy: userId,
      products: mappedProducts,
      followupDates: safeJsonParse(existingQuotation.followupDates, [])
        .map((d) => (d ? new Date(d) : null))
        .filter(Boolean),
    });
  }, [isEditMode, existingQuotation, userId]);

  // ── Memoized data ─────────────────────────────────────────────────
  const { mainProducts, groupedItems } = useMemo(() => {
    const main = [];
    const groups = {};

    formData.products.forEach((p) => {
      const gid = p.groupId || "ungrouped";
      if (!groups[gid]) groups[gid] = { main: null, options: [] };

      if (!p.isOptionFor) {
        main.push(p);
        groups[gid].main = p;
      } else {
        groups[gid].options.push(p);
      }
    });

    return {
      mainProducts: main,
      groupedItems: Object.values(groups),
    };
  }, [formData.products]);

  // ── Calculations (only main items affect final amount) ────────────
  const calculations = useMemo(() => {
    let mainSubtotal = 0;
    let mainLineDiscount = 0;

    mainProducts.forEach((p) => {
      const qty = safeNum(p.qty, 1);
      const price = safeNum(p.sellingPrice, 0);
      const disc = safeNum(p.discount, 0);
      const discType = p.discountType || "fixed";

      const lineDisc =
        discType === "percent" ? (price * qty * disc) / 100 : disc * qty;
      const lineNet = price * qty - lineDisc;

      mainSubtotal += lineNet;
      mainLineDiscount += lineDisc;
    });

    let optionalPotential = 0;
    formData.products.forEach((p) => {
      if (p.isOptionFor) {
        optionalPotential += safeNum(p.sellingPrice, 0) * safeNum(p.qty, 1);
      }
    });

    const extraDiscValue = safeNum(formData.extraDiscount, 0);
    const extraDiscAmt =
      formData.extraDiscountType === "percent"
        ? (mainSubtotal * extraDiscValue) / 100
        : extraDiscValue;

    const afterExtra = mainSubtotal - extraDiscAmt;
    const gstRate = safeNum(formData.gst, 0);
    const gstAmt = afterExtra * (gstRate / 100);
    const shipping = safeNum(formData.shippingAmount, 0);
    const totalBeforeRound = afterExtra + gstAmt + shipping;

    const rounded = Math.round(totalBeforeRound);
    const roundOff = rounded - totalBeforeRound;

    return {
      mainSubtotal: Number(mainSubtotal.toFixed(2)),
      mainLineDiscount: Number(mainLineDiscount.toFixed(2)),
      extraDiscAmt: Number(extraDiscAmt.toFixed(2)),
      gstAmt: Number(gstAmt.toFixed(2)),
      shipping,
      roundOff: Number(roundOff.toFixed(2)),
      finalAmount: Number(rounded.toFixed(0)),
      optionalPotential: Number(optionalPotential.toFixed(2)),
    };
  }, [
    mainProducts,
    formData.products,
    formData.gst,
    formData.shippingAmount,
    formData.extraDiscount,
    formData.extraDiscountType,
  ]);

  // ── Product Handlers ──────────────────────────────────────────────
  const addProduct = (productId) => {
    const prod = searchResult.find((p) => (p.id || p.productId) === productId);
    if (!prod) return message.warning("Product not found");

    if (formData.products.some((item) => item.productId === productId)) {
      return message.info("Product already added");
    }

    const price = safeNum(
      prod.meta?.["9ba862ef-f993-4873-95ef-1fef10036aa5"],
      0,
    );

    const newGroupId = `grp-${uuidv4().slice(0, 8)}`;

    setFormData((prev) => ({
      ...prev,
      products: [
        ...prev.products,
        {
          productId: prod.id || prod.productId,
          name: prod.name || "Unknown",
          qty: 1,
          sellingPrice: price,
          discount: 0,
          discountType: "fixed",
          tax: 0,
          isOptionFor: null,
          optionType: null,
          groupId: newGroupId,
        },
      ],
    }));

    setSearchTerm("");
  };

  const addOption = (productId) => {
    if (!selectedParentId) return message.error("Select a main product first");

    const prod = searchResult.find((p) => (p.id || p.productId) === productId);
    if (!prod) return message.warning("Product not found");

    const parent = formData.products.find(
      (p) => p.productId === selectedParentId && !p.isOptionFor,
    );

    if (!parent) return message.error("Parent product not found");

    const price = safeNum(
      prod.meta?.["9ba862ef-f993-4873-95ef-1fef10036aa5"],
      0,
    );

    setFormData((prev) => ({
      ...prev,
      products: [
        ...prev.products,
        {
          productId: prod.id || prod.productId,
          name: prod.name || "Unknown",
          qty: 1,
          sellingPrice: price,
          discount: 0,
          discountType: "fixed",
          tax: 0,
          isOptionFor: selectedParentId,
          optionType,
          groupId: parent.groupId,
        },
      ],
    }));

    setShowAddOptionModal(false);
    setSearchTerm("");
    message.success(`Added ${optionType}`);
  };

  const removeProduct = (productId) => {
    setFormData((prev) => {
      const product = prev.products.find((p) => p.productId === productId);
      let updated = prev.products.filter((p) => p.productId !== productId);

      // Remove options if this was a main product
      if (product && !product.isOptionFor) {
        updated = updated.filter((p) => p.isOptionFor !== productId);
      }

      return { ...prev, products: updated };
    });
  };

  const updateProductField = (productId, field, value) => {
    setFormData((prev) => ({
      ...prev,
      products: prev.products.map((p) =>
        p.productId === productId ? { ...p, [field]: value } : p,
      ),
    }));
  };

  // ── Follow-up dates handlers ──────────────────────────────────────
  const addFollowup = () => {
    setFormData((prev) => ({
      ...prev,
      followupDates: [...prev.followupDates, null],
    }));
  };

  const removeFollowup = (index) => {
    setFormData((prev) => ({
      ...prev,
      followupDates: prev.followupDates.filter((_, i) => i !== index),
    }));
  };

  const changeFollowup = (index, date) => {
    setFormData((prev) => {
      const dates = [...prev.followupDates];
      dates[index] = date;
      return { ...prev, followupDates: dates };
    });
  };

  // ── Submit Handler ────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!formData.customerId) return message.error("Please select customer");
    if (formData.products.length === 0)
      return message.error("Add at least one product");

    const payloadProducts = formData.products.map((p) => {
      const qty = safeNum(p.qty, 1);
      const price = safeNum(p.sellingPrice, 0);
      const disc = safeNum(p.discount, 0);
      const discType = p.discountType || "fixed";
      const tax = safeNum(p.tax, 0);

      const discAmt =
        discType === "percent" ? (price * qty * disc) / 100 : disc * qty;
      const taxable = price * qty - discAmt;
      const lineTotal = taxable * (1 + tax / 100);

      return {
        productId: p.productId,
        name: p.name,
        price: Number(price.toFixed(2)),
        quantity: qty,
        discount: Number(disc.toFixed(2)),
        discountType: discType,
        tax: Number(tax.toFixed(2)),
        total: Number(lineTotal.toFixed(2)),
        isOptionFor: p.isOptionFor || null,
        optionType: p.optionType || null,
        groupId: p.groupId || null,
      };
    });

    const payload = {
      ...formData,
      quotation_date: formData.quotation_date
        ? format(formData.quotation_date, "yyyy-MM-dd")
        : null,
      due_date: formData.due_date
        ? format(formData.due_date, "yyyy-MM-dd")
        : null,
      gst: safeNum(formData.gst),
      shippingAmount: safeNum(formData.shippingAmount),
      extraDiscount: safeNum(formData.extraDiscount),
      extraDiscountType: formData.extraDiscountType || "fixed",
      roundOff: calculations.roundOff,
      finalAmount: calculations.finalAmount,
      products: payloadProducts,
      followupDates: formData.followupDates
        .filter(Boolean)
        .map((d) => format(d, "yyyy-MM-dd")),
      shipTo: formData.shipTo || null,
    };

    try {
      if (isEditMode) {
        await updateQuotation({ id, updatedQuotation: payload }).unwrap();
        message.success("Quotation updated successfully");
      } else {
        await createQuotation(payload).unwrap();
        message.success("Quotation created successfully");
        setFormData(initialFormData);
      }
      navigate("/quotations/list");
    } catch (err) {
      message.error(err?.data?.message || "Failed to save quotation");
    }
  };

  // ── Table Columns ─────────────────────────────────────────────────
  const columns = [
    {
      title: "Type",
      width: 120,
      render: (_, record) => {
        if (!record.isOptionFor) return <Tag color="blue">Main</Tag>;

        const colors = {
          variant: "purple",
          upgrade: "geekblue",
          addon: "green",
        };

        return (
          <Tag color={colors[record.optionType] || "default"}>
            {record.optionType || "Option"}
          </Tag>
        );
      },
    },
    {
      title: "Product / Option",
      dataIndex: "name",
      key: "name",
      render: (text, record) => {
        const indent = record.isOptionFor ? 32 : 0;
        return (
          <div style={{ paddingLeft: indent }}>
            {record.isOptionFor && (
              <Text type="secondary" style={{ marginRight: 8 }}>
                ↳
              </Text>
            )}
            {text}
          </div>
        );
      },
    },
    {
      title: "Qty",
      width: 90,
      render: (_, record) => (
        <InputNumber
          min={1}
          value={record.qty}
          onChange={(v) => updateProductField(record.productId, "qty", v)}
        />
      ),
    },
    {
      title: "Price (₹)",
      width: 110,
      render: (_, r) => safeNum(r.sellingPrice, 0).toFixed(2),
    },
    {
      title: "Disc",
      width: 160,
      render: (_, r) => (
        <Space.Compact>
          <InputNumber
            min={0}
            value={r.discount}
            onChange={(v) => updateProductField(r.productId, "discount", v)}
            style={{ width: 90 }}
          />
          <Select
            value={r.discountType || "fixed"}
            onChange={(v) => updateProductField(r.productId, "discountType", v)}
            style={{ width: 70 }}
          >
            <Option value="fixed">₹</Option>
            <Option value="percent">%</Option>
          </Select>
        </Space.Compact>
      ),
    },
    {
      title: "Tax %",
      width: 90,
      render: (_, r) => (
        <InputNumber
          min={0}
          max={100}
          value={r.tax}
          onChange={(v) => updateProductField(r.productId, "tax", v)}
        />
      ),
    },
    {
      title: "Line Total",
      render: (_, r) => {
        const qty = safeNum(r.qty, 1);
        const price = safeNum(r.sellingPrice, 0);
        const disc = safeNum(r.discount, 0);
        const discType = r.discountType || "fixed";
        const tax = safeNum(r.tax, 0);

        const discAmt =
          discType === "percent" ? (price * qty * disc) / 100 : disc * qty;
        const taxable = price * qty - discAmt;
        const lineTotal = taxable * (1 + tax / 100);

        return lineTotal.toFixed(2);
      },
    },
    {
      title: "",
      width: 60,
      render: (_, r) => (
        <Button
          danger
          size="small"
          icon={<DeleteOutlined />}
          onClick={() => removeProduct(r.productId)}
        />
      ),
    },
  ];

  if (loadingQuotation) {
    return (
      <Spin
        tip="Loading quotation..."
        size="large"
        style={{ margin: "120px auto", display: "block" }}
      />
    );
  }

  return (
    <div className="page-wrapper">
      <div className="content">
        <PageHeader
          title={isEditMode ? "Edit Quotation" : "Create Quotation"}
          subtitle="Fill in all quotation details"
        />

        <Space style={{ marginBottom: 24 }}>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate("/quotations/list")}
          >
            Back
          </Button>
          {isEditMode && versionsData.length > 0 && (
            <Button onClick={() => setShowVersionsModal(true)}>
              Versions ({versionsData.length})
            </Button>
          )}
        </Space>

        <Form layout="vertical">
          {/* Customer & Shipping */}
          <Card title="Customer & Shipping" style={{ marginBottom: 24 }}>
            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item label="Customer *" required>
                  <Select
                    showSearch
                    value={formData.customerId}
                    onChange={(v) =>
                      setFormData({ ...formData, customerId: v, shipTo: "" })
                    }
                    placeholder="Select customer"
                    filterOption={(input, option) =>
                      option.children
                        .toLowerCase()
                        .includes(input.toLowerCase())
                    }
                  >
                    {(customersData?.data || []).map((c) => (
                      <Option key={c.customerId} value={c.customerId}>
                        {c.name}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item label="Shipping Address">
                  <Space.Compact style={{ width: "100%" }}>
                    <Select
                      placeholder="Select or add address"
                      value={formData.shipTo}
                      onChange={(v) => setFormData({ ...formData, shipTo: v })}
                      disabled={!formData.customerId}
                      style={{ flex: 1 }}
                    >
                      {(addressesData || [])
                        .filter((a) => a.customerId === formData.customerId)
                        .map((a) => (
                          <Option key={a.addressId} value={a.addressId}>
                            {a.street}, {a.city}, {a.state}
                          </Option>
                        ))}
                    </Select>
                    <Button
                      type="primary"
                      icon={<PlusOutlined />}
                      onClick={() => setShowAddressModal(true)}
                      disabled={!formData.customerId}
                    />
                  </Space.Compact>
                </Form.Item>
              </Col>
            </Row>
          </Card>

          {/* Quotation Details */}
          <Card title="Quotation Details" style={{ marginBottom: 24 }}>
            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item label="Title *" required>
                  <Input
                    value={formData.document_title}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        document_title: e.target.value,
                      })
                    }
                    placeholder="e.g. Bathroom Fittings Quotation"
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item label="Quotation Number">
                  <Input value="Auto-generated" disabled />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col xs={24} md={8}>
                <Form.Item label="Quotation Date *" required>
                  <DatePicker
                    selected={formData.quotation_date}
                    onChange={(d) =>
                      setFormData({ ...formData, quotation_date: d })
                    }
                    dateFormat="dd/MM/yyyy"
                    className="ant-input"
                    wrapperClassName="full-width"
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={8}>
                <Form.Item label="Due Date *" required>
                  <DatePicker
                    selected={formData.due_date}
                    onChange={(d) => setFormData({ ...formData, due_date: d })}
                    dateFormat="dd/MM/yyyy"
                    minDate={formData.quotation_date}
                    className="ant-input"
                    wrapperClassName="full-width"
                  />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item label="Follow-up Dates">
              <Space direction="vertical" style={{ width: "100%" }}>
                {formData.followupDates.map((date, i) => (
                  <Space key={i} align="center">
                    <DatePicker
                      selected={date}
                      onChange={(d) => changeFollowup(i, d)}
                      dateFormat="dd/MM/yyyy"
                      minDate={new Date()}
                      maxDate={formData.due_date}
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
                  type="dashed"
                  block
                  icon={<PlusOutlined />}
                  onClick={addFollowup}
                >
                  Add Follow-up Date
                </Button>
              </Space>
            </Form.Item>
          </Card>

          {/* Products & Options */}
          <Card
            title="Products & Options"
            style={{ marginBottom: 24 }}
            extra={
              <Space>
                <Select
                  showSearch
                  prefix={<SearchOutlined />}
                  placeholder="Add main product..."
                  value={null}
                  onSearch={debouncedSearch}
                  onChange={addProduct}
                  filterOption={false}
                  notFoundContent={
                    isSearching ? (
                      <Spin size="small" />
                    ) : searchTerm ? (
                      "No products found"
                    ) : (
                      "Search products"
                    )
                  }
                  style={{ width: 380 }}
                >
                  {searchResult.map((p) => {
                    const price = safeNum(
                      p.meta?.["9ba862ef-f993-4873-95ef-1fef10036aa5"],
                      0,
                    );
                    return (
                      <Option
                        key={p.id || p.productId}
                        value={p.id || p.productId}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                          }}
                        >
                          <div>
                            <strong>{p.name}</strong>
                            <div style={{ fontSize: "0.9em", color: "#666" }}>
                              {p.product_code || "—"}
                            </div>
                          </div>
                          <div style={{ color: "#52c41a" }}>
                            ₹{price.toFixed(2)}
                          </div>
                        </div>
                      </Option>
                    );
                  })}
                </Select>

                {mainProducts.length > 0 && (
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => setShowAddOptionModal(true)}
                  >
                    Add Option
                  </Button>
                )}
              </Space>
            }
          >
            <Table
              columns={columns}
              dataSource={formData.products}
              rowKey={(record) => record.productId}
              pagination={false}
              scroll={{ y: 400 }}
              locale={{ emptyText: "No products added yet" }}
            />
          </Card>

          {/* Financial Summary */}
          <Card title="Financial Summary" style={{ marginBottom: 32 }}>
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={6}>
                <Statistic
                  title="Main Subtotal"
                  value={calculations.mainSubtotal}
                  precision={2}
                  prefix="₹"
                />
              </Col>
              <Col xs={24} sm={6}>
                <Statistic
                  title="Line Discounts"
                  value={-calculations.mainLineDiscount}
                  precision={2}
                  prefix="₹"
                  valueStyle={{ color: "#f5222d" }}
                />
              </Col>
              <Col xs={24} sm={6}>
                <Statistic
                  title="Extra Discount"
                  value={-calculations.extraDiscAmt}
                  precision={2}
                  prefix="₹"
                  valueStyle={{ color: "#fa8c16" }}
                />
              </Col>
              <Col xs={24} sm={6}>
                <Statistic
                  title="GST"
                  value={calculations.gstAmt}
                  precision={2}
                  prefix="₹"
                />
              </Col>

              <Divider />

              <Col xs={24} sm={8}>
                <Form.Item label="GST Rate (%)">
                  <InputNumber
                    min={0}
                    max={100}
                    step={0.1}
                    value={formData.gst}
                    onChange={(v) => setFormData({ ...formData, gst: v })}
                    style={{ width: "100%" }}
                    addonAfter="%"
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={8}>
                <Form.Item label="Shipping">
                  <InputNumber
                    min={0}
                    value={formData.shippingAmount}
                    onChange={(v) =>
                      setFormData({ ...formData, shippingAmount: v })
                    }
                    style={{ width: "100%" }}
                    addonBefore="₹"
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={8}>
                <Form.Item label="Round Off">
                  <InputNumber
                    disabled
                    value={calculations.roundOff}
                    style={{ width: "100%" }}
                  />
                </Form.Item>
              </Col>

              <Col xs={24}>
                <Statistic
                  title="FINAL AMOUNT (Main items only)"
                  value={calculations.finalAmount}
                  precision={0}
                  prefix="₹"
                  valueStyle={{
                    color: "#1890ff",
                    fontSize: 36,
                    fontWeight: "bold",
                  }}
                />
              </Col>

              {calculations.optionalPotential > 0 && (
                <Col xs={24}>
                  <Statistic
                    title="Optional Items Potential"
                    value={calculations.optionalPotential}
                    precision={2}
                    prefix="₹"
                    valueStyle={{ color: "#722ed1" }}
                  />
                  <Text type="secondary">(not included in final amount)</Text>
                </Col>
              )}
            </Row>
          </Card>

          {/* Signature */}
          <Card title="Authorized Signature" style={{ marginBottom: 32 }}>
            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item label="Name">
                  <Input
                    value={formData.signature_name}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        signature_name: e.target.value,
                      })
                    }
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item label="Signature Image URL">
                  <Input
                    value={formData.signature_image}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        signature_image: e.target.value,
                      })
                    }
                  />
                </Form.Item>
              </Col>
            </Row>
          </Card>

          {/* Actions */}
          <div style={{ textAlign: "right", marginTop: 40 }}>
            <Space size="large">
              <Button size="large" onClick={() => navigate("/quotations/list")}>
                Cancel
              </Button>
              <Button
                type="primary"
                icon={<SaveOutlined />}
                size="large"
                loading={isCreating || isUpdating}
                onClick={handleSubmit}
                disabled={
                  !formData.customerId || formData.products.length === 0
                }
              >
                {isEditMode ? "Update Quotation" : "Create Quotation"}
              </Button>
            </Space>
          </div>
        </Form>

        {/* Modals */}
        {showAddressModal && (
          <AddAddress
            onClose={() => setShowAddressModal(false)}
            onSave={(addrId) => {
              setFormData((prev) => ({ ...prev, shipTo: addrId }));
              setShowAddressModal(false);
              refetchAddresses();
            }}
            selectedCustomer={formData.customerId}
          />
        )}

        <Modal
          title="Add Option / Variant / Upgrade"
          open={showAddOptionModal}
          onCancel={() => setShowAddOptionModal(false)}
          footer={null}
          width={600}
        >
          <Space direction="vertical" style={{ width: "100%" }} size="large">
            <div>
              <label style={{ display: "block", marginBottom: 8 }}>
                Select parent product:
              </label>
              <Select
                value={selectedParentId}
                onChange={setSelectedParentId}
                style={{ width: "100%" }}
                placeholder="Choose main product"
              >
                {mainProducts.map((p) => (
                  <Option key={p.productId} value={p.productId}>
                    {p.name} — ₹{safeNum(p.sellingPrice, 0).toFixed(2)}
                  </Option>
                ))}
              </Select>
            </div>

            <div>
              <label style={{ display: "block", marginBottom: 8 }}>
                Option type:
              </label>
              <Select
                value={optionType}
                onChange={setOptionType}
                style={{ width: "100%" }}
              >
                <Option value="addon">Add-on (adds to total)</Option>
                <Option value="upgrade">Upgrade (extra cost)</Option>
                <Option value="variant">Variant (alternative)</Option>
              </Select>
            </div>

            <div>
              <label style={{ display: "block", marginBottom: 8 }}>
                Search product:
              </label>
              <Select
                showSearch
                prefix={<SearchOutlined />}
                placeholder={`Search ${optionType}...`}
                onSearch={debouncedSearch}
                onChange={addOption}
                filterOption={false}
                notFoundContent={
                  isSearching ? (
                    <Spin size="small" />
                  ) : searchTerm ? (
                    "No results"
                  ) : (
                    "Type to search"
                  )
                }
                style={{ width: "100%" }}
              >
                {searchResult.map((p) => {
                  const price = safeNum(
                    p.meta?.["9ba862ef-f993-4873-95ef-1fef10036aa5"],
                    0,
                  );
                  return (
                    <Option
                      key={p.id || p.productId}
                      value={p.id || p.productId}
                    >
                      {p.name} — ₹{price.toFixed(2)}
                    </Option>
                  );
                })}
              </Select>
            </div>
          </Space>
        </Modal>
      </div>

      {/* DatePicker Styles */}
      <style jsx>{`
        .full-width > div {
          width: 100% !important;
        }
        .react-datepicker-wrapper,
        .react-datepicker__input-container {
          width: 100%;
        }
        .react-datepicker__input-container input {
          width: 100%;
          height: 32px;
          padding: 4px 11px;
          border: 1px solid #d9d9d9;
          border-radius: 6px;
        }
        .react-datepicker__input-container input:focus {
          border-color: #40a9ff;
          box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
        }
      `}</style>
    </div>
  );
};

export default AddQuotation;
