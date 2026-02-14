import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeftOutlined,
  DeleteOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import {
  Form,
  Input,
  Select,
  Button,
  Modal,
  Alert,
  Table,
  Spin,
  Typography,
  InputNumber,
  message,
} from "antd";
import { debounce } from "lodash";
import moment from "moment";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useGetProfileQuery } from "../../api/userApi";
import PageHeader from "../../components/Common/PageHeader";
import AddVendorModal from "../../components/POS-NEW/AddVendorModal";

import {
  useCreateFGSMutation,
  useGetFGSByIdQuery,
  useUpdateFGSMutation,
} from "../../api/fgsApi";
import {
  useGetAllProductsQuery,
  useSearchProductsQuery,
} from "../../api/productApi";
import {
  useGetVendorsQuery,
  useCreateVendorMutation,
} from "../../api/vendorApi";

const { Option } = Select;
const { Text } = Typography;

// Known meta key for selling price (same as PO)
const SELLING_PRICE_META_KEY = "9ba862ef-f993-4873-95ef-1fef10036aa5";

const getUnitPrice = (product) => {
  if (!product) return 0;

  const metaPrice = product.meta?.[SELLING_PRICE_META_KEY];
  if (metaPrice && !isNaN(Number(metaPrice)) && Number(metaPrice) > 0) {
    return Number(metaPrice);
  }

  if (product.metaDetails?.length) {
    for (const m of product.metaDetails) {
      const val = Number(m?.value);
      if (!isNaN(val) && val > 10) return val;
    }
  }

  return Number(product.unitPrice || product.mrp || product.sellingPrice || 0);
};

