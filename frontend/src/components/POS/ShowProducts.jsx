import React, { useEffect } from "react";
import { Modal, Button } from "react-bootstrap"; // Import React-Bootstrap components
import { useGetQuotationByIdQuery } from "../../api/quotationApi";

const ShowProducts = ({ quotation, onClose }) => {
  const {
    data: quotationData,
    isLoading,
    error,
  } = useGetQuotationByIdQuery(quotation?.quotationId, {
    skip: !quotation?.quotationId,
  });

  useEffect(() => {
    if (quotation) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [quotation]);

  if (!quotation) return null;

  return (
    <Modal
      show={!!quotation} // Show modal when quotation is truthy
      onHide={onClose} // Close modal when backdrop or close button is clicked
      centered // Center the modal vertically
      size="lg" // Optional: Use large modal size for better content display
      backdrop="static" // Optional: Prevent closing on backdrop click (remove if you want to allow it)
    >
      <Modal.Header closeButton>
        <Modal.Title>Products</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {isLoading ? (
          <p>Loading...</p>
        ) : error ? (
          <p>Error loading quotation</p>
        ) : (
          <div className="card">
            <div className="card-body">
              <span className="badge bg-dark">
                Quotation Title: {quotationData?.document_title || "N/A"}
              </span>
              <p>Number of Products: {quotationData?.products?.length || 0}</p>
              <div className="product-wrap">
                {quotationData?.products?.map((product) => (
                  <div key={product.productId} className="product-list">
                    <div className="d-flex align-items-center">
                      <img
                        src={
                          product.images?.[0] ||
                          "/assets/img/default-product.png"
                        }
                        alt={product.name || "Product Image"}
                        className="pro-img"
                      />
                      <div className="info">
                        <h6>{product.name}</h6>
                        <p>Quantity: {product.qty}</p>
                      </div>
                    </div>
                    <p className="price">₹{product.total}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onClose}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ShowProducts;
