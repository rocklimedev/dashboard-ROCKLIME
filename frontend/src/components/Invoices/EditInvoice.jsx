import React, { useState, useMemo, useEffect } from "react";
import { useUpdateInvoiceMutation } from "../../api/invoiceApi";
import { useGetAllProductsQuery } from "../../api/productApi";
import { useGetAllAddressesQuery } from "../../api/addressApi";
import { useGetCustomersQuery } from "../../api/customerApi";
import { useGetProfileQuery } from "../../api/userApi";

const EditInvoice = ({ invoice, onClose }) => {
  const { data: userProfile } = useGetProfileQuery();
  const userId = userProfile?.user?.userId;

  const [updateInvoice, { isLoading: isUpdating }] = useUpdateInvoiceMutation();
  const { data: addressesData = { data: [] }, isLoading: isAddressesLoading } =
    useGetAllAddressesQuery(userId, { skip: !userId });
  const { data: allProducts = [], isLoading: isProductsLoading } =
    useGetAllProductsQuery();
  const {
    data: customersResponse = { data: [] },
    isLoading: isCustomersLoading,
    error: customersError,
  } = useGetCustomersQuery();

  const customers = customersResponse?.data || [];
  const addresses = useMemo(
    () =>
      Array.isArray(addressesData?.data)
        ? addressesData.data
        : Array.isArray(addressesData)
        ? addressesData
        : [],
    [addressesData]
  );

  const [formData, setFormData] = useState({
    invoiceNo: invoice.invoiceNo || "",
    customerId: invoice.customerId || "",
    billTo: invoice.billTo || "",
    shipTo: invoice.shipTo || "",
    invoiceDate:
      invoice.invoiceDate && invoice.invoiceDate !== "0000-00-00"
        ? new Date(invoice.invoiceDate).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0],
    dueDate:
      invoice.dueDate && invoice.dueDate !== "0000-00-00"
        ? new Date(invoice.dueDate).toISOString().split("T")[0]
        : "",
    amount: parseFloat(invoice.amount) || 0,
    paymentMethod: invoice.paymentMethod
      ? typeof invoice.paymentMethod === "string" &&
        invoice.paymentMethod.startsWith("{")
        ? JSON.parse(invoice.paymentMethod).method
        : invoice.paymentMethod
      : "",
    status: invoice.status || "Draft",
    signatureName: invoice.signatureName || "",
  });

  const [products, setProducts] = useState(() => {
    let initialProducts = [];

    if (invoice?.products) {
      try {
        const parsedProducts =
          typeof invoice.products === "string"
            ? JSON.parse(invoice.products)
            : invoice.products;

        if (Array.isArray(parsedProducts) && parsedProducts.length > 0) {
          initialProducts = parsedProducts
            .filter((prod) => prod.productId && prod.productId.trim() !== "")
            .map((prod) => ({
              productId: prod.productId || "",
              price: parseFloat(prod.price) || 0,
              quantity: parseInt(prod.quantity) || 1,
            }));
        }
      } catch (err) {
        console.error("Failed to parse invoice.products:", err);
      }
    }

    return initialProducts;
  });

  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (customers.length > 0 && invoice.customerId) {
      const customerExists = customers.find(
        (c) => c.customerId === invoice.customerId
      );
      if (customerExists && formData.customerId !== invoice.customerId) {
        setFormData((prev) => ({ ...prev, customerId: invoice.customerId }));
      } else if (!customerExists && !formData.customerId) {
        setFormData((prev) => ({
          ...prev,
          customerId: customers[0]?.customerId || "",
        }));
      }
    }
  }, [customers, invoice.customerId, formData.customerId]);

  useEffect(() => {
    console.log("Invoice Prop:", invoice);
    console.log("Invoice.products Type:", typeof invoice.products);
    console.log("Invoice.products Value:", invoice.products);
    console.log("Products State:", products);
    console.log("Customers:", customers);
    console.log("Current customerId:", formData.customerId);
    console.log("Addresses:", addresses);
    console.log("Current shipTo:", formData.shipTo);
  }, [
    invoice,
    products,
    customers,
    formData.customerId,
    addresses,
    formData.shipTo,
  ]);

  const searchResults = useMemo(() => {
    if (!searchTerm) return [];
    return allProducts
      .filter((product) =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .slice(0, 10);
  }, [searchTerm, allProducts]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError(null);
  };

  const handleProductChange = (index, field, value) => {
    const updatedProducts = [...products];
    updatedProducts[index] = {
      ...updatedProducts[index],
      [field]:
        field === "quantity" ? parseInt(value) || 1 : parseFloat(value) || 0,
    };
    setProducts(updatedProducts);
    updateTotalAmount(updatedProducts);
  };

  const handleAddProduct = (product) => {
    if (!product.productId || product.productId.trim() === "") {
      setError("Cannot add product: Invalid product ID.");
      return;
    }
    const newProduct = {
      productId: product.productId,
      price: parseFloat(product.sellingPrice) || 0,
      quantity: 1,
    };
    const updatedProducts = products.some((p) => !p.productId)
      ? products
          .filter((p) => p.productId && p.productId.trim() !== "")
          .concat(newProduct)
      : [...products, newProduct];
    setProducts(updatedProducts);
    updateTotalAmount(updatedProducts);
    setSearchTerm("");
  };

  const handleRemoveProduct = (index) => {
    if (products.length <= 1 && products.every((p) => p.productId)) {
      setError("At least one product is required.");
      return;
    }
    const updatedProducts = products.filter((_, i) => i !== index);
    setProducts(updatedProducts);
    updateTotalAmount(updatedProducts);
  };

  const updateTotalAmount = (updatedProducts) => {
    const total = updatedProducts.reduce(
      (sum, prod) =>
        sum + (parseFloat(prod.price) || 0) * (parseInt(prod.quantity) || 0),
      0
    );
    setFormData((prev) => ({ ...prev, amount: total.toFixed(2) }));
  };

  const getProductName = (productId) => {
    const product = allProducts.find((p) => p.productId === productId);
    return product ? product.name : "Unknown Product";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Validate required fields
    if (!formData.customerId) {
      setError("Please select a customer.");
      return;
    }
    const customer = customers.find(
      (c) => c.customerId === formData.customerId
    );
    if (!customer) {
      setError("Selected customer is invalid or not found.");
      return;
    }
    if (
      formData.shipTo &&
      !addresses.find((a) => a.addressId === formData.shipTo)
    ) {
      setError("Selected shipping address is invalid.");
      return;
    }
    if (!formData.status) {
      setError("Please select a status.");
      return;
    }
    if (!formData.invoiceDate) {
      setError("Invoice date is required.");
      return;
    }
    const validProducts = products.filter(
      (p) => p.productId && p.productId.trim() !== ""
    );
    if (validProducts.length === 0) {
      setError("Please add at least one valid product.");
      return;
    }
    if (
      validProducts.some(
        (p) => !allProducts.find((prod) => prod.productId === p.productId)
      )
    ) {
      setError("One or more selected products are invalid or not found.");
      return;
    }

    const invoiceData = {
      customerId: formData.customerId,
      billTo: formData.billTo || null,
      shipTo: formData.shipTo || null,
      invoiceDate: formData.invoiceDate
        ? new Date(formData.invoiceDate).toISOString()
        : null,
      dueDate: formData.dueDate
        ? new Date(formData.dueDate).toISOString()
        : null,
      amount: parseFloat(formData.amount) || 0,
      paymentMethod: formData.paymentMethod
        ? JSON.stringify({ method: formData.paymentMethod })
        : null,
      status: formData.status,
      signatureName: formData.signatureName || null,
      products: validProducts.map((prod) => ({
        productId: prod.productId,
        price: parseFloat(prod.price) || 0,
        quantity: parseInt(prod.quantity) || 1,
      })),
    };

    const payload = {
      invoiceId: invoice.invoiceId,
      ...invoiceData,
    };

    console.log("Submitting Payload:", payload); // Debug payload
    try {
      const response = await updateInvoice(payload).unwrap();
      console.log("Update Invoice Response:", response);
      onClose();
    } catch (err) {
      console.error("Update Invoice Error:", err, "Response Data:", err.data);
      setError(
        err.data?.message ||
          err.data?.errors?.join(", ") ||
          "Failed to update invoice. Please try again."
      );
    }
  };

  return (
    <div
      className="modal fade show d-block"
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
    >
      <div className="modal-dialog modal-xl">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Edit Invoice</h5>
            <button
              type="button"
              className="btn-close"
              onClick={onClose}
            ></button>
          </div>
          <div className="modal-body">
            {error && <div className="alert alert-danger">{error}</div>}
            {customersError && (
              <div className="alert alert-danger">
                Failed to load customers:{" "}
                {customersError.message || "Unknown error"}
              </div>
            )}
            <form onSubmit={handleSubmit}>
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="form-label">Invoice Number</label>
                  <input
                    type="text"
                    className="form-control"
                    name="invoiceNo"
                    value={formData.invoiceNo}
                    disabled
                  />
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label">Customer</label>
                  {isCustomersLoading ? (
                    <div>Loading customers...</div>
                  ) : customers.length === 0 ? (
                    <div className="text-danger">No customers available</div>
                  ) : (
                    <select
                      className="form-control"
                      name="customerId"
                      value={formData.customerId || ""}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Select Customer</option>
                      {customers.map((cust) => (
                        <option key={cust.customerId} value={cust.customerId}>
                          {cust.name || "Unnamed Customer"}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label">Bill To</label>
                  <input
                    type="text"
                    className="form-control"
                    name="billTo"
                    value={formData.billTo}
                    onChange={handleChange}
                  />
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label">Ship To</label>
                  {isAddressesLoading ? (
                    <div>Loading addresses...</div>
                  ) : addresses.length === 0 ? (
                    <div className="text-warning">No addresses available</div>
                  ) : (
                    <select
                      className="form-control"
                      name="shipTo"
                      value={formData.shipTo || ""}
                      onChange={handleChange}
                    >
                      <option value="">No Address</option>
                      {addresses.map((addr) => (
                        <option key={addr.addressId} value={addr.addressId}>
                          {[
                            addr?.street,
                            addr?.city,
                            addr?.state,
                            addr?.postalCode,
                            addr?.country,
                          ]
                            .filter(Boolean)
                            .join(", ") || "Incomplete Address"}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label">Invoice Date</label>
                  <input
                    type="date"
                    className="form-control"
                    name="invoiceDate"
                    value={formData.invoiceDate}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label">Due Date</label>
                  <input
                    type="date"
                    className="form-control"
                    name="dueDate"
                    value={formData.dueDate}
                    onChange={handleChange}
                  />
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label">Payment Method</label>
                  <select
                    className="form-control"
                    name="paymentMethod"
                    value={formData.paymentMethod}
                    onChange={handleChange}
                  >
                    <option value="">Select Method</option>
                    {["Cash", "Credit Card", "Bank Transfer"].map((method) => (
                      <option key={method} value={method}>
                        {method}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label">Status</label>
                  <select
                    className="form-control"
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select Status</option>
                    {["Paid", "Unpaid", "Overdue", "Draft"].map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label">Signature Name</label>
                  <input
                    type="text"
                    className="form-control"
                    name="signatureName"
                    value={formData.signatureName}
                    onChange={handleChange}
                  />
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label">Total Amount (Rs)</label>
                  <input
                    type="number"
                    className="form-control"
                    name="amount"
                    value={formData.amount}
                    readOnly
                  />
                </div>
              </div>
              <div className="mb-3">
                <label className="form-label">Search Products</label>
                <input
                  type="text"
                  className="form-control"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Enter product name"
                />
                {searchResults.length > 0 && (
                  <ul className="list-group mt-2">
                    {searchResults.map((product) => (
                      <li
                        key={product.productId}
                        className="list-group-item d-flex justify-content-between align-items-center"
                      >
                        {product.name} (Rs {product.sellingPrice})
                        <button
                          type="button"
                          className="btn btn-sm btn-primary"
                          onClick={() => handleAddProduct(product)}
                        >
                          Add
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <h6 className="mt-4">Products</h6>
              {isProductsLoading ? (
                <div>Loading products...</div>
              ) : products.length === 0 ||
                products.every(
                  (p) => !p.productId || p.productId.trim() === ""
                ) ? (
                <div className="alert alert-warning">
                  Please add at least one product.
                </div>
              ) : (
                <table className="table table-bordered">
                  <thead>
                    <tr>
                      <th>Product Name</th>
                      <th>Price (Rs)</th>
                      <th>Quantity</th>
                      <th>Remove</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products
                      .filter(
                        (prod) => prod.productId && prod.productId.trim() !== ""
                      )
                      .map((prod, index) => (
                        <tr key={index}>
                          <td>{getProductName(prod.productId)}</td>
                          <td>
                            <input
                              type="number"
                              className="form-control"
                              value={prod.price}
                              onChange={(e) =>
                                handleProductChange(
                                  index,
                                  "price",
                                  e.target.value
                                )
                              }
                              min="0"
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              className="form-control"
                              value={prod.quantity}
                              onChange={(e) =>
                                handleProductChange(
                                  index,
                                  "quantity",
                                  e.target.value
                                )
                              }
                              min="1"
                            />
                          </td>
                          <td>
                            <button
                              type="button"
                              className="btn btn-danger"
                              onClick={() => handleRemoveProduct(index)}
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              )}
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={onClose}
                >
                  Close
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={
                    isUpdating ||
                    isCustomersLoading ||
                    isProductsLoading ||
                    customers.length === 0 ||
                    products.length === 0 ||
                    products.every(
                      (p) => !p.productId || p.productId.trim() === ""
                    )
                  }
                >
                  {isUpdating ? "Updating..." : "Update Invoice"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditInvoice;
