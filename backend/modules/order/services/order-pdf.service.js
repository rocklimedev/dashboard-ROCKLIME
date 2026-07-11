const PDFDocument = require("pdfkit");

/**
 * Streams a full "Order Summary" PDF for the given (already-hydrated,
 * .toJSON()'d) order data object directly into the provided HTTP response.
 * Caller is responsible for setting Content-Type / Content-Disposition
 * headers before invoking this.
 */
function streamOrderSummaryPdf(data, res) {
  const quotationProducts = data.quotation?.products || [];
  const products =
    data.products?.length > 0 ? data.products : quotationProducts;

  const doc = new PDFDocument({ margin: 40, size: "A4" });
  doc.pipe(res);

  // ── HEADER ──
  doc.fontSize(22).text("ORDER SUMMARY", { align: "center" });
  doc.moveDown();
  doc.fontSize(11);
  doc.text(`Order No: ${data.orderNo}`);
  doc.text(`Quotation Ref: ${data.quotation?.reference_number || "-"}`);
  doc.text(`Status: ${data.status}`);
  doc.text(`Priority: ${data.priority}`);
  doc.text(`Created Date: ${new Date(data.createdAt).toLocaleDateString()}`);
  doc.text(
    `Due Date: ${
      data.dueDate ? new Date(data.dueDate).toLocaleDateString() : "-"
    }`,
  );
  doc.moveDown();

  // ── CUSTOMER ──
  doc.fontSize(16).text("Customer Details");
  doc.moveDown(0.5);
  doc.fontSize(11);
  doc.text(`Customer: ${data.customer?.name || "-"}`);
  doc.text(
    `Created By: ${data.creator?.name || data.creator?.username || "-"}`,
  );
  doc.text(
    `Assigned User: ${
      data.assignedUser?.name || data.assignedUser?.username || "-"
    }`,
  );
  doc.text(`Assigned Team: ${data.assignedTeam?.teamName || "-"}`);
  doc.moveDown();

  // ── DESCRIPTION ──
  doc.fontSize(16).text("Description");
  doc.moveDown(0.5);
  doc.fontSize(11).text(data.description || "-");
  doc.moveDown();

  // ── PRODUCTS ──
  doc.fontSize(16).text("Products");
  doc.moveDown();

  let y = doc.y;
  doc.fontSize(10);
  doc.text("#", 40, y);
  doc.text("Product", 70, y);
  doc.text("Qty", 320, y);
  doc.text("Price", 380, y);
  doc.text("Total", 470, y);
  y += 20;

  let grandTotal = 0;

  products.forEach((item, index) => {
    const total =
      Number(item.total) || Number(item.price) * Number(item.quantity);
    grandTotal += total;

    doc.text(index + 1, 40, y);
    doc.text(item.name || "-", 70, y, { width: 220 });
    doc.text(String(item.quantity || 0), 320, y);
    doc.text(`₹${Number(item.price || 0).toFixed(2)}`, 380, y);
    doc.text(`₹${total.toFixed(2)}`, 470, y);

    y += 25;
    if (y > 700) {
      doc.addPage();
      y = 50;
    }
  });

  doc.moveDown(3);

  // ── FINANCIAL SUMMARY ──
  doc.fontSize(16).text("Financial Summary");
  doc.moveDown();
  doc.fontSize(11);
  doc.text(`Product Total : ₹${grandTotal.toFixed(2)}`);
  doc.text(`Quotation Amount : ₹${data.quotation?.finalAmount || 0}`);
  doc.text(`Shipping : ₹${data.shipping || 0}`);
  doc.text(`GST : ₹${data.gstValue || 0}`);
  doc.text(`Extra Discount : ₹${data.extraDiscountValue || 0}`);
  doc.moveDown();

  const finalAmount =
    data.finalAmount && Number(data.finalAmount) > 0
      ? data.finalAmount
      : data.quotation?.finalAmount || 0;

  doc.fontSize(14).text(`Final Amount : ₹${finalAmount}`, { underline: true });
  doc.text(`Amount Paid : ₹${data.amountPaid || 0}`);
  doc.moveDown(2);

  // ── ORDER LINKS ──
  doc.fontSize(16).text("Order Relations");
  doc.moveDown();
  doc.fontSize(11);
  doc.text(`Master Order : ${data.masterOrder?.orderNo || "-"}`);
  doc.text(`Previous Order : ${data.previousOrder?.orderNo || "-"}`);
  doc.text(
    `Next Orders : ${
      data.nextOrders?.length
        ? data.nextOrders.map((o) => o.orderNo).join(", ")
        : "-"
    }`,
  );
  doc.moveDown(2);

  // ── FOOTER ──
  doc
    .fontSize(10)
    .fillColor("gray")
    .text(`Generated on ${new Date().toLocaleString()}`, { align: "right" });

  doc.end();
}

module.exports = { streamOrderSummaryPdf };
