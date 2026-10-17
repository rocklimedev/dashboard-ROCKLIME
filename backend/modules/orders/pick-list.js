// Pick list PDF for the godown: for one order, what is still to be sent,
// how much is reserved for it in each godown, and space to tick and sign.
//
//   buildPickList(order) → Buffer
const path = require("path");
const PDFDocument = require("pdfkit");
const { QueryTypes } = require("sequelize");

const ASSETS = path.join(__dirname, "../../assets");
const FONT = path.join(ASSETS, "fonts/Inter-Regular.otf");
const FONT_BOLD = path.join(ASSETS, "fonts/Inter-SemiBold.otf");
const LOGO = path.join(ASSETS, "logo.png");
const M = 36;
const W = 595.28 - M * 2;
const INK = "#1f1f1f";
const MUTED = "#6b6b6b";
const RULE = "#d9d9d9";

const fmtDate = (d) =>
  new Date(d || Date.now()).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" });

async function pickLines(order) {
  const { sequelize, Product } = require("../../models");
  const stock = require("../stock/stock.service");
  const needs = await stock.orderNeeds(order);
  const ids = needs.map((n) => n.productId);
  if (!ids.length) return [];
  const products = await Product.findAll({
    where: { productId: ids },
    attributes: ["productId", "name", "product_code"],
    raw: true,
  });
  const P = Object.fromEntries(products.map((p) => [p.productId, p]));
  const lineName = {};
  for (const l of Array.isArray(order.products) ? order.products : []) {
    const pid = l.productId || l.id;
    if (pid && !lineName[pid]) lineName[pid] = l;
  }
  const reserved = await sequelize.query(
    `SELECT r.productId, w.name AS godown, SUM(r.quantity) AS qty
     FROM stock_reservations r JOIN warehouses w ON w.id = r.warehouseId
     WHERE r.orderId = :orderId AND r.status = 'ACTIVE'
     GROUP BY r.productId, w.name`,
    { replacements: { orderId: order.id }, type: QueryTypes.SELECT },
  );
  const byProduct = {};
  for (const r of reserved) (byProduct[r.productId] ||= []).push(`${r.godown}: ${Number(r.qty)}`);
  return needs.map((n) => ({
    ...n,
    name: P[n.productId]?.name || lineName[n.productId]?.name || "Product",
    code: P[n.productId]?.product_code || lineName[n.productId]?.productCode || lineName[n.productId]?.companyCode || "",
    reservedAt: (byProduct[n.productId] || []).join(", "),
    reserved: (byProduct[n.productId] ? reserved.filter((r) => r.productId === n.productId).reduce((a, r) => a + Number(r.qty), 0) : 0),
  }));
}

