// Purchase order PDF in the Chhabra Marble format (same look as the quotation).
//
//   buildPoPdf(poId)        → { buffer, filename }
//   renderPoPdf(data)       → { buffer, filename }   (no database; used by the sample script)
//
// Page: logo + PO no./date/expected delivery · vendor (address, GSTIN,
// contact) and deliver-to (godown, our GSTIN) · references · items (code, HSN,
// qty, rate, discount, GST %, amount) · GST by rate and totals with the grand
// total in words · payment and delivery terms, PO terms, notes · signatures.
const path = require("path");
const PDFDocument = require("pdfkit");
const { poTotals } = require("../../lib/poMath");
const { amountInWords, inr } = require("../../lib/quotationMath");
const { getSetting } = require("../settings/settings.service");

const ASSETS = path.join(__dirname, "../../assets");
const LOGO_RED = path.join(ASSETS, "quotation/logo-red.png");
const A4 = { w: 595.28, h: 841.89 };
const M = 40;
const W = A4.w - M * 2;
const INK = "#1a1a1a";
const MUTED = "#8a8a8a";
const RULE = "#e2e2e2";
const RED = "#D7232F";
const BOTTOM = A4.h - 64;

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" }) : "—");
const money = (v) => inr(v);
const whole = (v) => inr(Math.round(Number(v) || 0), { decimals: 0 });

async function loadPo(poId) {
  const m = require("../../models");
  const po = await m.PurchaseOrder.findByPk(poId);
  if (!po) throw Object.assign(new Error("Purchase order not found"), { status: 404 });
  const PoItem = require("./models/po-item.model");
  const doc = await PoItem.findOne({ poId: po.id }).lean();
  const [vendor, creator, warehouse] = await Promise.all([
    m.Vendor.findByPk(po.vendorId),
    po.userId ? m.User.findByPk(po.userId, { attributes: ["name", "username", "mobileNumber"] }) : null,
    po.warehouseId && m.Warehouse ? m.Warehouse.findByPk(po.warehouseId) : m.Warehouse ? m.Warehouse.findOne({ where: { isDefault: true } }) : null,
  ]);
  const ids = (doc?.items || []).map((i) => i.productId);
  const hsn = {};
  if (ids.length) {
    const meta = await m.ProductMeta.findOne({ where: { slug: "hsnCode" } }).catch(() => null);
    if (meta) {
      const products = await m.Product.findAll({ where: { productId: ids }, attributes: ["productId", "meta"] });
      for (const p of products) {
        let mm = p.meta;
        for (let i = 0; i < 3 && typeof mm === "string"; i++) {
          try {
            mm = JSON.parse(mm);
          } catch {
            mm = {};
          }
        }
        if (mm && mm[meta.id]) hsn[p.productId] = mm[meta.id];
      }
    }
  }
  return {
    po: po.toJSON(),
    items: (doc?.items || []).map((i) => ({ ...i, hsn: hsn[i.productId] || i.hsn || null })),
    vendor: vendor?.toJSON() || {},
    creator: creator?.toJSON() || null,
    warehouse: warehouse?.toJSON?.() || null,
  };
}

async function buildPoPdf(poId, exportOptions = {}) {
  const [data, company, purchase] = await Promise.all([loadPo(poId), getSetting("company"), getSetting("purchase")]);
  return renderPoPdf({ ...data, company, purchase, exportOptions });
}

