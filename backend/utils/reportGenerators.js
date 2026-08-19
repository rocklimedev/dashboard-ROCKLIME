const { PDFDocument, StandardFonts } = require("pdf-lib");
const ExcelJS = require("exceljs");
const fs = require("fs").promises;
const path = require("path");

// ======================================================
//                     PATHS TO TEMPLATES
// ======================================================
const TEMPLATES = {
  inventory: path.join(__dirname, "../assets/pdf/stock_report.pdf"),
  order: path.join(__dirname, "../assets/pdf/order_report.pdf"),
  po: path.join(__dirname, "../assets/pdf/order_report.pdf"), // same as order for now
  quotation: path.join(__dirname, "../assets/pdf/quotation_report.pdf"),
  lowStock: path.join(__dirname, "../assets/pdf/low_stock_report.pdf"),
};

// ======================================================
//                     COMMON HELPERS
// ======================================================
const sanitizePDFText = (text) => {
  if (text === null || text === undefined) return "-";
  return String(text)
    .replace(/[\u0000-\u001F\u007F]/g, "")
    .replace(/\s+/g, " ")
    .trim();
};

const formatDate = (date) => {
  if (!date) return "-";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("en-IN");
};

const formatCurrency = (amount) => {
  if (amount == null) return 0;
  return Number(amount);
};

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
  if (lines.length < maxLines && currentLine) lines.push(currentLine);

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

const addTemplatePage = async (pdfDoc, templateBytes) => {
  const templateDoc = await PDFDocument.load(templateBytes);
  const [templatePage] = await pdfDoc.copyPages(templateDoc, [0]);
  pdfDoc.addPage(templatePage);
  return pdfDoc.getPages()[pdfDoc.getPageCount() - 1];
};

