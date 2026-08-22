import React, { useState } from "react";
import { Button, message } from "antd";
import { FilePdfOutlined } from "@ant-design/icons";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

/**
 * DownloadDispatchListButton
 * ---------------------------------
 * Generates and downloads a PDF summary of an order's dispatch history.
 * Pure client-side (no server round trip) — uses jsPDF + jspdf-autotable.
 *
 * npm install jspdf jspdf-autotable
 *
 * Props:
 *  - order:      the order object (needs orderNo, and ideally customer info)
 *  - dispatches: array of dispatch records (same shape used in the
 *                Dispatch History table on the order page)
 *  - products:   optional array of the order's full product list (same
 *                shape as `mergedProducts` on the order page — name, sku,
 *                brand, price, quantity, discount, discountType, total).
 *                When provided, an "Order Products" table is printed above
 *                the dispatch list.
 *  - customer:   optional customer object { name, email, mobileNumber }
 *  - detailed:   optional bool — if true, also prints each dispatch's line
 *                items under its summary row (default: false)
 */
const money = (value) =>
  Number(value || 0).toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  });

const formatDate = (value) =>
  value
    ? new Date(value).toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

const DownloadDispatchListButton = ({
  order = {},
  dispatches = [],
  products = [],
  customer = {},
  detailed = false,
  size = "middle",
  block = false,
}) => {
  const [generating, setGenerating] = useState(false);
  const hasProducts = products.length > 0;

  const handleDownload = () => {
    if (!dispatches.length && !hasProducts) {
      message.info("Nothing to export yet.");
      return;
    }

    setGenerating(true);
    try {
      const doc = new jsPDF({ orientation: "landscape", unit: "pt" });
      const pageWidth = doc.internal.pageSize.getWidth();

      // ── Header ────────────────────────────────────────
      doc.setFontSize(16);
      doc.setFont(undefined, "bold");
      doc.text(`Dispatch List — Order #${order.orderNo || "—"}`, 40, 40);

      doc.setFontSize(10);
      doc.setFont(undefined, "normal");
      const generatedOn = new Date().toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
      doc.text(`Generated on: ${generatedOn}`, 40, 58);

      if (customer?.name) {
        doc.text(
          `Customer: ${customer.name}${
            customer.mobileNumber ? "  |  " + customer.mobileNumber : ""
          }`,
          40,
          74,
        );
      }

      let cursorY = customer?.name ? 88 : 72;

      // ── Order Products table ────────────────────────────
      if (hasProducts) {
        doc.setFont(undefined, "bold");
        doc.setFontSize(11);
        doc.text("Order Products", 40, cursorY);
        doc.setFont(undefined, "normal");

        const productRows = products.map((p) => {
          const discountVal = Number(p.discount || 0);
          const discountLabel = !discountVal
            ? "—"
            : p.discountType === "percent"
              ? `${discountVal}%`
              : money(discountVal);
          return [
            p.name || "—",
            p.sku || "—",
            p.brand || "—",
            p.quantity ?? 0,
            money(p.price),
            discountLabel,
            money(p.total),
          ];
        });

        const productsTotal = products.reduce(
          (sum, p) => sum + Number(p.total || 0),
          0,
        );

        autoTable(doc, {
          startY: cursorY + 10,
          head: [
            ["Product", "SKU", "Brand", "Qty", "Price", "Discount", "Total"],
          ],
          body: productRows,
          foot: [["", "", "", "", "", "Order Total", money(productsTotal)]],
          theme: "striped",
          headStyles: { fillColor: [82, 196, 26] },
          footStyles: {
            fillColor: [245, 245, 245],
            textColor: 20,
            fontStyle: "bold",
          },
          styles: { fontSize: 8, cellPadding: 5 },
          margin: { left: 40, right: 40 },
        });

        cursorY = doc.lastAutoTable.finalY + 28;
      }

      // ── Summary table (one row per dispatch) ───────────
      let finalY = cursorY;

      if (dispatches.length) {
        if (hasProducts) {
          // Page-break check before starting a new labeled section.
          if (cursorY > doc.internal.pageSize.getHeight() - 100) {
            doc.addPage();
            cursorY = 40;
          }
          doc.setFont(undefined, "bold");
          doc.setFontSize(11);
          doc.text("Dispatch History", 40, cursorY);
          doc.setFont(undefined, "normal");
          cursorY += 10;
        }

        const summaryRows = dispatches.map((d) => [
          `#${d.dispatchNumber ?? "—"}`,
          formatDate(d.dispatchDate),
          Array.isArray(d.items) ? d.items.length : 0,
          d.totalQuantity ?? 0,
          money(d.subtotal),
          Number(d.totalDiscount || 0) > 0 ? `-${money(d.totalDiscount)}` : "—",
          money(d.totalTax),
          money(d.totalAmount),
          d.carrier || "—",
          d.trackingNumber || "—",
          d.status || "—",
        ]);

        autoTable(doc, {
          startY: cursorY,
          head: [
            [
              "Dispatch #",
              "Date",
              "Items",
              "Qty",
              "Subtotal",
              "Discount",
              "Tax",
              "Amount",
              "Carrier",
              "Tracking",
              "Status",
            ],
          ],
          body: summaryRows,
          theme: "striped",
          headStyles: { fillColor: [24, 103, 255] },
          styles: { fontSize: 8, cellPadding: 5 },
          margin: { left: 40, right: 40 },
        });

        // ── Grand totals ────────────────────────────────
        const grandTotal = dispatches.reduce(
          (sum, d) => sum + Number(d.totalAmount || 0),
          0,
        );
        const grandQty = dispatches.reduce(
          (sum, d) => sum + Number(d.totalQuantity || 0),
          0,
        );

        finalY = doc.lastAutoTable.finalY + 20;
        doc.setFont(undefined, "bold");
        doc.setFontSize(10);
        doc.text(
          `Total Dispatches: ${dispatches.length}   |   Total Qty: ${grandQty}   |   Total Amount: ${money(
            grandTotal,
          )}`,
          40,
          finalY,
        );
        doc.setFont(undefined, "normal");
      }

      // ── Optional per-dispatch line-item breakdown ──────
      if (detailed && dispatches.length) {
        dispatches.forEach((d) => {
          const items = Array.isArray(d.items) ? d.items : [];
          if (!items.length) return;

          finalY = doc.lastAutoTable.finalY + 24;
          if (finalY > doc.internal.pageSize.getHeight() - 80) {
            doc.addPage();
            finalY = 40;
          }

          doc.setFont(undefined, "bold");
          doc.setFontSize(10);
          doc.text(`Dispatch #${d.dispatchNumber} — Line Items`, 40, finalY);
          doc.setFont(undefined, "normal");

          autoTable(doc, {
            startY: finalY + 8,
            head: [
              [
                "Product",
                "Code",
                "Qty",
                "Unit Price",
                "Discount",
                "Line Total",
              ],
            ],
            body: items.map((it) => [
              it.name || "—",
              it.companyCode || "—",
              it.quantity ?? 0,
              money(it.price),
              it.discountType === "percent"
                ? `${it.discount || 0}%`
                : money(it.discount),
              money(
                it.total ?? Number(it.price || 0) * Number(it.quantity || 0),
              ),
            ]),
            theme: "grid",
            styles: { fontSize: 8, cellPadding: 4 },
            margin: { left: 40, right: 40 },
          });
        });
      }

      // ── Footer / page numbers ───────────────────────────
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(
          `Page ${i} of ${pageCount}`,
          pageWidth - 80,
          doc.internal.pageSize.getHeight() - 20,
        );
      }

      doc.save(`DispatchList-Order-${order.orderNo || "unknown"}.pdf`);
    } catch (err) {
      console.error(err);
      message.error("Failed to generate dispatch list PDF.");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Button
      icon={<FilePdfOutlined />}
      onClick={handleDownload}
      loading={generating}
      disabled={!dispatches.length}
      size={size}
      block={block}
    >
      Download Dispatch List
    </Button>
  );
};

export default DownloadDispatchListButton;
