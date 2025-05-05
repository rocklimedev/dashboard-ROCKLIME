import React, { useState } from "react";
import { useGetAllOrdersQuery } from "../../api/orderApi";
import { useGetAllQuotationsQuery } from "../../api/quotationApi";
import { useGetAllProductsQuery } from "../../api/productApi";
import { Link } from "react-router-dom";
import { FaTriangleExclamation, FaFileInvoice, FaBox } from "react-icons/fa6";

const Stats = () => {
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState(null);

  // API Queries
  const {
    data: productData,
    isLoading: productsLoading,
    isError: productsError,
  } = useGetAllProductsQuery();
  const {
    data: quotationData,
    isLoading: quotationsLoading,
    isError: quotationsError,
  } = useGetAllQuotationsQuery();
  const {
    data: ordersData,
    isLoading: ordersLoading,
    isError: ordersError,
  } = useGetAllOrdersQuery();

  // Date filters (last 7 days, fallback to 30 days)
  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Data Assignments with Time Filters
  const products = Array.isArray(productData) ? productData : [];
  const recentQuotations = Array.isArray(quotationData) ? quotationData : [];
  const recentOrders = Array.isArray(ordersData?.orders)
    ? ordersData.orders
    : [];

  // Filter by time (7 days, fallback to 30 days)
  const filterByTime = (items, dateField) => {
    const weekItems = items.filter(
      (item) => new Date(item[dateField]) >= oneWeekAgo
    );
    return weekItems.length > 0
      ? weekItems
      : items.filter((item) => new Date(item[dateField]) >= oneMonthAgo);
  };

  const filteredProducts = filterByTime(products, "updatedAt"); // Assuming updatedAt field
  const filteredQuotations = filterByTime(recentQuotations, "quotation_date");
  const filteredOrders = filterByTime(recentOrders, "date");

  // Low Stock Products
  const lowStockProducts = filteredProducts.filter(
    (p) => p.quantity < p.alertQuantity
  );

  const handleOpenModal = (type) => {
    setModalType(type);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setModalType(null);
  };

  const renderModalContent = () => {
    switch (modalType) {
      case "lowStock":
        return (
          <div>
            <h5>All Low Stock Products</h5>
            {lowStockProducts.length === 0 ? (
              <p>No low stock products available.</p>
            ) : (
              lowStockProducts.map((product) => (
                <div
                  key={product.productId}
                  className="d-flex align-items-center justify-content-between my-3"
                >
                  <div className="d-flex align-items-center">
                    <img
                      src={product?.images || "/assets/img/default.jpg"}
                      alt={product.name}
                      className="avatar avatar-md rounded"
                      style={{ width: "40px", height: "40px" }}
                    />
                    <div className="ms-2">
                      <Link
                        to={`/product/${product.productId}`}
                        className="fw-bold text-dark"
                      >
                        {product.name}
                      </Link>
                      <p className="fs-13 mb-0">
                        Product Code: {product.product_code}
                      </p>
                    </div>
                  </div>
                  <h6 className="text-orange fw-medium">{product.quantity}</h6>
                </div>
              ))
            )}
          </div>
        );
      case "quotations":
        return (
          <div>
            <h5>All Quotations</h5>
            {filteredQuotations.length === 0 ? (
              <p>No quotations available.</p>
            ) : (
              filteredQuotations.map((q) => (
                <div
                  key={q.quotationId}
                  className="d-flex justify-content-between my-3"
                >
                  <div>
                    <h6 className="fw-bold mb-1">#{q.document_title}</h6>
                    <p className="fs-13 mb-0">{q.customerName}</p>
                  </div>
                  <div className="text-end">
                    <p className="fs-13 mb-1">
                      {new Date(q.quotation_date).toLocaleDateString()} -{" "}
                      {new Date(q.due_date).toLocaleDateString()}
                    </p>
                    <h6 className="text-primary fw-medium">
                      Rs {q.finalAmount}
                    </h6>
                  </div>
                </div>
              ))
            )}
          </div>
        );
      case "orders":
        return (
          <div>
            <h5>All Orders</h5>
            {filteredOrders.length === 0 ? (
              <p>No orders available.</p>
            ) : (
              filteredOrders.map((order) => (
                <div
                  key={order.id}
                  className="d-flex justify-content-between my-3"
                >
                  <div>
                    <h6 className="fw-bold mb-1">Order #{order.orderNumber}</h6>
                    <p className="fs-13 mb-0">{order.customerName}</p>
                  </div>
                  <div className="text-end">
                    <p className="fs-13 mb-1">
                      {new Date(order.date).toLocaleDateString()}
                    </p>
                    <span
                      className={`badge badge-xs ${
                        order.status === "Completed"
                          ? "bg-success"
                          : order.status === "Pending"
                          ? "bg-warning"
                          : "bg-purple"
                      }`}
                    >
                      {order.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        );
      default:
        return <p>No content available.</p>;
    }
  };

  return (
    <div className="row">
      {/* Low Stock Products */}
      <div className="col-xxl-4 col-md-6 d-flex">
        <div className="card flex-fill shadow-sm">
          <div className="card-header d-flex justify-content-between align-items-center">
            <h5 className="card-title mb-0">
              <FaTriangleExclamation className="me-2 text-danger" /> Low Stock
              Products
            </h5>
            <a
              href="#!"
              className="fs-13 text-decoration-underline text-primary"
              onClick={() => handleOpenModal("lowStock")}
            >
              View All
            </a>
          </div>
          <div className="card-body">
            {productsLoading ? (
              <div
                className="spinner-border spinner-border-sm text-primary"
                role="status"
              >
                <span className="visually-hidden">Loading...</span>
              </div>
            ) : productsError ? (
              <div className="alert alert-danger" role="alert">
                Failed to load products.
              </div>
            ) : lowStockProducts.length === 0 ? (
              <p>No low stock products.</p>
            ) : (
              lowStockProducts.slice(0, 10).map((product) => (
                <div
                  className="d-flex justify-content-between mb-4"
                  key={product.productId}
                >
                  <div className="d-flex align-items-center">
                    <img
                      src={product.images || "/assets/img/default.jpg"}
                      alt={product.name}
                      className="avatar avatar-md rounded"
                      style={{ width: "40px", height: "40px" }}
                    />
                    <div className="ms-2">
                      <h6 className="mb-0 fw-bold">{product.name}</h6>
                      <p className="fs-13 mb-0">SKU: {product.product_code}</p>
                    </div>
                  </div>
                  <h6 className="text-orange fw-medium">{product.quantity}</h6>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Recent Quotations */}
      <div className="col-xxl-4 col-md-6 d-flex">
        <div className="card flex-fill shadow-sm">
          <div className="card-header d-flex justify-content-between align-items-center">
            <h5 className="card-title mb-0">
              <FaFileInvoice className="me-2 text-info" /> Recent Quotations
            </h5>
            <a
              href="#!"
              className="fs-13 text-decoration-underline text-primary"
              onClick={() => handleOpenModal("quotations")}
            >
              View All
            </a>
          </div>
          <div className="card-body">
            {quotationsLoading ? (
              <div
                className="spinner-border spinner-border-sm text-primary"
                role="status"
              >
                <span className="visually-hidden">Loading...</span>
              </div>
            ) : quotationsError ? (
              <div className="alert alert-danger" role="alert">
                Failed to load quotations.
              </div>
            ) : filteredQuotations.length === 0 ? (
              <p>No quotations available.</p>
            ) : (
              filteredQuotations.slice(0, 10).map((q) => (
                <div
                  key={q.quotationId}
                  className="d-flex justify-content-between mb-4"
                >
                  <div>
                    <h6 className="fw-bold mb-1">#{q.document_title}</h6>
                    <p className="fs-13 mb-0">for: {q.customerName}</p>
                  </div>
                  <div className="text-end">
                    <p className="fs-13 mb-1">
                      {new Date(q.quotation_date).toLocaleDateString()} -{" "}
                      {new Date(q.due_date).toLocaleDateString()}
                    </p>
                    <h6 className="text-primary fw-medium">
                      Rs {q.finalAmount}
                    </h6>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="col-xxl-4 col-md-6 d-flex">
        <div className="card flex-fill shadow-sm">
          <div className="card-header d-flex justify-content-between align-items-center">
            <h5 className="card-title mb-0">
              <FaBox className="me-2 text-pink" /> Recent Orders
            </h5>
            <a
              href="#!"
              className="fs-13 text-decoration-underline text-primary"
              onClick={() => handleOpenModal("orders")}
            >
              View All
            </a>
          </div>
          <div className="card-body">
            {ordersLoading ? (
              <div
                className="spinner-border spinner-border-sm text-primary"
                role="status"
              >
                <span className="visually-hidden">Loading...</span>
              </div>
            ) : ordersError ? (
              <div className="alert alert-danger" role="alert">
                Failed to load orders.
              </div>
            ) : filteredOrders.length === 0 ? (
              <p>No orders available.</p>
            ) : (
              filteredOrders.slice(0, 10).map((order) => (
                <div
                  key={order.id}
                  className="d-flex justify-content-between mb-4"
                >
                  <div>
                    <h6 className="fw-bold mb-1">Order #{order.orderNumber}</h6>
                    <p className="fs-13 mb-0">for: {order.customerName}</p>
                  </div>
                  <div className="text-end">
                    <p className="fs-13 mb-1">
                      {new Date(order.date).toLocaleDateString()}
                    </p>
                    <span
                      className={`badge ${
                        order.status === "Completed"
                          ? "bg-success"
                          : order.status === "Pending"
                          ? "bg-warning"
                          : "bg-purple"
                      }`}
                    >
                      {order.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Modal */}
      <div
        className={`modal fade ${showModal ? "show d-block" : ""}`}
        tabIndex="-1"
        role="dialog"
      >
        <div className="modal-dialog modal-lg" role="document">
          <div className="modal-content">
            <div className="modal-header d-flex justify-content-between align-items-center">
              <h5 className="modal-title">View All {modalType}</h5>
              <button
                type="button"
                className="btn-close"
                onClick={handleCloseModal}
                aria-label="Close"
              ></button>
            </div>
            <div className="modal-body">{renderModalContent()}</div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleCloseModal}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
      {showModal && <div className="modal-backdrop fade show"></div>}
    </div>
  );
};

export default Stats;