// ======================================================
//                 1. ORDER REPORT
// ======================================================
const generateOrderReportPDF = async (
  orders = [],
  startDate = null,
  endDate = null,
) => {
  const templateBytes = await fs.readFile(TEMPLATES.order);
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const ROWS_PER_PAGE = 20;
  const FONT_SIZE = 10;

  const pages = [];
  for (let i = 0; i < orders.length; i += ROWS_PER_PAGE) {
    pages.push(orders.slice(i, i + ROWS_PER_PAGE));
  }

  for (let pageIndex = 0; pageIndex < pages.length; pageIndex++) {
    const page = await addTemplatePage(pdfDoc, templateBytes);

    const COLS = {
      sno: 30,
      orderNo: 70,
      date: 150,
      client: 210,
      status: 355,
      amount: 500,
    };

    let y = 670;

    pages[pageIndex].forEach((o, i) => {
      const serialNo = pageIndex * ROWS_PER_PAGE + i + 1;
      const orderNo = sanitizePDFText(o.orderNo);
      const date = formatDate(o.createdAt);
      const client = sanitizePDFText(o.customer?.name || "Walk-in");
      const amount = `Rs ${Number(o.finalAmount || 0).toLocaleString("en-IN")}`;
      const status = sanitizePDFText((o.status || "-").toUpperCase());

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

    page.drawText(`${pageIndex + 1} / ${pages.length}`, {
      x: 500,
      y: 25,
      font,
      size: 10,
    });
  }

  return Buffer.from(await pdfDoc.save());
};

const generateOrderReportExcel = async (orders = []) => {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Order Report");

  sheet.columns = [
    { header: "S.No", key: "sno", width: 8 },
    { header: "Order No", key: "orderNo", width: 18 },
    { header: "Customer", key: "customer", width: 25 },
    { header: "Status", key: "status", width: 18 },
    { header: "Priority", key: "priority", width: 12 },
    { header: "Final Amount", key: "amount", width: 15 },
    { header: "Amount Paid", key: "paid", width: 15 },
    { header: "Created At", key: "createdAt", width: 14 },
    { header: "Due Date", key: "dueDate", width: 14 },
  ];

  // Header styling
  sheet.getRow(1).font = { bold: true };
  sheet.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFE0E0E0" },
  };

  orders.forEach((order, index) => {
    sheet.addRow({
      sno: index + 1,
      orderNo: order.orderNo || "-",
      customer: order.customer?.name || "Walk-in",
      status: order.status || "-",
      priority: order.priority || "-",
      amount: formatCurrency(order.finalAmount),
      paid: formatCurrency(order.amountPaid),
      createdAt: formatDate(order.createdAt),
      dueDate: formatDate(order.dueDate),
    });
  });

  sheet.getColumn("amount").numFmt = "#,##0.00";
  sheet.getColumn("paid").numFmt = "#,##0.00";

  return await workbook.xlsx.writeBuffer();
};

// ======================================================
//               2. QUOTATION REPORT
// ======================================================
const generateQuotationReportPDF = async (
  quotations = [],
  startDate = null,
  endDate = null,
) => {
  const templateBytes = await fs.readFile(TEMPLATES.quotation);
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const ROWS_PER_PAGE = 20;
  const ROW_HEIGHT = 33;
  const FONT_SIZE = 10;

  const pages = [];
  for (let i = 0; i < quotations.length; i += ROWS_PER_PAGE) {
    pages.push(quotations.slice(i, i + ROWS_PER_PAGE));
  }

  for (let pageIndex = 0; pageIndex < pages.length; pageIndex++) {
    const page = await addTemplatePage(pdfDoc, templateBytes);

    const dateText =
      startDate && endDate
        ? `${startDate} to ${endDate}`
        : new Date().toLocaleDateString("en-IN");

    page.drawText(dateText, { x: 120, y: 759, size: 10, font });
    page.drawText(String(quotations.length), {
      x: 125,
      y: 742.5,
      size: 12,
      font: boldFont,
    });

    const COLS = {
      sno: 30,
      quotationNo: 70,
      date: 200,
      client: 278,
      createdBy: 400,
      amount: 500,
    };

    let y = 680;

    pages[pageIndex].forEach((q, rowIndex) => {
      const serialNo = pageIndex * ROWS_PER_PAGE + rowIndex + 1;
      const quotationNo = sanitizePDFText(
        q.reference_number || q.referenceNumber,
      );
      const quotationDate = formatDate(q.quotation_date);
      const clientName = sanitizePDFText(q.customer?.name || q.customerName);
      const createdBy = sanitizePDFText(q.creator?.name || q.createdByName);
      const amount = Number(q.finalAmount || q.totalAmount || 0).toLocaleString(
        "en-IN",
      );

      const COL_WIDTHS = { quotationNo: 110, client: 110, createdBy: 80 };

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

      page.drawText(String(serialNo), {
        x: COLS.sno,
        y,
        size: FONT_SIZE,
        font,
      });
      page.drawText(quotationDate, { x: COLS.date, y, size: FONT_SIZE, font });
      page.drawText(amount, { x: COLS.amount, y, size: FONT_SIZE, font });

      quotationNoLines.forEach((line, idx) => {
        page.drawText(line, {
          x: COLS.quotationNo,
          y: y - idx * lineHeight,
          size: FONT_SIZE,
          font,
        });
      });

      clientLines.forEach((line, idx) => {
        page.drawText(line, {
          x: COLS.client,
          y: y - idx * lineHeight,
          size: FONT_SIZE,
          font,
        });
      });

      createdByLines.forEach((line, idx) => {
        page.drawText(line, {
          x: COLS.createdBy,
          y: y - idx * lineHeight,
          size: FONT_SIZE,
          font,
        });
      });

      const dynamicHeight = Math.max(ROW_HEIGHT, maxLines * lineHeight + 8);
      y -= dynamicHeight;
    });

    page.drawText(`${pageIndex + 1} / ${pages.length}`, {
      x: page.getWidth() - 110,
      y: 25,
      size: 10,
      font,
    });
  }

  return Buffer.from(await pdfDoc.save());
};

const generateQuotationReportExcel = async (quotations = []) => {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Quotation Report");

  sheet.columns = [
    { header: "S.No", key: "sno", width: 8 },
    { header: "Document Title", key: "title", width: 30 },
    { header: "Reference No", key: "ref", width: 16 },
    { header: "Customer", key: "customer", width: 25 },
    { header: "Final Amount", key: "amount", width: 15 },
    { header: "Quotation Date", key: "qDate", width: 14 },
    { header: "Due Date", key: "dueDate", width: 14 },
    { header: "Created By", key: "createdBy", width: 18 },
  ];

  sheet.getRow(1).font = { bold: true };
  sheet.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFE0E0E0" },
  };

  quotations.forEach((q, index) => {
    sheet.addRow({
      sno: index + 1,
      title: q.document_title || "-",
      ref: q.reference_number || q.referenceNumber || "-",
      customer: q.customer?.name || q.customerName || "-",
      amount: formatCurrency(q.finalAmount || q.totalAmount),
      qDate: formatDate(q.quotation_date),
      dueDate: formatDate(q.due_date),
      createdBy: q.creator?.name || q.createdByName || "-",
    });
  });

  sheet.getColumn("amount").numFmt = "#,##0.00";

  return await workbook.xlsx.writeBuffer();
};

