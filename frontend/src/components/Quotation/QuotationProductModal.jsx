import React, { useState } from "react";
import { Modal, Button, Table } from "react-bootstrap";
import useProductsData from "../../data/useProductdata";

const QuotationProductModal = ({ show, onHide, products = [] }) => {
  const [expandedProductId, setExpandedProductId] = useState(null);

  // Normalize products to ensure it's an array
  const normalizedProducts = Array.isArray(products)
    ? products
    : typeof products === "string"
    ? JSON.parse(products || "[]")
    : [];

  // Use the custom hook to fetch product details
  const { productsData, errors, loading } = useProductsData(normalizedProducts);

  // Create a map of productId to product details for quick lookup
  const productMap = productsData.reduce((map, product) => {
    // Extract sellingPrice from metaDetails
    const sellingPrice =
      product.metaDetails?.find((meta) => meta.slug === "sellingPrice")
        ?.value || 0;
    map[product.productId] = {
      ...product,
      sellingPrice, // Add sellingPrice to the product object
    };
    return map;
  }, {});

  // Calculate totals
  const { total, amountWithoutTax } = normalizedProducts.reduce(
    (acc, product) => {
      const productDetails = productMap[product.productId] || {};
      const price = productDetails.sellingPrice || product.price || 0;
      const quantity = product.quantity || product.qty || 0;
      const discount = product.discount || 0;
      const tax = product.tax || 0;

      // Calculate amount without tax for this product: price * quantity * (1 - discount/100)
      const amount = price * quantity * (1 - discount / 100);
      // Total includes tax: amount * (1 + tax/100)
      const productTotal = product.total || amount * (1 + tax / 100);

      return {
        total: acc.total + productTotal,
        amountWithoutTax: acc.amountWithoutTax + amount,
      };
    },
    { total: 0, amountWithoutTax: 0 }
  );

  const handleRowClick = (productId) => {
    // Toggle expanded row: if the same row is clicked, collapse it; otherwise, expand the new row
    setExpandedProductId(expandedProductId === productId ? null : productId);
  };

  return (
    <Modal show={show} onHide={onHide} size="xl" centered>
      <Modal.Header closeButton>
        <Modal.Title>Quotation Products</Modal.Title>
      </Modal.Header>
      <Modal.Body style={{ overflowX: "auto" }}>
        {loading ? (
          <div className="text-center">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p>Loading product details...</p>
          </div>
        ) : errors.length > 0 ? (
          <div className="alert alert-danger" role="alert">
            Failed to load some product details:{" "}
            {errors.map((e) => e.error).join(", ")}
          </div>
        ) : (
          <Table
            striped
            bordered
            hover
            responsive
            className="align-middle text-center"
          >
            <thead className="table-dark">
              <tr>
                <th style={{ minWidth: "50px" }}>#</th>
                <th style={{ minWidth: "200px" }}>Product Name</th>
                <th style={{ minWidth: "100px" }}>Quantity</th>
                <th style={{ minWidth: "100px" }}>Price</th>
                <th style={{ minWidth: "120px" }}>Discount (%)</th>
                <th style={{ minWidth: "100px" }}>Tax (%)</th>
                <th style={{ minWidth: "120px" }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {normalizedProducts.length > 0 ? (
                normalizedProducts.map((product, index) => {
                  const productDetails = productMap[product.productId] || {};
                  const isExpanded = expandedProductId === product.productId;

                  return (
                    <React.Fragment key={index}>
                      <tr
                        onClick={() => handleRowClick(product.productId)}
                        style={{ cursor: "pointer" }}
                      >
                        <td>{index + 1}</td>
                        <td>{productDetails.name || "N/A"}</td>
                        <td>{product.quantity || product.qty || 0}</td>
                        <td>
                          {productDetails.sellingPrice || product.price || 0}
                        </td>
                        <td>{product.discount || 0}</td>
                        <td>{product.tax || 0}</td>
                        <td>{product.total || 0}</td>
                      </tr>
                      {isExpanded && (
                        <tr>
                          <td colSpan="7" className="bg-light">
                            <div className="p-3">
                              <h6>Product Details</h6>
                              <p>
                                <strong>Product Name:</strong>{" "}
                                {productDetails.name || product.name || "N/A"}
                              </p>
                              <p>
                                <strong>Quantity:</strong>{" "}
                                {product.quantity || product.qty || 0}
                              </p>
                              <p>
                                <strong>Price:</strong>{" "}
                                {productDetails.sellingPrice ||
                                  product.price ||
                                  0}
                              </p>
                              <p>
                                <strong>Discount:</strong>{" "}
                                {product.discount || 0}%
                              </p>
                              <p>
                                <strong>Tax:</strong> {product.tax || 0}%
                              </p>
                              <p>
                                <strong>Total:</strong> {product.total || 0}
                              </p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="7" className="text-center">
                    No products available
                  </td>
                </tr>
              )}
            </tbody>
            {normalizedProducts.length > 0 && (
              <tfoot>
                <tr className="table-info">
                  <td colSpan="4"></td>
                  <td>
                    <strong>Amount (without tax):</strong>
                  </td>
                  <td colSpan="2">
                    <strong>{amountWithoutTax.toFixed(2)}</strong>
                  </td>
                </tr>
                <tr className="table-success">
                  <td colSpan="4"></td>
                  <td>
                    <strong>Total:</strong>
                  </td>
                  <td colSpan="2">
                    <strong>{total.toFixed(2)}</strong>
                  </td>
                </tr>
              </tfoot>
            )}
          </Table>
        )}
      </Modal.Body>
    </Modal>
  );
};

export default QuotationProductModal;
