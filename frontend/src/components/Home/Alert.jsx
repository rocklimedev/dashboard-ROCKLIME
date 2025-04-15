import React, { useState } from "react";
// Adjust path accordingly
import { useGetLowStockProductsQuery } from "../../api/productApi";
const Alert = () => {
  const { data: lowStockProducts = [], isLoading } =
    useGetLowStockProductsQuery();
  const [showModal, setShowModal] = useState(false);

  if (isLoading || !lowStockProducts.length) return null;

  return (
    <>
      <div className="alert bg-orange-transparent alert-dismissible fade show mb-4">
        <div>
          <span>
            <i className="ti ti-info-circle fs-14 text-orange me-2"></i>
            You have{" "}
          </span>
          <span className="text-orange fw-semibold">
            {lowStockProducts.length} product(s)
          </span>{" "}
          running low on stock.{" "}
          <button
            onClick={() => setShowModal(true)}
            className="link-orange text-decoration-underline fw-semibold btn btn-link p-0 m-0 align-baseline"
            style={{ textDecoration: "underline" }}
          >
            View Products
          </button>
        </div>
        <button
          type="button"
          className="btn-close text-gray-9 fs-14"
          data-bs-dismiss="alert"
          aria-label="Close"
        >
          <i className="ti ti-x"></i>
        </button>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal fade show d-block" tabIndex="-1">
          <div className="modal-dialog modal-dialog-scrollable">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Low Stock Products</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <ul className="list-group">
                  {lowStockProducts.map((product) => (
                    <li key={product.id} className="list-group-item">
                      {product.name} —{" "}
                      <span className="text-danger fw-bold">
                        Only {product.stock} left
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="modal-footer">
                <button
                  className="btn btn-secondary"
                  onClick={() => setShowModal(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal backdrop */}
      {showModal && <div className="modal-backdrop fade show"></div>}
    </>
  );
};

export default Alert;