// ======================================================
//              3. PURCHASE ORDER REPORT
// ======================================================
const generatePOReportPDF = async (
  pos = [],
  startDate = null,
  endDate = null,
) => {
  const templateBytes = await fs.readFile(TEMPLATES.po);
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const ROWS_PER_PAGE = 20;

  const pages = [];
  for (let i = 0; i < pos.length; i += ROWS_PER_PAGE) {
    pages.push(pos.slice(i, i + ROWS_PER_PAGE));
  }

  for (let p = 0; p < pages.length; p++) {
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

    pages[p].forEach((po, i) => {
      const sno = p * ROWS_PER_PAGE + i + 1;
      const poNo = sanitizePDFText(po.poNumber || po.orderNo || po.id);
      const vendor = sanitizePDFText(
        po.vendor?.vendorName || po.vendor?.name || po.vendorName,
      );
      const date = formatDate(po.orderDate || po.createdAt);
      const amount = `Rs. ${Number(po.totalAmount || po.finalAmount || 0).toLocaleString("en-IN")}`;
      const status = sanitizePDFText((po.status || "pending").toUpperCase());

      page.drawText(String(sno), { x: COLS.sno, y, font, size: 10 });
      page.drawText(poNo, { x: COLS.poNo, y, font, size: 10 });
      page.drawText(vendor, { x: COLS.vendor, y, font, size: 10 });
      page.drawText(date, { x: COLS.date, y, font, size: 10 });
      page.drawText(amount, { x: COLS.amount, y, font, size: 10 });
      page.drawText(status, { x: COLS.status, y, font, size: 10 });

      y -= 30;
    });

    page.drawText(`${p + 1} / ${pages.length}`, {
      x: 500,
      y: 25,
      font,
      size: 10,
    });
  }

  return Buffer.from(await pdfDoc.save());
};

const generatePOReportExcel = async (pos = []) => {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Purchase Order Report");

  sheet.columns = [
    { header: "S.No", key: "sno", width: 8 },
    { header: "PO Number", key: "poNo", width: 18 },
    { header: "Vendor", key: "vendor", width: 25 },
    { header: "Status", key: "status", width: 15 },
    { header: "Final Amount", key: "amount", width: 15 },
    { header: "Order Date", key: "orderDate", width: 14 },
  ];

  sheet.getRow(1).font = { bold: true };
  sheet.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFE0E0E0" },
  };

  pos.forEach((po, index) => {
    sheet.addRow({
      sno: index + 1,
      poNo: po.poNumber || po.orderNo || po.id || "-",
      vendor: po.vendor?.vendorName || po.vendor?.name || po.vendorName || "-",
      status: po.status || "pending",
      amount: formatCurrency(po.totalAmount || po.finalAmount),
      orderDate: formatDate(po.orderDate || po.createdAt),
    });
  });

  sheet.getColumn("amount").numFmt = "#,##0.00";

  return await workbook.xlsx.writeBuffer();
};

