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

import PageHeader from "../../components/Common/PageHeader";
import AddVendorModal from "../../components/POS-NEW/AddVendorModal";

import {
  useCreatePurchaseOrderMutation,
  useGetPurchaseOrderByIdQuery,
  useUpdatePurchaseOrderMutation,
} from "../../api/poApi";
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

const AddPurchaseOrder = () => {
  const { id } = useParams();
  const isEditMode = !!id;
  const navigate = useNavigate();
  const [form] = Form.useForm();

  // API Hooks
  const {
    data: poData,
    isLoading: isLoadingPO,
    error: poError,
  } = useGetPurchaseOrderByIdQuery(id, { skip: !isEditMode });

  const { data: productsRes, isLoading: isLoadingProducts } =
    useGetAllProductsQuery();
  const products = productsRes?.data || [];

  const { data: vendorsRes, isLoading: isLoadingVendors } =
    useGetVendorsQuery();
  const vendors = vendorsRes || [];

  const [createPO, { isLoading: creating }] = useCreatePurchaseOrderMutation();
  const [updatePO, { isLoading: updating }] = useUpdatePurchaseOrderMutation();
  const [createVendor, { isLoading: creatingVendor }] =
    useCreateVendorMutation();

  // Search
  const [searchTerm, setSearchTerm] = useState("");
  const { data: searchRes = [], isFetching: isSearching } =
    useSearchProductsQuery(searchTerm.trim(), { skip: !searchTerm.trim() });

  // Form State
  const [formValues, setFormValues] = useState({
    vendorId: "",
    orderDate: moment(),
    expectDeliveryDate: null,
    status: "pending",
    items: [],
  });

  const [showVendorModal, setShowVendorModal] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // ───────────────────────────────────────
  // Populate form in Edit mode (Improved)
  // ───────────────────────────────────────
  useEffect(() => {
    if (!isEditMode || !poData) return;

    const po = poData; // assuming poData is the full object like in your JSON

    const mappedItems = (po.items || []).map((item) => {
      const product = products.find(
        (p) => p.id === item.productId || p.productId === item.productId,
      );

      const unitPrice = Number(item.unitPrice) || getUnitPrice(product) || 0.01;
      const quantity = Number(item.quantity) || 1;

      return {
        key: item.productId || item._id,
        productId: item.productId,
        name: product?.name || item.productName || `Product ${item.productId}`,
        quantity,
        unitPrice,
        total: quantity * unitPrice,
      };
    });

    const newFormValues = {
      vendorId: po.vendorId || "",
      orderDate: po.orderDate ? moment(po.orderDate) : moment(),
      expectDeliveryDate: po.expectDeliveryDate
        ? moment(po.expectDeliveryDate)
        : null,
      status: po.status || "pending",
      items: mappedItems,
    };

    setFormValues(newFormValues);

    // Set AntD form fields
    form.setFieldsValue({
      vendorId: newFormValues.vendorId,
      orderDate: newFormValues.orderDate,
      expectDeliveryDate: newFormValues.expectDeliveryDate,
      status: newFormValues.status,
    });

    if (po.vendorId && !vendors.some((v) => v.id === po.vendorId)) {
      message.warning("Vendor for this PO no longer exists in the system.");
    }
  }, [poData, isEditMode, products, vendors, form]);

  // Computed Total
  const totalAmount = useMemo(() => {
    return formValues.items
      .reduce((sum, item) => sum + (Number(item.total) || 0), 0)
      .toFixed(2);
  }, [formValues.items]);

  // Search Options
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
                {p.name || p.productName || p.product_code || "Unnamed"}
              </div>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {p.productCode || p.product_code || "—"}
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

  // Add Product
  const handleAddProduct = (productId) => {
    const product =
      searchRes.find((p) => (p.id || p.productId) === productId) ||
      products.find((p) => (p.id || p.productId) === productId);

    if (!product) {
      message.error("Product not found");
      return;
    }

    if (formValues.items.some((i) => i.productId === productId)) {
      message.warning("Product already added");
      return;
    }

    const unitPrice = getUnitPrice(product);
    if (unitPrice <= 0) {
      message.error(`Product "${product.name}" has no valid price`);
      return;
    }

    const newItem = {
      key: productId,
      productId,
      name: product.name || product.productName || "Unnamed Product",
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

  // Update Item
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

  // Remove Item
  const removeItem = (index) => {
    setFormValues((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  // Submit
  const handleSubmit = async () => {
    try {
      await form.validateFields();

      if (formValues.items.length === 0) {
        message.error("Please add at least one product");
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
        // orderDate is usually set by backend on creation
        // status is handled by backend or only in edit
      };

      if (isEditMode) {
        await updatePO({ id, ...payload }).unwrap();
        message.success("Purchase order updated successfully");
      } else {
        await createPO(payload).unwrap();
        message.success("Purchase order created successfully");

        // Reset form
        setFormValues({
          vendorId: "",
          orderDate: moment(),
          expectDeliveryDate: null,
          status: "pending",
          items: [],
        });
        form.resetFields();
      }

      navigate("/purchase-manager");
    } catch (err) {
      message.error(err?.data?.message || "Failed to save purchase order");
    }
  };

  // Loading State
  if (isEditMode && (isLoadingPO || isLoadingProducts || isLoadingVendors)) {
    return <Spin tip="Loading purchase order data..." size="large" />;
  }

  if (poError) {
    return (
      <Alert
        message="Error Loading Purchase Order"
        description={
          poError?.data?.message || "Could not load the purchase order"
        }
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
      render: (_, record) => Number(record.total || 0).toFixed(2),
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
            title={isEditMode ? "Edit Purchase Order" : "Create Purchase Order"}
            subtitle="Manage purchase order details"
          />

          <div className="card-body">
            <div style={{ marginBottom: 24, display: "flex", gap: 12 }}>
              <Link to="/purchase-manager">
                <Button icon={<ArrowLeftOutlined />}>Back</Button>
              </Link>
              <Button onClick={() => setShowClearConfirm(true)}>
                Clear Form
              </Button>
            </div>

            <Form form={form} layout="vertical" onFinish={handleSubmit}>
              <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                {/* Vendor */}
                <Form.Item
                  label="Vendor *"
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
                        setFormValues((prev) => ({ ...prev, vendorId: v }));
                        form.setFieldsValue({ vendorId: v });
                      }}
                      showSearch
                      optionFilterProp="children"
                      loading={isLoadingVendors}
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

                {/* Order Date */}
                <Form.Item
                  label="Order Date *"
                  name="orderDate"
                  rules={[
                    { required: true, message: "Order date is required" },
                  ]}
                  style={{ flex: 1, minWidth: 220 }}
                >
                  <DatePicker
                    selected={formValues.orderDate?.toDate()}
                    onChange={(date) =>
                      setFormValues((prev) => ({
                        ...prev,
                        orderDate: date ? moment(date) : moment(),
                      }))
                    }
                    dateFormat="dd/MM/yyyy"
                    className="ant-input"
                    minDate={new Date()}
                    maxDate={new Date(2030, 11, 31)}
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
                      setFormValues((prev) => ({
                        ...prev,
                        expectDeliveryDate: date ? moment(date) : null,
                      }))
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
                      setFormValues((prev) => ({ ...prev, status: v }))
                    }
                  >
                    {["pending", "confirmed", "delivered", "cancelled"].map(
                      (s) => (
                        <Option key={s} value={s}>
                          {s.charAt(0).toUpperCase() + s.slice(1)}
                        </Option>
                      ),
                    )}
                  </Select>
                </Form.Item>
              </div>

              {/* Product Search */}
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
                  disabled={isLoadingProducts}
                />
              </div>

              {/* Items Table */}
              <Table
                columns={tableColumns}
                dataSource={formValues.items}
                rowKey="key"
                pagination={false}
                locale={{
                  emptyText:
                    "No products added yet. Search and add products above.",
                }}
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
                  onClick={() => navigate("/purchase-manager")}
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
                      ? "Update Order"
                      : "Create Order"}
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
            status: "pending",
            items: [],
          });
          form.resetFields();
          setShowClearConfirm(false);
        }}
        onCancel={() => setShowClearConfirm(false)}
        okText="Yes, Clear"
        cancelText="Cancel"
      >
        <p>All entered data will be lost. Are you sure?</p>
      </Modal>
    </div>
  );
};

export default AddPurchaseOrder;
