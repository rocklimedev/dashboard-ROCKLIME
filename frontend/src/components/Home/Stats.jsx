import React, { useState } from "react";
import { useGetAllOrdersQuery } from "../../api/orderApi";
import { useGetAllQuotationsQuery } from "../../api/quotationApi";
import { useGetAllProductsQuery } from "../../api/productApi";
import { Link } from "react-router-dom";
import { Modal, Button, Card, Spinner, Alert } from "react-bootstrap";

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

  // Data Assignments with Fallbacks
  const products = Array.isArray(productData) ? productData : [];
  const recentQuotations = Array.isArray(quotationData) ? quotationData : [];
  const recentOrders = Array.isArray(ordersData?.orders)
    ? ordersData.orders
    : [];
  const lowStockProducts =
    products.filter((p) => p.quantity < p.alertQuantity) || [];

  const handleOpenModal = (type) => {
    setModalType(type);
    setShowModal(true);
  };

  const renderModalContent = () => {
    switch (modalType) {
      case "lowStock":
        return (
          <>
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
                      src={product.images || "/assets/img/default.jpg"}
                      alt={product.name}
                      className="avatar avatar-md"
                    />
                    <div className="ms-2">
                      <Link
                        to={`/product/${product.productId}`}
                        className="fw-bold"
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
          </>
        );
      case "quotations":
        return (
          <>
            <h5>All Quotations</h5>
            {recentQuotations.length === 0 ? (
              <p>No quotations available.</p>
            ) : (
              recentQuotations.map((q) => (
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
          </>
        );
      case "orders":
        return (
          <>
            <h5>All Orders</h5>
            {recentOrders.length === 0 ? (
              <p>No orders available.</p>
            ) : (
              recentOrders.map((order) => (
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
          </>
        );
      default:
        return <p>No content available.</p>;
    }
  };

  return (
    <div className="row">
      {/* Low Stock Products */}
      <div className="col-xxl-4 col-md-6 d-flex">
        <Card className="flex-fill">
          <Card.Header className="d-flex justify-content-between align-items-center">
            <Card.Title className="mb-0">
              <i className="ti ti-alert-triangle me-2 text-danger"></i> Low
              Stock Products
            </Card.Title>
            <Button
              variant="link"
              className="fs-13 text-decoration-underline p-0"
              onClick={() => handleOpenModal("lowStock")}
            >
              View All
            </Button>
          </Card.Header>
          <Card.Body>
            {productsLoading ? (
              <Spinner animation="border" size="sm" />
            ) : productsError ? (
              <Alert variant="danger">Failed to load products.</Alert>
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
                      className="avatar avatar-md"
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
          </Card.Body>
        </Card>
      </div>

      {/* Recent Quotations */}
      <div className="col-xxl-4 col-md-6 d-flex">
        <Card className="flex-fill">
          <Card.Header className="d-flex justify-content-between align-items-center">
            <Card.Title className="mb-0">
              <i className="ti ti-file-invoice me-2 text-info"></i> Recent
              Quotations
            </Card.Title>
            <Button
              variant="link"
              className="fs-13 text-decoration-underline p-0"
              onClick={() => handleOpenModal("quotations")}
            >
              View All
            </Button>
          </Card.Header>
          <Card.Body>
            {quotationsLoading ? (
              <Spinner animation="border" size="sm" />
            ) : quotationsError ? (
              <Alert variant="danger">Failed to load quotations.</Alert>
            ) : recentQuotations.length === 0 ? (
              <p>No quotations available.</p>
            ) : (
              recentQuotations.slice(0, 10).map((q) => (
                <div
                  key={q.quotationId}
                  className="d-flex justify-content-between mb-4"
                >
                  <div>
                    <h6 className="fw-bold mb-1">#{q.document_title}</h6>
                    <p className="fs-13 mb-0">for : {q.customerId}</p>
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
          </Card.Body>
        </Card>
      </div>

      {/* Recent Orders */}
      <div className="col-xxl-4 col-md-6 d-flex">
        <Card className="flex-fill">
          <Card.Header className="d-flex justify-content-between align-items-center">
            <Card.Title className="mb-0">
              <i className="ti ti-box me-2 text-pink"></i> Recent Orders
            </Card.Title>
            <Button
              variant="link"
              className="fs-13 text-decoration-underline p-0"
              onClick={() => handleOpenModal("orders")}
            >
              View All
            </Button>
          </Card.Header>
          <Card.Body>
            {ordersLoading ? (
              <Spinner animation="border" size="sm" />
            ) : ordersError ? (
              <Alert variant="danger">Failed to load orders.</Alert>
            ) : recentOrders.length === 0 ? (
              <p>No orders available.</p>
            ) : (
              recentOrders.slice(0, 10).map((order) => (
                <div
                  key={order.id}
                  className="d-flex justify-content-between mb-4"
                >
                  <div>
                    <h6 className="fw-bold mb-1">{order.title}</h6>
                    <p className="fs-13 mb-0">for: {order.createdFor}</p>
                  </div>
                  <div className="text-end">
                    <p className="fs-13 mb-1">
                      Due on: {new Date(order.dueDate).toLocaleDateString()}
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
                      {order.status} - {order.priority}
                    </span>
                  </div>
                </div>
              ))
            )}
          </Card.Body>
        </Card>
      </div>

      {/* Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>View All {modalType}</Modal.Title>
        </Modal.Header>
        <Modal.Body>{renderModalContent()}</Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default Stats;
