import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import ExcelJS from "exceljs";
import { PDFDocument } from "pdf-lib";
import termsAndConditionsPdf from "../../../assets/Terms.pdf";
import { fetchImg, placeholder } from "./imageHelpers";
import { calcTotals, amountInWords } from "./calcHelpers";
import { message } from "antd";
/* ------------------------------------------------------------------ */
/*                          UTILITY: Safe Filename Title              */
/* ------------------------------------------------------------------ */
const getSafeTitle = (quotation = {}) => {
  const rawTitle =
    quotation.quotation_title ||
    quotation.title ||
    quotation.document_title ||
    quotation.reference_number ||
    "Quotation";

  if (!rawTitle || typeof rawTitle !== "string") return "Quotation";

  return rawTitle
    .trim()
    .replace(/[\\/:*?"<>|]/g, "_")
    .replace(/\s+/g, "_")
    .replace(/_+/g, "_")
    .substring(0, 50)
    .replace(/^_+|_+$/g, "");
};

// ------------------------------------------------------------
// exportToPDF – FINAL WORKING VERSION (Multi-page, No Skipped Pages)
// ------------------------------------------------------------

// hooks/exportHelpers.js — FINAL BULLETPROOF PDF EXPORT
// hooks/exportHelpers.js — FINAL FIXED VERSION (2025 Chrome/Firefox safe)
// hooks/exportHelpers.js — FINAL 100% WORKING PDF EXPORT (Nov 2025)
// hooks/exportHelpers.js — FINAL NOV 2025 WORKING VERSION
export const exportToPDF = async (
  ref,
  id,
  activeVersion,
  quotation = {},
  filename = "quotation.pdf",
) => {
  if (!ref?.current) {
    console.error("Ref is null");
    return;
  }

  // METHOD 1: Try .print-area
  let printArea = ref.current.querySelector(".print-area");

  // METHOD 2: Try data attribute (fallback)
  if (!printArea) {
    printArea = ref.current.querySelector("[data-print-root]");
  }

  // METHOD 3: If ref itself has the class, use it directly
  if (!printArea && ref.current.classList.contains("print-area")) {
    printArea = ref.current;
  }

  // METHOD 4: Last resort – use ref.current directly
  if (!printArea) {
    console.warn("No .print-area found → falling back to ref.current");
    printArea = ref.current;
  }

  if (!printArea) {
    console.error("No printable area found at all");
    message.error("Print area not found");
    return;
  }

  const nodeToPrint = printArea.cloneNode(true);
  // ... rest of your function stays 100% the same

  // FORCE ALL IMAGES TO HAVE crossOrigin AND BE LOADED
  const images = nodeToPrint.querySelectorAll("img");
  const imageLoadPromises = Array.from(images).map((img) => {
    if (img.src && !img.crossOrigin && img.src.startsWith("http")) {
      img.crossOrigin = "anonymous";
    }
    if (img.complete && img.naturalHeight !== 0) {
      return Promise.resolve();
    }
    return new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = () => {
        console.warn("Image failed to load:", img.src);
        resolve(); // continue anyway
      };
      // Force reload to apply crossOrigin
      if (img.src) img.src = img.src;
    });
  });

  // Wait for all images
  await Promise.all(imageLoadPromises);

  // Temporarily inject cloned node into DOM (hidden) for accurate rendering
  const container = document.createElement("div");
  container.style.position = "absolute";
  container.style.left = "-9999px";
  container.style.top = "0";
  container.style.width = "210mm"; // A4 width
  container.style.background = "white";
  Object.assign(nodeToPrint.style, {
    width: "210mm",
    minHeight: "297mm",
    pageBreakAfter: "always",
    background: "white",
    boxShadow: "none",
    transform: "none",
  });
  container.appendChild(nodeToPrint);
  document.body.appendChild(container);

  try {
    const pages = nodeToPrint.querySelectorAll(".page");
    if (pages.length === 0) throw new Error("No .page elements");

    const pdf = new jsPDF("p", "mm", "a4");
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];

      // Force page size
      page.style.width = "210mm";
      page.style.minHeight = "297mm";
      page.style.background = "white";

      const canvas = await html2canvas(page, {
        scale: 2,
        useCORS: true,
        allowTaint: false, // we handled CORS manually
        backgroundColor: "#ffffff",
        logging: false,
        windowWidth: 210 * 3.78, // ~A4 in pixels at 96dpi
        windowHeight: 297 * 3.78,
        scrollX: 0,
        scrollY: 0,
      });

      const imgData = canvas.toDataURL("image/jpeg", 0.95);

      if (i > 0) pdf.addPage();
      pdf.addImage(
        imgData,
        "JPEG",
        0,
        0,
        pdfWidth,
        pdfHeight,
        undefined,
        "FAST",
      );
    }

    // === Attach T&C (optional) ===
    let finalPdfBytes = pdf.output("arraybuffer");
    try {
      const tncRes = await fetch(termsAndConditionsPdf);
      if (tncRes.ok) {
        const tncBuffer = await tncRes.arrayBuffer();
        const mainPdf = await PDFDocument.load(finalPdfBytes);
        const tncPdf = await PDFDocument.load(tncBuffer);
        const copied = await mainPdf.copyPages(tncPdf, tncPdf.getPageIndices());
        copied.forEach((p) => mainPdf.addPage(p));
        finalPdfBytes = await mainPdf.save();
      }
    } catch (e) {
      console.warn("T&C attachment failed (continuing without):", e.message);
    }

    // === Download ===
    const blob = new Blob([finalPdfBytes], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);

    message.success("PDF exported successfully!");
  } catch (err) {
    console.error("PDF Export failed:", err);
    message.error("PDF export failed: " + err.message);
  } finally {
    document.body.removeChild(container);
  }
};
const downloadBlob = (data, name) => {
  const blob = new Blob([data], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

/* ------------------------------------------------------------------ */
/*                              EXCEL EXPORT                          */
/* ------------------------------------------------------------------ */
export const exportToExcel = async (
  products,
  productsData,
  brandNames,
  customerName,
  quotation = {}, // Now used for title
  address,
  logo,
  accountDetails,
  id,
  activeVersion,
  allBrands = [],
) => {
  /* ---------- 1. Normalise product list ---------- */
  let productList = [];
  try {
    productList = Array.isArray(products)
      ? products
      : typeof products === "string"
        ? JSON.parse(products)
        : [];
  } catch (e) {
    productList = [];
  }

  /* ---------- 2. Build rows ---------- */
  const rows = productList.map((p, i) => {
    const pd = productsData.find((x) => x.productId === p.productId) || {};
    let img = null;
    try {
      if (pd.images) {
        // Case 1: Already parsed array
        if (Array.isArray(pd.images)) {
          img = pd.images[0];
        }
        // Case 2: JSON string like '["url"]'
        else if (
          typeof pd.images === "string" &&
          pd.images.trim().startsWith("[")
        ) {
          const parsed = JSON.parse(pd.images);
          img = Array.isArray(parsed) ? parsed[0] : null;
        }
        // Case 3: Direct URL string (most common now)
        else if (
          typeof pd.images === "string" &&
          pd.images.trim().startsWith("http")
        ) {
          img = pd.images.trim();
        }
      }
    } catch (e) {
      console.warn("Failed to parse product image:", pd.images, e);
      img = null;
    }
    const code =
      pd?.meta?.d11da9f9_3f2e_4536_8236_9671200cca4a || p.productCode || "N/A";
    const mrp =
      pd.metaDetails?.find((m) => m.title === "sellingPrice")?.value ||
      p.total ||
      0;

    return {
      idx: i + 1,
      img,
      name: p.name || pd.name || "‑",
      code,
      mrp: `₹${Number(mrp).toFixed(2)}`,
      discount:
        p.discount && p.discountType === "percent"
          ? `${p.discount}%`
          : p.discount
            ? `₹${p.discount}`
            : "0",
      rate: `₹${(p.rate || mrp).toFixed(2)}`,
      qty: p.quantity || "1",
      total: `₹${Number(p.total).toFixed(2)}`,
    };
  });

  /* ---------- 3. Load images ---------- */
  const logoImg = logo ? await fetchImg(logo) : placeholder;
  const prodImgPromises = rows.map((r) =>
    r.img ? fetchImg(r.img) : Promise.resolve(placeholder),
  );
  const prodImgs = await Promise.all(prodImgPromises);

  /* ---------- 4. Workbook ---------- */
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Quotation", {
    pageSetup: { paperSize: 9, orientation: "portrait", fitToPage: true },
    properties: { defaultRowHeight: 20 },
  });

  /* ---------- 5. Column widths ---------- */
  ws.columns = [
    { width: 6 }, // S.No
    { width: 12 }, // Image
    { width: 35 }, // Product
    { width: 14 }, // Code
    { width: 12 }, // MRP
    { width: 12 }, // Discount
    { width: 12 }, // Rate
    { width: 8 }, // Unit
    { width: 14 }, // Total
  ];

  /* ---------- 6. LOGO ---------- */
  if (logoImg?.buffer) {
    const logoId = wb.addImage({
      buffer: logoImg.buffer,
      extension: logoImg.extension || "png",
    });
    ws.addImage(logoId, {
      tl: { col: 3, row: 0 },
      ext: { width: 140, height: 70 },
    });
    ws.getRow(1).height = 80;
  }

  /* ---------- 7. Title + Brand ---------- */
  ws.mergeCells("B2:E2");
  ws.getCell("B2").value = "Estimate / Quotation";
  ws.getCell("B2").font = { bold: true, size: 16 };
  ws.getCell("B2").alignment = { horizontal: "center", vertical: "middle" };

  ws.mergeCells("F2:I2");
  ws.getCell("F2").value = brandNames || "";
  ws.getCell("F2").font = { bold: true };
  ws.getCell("F2").alignment = { horizontal: "right" };

  /* ---------- 8. Customer block ---------- */
  ws.mergeCells("B4:E5");
  ws.getCell("B4").value = customerName || "Dear Client";

  ws.mergeCells("G4:I5");
  const dateStr = quotation?.quotation_date
    ? new Date(quotation.quotation_date).toLocaleDateString("en-IN")
    : "‑";
  ws.getCell("G4").value = dateStr;

  ws.mergeCells("B6:I7");
  ws.getCell("B6").value = address || "N/A";

  /* ---------- 9. Product table header ---------- */
  const header = ws.addRow([
    "S.No",
    "Image",
    "Product Name",
    "Code",
    "MRP",
    "Discount",
    "Rate",
    "Unit",
    "Total",
  ]);
  header.font = { bold: true };
  header.eachCell((c) => {
    c.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFD9D9D9" },
    };
    c.border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    };
    c.alignment = { vertical: "middle", horizontal: "center" };
  });
  ws.getRow(ws.rowCount).height = 30;

  /* ---------- 10. Product rows ---------- */
  rows.forEach((r, i) => {
    const row = ws.addRow([
      r.idx,
      "",
      r.name,
      r.code,
      r.mrp,
      r.discount,
      r.rate,
      r.qty,
      r.total,
    ]);
    row.height = 60;
    const imgData = prodImgs[i];

    if (imgData === placeholder) {
      console.log(
        `Using placeholder for product ${r.idx}: ${r.img || "(no url)"}`,
      );
    } else if (imgData?.buffer?.byteLength > 0) {
      console.log(
        `Product ${r.idx} image:`,
        `url = ${r.img}`,
        `type = ${imgData.extension}`,
        `size = ${imgData.buffer.byteLength} bytes`,
      );
    } else {
      console.log(`Invalid image data for product ${r.idx}:`, imgData);
    }
    const img = "https://picsum.photos/200/200"; // force one good image
    if (img?.buffer) {
      const imgId = wb.addImage({
        buffer: img.buffer,
        extension: img.extension || "png",
      });
      ws.addImage(imgId, {
        tl: { col: 1, row: ws.rowCount - 1 },
        ext: { width: 50, height: 50 },
      });
    }

    row.eachCell((c, n) => {
      if (n === 2) return; // skip image column
      c.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
      c.alignment = { vertical: "middle" };
    });
  });

  /* ---------- 11–13. Totals, Tax Summary, Bank Details (unchanged) ---------- */
  const {
    subtotal,
    gst: gstAmount,
    total: finalTotal,
  } = calcTotals(
    productList,
    quotation?.gst_value ?? 0,
    quotation?.include_gst ?? false,
  );

  ws.addRow([]);
  ws.mergeCells(`A${ws.rowCount}:I${ws.rowCount}`);
  ws.getCell(`A${ws.rowCount}`).value =
    `Amount Chargeable (in words): ${amountInWords(finalTotal)}`;
  ws.getCell(`A${ws.rowCount}`).font = { bold: true };

  // Tax summary logic (same as before)
  const taxHeader = ws.addRow([
    "HSN/SAC",
    "Taxable Value",
    "CGST",
    "CGST Amt",
    "SGST",
    "SGST Amt",
    "Total",
  ]);
  taxHeader.font = { bold: true };
  taxHeader.eachCell((c) => {
    c.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFD9D9D9" },
    };
    c.border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    };
  });

  const taxMap = new Map();
  productList.forEach((p) => {
    const pd = productsData.find((x) => x.productId === p.productId) || {};
    const hsn = pd.hsnSac || "N/A";
    const taxable = Number(p.total || 0);
    const rate = quotation?.gst_value || 0;
    const cgst = (taxable * rate) / 200;
    if (!taxMap.has(hsn)) taxMap.set(hsn, { taxable: 0, cgst: 0 });
    const e = taxMap.get(hsn);
    e.taxable += taxable;
    e.cgst += cgst;
  });

  Array.from(taxMap).forEach(([hsn, { taxable, cgst }]) => {
    ws.addRow([
      hsn,
      `₹${taxable.toFixed(2)}`,
      `${(quotation?.gst_value / 2 || 0).toFixed(1)}%`,
      `₹${cgst.toFixed(2)}`,
      `${(quotation?.gst_value / 2 || 0).toFixed(1)}%`,
      `₹${cgst.toFixed(2)}`,
      `₹${(taxable + cgst * 2).toFixed(2)}`,
    ]);
  });

  const totalTaxRow = ws.addRow([
    "Total",
    `₹${subtotal.toFixed(2)}`,
    "",
    `₹${(gstAmount / 2).toFixed(2)}`,
    "",
    `₹${(gstAmount / 2).toFixed(2)}`,
    `₹${finalTotal.toFixed(2)}`,
  ]);
  totalTaxRow.eachCell((c) => (c.font = { bold: true }));

  ws.addRow([]);
  ws.mergeCells(`A${ws.rowCount}:G${ws.rowCount}`);
  ws.getCell(`A${ws.rowCount}`).value = `Tax Amount (in words): ${amountInWords(
    gstAmount,
  )}`;
  ws.getCell(`A${ws.rowCount}`).font = { bold: true };

  const bank = accountDetails || {};
  ws.addRow([]);
  ws.mergeCells(`A${ws.rowCount}:D${ws.rowCount}`);
  ws.getCell(`A${ws.rowCount}`).value =
    `Company's Bank Details\nA/c Holder: EMBARK ENTERPRISES\nBank: IDFC FIRST BANK\nA/c No: 10179373657\nBranch & IFS: BHERA ENCLAVE PASCHIM VIHAR & IDFB0020149`;
  ws.getCell(`A${ws.rowCount}`).alignment = { vertical: "top" };

  ws.mergeCells(`E${ws.rowCount}:I${ws.rowCount}`);
  ws.getCell(`E${ws.rowCount}`).value =
    `PAN: AALFE0496K\nDeclaration: We declare that this quotation shows the actual price...`;
  ws.getCell(`E${ws.rowCount}`).alignment = {
    horizontal: "right",
    vertical: "top",
  };

  ws.addRow([]);
  ws.mergeCells(`A${ws.rowCount}:I${ws.rowCount}`);
  ws.getCell(`A${ws.rowCount}`).value =
    "for EMBARK ENTERPRISES\n\n\nAuthorised Signatory";
  ws.getCell(`A${ws.rowCount}`).alignment = {
    horizontal: "right",
    vertical: "bottom",
  };

  ws.addRow([]);
  ws.mergeCells(`A${ws.rowCount}:I${ws.rowCount}`);
  ws.getCell(`A${ws.rowCount}`).value =
    "Terms & Conditions: Refer attached document.";
  ws.getCell(`A${ws.rowCount}`).font = { bold: true };

  /* ---------- 14. SAVE WITH CUSTOM FILENAME ---------- */
  // Inside exportToExcel, near the end:
  const safeVersion = activeVersion === "current" ? "Latest" : activeVersion;
  const safeTitle = getSafeTitle(quotation);
  const titlePart = safeTitle ? `${safeTitle}_` : "";
  const excelFilename = `${titlePart}_V${safeVersion}.xlsx`;
  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = excelFilename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
