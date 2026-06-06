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

// 🔥 SMART 2-LINE NAME SPLITTER (YOUR REQUIREMENT)
const splitNameSmart = (text, maxCharsPerLine = 20) => {
  if (!text) return ["-"];

  const str = String(text);

  if (str.length <= maxCharsPerLine) {
    return [str];
  }

  const firstLine = str.slice(0, maxCharsPerLine);
  let secondPart = str.slice(maxCharsPerLine);

  // If second line too long → truncate with ...
  if (secondPart.length > 20) {
    secondPart = secondPart.slice(0, 20) + "...";
  }

  return [firstLine, secondPart];
};

const getMetaValue = (metaDetails, slug) => {
  return metaDetails?.find((m) => m.slug === slug)?.value ?? "-";
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
    const FONT_SIZE = 9;
    const LINE_HEIGHT = 11;

    // 🔥 FILTER LOW STOCK
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

      let y = 670;

      pages[p].forEach((item, i) => {
        const sno = p * ROWS_PER_PAGE + i + 1;

        const name = sanitizePDFText(item.name);

        const companyCode = sanitizePDFText(
          getMetaValue(item.metaDetails, "companyCode"),
        );

        const sellingPrice = sanitizePDFText(
          getMetaValue(item.metaDetails, "sellingPrice"),
        );

        const stock = item.quantity ?? 0;

        // =====================
        // 🔥 NAME (2 LINE SMART SPLIT)
        // =====================
        const nameLines = splitNameSmart(name, 20);

        nameLines.forEach((line, idx) => {
          page.drawText(line, {
            x: COLS.name,
            y: y - idx * LINE_HEIGHT,
            font,
            size: FONT_SIZE,
          });
        });

        // =====================
        // SNO
        // =====================
        page.drawText(String(sno), {
          x: COLS.sno,
          y,
          font,
          size: FONT_SIZE,
        });

        // =====================
        // COMPANY CODE
        // =====================
        page.drawText(companyCode, {
          x: COLS.companyCode,
          y,
          font,
          size: FONT_SIZE,
        });

        // =====================
        // PRICE
        // =====================
        page.drawText(String(sellingPrice), {
          x: COLS.price,
          y,
          font,
          size: FONT_SIZE,
        });

        // =====================
        // STOCK
        // =====================
        page.drawText(String(stock), {
          x: COLS.stock,
          y,
          font,
          size: FONT_SIZE,
        });

        // 🔥 FIXED ROW GAP (because max 2 lines only)
        y -= 30;
      });

      // footer page number
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