async function renderPoPdf({ po, items, vendor = {}, creator, warehouse, company, purchase = {}, exportOptions = {} }) {
  const hidden = new Set(Array.isArray(exportOptions?.hidden) ? exportOptions.hidden : []);
  const brand = company.brandName || company.name || "";
  const norm = (x) => String(x || "").trim().toLowerCase();
  const interState = po.interState ?? Boolean(vendor.state && company.state && norm(vendor.state) !== norm(company.state));
  const t = poTotals({ items, freight: Number(po.freight) || 0, interState });
  const ref = po.poNumber || "PO";

  const doc = new PDFDocument({ size: "A4", margin: 0, bufferPages: true, info: { Title: `Purchase order ${ref}` } });
  const chunks = [];
  doc.on("data", (c) => chunks.push(c));
  const done = new Promise((resolve) => doc.on("end", () => resolve(Buffer.concat(chunks))));
  doc.registerFont("R", path.join(ASSETS, "fonts/Inter-Regular.otf"));
  doc.registerFont("B", path.join(ASSETS, "fonts/Inter-SemiBold.otf"));
  const text = (s, x, y, o = {}) =>
    doc
      .font(o.bold ? "B" : "R")
      .fontSize(o.size || 9)
      .fillColor(o.color || INK)
      .text(String(s ?? ""), x, y, { width: o.width, align: o.align, lineBreak: o.lineBreak !== false, characterSpacing: o.spacing || 0, ellipsis: o.ellipsis, height: o.height });
  const label = (s, x, y, o = {}) => text(String(s).toUpperCase(), x, y, { size: o.size || 6.5, color: o.color || MUTED, spacing: 0.9, width: o.width, align: o.align, lineBreak: false });
  const rule = (y, o = {}) => doc.moveTo(o.x1 ?? M, y).lineTo(o.x2 ?? M + W, y).lineWidth(o.w || 0.5).strokeColor(o.color || RULE).stroke();
  const hOf = (s, width, size = 8.5, bold = false) => doc.font(bold ? "B" : "R").fontSize(size).heightOfString(String(s || ""), { width });

  // header
  let y = 44;
  try {
    doc.image(LOGO_RED, M, y, { height: 32 });
  } catch {
    text(brand, M, y + 6, { size: 16, bold: true, color: RED });
  }
  text("Purchase order", A4.w - M - 240, y - 2, { size: 19, bold: true, width: 240, align: "right" });
  let my = y + 26;
  for (const [k, v] of [
    ["No.", ref],
    ["Date", fmtDate(po.orderDate || po.createdAt)],
    ["Deliver by", po.expectDeliveryDate ? fmtDate(po.expectDeliveryDate) : "As agreed"],
  ]) {
    text(k, A4.w - M - 240, my, { size: 8, color: MUTED, width: 140, align: "right" });
    text(v, A4.w - M - 92, my, { size: 8, bold: true, width: 92, align: "right" });
    my += 12;
  }
  y = Math.max(my, y + 62) + 6;
  rule(y, { color: RED, w: 1 });
  y += 18;

  // vendor · deliver to
  const half = W / 2 - 10;
  label("Vendor", M, y);
  label("Deliver to", A4.w - M - half, y, { width: half, align: "right" });
  let ly = y + 12;
  text(vendor.vendorName || "—", M, ly, { size: 12.5, bold: true, width: half });
  ly += hOf(vendor.vendorName || "—", half, 12.5, true) + 3;
  const vLines = [
    vendor.address,
    [vendor.city, vendor.state, vendor.pincode].filter(Boolean).join(", "),
    vendor.gstin ? `GSTIN ${vendor.gstin}` : null,
    [vendor.contactPerson, vendor.phone].filter(Boolean).join(" · "),
    vendor.email,
  ].filter(Boolean);
  for (const l of vLines) {
    text(l, M, ly, { size: 8.5, width: half });
    ly += hOf(l, half) + 3;
  }
  let ry = y + 13;
  const dLines = [
    brand,
    warehouse?.name && warehouse.name !== brand ? warehouse.name : null,
    warehouse?.address || company.address,
    company.gstin ? `GSTIN ${company.gstin}` : null,
    [company.phone, String(company.website || "").replace(/^https?:\/\/(www\.)?/i, "")].filter(Boolean).join(" · "),

  ].filter(Boolean);
  for (const l of dLines) {
    text(l, A4.w - M - half, ry, { size: 8.5, width: half, align: "right" });
    ry += hOf(l, half) + 3;
  }
  y = Math.max(ly, ry) + 12;

  // references strip
  const refs = [
    ["Your reference", po.vendorRef],
    ["Payment", po.paymentTerms || vendor.paymentTerms || purchase.paymentTerms],
    ["Delivery", po.deliveryTerms || purchase.deliveryTerms],
    ...(!hidden.has("gst") ? [["Tax", interState ? "IGST (other state)" : "CGST + SGST"]] : []),
  ];
  const bw = W / refs.length;
  const stripH = Math.max(46, ...refs.map(([, v]) => hOf(v || "—", bw - 18, 8, true) + 28));
  doc.rect(M, y, W, stripH).fill("#f6f6f6");
  refs.forEach(([k, v], i) => {
    const x = M + i * bw;
    if (i) doc.moveTo(x, y + 8).lineTo(x, y + stripH - 8).lineWidth(0.5).strokeColor(RULE).stroke();
    label(k, x + 10, y + 9, { width: bw - 16 });
    text(v || "—", x + 10, y + 21, { size: 8, bold: Boolean(v), color: v ? INK : MUTED, width: bw - 18 });
  });
  y += stripH + 16;

  // items
  const cols = [
    { k: "no", l: "#", x: M, w: 22 },
    { k: "name", l: "Product", x: M + 22, w: 223 },
    { k: "qty", l: "Qty", x: M + 245, w: 40, a: "right" },
    { k: "rate", l: "Rate", x: M + 285, w: 64, a: "right" },
    { k: "disc", l: "Disc.", x: M + 349, w: 42, a: "right" },
    { k: "gst", l: "GST", x: M + 391, w: 36, a: "right" },
    { k: "amt", l: "Amount", x: M + 427, w: W - 427, a: "right" },
  ];
  const keys = { no: "sno", rate: "price", disc: "discount", amt: "total" };
  const visible = cols.filter(c => c.k === "name" ? !(hidden.has("name") && hidden.has("code") && hidden.has("hsn")) : !hidden.has(keys[c.k] || c.k));
  // Keep the original positions, widths and combined product/code/HSN cell.
  const head = () => {
    for (const c of visible) label(c.k === "name" && hidden.has("name") ? "Code / HSN" : c.l, c.x + (c.a === "right" ? 0 : 3), y + 8, { width: c.w - 3, align: c.a || "left" });
    y += 22;
    rule(y);
  };
  if (visible.length) head();
  if (visible.length) t.lines.forEach((l, i) => {
    const sub = [!hidden.has("code") && (l.companyCode || l.productCode), !hidden.has("hsn") && l.hsn ? `HSN ${l.hsn}` : null].filter(Boolean).join(" · ");
    const nh = hidden.has("name") ? 0 : hOf(l.productName || "Item", 215);
    const h = Math.max(28, nh + (sub ? 11 : 0) + 14);
    if (y + h > BOTTOM - 40) {
      doc.addPage();
      y = 44;
      label(`Purchase order ${ref} (contd.)`, M, y);
      y += 12;
      head();
    }
    const mid = y + h / 2;
    const block = nh + (sub ? 11 : 0);
    if (!hidden.has("sno")) text(String(i + 1), M + 3, mid - 5, { size: 8.5, color: MUTED, lineBreak: false });
    if (!hidden.has("name")) text(l.productName || "Item", M + 25, mid - block / 2, { size: 8.5, width: 215 });
    if (sub) text(sub, M + 25, mid - block / 2 + nh + 1, { size: 7, color: MUTED, width: 215, lineBreak: false, ellipsis: true });
    const d = Number(l.discountInput) || 0;
    const disc = d ? (String(l.discountType || "percent") === "percent" ? `${d % 1 ? d.toFixed(1) : d}%` : `−${whole(d)}`) : "—";
    const vals = { qty: Number(l.qty).toLocaleString("en-IN"), rate: money(l.rate), disc, gst: `${l.gstRate}%`, amt: money(l.net) };
    for (const c of visible.filter(c => c.k !== "no" && c.k !== "name")) {
      text(vals[c.k], c.x, mid - 5, { size: 8.5, width: c.w - 3, align: "right", lineBreak: false, bold: c.k === "amt", color: c.k === "disc" || c.k === "gst" ? MUTED : INK });
    }
    y += h;
    rule(y, { color: "#ececec" });
  });
  y += 14;

  // GST by rate (left) · totals (right)
  if (y + 170 > BOTTOM) {
    doc.addPage();
    y = 44;
  }
  const top = y;
  const gx = M;
  const gw = W / 2 - 24;
  if (!hidden.has("gst") && !hidden.has("total")) {
  label("GST summary", gx, y, { color: RED, size: 7 });
  y += 14;
  const gc = interState
    ? [["Rate", 0.22], ["Taxable", 0.4], ["IGST", 0.38]]
    : [["Rate", 0.16], ["Taxable", 0.32], ["CGST", 0.26], ["SGST", 0.26]];
  let gxx = gx;
  for (const [k, f] of gc) {
    label(k, gxx, y + 2, { width: gw * f - 4, align: k === "Rate" ? "left" : "right" });
    gxx += gw * f;
  }
  y += 14;
  rule(y, { x2: gx + gw });
  for (const g of t.gstSummary) {
    const vals = interState ? [`${g.rate}%`, money(g.taxable), money(g.tax)] : [`${g.rate}%`, money(g.taxable), money(g.tax / 2), money(g.tax - Math.round((g.tax / 2) * 100) / 100)];
    gxx = gx;
    gc.forEach(([k, f], i) => {
      text(vals[i], gxx, y + 5, { size: 8, width: gw * f - 4, align: k === "Rate" ? "left" : "right", lineBreak: false });
      gxx += gw * f;
    });
    y += 18;
    rule(y, { x2: gx + gw, color: "#ececec" });
  }
  }
  // notes sit under the GST summary, where the page has room
  if (po.notes) {
    y += 16;
    label("Notes", gx, y, { color: RED, size: 7 });
    y += 13;
    text(po.notes, gx, y, { size: 8, width: gw });
    y += hOf(po.notes, gw, 8);
  }
  const leftEnd = y;

  if (!hidden.has("total")) {
  y = top;
  const bx = A4.w - M - 230;
  const lines = [
    [hidden.has("discount") ? "Goods value" : "Value before discount", money(t.subTotal)],
    ...(!hidden.has("discount") ? [["Discount", t.discount ? `−${money(t.discount)}` : money(0), t.discount ? RED : null]] : []),
    ["Freight", money(t.freight)],
    ["Taxable value", money(t.taxableValue), null, true],
    ...(!hidden.has("gst") ? (interState ? [["IGST", money(t.igst)]] : [["CGST", money(t.cgst)], ["SGST", money(t.sgst)]]) : []),
    ["Round off", `${t.roundOff < 0 ? "−" : "+"}${money(Math.abs(t.roundOff))}`, MUTED],
  ];
  for (const [k, v, color, bold] of lines) {
    text(k, bx + 6, y, { size: 8.5, bold, color: color === RED ? RED : color || INK, width: 130, lineBreak: false });
    text(v, bx + 130, y, { size: 8.5, bold, color: color || INK, width: 94, align: "right", lineBreak: false });
    y += 15;
  }
  doc.roundedRect(bx, y + 2, 230, 34, 4).fill(RED);
  label("PO total", bx + 12, y + 16, { color: "#ffffff", size: 8 });
  text(whole(t.grandTotal), bx + 80, y + 9, { size: 16, bold: true, color: "#ffffff", width: 140, align: "right", lineBreak: false });
  y += 42;
  const words = amountInWords(t.grandTotal);
  text(words, bx - 60, y, { size: 7.5, color: MUTED, width: 286, align: "right" });
  y = Math.max(leftEnd, y + hOf(words, 286, 7.5)) + 12;

  }

  // terms
  const terms = (purchase.terms || []).filter(Boolean);
  if (terms.length) {
    const h = terms.reduce((a2, x) => a2 + hOf(x, W - 16, 7.5) + 3, 16);
    if (y + h > BOTTOM - 40) {
      doc.addPage();
      y = 44;
    }
    label("Terms of this purchase order", M, y, { color: RED, size: 7 });
    y += 13;
    terms.forEach((x, i) => {
      text(`${i + 1}.`, M, y, { size: 7.5, color: MUTED, width: 14, lineBreak: false });
      text(x, M + 16, y, { size: 7.5, width: W - 16, color: "#444" });
      y += hOf(x, W - 16, 7.5) + 3;
    });
    y += 6;
  }

  // signatures
  if (y + 30 > BOTTOM - 8) {
    doc.addPage();
    y = 44;
  }
  const sy = Math.max(y + 30, BOTTOM - 26);
  const sw = (W - 32) / 3;
  [
    ["Prepared by", creator ? creator.name || creator.username : null],
    ["Approved by", null],
    [`For ${brand}`, "Authorised signatory"],
  ].forEach(([k, v], i) => {
    const x = M + i * (sw + 16);
    doc.moveTo(x, sy).lineTo(x + sw, sy).lineWidth(0.7).strokeColor("#9a9a9a").stroke();
    label(k, x, sy + 6, { width: sw });
    if (v) text(v, x, sy - 14, { size: 8.5, width: sw, lineBreak: false, color: i === 2 ? MUTED : INK });
  });

  // footer
  const range = doc.bufferedPageRange();
  for (let i = range.start; i < range.start + range.count; i++) {
    doc.switchToPage(i);
    text([brand, `Purchase order ${ref}`, vendor.vendorName].filter(Boolean).join(" · "), M, A4.h - 30, { size: 6.5, width: 380, lineBreak: false, ellipsis: true });
    text(`${i - range.start + 1} / ${range.count}`, A4.w - M - 60, A4.h - 30, { size: 6.5, width: 60, align: "right", lineBreak: false });
  }
  doc.end();
  return { buffer: await done, filename: `PO-${ref}.pdf`, totals: t };
}

module.exports = { buildPoPdf, renderPoPdf };
