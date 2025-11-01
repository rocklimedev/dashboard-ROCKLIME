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
  products = "[]", // may be JSON string
  items = [], // already parsed array (preferred)
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

  /* ---------- 3. Build product map ---------- */
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

  /* ---------- 4. Calculate line totals ---------- */
  const calculateTotals = useCallback(() => {
    let subTotalExcl = 0;
    let grandTotal = 0;
    const lineDetails = [];

    lineItems.forEach((it) => {
      const meta = productMap[it.productId] || {};
      const unitPrice = meta.sellingPrice || Number(it.price) || 0;
      const qty = Number(it.quantity || it.qty || 0);
      const disc = Number(it.discount || 0);
      const tax = Number(it.tax || 0);

      const amountExcl = unitPrice * qty * (1 - disc / 100);
      const lineTotal = amountExcl * (1 + tax / 100);

      lineDetails.push({ amountExcl, lineTotal, unitPrice, qty, disc, tax });
      subTotalExcl += amountExcl;
      grandTotal += lineTotal;
    });

    return { lineDetails, subTotalExcl, grandTotal };
  }, [lineItems, productMap]);

  const { lineDetails, subTotalExcl, grandTotal } = calculateTotals();

  /* ---------- 5. Apply extra discount + round-off ---------- */
  const applyAdjustments = () => {
    let afterLines = grandTotal;

    const extraDisc = Number(selectedQuotation?.extraDiscount) || 0;
    const extraType = selectedQuotation?.extraDiscountType; // "fixed" | "percent"

    if (extraDisc && extraType === "fixed") afterLines -= extraDisc;
    else if (extraDisc && extraType === "percent")
      afterLines *= 1 - extraDisc / 100;

    const roundOff = Number(selectedQuotation?.roundOff) || 0;
    afterLines += roundOff; // back-end adds round-off

    return {
      afterExtraDiscount: afterLines - roundOff,
      afterRoundOff: afterLines,
      finalAmount: Number(selectedQuotation?.finalAmount) || 0,
    };
  };

  const { afterExtraDiscount, afterRoundOff, finalAmount } = applyAdjustments();

  /* --------------------------------------------------------------- */
  const toggleExpand = (id) => {
    setExpandedId((prev) => (prev === id ? "" : id));
  };

  return (
    <Modal show={show} onHide={onHide} size="xl" centered>
      <Modal.Header closeButton>
        <Modal.Title>{`Products`}</Modal.Title>
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
                  <th>Discount (%)</th>
                  <th>rTax (%)</th>
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
                      {/* Compact row */}
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
                        <td>{det.unitPrice.toFixed(2)}</td>
                        <td>{det.disc.toFixed(2)}%</td>
                        <td>{det.tax.toFixed(2)}%</td>
                        <td>{det.lineTotal.toFixed(2)}</td>
                      </tr>

                      {/* Expanded row */}
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
                                <h6>Line Item Details</h6>
                                <p>
                                  <strong>Name:</strong> {meta.name}
                                </p>
                                <p>
                                  <strong>Qty:</strong> {det.qty}
                                </p>
                                <p>
                                  <strong>Unit Price:</strong>{" "}
                                  {det.unitPrice.toFixed(2)}
                                </p>
                                <p>
                                  <strong>Discount:</strong> {det.disc}% (
                                  {(
                                    det.unitPrice *
                                    det.qty *
                                    (det.disc / 100)
                                  ).toFixed(2)}
                                  )
                                </p>
                                <p>
                                  <strong>Tax:</strong> {det.tax}% (
                                  {(det.amountExcl * (det.tax / 100)).toFixed(
                                    2
                                  )}
                                  )
                                </p>
                                <p>
                                  <strong>Amount excl. tax:</strong>{" "}
                                  {det.amountExcl.toFixed(2)}
                                </p>
                                <p>
                                  <strong>Line total:</strong>{" "}
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
                    <strong>{subTotalExcl.toFixed(2)}</strong>
                  </td>
                </tr>

                {selectedQuotation?.extraDiscount ? (
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
                      <strong>
                        -{(afterExtraDiscount - subTotalExcl).toFixed(2)}
                      </strong>
                    </td>
                  </tr>
                ) : null}

                {selectedQuotation?.roundOff ? (
                  <tr>
                    <td colSpan={6} className="text-end">
                      <strong>Round-off</strong>
                    </td>
                    <td colSpan={2}>
                      <strong>
                        {Number(selectedQuotation.roundOff).toFixed(2)}
                      </strong>
                    </td>
                  </tr>
                ) : null}

                <tr className="table-success">
                  <td colSpan={6} className="text-end">
                    <strong>Grand Total</strong>
                  </td>
                  <td colSpan={2}>
                    <strong>{afterRoundOff.toFixed(2)}</strong>
                    {finalAmount !== afterRoundOff && (
                      <Badge bg="warning" className="ms-2">
                        ≠ {finalAmount.toFixed(2)} (API)
                      </Badge>
                    )}
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
