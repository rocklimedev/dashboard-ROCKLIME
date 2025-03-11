import React, { useState, useEffect } from "react";
import { FaArrowLeft } from "react-icons/fa";
import { useCreateQuotationMutation } from "../../api/quotationApi";
import { useGetAllProductsQuery } from "../../api/productApi";
import { useGetCustomersQuery } from "../../api/customerApi";
import { PiPlus } from "react-icons/pi";
const AddQuotation = () => {
  const [formData, setFormData] = useState({
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
  });

  const [productSearch, setProductSearch] = useState("");
  const { data: products, isLoading, error } = useGetAllProductsQuery();
  const { data: customersData } = useGetCustomersQuery();
  const customers = customersData?.data || [];
  const [createQuotation] = useCreateQuotationMutation();
  const addProduct = (product) => {
    setFormData((prev) => ({
      ...prev,
      products: [
        ...prev.products,
        {
          ...product,
          qty: 1,
          discount: product.discountType || 0,
          tax: 0,
          total: Number(product.sellingPrice) || 0, // Ensure total is a number
        },
      ],
    }));
  };
  // Function to calculate final amount
  const calculateFinalAmount = () => {
    let subtotal = formData.products.reduce(
      (sum, product) => sum + product.total,
      0
    );
    let gstAmount = formData.include_gst
      ? (subtotal * (parseFloat(formData.gst_value) || 0)) / 100
      : 0;
    let finalAmount =
      subtotal + gstAmount + (parseFloat(formData.roundOff) || 0);
    setFormData((prev) => ({ ...prev, finalAmount: finalAmount.toFixed(2) }));
  };

  // Recalculate the final amount whenever products, GST, or round-off change
  useEffect(() => {
    calculateFinalAmount();
  }, [
    formData.products,
    formData.include_gst,
    formData.gst_value,
    formData.roundOff,
  ]);

  const updateProductField = (index, field, value) => {
    const updatedProducts = [...formData.products];
    updatedProducts[index][field] = value;

    if (["qty", "price", "discount", "tax"].includes(field)) {
      const qty = parseFloat(updatedProducts[index].qty) || 0;
      const price = parseFloat(updatedProducts[index].price) || 0;
      const discount = parseFloat(updatedProducts[index].discount) || 0;
      const tax = parseFloat(updatedProducts[index].tax) || 0;
      updatedProducts[index].total =
        Number((qty * price - discount) * (1 + tax / 100)) || 0;
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createQuotation(formData).unwrap();
      alert("Quotation created successfully!");
    } catch (err) {
      console.error("Failed to create quotation:", err);
      alert("Failed to create quotation.");
    }
  };

  const filteredProducts = products
    ?.filter((product) =>
      product.name.toLowerCase().includes(productSearch.toLowerCase())
    )
    .slice(0, 3);
  return (
    <div className="page-wrapper">
      <div className="content">
        <div className="page-header d-flex justify-between">
          <div className="page-title">
            <h4 className="fw-bold">Create Quotation</h4>
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
                  <div class="col-lg-10 col-sm-10 col-10">
                    <select
                      className="form-control"
                      name="customerId"
                      value={formData.customerId}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Select</option>
                      {isLoading ? (
                        <option>Loading...</option>
                      ) : error ? (
                        <option>Error loading customers</option>
                      ) : (
                        customers?.map((customer) => (
                          <option key={customer.id} value={customer.id}>
                            {customer.name}
                          </option>
                        ))
                      )}
                    </select>
                  </div>
                  <div class="col-lg-2 col-sm-2 col-2 p-0">
                    <div class="add-icon tab">
                      <a class="bg-dark text-white p-2 rounded">
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
                    {filteredProducts.map((product) => (
                      <li
                        key={product.id}
                        className="list-group-item list-group-item-action"
                        onClick={() => addProduct(product)}
                      >
                        {product.name} - ${product.price}
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
                      <th>Price ($)</th>
                      <th>Discount ($)</th>
                      <th>Tax (%)</th>
                      <th>Total ($)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.products.map((product, index) => (
                      <tr key={index}>
                        <td>{product.name}</td>
                        <td>
                          <input
                            type="number"
                            value={product.qty}
                            onChange={(e) =>
                              updateProductField(index, "qty", e.target.value)
                            }
                            className="form-control"
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            value={product.price}
                            onChange={(e) =>
                              updateProductField(index, "price", e.target.value)
                            }
                            className="form-control"
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
                                e.target.value
                              )
                            }
                            className="form-control"
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            value={product.tax}
                            onChange={(e) =>
                              updateProductField(index, "tax", e.target.value)
                            }
                            className="form-control"
                          />
                        </td>
                        <td>{Number(product.total || 0).toFixed(2)}</td>
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
            <button type="button" className="btn btn-secondary me-2">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Submit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddQuotation;