async function buildPickList(order) {
  const lines = await pickLines(order);
  const toPick = lines.filter((l) => l.needed > 0);
  const doc = new PDFDocument({ size: "A4", margin: M, bufferPages: true, info: { Title: `Pick list ${order.orderNo}` } });
  const chunks = [];
  doc.on("data", (c) => chunks.push(c));
  const done = new Promise((resolve) => doc.on("end", () => resolve(Buffer.concat(chunks))));
  try {
    doc.registerFont("R", FONT);
    doc.registerFont("B", FONT_BOLD);
  } catch {
    doc.registerFont("R", "Helvetica");
    doc.registerFont("B", "Helvetica-Bold");
  }

  // Header
  try {
    doc.image(LOGO, M, M, { height: 34 });
  } catch {
    /* logo optional */
  }
  doc.font("B").fontSize(16).fillColor(INK).text("PICK LIST", M, M, { width: W, align: "right" });
  doc.font("R").fontSize(10).fillColor(MUTED).text(`Order #${order.orderNo} · printed ${fmtDate()}`, M, M + 22, { width: W, align: "right" });
  let y = M + 52;
  doc.moveTo(M, y).lineTo(M + W, y).strokeColor(RULE).lineWidth(1).stroke();
  y += 10;
  doc.font("B").fontSize(11).fillColor(INK).text(order.customer?.name || "Customer", M, y);
  doc.font("R").fontSize(10).fillColor(MUTED).text(
    [order.customer?.mobileNumber, order.dueDate ? `Due ${fmtDate(order.dueDate)}` : null, `Priority ${order.priority || "medium"}`]
      .filter(Boolean)
      .join(" · "),
    M,
    y + 15,
  );
  y += 40;

  // Table
  const cols = [
    { k: "tick", label: "✓", w: 24 },
    { k: "name", label: "Product", w: 200 },
    { k: "code", label: "Code", w: 80 },
    { k: "needed", label: "To pick", w: 50, align: "right" },
    { k: "reservedAt", label: "Reserved in godown", w: 119 },
    { k: "picked", label: "Picked", w: 50, align: "right" },
  ];
  const header = () => {
    doc.rect(M, y, W, 20).fill("#f4f4f4");
    let x = M;
    doc.font("B").fontSize(9).fillColor(INK);
    for (const c of cols) {
      doc.text(c.k === "tick" ? "" : c.label, x + 4, y + 6, { width: c.w - 8, align: c.align || "left" });
      x += c.w;
    }
    y += 22;
  };
  header();
  if (!toPick.length) {
    doc.font("R").fontSize(11).fillColor(MUTED).text("Nothing left to pick — every item on this order has been dispatched.", M, y + 8);
    y += 30;
  }
  for (const l of toPick) {
    const nameH = doc.font("R").fontSize(10).heightOfString(l.name, { width: 192 });
    const rh = Math.max(nameH, 12) + 12;
    if (y + rh > 841.89 - M - 80) {
      doc.addPage();
      y = M;
      header();
    }
    let x = M;
    doc.rect(x + 6, y + 5, 11, 11).strokeColor(MUTED).lineWidth(0.8).stroke();
    x += cols[0].w;
    doc.font("R").fontSize(10).fillColor(INK).text(l.name, x + 4, y + 6, { width: cols[1].w - 8 });
    x += cols[1].w;
    doc.text(l.code || "—", x + 4, y + 6, { width: cols[2].w - 8 });
    x += cols[2].w;
    doc.font("B").text(String(l.needed), x + 4, y + 6, { width: cols[3].w - 8, align: "right" });
    x += cols[3].w;
    const short = l.needed - l.reserved;
    doc.font("R").fillColor(short > 0 ? "#C8102E" : INK).text(
      (l.reservedAt || "None reserved") + (short > 0 ? ` · short ${short}` : ""),
      x + 4,
      y + 6,
      { width: cols[4].w - 8 },
    );
    x += cols[4].w;
    doc.moveTo(x + 10, y + rh - 6).lineTo(x + cols[5].w - 4, y + rh - 6).strokeColor(RULE).stroke();
    y += rh;
    doc.moveTo(M, y).lineTo(M + W, y).strokeColor(RULE).lineWidth(0.5).stroke();
  }
  const already = lines.filter((l) => l.dispatched > 0);
  if (already.length) {
    y += 12;
    doc.font("R").fontSize(9).fillColor(MUTED).text(
      `Already dispatched: ${already.map((l) => `${l.name} ${l.dispatched}`).join("; ")}`,
      M,
      y,
      { width: W },
    );
    y = doc.y;
  }

  // Sign-off
  y = Math.max(y + 30, 841.89 - M - 60);
  const box = (label, x) => {
    doc.moveTo(x, y + 30).lineTo(x + 150, y + 30).strokeColor(MUTED).lineWidth(0.8).stroke();
    doc.font("R").fontSize(9).fillColor(MUTED).text(label, x, y + 34, { width: 150 });
  };
  box("Picked by", M);
  box("Checked by", M + 180);
  box("Date & time", M + 360);

  doc.end();
  return done;
}

module.exports = { buildPickList, pickLines };
