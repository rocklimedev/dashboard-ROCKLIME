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
  Spin,
  Alert,
  Table,
  DatePicker,
  InputNumber,
} from "antd";
import { toast } from "sonner";
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

const { Option } = Select;

// AddVendorModal Component (unchanged)
const AddVendorModal = ({ show, onClose, onSave, isCreatingVendor }) => {
  const {
    data: brandsData,
    isLoading: isBrandsLoading,
    error: brandsError,
  } = useGetAllBrandsQuery(undefined, {
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
      toast.error("Vendor ID and Name are required.");
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
      toast.error(errorMessage);
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
        {brandsError && (
          <Alert
            message="Failed to load brands"
            description={brandsError?.data?.message || "Unknown error"}
            type="error"
            showIcon
          />
        )}
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
            placeholder={
              isBrandsLoading ? "Loading brands..." : "Select a brand"
            }
            loading={isBrandsLoading}
            disabled={isBrandsLoading}
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
          <Button
            type="primary"
            htmlType="submit"
            disabled={isCreatingVendor || isBrandsLoading}
          >
            {isCreatingVendor ? <Spin size="small" /> : "Save Vendor"}
          </Button>
        </div>
      </Form>
    </Modal>
  );
};

// ProductTableRow Component
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

  // Queries and Mutations
  const {
    data: existingPurchaseOrder,
    isLoading: isFetching,
    error: fetchError,
  } = useGetPurchaseOrderByIdQuery(id, { skip: !isEditMode });
  const { data: productsData, isLoading: isProductsLoading } =
    useGetAllProductsQuery();
  const { data: vendorsData, isLoading: isVendorsLoading } =
    useGetVendorsQuery();
  const [createPurchaseOrder, { isLoading: isCreating }] =
    useCreatePurchaseOrderMutation();
  const [updatePurchaseOrder, { isLoading: isUpdating }] =
    useUpdatePurchaseOrderMutation();
  const [createVendor, { isLoading: isCreatingVendor }] =
    useCreateVendorMutation();

  const vendors = vendorsData || [];
  const products = productsData || [];
  const statuses = ["pending", "confirmed", "delivered", "cancelled"];

  // Initial form data
  const initialFormData = useMemo(
    () => ({
      vendorId: "",
      orderDate: moment(),
      expectedDeliveryDate: null,
      items: [],
      totalAmount: 0,
    }),
    []
  );

  // State
  const [formData, setFormData] = useState(initialFormData);
  const [productSearch, setProductSearch] = useState("");
  const [showVendorModal, setShowVendorModal] = useState(false);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  useEffect(() => {
    if (
      isEditMode &&
      existingPurchaseOrder &&
      products.length > 0 &&
      vendors.length > 0
    ) {
      // Validate vendor
      const vendorExists = vendors.some(
        (vendor) => vendor.id === existingPurchaseOrder.vendorId
      );
      if (!vendorExists) {
        toast.error("Selected vendor not found. Please select a valid vendor.");
        setFormData((prev) => ({ ...prev, vendorId: "" }));
      }

      // Map items
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
                toast.warning(
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
            // Do not filter out items; keep them even if product is not found
            .map((item) => ({
              ...item,
              name: item.name || "Unknown Product",
              mrp: item.mrp > 0 ? item.mrp : 0.01, // Ensure valid MRP
            }))
        : [];

      // Calculate total amount
      const totalAmount = items
        .reduce((sum, item) => sum + Number(item.total || 0), 0)
        .toFixed(2);

      // Set formData
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

      // Set Ant Design Form fields
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
      if (!product) toast.error("Product not found.");
      else toast.error("Product already added.");
      return;
    }
    const sellingPrice =
      product.metaDetails?.find((meta) => meta.slug === "sellingPrice")
        ?.value || 0;
    if (sellingPrice <= 0) {
      toast.error(
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

  // Update product fields
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

  // Handle vendor selection
  const handleVendorChange = (value) => {
    setFormData((prev) => ({ ...prev, vendorId: value }));
    form.setFieldsValue({ vendorId: value });
  };

  // Handle clear form with confirmation
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

  // Inside AddPurchaseOrder component
  const handleSubmit = async () => {
    try {
      const formValues = form.getFieldsValue();

      await form.validateFields();
      if (formData.items.length === 0) {
        toast.error("Please add at least one product.");
        return;
      }
      if (formData.items.some((item) => item.mrp <= 0)) {
        toast.error("All products must have a valid MRP greater than 0.");
        return;
      }
      if (
        formData.items.some(
          (item) => !products.some((p) => p.productId === item.productId)
        )
      ) {
        toast.error(
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
        const result = await updatePurchaseOrder({
          id,
          ...formattedFormData,
        }).unwrap();
      } else {
        const result = await createPurchaseOrder(formattedFormData).unwrap();

        setFormData(initialFormData);
        form.resetFields();
        setProductSearch("");
        setFilteredProducts([]);
      }
      navigate("/po/list");
    } catch (err) {
      if (err.errorFields) {
        toast.error("Please fill in all required fields correctly.");
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
      toast.error(errorMessage);

      if (err.status === 404) {
        setTimeout(() => navigate("/po/list"), 2000);
      }
    }
  };

  // Loading state
  if (isFetching || isVendorsLoading || isProductsLoading) {
    return (
      <div className="content">
        <div className="card">
          <div className="card-body text-center">
            <Spin />
            <p>Loading data...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
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

  // Table columns for AntD Table
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
                      disabled={isVendorsLoading}
                      aria-label="Select a vendor"
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
                      aria-label="Add new vendor"
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
                    style={{ width: "100%" }}
                    value={formData.orderDate}
                    onChange={(date) =>
                      setFormData({ ...formData, orderDate: date })
                    }
                    format="YYYY-MM-DD"
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
                    style={{ width: "100%" }}
                    value={formData.expectedDeliveryDate}
                    onChange={(date) =>
                      setFormData({ ...formData, expectedDeliveryDate: date })
                    }
                    format="YYYY-MM-DD"
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
              <Select
                showSearch
                style={{ width: "100%" }}
                placeholder="Search by product name or code"
                onSearch={debouncedSearch}
                onChange={addProduct}
                filterOption={false}
                loading={isProductsLoading}
                aria-label="Search products"
                notFoundContent={
                  isProductsLoading ? (
                    <Spin size="small" />
                  ) : (
                    "No products found"
                  )
                }
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
              <Table
                columns={columns}
                dataSource={formData.items}
                rowKey={(record, index) => record.id ?? `item-${index}`}
                locale={{ emptyText: "No products added" }}
                pagination={false}
              />
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
                  {isCreating || isUpdating ? <Spin size="small" /> : "Submit"}
                </Button>
              </div>
            </Form>
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
