// ---------------------------------------------------------------
// exportHelpers.js – PDF (fixed) + EXCEL (exact PDF layout)
// ---------------------------------------------------------------
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import ExcelJS from "exceljs";
import { PDFDocument } from "pdf-lib";
import { toast } from "sonner";
import termsAndConditionsPdf from "../../../assets/Terms.pdf";
import { fetchImg, placeholder } from "./imageHelpers";
import { calcTotals, amountInWords } from "./calcHelpers";

/* ------------------------------------------------------------------ */
/*                              PDF EXPORT                            */
/* ------------------------------------------------------------------ */
/* ------------------------------------------------------------------ */
/*                              PDF EXPORT (JS)                       */
/* ------------------------------------------------------------------ */
export const exportToPDF = async (ref, id, activeVersion) => {
  if (!ref.current) throw new Error("Content missing");

  const clone = ref.current.cloneNode(true);
  document.body.appendChild(clone);

  /* ---- force printable area --------------------------------------- */
  clone.style.cssText = `
    position: absolute !important;
    left: -9999px !important;
    top: 0 !important;
    visibility: visible !important;
    width: ${ref.current.scrollWidth}px !important;
    overflow: visible !important;
  `;

  /* ---- print styles ------------------------------------------------ */
  const style = document.createElement("style");
  style.textContent = `
    * { font-family: Arial, sans-serif !important; }
    table { table-layout: fixed; width: 100%; border-collapse: collapse; }
    td, th { border: 1px solid #ddd; padding: 5px; font-size: 11px; word-wrap: break-word; }
    img { max-width: 60px; height: auto; }
    .product-img { height: 50px; width: auto; }
  `;
  clone.appendChild(style);

  /* ---- PRE-LOAD & REPLACE ALL IMAGES ------------------------------ */
  const logoImgEl = clone.querySelector(".logo-img");
  const productImgEls = clone.querySelectorAll(".product-img");

  const toDataUrl = async (src) => {
    if (src.startsWith("data:")) return src; // already data-URL
    const { buffer, extension } = await fetchImg(src);
    const base64 = btoa(String.fromCharCode(...buffer));
    return `data:image/${extension};base64,${base64}`;
  };

  const imgPromises = [];

  if (logoImgEl && logoImgEl.src) {
    imgPromises.push(
      toDataUrl(logoImgEl.src).then((url) => {
        logoImgEl.src = url;
      })
    );
  }

  productImgEls.forEach((el) => {
    if (el.src) {
      imgPromises.push(
        toDataUrl(el.src).then((url) => {
          el.src = url;
        })
      );
    }
  });

  await Promise.all(imgPromises);

  /* give the DOM a tiny tick to repaint the new src values */
  await new Promise((resolve) => {
    requestAnimationFrame(() => setTimeout(resolve, 50));
  });

  /* ---- render canvas ------------------------------------------------ */
  let canvas;
  try {
    canvas = await html2canvas(clone, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: "#ffffff",
      logging: false,
      width: clone.scrollWidth,
      height: clone.scrollHeight,
      windowWidth: clone.scrollWidth,
      windowHeight: clone.scrollHeight,
    });
  } finally {
    document.body.removeChild(clone);
  }

  /* ---- generate PDF (unchanged) ------------------------------------ */
  const imgData = canvas.toDataURL("image/png");
  const pdf = new jsPDF("p", "mm", "a4");
  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = pdf.internal.pageSize.getHeight();
  const margin = 10;
  const availableWidth = pdfWidth - 2 * margin;

  const imgHeight = (canvas.height * availableWidth) / canvas.width;
  let heightLeft = imgHeight;
  let position = margin;

  pdf.addImage(imgData, "PNG", margin, position, availableWidth, imgHeight);
  heightLeft -= pdfHeight - margin * 2;

  while (heightLeft > 0) {
    position = heightLeft - imgHeight + margin;
    pdf.addPage();
    pdf.addImage(imgData, "PNG", margin, position, availableWidth, imgHeight);
    heightLeft -= pdfHeight - margin * 2;
  }

  /* ---- attach T&C (optional) -------------------------------------- */
  try {
    const tncRes = await fetch(termsAndConditionsPdf);
    const tncBuffer = await tncRes.arrayBuffer();
    const tncDoc = await PDFDocument.load(tncBuffer);
    const mainDoc = await PDFDocument.load(await pdf.output("arraybuffer"));
    const pages = await mainDoc.copyPages(tncDoc, tncDoc.getPageIndices());
    pages.forEach((p) => mainDoc.addPage(p));
    const bytes = await mainDoc.save();
    downloadBlob(bytes, `Quotation_${id}_Version_${activeVersion}.pdf`);
  } catch (err) {
    pdf.save(`Quotation_${id}_Version_${activeVersion}.pdf`);
  }
};