// ======================================================
//               4. INVENTORY / STOCK REPORT
// ======================================================
const generateInventoryReportPDF = async (products = []) => {
  const templateBytes = await fs.readFile(TEMPLATES.inventory);
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const generatedOn = new Date().toLocaleString("en-IN");
  const totalProducts = products.length;
  const ROWS_PER_PAGE = 20;
  const FONT_SIZE = 10;
  const ROW_HEIGHT = 33;

  const pages = [];
  for (let i = 0; i < products.length; i += ROWS_PER_PAGE) {
    pages.push(products.slice(i, i + ROWS_PER_PAGE));
  }

  for (let p = 0; p < pages.length; p++) {
    const page = await addTemplatePage(pdfDoc, templateBytes);

    page.drawText(`${generatedOn}`, { x: 120, y: 759, font, size: 10 });
    page.drawText(`${totalProducts}`, { x: 180, y: 742.5, font, size: 10 });

    const COLS = {
      sno: 37,
      name: 70,
      code: 200,
      price: 300,
      stock: 380,
      status: 450,
      updatedAt: 520,
    };

    const WRAP_WIDTH = { name: 120, code: 90 };
    let y = 690;

    pages[p].forEach((item, i) => {
      const sno = p * ROWS_PER_PAGE + i + 1;
      const name = sanitizePDFText(item.name);

      const code = sanitizePDFText(
        item.metaDetails?.find((d) => d.value?.match(/^[A-Za-z0-9]{6,12}$/))
          ?.value || item.product_code,
      );

      const getMeta = (item, slug, fallback = "-") =>
        item.metaDetails?.find((m) => m.slug === slug)?.value ?? fallback;

      const price = sanitizePDFText(getMeta(item, "sellingPrice", 0));
      const stock = item.quantity ?? 0;
      const statusRaw = stock === 0 ? "OUT" : stock <= 20 ? "LOW" : "OK";
      const status = sanitizePDFText(statusRaw);
      const updatedAt = sanitizePDFText(formatDate(item.updatedAt));

      const nameLines = wrapTextWithLimit(
        name,
        WRAP_WIDTH.name,
        font,
        FONT_SIZE,
        2,
      );
      const codeLines = wrapText(code, WRAP_WIDTH.code, font, FONT_SIZE);

      page.drawText(String(sno), { x: COLS.sno, y, font, size: FONT_SIZE });
      page.drawText(String(price), { x: COLS.price, y, font, size: FONT_SIZE });
      page.drawText(String(stock), { x: COLS.stock, y, font, size: FONT_SIZE });
      page.drawText(status, { x: COLS.status, y, font, size: FONT_SIZE });
      page.drawText(updatedAt, { x: COLS.updatedAt, y, font, size: FONT_SIZE });

      nameLines.forEach((line, idx) => {
        page.drawText(line, {
          x: COLS.name,
          y: y - idx * 11,
          font,
          size: FONT_SIZE,
        });
      });

      codeLines.forEach((line, idx) => {
        page.drawText(line, {
          x: COLS.code,
          y: y - idx * 11,
          font,
          size: FONT_SIZE,
        });
      });

      y -= ROW_HEIGHT;
    });

    page.drawText(`${p + 1} / ${pages.length}`, {
      x: 500,
      y: 25,
      font,
      size: 10,
    });
  }

  return Buffer.from(await pdfDoc.save());
};

const generateInventoryReportExcel = async (products = []) => {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Inventory Report");

  sheet.columns = [
    { header: "S.No", key: "sno", width: 8 },
    { header: "Product Name", key: "name", width: 35 },
    { header: "Product Code", key: "code", width: 18 },
    { header: "Company Code", key: "companyCode", width: 16 },
    { header: "Selling Price", key: "price", width: 14 },
    { header: "Current Stock", key: "stock", width: 14 },
    { header: "Status", key: "status", width: 14 },
    { header: "Brand", key: "brand", width: 18 },
    { header: "Category", key: "category", width: 18 },
    { header: "Last Updated", key: "updated", width: 14 },
  ];

  sheet.getRow(1).font = { bold: true };
  sheet.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFE0E0E0" },
  };

  products.forEach((p, index) => {
    const stock = p.quantity ?? 0;
    const status =
      stock === 0 ? "OUT OF STOCK" : stock <= 20 ? "LOW STOCK" : "IN STOCK";

    const companyCode =
      p.metaDetails?.find((d) => d.value?.match(/^[A-Za-z0-9]{6,12}$/))
        ?.value ||
      p.metaDetails?.find((m) => m.slug === "companyCode")?.value ||
      "-";

    const sellingPrice =
      p.metaDetails?.find((m) => m.slug === "sellingPrice")?.value || 0;

    sheet.addRow({
      sno: index + 1,
      name: p.name || "-",
      code: p.product_code || "-",
      companyCode,
      price: formatCurrency(sellingPrice),
      stock,
      status,
      brand: p.brand?.name || "-",
      category: p.categories?.name || "-",
      updated: formatDate(p.updatedAt),
    });
  });

  sheet.getColumn("price").numFmt = "#,##0.00";

  return await workbook.xlsx.writeBuffer();
};