const AddFieldgeneratedSheet = () => {
  const { id } = useParams();
  const isEditMode = !!id;
  const navigate = useNavigate();
  const [form] = Form.useForm();

  // ─── API Hooks ────────────────────────────────────────────────
  const {
    data: fgsData,
    isLoading: isLoadingFGS,
    error: fgsError,
  } = useGetFGSByIdQuery(id, { skip: !isEditMode });

  const { data: productsRes } = useGetAllProductsQuery();
  const products = productsRes?.data || [];

  const { data: vendorsRes } = useGetVendorsQuery();
  const vendors = vendorsRes || [];

  const { data: profile, isLoading: isLoadingProfile } = useGetProfileQuery();

  const [createFGS, { isLoading: creating }] = useCreateFGSMutation();
  const [updateFGS, { isLoading: updating }] = useUpdateFGSMutation();
  const [createVendor, { isLoading: creatingVendor }] =
    useCreateVendorMutation();

  // Search
  const [searchTerm, setSearchTerm] = useState("");
  const { data: searchRes = [], isFetching: isSearching } =
    useSearchProductsQuery(searchTerm.trim(), { skip: !searchTerm.trim() });

  // Form state - default orderDate to current date
  const [formValues, setFormValues] = useState({
    vendorId: "",
    orderDate: moment(),
    expectDeliveryDate: null,
    status: "draft",
    items: [],
  });

  const [showVendorModal, setShowVendorModal] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // ───────────────────────────────────────
  // Populate form in Edit mode
  // ───────────────────────────────────────
  useEffect(() => {
    if (!isEditMode || !fgsData || !products.length || !vendors.length) return;

    const fgs = fgsData;

    const items = (fgs.items || []).map((item) => {
      const product = products.find(
        (p) => p.id === item.productId || p.productId === item.productId,
      );
      const unitPrice = Number(item.unitPrice) || getUnitPrice(product) || 0;
      const quantity = Number(item.quantity) || 1;

      return {
        key: item.productId,
        productId: item.productId,
        name: product?.name || `Product ${item.productId} (missing)`,
        quantity,
        unitPrice: unitPrice > 0 ? unitPrice : 0.01,
        total: quantity * unitPrice,
      };
    });

    const total = items.reduce((sum, i) => sum + i.total, 0).toFixed(2);

    const newValues = {
      vendorId: vendors.some((v) => v.id === fgs.vendorId) ? fgs.vendorId : "",
      orderDate: fgs.orderDate ? moment(fgs.orderDate) : moment(),
      expectDeliveryDate: fgs.expectDeliveryDate
        ? moment(fgs.expectDeliveryDate)
        : null,
      status: fgs.status || "draft",
      items,
      totalAmount: total,
    };

    setFormValues(newValues);
    form.setFieldsValue({
      vendorId: newValues.vendorId,
      orderDate: newValues.orderDate,
      expectDeliveryDate: newValues.expectDeliveryDate,
      status: newValues.status,
    });

    if (!newValues.vendorId) {
      message.warning("The vendor for this FGS no longer exists.");
    }
  }, [fgsData, isEditMode, products, vendors, form]);

  // ───────────────────────────────────────
  // Computed total
  // ───────────────────────────────────────
  const totalAmount = useMemo(() => {
    return formValues.items
      .reduce((sum, item) => sum + (Number(item.total) || 0), 0)
      .toFixed(2);
  }, [formValues.items]);

  // ───────────────────────────────────────
  // Product search options
  // ───────────────────────────────────────
  const searchOptions = useMemo(() => {
    const source = searchTerm.trim() ? searchRes : products;

    return source.map((p) => {
      const price = getUnitPrice(p);
      return {
        value: p.id || p.productId,
        label: (
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              width: "100%",
            }}
          >
            <div>
              <div style={{ fontWeight: 500 }}>
                {p.name || p.product_code || "Unnamed"}
              </div>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {p.product_code || "—"}
              </Text>
            </div>
            <Text strong style={{ color: "#52c41a" }}>
              ₹{price.toLocaleString("en-IN")}
            </Text>
          </div>
        ),
      };
    });
  }, [searchRes, products, searchTerm]);

  // ───────────────────────────────────────
  // Add product to list
  // ───────────────────────────────────────
  const handleAddProduct = (productId) => {
    const product =
      searchRes.find((p) => (p.id || p.productId) === productId) ||
      products.find((p) => (p.id || p.productId) === productId);

    if (!product) {
      message.error("Product not found");
      return;
    }

    if (formValues.items.some((i) => i.productId === productId)) {
      message.warning("This product is already added");
      return;
    }

    const unitPrice = getUnitPrice(product);
    if (unitPrice <= 0) {
      message.error(`Product ${product.name} has no valid price`);
      return;
    }

    const newItem = {
      key: productId,
      productId,
      name: product.name || product.product_code || "Unnamed Product",
      quantity: 1,
      unitPrice,
      total: unitPrice,
    };

    setFormValues((prev) => ({
      ...prev,
      items: [...prev.items, newItem],
    }));

    setSearchTerm("");
  };

  // ───────────────────────────────────────
  // Update item quantity / price
  // ───────────────────────────────────────
  const updateItem = (index, field, value) => {
    const updated = [...formValues.items];
    updated[index][field] = value;

    if (field === "quantity" || field === "unitPrice") {
      const qty = Number(updated[index].quantity) || 1;
      const price = Number(updated[index].unitPrice) || 0.01;
      updated[index].total = qty * price;
    }

    setFormValues({ ...formValues, items: updated });
  };

  // ───────────────────────────────────────
  // Remove item
  // ───────────────────────────────────────
  const removeItem = (index) => {
    const updated = formValues.items.filter((_, i) => i !== index);
    setFormValues({ ...formValues, items: updated });
  };

  // ───────────────────────────────────────
  // Submit
  // ───────────────────────────────────────
  const handleSubmit = async () => {
    try {
      await form.validateFields();

      if (formValues.items.length === 0) {
        message.error("Add at least one product");
        return;
      }

      if (formValues.items.some((i) => i.unitPrice <= 0)) {
        message.error("All products must have a price > 0");
        return;
      }

      const currentUserId = profile?.user?.userId || "nill";
      console.log(currentUserId);

      if (!currentUserId || currentUserId === "nill") {
        message.error(
          "Cannot save: user profile not loaded. Please try again.",
        );
        return;
      }

      const payload = {
        vendorId: formValues.vendorId,
        items: formValues.items.map((i) => ({
          productId: i.productId,
          quantity: Number(i.quantity),
          unitPrice: Number(i.unitPrice),
        })),
        expectDeliveryDate: formValues.expectDeliveryDate
          ? formValues.expectDeliveryDate.format("YYYY-MM-DD")
          : null,
      };

      console.log(payload);

      if (isEditMode) {
        await updateFGS({ id, ...payload }).unwrap();
        message.success("Field Guided Sheet updated");
      } else {
        await createFGS(payload).unwrap();
        message.success("Field Guided Sheet created");

        setFormValues({
          vendorId: "",
          orderDate: moment(),
          expectDeliveryDate: null,
          status: "draft",
          items: [],
        });
        form.resetFields();
      }

      navigate("/purchase-manager?fgs=1");
    } catch (err) {
      message.error(err?.data?.message || "Failed to save Field Guided Sheet");
    }
  };

  if (isLoadingFGS) return <Spin tip="Loading Field generated Sheet..." />;
  if (fgsError) {
    return (
      <Alert
        message="Error"
        description="Could not load Field generated Sheet data"
        type="error"
        showIcon
      />
    );
  }

  const tableColumns = [
    { title: "Product", dataIndex: "name", key: "name" },
    {
      title: "Quantity",
      key: "quantity",
      width: 120,
      render: (_, record, index) => (
        <InputNumber
          min={1}
          value={record.quantity}
          onChange={(v) => updateItem(index, "quantity", v)}
        />
      ),
    },
    {
      title: "Unit Price (₹)",
      key: "unitPrice",
      width: 140,
      render: (_, record, index) => (
        <InputNumber
          min={0.01}
          step={0.01}
          value={record.unitPrice}
          onChange={(v) => updateItem(index, "unitPrice", v)}
        />
      ),
    },
    {
      title: "Total (₹)",
      key: "total",
      width: 120,
      render: (_, r) => Number(r.total || 0).toFixed(2),
    },
    {
      title: "",
      key: "action",
      width: 60,
      render: (_, __, index) => (
        <Button
          type="text"
          danger
          icon={<DeleteOutlined />}
          onClick={() => removeItem(index)}
        />
      ),
    },
  ];

  return (
    <div className="page-wrapper">
      <div className="content">
        <div className="card">
          <PageHeader
            exportOptions={{ pdf: false, excel: false }}
            title={
              isEditMode
                ? "Edit Field Generated Sheet"
                : "Create Field Generated Sheet"
            }
            subtitle="Temporary / negotiable purchase draft"
          />

          <div className="card-body">
            <div style={{ marginBottom: 24, display: "flex", gap: 12 }}>
              <Link to="/purchase-manager?fgs=1">
                <Button icon={<ArrowLeftOutlined />}>Back</Button>
              </Link>
              <Button onClick={() => setShowClearConfirm(true)}>Clear</Button>
            </div>

            <Form form={form} layout="vertical" onFinish={handleSubmit}>
              <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                {/* Vendor */}
                <Form.Item
                  label={
                    <>
                      Vendor <span className="required-star">*</span>
                    </>
                  }
                  name="vendorId"
                  rules={[{ required: true, message: "Vendor is required" }]}
                  style={{ flex: 1, minWidth: 300 }}
                >
                  <div style={{ display: "flex", gap: 8 }}>
                    <Select
                      style={{ flex: 1 }}
                      placeholder="Select vendor"
                      value={formValues.vendorId}
                      onChange={(v) => {
                        setFormValues({ ...formValues, vendorId: v });
                        form.setFieldsValue({ vendorId: v });
                      }}
                      showSearch
                      optionFilterProp="children"
                    >
                      {vendors.map((v) => (
                        <Option key={v.id} value={v.id}>
                          {v.vendorName}
                        </Option>
                      ))}
                    </Select>
                    <Button
                      type="primary"
                      onClick={() => setShowVendorModal(true)}
                    >
                      +
                    </Button>
                  </div>
                </Form.Item>

                {/* Order Date - restricted to today and future */}
                <Form.Item
                  label={
                    <>
                      Order Date <span className="required-star">*</span>
                    </>
                  }
                  name="orderDate"
                  rules={[
                    { required: true, message: "Order date is required" },
                  ]}
                  style={{ flex: 1, minWidth: 220 }}
                >
                  <DatePicker
                    selected={formValues.orderDate?.toDate()}
                    onChange={(date) =>
                      setFormValues({
                        ...formValues,
                        orderDate: date ? moment(date) : moment(),
                      })
                    }
                    dateFormat="dd/MM/yyyy"
                    className="ant-input"
                    minDate={new Date()} // ← Prevents selecting past dates
                    maxDate={new Date(2030, 11, 31)} // optional: reasonable future limit
                    showMonthDropdown
                    showYearDropdown
                    dropdownMode="select"
                  />
                </Form.Item>
              </div>

              <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                {/* Expected Delivery */}
                <Form.Item
                  label="Expected Delivery"
                  style={{ flex: 1, minWidth: 220 }}
                >
                  <DatePicker
                    selected={formValues.expectDeliveryDate?.toDate()}
                    onChange={(date) =>
                      setFormValues({
                        ...formValues,
                        expectDeliveryDate: date ? moment(date) : null,
                      })
                    }
                    dateFormat="dd/MM/yyyy"
                    minDate={new Date()}
                    isClearable
                    className="ant-input"
                  />
                </Form.Item>

                {/* Status */}
                <Form.Item
                  label="Status"
                  name="status"
                  style={{ flex: 1, minWidth: 180 }}
                >
                  <Select
                    disabled={!isEditMode}
                    value={formValues.status}
                    onChange={(v) =>
                      setFormValues({ ...formValues, status: v })
                    }
                  >
                    {[
                      "draft",
                      "negotiating",
                      "approved",
                      "converted",
                      "cancelled",
                    ].map((s) => (
                      <Option key={s} value={s}>
                        {s.charAt(0).toUpperCase() + s.slice(1)}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </div>

              {/* Product Search + Add */}
              <div style={{ margin: "32px 0 16px" }}>
                <Select
                  showSearch
                  size="large"
                  style={{ width: "100%" }}
                  placeholder="Search product by name or code..."
                  prefix={<SearchOutlined />}
                  value={null}
                  onSearch={debounce(setSearchTerm, 400)}
                  onChange={handleAddProduct}
                  filterOption={false}
                  options={searchOptions}
                  notFoundContent={
                    isSearching ? (
                      <Spin />
                    ) : searchTerm ? (
                      "No products found"
                    ) : (
                      "Type to search..."
                    )
                  }
                  dropdownStyle={{ maxHeight: 420 }}
                />
              </div>

              {/* Items Table */}
              <Table
                columns={tableColumns}
                dataSource={formValues.items}
                rowKey="key"
                pagination={false}
                locale={{ emptyText: "No products added yet" }}
              />

              {/* Total */}
              <div style={{ marginTop: 16, textAlign: "right" }}>
                <Text strong>Total Amount: </Text>
                <Text strong style={{ fontSize: 18 }}>
                  ₹{totalAmount}
                </Text>
              </div>

              {/* Actions */}
              <div style={{ marginTop: 32, textAlign: "right" }}>
                <Button
                  style={{ marginRight: 12 }}
                  onClick={() => navigate("/purchase-manager?fgs=1")}
                  disabled={creating || updating}
                >
                  Cancel
                </Button>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={creating || updating}
                >
                  {creating || updating
                    ? "Saving..."
                    : isEditMode
                      ? "Update FGS"
                      : "Create FGS"}
                </Button>
              </div>
            </Form>
          </div>
        </div>
      </div>

      {/* Modals */}
      <AddVendorModal
        show={showVendorModal}
        onClose={() => setShowVendorModal(false)}
        onSave={createVendor}
        isCreatingVendor={creatingVendor}
      />

      <Modal
        title="Clear Form?"
        open={showClearConfirm}
        onOk={() => {
          setFormValues({
            vendorId: "",
            orderDate: moment(),
            expectDeliveryDate: null,
            status: "draft",
            items: [],
          });
          form.resetFields();
          setShowClearConfirm(false);
        }}
        onCancel={() => setShowClearConfirm(false)}
        okText="Clear"
        cancelText="Cancel"
      >
        <p>All entered data will be lost. Are you sure?</p>
      </Modal>
    </div>
  );
};

export default AddFieldgeneratedSheet;
