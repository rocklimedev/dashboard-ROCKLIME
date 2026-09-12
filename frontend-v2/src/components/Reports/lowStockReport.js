import { PDFDocument, StandardFonts } from "pdf-lib";
import lowStockTemplate from "../../assets/pdf/low_stock_report.pdf";

const addTemplatePage = async (pdfDoc, templateBytes) => {
  const templateDoc = await PDFDocument.load(templateBytes);
  const [templatePage] = await pdfDoc.copyPages(templateDoc, [0]);
  pdfDoc.addPage(templatePage);
  return pdfDoc.getPages()[pdfDoc.getPageCount() - 1];
};

// 🔥 SAFE TEXT CLEANER
const sanitizePDFText = (text) => {
  if (text === null || text === undefined) return "-";
  return String(text)
    .replace(/[\u0000-\u001F\u007F]/g, "")
    .replace(/\s+/g, " ")
    .trim();
};

// 🔥 BASIC WRAP TEXT
const wrapText = (text, maxWidth, font, fontSize) => {
  if (!text || text === "-") return ["-"];

  const words = String(text).split(" ");
  const lines = [];
  let currentLine = "";

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const width = font.widthOfTextAtSize(testLine, fontSize);

    if (width <= maxWidth) {
      currentLine = testLine;
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  }

  if (currentLine) lines.push(currentLine);
  return lines;
};

// 🔥 WRAP TEXT WITH LINE LIMIT + ELLIPSIS (Best Version)
const wrapTextWithLimit = (text, maxWidth, font, fontSize, maxLines = 2) => {
  if (!text || text === "-") return ["-"];

  const words = String(text).split(" ");
  const lines = [];
  let currentLine = "";

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const width = font.widthOfTextAtSize(testLine, fontSize);

    if (width <= maxWidth) {
      currentLine = testLine;
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;

      if (lines.length === maxLines - 1) break;
    }
  }

  if (lines.length < maxLines && currentLine) {
    lines.push(currentLine);
  }

  // Add ellipsis to last line if needed
  if (lines.length === maxLines) {
    let last = lines[maxLines - 1];
    const ellipsis = "...";

    while (
      font.widthOfTextAtSize(last + ellipsis, fontSize) > maxWidth &&
      last.length > 3
    ) {
      last = last.slice(0, -1);
    }
    lines[maxLines - 1] = last.trimEnd() + ellipsis;
  }

  return lines.slice(0, maxLines);
};
export const generateLowStockReportPDF = async (products) => {
  try {
    const templateBytes = await fetch(lowStockTemplate).then((res) =>
      res.arrayBuffer(),
    );

    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

    const generatedOn = new Date().toLocaleString("en-IN");

    const LOW_STOCK_THRESHOLD = 20;
    const ROWS_PER_PAGE = 20;
    const FONT_SIZE = 10;
    const ROW_HEIGHT = 33;
    const LINE_SPACING = 11;

    const lowStock = (products || []).filter(
      (p) => (p.quantity ?? 0) <= LOW_STOCK_THRESHOLD,
    );

    const pages = [];
    for (let i = 0; i < lowStock.length; i += ROWS_PER_PAGE) {
      pages.push(lowStock.slice(i, i + ROWS_PER_PAGE));
    }

    for (let p = 0; p < pages.length; p++) {
      const page = await addTemplatePage(pdfDoc, templateBytes);

      // Header
      page.drawText(`${generatedOn}`, {
        x: 120,
        y: 759,
        font,
        size: 10,
      });

      const COLS = {
        sno: 30,
        name: 70,
        companyCode: 250,
        price: 430,
        stock: 520,
      };

      const WRAP_WIDTH = {
        name: COLS.companyCode - COLS.name - 15,
        companyCode: COLS.price - COLS.companyCode - 15, // ≈ 165px
      };

      let y = 670;

      pages[p].forEach((item, i) => {
        const sno = p * ROWS_PER_PAGE + i + 1;

        const name = sanitizePDFText(item.name);
        const companyCode = sanitizePDFText(
          item.metaDetails?.find((m) => m.slug === "companyCode")?.value,
        );
        const sellingPrice = sanitizePDFText(
          item.metaDetails?.find((m) => m.slug === "sellingPrice")?.value,
        );
        const stock = item.quantity ?? 0;

        // Wrap both name and companyCode
        const nameLines = wrapTextWithLimit(
          name,
          WRAP_WIDTH.name,
          font,
          FONT_SIZE,
          2,
        );

        const companyCodeLines = wrapTextWithLimit(
          companyCode,
          WRAP_WIDTH.companyCode,
          font,
          FONT_SIZE,
          2,
        );

        // Draw Name (multi-line)
        nameLines.forEach((line, idx) => {
          page.drawText(line, {
            x: COLS.name,
            y: y - idx * LINE_SPACING,
            font,
            size: FONT_SIZE,
          });
        });

        // Draw Company Code (multi-line)
        companyCodeLines.forEach((line, idx) => {
          page.drawText(line, {
            x: COLS.companyCode,
            y: y - idx * LINE_SPACING,
            font,
            size: FONT_SIZE,
          });
        });

        // Draw other single-line columns
        page.drawText(String(sno), {
          x: COLS.sno,
          y,
          font,
          size: FONT_SIZE,
        });

        page.drawText(String(sellingPrice), {
          x: COLS.price,
          y,
          font,
          size: FONT_SIZE,
        });

        page.drawText(String(stock), {
          x: COLS.stock,
          y,
          font,
          size: FONT_SIZE,
        });

        y -= ROW_HEIGHT;
      });

      // Footer - Page Number
      page.drawText(`${p + 1} / ${pages.length}`, {
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
    link.download = `Low_Stock_Report_${Date.now()}.pdf`;
    link.click();

    URL.revokeObjectURL(url);
  } catch (err) {
    console.error("Low Stock Report Error:", err);
  }
};
