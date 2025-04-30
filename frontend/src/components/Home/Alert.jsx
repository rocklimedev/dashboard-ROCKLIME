import React, { useState } from "react";
import { useGetAllProductsQuery } from "../../api/productApi";

const Alert = ({
  alertStyle = {},
  buttonStyle = {},
  icon = "ℹ️",
  modalStyle = {},
  title = "Low Stock Products",
}) => {
  const { data: allProducts = [], isLoading } = useGetAllProductsQuery();
  const [showModal, setShowModal] = useState(false);

  const lowStockProducts = allProducts.filter(
    (product) => product.stock < product.alertQuantity
  );

  if (isLoading || !lowStockProducts.length) return null;

  return (
    <>
      <div
        className="custom-alert-container"
        style={{
          backgroundColor: "rgba(255, 165, 0, 0.1)",
          padding: "12px 16px",
          borderRadius: "6px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "16px",
          ...alertStyle,
        }}
      >
        <div>
          <span style={{ marginRight: 6 }}>{icon}</span>
          <span>
            You have{" "}
            <strong style={{ color: "orange" }}>
              {lowStockProducts.length} product(s)
            </strong>{" "}
            running low on stock.
          </span>{" "}
          <button
            onClick={() => setShowModal(true)}
            style={{
              background: "none",
              border: "none",
              color: "orange",
              textDecoration: "underline",
              fontWeight: "600",
              cursor: "pointer",
              ...buttonStyle,
            }}
          >
            View Products
          </button>
        </div>
        <button
          onClick={() => setShowModal(false)}
          style={{
            background: "none",
            border: "none",
            fontSize: "18px",
            color: "#666",
            cursor: "pointer",
          }}
        >
          ×
        </button>
      </div>

      {/* Modal */}
      {showModal && (
        <>
          <div
            className="custom-modal"
            style={{
              position: "fixed",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              zIndex: 1000,
              backgroundColor: "white",
              borderRadius: "8px",
              width: "90%",
              maxWidth: "500px",
              maxHeight: "80vh",
              overflowY: "auto",
              boxShadow: "0 2px 10px rgba(0,0,0,0.2)",
              ...modalStyle,
            }}
          >
            <div
              style={{
                padding: "16px",
                borderBottom: "1px solid #ddd",
                fontWeight: "bold",
              }}
            >
              {title}
            </div>
            <div style={{ padding: "16px" }}>
              <ul style={{ paddingLeft: "20px" }}>
                {lowStockProducts.map((product) => (
                  <li key={product.id} style={{ marginBottom: "10px" }}>
                    {product.name} —{" "}
                    <span style={{ color: "red", fontWeight: "bold" }}>
                      Only {product.stock} left (Alert at{" "}
                      {product.alertQuantity})
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <div
              style={{
                padding: "12px 16px",
                borderTop: "1px solid #ddd",
                textAlign: "right",
              }}
            >
              <button
                onClick={() => setShowModal(false)}
                style={{
                  backgroundColor: "#eee",
                  border: "none",
                  padding: "6px 12px",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                Close
              </button>
            </div>
          </div>

          {/* Backdrop */}
          <div
            className="custom-modal-backdrop"
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0, 0, 0, 0.4)",
              zIndex: 999,
            }}
            onClick={() => setShowModal(false)}
          />
        </>
      )}
    </>
  );
};

export default Alert;
