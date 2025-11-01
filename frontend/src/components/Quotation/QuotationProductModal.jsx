// QuotationProductModal.jsx
import React, { useState, useEffect, useCallback } from "react";
import { Modal, Table, Image, Spinner, Alert, Badge } from "react-bootstrap";
import useProductsData from "../../data/useProductdata";

/* --------------------------------------------------------------- */
/* Safe JSON parse */
const safeParse = (str) => {
  if (Array.isArray(str)) return str;
  if (!str) return [];
  try {
    return JSON.parse(str);
  } catch {
    return [];
  }
};

/* --------------------------------------------------------------- */
const QuotationProductModal = ({
  show,
  onHide,
  products = "[]",
  items = [],
  selectedQuotation,
}) => {
  const [expandedId, setExpandedId] = useState("");
  const [lineItems, setLineItems] = useState([]);
  const [productMap, setProductMap] = useState({});

  /* ---------- 1. Normalise line-items ---------- */
  useEffect(() => {
    const fromItems = Array.isArray(items) ? items : [];
    const fromProducts = safeParse(products);
    setLineItems(fromItems.length ? fromItems : fromProducts);
  }, [items, products]);

  /* ---------- 2. Fetch full product details ---------- */
  const { productsData, errors, loading } = useProductsData(lineItems);

  /* ---------- 3. Build product map (price + image) ---------- */
  useEffect(() => {
    const map = {};
    productsData.forEach((p) => {
      const sellingPrice =
        Number(p.metaDetails?.find((m) => m.slug === "sellingPrice")?.value) ||
        0;

      let imageUrl = null;
      if (p.images) {
        try {
          const imgs = JSON.parse(p.images);
          imageUrl = Array.isArray(imgs) && imgs[0] ? imgs[0] : null;
        } catch {}
      }

      map[p.productId] = {
        sellingPrice,
        imageUrl,
        name: p.name || "Unnamed product",
      };
    });
    setProductMap(map);
  }, [productsData]);

  /* ---------- 4. Calculate line totals (FIXED: discount is ₹ amount) ---------- */
  const calculateTotals = useCallback(() => {
    let subTotalExcl = 0;
    let grandTotal = 0;
    const lineDetails = [];

    lineItems.forEach((it) => {
      const meta = productMap[it.productId] || {};
      const unitPrice = meta.sellingPrice || Number(it.sellingPrice) || 0;
      const qty = Number(it.quantity || it.qty || 1);
      const discAmt = Number(it.discount || 0); // This is already ₹ amount
      const taxPct = Number(it.tax || 0);

      // Correct: subtract rupee discount directly
      const amountExcl = unitPrice * qty - discAmt;
      const lineTotal = amountExcl * (1 + taxPct / 100);

      lineDetails.push({
        amountExcl,
        lineTotal,
        unitPrice,
        qty,
        discAmt,
        taxPct,
      });

      subTotalExcl += amountExcl;
      grandTotal += lineTotal;
    });

    return { lineDetails, subTotalExcl, grandTotal };
  }, [lineItems, productMap]);

  const { lineDetails, subTotalExcl, grandTotal } = calculateTotals();

  /* ---------- 5. Apply shipping + extra discount + round-off ---------- */
  const applyAdjustments = useCallback(() => {
    let afterLines = grandTotal;

    // 1. Apply Extra Discount FIRST (on subtotal only)
    const extraDisc = Number(selectedQuotation?.extraDiscount) || 0;
    const extraType = selectedQuotation?.extraDiscountType;

    let afterExtraDiscount = afterLines;
    let discountAmount = 0;

    if (extraDisc > 0) {
      if (extraType === "percent") {
        discountAmount = afterLines * (extraDisc / 100);
        afterExtraDiscount = afterLines - discountAmount;
      } else if (extraType === "fixed") {
        discountAmount = extraDisc;
        afterExtraDiscount = afterLines - extraDisc;
      }
    }

    // 2. Add Shipping
    const shipping = Number(selectedQuotation?.shippingAmount) || 0;
    const beforeRoundOff = afterExtraDiscount + shipping;

    // 3. Round-off
    const roundOff = Number(selectedQuotation?.roundOff) || 0;
    const afterRoundOff = beforeRoundOff + roundOff;
    return {
      shipping,
      discountAmount,
      afterExtraDiscount,
      beforeRoundOff,
      roundOff,
      afterRoundOff,
      finalAmount: Number(selectedQuotation?.finalAmount) || 0,
    };
  }, [grandTotal, selectedQuotation]);
  const {
    shipping,
    discountAmount,
    afterExtraDiscount,
    beforeRoundOff,
    roundOff,
    afterRoundOff,
    finalAmount,
  } = applyAdjustments();
  /* --------------------------------------------------------------- */
  const toggleExpand = (id) => {
    setExpandedId((prev) => (prev === id ? "" : id));
  };

  return (
    <Modal show={show} onHide={onHide} size="xl" centered>
      <Modal.Header>
        <Modal.Title>Quotation Products & Pricing</Modal.Title>
      </Modal.Header>

      <Modal.Body style={{ overflowX: "auto" }}>
        {loading ? (
          <div className="text-center py-4">
            <Spinner animation="border" />
            <p className="mt-2">Loading product details…</p>
          </div>
        ) : errors.length ? (
          <Alert variant="danger">
            Failed to load some products:{" "}
            {errors.map((e) => e.error).join(", ")}
          </Alert>
        ) : (
          <>
            <Table
              striped
              bordered
              hover
              responsive
              className="align-middle text-center"
            >
              <thead className="table-dark">
                <tr>
                  <th>#</th>
                  <th>Image</th>
                  <th>Product</th>
                  <th>Qty</th>
                  <th>Unit Price</th>
                  <th>Discount (₹)</th>
                  <th>Tax (%)</th>
                  <th>Line Total</th>
                </tr>
              </thead>

              <tbody>
                {lineDetails.map((det, idx) => {
                  const it = lineItems[idx];
                  const meta = productMap[it.productId] || {};
                  const isExpanded = expandedId === it.productId;

                  return (
                    <React.Fragment key={it.productId || idx}>
                      {/* Compact Row */}
                      <tr
                        onClick={() => toggleExpand(it.productId)}
                        style={{ cursor: "pointer" }}
                      >
                        <td>{idx + 1}</td>
                        <td>
                          {meta.imageUrl ? (
                            <Image
                              src={meta.imageUrl}
                              rounded
                              style={{
                                width: 55,
                                height: 55,
                                objectFit: "contain",
                              }}
                            />
                          ) : (
                            <div
                              style={{
                                width: 55,
                                height: 55,
                                background: "#f1f1f1",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: "0.7rem",
                                color: "#999",
                              }}
                            >
                              No image
                            </div>
                          )}
                        </td>
                        <td className="text-start">{meta.name || "—"}</td>
                        <td>{det.qty}</td>
                        <td>₹{det.unitPrice.toFixed(2)}</td>
                        <td>₹{det.discAmt.toFixed(2)}</td>
                        <td>{det.taxPct.toFixed(2)}%</td>
                        <td>₹{det.lineTotal.toFixed(2)}</td>
                      </tr>

                      {/* Expanded Row */}
                      {isExpanded && (
                        <tr>
                          <td colSpan={8} className="bg-light p-0">
                            <div className="p-3 d-flex gap-4">
                              {meta.imageUrl && (
                                <Image
                                  src={meta.imageUrl}
                                  rounded
                                  style={{
                                    width: 120,
                                    height: 120,
                                    objectFit: "contain",
                                  }}
                                />
                              )}
                              <div className="flex-grow-1">
                                <h6>Line Item Breakdown</h6>
                                <p>
                                  <strong>Name:</strong> {meta.name}
                                </p>
                                <p>
                                  <strong>Qty:</strong> {det.qty}
                                </p>
                                <p>
                                  <strong>Unit Price:</strong> ₹
                                  {det.unitPrice.toFixed(2)}
                                </p>
                                <p>
                                  <strong>Discount:</strong> ₹
                                  {det.discAmt.toFixed(2)}
                                </p>
                                <p>
                                  <strong>Amount excl. tax:</strong> ₹
                                  {det.amountExcl.toFixed(2)}
                                </p>
                                <p>
                                  <strong>Tax ({det.taxPct}%):</strong> ₹
                                  {(
                                    det.amountExcl *
                                    (det.taxPct / 100)
                                  ).toFixed(2)}
                                </p>
                                <p>
                                  <strong>Line Total:</strong> ₹
                                  {det.lineTotal.toFixed(2)}
                                </p>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>

              {/* Footer – Totals */}
              <tfoot>
                <tr className="table-info">
                  <td colSpan={6} className="text-end">
                    <strong>Subtotal (excl. tax)</strong>
                  </td>
                  <td colSpan={2}>
                    <strong>₹{subTotalExcl.toFixed(2)}</strong>
                  </td>
                </tr>

                {selectedQuotation?.extraDiscount > 0 && (
                  <tr>
                    <td colSpan={6} className="text-end">
                      <strong>
                        Extra Discount (
                        {selectedQuotation.extraDiscountType === "fixed"
                          ? "₹"
                          : ""}
                        {selectedQuotation.extraDiscount}
                        {selectedQuotation.extraDiscountType === "percent"
                          ? "%"
                          : ""}
                        )
                      </strong>
                    </td>
                    <td colSpan={2}>
                      <strong>-₹{discountAmount.toFixed(2)}</strong>
                    </td>
                  </tr>
                )}

                {shipping > 0 && (
                  <tr>
                    <td colSpan={6} className="text-end">
                      <strong>Shipping</strong>
                    </td>
                    <td colSpan={2}>
                      <strong>+₹{shipping.toFixed(2)}</strong>
                    </td>
                  </tr>
                )}

                <tr className="table-secondary">
                  <td colSpan={6} className="text-end">
                    <strong>Before Round-off</strong>
                  </td>
                  <td colSpan={2}>
                    <strong>₹{beforeRoundOff.toFixed(2)}</strong>
                  </td>
                </tr>

                {roundOff !== 0 && (
                  <tr>
                    <td colSpan={6} className="text-end">
                      <strong>Round-off</strong>
                    </td>
                    <td colSpan={2}>
                      <strong>
                        {(roundOff >= 0 ? "+" : "") +
                          "₹" +
                          Math.abs(roundOff).toFixed(2)}
                      </strong>
                    </td>
                  </tr>
                )}

                <tr className="table-success">
                  <td colSpan={6} className="text-end">
                    <strong>Grand Total</strong>
                  </td>
                  <td colSpan={2}>
                    <strong>₹{afterRoundOff.toFixed(2)}</strong>
                    {finalAmount !== afterRoundOff}
                  </td>
                </tr>
              </tfoot>
            </Table>
          </>
        )}
      </Modal.Body>
    </Modal>
  );
};

export default QuotationProductModal;
