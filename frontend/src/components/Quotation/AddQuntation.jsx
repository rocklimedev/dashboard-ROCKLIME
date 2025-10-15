import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  Form,
  Spinner,
  Alert,
  Button as BootstrapButton,
} from "react-bootstrap";
import { FaArrowLeft, FaSearch } from "react-icons/fa";
import { DeleteOutlined, PlusOutlined } from "@ant-design/icons"; // Added PlusOutlined
import { Select, Button, Modal, List, Typography, DatePicker } from "antd"; // Added DatePicker
import { toast } from "sonner";
import { debounce } from "lodash";
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
import {
  useGetAllAddressesQuery,
  useCreateAddressMutation,
} from "../../api/addressApi";
import { useGetProfileQuery } from "../../api/userApi";
import { v4 as uuidv4 } from "uuid";
import AddAddress from "../Address/AddAddressModal";
import moment from "moment"; // Added for date handling

const { Option } = Select;
const { Text } = Typography;

const AddQuotation = () => {
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const navigate = useNavigate();

  // Queries
  const {
    data: existingQuotation,
    isLoading: isFetching,
    error: fetchError,
    isSuccess: isFetchSuccess,
  } = useGetQuotationByIdQuery(id, { skip: !isEditMode });
  const {
    data: versionsData,
    isLoading: isVersionsLoading,
    error: versionsError,
  } = useGetQuotationVersionsQuery(id, { skip: !isEditMode });
  const { data: userData, isLoading: isUserLoading } = useGetProfileQuery();
  const { data: customersData, isLoading: isCustomersLoading } =
    useGetCustomersQuery();
  const { data: addressesData, isLoading: isAddressesLoading } =
    useGetAllAddressesQuery();
  const { data: productsData, isLoading: isProductsLoading } =
    useGetAllProductsQuery();
  const [createQuotation, { isLoading: isCreating }] =
    useCreateQuotationMutation();
  const [updateQuotation, { isLoading: isUpdating }] =
    useUpdateQuotationMutation();
  const [restoreVersion, { isLoading: isRestoring }] =
    useRestoreQuotationVersionMutation();
  const [createAddress, { isLoading: isCreatingAddress }] =
    useCreateAddressMutation();

  // Data assignments
  const userId = userData?.user?.userId || "nill";
  const customers = customersData?.data || [];
  const addresses = Array.isArray(addressesData) ? addressesData : [];
  const products = productsData || [];
  const versions = versionsData || [];

  // State
  const initialFormData = {
    document_title: "",
    quotation_date: "",
    due_date: "",
    reference_number: "",
    include_gst: false,
    gst_value: "",
    products: [],
    discountType: "percent",
    roundOff: "",
    finalAmount: "",
    signature_name: "",
    signature_image: "",
    customerId: "",
    shipTo: "",
    createdBy: userId,
    followupDates: [], // Added followupDates
  };

  const [formData, setFormData] = useState(initialFormData);
  const [productSearch, setProductSearch] = useState("");
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [addressType, setAddressType] = useState("customer");
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [showVersionsModal, setShowVersionsModal] = useState(false);

  // Handle fetch errors
  useEffect(() => {
    if (isEditMode && fetchError) {
      toast.error("Quotation not found or inaccessible. Redirecting...");
      setTimeout(() => navigate("/orders/list"), 2000);
    }
    if (isEditMode && isFetchSuccess && !existingQuotation) {
      toast.error("Quotation not found. Redirecting to quotations list...");
      setTimeout(() => navigate("/orders/list"), 2000);
    }
    if (isEditMode && versionsError) {
      toast.error("Failed to load version history.");
    }
  }, [
    fetchError,
    isEditMode,
    navigate,
    isFetchSuccess,
    existingQuotation,
    versionsError,
  ]);

  // Pre-fill form in edit mode
  useEffect(() => {
    if (isEditMode && existingQuotation) {
      let parsedProducts = existingQuotation.products;
      if (typeof parsedProducts === "string") {
        try {
          parsedProducts = JSON.parse(parsedProducts);
        } catch (error) {
          parsedProducts = [];
        }
      }

      const updatedProducts = Array.isArray(parsedProducts)
        ? parsedProducts.map((p) => {
            const product = products.find(
              (prod) => (prod.id || prod.productId) === p.productId
            );
            const sellingPrice =
              Number(product?.meta?.["9ba862ef-f993-4873-95ef-1fef10036aa5"]) ||
              0;
            return {
              id: p.productId,
              productId: p.productId,
              name: product?.name || p.name || "Unknown",
              qty: Number(p.quantity) || 1,
              sellingPrice: sellingPrice,
              discount: Number(p.discount) || 0,
              tax: Number(p.tax) || 0,
              total: Number(p.total) || sellingPrice,
            };
          })
        : [];

      setFormData({
        ...initialFormData,
        quotationId: id,
        document_title: existingQuotation.document_title || "",
        quotation_date: existingQuotation.quotation_date
          ? new Date(existingQuotation.quotation_date)
              .toISOString()
              .split("T")[0]
          : "",
        due_date: existingQuotation.due_date
          ? new Date(existingQuotation.due_date).toISOString().split("T")[0]
          : "",
        reference_number: existingQuotation.reference_number || "",
        include_gst: existingQuotation.include_gst || false,
        gst_value: existingQuotation.gst_value || "",
        discountType: existingQuotation.discountType || "percent",
        roundOff: existingQuotation.roundOff || "",
        finalAmount: existingQuotation.finalAmount || "",
        signature_name: existingQuotation.signature_name || "",
        signature_image: existingQuotation.signature_image || "",
        customerId: existingQuotation.customerId || "",
        shipTo: existingQuotation.shipTo || "",
        createdBy: userId,
        products: updatedProducts,
        followupDates: existingQuotation.followupDates || [], // Added followupDates
      });
    }
  }, [existingQuotation, userId, isEditMode, products]);

  // Debounced product search
  const debouncedSearch = useCallback(
    debounce((value) => {
      if (value) {
        const filtered = products
          .filter(
            (product) =>
              product.name?.toLowerCase().includes(value.toLowerCase()) ||
              product.product_code?.toLowerCase().includes(value.toLowerCase())
          )
          .slice(0, 5);
        setFilteredProducts(filtered);
      } else {
        setFilteredProducts([]);
      }
      setProductSearch(value);
    }, 300),
    [products]
  );

  // Add product
  const addProduct = (productId) => {
    const product = products.find((p) => (p.id || p.productId) === productId);
    if (!product) {
      toast.error("Selected product not found.");
      return;
    }
    const sellingPrice =
      Number(product.meta?.["9ba862ef-f993-4873-95ef-1fef10036aa5"]) || 0;
    const newProduct = {
      id: product.id || product.productId,
      productId: product.id || product.productId,
      name: product.name || "Unknown",
      qty: 1,
      sellingPrice: sellingPrice,
      discount: 0,
      tax: 0,
      total: sellingPrice,
    };
    setFormData((prev) => ({
      ...prev,
      products: [...prev.products, newProduct],
    }));
    setProductSearch("");
    setFilteredProducts([]);
  };

  // Remove product
  const removeProduct = (index) => {
    setFormData((prev) => ({
      ...prev,
      products: prev.products.filter((_, i) => i !== index),
    }));
  };

  // Calculate final amount
  const calculateFinalAmount = useCallback(() => {
    const subtotal = formData.products.reduce(
      (sum, product) => sum + Number(product.total || 0),
      0
    );
    const gstAmount = formData.include_gst
      ? (subtotal * (parseFloat(formData.gst_value) || 0)) / 100
      : 0;
    const finalAmount =
      subtotal + gstAmount + (parseFloat(formData.roundOff) || 0);
    setFormData((prev) => ({
      ...prev,
      finalAmount: finalAmount.toFixed(2),
    }));
  }, [
    formData.products,
    formData.include_gst,
    formData.gst_value,
    formData.roundOff,
  ]);

  useEffect(() => {
    calculateFinalAmount();
  }, [calculateFinalAmount]);

  // Update product fields
  const updateProductField = (index, field, value) => {
    setFormData((prev) => {
      const updatedProducts = [...prev.products];
      updatedProducts[index] = {
        ...updatedProducts[index],
        [field]: value,
      };

      if (["qty", "discount", "tax"].includes(field)) {
        const qty = parseFloat(updatedProducts[index].qty) || 1;
        const sellingPrice =
          parseFloat(updatedProducts[index].sellingPrice) || 0;
        const discount = parseFloat(updatedProducts[index].discount) || 0;
        const tax = parseFloat(updatedProducts[index].tax) || 0;
        updatedProducts[index].total =
          Number((qty * sellingPrice - discount) * (1 + tax / 100)) || 0;
      }

      return { ...prev, products: updatedProducts };
    });
  };

  // Handle form changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  // Handle address selection
  const handleAddressChange = (value) => {
    setFormData((prev) => ({
      ...prev,
      shipTo: value,
    }));
  };

  // Handle add address
  const handleAddAddress = () => {
    setShowAddressModal(true);
  };

  // Handle address save
  const handleAddressSave = (addressId) => {
    setFormData((prev) => ({
      ...prev,
      shipTo: addressId,
    }));
    setShowAddressModal(false);
  };

  // Clear form
  const clearForm = () => {
    setFormData({ ...initialFormData, createdBy: userId });
    setProductSearch("");
    setFilteredProducts([]);
  };

  // Handle restore version
  const handleRestoreVersion = async (version) => {
    try {
      await restoreVersion({ id, version }).unwrap();
      setShowVersionsModal(false);
    } catch (err) {
      toast.error(
        `Failed to restore version ${version}: ${
          err.data?.message || "Unknown error"
        }`
      );
    }
  };

  // Follow-up dates handlers
  const validateFollowupDates = () => {
    if (!formData.due_date || formData.followupDates.length === 0) return true;

    const dueDate = moment(formData.due_date);
    return formData.followupDates.every((followupDate) => {
      if (!followupDate || new Date(followupDate).toString() === "Invalid Date")
        return true;
      return moment(followupDate).isSameOrBefore(dueDate, "day");
    });
  };

  const handleFollowupDateChange = (index, date) => {
    const updatedDates = [...formData.followupDates];
    updatedDates[index] = date ? date.format("YYYY-MM-DD") : "";

    if (
      formData.due_date &&
      date &&
      moment(date).isAfter(moment(formData.due_date), "day")
    ) {
      toast.warning(`Timeline date ${index + 1} cannot be after the due date.`);
    }
    if (date && moment(date).isBefore(moment().startOf("day"))) {
      toast.warning(`Timeline date ${index + 1} cannot be before today.`);
    }

    setFormData({ ...formData, followupDates: updatedDates });
  };

  const addFollowupDate = () => {
    setFormData({
      ...formData,
      followupDates: [...formData.followupDates, ""],
    });
  };

  const removeFollowupDate = (index) => {
    setFormData({
      ...formData,
      followupDates: formData.followupDates.filter((_, i) => i !== index),
    });
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.customerId) {
      toast.error("Please select a customer.");
      return;
    }
    if (formData.products.length === 0) {
      toast.error("Please add at least one product.");
      return;
    }
    if (isEditMode && (!existingQuotation || isFetching)) {
      toast.error("Quotation data is still loading or not found.");
      return;
    }
    if (!validateFollowupDates()) {
      toast.error("Timeline dates cannot be after the due date.");
      return;
    }

    const formattedProducts = formData.products.map((product) => ({
      productId: product.productId || product.id,
      quantity: Number(product.qty) || 1,
      discount: Number(product.discount) || 0,
      tax: Number(product.tax) || 0,
      total: Number(product.total) || 0,
    }));

    const formattedFormData = {
      ...formData,
      gst_value: isNaN(formData.gst_value) ? 0 : Number(formData.gst_value),
      roundOff: isNaN(formData.roundOff) ? 0 : Number(formData.roundOff),
      finalAmount: isNaN(formData.finalAmount)
        ? 0
        : Number(formData.finalAmount),
      items: formattedProducts,
      products: formattedProducts,
      shipTo: formData.shipTo || null,
      followupDates: formData.followupDates.filter(
        (date) => date && moment(date).isValid()
      ), // Filter valid dates
    };

    try {
      if (isEditMode) {
        await updateQuotation({
          id,
          updatedQuotation: formattedFormData,
        }).unwrap();
        navigate("/orders/list");
      } else {
        await createQuotation(formattedFormData).unwrap();
        setFormData({ ...initialFormData, createdBy: userId });
      }
    } catch (err) {
      let errorMessage = "Failed to process quotation: Unknown error";
      if (err.status === 404) {
        errorMessage = "Quotation not found. It may have been deleted.";
      } else if (err.status === 400) {
        errorMessage = `Invalid request: ${
          err.data?.message || "Check your input data."
        }`;
      } else if (err.data?.message) {
        errorMessage = `Failed to process quotation: ${err.data.message}`;
      }
      toast.error(errorMessage);
      if (err.status === 404) {
        setTimeout(() => navigate("/orders/list"), 2000);
      }
    }
  };

  // Loading state
  if (isFetching || isUserLoading || isCustomersLoading || isAddressesLoading) {
    return (
      <div className="content">
        <div className="card">
          <div className="card-body text-center">
            <Spinner
              animation="border"
              variant="primary"
              role="status"
              aria-label="Loading data"
            />
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
            <Alert variant="danger" role="alert">
              Error loading quotation data: {JSON.stringify(fetchError)}. Please
              try again.
            </Alert>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      <div className="content">
        <div className="card">
          <PageHeader
            title={isEditMode ? "Edit Quotation" : "Create Quotation"}
            subtitle="Fill out the quotation details"
          />
          <div className="card-body">
            <div className="d-flex justify-content-end mb-3">
              <Link to="/orders/list" className="btn btn-secondary me-2">
                <FaArrowLeft className="me-2" /> Back to Quotations
              </Link>
              {isEditMode && (
                <BootstrapButton
                  variant="outline-primary"
                  className="me-2"
                  onClick={() => setShowVersionsModal(true)}
                  disabled={isVersionsLoading}
                >
                  {isVersionsLoading ? "Loading Versions..." : "View Versions"}
                </BootstrapButton>
              )}
              <BootstrapButton variant="outline-secondary" onClick={clearForm}>
                Clear Form
              </BootstrapButton>
            </div>
            <Form onSubmit={handleSubmit}>
              <div className="row">
                <div className="col-lg-6">
                  <Form.Group className="mb-3">
                    <Form.Label>Customer *</Form.Label>
                    <Select
                      style={{ width: "100%" }}
                      value={formData.customerId || undefined}
                      onChange={(value) =>
                        handleChange({ target: { name: "customerId", value } })
                      }
                      placeholder="Select a customer"
                      disabled={isCustomersLoading}
                    >
                      {customers.length === 0 ? (
                        <Option value="">No customers available</Option>
                      ) : (
                        customers.map((customer) => (
                          <Option
                            key={customer.customerId}
                            value={customer.customerId}
                          >
                            {customer.name}
                          </Option>
                        ))
                      )}
                    </Select>
                  </Form.Group>
                </div>
                <div className="col-lg-6">
                  <Form.Group className="mb-3">
                    <Form.Label>Shipping Address</Form.Label>
                    <div className="d-flex align-items-center">
                      <Select
                        style={{ width: "100%" }}
                        value={formData.shipTo || undefined}
                        onChange={handleAddressChange}
                        placeholder="Select an address"
                        disabled={isAddressesLoading}
                      >
                        {addresses.length === 0 ? (
                          <Option value="">No addresses available</Option>
                        ) : (
                          addresses.map((address) => (
                            <Option
                              key={address.addressId}
                              value={address.addressId}
                            >
                              {address.name ||
                                `${address.street}, ${address.city}`}
                            </Option>
                          ))
                        )}
                      </Select>
                      <Button
                        type="primary"
                        className="ms-2"
                        onClick={handleAddAddress}
                        aria-label="Add new shipping address"
                      >
                        +
                      </Button>
                    </div>
                  </Form.Group>
                </div>
              </div>
              <div className="row">
                <div className="col-lg-6">
                  <Form.Group className="mb-3">
                    <Form.Label>Quotation Title *</Form.Label>
                    <Form.Control
                      type="text"
                      name="document_title"
                      value={formData.document_title}
                      onChange={handleChange}
                      required
                    />
                  </Form.Group>
                </div>
                <div className="col-lg-6">
                  <Form.Group className="mb-3">
                    <Form.Label>Quotation Number</Form.Label>
                    <Form.Control
                      type="text"
                      name="reference_number"
                      value={formData.reference_number}
                      onChange={handleChange}
                    />
                  </Form.Group>
                </div>
              </div>
              <div className="row">
                <div className="col-lg-6">
                  <Form.Group className="mb-3">
                    <Form.Label>Quotation Date *</Form.Label>
                    <Form.Control
                      type="date"
                      name="quotation_date"
                      value={formData.quotation_date}
                      onChange={handleChange}
                      required
                    />
                  </Form.Group>
                </div>
                <div className="col-lg-6">
                  <Form.Group className="mb-3">
                    <Form.Label>Due Date *</Form.Label>
                    <Form.Control
                      type="date"
                      name="due_date"
                      value={formData.due_date}
                      onChange={handleChange}
                      required
                    />
                  </Form.Group>
                </div>
              </div>
              {/* Follow-up Dates Section */}
              <div className="row">
                <div className="col-lg-12">
                  <Form.Group className="mb-3">
                    <Form.Label>Timeline Dates</Form.Label>
                    {formData.followupDates.map((date, index) => (
                      <div
                        key={index}
                        className="d-flex align-items-center mb-2"
                      >
                        <DatePicker
                          style={{ width: "100%" }}
                          value={date ? moment(date) : null}
                          onChange={(date) =>
                            handleFollowupDateChange(index, date)
                          }
                          format="YYYY-MM-DD"
                          disabledDate={(current) =>
                            current &&
                            (current < moment().startOf("day") ||
                              (formData.due_date &&
                                current >
                                  moment(formData.due_date).endOf("day")))
                          }
                        />
                        <Button
                          type="text"
                          danger
                          icon={<DeleteOutlined />}
                          onClick={() => removeFollowupDate(index)}
                          aria-label="Remove Timeline date"
                          className="ms-2"
                        />
                      </div>
                    ))}
                    <Button
                      type="primary"
                      onClick={addFollowupDate}
                      aria-label="Add Timeline date"
                    >
                      <PlusOutlined /> Add Timeline Date
                    </Button>
                  </Form.Group>
                </div>
              </div>
              <div className="row">
                <div className="col-lg-12">
                  <Form.Group className="mb-3">
                    <Form.Label>Search Product</Form.Label>
                    <div className="input-icon-start position-relative">
                      <span className="input-icon-addon">
                        <FaSearch />
                      </span>
                      <Select
                        showSearch
                        style={{ width: "100%" }}
                        placeholder="Search by product name or code"
                        onSearch={(value) => debouncedSearch(value)}
                        onChange={(value) => addProduct(value)}
                        filterOption={false}
                        loading={isProductsLoading}
                        value={productSearch || undefined}
                        notFoundContent={
                          filteredProducts.length === 0
                            ? "No products found"
                            : null
                        }
                      >
                        {filteredProducts.map((product) => (
                          <Option
                            key={product.id || product.productId}
                            value={product.id || product.productId}
                          >
                            {product.name || "Unknown"} (
                            {product.product_code || "N/A"}) - ₹
                            {Number(
                              product.meta?.[
                                "9ba862ef-f993-4873-95ef-1fef10036aa5"
                              ] || 0
                            ).toFixed(2)}
                          </Option>
                        ))}
                      </Select>
                    </div>
                  </Form.Group>
                </div>
              </div>
              <div className="row">
                <div className="col-lg-12">
                  <div className="table-responsive">
                    <table className="table table-hover">
                      <thead>
                        <tr>
                          <th>Product</th>
                          <th>Qty</th>
                          <th>Selling Price (₹)</th>
                          <th>Discount (₹)</th>
                          <th>Tax (%)</th>
                          <th>Total (₹)</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {formData.products.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="text-muted">
                              No products added
                            </td>
                          </tr>
                        ) : (
                          formData.products.map((product, index) => (
                            <tr key={product.id || index}>
                              <td>{product.name}</td>
                              <td>
                                <Form.Control
                                  type="number"
                                  value={product.qty}
                                  onChange={(e) =>
                                    updateProductField(
                                      index,
                                      "qty",
                                      Math.max(1, e.target.value)
                                    )
                                  }
                                  min="1"
                                />
                              </td>
                              <td>
                                <Form.Control
                                  type="number"
                                  value={product.sellingPrice}
                                  disabled
                                  readOnly
                                />
                              </td>
                              <td>
                                <Form.Control
                                  type="number"
                                  value={product.discount}
                                  onChange={(e) =>
                                    updateProductField(
                                      index,
                                      "discount",
                                      Math.max(0, e.target.value)
                                    )
                                  }
                                  min="0"
                                />
                              </td>
                              <td>
                                <Form.Control
                                  type="number"
                                  value={product.tax}
                                  onChange={(e) =>
                                    updateProductField(
                                      index,
                                      "tax",
                                      Math.max(0, e.target.value)
                                    )
                                  }
                                  min="0"
                                />
                              </td>
                              <td>{Number(product.total || 0).toFixed(2)}</td>
                              <td>
                                <Button
                                  type="text"
                                  danger
                                  icon={<DeleteOutlined />}
                                  onClick={() => removeProduct(index)}
                                  aria-label="Remove product"
                                />
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
              <div className="row mt-3">
                <div className="col-lg-4">
                  <Form.Group className="mb-3">
                    <Form.Label>Include GST</Form.Label>
                    <Form.Check
                      type="checkbox"
                      name="include_gst"
                      checked={formData.include_gst}
                      onChange={handleChange}
                    />
                  </Form.Group>
                </div>
                <div className="col-lg-4">
                  <Form.Group className="mb-3">
                    <Form.Label>GST Value (%)</Form.Label>
                    <Form.Control
                      type="number"
                      name="gst_value"
                      value={formData.gst_value}
                      onChange={handleChange}
                      min="0"
                    />
                  </Form.Group>
                </div>
                <div className="col-lg-4">
                  <Form.Group className="mb-3">
                    <Form.Label>Discount Type</Form.Label>
                    <Select
                      style={{ width: "100%" }}
                      value={formData.discountType}
                      onChange={(value) =>
                        handleChange({
                          target: { name: "discountType", value },
                        })
                      }
                    >
                      <Option value="percent">Percent</Option>
                      <Option value="fixed">Fixed</Option>
                    </Select>
                  </Form.Group>
                </div>
              </div>
              <div className="row">
                <div className="col-lg-6">
                  <Form.Group className="mb-3">
                    <Form.Label>Round Off</Form.Label>
                    <Form.Control
                      type="number"
                      name="roundOff"
                      value={formData.roundOff}
                      onChange={handleChange}
                    />
                  </Form.Group>
                </div>
                <div className="col-lg-6">
                  <Form.Group className="mb-3">
                    <Form.Label>Final Amount *</Form.Label>
                    <Form.Control
                      type="number"
                      name="finalAmount"
                      value={formData.finalAmount}
                      readOnly
                    />
                  </Form.Group>
                </div>
              </div>
              <div className="row">
                <div className="col-lg-6">
                  <Form.Group className="mb-3">
                    <Form.Label>Signature Name</Form.Label>
                    <Form.Control
                      type="text"
                      name="signature_name"
                      value={formData.signature_name}
                      onChange={handleChange}
                    />
                  </Form.Group>
                </div>
                <div className="col-lg-6">
                  <Form.Group className="mb-3">
                    <Form.Label>Signature Image (URL)</Form.Label>
                    <Form.Control
                      type="text"
                      name="signature_image"
                      value={formData.signature_image}
                      onChange={handleChange}
                    />
                  </Form.Group>
                </div>
              </div>
              <div className="d-flex justify-content-end mt-4">
                <BootstrapButton
                  variant="secondary"
                  className="me-2"
                  onClick={() => navigate("/orders/list")}
                  disabled={isCreating || isUpdating || isRestoring}
                >
                  Cancel
                </BootstrapButton>
                <BootstrapButton
                  variant="primary"
                  type="submit"
                  disabled={
                    isCreating ||
                    isUpdating ||
                    isRestoring ||
                    (isEditMode && !existingQuotation)
                  }
                >
                  {isCreating || isUpdating ? "Saving..." : "Submit"}
                </BootstrapButton>
              </div>
            </Form>
            {showAddressModal && (
              <AddAddress
                open={showAddressModal}
                onClose={() => setShowAddressModal(false)}
                onSave={handleAddressSave}
                existingAddress={null}
                selectedCustomer={formData.customerId}
              />
            )}
            <Modal
              title="Quotation Version History"
              open={showVersionsModal}
              onCancel={() => setShowVersionsModal(false)}
              footer={[
                <Button key="close" onClick={() => setShowVersionsModal(false)}>
                  Close
                </Button>,
              ]}
              width={800}
            >
              {isVersionsLoading ? (
                <div className="text-center">
                  <Spinner animation="border" variant="primary" />
                  <p>Loading versions...</p>
                </div>
              ) : versions.length === 0 ? (
                <Text>No version history available.</Text>
              ) : (
                <List
                  dataSource={versions}
                  renderItem={(version) => (
                    <List.Item
                      actions={[
                        <Button
                          type="primary"
                          onClick={() => handleRestoreVersion(version.version)}
                          disabled={isRestoring}
                        >
                          {isRestoring ? "Restoring..." : "Restore"}
                        </Button>,
                      ]}
                    >
                      <List.Item.Meta
                        title={`Version ${version.version}`}
                        description={
                          <>
                            <Text>
                              Updated by: {version.updatedBy || "Unknown"}
                            </Text>
                            <br />
                            <Text>
                              Updated at:{" "}
                              {new Date(version.updatedAt).toLocaleString()}
                            </Text>
                            <br />
                            <Text>
                              Products: {version.quotationItems.length}
                            </Text>
                            <br />
                            <Text>
                              Final Amount: ₹
                              {Number(
                                version.quotationData.finalAmount || 0
                              ).toFixed(2)}
                            </Text>
                            <br />
                            <Text>
                              Follow-up Dates:{" "}
                              {version.quotationData.followupDates?.join(
                                ", "
                              ) || "None"}
                            </Text>
                          </>
                        }
                      />
                    </List.Item>
                  )}
                />
              )}
            </Modal>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddQuotation;
