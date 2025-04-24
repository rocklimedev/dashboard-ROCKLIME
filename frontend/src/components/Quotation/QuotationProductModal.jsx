import React, { useState } from "react";
import { Modal, Button, Table } from "react-bootstrap";

const QuotationProductModal = ({ show, onHide, products = [] }) => {
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Normalize products to ensure it's an array
  const normalizedProducts = Array.isArray(products)
    ? products
    : typeof products === "string"
    ? JSON.parse(products || "[]")
    : [];

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
                normalizedProducts.map((product, index) => (
                  <tr
                    key={index}
                    onClick={() => handleRowClick(product)}
                    style={{ cursor: "pointer" }}
                  >
                    <td>{index + 1}</td>
                    <td>{product.name || "N/A"}</td>
                    <td>{product.quantity || product.qty || 0}</td>
                    <td>{product.price || product.sellingPrice || 0}</td>
                    <td>{product.discount || 0}</td>
                    <td>{product.tax || 0}</td>
                    <td>{product.total || 0}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="text-center">
                    No products available
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
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
              <strong>Product Name:</strong> {selectedProduct.name || "N/A"}
            </p>
            <p>
              <strong>Quantity:</strong>{" "}
              {selectedProduct.quantity || selectedProduct.qty || 0}
            </p>
            <p>
              <strong>Price:</strong>{" "}
              {selectedProduct.price || selectedProduct.sellingPrice || 0}
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
