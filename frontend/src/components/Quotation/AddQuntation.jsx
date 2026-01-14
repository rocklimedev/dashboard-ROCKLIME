import React, { useState, useEffect, useCallback } from "react";
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
  List,
  Typography,
  Form,
  Card,
  Row,
  Spin,
  Col,
} from "antd";
import {
  SearchOutlined,
  ArrowLeftOutlined as ArrowLeftOutlined,
  PlusOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import { debounce } from "lodash";
import { format, isAfter, isBefore, startOfDay } from "date-fns";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

import PageHeader from "../Common/PageHeader";
import {
  useCreateQuotationMutation,
  useGetQuotationByIdQuery,
  useUpdateQuotationMutation,
  useGetQuotationVersionsQuery,
  useRestoreQuotationVersionMutation,
} from "../../api/quotationApi";
import { useGetAllProductsQuery } from "../../api/productApi";
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

  /* ────────────────────── QUERIES ────────────────────── */
  const { data: existingQuotation } = useGetQuotationByIdQuery(id, {
    skip: !isEditMode,
  });

  const { data: versionsData = [], refetch: refetchVersions } =
    useGetQuotationVersionsQuery(id, { skip: !isEditMode });

  const { data: userData } = useGetProfileQuery();
  const { data: customersData } = useGetCustomersQuery();
  const { data: addressesData, refetch: refetchAddresses } =
    useGetAllAddressesQuery();
  const { data: productsData } = useGetAllProductsQuery();

  const [createQuotation, { isLoading: isCreating }] =
    useCreateQuotationMutation();
  const [updateQuotation, { isLoading: isUpdating }] =
    useUpdateQuotationMutation();
  const [restoreVersion, { isLoading: isRestoring }] =
    useRestoreQuotationVersionMutation();

  /* ────────────────────── DATA ────────────────────── */
  const userId = userData?.user?.userId || "nill";
  const customers = customersData?.data || [];
  const addresses = Array.isArray(addressesData) ? addressesData : [];
  const products = productsData?.data || [];
  const versions = versionsData || [];

  /* ────────────────────── STATE ────────────────────── */
  const initialFormData = {
    document_title: "",
    quotation_date: null,
    due_date: null,
    reference_number: "",
    gst: null,
    shippingAmount: 0.0,
    extraDiscount: null,
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
  const [productSearch, setProductSearch] = useState("");
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [showVersionsModal, setShowVersionsModal] = useState(false);

  const [form] = Form.useForm();

  /* ────────────────────── HELPERS ────────────────────── */
  const safeJsonParse = (str, fallback = []) => {
    if (!str) return fallback;
    if (Array.isArray(str)) return str;
    if (typeof str !== "string") return fallback;
    try {
      const parsed = JSON.parse(str);
      return Array.isArray(parsed) ? parsed : fallback;
    } catch {
      return fallback;
    }
  };

  /* ────────────────────── EFFECTS ────────────────────── */
  useEffect(() => {
    if (isEditMode && existingQuotation) {
      const parsedProducts = safeJsonParse(existingQuotation.products, []);
      const parsedFollowup = safeJsonParse(existingQuotation.followupDates, []);

      const mapped = parsedProducts.map((p) => {
        const prod = products.find(
          (pr) => (pr.id || pr.productId) === p.productId
        );
        const price =
          Number(prod?.meta?.["9ba862ef-f993-4873-95ef-1fef10036aa5"]) || 0;

        return {
          id: p.productId,
          productId: p.productId,
          name: prod?.name || p.name || "Unknown",
          qty: Number(p.quantity) || 1,
          sellingPrice: price,
          discount: Number(p.discount) || 0,
          discountType: "fixed",
          tax: Number(p.tax) || 0,
          total: null,
        };
      });

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
        reference_number: existingQuotation.reference_number || "",
        gst: existingQuotation.gst ?? null,
        shippingAmount: existingQuotation.shippingAmount ?? 0.0,
        extraDiscount: existingQuotation.extraDiscount ?? null,
        extraDiscountType: existingQuotation.extraDiscountType || "fixed",
        discountAmount: existingQuotation.discountAmount ?? 0.0,
        roundOff: existingQuotation.roundOff ?? 0.0,
        finalAmount: existingQuotation.finalAmount ?? 0.0,
        signature_name: existingQuotation.signature_name || "",
        signature_image: existingQuotation.signature_image || "",
        customerId: existingQuotation.customerId || "",
        shipTo: existingQuotation.shipTo || "",
        createdBy: userId,
        products: mapped,
        followupDates: parsedFollowup
          .map((d) => (d ? new Date(d) : null))
          .filter(Boolean),
      });
    }
  }, [existingQuotation, isEditMode, products, userId]);

  const debouncedSearch = useCallback(
    debounce((val) => {
      if (!val) {
        setFilteredProducts([]);
        return;
      }
      const term = val.toLowerCase().trim();
      const filtered = products
        .filter((p) => {
          const name = p.name?.toLowerCase().includes(term);
          const code = p.product_code?.toLowerCase().includes(term);
          const companyCode =
            p.meta?.["d11da9f9-3f2e-4536-8236-9671200cca4a"] ||
            p.metaDetails?.find((m) => m.slug === "companyCode")?.value ||
            "";
          const cc = String(companyCode).toLowerCase().includes(term);
          return name || code || cc;
        })
        .slice(0, 8);
      setFilteredProducts(filtered);
    }, 300),
    [products]
  );

  /* ────────────────────── PRODUCT HANDLERS ────────────────────── */
  const addProduct = (productId) => {
    if (!productId) return;

    const prod = products.find((p) => (p.id || p.productId) === productId);
    if (!prod) {
      message.warning("Product not found – possibly still loading");
      return;
    }

    const price =
      Number(prod.meta?.["9ba862ef-f993-4873-95ef-1fef10036aa5"]) || 0;

    setFormData((prev) => {
      // Optional: prevent duplicate addition
      if (prev.products.some((item) => item.productId === productId)) {
        message.info("Product already added");
        return prev;
      }

      return {
        ...prev,
        products: [
          ...prev.products,
          {
            id: prod.id || prod.productId,
            productId: prod.id || prod.productId,
            name: prod.name || "Unknown",
            qty: 1,
            sellingPrice: price,
            discount: 0,
            discountType: "fixed",
            tax: 0,
            total: price,
          },
        ],
      };
    });

    setProductSearch("");
    setFilteredProducts([]);
  };

  const removeProduct = (idx) => {
    setFormData((prev) => ({
      ...prev,
      products: prev.products.filter((_, i) => i !== idx),
    }));
  };

  const updateProduct = (idx, field, value) => {
    setFormData((prev) => {
      const copy = [...prev.products];
      copy[idx] = { ...copy[idx], [field]: value };
      return { ...prev, products: copy };
    });
  };

  /* ────────────────────── FOLLOW-UP DATES ────────────────────── */
  const addFollowup = () => {
    setFormData((prev) => ({
      ...prev,
      followupDates: [...prev.followupDates, null],
    }));
  };

  const removeFollowup = (i) => {
    setFormData((prev) => ({
      ...prev,
      followupDates: prev.followupDates.filter((_, idx) => idx !== i),
    }));
  };

  const changeFollowup = (i, date) => {
    setFormData((prev) => {
      const copy = [...prev.followupDates];
      copy[i] = date;
      return { ...prev, followupDates: copy };
    });

    if (date && formData.due_date && isAfter(date, formData.due_date)) {
      message.warning("Timeline date cannot be after due date");
    }
    if (date && isBefore(date, startOfDay(new Date()))) {
      message.warning("Timeline date cannot be in the past");
    }
  };

  /* ────────────────────── SUBMIT ────────────────────── */
  const handleSubmit = async () => {
    if (!formData.customerId) return message.error("Select a customer");
    if (!formData.products.length)
      return message.error("Add at least one product");

    const payload = {
      ...formData,
      quotation_date: formData.quotation_date
        ? format(formData.quotation_date, "yyyy-MM-dd")
        : null,
      due_date: formData.due_date
        ? format(formData.due_date, "yyyy-MM-dd")
        : null,
      gst: formData.gst ?? 0,
      shippingAmount: Number(formData.shippingAmount) || 0,
      extraDiscount: Number(formData.extraDiscount) || 0,
      extraDiscountType: formData.extraDiscountType || "fixed",

      products: formData.products.map((p) => {
        const prod = products.find(
          (pr) => (pr.id || pr.productId) === p.productId
        );

        // Extract first image
        let imageUrl = null;
        if (prod?.images) {
          if (typeof prod.images === "string") {
            if (
              prod.images.trim().startsWith("[") ||
              prod.images.trim().startsWith("{")
            ) {
              try {
                imageUrl = JSON.parse(prod.images)[0];
              } catch {
                imageUrl = prod.images.trim();
              }
            } else {
              imageUrl = prod.images.trim();
            }
          } else if (Array.isArray(prod.images)) {
            imageUrl = prod.images[0];
          }
        }

        const price = Number(p.sellingPrice) || 0;
        const qty = Number(p.qty) || 1;
        const discount = Number(p.discount) || 0;
        const discountType = p.discountType || "fixed";
        const taxRate = Number(p.tax) || 0;

        const discountAmt =
          discountType === "percent"
            ? (price * qty * discount) / 100
            : discount;

        const taxable = price * qty - discountAmt;
        const lineTotal = taxable * (1 + taxRate / 100);

        return {
          productId: p.productId,
          name: p.name,
          price: Number(p.sellingPrice || 0).toFixed(2),
          quantity: qty,
          discount,
          discountType,
          tax: taxRate,
          total: parseFloat(lineTotal.toFixed(2)),
          imageUrl,
        };
      }),

      followupDates: formData.followupDates
        .filter(Boolean)
        .map((d) => format(d, "yyyy-MM-dd")),
      shipTo: formData.shipTo || null,
    };

    try {
      if (isEditMode) {
        await updateQuotation({ id, updatedQuotation: payload }).unwrap();
      } else {
        await createQuotation(payload).unwrap();
        setFormData({ ...initialFormData, createdBy: userId });
      }
      message.success("Quotation saved");
      navigate("/quotations/list");
    } catch (e) {
      message.error(e.data?.message || "Failed to save");
    }
  };

  /* ────────────────────── TABLE COLUMNS ────────────────────── */
  const columns = [
    { title: "Product", dataIndex: "name", key: "name", width: 180 },
    {
      title: "Qty",
      key: "qty",
      width: 80,
      render: (_, __, idx) => (
        <InputNumber
          min={1}
          size="small"
          value={formData.products[idx].qty}
          onChange={(v) => updateProduct(idx, "qty", v)}
        />
      ),
    },
    {
      title: "Price (₹)",
      dataIndex: "sellingPrice",
      key: "price",
      width: 100,
      render: (v) => Number(v).toFixed(2),
    },
    {
      title: "Disc (₹)",
      key: "discount",
      width: 140,
      render: (_, __, idx) => {
        const prod = formData.products[idx];
        return (
          <Space.Compact style={{ width: "100%" }}>
            <InputNumber
              min={0}
              size="small"
              value={prod.discount}
              onChange={(v) => updateProduct(idx, "discount", v)}
              style={{ width: 80 }}
            />
            <Select
              size="small"
              value={prod.discountType || "fixed"}
              onChange={(v) => updateProduct(idx, "discountType", v)}
              style={{ width: 60 }}
            >
              <Option value="fixed">₹</Option>
              <Option value="percent">%</Option>
            </Select>
          </Space.Compact>
        );
      },
    },
    {
      title: "Effective Disc (₹)",
      key: "effectiveDisc",
      width: 110,
      render: (_, __, idx) => {
        const p = formData.products[idx];
        const qty = Number(p.qty) || 1;
        const price = Number(p.sellingPrice) || 0;
        const discRaw = Number(p.discount) || 0;
        const disc =
          p.discountType === "percent"
            ? (qty * price * discRaw) / 100
            : discRaw;
        return Number(disc).toFixed(2);
      },
    },
    {
      title: "Tax (%)",
      key: "tax",
      width: 80,
      render: (_, __, idx) => (
        <InputNumber
          min={0}
          size="small"
          value={formData.products[idx].tax}
          onChange={(v) => updateProduct(idx, "tax", v)}
        />
      ),
    },
    {
      title: "Line Total (₹)",
      key: "total",
      render: (_, __, idx) => {
        const p = formData.products[idx];
        const qty = Number(p.qty) || 1;
        const price = Number(p.sellingPrice) || 0;
        const discRaw = Number(p.discount) || 0;
        const discType = p.discountType || "fixed";
        const taxRate = Number(p.tax) || 0;

        const discountAmt =
          discType === "percent" ? (price * qty * discRaw) / 100 : discRaw;

        const taxable = price * qty - discountAmt;
        const total = taxable * (1 + taxRate / 100);

        return total.toFixed(2);
      },
    },
    {
      title: "",
      key: "action",
      width: 50,
      render: (_, __, idx) => (
        <Button
          danger
          size="small"
          icon={<DeleteOutlined />}
          onClick={() => removeProduct(idx)}
        />
      ),
    },
  ];

  /* ────────────────────── RENDER ────────────────────── */
  return (
    <div className="page-wrapper">
      <div className="content">
        <PageHeader
          title={isEditMode ? "Edit Quotation" : "Create Quotation"}
          subtitle="Fill the details below"
          exportOptions={{ pdf: false, excel: false }}
        />

        <Space style={{ marginBottom: 16 }}>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate("/quotations/list")}
          >
            Back
          </Button>
          {isEditMode && (
            <Button
              onClick={() => {
                refetchVersions();
                setShowVersionsModal(true);
              }}
            >
              View Versions ({versions.length})
            </Button>
          )}
          <Button
            onClick={() =>
              setFormData({ ...initialFormData, createdBy: userId })
            }
          >
            Clear
          </Button>
        </Space>

        <Form form={form} layout="vertical">
          {/* Customer & Shipping */}
          <Card title="Customer & Shipping" style={{ marginBottom: 16 }}>
            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item label="Customer *" required>
                  <Select
                    showSearch
                    placeholder="Select customer"
                    value={formData.customerId}
                    onChange={(v) =>
                      setFormData({ ...formData, customerId: v, shipTo: "" })
                    }
                    filterOption={(input, opt) =>
                      opt.children.toLowerCase().includes(input.toLowerCase())
                    }
                  >
                    {customers.map((c) => (
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
                      placeholder="Select address"
                      value={formData.shipTo}
                      onChange={(v) => setFormData({ ...formData, shipTo: v })}
                      disabled={!formData.customerId}
                      style={{ flex: 1 }}
                    >
                      {addresses
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
          <Card title="Quotation Details" style={{ marginBottom: 16 }}>
            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item label="Title" required>
                  <Input
                    value={formData.document_title}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        document_title: e.target.value,
                      })
                    }
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item label="Quotation Number #">
                  <Input
                    value={formData.reference_number}
                    readOnly
                    style={{ color: "#000", backgroundColor: "#f5f5f5" }}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item label="Quotation Date" required>
                  <DatePicker
                    selected={formData.quotation_date}
                    onChange={(date) =>
                      setFormData({ ...formData, quotation_date: date })
                    }
                    dateFormat="dd/MM/yyyy"
                    className="ant-input"
                    placeholderText="Select date"
                    wrapperClassName="full-width"
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item label="Due Date" required>
                  <DatePicker
                    selected={formData.due_date}
                    onChange={(date) =>
                      setFormData({ ...formData, due_date: date })
                    }
                    dateFormat="dd/MM/yyyy"
                    className="ant-input"
                    placeholderText="Select date"
                    minDate={formData.quotation_date || new Date()}
                    wrapperClassName="full-width"
                  />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item label="Timeline Dates">
              <Space direction="vertical" style={{ width: "100%" }}>
                {formData.followupDates.map((date, i) => (
                  <Space key={i} align="center">
                    <DatePicker
                      selected={date}
                      onChange={(d) => changeFollowup(i, d)}
                      dateFormat="dd/MM/yyyy"
                      className="ant-input"
                      placeholderText="Select timeline date"
                      minDate={new Date()}
                      maxDate={formData.due_date || undefined}
                      style={{ width: 180 }}
                    />
                    <Button
                      danger
                      size="small"
                      icon={<DeleteOutlined />}
                      onClick={() => removeFollowup(i)}
                    />
                  </Space>
                ))}
                <Button type="dashed" block onClick={addFollowup}>
                  <PlusOutlined /> Add Timeline Date
                </Button>
              </Space>
            </Form.Item>
          </Card>

          {/* Products */}
          <Card
            title="Products"
            style={{ marginBottom: 16 }}
            extra={
              <Select
                showSearch
                placeholder="Search product by name, code or company code..."
                onSearch={debouncedSearch}
                onChange={addProduct}
                value={productSearch || undefined}
                style={{ width: 340 }}
                filterOption={false} // we handle filtering manually
                notFoundContent={
                  productSearch ? (
                    filteredProducts.length === 0 ? (
                      products.length === 0 ? (
                        <span>
                          <Spin size="small" /> Loading products...
                        </span>
                      ) : (
                        "No matching products"
                      )
                    ) : null
                  ) : (
                    "Start typing to search"
                  )
                }
                dropdownRender={(menu) => (
                  <>
                    {menu}
                    {products.length === 0 && productSearch && (
                      <div
                        style={{
                          padding: "8px",
                          textAlign: "center",
                          color: "#888",
                        }}
                      >
                        <Spin size="small" /> Fetching products...
                      </div>
                    )}
                  </>
                )}
                loading={products.length === 0} // optional visual cue
              >
                {filteredProducts.map((p) => {
                  const price = Number(
                    p.meta?.["9ba862ef-f993-4873-95ef-1fef10036aa5"] || 0
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
                        <span>
                          <strong>{p.name}</strong> ({p.product_code || "—"})
                        </span>
                        <span style={{ color: "#52c41a" }}>
                          ₹{price.toFixed(2)}
                        </span>
                      </div>
                      {p.meta?.["d11da9f9-3f2e-4536-8236-9671200cca4a"] && (
                        <div style={{ fontSize: "0.9em", color: "#888" }}>
                          Company:{" "}
                          {p.meta["d11da9f9-3f2e-4536-8236-9671200cca4a"]}
                        </div>
                      )}
                    </Option>
                  );
                })}
              </Select>
            }
          >
            <Table
              columns={columns}
              dataSource={formData.products}
              rowKey={(record) => record.productId || record.id}
              pagination={false}
              scroll={{ y: 300 }} // slightly taller is usually better
              locale={{
                emptyText:
                  products.length === 0 ? (
                    <span>
                      <Spin /> Loading products...
                    </span>
                  ) : (
                    "No products added – search & select above"
                  ),
              }}
            />
          </Card>
          {/* Financials */}
          <Card title="Financials" style={{ marginBottom: 16 }}>
            <Row gutter={16}>
              <Col xs={24} sm={8}>
                <Form.Item label="GST (%)">
                  <InputNumber
                    min={0}
                    max={100}
                    step={0.01}
                    precision={2}
                    style={{ width: "100%" }}
                    value={formData.gst}
                    onChange={(v) => setFormData({ ...formData, gst: v })}
                    addonAfter="%"
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={8}>
                <Form.Item label="Shipping">
                  <InputNumber
                    min={0}
                    step={0.01}
                    precision={2}
                    style={{ width: "100%" }}
                    value={formData.shippingAmount}
                    onChange={(v) =>
                      setFormData({ ...formData, shippingAmount: v })
                    }
                    addonBefore="₹"
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={8}>
                <Form.Item label="Round Off">
                  <InputNumber
                    readOnly
                    style={{ width: "100%", backgroundColor: "#f5f5f5" }}
                    value={formData.roundOff}
                    addonBefore="₹"
                    formatter={(v) => (v >= 0 ? `+${v}` : `${v}`)}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16} style={{ marginTop: 16 }}>
              <Col xs={24} sm={4}>
                <Form.Item label="Extra Discount">
                  <Space.Compact style={{ width: "100%" }}>
                    <InputNumber
                      min={0}
                      step={0.01}
                      precision={2}
                      style={{ width: "70%" }}
                      value={formData.extraDiscount}
                      onChange={(v) =>
                        setFormData({ ...formData, extraDiscount: v })
                      }
                    />
                    <Select
                      style={{ width: "30%" }}
                      value={formData.extraDiscountType}
                      onChange={(v) =>
                        setFormData({ ...formData, extraDiscountType: v })
                      }
                    >
                      <Option value="fixed">₹ Fixed</Option>
                      <Option value="percent">% Percent</Option>
                    </Select>
                  </Space.Compact>
                </Form.Item>
              </Col>

              <Col xs={24} sm={8} offset={12}>
                <Form.Item label="Final Amount (₹)">
                  <InputNumber
                    disabled
                    style={{ width: "100%" }}
                    value={formData.finalAmount}
                    formatter={(value) => `₹ ${value}`}
                  />
                </Form.Item>
              </Col>
            </Row>
          </Card>

          {/* Signature */}
          <Card title="Signature">
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
                <Form.Item label="Image URL">
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

          <Space style={{ marginTop: 24, float: "right" }}>
            <Button onClick={() => navigate("/quotations/list")}>Cancel</Button>
            <Button
              type="primary"
              onClick={handleSubmit}
              loading={isCreating || isUpdating}
              disabled={!formData.customerId || !formData.products.length}
            >
              {isEditMode ? "Update" : "Create"} Quotation
            </Button>
          </Space>
        </Form>

        {/* Address Modal */}
        {showAddressModal && (
          <AddAddress
            onClose={() => setShowAddressModal(false)}
            onSave={(addressId) => {
              setFormData((prev) => ({ ...prev, shipTo: addressId }));
              setShowAddressModal(false);
              refetchAddresses();
            }}
            selectedCustomer={formData.customerId}
          />
        )}

        {/* Version History Modal */}
        <Modal
          title="Version History"
          open={showVersionsModal}
          onCancel={() => setShowVersionsModal(false)}
          footer={null}
          width={800}
        >
          {versions.length === 0 ? (
            <Text type="secondary">No versions found</Text>
          ) : (
            <List
              dataSource={versions}
              renderItem={(v) => (
                <List.Item
                  actions={[
                    <Button
                      type="primary"
                      size="small"
                      onClick={() => {
                        Modal.confirm({
                          title: "Restore Version?",
                          content: `Restore to version ${v.version}? This will overwrite current quotation.`,
                          onOk: () =>
                            restoreVersion({ id, version: v.version }),
                        });
                      }}
                      loading={isRestoring}
                    >
                      Restore
                    </Button>,
                  ]}
                >
                  <List.Item.Meta
                    title={<strong>Version {v.version}</strong>}
                    description={
                      <>
                        <Text>
                          By: <strong>{v.updatedBy || "System"}</strong>
                        </Text>
                        <br />
                        <Text type="secondary">
                          {new Date(v.updatedAt).toLocaleString()}
                        </Text>
                        <br />
                        <Text>Items: {v.quotationItems?.length || 0}</Text>
                        <br />
                        <Text strong type="success">
                          ₹
                          {Number(v.quotationData?.finalAmount || 0).toFixed(2)}
                        </Text>
                      </>
                    }
                  />
                </List.Item>
              )}
            />
          )}
        </Modal>

        {/* AntD-like styling for react-datepicker */}
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
            font-size: 14px;
            line-height: 1.5715;
            border: 1px solid #d9d9d9;
            border-radius: 6px;
            transition: all 0.2s;
          }
          .react-datepicker__input-container input:focus {
            border-color: #40a9ff;
            outline: 0;
            box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
          }
        `}</style>
      </div>
    </div>
  );
};

export default AddQuotation;
