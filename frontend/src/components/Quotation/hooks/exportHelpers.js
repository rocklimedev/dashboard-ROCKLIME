import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import ExcelJS from "exceljs";
import { PDFDocument } from "pdf-lib";
import { toast } from "sonner";
import termsAndConditionsPdf from "../../../assets/QUOT-10.pdf";
import { fetchImg, placeholder } from "./imageHelpers";
import { calcTotals, amountInWords } from "./calcHelpers";

// exportHelpers.js

export const exportToPDF = async (ref, id, activeVersion) => {
  if (!ref.current) throw new Error("Content missing");

  const imgs = ref.current.querySelectorAll(".product-img");

  // === STEP 1: Preload images with fallback & error handling ===
  const loadImageAsDataURL = async (src) => {
    // If already data URL, skip
    if (src.startsWith("data:")) return src;

    try {
      const response = await fetch(src, {
        mode: "cors",
        credentials: "omit",
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const blob = await response.blob();
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(blob);
      });
    } catch (err) {
      console.warn(`Failed to load image: ${src}`, err);
      return null; // Return null → use placeholder or skip
    }
  };

  // Process all images
  const imagePromises = Array.from(imgs).map(async (img) => {
    const dataUrl = await loadImageAsDataURL(img.src);
    if (dataUrl) {
      img.src = dataUrl;
    } else {
      // Optional: Replace with placeholder
      img.src =
        "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAiIGhlaWdodD0iNTAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjUwIiBoZWlnaHQ9IjUwIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iMTIiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIiBmaWxsPSIjOTk5Ij5ObyBJbWFnZTwvdGV4dD48L3N2Zz4=";
    }
  });

  try {
    await Promise.all(imagePromises);
  } catch (err) {
    console.error(
      "Some images failed to load, continuing with placeholders...",
      err
    );
    // Don't throw — continue with fallback images
  }

  // Small delay to ensure DOM updates
  await new Promise((r) => setTimeout(r, 300));

  // === STEP 2: Capture canvas ===
  let canvas;
  try {
    canvas = await html2canvas(ref.current, {
      scale: 2,
      useCORS: true, // Still try CORS for html2canvas
      backgroundColor: "#fff",
      logging: false,
      onclone: (clonedDoc) => {
        // Optional: Fix any cloned image issues
        clonedDoc.querySelectorAll(".product-img").forEach((img) => {
          if (!img.src.startsWith("data:")) {
            img.crossOrigin = "anonymous";
          }
        });
      },
    });
  } catch (err) {
    console.error("html2canvas failed", err);
    throw new Error("Failed to render content for PDF");
  }

  const imgData = canvas.toDataURL("image/png");
  const pdf = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = 190;
  const pageHeight = 277;
  const imgWidth = pageWidth;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  let heightLeft = imgHeight;
  let position = 10;

  pdf.addImage(imgData, "PNG", 10, position, imgWidth, imgHeight);
  heightLeft -= pageHeight;

  while (heightLeft >= 0) {
    position = heightLeft - imgHeight + 20;
    pdf.addPage();
    pdf.addImage(imgData, "PNG", 10, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
  }

  // === STEP 3: Attach T&C PDF (with fallback) ===
  try {
    const tncResponse = await fetch(termsAndConditionsPdf);
    if (!tncResponse.ok) throw new Error("T&C fetch failed");

    const tncArrayBuffer = await tncResponse.arrayBuffer();
    const tncDoc = await PDFDocument.load(tncArrayBuffer);
    const copiedPages = await pdf.copyPages(tncDoc, tncDoc.getPageIndices());
    copiedPages.forEach((page) => pdf.addPage(page));
  } catch (err) {
    console.warn("Could not attach T&C PDF", err);
    toast.warning("T&C PDF could not be attached");
  }

  // === STEP 4: Save ===
  pdf.save(`Quotation_${id}_Version_${activeVersion}.pdf`);
};

// exportHelpers.js

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
  // === SAFELY CONVERT products TO ARRAY ===
  let productList = [];
  try {
    if (Array.isArray(products)) {
      productList = products;
    } else if (typeof products === "string") {
      productList = JSON.parse(products);
    } else if (products == null) {
      productList = [];
    }
  } catch (err) {
    console.warn("Failed to parse products, using empty array", err);
    productList = [];
  }

  const rows = productList.map((p, i) => {
    const pd = productsData.find((x) => x.productId === p.productId) || {};
    const img = pd.images ? JSON.parse(pd.images)[0] : null;
    const code = pd?.meta?.d11da9f9_3f2e_4536_8236_9671200cca4a || "N/A";
    const mrp =
      pd.metaDetails?.find((m) => m.title === "sellingPrice")?.value || p.total;

    return {
      idx: i + 1,
      img,
      name: p.name || pd.name || "‑",
      code,
      mrp: `₹${Number(mrp).toFixed(2)}`,
      discount: p.discount
        ? p.discountType === "percent"
          ? `${p.discount}%`
          : `₹${p.discount}`
        : "0",
      rate: p.rate
        ? `₹${Number(p.rate).toFixed(2)}`
        : `₹${Number(mrp).toFixed(2)}`,
      qty: p.quantity || "1",
      total: `₹${Number(p.total).toFixed(2)}`,
    };
  });

  // === SAFELY HANDLE LOGO ===
  let logoImg = placeholder;
  if (logo && typeof logo === "string") {
    if (logo.startsWith("data:")) {
      logoImg = logo;
    } else {
      try {
        logoImg = await fetchImg(logo);
      } catch (err) {
        console.warn("Failed to fetch logo", err);
        logoImg = placeholder;
      }
    }
  }

  const prodImgs = await Promise.all(
    rows.map((r) => (r.img ? fetchImg(r.img) : placeholder))
  );

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Quotation", {
    properties: { defaultColWidth: 15 },
  });

  ws.columns = [
    { width: 8 },
    { width: 15 },
    { width: 25 },
    { width: 15 },
    { width: 12 },
    { width: 12 },
    { width: 12 },
    { width: 8 },
    { width: 12 },
  ];

  // === ADD LOGO ===
  try {
    const logoId = wb.addImage({
      buffer: logoImg.buffer || logoImg,
      extension: logoImg.extension || "png",
    });
    ws.addImage(logoId, {
      tl: { col: 3, row: 0 },
      ext: { width: 100, height: 50 },
    });
    ws.getRow(1).height = 60;
  } catch (err) {
    console.warn("Failed to add logo", err);
  }

  // title / brand
  ws.mergeCells("B2:E2");
  ws.getCell("B2").value = "Estimate / Quotation";
  ws.getCell("B2").font = { bold: true, size: 16 };
  ws.getCell("B2").alignment = { horizontal: "center" };

  ws.mergeCells("F2:I2");
  ws.getCell("F2").value = brandNames || "GROHE / AMERICAN STANDARD";
  ws.getCell("F2").font = { bold: true };

  // === CUSTOMER NAME (SAFE) ===
  const customerName = quotation?.customerName || "‑";
  ws.mergeCells("B4:E5");
  ws.getCell("B4").value = customerName;

  // === DATE (SAFE) ===
  let dateStr = "‑";
  try {
    if (quotation?.quotation_date) {
      dateStr = new Date(quotation.quotation_date).toLocaleDateString();
    }
  } catch (e) {
    console.warn("Invalid date", quotation?.quotation_date);
  }
  ws.mergeCells("G4:I5");
  ws.getCell("G4").value = dateStr;

  // address
  ws.mergeCells("B6:I7");
  ws.getCell("B6").value = address || "N/A";

  // headers
  const h1 = ws.addRow([
    "S.No",
    "Image",
    "Product",
    "Code",
    "MRP",
    "Discount",
    "Rate",
    "Unit",
    "Total",
  ]);
  h1.font = { bold: true };
  h1.eachCell((c) => {
    c.border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    };
  });

  // rows
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
    row.height = 50;
    if (prodImgs[i]?.buffer) {
      const id = wb.addImage({
        buffer: prodImgs[i].buffer,
        extension: prodImgs[i].extension || "png",
      });
      ws.addImage(id, {
        tl: { col: 1, row: ws.rowCount - 1 },
        ext: { width: 50, height: 50 },
      });
    }
  });

  // === TOTALS (SAFE) ===
  let subtotal = 0,
    gst = 0,
    total = 0;
  try {
    const calc = calcTotals(
      productList,
      quotation?.gst_value ?? 0,
      quotation?.include_gst ?? false
    );
    subtotal = calc.subtotal;
    gst = calc.gst;
    total = calc.total;
  } catch (e) {
    console.warn("calcTotals failed", e);
  }

  ws.addRow([]);
  ws.addRow([
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "Sub Total",
    `₹${subtotal.toFixed(2)}`,
  ]);
  if (quotation?.include_gst)
    ws.addRow([
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      `GST (${quotation.gst_value}%)`,
      `₹${gst.toFixed(2)}`,
    ]);
  ws.addRow(["", "", "", "", "", "", "", "Total", `₹${total.toFixed(2)}`]);

  // words
  ws.addRow([]);
  ws.mergeCells(`A${ws.rowCount}:I${ws.rowCount}`);
  ws.getCell(`A${ws.rowCount}`).value = `Amount in Words: ${amountInWords(
    subtotal
  )}`;

  // account
  const bank = accountDetails || {};
  ws.addRow([]);
  ws.mergeCells(`A${ws.rowCount}:I${ws.rowCount}`);
  ws.getCell(`A${ws.rowCount}`).value = `Account Details:\nBank: ${
    bank.bankName || "‑"
  }\nA/c: ${bank.accountNumber || "‑"}\nIFSC: ${
    bank.ifscCode || "‑"
  }\nBranch: ${bank.branch || "‑"}`;

  const buf = await wb.xlsx.writeBuffer();
  const blob = new Blob([buf], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `Quotation_${id}_Version_${activeVersion}.xlsx`;
  a.click();
  URL.revokeObjectURL(a.href);
};
