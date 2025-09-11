import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  Form,
  Spinner,
  Alert,
  Modal,
  Button as BootstrapButton,
} from "react-bootstrap";
import { FaArrowLeft, FaSearch } from "react-icons/fa";
import { DeleteOutlined } from "@ant-design/icons";
import { Select, Button } from "antd";
import { toast } from "sonner";
import { debounce } from "lodash";
import PageHeader from "../Common/PageHeader";
import {
  useCreateQuotationMutation,
  useGetQuotationByIdQuery,
  useUpdateQuotationMutation,
} from "../../api/quotationApi";
import { useGetAllProductsQuery } from "../../api/productApi";
import { useGetCustomersQuery } from "../../api/customerApi";
import {
  useGetAllAddressesQuery,
  useCreateAddressMutation,
} from "../../api/addressApi";
import { useGetProfileQuery } from "../../api/userApi";

const { Option } = Select;

// AddAddressModal component
const AddAddressModal = ({ show, onClose, onSave, isCreatingAddress }) => {
  const [addressData, setAddressData] = useState({
    name: "",
    street: "",
    city: "",
    state: "",
    country: "",
    postalCode: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setAddressData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const newAddress = await onSave(addressData).unwrap();

      setAddressData({
        name: "",
        street: "",
        city: "",
        state: "",
        country: "",
        postalCode: "",
      });
      onClose();
    } catch (err) {
      toast.error(
        `Failed to create address: ${err.data?.message || "Unknown error"}`
      );
    }
  };

  return (
    <Modal show={show} onHide={onClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>Add New Address</Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>Name</Form.Label>
            <Form.Control
              type="text"
              name="name"
              value={addressData.name}
              onChange={handleChange}
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Street *</Form.Label>
            <Form.Control
              type="text"
              name="street"
              value={addressData.street}
              onChange={handleChange}
              required
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>City *</Form.Label>
            <Form.Control
              type="text"
              name="city"
              value={addressData.city}
              onChange={handleChange}
              required
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>State</Form.Label>
            <Form.Control
              type="text"
              name="state"
              value={addressData.state}
              onChange={handleChange}
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Country *</Form.Label>
            <Form.Control
              type="text"
              name="country"
              value={addressData.country}
              onChange={handleChange}
              required
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Postal Code</Form.Label>
            <Form.Control
              type="text"
              name="postalCode"
              value={addressData.postalCode}
              onChange={handleChange}
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <BootstrapButton
            variant="secondary"
            onClick={onClose}
            disabled={isCreatingAddress}
          >
            Cancel
          </BootstrapButton>
          <BootstrapButton
            variant="primary"
            type="submit"
            disabled={isCreatingAddress}
          >
            {isCreatingAddress ? "Saving..." : "Save Address"}
          </BootstrapButton>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

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
  console.log(existingQuotation);
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
  const [createAddress, { isLoading: isCreatingAddress }] =
    useCreateAddressMutation();

  // Data assignments
  const userId = userData?.user?.userId || "nill";
  const customers = customersData?.data || [];
  const addresses = Array.isArray(addressesData) ? addressesData : [];
  const products = productsData || [];

  // Initial form data
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
  };

  // State
  const [formData, setFormData] = useState(initialFormData);
  const [productSearch, setProductSearch] = useState("");
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [addressType, setAddressType] = useState("");
  const [filteredProducts, setFilteredProducts] = useState([]);

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
  }, [fetchError, isEditMode, navigate, isFetchSuccess, existingQuotation]);

  // Pre-fill form in edit mode
  useEffect(() => {
    if (isEditMode && existingQuotation) {
      // Parse products if it's a string
      let parsedProducts = existingQuotation.products;
      if (typeof parsedProducts === "string") {
        try {
          parsedProducts = JSON.parse(parsedProducts);
        } catch (error) {
          console.error("Failed to parse products:", error);
          parsedProducts = [];
        }
      }

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
        products: Array.isArray(parsedProducts)
          ? parsedProducts.map((p) => ({
              id: p.productId,
              productId: p.productId,
              name: p.name || "Unknown",
              qty: Number(p.quantity) || 1,
              sellingPrice: Number(p.sellingPrice) || 0,
              discount: Number(p.discount) || 0,
              tax: Number(p.tax) || 0,
              total: Number(p.total) || 0,
            }))
          : [],
      });
    }
  }, [existingQuotation, userId, isEditMode]);
  // Debounced product search
  const debouncedSearch = useCallback(
    debounce((value) => {
      setProductSearch(value);
      if (value) {
        const filtered = products
          .filter(
            (product) =>
              product.name.toLowerCase().includes(value.toLowerCase()) ||
              product.product_code?.toLowerCase().includes(value.toLowerCase())
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
    const product = products.find((p) => p.id === productId);
    if (!product) return;
    setFormData((prev) => ({
      ...prev,
      products: [
        ...prev.products,
        {
          id: product.id,
          productId: product.id,
          name: product.name,
          qty: 1,
          sellingPrice: Number(product.sellingPrice) || 0,
          discount: 0,
          tax: 0,
          total: Number(product.sellingPrice) || 0,
        },
      ],
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
    let subtotal = formData.products.reduce(
      (sum, product) => sum + Number(product.total || 0),
      0
    );
    let gstAmount = formData.include_gst
      ? (subtotal * (parseFloat(formData.gst_value) || 0)) / 100
      : 0;
    let finalAmount =
      subtotal + gstAmount + (parseFloat(formData.roundOff) || 0);
    setFormData((prev) => ({ ...prev, finalAmount: finalAmount.toFixed(2) }));
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
    const updatedProducts = [...formData.products];
    updatedProducts[index][field] = value;

    if (["qty", "discount", "tax"].includes(field)) {
      const qty = parseFloat(updatedProducts[index].qty) || 0;
      const sellingPrice = parseFloat(updatedProducts[index].sellingPrice) || 0;
      const discount = parseFloat(updatedProducts[index].discount) || 0;
      const tax = parseFloat(updatedProducts[index].tax) || 0;
      updatedProducts[index].total =
        Number((qty * sellingPrice - discount) * (1 + tax / 100)) || 0;
    }

    setFormData({ ...formData, products: updatedProducts });
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
  const handleAddressChange = (value, type) => {
    setFormData((prev) => ({
      ...prev,
      [type]: value,
    }));
  };

  // Handle add address
  const handleAddAddress = (type) => {
    setAddressType(type);
    setShowAddressModal(true);
  };

  // Clear form
  const clearForm = () => {
    setFormData({ ...initialFormData, createdBy: userId });
    setProductSearch("");
    setFilteredProducts([]);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.customerId) {
      toast.error("Please select a customer.");
      return;
    }
    if (isEditMode && (!existingQuotation || isFetching)) {
      toast.error("Quotation data is still loading or not found.");
      return;
    }

    const formattedProducts = formData.products.map((product) => ({
      productId: product.id || product.productId || null,
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
      products: formData.products.length > 0 ? formData.products : [],
      shipTo: formData.shipTo || null,
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
                        onChange={(value) =>
                          handleAddressChange(value, "shipTo")
                        }
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
                        onClick={() => handleAddAddress("shipTo")}
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
                    <Form.Label>Reference Number</Form.Label>
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
                        onSearch={debouncedSearch}
                        onChange={addProduct}
                        filterOption={false}
                        loading={isProductsLoading}
                      >
                        {filteredProducts.map((product) => (
                          <Option key={product.id} value={product.id}>
                            {product.name} ({product.product_code}) - ₹
                            {product.sellingPrice}
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
                  disabled={isCreating || isUpdating}
                >
                  Cancel
                </BootstrapButton>
                <BootstrapButton
                  variant="primary"
                  type="submit"
                  disabled={
                    isCreating ||
                    isUpdating ||
                    (isEditMode && !existingQuotation)
                  }
                >
                  {isCreating || isUpdating ? "Saving..." : "Submit"}
                </BootstrapButton>
              </div>
            </Form>
            <AddAddressModal
              show={showAddressModal}
              onClose={() => setShowAddressModal(false)}
              onSave={createAddress}
              isCreatingAddress={isCreatingAddress}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddQuotation;
