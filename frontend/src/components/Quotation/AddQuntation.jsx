import React, { useState, useEffect } from "react";
import { FaArrowLeft } from "react-icons/fa";
import {
  useCreateQuotationMutation,
  useGetQuotationByIdQuery,
  useUpdateQuotationMutation,
} from "../../api/quotationApi";
import { useGetAllProductsQuery } from "../../api/productApi";
import { useGetCustomersQuery } from "../../api/customerApi";
import { PiPlus } from "react-icons/pi";
import { useGetProfileQuery } from "../../api/userApi";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { BiTrash } from "react-icons/bi";

const AddQuotation = () => {
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const navigate = useNavigate();
  const {
    data: existingQuotation,
    isLoading: isFetching,
    error: fetchError,
    isSuccess: isFetchSuccess,
  } = useGetQuotationByIdQuery(id, { skip: !isEditMode });
  const { data: userData } = useGetProfileQuery();
  const userId = userData?.user?.userId || "nill";
  const { data: customersData } = useGetCustomersQuery();
  const customers = customersData?.data || [];

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
    createdBy: userId,
  };

  const [formData, setFormData] = useState(initialFormData);
  const [productSearch, setProductSearch] = useState("");
  const { data: products, isLoading: isProductsLoading } =
    useGetAllProductsQuery();
  const [createQuotation, { isLoading: isCreating }] =
    useCreateQuotationMutation();
  const [updateQuotation, { isLoading: isUpdating }] =
    useUpdateQuotationMutation();

  // Handle fetch errors
  useEffect(() => {
    if (isEditMode && fetchError) {
      toast.error("Quotation not found or inaccessible. Redirecting...", {
        position: "top-right",
        autoClose: 3000,
      });
      setTimeout(() => navigate("/quotations/list"), 2000);
    }
    if (isEditMode && isFetchSuccess && !existingQuotation) {
      console.warn("No quotation data found for ID:", id);
      toast.error("Quotation not found. Redirecting to quotations list...", {
        position: "top-right",
        autoClose: 3000,
      });
      setTimeout(() => navigate("/quotations/list"), 2000);
    }
  }, [
    fetchError,
    isEditMode,
    navigate,
    isFetching,
    isFetchSuccess,
    existingQuotation,
  ]);

  // Pre-fill form in edit mode
  useEffect(() => {
    if (isEditMode && existingQuotation) {
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
        createdBy: userId,
        products:
          existingQuotation.products?.map((p) => ({
            id: p.productId,
            productId: p.productId,
            name: p.name || "Unknown",
            qty: Number(p.quantity) || 1,
            sellingPrice: Number(p.sellingPrice) || 0,
            discount: Number(p.discount) || 0,
            tax: Number(p.tax) || 0,
            total: Number(p.total) || 0,
          })) || [],
      });
    }
  }, [existingQuotation, userId, isEditMode]);

  // Add product to quotation
  const addProduct = (product) => {
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
    toast.success("Product added successfully!");
  };

  // Remove product from quotation
  const removeProduct = (index) => {
    setFormData((prev) => ({
      ...prev,
      products: prev.products.filter((_, i) => i !== index),
    }));
    toast.info("Product removed from quotation.");
  };

  // Calculate final amount
  const calculateFinalAmount = () => {
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
  };

  useEffect(() => {
    calculateFinalAmount();
  }, [
    formData.products,
    formData.include_gst,
    formData.gst_value,
    formData.roundOff,
  ]);

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

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleCustomerChange = (e) => {
    const selectedCustomerId = e.target.value;

    setFormData((prev) => ({
      ...prev,
      customerId: selectedCustomerId,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.customerId) {
      toast.error("Please select a customer.", {
        position: "top-right",
        autoClose: 3000,
      });
      return;
    }

    if (isEditMode && (!existingQuotation || isFetching)) {
      toast.error("Quotation data is still loading or not found.", {
        position: "top-right",
        autoClose: 3000,
      });
      return;
    }

    // Format products for backend
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
    };

    try {
      if (isEditMode) {
        const response = await updateQuotation({
          id,
          updatedQuotation: formattedFormData,
        }).unwrap();

        toast.success("Quotation updated successfully!", {
          position: "top-right",
          autoClose: 3000,
        });
        navigate("/quotations/list");
      } else {
        const response = await createQuotation(formattedFormData).unwrap();

        toast.success("Quotation created successfully!", {
          position: "top-right",
          autoClose: 3000,
        });
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
      toast.error(errorMessage, {
        position: "top-right",
        autoClose: 3000,
      });
      if (err.status === 404) {
        setTimeout(() => navigate("/quotations/list"), 2000);
      }
    }
  };

  const filteredProducts = products
    ?.filter((product) =>
      product.name.toLowerCase().includes(productSearch.toLowerCase())
    )
    .slice(0, 3);

  if (isFetching) {
    return (
      <div className="text-center">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading quotation details...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      <div className="content">
        <div className="page-header d-flex justify-content-between">
          <div className="page-title">
            <h4 className="fw-bold">
              {isEditMode ? "Edit Quotation" : "Create Quotation"}
            </h4>
            <h6>Fill out the quotation details</h6>
          </div>
          <div className="page-btn">
            <a href="/quotations/list" className="btn btn-secondary">
              <FaArrowLeft className="me-2" /> Back to Quotations
            </a>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="row">
            <div className="col-md-6">
              <div className="mb-3">
                <label className="form-label">Customer*</label>
                <div className="row">
                  <div className="col-lg-10 col-sm-10 col-10">
                    <select
                      className="form-control"
                      name="customerId"
                      value={formData.customerId}
                      onChange={handleCustomerChange}
                      required
                    >
                      <option value="">Select</option>
                      {isProductsLoading ? (
                        <option>Loading...</option>
                      ) : customers.length === 0 ? (
                        <option>No customers available</option>
                      ) : (
                        customers.map((customer) => (
                          <option
                            key={customer.customerId}
                            value={customer.customerId}
                          >
                            {customer.name}
                          </option>
                        ))
                      )}
                    </select>
                  </div>
                  <div className="col-lg-2 col-sm-2 col-2 p-0">
                    <div className="add-icon tab">
                      <a className="bg-dark text-white p-2 rounded">
                        <PiPlus />
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="row">
            <div className="col-md-6">
              <label className="form-label">Document Title *</label>
              <input
                type="text"
                className="form-control"
                name="document_title"
                value={formData.document_title}
                onChange={handleChange}
                required
              />
            </div>
            <div className="col-md-6">
              <label className="form-label">Quotation Date *</label>
              <input
                type="date"
                className="form-control"
                name="quotation_date"
                value={formData.quotation_date}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="row mt-3">
            <div className="col-md-6">
              <label className="form-label">Due Date *</label>
              <input
                type="date"
                className="form-control"
                name="due_date"
                value={formData.due_date}
                onChange={handleChange}
                required
              />
            </div>
            <div className="col-md-6">
              <label className="form-label">Reference Number</label>
              <input
                type="text"
                className="form-control"
                name="reference_number"
                value={formData.reference_number}
                onChange={handleChange}
              />
            </div>
          </div>
          <div className="row">
            <div className="col-lg-12">
              <div className="mb-3">
                <label className="form-label">Search Product</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Enter product name"
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                />
                {productSearch && (
                  <ul className="list-group mt-2">
                    {filteredProducts?.map((product) => (
                      <li
                        key={product.id}
                        className="list-group-item list-group-item-action"
                        onClick={() => addProduct(product)}
                      >
                        {product.name} - ${product.sellingPrice}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <div className="col-lg-12">
              <div className="table-responsive">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Qty</th>
                      <th>Selling Price ($)</th>
                      <th>Discount ($)</th>
                      <th>Tax (%)</th>
                      <th>Total ($)</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.products.map((product, index) => (
                      <tr key={product.id || index}>
                        <td>{product.name}</td>
                        <td>
                          <input
                            type="number"
                            value={product.qty}
                            onChange={(e) =>
                              updateProductField(
                                index,
                                "qty",
                                Math.max(1, e.target.value)
                              )
                            }
                            className="form-control"
                            min="1"
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            value={product.sellingPrice}
                            className="form-control"
                            disabled
                            readOnly
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            value={product.discount}
                            onChange={(e) =>
                              updateProductField(
                                index,
                                "discount",
                                Math.max(0, e.target.value)
                              )
                            }
                            className="form-control"
                            min="0"
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            value={product.tax}
                            onChange={(e) =>
                              updateProductField(
                                index,
                                "tax",
                                Math.max(0, e.target.value)
                              )
                            }
                            className="form-control"
                            min="0"
                          />
                        </td>
                        <td>{Number(product.total || 0).toFixed(2)}</td>
                        <td>
                          <button
                            type="button"
                            className="btn btn-sm btn-danger"
                            onClick={() => removeProduct(index)}
                            aria-label="Remove product"
                          >
                            <BiTrash />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          <div className="row mt-3">
            <div className="col-md-4">
              <label className="form-label">Include GST</label>
              <input
                type="checkbox"
                className="form-check-input ms-2"
                name="include_gst"
                checked={formData.include_gst}
                onChange={handleChange}
              />
            </div>
            <div className="col-md-4">
              <label className="form-label">GST Value</label>
              <input
                type="number"
                className="form-control"
                name="gst_value"
                value={formData.gst_value}
                onChange={handleChange}
                min="0"
              />
            </div>
            <div className="col-md-4">
              <label className="form-label">Discount Type</label>
              <select
                className="form-control"
                name="discountType"
                value={formData.discountType}
                onChange={handleChange}
              >
                <option value="percent">Percent</option>
                <option value="fixed">Fixed</option>
              </select>
            </div>
          </div>

          <div className="row mt-3">
            <div className="col-md-6">
              <label className="form-label">Round Off</label>
              <input
                type="number"
                className="form-control"
                name="roundOff"
                value={formData.roundOff}
                onChange={(e) =>
                  setFormData({ ...formData, roundOff: e.target.value })
                }
              />
            </div>
            <div className="col-md-6">
              <label className="form-label">Final Amount *</label>
              <input
                type="number"
                className="form-control"
                name="finalAmount"
                value={formData.finalAmount}
                readOnly
              />
            </div>
          </div>

          <div className="row mt-3">
            <div className="col-md-6">
              <label className="form-label">Signature Name</label>
              <input
                type="text"
                className="form-control"
                name="signature_name"
                value={formData.signature_name}
                onChange={handleChange}
              />
            </div>
            <div className="col-md-6">
              <label className="form-label">Signature Image (URL)</label>
              <input
                type="text"
                className="form-control"
                name="signature_image"
                value={formData.signature_image}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="modal-footer mt-4">
            <button
              type="button"
              className="btn btn-secondary me-2"
              onClick={() => navigate("/quotations/list")}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={
                isCreating || isUpdating || (isEditMode && !existingQuotation)
              }
            >
              {isCreating || isUpdating ? "Saving..." : "Submit"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddQuotation;
