import { PDFDocument, StandardFonts } from "pdf-lib";
import orderTemplate from "../../assets/pdf/order_report.pdf";
const addTemplatePage = async (pdfDoc, templateBytes) => {
  const templateDoc = await PDFDocument.load(templateBytes);
  const [templatePage] = await pdfDoc.copyPages(templateDoc, [0]);
  pdfDoc.addPage(templatePage);
  return pdfDoc.getPages()[pdfDoc.getPageCount() - 1];
};

export const generateOrderReportPDF = async (orders, startDate, endDate) => {
  try {
    const templateBytes = await fetch(orderTemplate).then((res) =>
      res.arrayBuffer(),
    );

    const pdfDoc = await PDFDocument.create();

    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const ROWS_PER_PAGE = 20;
    const FONT_SIZE = 10;

    const paginatedData = [];
    for (let i = 0; i < orders.length; i += ROWS_PER_PAGE) {
      paginatedData.push(orders.slice(i, i + ROWS_PER_PAGE));
    }

    for (let pageIndex = 0; pageIndex < paginatedData.length; pageIndex++) {
      const page = await addTemplatePage(pdfDoc, templateBytes);

      const COLS = {
        sno: 30,
        orderNo: 70,
        date: 150,
        client: 210,
        status: 355,
        amount: 500,
      };

      let y = 670; // move whole table slightly down

      paginatedData[pageIndex].forEach((o, i) => {
        const serialNo = pageIndex * ROWS_PER_PAGE + i + 1;

        const orderNo = o.orderNo || "-";
        const date = o.createdAt
          ? new Date(o.createdAt).toLocaleDateString("en-IN")
          : "-";

        const client = o.customer?.name || "Walk-in";
        const amount = `Rs ${Number(o.finalAmount || 0).toLocaleString("en-IN")}`;
        const status = (o.status || "-").toUpperCase();

        page.drawText(String(serialNo), {
          x: COLS.sno,
          y,
          font,
          size: FONT_SIZE,
        });
        page.drawText(orderNo, { x: COLS.orderNo, y, font, size: FONT_SIZE });
        page.drawText(date, { x: COLS.date, y, font, size: FONT_SIZE });
        page.drawText(client, { x: COLS.client, y, font, size: FONT_SIZE });
        page.drawText(amount, { x: COLS.amount, y, font, size: FONT_SIZE });
        page.drawText(status, { x: COLS.status, y, font, size: FONT_SIZE });

        y -= 30;
      });

      page.drawText(`${pageIndex + 1} / ${paginatedData.length}`, {
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
    link.download = `Order_Report_${Date.now()}.pdf`;
    link.click();

    URL.revokeObjectURL(url);
  } catch (err) {
    console.error("Order Report Error:", err);
  }
};
