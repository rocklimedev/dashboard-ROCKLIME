import { PDFDocument, StandardFonts } from "pdf-lib";
import poTemplate from "../../assets/pdf/order_report.pdf";
const addTemplatePage = async (pdfDoc, templateBytes) => {
  const templateDoc = await PDFDocument.load(templateBytes);
  const [templatePage] = await pdfDoc.copyPages(templateDoc, [0]);
  pdfDoc.addPage(templatePage);
  return pdfDoc.getPages()[pdfDoc.getPageCount() - 1];
};
export const generatePOReportPDF = async (pos, startDate, endDate) => {
  try {
    const templateBytes = await fetch(poTemplate).then((res) =>
      res.arrayBuffer(),
    );

    const pdfDoc = await PDFDocument.create();

    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

    const ROWS_PER_PAGE = 20;
    const paginated = [];

    for (let i = 0; i < pos.length; i += ROWS_PER_PAGE) {
      paginated.push(pos.slice(i, i + ROWS_PER_PAGE));
    }

    for (let p = 0; p < paginated.length; p++) {
      const page = await addTemplatePage(pdfDoc, templateBytes);

      const COLS = {
        sno: 30,
        poNo: 80,
        vendor: 200,
        date: 320,
        amount: 420,
        status: 520,
      };

      let y = 680;

      paginated[p].forEach((po, i) => {
        const sno = p * ROWS_PER_PAGE + i + 1;

        const poNo = po.poNumber || po.id || "-";
        const vendor = po.vendor?.vendorName || po.vendorName || "Unknown";
        const date = po.orderDate
          ? new Date(po.orderDate).toLocaleDateString("en-IN")
          : "-";

        const amount = `Rs. ${Number(po.totalAmount || 0).toLocaleString("en-IN")}`;
        const status = (po.status || "pending").toUpperCase();

        page.drawText(String(sno), { x: COLS.sno, y, font, size: 10 });
        page.drawText(poNo, { x: COLS.poNo, y, font, size: 10 });
        page.drawText(vendor, { x: COLS.vendor, y, font, size: 10 });
        page.drawText(date, { x: COLS.date, y, font, size: 10 });
        page.drawText(amount, { x: COLS.amount, y, font, size: 10 });
        page.drawText(status, { x: COLS.status, y, font, size: 10 });

        y -= 30;
      });

      page.drawText(`${p + 1} / ${paginated.length}`, {
        x: 500,
        y: 25,
        font,
        size: 10,
      });
    }

    const pdfBytes = await pdfDoc.save();

    const blob = new Blob([pdfBytes], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `PO_Report_${Date.now()}.pdf`;
    link.click();

    URL.revokeObjectURL(url);
  } catch (err) {
    console.error("PO Report Error:", err);
  }
};
