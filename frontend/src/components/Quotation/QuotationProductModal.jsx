import React, { useMemo } from "react";
import { Modal, Table, Image, Alert, Badge } from "react-bootstrap";
import { useGetQuotationByIdQuery } from "../../api/quotationApi";

const safeParse = (str, fallback = []) => {
  if (Array.isArray(str)) return str;
  if (!str) return fallback;
  try {
    return JSON.parse(str);
  } catch {
    return fallback;
  }
};

const QuotationProductModal = ({ show, onHide, quotationId }) => {
  const {
    data: q = {},
    isLoading,
    isError,
  } = useGetQuotationByIdQuery(quotationId, {
    skip: !quotationId,
  });

  const products = useMemo(() => safeParse(q.products, []), [q.products]);
  const items = useMemo(
    () => (Array.isArray(q.items) ? q.items : []),
    [q.items]
  );

  // Prefer `q.items` (new format), fallback to `q.products` (old format)
  const lineItems = items.length > 0 ? items : products;

  const hasValidItems = lineItems.length > 0;

  if (isLoading) {
    return (
      <Modal show={show} onHide={onHide} centered>
        <Modal.Body className="text-center py-5">
          <div className="spinner-border text-primary" />
          <p className="mt-2">Loading quotation…</p>
        </Modal.Body>
      </Modal>
    );
  }

  if (isError || !q.quotationId) {
    return (
      <Modal show={show} onHide={onHide} centered>
        <Modal.Body>
          <Alert variant="danger">Failed to load quotation details.</Alert>
        </Modal.Body>
      </Modal>
    );
  }

  return (
    <Modal show={show} onHide={onHide} size="xl" centered scrollable>
      <Modal.Header closeButton>
        <Modal.Title>
          Quotation #{q.reference_number || q.quotationId} – Products & Pricing
        </Modal.Title>
      </Modal.Header>

      <Modal.Body className="p-4">
        {!hasValidItems ? (
          <Alert variant="info">No products found in this quotation.</Alert>
        ) : (
          <>
            {/* ========== PRODUCT TABLE ========== */}
            <Table
              striped
              bordered
              hover
              responsive
              className="mb-4 text-center align-middle"
            >
              <thead className="table-dark">
                <tr>
                  <th>#</th>
                  <th>Image</th>
                  <th>Product</th>
                  <th>Qty</th>
                  <th>Price</th>
                  <th>Discount</th>
                  <th>Tax %</th>
                  <th>Line Total</th>
                </tr>
              </thead>
              <tbody>
                {lineItems.map((item, idx) => {
                  const qty = Number(item.quantity || item.qty || 1);
                  const price = Number(item.price || item.sellingPrice || 0);
                  const discount = Number(item.discount || 0);
                  const discountType = item.discountType || "fixed";
                  const tax = Number(item.tax || 0);
                  const total = Number(item.total || 0);

                  const discountDisplay =
                    discountType === "percent"
                      ? `${discount}%`
                      : `₹${discount.toFixed(2)}`;

                  const imageUrl = item.imageUrl || item.images?.[0];

                  return (
                    <tr key={item.productId || idx}>
                      <td>{idx + 1}</td>
                      <td>
                        {imageUrl ? (
                          <Image
                            src={imageUrl}
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
                              background: "#f5f5f5",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "0.8rem",
                              color: "#999",
                            }}
                          >
                            No Image
                          </div>
                        )}
                      </td>
                      <td className="text-start fw-medium">
                        {item.name || "Unknown Product"}
                      </td>
                      <td>{qty}</td>
                      <td>₹{price.toFixed(2)}</td>
                      <td>{discount > 0 ? discountDisplay : "—"}</td>
                      <td>{tax > 0 ? `${tax}%` : "—"}</td>
                      <td className="fw-bold">₹{total.toFixed(2)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>

            {/* ========== FINAL BREAKDOWN (FROM DB) ========== */}
            <div className="border rounded p-3 bg-light">
              <Table bordered size="sm">
                <tbody>
                  <tr>
                    <td className="text-end fw-bold">
                      Subtotal (after line items)
                    </td>
                    <td className="text-end">
                      ₹{Number(q.subtotal || 0).toFixed(2)}
                    </td>
                  </tr>

                  {q.extraDiscount > 0 && (
                    <tr>
                      <td className="text-end text-danger">
                        Extra Discount (
                        {q.extraDiscountType === "percent"
                          ? `${q.extraDiscount}%`
                          : `₹${q.extraDiscount}`}
                        )
                      </td>
                      <td className="text-end text-danger">
                        -₹{Number(q.discountAmount || 0).toFixed(2)}
                      </td>
                    </tr>
                  )}

                  {q.shippingAmount > 0 && (
                    <tr>
                      <td className="text-end text-success">Shipping</td>
                      <td className="text-end text-success">
                        +₹{Number(q.shippingAmount).toFixed(2)}
                      </td>
                    </tr>
                  )}

                  {q.gst > 0 && (
                    <tr>
                      <td className="text-end text-success">GST ({q.gst}%)</td>
                      <td className="text-end text-success">
                        +₹{Number(q.gstAmount || 0).toFixed(2)}
                      </td>
                    </tr>
                  )}

                  {q.roundOff != null && q.roundOff !== 0 && (
                    <tr>
                      <td className="text-end">Round-off</td>
                      <td
                        className={`text-end ${
                          q.roundOff >= 0 ? "text-success" : "text-danger"
                        }`}
                      >
                        {q.roundOff >= 0 ? "+" : "-"}₹
                        {Math.abs(q.roundOff).toFixed(2)}
                      </td>
                    </tr>
                  )}

                  <tr className="table-success">
                    <td className="text-end fw-bold fs-5">Final Amount</td>
                    <td className="text-end fw-bold fs-5">
                      ₹{Number(q.finalAmount || 0).toFixed(2)}
                    </td>
                  </tr>
                </tbody>
              </Table>
            </div>

            <div className="mt-3 text-center text-muted small">
              All amounts are final and calculated by the server.
            </div>
          </>
        )}
      </Modal.Body>
    </Modal>
  );
};

export default React.memo(QuotationProductModal);
