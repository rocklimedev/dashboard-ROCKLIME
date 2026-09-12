import { PDFDocument, StandardFonts } from "pdf-lib";
import quotationTemplate from "../../assets/pdf/quotation_report.pdf";

export const generateQuotationReportPDF = async (
  quotations,
  startDate,
  endDate,
) => {
  try {
    // =====================================
    // LOAD TEMPLATE
    // =====================================
    const templateBytes = await fetch(quotationTemplate).then((res) =>
      res.arrayBuffer(),
    );

    const pdfDoc = await PDFDocument.create();

    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // =====================================
    // SETTINGS
    // =====================================

    const ROWS_PER_PAGE = 20;
    const ROW_HEIGHT = 33;
    const FONT_SIZE = 10;

    // =====================================
    // TEMPLATE PAGE CREATOR
    // =====================================
    const wrapText = (text, maxWidth, font, fontSize) => {
      if (!text) return ["-"];

      const words = String(text).split(" ");
      const lines = [];
      let currentLine = "";

      for (const word of words) {
        const testLine = currentLine ? `${currentLine} ${word}` : word;

        const width = font.widthOfTextAtSize(testLine, fontSize);

        if (width <= maxWidth) {
          currentLine = testLine;
        } else {
          if (currentLine) {
            lines.push(currentLine);
          }
          currentLine = word;
        }
      }

      if (currentLine) {
        lines.push(currentLine);
      }

      return lines;
    };
    const addTemplatePage = async () => {
      const templateDoc = await PDFDocument.load(templateBytes);

      const [templatePage] = await pdfDoc.copyPages(templateDoc, [0]);

      pdfDoc.addPage(templatePage);

      return pdfDoc.getPages()[pdfDoc.getPageCount() - 1];
    };

    // =====================================
    // PAGINATION
    // =====================================

    const paginatedData = [];

    for (let i = 0; i < quotations.length; i += ROWS_PER_PAGE) {
      paginatedData.push(quotations.slice(i, i + ROWS_PER_PAGE));
    }

    // =====================================
    // GENERATE PAGES
    // =====================================

    for (let pageIndex = 0; pageIndex < paginatedData.length; pageIndex++) {
      const page = await addTemplatePage();

      const pageWidth = page.getWidth();
      const pageHeight = page.getHeight();

      // =====================================
      // HEADER
      // =====================================

      // =====================================
      // HEADER
      // =====================================

      const TOTAL_QUOTATION_X = 125;
      const TOTAL_QUOTATION_Y = 742.5;

      const dateText =
        startDate && endDate
          ? `${startDate} to ${endDate}`
          : new Date().toLocaleDateString("en-IN");

      page.drawText(dateText, {
        x: 120,
        y: 759,
        size: 10,
        font,
      });

      page.drawText(String(quotations.length), {
        x: TOTAL_QUOTATION_X,
        y: TOTAL_QUOTATION_Y,
        size: 12,
        font: boldFont,
      });
      // =====================================
      // COLUMN POSITIONS
      // =====================================

      const COLS = {
        sno: 30,
        quotationNo: 70,
        date: 200,
        client: 278,
        createdBy: 400,
        amount: 500,
      };

      // =====================================
      // TABLE START POSITION
      // =====================================

      const TABLE_START_Y = 680; // Move table upwards
      let y = TABLE_START_Y;

      // =====================================
      // ROWS
      // =====================================

      paginatedData[pageIndex].forEach((q, rowIndex) => {
        const serialNo = pageIndex * ROWS_PER_PAGE + rowIndex + 1;

        const quotationNo = q.reference_number || q.referenceNumber || "-";

        const quotationDate = q.quotation_date
          ? new Date(q.quotation_date).toLocaleDateString("en-IN")
          : "-";

        const clientName = q.customerName || "-";
        const createdBy = q.createdByName || "-";

        const amount = Number(
          q.finalAmount || q.totalAmount || q.amount || 0,
        ).toLocaleString("en-IN");

        // =========================
        // COLUMN WIDTHS
        // =========================

        const COL_WIDTHS = {
          quotationNo: 110,
          client: 110,
          createdBy: 80,
        };

        // =========================
        // WRAP TEXT
        // =========================

        const quotationNoLines = wrapText(
          quotationNo,
          COL_WIDTHS.quotationNo,
          font,
          FONT_SIZE,
        );

        const clientLines = wrapText(
          clientName,
          COL_WIDTHS.client,
          font,
          FONT_SIZE,
        );

        const createdByLines = wrapText(
          createdBy,
          COL_WIDTHS.createdBy,
          font,
          FONT_SIZE,
        );

        const maxLines = Math.max(
          quotationNoLines.length,
          clientLines.length,
          createdByLines.length,
        );

        const lineHeight = 12;

        // =========================
        // SERIAL NO
        // =========================

        page.drawText(String(serialNo), {
          x: COLS.sno,
          y,
          size: FONT_SIZE,
          font,
        });

        // =========================
        // DATE
        // =========================

        page.drawText(quotationDate, {
          x: COLS.date,
          y,
          size: FONT_SIZE,
          font,
        });

        // =========================
        // AMOUNT
        // =========================

        page.drawText(amount, {
          x: COLS.amount,
          y,
          size: FONT_SIZE,
          font,
        });

        // =========================
        // QUOTATION NO
        // =========================

        quotationNoLines.forEach((line, index) => {
          page.drawText(line, {
            x: COLS.quotationNo,
            y: y - index * lineHeight,
            size: FONT_SIZE,
            font,
          });
        });

        // =========================
        // CLIENT NAME
        // =========================

        clientLines.forEach((line, index) => {
          page.drawText(line, {
            x: COLS.client,
            y: y - index * lineHeight,
            size: FONT_SIZE,
            font,
          });
        });

        // =========================
        // CREATED BY
        // =========================

        createdByLines.forEach((line, index) => {
          page.drawText(line, {
            x: COLS.createdBy,
            y: y - index * lineHeight,
            size: FONT_SIZE,
            font,
          });
        });

        // =========================
        // DYNAMIC ROW HEIGHT
        // =========================

        const dynamicHeight = Math.max(ROW_HEIGHT, maxLines * lineHeight + 8);

        y -= dynamicHeight;
      });

      // =====================================
      // FOOTER
      // =====================================

      page.drawText(`${pageIndex + 1} / ${paginatedData.length}`, {
        x: pageWidth - 110,
        y: 25,
        size: 10,
        font,
      });
    }

    // =====================================
    // SAVE PDF
    // =====================================

    const pdfBytes = await pdfDoc.save();

    const blob = new Blob([pdfBytes], {
      type: "application/pdf",
    });

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;
    link.download = `Quotation_Report_${Date.now()}.pdf`;

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Quotation Report Generation Error:", error);
  }
};
