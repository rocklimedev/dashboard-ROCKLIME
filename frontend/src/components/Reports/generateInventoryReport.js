import { PDFDocument, StandardFonts } from "pdf-lib";
import inventoryTemplate from "../../assets/pdf/stock_report.pdf";

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

// format date safely
const formatDate = (date) => {
  if (!date) return "-";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "-";
  return d.toISOString().split("T")[0];
};

// 🔥 WRAP TEXT (kept for name/code)
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
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  }

  if (currentLine) lines.push(currentLine);

  return lines;
};

// 🔥 LIMIT NAME TO 2 LINES + ELLIPSIS
const wrapTextWithLimit = (text, maxWidth, font, fontSize, maxLines = 2) => {
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
      if (currentLine) lines.push(currentLine);
      currentLine = word;

      if (lines.length === maxLines - 1) break;
    }
  }

  if (lines.length < maxLines) {
    if (currentLine) lines.push(currentLine);
  }

  if (lines.length === maxLines) {
    let last = lines[maxLines - 1];
    const ellipsis = "...";

    while (
      font.widthOfTextAtSize(last + ellipsis, fontSize) > maxWidth &&
      last.length > 0
    ) {
      last = last.slice(0, -1);
    }

    lines[maxLines - 1] = last.trimEnd() + ellipsis;
  }

  return lines.slice(0, maxLines);
};

export const generateInventoryReportPDF = async (products) => {
  try {
    const templateBytes = await fetch(inventoryTemplate).then((res) =>
      res.arrayBuffer(),
    );

    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const generatedOn = new Date().toLocaleString("en-IN");
    const totalProducts = products.length;
    const ROWS_PER_PAGE = 20;
    const FONT_SIZE = 10;
    const ROW_HEIGHT = 33; // 🔥 FIXED ROW SPACING LIKE ORDER REPORT

    const pages = [];

    // paginate
    for (let i = 0; i < products.length; i += ROWS_PER_PAGE) {
      pages.push(products.slice(i, i + ROWS_PER_PAGE));
    }

    for (let p = 0; p < pages.length; p++) {
      const page = await addTemplatePage(pdfDoc, templateBytes);
      page.drawText(`${generatedOn}`, {
        x: 120,
        y: 759,
        font,
        size: 10,
      });
      page.drawText(`${totalProducts}`, {
        x: 180,
        y: 742.5,
        font,
        size: 10,
      });
      const COLS = {
        sno: 37,
        name: 70,
        code: 200,
        price: 300,
        stock: 380,
        status: 450,
        updatedAt: 520,
      };

      const WRAP_WIDTH = {
        name: 120,
        code: 90,
      };

      let y = 690;

      pages[p].forEach((item, i) => {
        const sno = p * ROWS_PER_PAGE + i + 1;

        const name = sanitizePDFText(item.name);

        const code = sanitizePDFText(
          item.metaDetails?.find((d) => d.value?.match(/^[A-Za-z0-9]{6,12}$/))
            ?.value,
        );
        const getMeta = (item, slug, fallback = "-") =>
          item.metaDetails?.find((m) => m.slug === slug)?.value ?? fallback;
        const price = sanitizePDFText(getMeta(item, "sellingPrice", 0));
        const stock = item.quantity ?? 0;

        const statusRaw = stock === 0 ? "OUT" : stock <= 20 ? "LOW" : "OK";
        const status = sanitizePDFText(statusRaw);

        const updatedAt = sanitizePDFText(formatDate(item.updatedAt));

        // NAME (2 lines max with ellipsis)
        const nameLines = wrapTextWithLimit(
          name,
          WRAP_WIDTH.name,
          font,
          FONT_SIZE,
          2,
        );

        const codeLines = wrapText(code, WRAP_WIDTH.code, font, FONT_SIZE);

        // =====================
        // SIMPLE COLUMNS
        // =====================
        page.drawText(String(sno), { x: COLS.sno, y, font, size: FONT_SIZE });

        page.drawText(String(price), {
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

        page.drawText(status, {
          x: COLS.status,
          y,
          font,
          size: FONT_SIZE,
        });

        page.drawText(updatedAt, {
          x: COLS.updatedAt,
          y,
          font,
          size: FONT_SIZE,
        });

        // =====================
        // NAME
        // =====================
        nameLines.forEach((line, idx) => {
          page.drawText(line, {
            x: COLS.name,
            y: y - idx * 11,
            font,
            size: FONT_SIZE,
          });
        });

        // =====================
        // CODE
        // =====================
        codeLines.forEach((line, idx) => {
          page.drawText(line, {
            x: COLS.code,
            y: y - idx * 11,
            font,
            size: FONT_SIZE,
          });
        });

        // 🔥 FIXED SPACING LIKE ORDER REPORT
        y -= ROW_HEIGHT;
      });

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
    link.download = `Inventory_Report_${Date.now()}.pdf`;
    link.click();

    URL.revokeObjectURL(url);
  } catch (err) {
    console.error("Inventory Report Error:", err);
  }
};
