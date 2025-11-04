// QuotationProductModal.jsx
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Modal, Table, Image, Spinner, Alert, Badge } from "react-bootstrap";
import useProductsData from "../../data/useProductdata";

/* --------------------------------------------------------------- */
/* Safe JSON parse – works with string, array or null */
const safeParse = (str, fallback = []) => {
  if (Array.isArray(str)) return str;
  if (!str) return fallback;
  try {
    return JSON.parse(str);
  } catch {
    return fallback;
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

  /* ---------- 4. Line-item calculations (discount = amount by default) ---------- */
  const lineCalculations = useMemo(() => {
    const details = [];

    let subTotalExcl = 0;
    let grandTotal = 0;

    lineItems.forEach((it) => {
      const meta = productMap[it.productId] || {};
      const unitPrice = meta.sellingPrice || Number(it.sellingPrice) || 0;
      const qty = Number(it.quantity || it.qty || 1);
      const discVal = Number(it.discount || 0);
      const discType = it.discountType || "amount"; // default = fixed ₹
      const taxPct = Number(it.tax || 0);

      const subtotal = unitPrice * qty;
      const discountAmount =
        discType === "percent" ? (subtotal * discVal) / 100 : discVal;

      const amountExcl = subtotal - discountAmount;
      const lineTotal = amountExcl * (1 + taxPct / 100);

      details.push({
        ...it,
        unitPrice,
        qty,
        discVal,
        discType,
        discountAmount,
        taxPct,
        amountExcl,
        lineTotal,
      });

      subTotalExcl += amountExcl;
      grandTotal += lineTotal;
    });

    return { details, subTotalExcl, grandTotal };
  }, [lineItems, productMap]);

  const { details: lineDetails, subTotalExcl, grandTotal } = lineCalculations;

  /* ---------- 5. Apply all adjustments (extra-discount, shipping, GST, round-off) ---------- */
  const finalBreakdown = useMemo(() => {
    // ---- 1. Base from lines ----
    let afterLines = grandTotal;

    // ---- 2. Extra Discount ----
    const extraDisc = Number(selectedQuotation?.extraDiscount) || 0;
    const extraType = selectedQuotation?.extraDiscountType || "fixed";

    let afterExtraDiscount = afterLines;
    let discountAmount = 0;

    if (extraDisc > 0) {
      if (extraType === "percent") {
        discountAmount = (afterLines * extraDisc) / 100;
      } else {
        discountAmount = extraDisc;
      }
      afterExtraDiscount = afterLines - discountAmount;
    }

    // ---- 3. Shipping ----
    const shipping = Number(selectedQuotation?.shippingAmount) || 0;
    const amountAfterShipping = afterExtraDiscount + shipping;

    // ---- 4. GST (flat amount – not percentage) ----
    const gstAmount = Number(selectedQuotation?.gst) || 0;
    const amountWithGst = amountAfterShipping + gstAmount;

    // ---- 5. Round-off ----
    const roundOff = Number(selectedQuotation?.roundOff) || 0;
    const amountAfterRoundOff = amountWithGst + roundOff;

    // ---- 6. Final amount from DB (fallback) ----
    const finalAmountFromDB = Number(selectedQuotation?.finalAmount) || 0;

    // ---- 7. Use DB value if different (for audit) ----
    const finalAmount = finalAmountFromDB;

    return {
      afterLines,
      extraDisc,
      extraType,
      discountAmount,
      afterExtraDiscount,
      shipping,
      amountAfterShipping,
      gstAmount,
      amountWithGst,
      roundOff,
      amountAfterRoundOff,
      finalAmount,
      finalAmountFromDB,
    };
  }, [grandTotal, selectedQuotation]);

  const {
    afterLines,
    extraDisc,
    extraType,
    discountAmount,
    afterExtraDiscount,
    shipping,
    amountAfterShipping,
    gstAmount,
    amountWithGst,
    roundOff,
    amountAfterRoundOff,
    finalAmount,
    finalAmountFromDB,
  } = finalBreakdown;

  /* --------------------------------------------------------------- */
  return (
    <Modal show={show} onHide={onHide} size="xl" centered>
      <Modal.Header>
        <Modal.Title>Quotation Products & Full Pricing</Modal.Title>
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
            {/* ==================== LINE ITEMS ==================== */}
            <Table
              striped
              bordered
              hover
              responsive
              className="align-middle text-center mb-4"
            >
              <thead className="table-dark">
                <tr>
                  <th>#</th>
                  <th>Image</th>
                  <th>Product</th>
                  <th>Qty</th>
                  <th>Unit Price</th>
                  <th>Discount</th>
                  <th>Tax (%)</th>
                  <th>Line Total</th>
                </tr>
              </thead>
              <tbody>
                {lineDetails.map((det, idx) => {
                  const meta = productMap[det.productId] || {};

                  return (
                    <tr key={det.productId || idx}>
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
                      <td>
                        {det.discType === "percent"
                          ? `${det.discVal}%`
                          : `₹${det.discountAmount.toFixed(2)}`}
                      </td>
                      <td>{det.taxPct.toFixed(2)}%</td>
                      <td>₹{det.lineTotal.toFixed(2)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>

            {/* ==================== FINANCIAL BREAKDOWN ==================== */}
            <Table bordered className="table-sm">
              <tbody>
                {/* 1. Line subtotal (excl. tax) */}
                <tr className="table-info">
                  <td className="text-end fw-bold">Subtotal (excl. tax)</td>
                  <td className="text-end fw-bold">
                    ₹{subTotalExcl.toFixed(2)}
                  </td>
                </tr>

                {/* 2. Line total (incl. tax) */}
                <tr>
                  <td className="text-end">Line Total (incl. tax)</td>
                  <td className="text-end">₹{afterLines.toFixed(2)}</td>
                </tr>

                {/* 3. Extra Discount */}
                {extraDisc > 0 && (
                  <tr>
                    <td className="text-end">
                      Extra Discount (
                      {extraType === "percent"
                        ? `${extraDisc}%`
                        : `₹${extraDisc}`}
                      )
                    </td>
                    <td className="text-end text-danger">
                      -₹{discountAmount.toFixed(2)}
                    </td>
                  </tr>
                )}

                {/* 4. After Extra Discount */}
                {extraDisc > 0 && (
                  <tr>
                    <td className="text-end">After Extra Discount</td>
                    <td className="text-end">
                      ₹{afterExtraDiscount.toFixed(2)}
                    </td>
                  </tr>
                )}

                {/* 5. Shipping */}
                {shipping > 0 && (
                  <tr>
                    <td className="text-end">Shipping</td>
                    <td className="text-end text-success">
                      +₹{shipping.toFixed(2)}
                    </td>
                  </tr>
                )}

                {/* 6. GST (flat amount) */}
                {gstAmount > 0 && (
                  <tr>
                    <td className="text-end">GST</td>
                    <td className="text-end text-success">
                      +₹{gstAmount.toFixed(2)}
                    </td>
                  </tr>
                )}

                {/* 7. Amount before round-off */}
                <tr className="table-secondary">
                  <td className="text-end fw-bold">Before Round-off</td>
                  <td className="text-end fw-bold">
                    ₹{amountWithGst.toFixed(2)}
                  </td>
                </tr>

                {/* 8. Round-off */}
                {roundOff !== 0 && (
                  <tr>
                    <td className="text-end">
                      Round-off ({roundOff >= 0 ? "+" : "-"}₹
                      {Math.abs(roundOff).toFixed(2)})
                    </td>
                    <td
                      className={`text-end ${
                        roundOff >= 0 ? "text-success" : "text-danger"
                      }`}
                    >
                      {roundOff >= 0 ? "+" : "-"}₹
                      {Math.abs(roundOff).toFixed(2)}
                    </td>
                  </tr>
                )}

                {/* 9. Calculated Grand Total */}
                <tr className="table-success">
                  <td className="text-end fw-bold">Grand Total (calc)</td>
                  <td className="text-end fw-bold">
                    ₹{amountAfterRoundOff.toFixed(2)}
                  </td>
                </tr>
              </tbody>
            </Table>
          </>
        )}
      </Modal.Body>
    </Modal>
  );
};

export default QuotationProductModal;
