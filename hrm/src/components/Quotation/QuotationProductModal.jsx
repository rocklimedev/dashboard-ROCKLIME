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
      <Modal.Header>
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
                  const discountType = item.discountType || "percent";

                  // === Calculate discount amount ===
                  let discountAmount = 0;
                  if (discount > 0) {
                    if (discountType === "percent") {
                      discountAmount = (price * qty * discount) / 100;
                    } else {
                      discountAmount = discount;
                    }
                  }

                  // === Subtotal = (Price × Qty) - Discount (NO TAX here) ===
                  const subtotal = price * qty - discountAmount;

                  // === DO NOT apply line-level tax (your items have tax: 0) ===
                  // Tax is applied at document level via q.gst

                  // Use saved total if valid, otherwise use calculated subtotal
                  const savedTotal = Number(item.total);
                  const displayTotal = savedTotal > 0 ? savedTotal : subtotal;

                  const discountDisplay =
                    discount > 0
                      ? discountType === "percent"
                        ? `${discount}%`
                        : `₹${discount.toFixed(2)}`
                      : "—";

                  const imageUrl = item.imageUrl || item.images?.[0];

                  return (
                    <tr key={item.productId || item._id || idx}>
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
                      <td>{discountDisplay}</td>
                      <td>—</td> {/* No per-line tax */}
                      <td className="fw-bold">₹{displayTotal.toFixed(2)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>

            {/* ========== FINAL BREAKDOWN – ROBUST VERSION ========== */}
            <div className="mt-4">
              <Table bordered size="sm">
                <tbody>
                  {/* 1. Subtotal – sum of all line item totals */}
                  <tr>
                    <td className="text-end fw-bold">Subtotal</td>
                    <td className="text-end">
                      ₹
                      {lineItems
                        .reduce((sum, item) => sum + Number(item.total || 0), 0)
                        .toFixed(2)}
                    </td>
                  </tr>

                  {/* 2. Extra Discount */}
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
                        -₹
                        {Number(
                          q.discountAmount || q.extraDiscount || 0
                        ).toFixed(2)}
                      </td>
                    </tr>
                  )}

                  {/* 3. Shipping */}
                  {q.shippingAmount > 0 && (
                    <tr>
                      <td className="text-end text-success">Shipping</td>
                      <td className="text-end text-success">
                        +₹{Number(q.shippingAmount).toFixed(2)}
                      </td>
                    </tr>
                  )}

                  {/* 4. GST – NOW FIXED! */}
                  {q.gst > 0 && (
                    <tr>
                      <td className="text-end text-success">GST ({q.gst}%)</td>
                      <td className="text-end text-success">
                        +₹
                        {(
                          (lineItems.reduce(
                            (sum, item) => sum + Number(item.total || 0),
                            0
                          ) +
                            (q.shippingAmount || 0) -
                            (q.discountAmount || 0)) *
                          (q.gst / 100)
                        ).toFixed(2)}
                      </td>
                    </tr>
                  )}

                  {/* 5. Round Off */}
                  {q.roundOff != null && Number(q.roundOff) !== 0 && (
                    <tr>
                      <td className="text-end">Round Off</td>
                      <td
                        className={`text-end ${
                          Number(q.roundOff) >= 0
                            ? "text-success"
                            : "text-danger"
                        }`}
                      >
                        {Number(q.roundOff) >= 0 ? "+" : "-"}₹
                        {Math.abs(Number(q.roundOff)).toFixed(2)}
                      </td>
                    </tr>
                  )}

                  {/* 6. Final Amount */}
                  <tr className="table-primary fw-bold fs-5">
                    <td className="text-end">Final Amount</td>
                    <td className="text-end">
                      ₹{Number(q.finalAmount || 0).toFixed(2)}
                    </td>
                  </tr>
                </tbody>
              </Table>
            </div>
          </>
        )}
      </Modal.Body>
    </Modal>
  );
};

export default React.memo(QuotationProductModal);
