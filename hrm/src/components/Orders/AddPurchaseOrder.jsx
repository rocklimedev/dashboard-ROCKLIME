import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";
import { DeleteOutlined } from "@ant-design/icons";
import {
  Form,
  Input,
  Select,
  Button,
  Modal,
  Alert,
  Table,
  InputNumber,
} from "antd";
import { message } from "antd";
import { debounce } from "lodash";
import PageHeader from "../Common/PageHeader";
import {
  useCreatePurchaseOrderMutation,
  useGetPurchaseOrderByIdQuery,
  useUpdatePurchaseOrderMutation,
} from "../../api/poApi";
import { useGetAllProductsQuery } from "../../api/productApi";
import {
  useGetVendorsQuery,
  useCreateVendorMutation,
} from "../../api/vendorApi";
import { useGetAllBrandsQuery } from "../../api/brandsApi";
import moment from "moment";
import DatePicker from "react-datepicker";

const { Option } = Select;

// AddVendorModal Component (loading removed)
const AddVendorModal = ({ show, onClose, onSave, isCreatingVendor }) => {
  const { data: brandsData } = useGetAllBrandsQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });
  const brands = brandsData || [];
  const [form] = Form.useForm();
  const [vendorData, setVendorData] = useState({
    vendorId: "",
    vendorName: "",
    brandId: "",
    brandSlug: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setVendorData((prev) => ({ ...prev, [name]: value }));
  };

  const handleBrandChange = (value) => {
    const selectedBrand = brands.find((brand) => brand.id === value);
    setVendorData((prev) => ({
      ...prev,
      brandId: value,
      brandSlug: selectedBrand ? selectedBrand.brandSlug : "",
    }));
    form.setFieldsValue({ brandId: value });
  };

  const handleSubmit = async () => {
    if (!vendorData.vendorId || !vendorData.vendorName) {
      message.error("Vendor ID and Name are required.");
      return;
    }
    try {
      await onSave({
        vendorId: vendorData.vendorId,
        vendorName: vendorData.vendorName,
        brandId: vendorData.brandId || null,
        brandSlug: vendorData.brandSlug || null,
      }).unwrap();

      setVendorData({
        vendorId: "",
        vendorName: "",
        brandId: "",
        brandSlug: "",
      });
      form.resetFields();
      onClose();
    } catch (err) {
      const errorMessage =
        err.status === 400 && err.data?.message.includes("vendorId")
          ? "Vendor ID already exists. Please use a unique ID."
          : err.data?.message || "Failed to create vendor";
      message.error(errorMessage);
    }
  };

  return (
    <Modal
      title="Add New Vendor"
      open={show}
      onCancel={onClose}
      footer={null}
      centered
    >
      <Form form={form} onFinish={handleSubmit} layout="vertical">
        <Form.Item
          label="Vendor ID"
          name="vendorId"
          rules={[{ required: true, message: "Please enter a Vendor ID" }]}
        >
          <Input
            name="vendorId"
            value={vendorData.vendorId}
            onChange={handleChange}
            placeholder="e.g., VEND123"
          />
          <div style={{ color: "#8c8c8c", fontSize: "12px" }}>
            Must be unique (e.g., VEND123).
          </div>
        </Form.Item>
        <Form.Item
          label="Vendor Name"
          name="vendorName"
          rules={[{ required: true, message: "Please enter a Vendor Name" }]}
        >
          <Input
            name="vendorName"
            value={vendorData.vendorName}
            onChange={handleChange}
            placeholder="e.g., Acme Supplies"
          />
        </Form.Item>
        <Form.Item label="Brand" name="brandId">
          <Select
            style={{ width: "100%" }}
            value={vendorData.brandId || undefined}
            onChange={handleBrandChange}
            placeholder="Select a brand"
            aria-label="Select a brand"
            options={brands.map((brand) => ({
              value: brand.id,
              label: `${brand.brandName} (${brand.brandSlug})`,
            }))}
          />
        </Form.Item>
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <Button
            onClick={onClose}
            disabled={isCreatingVendor}
            style={{ marginRight: "10px" }}
          >
            Cancel
          </Button>
          <Button type="primary" htmlType="submit" disabled={isCreatingVendor}>
            {isCreatingVendor ? "Saving..." : "Save Vendor"}
          </Button>
        </div>
      </Form>
    </Modal>
  );
};

