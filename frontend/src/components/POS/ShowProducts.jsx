import React, { useEffect } from "react";
import { useGetQuotationByIdQuery } from "../../api/quotationApi";

const ShowProducts = ({ quotation, onClose }) => {
  const {
    data: quotationData,
    isLoading,
    error,
  } = useGetQuotationByIdQuery(quotation?.quotationId, {
    skip: !quotation?.quotationId, // Prevents the API call if no ID is present
  });

  useEffect(() => {
    if (quotation) {
      document.body.style.overflow = "hidden"; // Prevent scrolling when modal is open
    } else {
      document.body.style.overflow = "auto"; // Restore scrolling when modal closes
    }
    return () => {
      document.body.style.overflow = "auto"; // Cleanup
    };
  }, [quotation]);

  if (!quotation) return null; // Ensure modal is rendered only when needed

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h5 className="modal-title">Products</h5>
          <button className="close-btn" onClick={onClose}>
            &times;
          </button>
        </div>
        <div className="modal-body">
          {isLoading ? (
            <p>Loading...</p>
          ) : error ? (
            <p>Error loading quotation</p>
          ) : (
            <div className="card">
              <div className="card-body">
                <span className="badge">
                  Quotation Title: {quotationData?.document_title || "N/A"}
                </span>
                <p>
                  Number of Products: {quotationData?.products?.length || 0}
                </p>
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
        </div>
      </div>
    </div>
  );
};

export default ShowProducts;