const downloadBlob = (bytes, filename) => {
  const blob = new Blob([bytes], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

/* ------------------------------------------------------------------ */
/*                              EXCEL EXPORT                           */
/* ------------------------------------------------------------------ */
export const exportToExcel = async (
  products,
  productsData,
  brandNames,
  quotation,
  address,
  logo,
  accountDetails,
  id,
  activeVersion
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
    console.warn("product parse error", e);
    productList = [];
  }

  /* ---------- 2. Build rows ---------- */
  const rows = productList.map((p, i) => {
    const pd = productsData.find((x) => x.productId === p.productId) || {};
    const img = pd.images ? JSON.parse(pd.images)[0] : null;
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
    r.img ? fetchImg(r.img) : Promise.resolve(placeholder)
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

  /* ---------- 6. LOGO (no squashing) ---------- */
  if (logoImg?.buffer) {
    const logoId = wb.addImage({
      buffer: logoImg.buffer,
      extension: logoImg.extension,
    });
    ws.addImage(logoId, {
      tl: { col: 3, row: 0 },
      ext: { width: 140, height: 70 },
    });
    ws.getRow(1).height = 80;
  }

  /* ---------- 7. Title + Brand ---------- */
  ws.mergeCells("B2:E2");
  const titleCell = ws.getCell("B2");
  titleCell.value = "Estimate / Quotation";
  titleCell.font = { bold: true, size: 16 };
  titleCell.alignment = { horizontal: "center", vertical: "middle" };

  ws.mergeCells("F2:I2");
  const brandCell = ws.getCell("F2");
  brandCell.value = brandNames || "GROHE / AMERICAN STANDARD";
  brandCell.font = { bold: true };
  brandCell.alignment = { horizontal: "right" };

  /* ---------- 8. Customer block ---------- */
  ws.mergeCells("B4:E5");
  ws.getCell("B4").value = quotation?.customerName || "‑";

  ws.mergeCells("G4:I5");
  const dateStr = quotation?.quotation_date
    ? new Date(quotation.quotation_date).toLocaleDateString()
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
      "", // image placeholder
      r.name,
      r.code,
      r.mrp,
      r.discount,
      r.rate,
      r.qty,
      r.total,
    ]);
    row.height = 60;

    const img = prodImgs[i];
    if (img?.buffer) {
      const imgId = wb.addImage({
        buffer: img.buffer,
        extension: img.extension,
      });
      ws.addImage(imgId, {
        tl: { col: 1, row: ws.rowCount - 1 },
        ext: { width: 50, height: 50 },
      });
    }

    row.eachCell((c, n) => {
      if (n === 1) return; // image column
      c.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
      c.alignment = { vertical: "middle" };
    });
  });

  /* ---------- 11. Amount in words ---------- */
  const {
    subtotal,
    gst: gstAmount,
    total: finalTotal,
  } = calcTotals(
    productList,
    quotation?.gst_value ?? 0,
    quotation?.include_gst ?? false
  );

  ws.addRow([]);
  ws.mergeCells(`A${ws.rowCount}:I${ws.rowCount}`);
  ws.getCell(
    `A${ws.rowCount}`
  ).value = `Amount Chargeable (in words): ${amountInWords(finalTotal)}`;
  ws.getCell(`A${ws.rowCount}`).font = { bold: true };

  /* ---------- 12. Tax summary ---------- */
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
    gstAmount
  )}`;
  ws.getCell(`A${ws.rowCount}`).font = { bold: true };

  /* ---------- 13. Bank & Declaration ---------- */
  const bank = accountDetails || {};
  ws.addRow([]);
  ws.mergeCells(`A${ws.rowCount}:D${ws.rowCount}`);
  const bankCell = ws.getCell(`A${ws.rowCount}`);
  bankCell.value = `Company's Bank Details\nA/c Holder: EMBARK ENTERPRISES\nBank: IDFC FIRST BANK\nA/c No: 10179373657\nBranch & IFS: BHERA ENCLAVE PASCHIM VIHAR & IDFB0020149`;
  bankCell.alignment = { vertical: "top" };

  ws.mergeCells(`E${ws.rowCount}:I${ws.rowCount}`);
  const declCell = ws.getCell(`E${ws.rowCount}`);
  declCell.value = `PAN: AALFE0496K\nDeclaration: We declare that this quotation shows the actual price...`;
  declCell.alignment = { horizontal: "right", vertical: "top" };

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

  /* ---------- 14. Save ---------- */
  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Quotation_${id}_Version_${activeVersion}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
};
