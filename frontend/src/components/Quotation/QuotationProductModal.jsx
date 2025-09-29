import React, { useState } from "react";
import { Modal, Button, Table } from "react-bootstrap";
import useProductsData from "../../data/useProductdata";
const QuotationProductModal = ({ show, onHide, products = [] }) => {
  const [selectedProduct, setSelectedProduct] = useState(null);

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

  const handleRowClick = (product) => {
    setSelectedProduct(product);
  };

  return (
    <>
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
                    return (
                      <tr
                        key={index}
                        onClick={() =>
                          handleRowClick({
                            ...product,
                            name: productDetails.name,
                          })
                        }
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
            </Table>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {selectedProduct && (
        <Modal show centered onHide={() => setSelectedProduct(null)}>
          <Modal.Header closeButton>
            <Modal.Title>Product Details</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <p>
              <strong>Product Name:</strong>{" "}
              {productMap[selectedProduct.productId]?.name ||
                selectedProduct.name ||
                "N/A"}
            </p>
            <p>
              <strong>Quantity:</strong>{" "}
              {selectedProduct.quantity || selectedProduct.qty || 0}
            </p>
            <p>
              <strong>Price:</strong>{" "}
              {productMap[selectedProduct.productId]?.sellingPrice ||
                selectedProduct.price ||
                selectedProduct.sellingPrice ||
                0}
            </p>
            <p>
              <strong>Discount:</strong> {selectedProduct.discount || 0}%
            </p>
            <p>
              <strong>Tax:</strong> {selectedProduct.tax || 0}%
            </p>
            <p>
              <strong>Total:</strong> {selectedProduct.total || 0}
            </p>
          </Modal.Body>
          <Modal.Footer>
            <Button
              variant="secondary"
              onClick={() => setSelectedProduct(null)}
            >
              Close
            </Button>
          </Modal.Footer>
        </Modal>
      )}
    </>
  );
};

export default QuotationProductModal;