// ======================================================
//               5. LOW STOCK REPORT
// ======================================================
const generateLowStockReportPDF = async (products = [], threshold = 20) => {
  const templateBytes = await fs.readFile(TEMPLATES.lowStock);
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const generatedOn = new Date().toLocaleString("en-IN");
  const ROWS_PER_PAGE = 20;
  const FONT_SIZE = 10;
  const ROW_HEIGHT = 33;
  const LINE_SPACING = 11;

  const lowStock = (products || []).filter(
    (p) => (p.quantity ?? 0) <= threshold,
  );

  const pages = [];
  for (let i = 0; i < lowStock.length; i += ROWS_PER_PAGE) {
    pages.push(lowStock.slice(i, i + ROWS_PER_PAGE));
  }

  for (let p = 0; p < pages.length; p++) {
    const page = await addTemplatePage(pdfDoc, templateBytes);

    page.drawText(`${generatedOn}`, { x: 120, y: 759, font, size: 10 });

    const COLS = {
      sno: 30,
      name: 70,
      companyCode: 250,
      price: 430,
      stock: 520,
    };

    const WRAP_WIDTH = {
      name: COLS.companyCode - COLS.name - 15,
      companyCode: COLS.price - COLS.companyCode - 15,
    };

    let y = 670;

    pages[p].forEach((item, i) => {
      const sno = p * ROWS_PER_PAGE + i + 1;
      const name = sanitizePDFText(item.name);
      const companyCode = sanitizePDFText(
        item.metaDetails?.find((m) => m.slug === "companyCode")?.value ||
          item.product_code,
      );
      const sellingPrice = sanitizePDFText(
        item.metaDetails?.find((m) => m.slug === "sellingPrice")?.value,
      );
      const stock = item.quantity ?? 0;

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

      nameLines.forEach((line, idx) => {
        page.drawText(line, {
          x: COLS.name,
          y: y - idx * LINE_SPACING,
          font,
          size: FONT_SIZE,
        });
      });

      companyCodeLines.forEach((line, idx) => {
        page.drawText(line, {
          x: COLS.companyCode,
          y: y - idx * LINE_SPACING,
          font,
          size: FONT_SIZE,
        });
      });

      page.drawText(String(sno), { x: COLS.sno, y, font, size: FONT_SIZE });
      page.drawText(String(sellingPrice), {
        x: COLS.price,
        y,
        font,
        size: FONT_SIZE,
      });
      page.drawText(String(stock), { x: COLS.stock, y, font, size: FONT_SIZE });

      y -= ROW_HEIGHT;
    });

    page.drawText(`${p + 1} / ${pages.length}`, {
      x: 500,
      y: 25,
      font,
      size: 10,
    });
  }

  return Buffer.from(await pdfDoc.save());
};

const generateLowStockReportExcel = async (products = [], threshold = 20) => {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Low Stock Report");

  sheet.columns = [
    { header: "S.No", key: "sno", width: 8 },
    { header: "Product Name", key: "name", width: 35 },
    { header: "Product Code", key: "code", width: 18 },
    { header: "Company Code", key: "companyCode", width: 16 },
    { header: "Selling Price", key: "price", width: 14 },
    { header: "Current Stock", key: "stock", width: 14 },
    { header: "Status", key: "status", width: 14 },
    { header: "Brand", key: "brand", width: 18 },
    { header: "Category", key: "category", width: 18 },
  ];

  // Light red header for low stock
  sheet.getRow(1).font = { bold: true };
  sheet.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFFFCDD2" },
  };

  const lowStock = (products || []).filter(
    (p) => (p.quantity ?? 0) <= threshold,
  );

  lowStock.forEach((p, index) => {
    const stock = p.quantity ?? 0;
    const status = stock === 0 ? "OUT OF STOCK" : "LOW STOCK";

    const companyCode =
      p.metaDetails?.find((m) => m.slug === "companyCode")?.value ||
      p.product_code ||
      "-";

    const sellingPrice =
      p.metaDetails?.find((m) => m.slug === "sellingPrice")?.value || 0;

    sheet.addRow({
      sno: index + 1,
      name: p.name || "-",
      code: p.product_code || "-",
      companyCode,
      price: formatCurrency(sellingPrice),
      stock,
      status,
      brand: p.brand?.name || "-",
      category: p.categories?.name || "-",
    });
  });

  sheet.getColumn("price").numFmt = "#,##0.00";

  return await workbook.xlsx.writeBuffer();
};

// ======================================================
//                     EXPORTS
// ======================================================
module.exports = {
  // Order
  generateOrderReportPDF,
  generateOrderReportExcel,

  // Quotation
  generateQuotationReportPDF,
  generateQuotationReportExcel,

  // Purchase Order
  generatePOReportPDF,
  generatePOReportExcel,

  // Inventory
  generateInventoryReportPDF,
  generateInventoryReportExcel,

  // Low Stock
  generateLowStockReportPDF,
  generateLowStockReportExcel,
};
