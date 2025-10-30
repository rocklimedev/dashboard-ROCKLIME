import React, { useState } from "react";
import { Modal, Table, Image, Spinner, Alert } from "react-bootstrap";
import useProductsData from "../../data/useProductdata";

const QuotationProductModal = ({
  show,
  onHide,
  products = [],
  selectedQuotation,
}) => {
  const [expandedProductId, setExpandedProductId] = useState(null);

  // ---------- Normalise products ----------
  const normalizedProducts = Array.isArray(products)
    ? products
    : typeof products === "string"
    ? JSON.parse(products || "[]")
    : [];

  // ---------- Fetch full product details ----------
  const { productsData, errors, loading } = useProductsData(normalizedProducts);

  // ---------- Helper: get first image URL ----------
  const getFirstImage = (imagesString) => {
    if (!imagesString) return null;
    try {
      const parsed = JSON.parse(imagesString);
      return Array.isArray(parsed) && parsed.length > 0 ? parsed[0] : null;
    } catch {
      return null;
    }
  };

  // ---------- Build product map (price + image) ----------
  const productMap = productsData.reduce((map, product) => {
    const sellingPrice =
      product.metaDetails?.find((m) => m.slug === "sellingPrice")?.value || 0;
    const imageUrl = getFirstImage(product.images);

    map[product.productId] = {
      ...product,
      sellingPrice,
      imageUrl,
    };
    return map;
  }, {});

  // ---------- Totals ----------
  const { total, amountWithoutTax } = normalizedProducts.reduce(
    (acc, product) => {
      const details = productMap[product.productId] || {};
      const price = details.sellingPrice || product.price || 0;
      const qty = product.quantity || product.qty || 0;
      const discount = product.discount || 0;
      const tax = product.tax || 0;

      const amount = price * qty * (1 - discount / 100);
      const productTotal = product.total || amount * (1 + tax / 100);

      return {
        total: acc.total + productTotal,
        amountWithoutTax: acc.amountWithoutTax + amount,
      };
    },
    { total: 0, amountWithoutTax: 0 }
  );

  const handleRowClick = (productId) => {
    setExpandedProductId((prev) => (prev === productId ? null : productId));
  };

  return (
    <Modal show={show} onHide={onHide} size="xl" centered>
      <Modal.Header>
        <Modal.Title>
          {selectedQuotation?.document_title
            ? `Products for ${selectedQuotation.document_title}`
            : "Products"}
        </Modal.Title>
      </Modal.Header>

      <Modal.Body style={{ overflowX: "auto" }}>
        {loading ? (
          <div className="text-center py-4">
            <Spinner animation="border" role="status" />
            <p className="mt-2">Loading product details...</p>
          </div>
        ) : errors.length > 0 ? (
          <Alert variant="danger">
            Failed to load some product details:{" "}
            {errors.map((e) => e.error).join(", ")}
          </Alert>
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
                <th style={{ minWidth: "80px" }}>Image</th> {/* NEW */}
                <th style={{ minWidth: "200px" }}>Product Name</th>
                <th style={{ minWidth: "100px" }}>Qty</th>
                <th style={{ minWidth: "100px" }}>Price</th>
                <th style={{ minWidth: "120px" }}>Discount (%)</th>
                <th style={{ minWidth: "100px" }}>Tax (%)</th>
                <th style={{ minWidth: "120px" }}>Total</th>
              </tr>
            </thead>

            <tbody>
              {normalizedProducts.length > 0 ? (
                normalizedProducts.map((product, idx) => {
                  const details = productMap[product.productId] || {};
                  const isExpanded = expandedProductId === product.productId;

                  return (
                    <React.Fragment key={idx}>
                      {/* ---------- Compact Row ---------- */}
                      <tr
                        onClick={() => handleRowClick(product.productId)}
                        style={{ cursor: "pointer" }}
                      >
                        <td>{idx + 1}</td>

                        {/* IMAGE CELL */}
                        <td>
                          {details.imageUrl ? (
                            <Image
                              src={details.imageUrl}
                              alt={details.name || "Product"}
                              rounded
                              style={{
                                width: 60,
                                height: 60,
                                objectFit: "contain",
                              }}
                            />
                          ) : (
                            <div
                              style={{
                                width: 60,
                                height: 60,
                                background: "#eee",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: "0.8rem",
                                color: "#999",
                              }}
                            >
                              No image
                            </div>
                          )}
                        </td>

                        <td>{details.name || "N/A"}</td>
                        <td>{product.quantity || product.qty || 0}</td>
                        <td>{details.sellingPrice || product.price || 0}</td>
                        <td>{product.discount || 0}</td>
                        <td>{product.tax || 0}</td>
                        <td>{product.total || 0}</td>
                      </tr>

                      {/* ---------- Expanded Details Row ---------- */}
                      {isExpanded && (
                        <tr>
                          <td colSpan="8" className="bg-light">
                            <div className="p-3 d-flex gap-4">
                              {/* Larger image */}
                              {details.imageUrl && (
                                <Image
                                  src={details.imageUrl}
                                  alt={details.name}
                                  rounded
                                  style={{
                                    width: 120,
                                    height: 120,
                                    objectFit: "contain",
                                  }}
                                />
                              )}

                              <div className="flex-grow-1">
                                <h6>Product Details</h6>
                                <p>
                                  <strong>Name:</strong>{" "}
                                  {details.name || product.name || "N/A"}
                                </p>
                                <p>
                                  <strong>Quantity:</strong>{" "}
                                  {product.quantity || product.qty || 0}
                                </p>
                                <p>
                                  <strong>Price:</strong>{" "}
                                  {details.sellingPrice || product.price || 0}
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
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="8" className="text-center">
                    No products available
                  </td>
                </tr>
              )}
            </tbody>

            {/* ---------- Footer with totals ---------- */}
            {normalizedProducts.length > 0 && (
              <tfoot>
                <tr className="table-info">
                  <td colSpan="5"></td>
                  <td>
                    <strong>Amount (without tax):</strong>
                  </td>
                  <td colSpan="2">
                    <strong>{amountWithoutTax.toFixed(2)}</strong>
                  </td>
                </tr>
                <tr className="table-success">
                  <td colSpan="5"></td>
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