// ProductTableRow (unchanged)
const ProductTableRow = ({
  item,
  index,
  updateProductField,
  removeProduct,
}) => {
  return (
    <tr>
      <td>{item.name}</td>
      <td>
        <InputNumber
          min={1}
          value={item.quantity}
          onChange={(value) =>
            updateProductField(index, "quantity", value || 1)
          }
          aria-label={`Quantity for ${item.name}`}
        />
      </td>
      <td>
        <InputNumber
          min={0.01}
          step={0.01}
          value={item.mrp}
          onChange={(value) => updateProductField(index, "mrp", value || 0.01)}
          aria-label={`MRP for ${item.name}`}
        />
      </td>
      <td>{Number(item.total || 0).toFixed(2)}</td>
      <td>
        <Button
          type="text"
          danger
          icon={<DeleteOutlined />}
          onClick={() => removeProduct(index)}
          aria-label={`Remove ${item.name}`}
        />
      </td>
    </tr>
  );
};

const AddPurchaseOrder = () => {
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const navigate = useNavigate();
  const [form] = Form.useForm();

  // Queries and Mutations (no loading checks)
  const { data: existingPurchaseOrder, error: fetchError } =
    useGetPurchaseOrderByIdQuery(id, { skip: !isEditMode });
  const { data: productsData } = useGetAllProductsQuery();
  const { data: vendorsData } = useGetVendorsQuery();
  const [createPurchaseOrder, { isLoading: isCreating }] =
    useCreatePurchaseOrderMutation();
  const [updatePurchaseOrder, { isLoading: isUpdating }] =
    useUpdatePurchaseOrderMutation();
  const [createVendor, { isLoading: isCreatingVendor }] =
    useCreateVendorMutation();

  const vendors = vendorsData || [];
  const products = productsData || [];
  const statuses = ["pending", "confirmed", "delivered", "cancelled"];

  const initialFormData = useMemo(
    () => ({
      vendorId: "",
      orderDate: moment(),
      expectedDeliveryDate: null,
      items: [],
      totalAmount: 0,
      status: "pending",
    }),
    []
  );

  // State
  const [formData, setFormData] = useState(initialFormData);
  const [productSearch, setProductSearch] = useState("");
  const [showVendorModal, setShowVendorModal] = useState(false);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const momentToDate = (m) => (m && m.isValid() ? m.toDate() : null);
  const dateToMoment = (d) => (d ? moment(d) : null);

  // Populate edit mode
  useEffect(() => {
    if (
      isEditMode &&
      existingPurchaseOrder &&
      products.length > 0 &&
      vendors.length > 0
    ) {
      const vendorExists = vendors.some(
        (vendor) => vendor.id === existingPurchaseOrder.vendorId
      );
      if (!vendorExists) {
        message.error(
          "Selected vendor not found. Please select a valid vendor."
        );
        setFormData((prev) => ({ ...prev, vendorId: "" }));
      }

      const items = Array.isArray(existingPurchaseOrder.items)
        ? existingPurchaseOrder.items
            .map((item) => {
              const product = products.find(
                (p) => p.productId === item.productId
              );
              const name = product
                ? product.name
                : `Product ${item.productId} (Not Found)`;
              const sellingPrice =
                product?.metaDetails?.find(
                  (meta) => meta.slug === "sellingPrice"
                )?.value ||
                item.unitPrice ||
                0;
              const quantity = Number(item.quantity) || 1;

              if (sellingPrice <= 0) {
                message.warning(
                  `Product ${item.productId} has an invalid price (₹${sellingPrice}).`
                );
              }

              return {
                id: item.productId,
                productId: item.productId,
                name,
                quantity,
                mrp: sellingPrice,
                total: quantity * sellingPrice,
              };
            })
            .map((item) => ({
              ...item,
              name: item.name || "Unknown Product",
              mrp: item.mrp > 0 ? item.mrp : 0.01,
            }))
        : [];

      const totalAmount = items
        .reduce((sum, item) => sum + Number(item.total || 0), 0)
        .toFixed(2);

      const newFormData = {
        vendorId: vendorExists ? existingPurchaseOrder.vendorId : "",
        orderDate: existingPurchaseOrder.orderDate
          ? moment(existingPurchaseOrder.orderDate)
          : moment(),
        expectedDeliveryDate: existingPurchaseOrder.expectDeliveryDate
          ? moment(existingPurchaseOrder.expectDeliveryDate)
          : null,
        items,
        totalAmount,
        status: existingPurchaseOrder.status || "pending",
      };

      setFormData(newFormData);
      form.setFieldsValue({
        vendorId: newFormData.vendorId,
        orderDate: newFormData.orderDate,
        expectedDeliveryDate: newFormData.expectedDeliveryDate,
        status: newFormData.status,
      });
    }
  }, [existingPurchaseOrder, isEditMode, products, vendors, form]);

  // Debounced product search
  const debouncedSearch = useCallback(
    debounce((value) => {
      setProductSearch(value);
      if (value) {
        const filtered = products
          .filter(
            (product) =>
              product.productId &&
              (product.name.toLowerCase().includes(value.toLowerCase()) ||
                product.product_code
                  ?.toLowerCase()
                  .includes(value.toLowerCase()))
          )
          .slice(0, 5);
        setFilteredProducts(filtered);
      } else {
        setFilteredProducts([]);
      }
    }, 300),
    [products]
  );

  // Add product
  const addProduct = (productId) => {
    const product = products.find((p) => p.productId === productId);

    if (
      !product ||
      formData.items.some((item) => item.productId === productId)
    ) {
      if (!product) message.error("Product not found.");
      else message.error("Product already added.");
      return;
    }
    const sellingPrice =
      product.metaDetails?.find((meta) => meta.slug === "sellingPrice")
        ?.value || 0;
    if (sellingPrice <= 0) {
      message.error(
        `Product ${product.name} has an invalid MRP (₹${sellingPrice}).`
      );
      return;
    }
    const quantity = 1;
    const total = quantity * sellingPrice;
    setFormData((prev) => {
      const newItems = [
        ...prev.items,
        {
          id: product.productId,
          productId: product.productId,
          name: product.name || "Unknown",
          quantity,
          mrp: sellingPrice,
          total,
        },
      ];
      const totalAmount = newItems
        .reduce((sum, item) => sum + Number(item.total || 0), 0)
        .toFixed(2);

      return {
        ...prev,
        items: newItems,
        totalAmount,
      };
    });
    setProductSearch("");
    setFilteredProducts([]);
  };

  // Remove product
  const removeProduct = (index) => {
    setFormData((prev) => {
      const newItems = prev.items.filter((_, i) => i !== index);
      const totalAmount = newItems
        .reduce((sum, item) => sum + Number(item.total || 0), 0)
        .toFixed(2);
      return {
        ...prev,
        items: newItems,
        totalAmount,
      };
    });
  };

  // Update product field
  const updateProductField = (index, field, value) => {
    const updatedItems = [...formData.items];
    updatedItems[index][field] = value;

    if (["quantity", "mrp"].includes(field)) {
      const quantity = Number(updatedItems[index].quantity) || 1;
      const mrp = Number(updatedItems[index].mrp) || 0.01;
      updatedItems[index].total = quantity * mrp;
    }

    const totalAmount = updatedItems
      .reduce((sum, item) => sum + Number(item.total || 0), 0)
      .toFixed(2);
    setFormData({ ...formData, items: updatedItems, totalAmount });
  };

  // Handle vendor change
  const handleVendorChange = (value) => {
    setFormData((prev) => ({ ...prev, vendorId: value }));
    form.setFieldsValue({ vendorId: value });
  };

  // Clear form with confirmation
  const handleClearForm = () => {
    setShowClearConfirm(true);
  };

  const confirmClearForm = () => {
    setFormData(initialFormData);
    form.resetFields();
    setProductSearch("");
    setFilteredProducts([]);
    setShowClearConfirm(false);
  };

  // Submit handler
  const handleSubmit = async () => {
    try {
      await form.validateFields();
      if (formData.items.length === 0) {
        message.error("Please add at least one product.");
        return;
      }
      if (formData.items.some((item) => item.mrp <= 0)) {
        message.error("All products must have a valid MRP greater than 0.");
        return;
      }
      if (
        formData.items.some(
          (item) => !products.some((p) => p.productId === item.productId)
        )
      ) {
        message.error(
          "Some products are no longer available. Please remove them."
        );
        return;
      }

      const formattedItems = formData.items.map((item) => ({
        productId: item.productId,
        quantity: Number(item.quantity) || 1,
        mrp: Number(item.mrp) || 0.01,
      }));

      const formattedFormData = {
        vendorId: formData.vendorId,
        items: formattedItems,
        expectedDeliveryDate: formData.expectedDeliveryDate
          ? formData.expectedDeliveryDate.format("YYYY-MM-DD")
          : null,
        status: isEditMode ? existingPurchaseOrder?.status : "pending",
      };

      if (isEditMode) {
        await updatePurchaseOrder({ id, ...formattedFormData }).unwrap();
      } else {
        await createPurchaseOrder(formattedFormData).unwrap();
        setFormData(initialFormData);
        form.resetFields();
        setProductSearch("");
        setFilteredProducts([]);
      }
      navigate("/po/list");
    } catch (err) {
      if (err.errorFields) {
        message.error("Please fill in all required fields correctly.");
        return;
      }
      const errorMessage =
        err.status === 404
          ? "Purchase order or vendor not found."
          : err.status === 400
          ? `Invalid request: ${
              err.data?.error || err.data?.message || "Check your input data."
            }`
          : err.data?.message || "Failed to process purchase order";
      message.error(errorMessage);

      if (err.status === 404) {
        setTimeout(() => navigate("/po/list"), 2000);
      }
    }
  };

  // Error state only (no loading)
  if (fetchError) {
    return (
      <div className="content">
        <div className="card">
          <div className="card-body">
            <Alert
              message="Error"
              description={`Error loading purchase order data: ${
                fetchError?.data?.message || "Unknown error"
              }. Redirecting...`}
              type="error"
              showIcon
            />
          </div>
        </div>
      </div>
    );
  }

  // Table columns
  const columns = [
    {
      title: "Product",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Quantity",
      key: "quantity",
      render: (_, record, index) => (
        <InputNumber
          min={1}
          value={record.quantity}
          onChange={(value) =>
            updateProductField(index, "quantity", value || 1)
          }
          aria-label={`Quantity for ${record.name}`}
        />
      ),
    },
    {
      title: "MRP (₹)",
      key: "mrp",
      render: (_, record, index) => (
        <InputNumber
          min={0.01}
          step={0.01}
          value={record.mrp}
          onChange={(value) => updateProductField(index, "mrp", value || 0.01)}
          aria-label={`MRP for ${record.name}`}
        />
      ),
    },
    {
      title: "Total (₹)",
      dataIndex: "total",
      key: "total",
      render: (total) => Number(total || 0).toFixed(2),
    },
    {
      title: "Action",
      key: "action",
      render: (_, __, index) => (
        <Button
          type="text"
          danger
          icon={<DeleteOutlined />}
          onClick={() => removeProduct(index)}
          aria-label={`Remove ${formData.items[index].name}`}
        />
      ),
    },
  ];

  return (
    <div className="page-wrapper">
      <div className="content">
        <div className="card">
          <PageHeader
            title={isEditMode ? "Edit Purchase Order" : "Create Purchase Order"}
            subtitle="Manage purchase order details"
            exportOptions={{ pdf: false, excel: false }}
          />
          <div className="card-body">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 24,
              }}
            >
              <Link to="/po/list">
                <Button icon={<FaArrowLeft style={{ marginRight: 8 }} />}>
                  Back to Purchase Orders
                </Button>
              </Link>
              <Button onClick={handleClearForm}>Clear Form</Button>
            </div>

            <Form form={form} layout="vertical" onFinish={handleSubmit}>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
                <Form.Item
                  label="Vendor"
                  name="vendorId"
                  rules={[
                    { required: true, message: "Please select a vendor" },
                  ]}
                  style={{ flex: 1, minWidth: 300 }}
                >
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <Select
                      style={{ width: "100%" }}
                      value={formData.vendorId}
                      onChange={handleVendorChange}
                      placeholder="Select a vendor"
                      showSearch
                      filterOption={(input, option) =>
                        option.children
                          .toLowerCase()
                          .includes(input.toLowerCase())
                      }
                    >
                      {vendors.length === 0 ? (
                        <Option value="" disabled>
                          No vendors available
                        </Option>
                      ) : (
                        vendors.map((vendor) => (
                          <Option key={vendor.id} value={vendor.id}>
                            {vendor.vendorName}
                          </Option>
                        ))
                      )}
                    </Select>
                    <Button
                      type="primary"
                      style={{ marginLeft: 8 }}
                      onClick={() => setShowVendorModal(true)}
                    >
                      +
                    </Button>
                  </div>
                </Form.Item>

                <Form.Item
                  label="Order Date"
                  name="orderDate"
                  rules={[
                    { required: true, message: "Please select an order date" },
                  ]}
                  style={{ flex: 1, minWidth: 300 }}
                >
                  <DatePicker
                    selected={momentToDate(formData.orderDate)}
                    onChange={(date) =>
                      setFormData({
                        ...formData,
                        orderDate: dateToMoment(date),
                      })
                    }
                    dateFormat="yyyy-MM-dd"
                    className="ant-input"
                    placeholderText="yyyy-mm-dd"
                    minDate={new Date(2000, 0, 1)}
                    maxDate={new Date(2100, 11, 31)}
                  />
                </Form.Item>
              </div>

              <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
                <Form.Item
                  label="Expected Delivery Date"
                  name="expectedDeliveryDate"
                  style={{ flex: 1, minWidth: 300 }}
                >
                  <DatePicker
                    selected={momentToDate(formData.expectedDeliveryDate)}
                    onChange={(date) =>
                      setFormData({
                        ...formData,
                        expectedDeliveryDate: dateToMoment(date),
                      })
                    }
                    dateFormat="yyyy-MM-dd"
                    className="ant-input"
                    placeholderText="yyyy-mm-dd"
                    minDate={new Date()}
                    isClearable
                  />
                </Form.Item>

                <Form.Item
                  label="Total Amount (₹)"
                  style={{ flex: 1, minWidth: 300 }}
                >
                  <InputNumber
                    style={{ width: "100%" }}
                    value={formData.totalAmount}
                    readOnly
                    aria-readonly="true"
                  />
                </Form.Item>

                <Form.Item
                  label="Status"
                  name="status"
                  rules={[
                    { required: true, message: "Please select a status" },
                  ]}
                >
                  <Select placeholder="Select status">
                    {statuses.map((status) => (
                      <Option key={status} value={status}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </div>

              {/* Product Search */}
              <Select
                showSearch
                style={{ width: "100%", marginBottom: 16 }}
                placeholder="Search by product name or code"
                onSearch={debouncedSearch}
                onChange={addProduct}
                filterOption={false}
                notFoundContent="No products found"
              >
                {filteredProducts.map((product, index) => (
                  <Option
                    key={product.productId ?? `fallback-${index}`}
                    value={product.productId}
                  >
                    {product.name} ({product.product_code ?? "N/A"})
                  </Option>
                ))}
              </Select>

              {/* Products Table */}
              <Table
                columns={columns}
                dataSource={formData.items}
                rowKey={(record, index) => record.id ?? `item-${index}`}
                locale={{ emptyText: "No products added" }}
                pagination={false}
              />

              {/* Submit Buttons */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  marginTop: 24,
                }}
              >
                <Button
                  style={{ marginRight: 8 }}
                  onClick={() => navigate("/po/list")}
                  disabled={isCreating || isUpdating}
                >
                  Cancel
                </Button>
                <Button
                  type="primary"
                  htmlType="submit"
                  disabled={isCreating || isUpdating}
                >
                  {isCreating || isUpdating ? "Submitting..." : "Submit"}
                </Button>
              </div>
            </Form>

            {/* Modals */}
            <AddVendorModal
              show={showVendorModal}
              onClose={() => setShowVendorModal(false)}
              onSave={createVendor}
              isCreatingVendor={isCreatingVendor}
            />
            <Modal
              title="Confirm Clear Form"
              open={showClearConfirm}
              onOk={confirmClearForm}
              onCancel={() => setShowClearConfirm(false)}
              okText="Clear"
              cancelText="Cancel"
            >
              <p>
                Are you sure you want to clear the form? All entered data will
                be lost.
              </p>
            </Modal>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddPurchaseOrder;
