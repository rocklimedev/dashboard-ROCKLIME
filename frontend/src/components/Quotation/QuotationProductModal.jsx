import React, { useState } from "react";
import { Modal, Button, Table } from "react-bootstrap";

const QuotationProductModal = ({ show, onHide, products = [] }) => {
  const [selectedProduct, setSelectedProduct] = useState(null);

  const handleRowClick = (product) => {
    setSelectedProduct(product);
  };

  return (
    <>
      <Modal show={show} onHide={onHide} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>Quotation Products</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Table striped bordered hover>
            <thead>
              <tr>
                <th>#</th>
                <th>Product Name</th>
                <th>Quantity</th>
                <th>Price</th>
                <th>Discount (%)</th>
                <th>Tax (%)</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {products.length > 0 ? (
                products.map((product, index) => (
                  <tr key={index} onClick={() => handleRowClick(product)}>
                    <td>{index + 1}</td>
                    <td>{product.name}</td>
                    <td>{product.quantity}</td>
                    <td>{product.price}</td>
                    <td>{product.discount}</td>
                    <td>{product.tax}</td>
                    <td>{product.total}</td>
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

      {/* Product Details Modal */}
      {selectedProduct && (
        <Modal show={true} onHide={() => setSelectedProduct(null)} centered>
          <Modal.Header closeButton>
            <Modal.Title>Product Details</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <p>
              <strong>Product Name:</strong> {selectedProduct.name}
            </p>
            <p>
              <strong>Quantity:</strong> {selectedProduct.quantity}
            </p>
            <p>
              <strong>Price:</strong> {selectedProduct.price}
            </p>
            <p>
              <strong>Discount:</strong> {selectedProduct.discount}%
            </p>
            <p>
              <strong>Tax:</strong> {selectedProduct.tax}%
            </p>
            <p>
              <strong>Total:</strong> {selectedProduct.total}
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
