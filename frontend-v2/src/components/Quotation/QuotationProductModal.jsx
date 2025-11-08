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

  const lineItems = useMemo(() => {
    const fromProducts = safeParse(q.products);
    const fromItems = Array.isArray(q.items) ? q.items : [];

    const normalized = Array.isArray(fromProducts)
      ? fromProducts.map((p) => ({
          productId: p.productId || p.id,
          quantity: p.quantity || 1,
          price: p.sellingPrice || p.price,
          total: p.total,
          discount: p.discount || 0,
          discountType: p.discountType || "amount",
          tax: p.tax || 0,
          name: p.name,
          imageUrl: p.imageUrl,
        }))
      : [];

    const hasFullInfo =
      normalized.length > 0 && normalized[0].total !== undefined;

    return hasFullInfo ? normalized : fromItems;
  }, [q.products, q.items]);

  /* ---------- PRODUCT MAP (name + image) ---------- */
  const productMap = useMemo(() => {
    const map = {};
    lineItems.forEach((it) => {
      if (!it.productId) return;
      const unitPrice = Number(it.price || it.sellingPrice || 0);
      const name = it.name?.trim() || "Unnamed product";
      const imageUrl = it.imageUrl || null;
      map[it.productId] = { sellingPrice: unitPrice, name, imageUrl };
    });
    return map;
  }, [lineItems]);

  /* ---------- LINE CALCULATIONS ---------- */
  const lineCalculations = useMemo(() => {
    const details = [];
    let subTotalExcl = 0;
    let grandTotal = 0;

    lineItems.forEach((it) => {
      const meta = productMap[it.productId] || {};
      const unitPrice = meta.sellingPrice || 0;
      const qty = Number(it.quantity || it.qty || 1);

      const lineTotalFromDB = Number(it.total) || 0;
      const useDbTotal = lineTotalFromDB > 0;

      const discVal = Number(it.discount || 0);
      const discType = it.discountType || "amount";

      let subtotal = useDbTotal ? lineTotalFromDB : unitPrice * qty;
      let discountAmount = 0;

      if (!useDbTotal && discVal > 0) {
        discountAmount =
          discType === "percent" ? (subtotal * discVal) / 100 : discVal;
        subtotal -= discountAmount;
      }

      const taxPct = Number(it.tax || 0);
      const lineTotal = useDbTotal
        ? lineTotalFromDB
        : subtotal * (1 + taxPct / 100);

      details.push({
        ...it,
        unitPrice,
        qty,
        discVal,
        discType,
        discountAmount,
        taxPct,
        amountExcl: subtotal,
        lineTotal,
        useDbTotal,
      });

      subTotalExcl += subtotal;
      grandTotal += lineTotal;
    });

    return { details, subTotalExcl, grandTotal };
  }, [lineItems, productMap]);

  const { details: lineDetails, subTotalExcl, grandTotal } = lineCalculations;

  /* ---------- FINAL BREAKDOWN ---------- */
  const finalBreakdown = useMemo(() => {
    const lineTotal = grandTotal;

    const extraDisc = Number(q.extraDiscount || 0);
    const extraType = q.extraDiscountType || "percent";

    let extraDiscountAmount = 0;
    if (extraDisc > 0) {
      extraDiscountAmount =
        extraType === "percent" ? (lineTotal * extraDisc) / 100 : extraDisc;
    }

    const afterExtra = lineTotal - extraDiscountAmount;
    const shipping = Number(q.shippingAmount || 0);
    const baseForTax = afterExtra + shipping;

    const gstPct = Number(q.gst || 0);
    const gstAmount = gstPct > 0 ? (baseForTax * gstPct) / 100 : 0;

    const beforeRoundOff = baseForTax + gstAmount;
    const roundOff = Number(q.roundOff || 0);
    const calculatedTotal = parseFloat((beforeRoundOff + roundOff).toFixed(2));

    const finalAmountFromDB = parseFloat(q.finalAmount) || 0;
    const isDraftZero = finalAmountFromDB === 0;
    const mismatch =
      !isDraftZero && Math.abs(calculatedTotal - finalAmountFromDB) > 0.01;

    return {
      afterLines: lineTotal,
      extraDisc,
      extraType,
      extraDiscountAmount,
      afterExtraDiscount: afterExtra,
      shipping,
      amountAfterShipping: afterExtra + shipping,
      gstPct,
      gstAmount,
      amountWithGst: beforeRoundOff,
      roundOff,
      calculatedTotal,
      finalAmountFromDB,
      mismatch,
    };
  }, [grandTotal, q]);

  const {
    afterLines,
    extraDisc,
    extraType,
    extraDiscountAmount,
    afterExtraDiscount,
    shipping,
    amountAfterShipping,
    gstPct,
    gstAmount,
    amountWithGst,
    roundOff,
    calculatedTotal,
    finalAmountFromDB,
    mismatch,
  } = finalBreakdown;

  /* --------------------------------------------------------------- */
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
    <Modal show={show} onHide={onHide} size="xl" centered>
      <Modal.Header>
        <Modal.Title>Quotation Products & Pricing</Modal.Title>
      </Modal.Header>

      <Modal.Body className="p-4">
        {lineItems.length === 0 ? (
          <Alert variant="info">No products in this quotation.</Alert>
        ) : (
          <>
            {/* ---------- LINE ITEMS TABLE ---------- */}
            <Table
              striped
              bordered
              hover
              responsive
              className="mb-4 align-middle text-center"
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

            {/* ---------- FINANCIAL BREAKDOWN ---------- */}
            <Table bordered className="table-sm">
              <tbody>
                <tr className="table-info">
                  <td className="text-end fw-bold">Subtotal (excl. tax)</td>
                  <td className="text-end fw-bold">
                    ₹{subTotalExcl.toFixed(2)}
                  </td>
                </tr>

                <tr>
                  <td className="text-end">Line Total (incl. tax)</td>
                  <td className="text-end">₹{afterLines.toFixed(2)}</td>
                </tr>

                {extraDisc > 0 && (
                  <>
                    <tr>
                      <td className="text-end">
                        Extra Discount (
                        {extraType === "percent"
                          ? `${extraDisc}%`
                          : `₹${extraDisc}`}
                        )
                      </td>
                      <td className="text-end text-danger">
                        -₹{extraDiscountAmount.toFixed(2)}
                      </td>
                    </tr>
                    <tr>
                      <td className="text-end">After Extra Discount</td>
                      <td className="text-end">
                        ₹{afterExtraDiscount.toFixed(2)}
                      </td>
                    </tr>
                  </>
                )}

                {shipping > 0 && (
                  <tr>
                    <td className="text-end">Shipping</td>
                    <td className="text-end text-success">
                      +₹{shipping.toFixed(2)}
                    </td>
                  </tr>
                )}

                {gstPct > 0 && (
                  <tr>
                    <td className="text-end">GST ({gstPct}%)</td>
                    <td className="text-end text-success">
                      +₹{gstAmount.toFixed(2)}
                    </td>
                  </tr>
                )}

                <tr className="table-secondary">
                  <td className="text-end fw-bold">Before Round-off</td>
                  <td className="text-end fw-bold">
                    ₹{amountWithGst.toFixed(2)}
                  </td>
                </tr>

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

                <tr className="table-success">
                  <td className="text-end fw-bold">
                    Grand Total (calc)
                    {mismatch && (
                      <Badge bg="warning" className="ms-2">
                        Mismatch
                      </Badge>
                    )}
                  </td>
                  <td className="text-end fw-bold">
                    ₹{calculatedTotal.toFixed(2)}
                  </td>
                </tr>

                <tr className="table-primary">
                  <td className="text-end fw-bold">Final Amount (DB)</td>
                  <td className="text-end fw-bold">
                    ₹{finalAmountFromDB.toFixed(2)}
                  </td>
                </tr>
              </tbody>
            </Table>

            {mismatch && (
              <Alert variant="warning" className="mt-3">
                <strong>Warning:</strong> The locally calculated total (₹
                {calculatedTotal.toFixed(2)}) differs from the stored final
                amount (₹{finalAmountFromDB.toFixed(2)}).
              </Alert>
            )}
          </>
        )}
      </Modal.Body>
    </Modal>
  );
};

export default React.memo(QuotationProductModal);
