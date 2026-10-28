const { configuredDocumentExportFilename: documentExportFilename } = require('../../lib/documentExportFilename');
// Server-side quotation PDF in the Chhabra Marble format (real text, same
// figures as the screens).
//
//   buildQuotationPdf(quotationId, { style, cover, version }) → { buffer, totals, filename }
//
// Pages: cover photo with the client's name · quotation details and the areas
// covered · one section per room (photo, MRP, discount, rate, amount, room
// subtotal) · quotation summary by room with GST and grand total · inclusions,
// exclusions, terms and payment details. Footer with page numbers.
// "compact" leaves out photos and shows product codes instead.
const path = require('path');
const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');
const { quotationProducts } = require('../../lib/quotationProducts');
const {
  normalizeCharges,
  quotationTotals,
  r2,
  amountInWords,
  inr,
  isOptional,
} = require('../../lib/quotationMath');
const { getSetting } = require('../settings/settings.service');

const models = () => require('../../models');
const ASSETS = path.join(__dirname, '../../assets');
const FONT = path.join(ASSETS, 'fonts/Inter-Regular.otf');
const FONT_BOLD = path.join(ASSETS, 'fonts/Inter-SemiBold.otf');
const LOGO_RED = path.join(ASSETS, 'quotation/logo-red.png');
const LOGO_WHITE = path.join(ASSETS, 'quotation/logo-white.png');
const COVER = path.join(ASSETS, 'quotation/cover.jpg');

const RED = '#D7232F';
const INK = '#1a1a1a';
const MUTED = '#8a8a8a';
const RULE = '#e2e2e2';

const A4 = { w: 595.28, h: 841.89 };
const M = 40; // page margin
const TOP = 44;
const CONTENT_W = A4.w - M * 2;
const FOOTER_H = 24;

const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        timeZone: 'Asia/Kolkata',
      })
    : '';
const addDays = (d, n) => {
  const x = new Date(d || Date.now());
  x.setDate(x.getDate() + Number(n || 0));
  return x;
};
const money = (v) => inr(v, { symbol: false });
const norm = (s) =>
  String(s || '')
    .trim()
    .toLowerCase();

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------
async function loadImage(url) {
  if (!url || typeof url !== 'string') return null;
  try {
    let buf;
    if (/^https?:\/\//i.test(url)) {
      const ctl = new AbortController();
      const timer = setTimeout(() => ctl.abort(), 4000);
      const r = await fetch(url, { signal: ctl.signal });
      clearTimeout(timer);
      if (!r.ok) return null;
      buf = Buffer.from(await r.arrayBuffer());
    } else {
      const local = path.join(__dirname, '../..', url.replace(/^\/+/, ''));
      buf = require('fs').readFileSync(local);
    }
    const sharp = require('sharp');
    return await sharp(buf)
      .resize(160, 160, { fit: 'inside', withoutEnlargement: true })
      .flatten({ background: '#ffffff' })
      .png()
      .toBuffer();
  } catch {
    return null;
  }
}

const firstImage = (images) => {
  let v = images;
  for (let i = 0; i < 3 && typeof v === 'string'; i++) {
    try {
      v = JSON.parse(v);
    } catch {
      return v.startsWith('http') || v.startsWith('/') ? v : null;
    }
  }
  return Array.isArray(v) ? v.find((x) => typeof x === 'string') || null : null;
};

const metaBySlug = (meta, metaDefs) => {
  let m = meta;
  for (let i = 0; i < 3 && typeof m === 'string'; i++) {
    try {
      m = JSON.parse(m);
    } catch {
      m = {};
    }
  }
  const out = {};
  for (const def of metaDefs)
    if (m && m[def.id] != null && m[def.id] !== '') out[def.slug] = m[def.id];
  return out;
};

async function loadQuotation(quotationId, { version } = {}) {
  const { Quotation, Customer, Address, User, Product, Brand, ProductMeta } = models();
  const QuotationItem = require('./models/quotation-item.model');
  const QuotationVersion = require('./models/quotation-version.model');

  const q = await Quotation.findByPk(quotationId);
  if (!q) throw Object.assign(new Error('Quotation not found'), { status: 404 });
  let quotation = q.toJSON();
  let items;
  let versionNo = null;
  if (version) {
    const v = await QuotationVersion.findOne({ quotationId, version: Number(version) }).lean();
    if (!v) throw Object.assign(new Error('Version not found'), { status: 404 });
    quotation = { ...quotation, ...(v.quotationData || {}) };
    items = quotationProducts(v.quotationData?.products, v.quotationItems || []);
    versionNo = Number(version);
  } else {
    const doc = await QuotationItem.findOne({ quotationId }).lean();
    items = quotationProducts(quotation.products, doc?.items || []);
    const latest = await QuotationVersion.findOne({ quotationId })
      .sort({ version: -1 })
      .lean()
      .catch(() => null);
    versionNo = latest?.version ? latest.version + 1 : 1;
  }

  return enrichQuotation(quotation, items, versionNo);
}

/** Customer, address, product photos/codes and room names for a quotation (saved or a draft). */
async function enrichQuotation(quotation, items, versionNo = null) {
  const { Customer, Address, User, Product, Brand, ProductMeta } = models();
  items = withRoomNames(items, quotation.floors);
  const [customer, shipTo, creator] = await Promise.all([
    quotation.customerId ? Customer.findByPk(quotation.customerId) : null,
    quotation.shipTo ? Address.findByPk(quotation.shipTo) : null,
    quotation.createdBy
      ? User.findByPk(quotation.createdBy, {
          attributes: ['name', 'username', 'mobileNumber', 'email'],
        })
      : null,
  ]);
  let billing = null;
  if (customer) {
    const addrs = await Address.findAll({ where: { customerId: customer.customerId } });
    billing =
      addrs.find((a) => a.status === 'BILLING') ||
      addrs.find((a) => a.status === 'PRIMARY') ||
      addrs[0] ||
      null;
  }

  const ids = [...new Set(items.map((i) => i.productId).filter(Boolean))];
  const [products, metaDefs] = await Promise.all([
    ids.length
      ? Product.findAll({
          where: { productId: ids },
          attributes: ['productId', 'name', 'product_code', 'meta', 'images', 'brandId', 'tax'],
        })
      : [],
    ProductMeta.findAll({ attributes: ['id', 'slug', 'title', 'unit'] }),
  ]);
  const brandIds = [...new Set(products.map((p) => p.brandId).filter(Boolean))];
  const brands = brandIds.length
    ? await Brand.findAll({ where: { id: brandIds }, attributes: ['id', 'brandName'] })
    : [];
  const brandName = Object.fromEntries(brands.map((b) => [b.id, b.brandName]));
  const productInfo = Object.fromEntries(
    products.map((p) => {
      const meta = metaBySlug(p.meta, metaDefs);
      return [
        p.productId,
        {
          brand: brandName[p.brandId] || null,
          hsn: meta.hsnCode || null,
          companyCode: meta.companyCode || null,
          image: firstImage(p.images),
          unit: meta.unit || meta.uom || null,
        },
      ];
    }),
  );

  // live stock → delivery estimate per line
  let stockBy = {};
  if (ids.length) {
    const { sequelize } = models();
    const rows = await sequelize
      .query(
        'SELECT productId, SUM(onHand) onHand, SUM(reserved) reserved, SUM(incoming) incoming FROM stock_balances WHERE productId IN (:ids) GROUP BY productId',
        { replacements: { ids }, type: sequelize.QueryTypes.SELECT },
      )
      .catch(() => []);
    stockBy = Object.fromEntries(
      rows.map((r) => [
        r.productId,
        { available: Number(r.onHand) - Number(r.reserved), incoming: Number(r.incoming) },
      ]),
    );
  }

  return {
    quotation,
    items,
    customer: customer?.toJSON() || null,
    shipTo: shipTo?.toJSON() || null,
    billing: billing?.toJSON?.() || null,
    creator: creator?.toJSON() || null,
    productInfo,
    stockBy,
    versionNo,
  };
}

/** Items keep floor/room ids; fill in the names from the quotation's floor plan. */
function withRoomNames(items, floors) {
  let f = floors;
  for (let i = 0; i < 3 && typeof f === 'string'; i++) {
    try {
      f = JSON.parse(f);
    } catch {
      f = [];
    }
  }
  if (!Array.isArray(f) || !f.length) return items;
  const floorName = {};
  const roomName = {};
  for (const fl of f) {
    floorName[fl.floorId] = fl.floorName;
    for (const r of fl.rooms || []) roomName[r.roomId] = r.roomName;
  }
  const fill = (x) => ({
    ...x,
    floorName: x.floorName || floorName[x.floorId] || undefined,
    roomName: x.roomName || roomName[x.roomId] || undefined,
  });
  return items.map((it) => ({
    ...fill(it),
    locations: Array.isArray(it.locations) ? it.locations.map(fill) : it.locations,
  }));
}

// ---------------------------------------------------------------------------
// Drawing helpers
// ---------------------------------------------------------------------------
// Drawing helpers
// ---------------------------------------------------------------------------
function makeDoc() {
  const doc = new PDFDocument({
    size: 'A4',
    margin: 0,
    bufferPages: true,
    info: { Producer: 'CM ERP', Creator: 'CM ERP' },
  });
  doc.registerFont('R', FONT);
  doc.registerFont('B', FONT_BOLD);
  doc.font('R').fillColor(INK);
  return doc;
}

const text = (doc, str, x, y, opts = {}) => {
  doc
    .font(opts.bold ? 'B' : 'R')
    .fontSize(opts.size || 9)
    .fillColor(opts.color || INK)
    .text(str == null ? '' : String(str), x, y, {
      width: opts.width,
      align: opts.align || 'left',
      lineBreak: opts.lineBreak !== false,
      ellipsis: opts.ellipsis,
      height: opts.height,
      characterSpacing: opts.spacing || 0,
      lineGap: opts.lineGap || 0,
    });
};
const heightOf = (doc, str, width, { bold, size = 9, lineGap = 0 } = {}) =>
  doc
    .font(bold ? 'B' : 'R')
    .fontSize(size)
    .heightOfString(String(str || ''), { width, lineGap });
const rule = (doc, y, { color = RULE, x1 = M, x2 = A4.w - M, w = 0.5 } = {}) =>
  doc.moveTo(x1, y).lineTo(x2, y).lineWidth(w).strokeColor(color).stroke();
// small spaced capitals: "PREPARED FOR", column headings
const label = (doc, str, x, y, { color = MUTED, width, align = 'left', size = 6.5 } = {}) =>
  text(doc, String(str).toUpperCase(), x, y, {
    size,
    color,
    width,
    align,
    spacing: 0.9,
    lineBreak: false,
  });
const tick = (doc, x, y, color = RED) =>
  doc
    .save()
    .moveTo(x, y + 3.6)
    .lineTo(x + 2.4, y + 6)
    .lineTo(x + 6.6, y + 1)
    .lineWidth(1.1)
    .strokeColor(color)
    .stroke()
    .restore();

const whole = (v) => inr(Math.round(Number(v) || 0), { decimals: 0 });
const paise = (v) => inr(v);
const pct = (v) => `${Math.round(Number(v) || 0)}%`;
const two = (n) => String(n).padStart(2, '0');

function fillTemplate(str, vars) {
  return String(str || '').replace(/\{(\w+)\}/g, (m, k) => (vars[k] != null ? vars[k] : m));
}

let coverCache = null;
async function coverImage(settings) {
  const custom = settings.coverImage;
  if (custom) {
    try {
      const buf = /^https?:\/\//i.test(custom)
        ? Buffer.from(await (await fetch(custom)).arrayBuffer())
        : require('fs').readFileSync(
            path.join(__dirname, '../..', String(custom).replace(/^\/+/, '')),
          );
      return await require('sharp')(buf)
        .resize(1240, 1754, { fit: 'cover' })
        .jpeg({ quality: 82 })
        .toBuffer();
    } catch {
      /* fall back to the standard cover */
    }
  }
  if (!coverCache) coverCache = require('fs').readFileSync(COVER);
  return coverCache;
}

/** "Mr. Anikant Jain": the customer's name with a title when one is known. */
function customerName(customer) {
  if (!customer) return '';
  const t = { Male: 'Mr.', Female: 'Ms.' }[customer.gender] || '';
  const n = customer.companyName && !customer.name ? customer.companyName : customer.name || '';
  return t && !/^(mr|mrs|ms|dr|miss)\.?\s/i.test(n) ? `${t} ${n}` : n;
}

/** Group lines by room (one row per room for items split across rooms). */
function groupByArea(lines) {
  const floors = new Set();
  for (const l of lines) {
    for (const loc of Array.isArray(l.locations) && l.locations.length ? l.locations : [l])
      if (loc.floorName) floors.add(loc.floorName);
  }
  const name = (loc) => {
    if (!loc || (!loc.roomName && !loc.floorName)) return null;
    if (!loc.roomName) return loc.floorName;
    return floors.size > 1 && loc.floorName ? `${loc.floorName} · ${loc.roomName}` : loc.roomName;
  };
  const rows = [];
  // These are calculated lines: `discount` is already a money amount, not the
  // original percentage/per-unit input. Allocate their values without taxing or
  // discounting them a second time.
  const shareAmounts = (line, quantity) => {
    const share = line.qty ? quantity / line.qty : 0;
    return {
      ...line,
      quantity,
      qty: quantity,
      gross: r2(line.gross * share),
      discount: r2(line.discount * share),
      net: r2(line.net * share),
    };
  };
  for (const l of lines) {
    const locs = Array.isArray(l.locations) && l.locations.length ? l.locations : [null];
    if (locs.length > 1) {
      for (const loc of locs) {
        const q = Number(loc.assignedQuantity) || 0;
        if (q) rows.push({ ...shareAmounts(l, q), area: name(loc) });
      }
      const assigned = locs.reduce((s, loc) => s + (Number(loc.assignedQuantity) || 0), 0);
      if (l.qty - assigned > 0)
        rows.push({ ...shareAmounts(l, l.qty - assigned), area: null });
    } else {
      rows.push({ ...l, area: name(locs[0] || l) });
    }
  }
  const order = [];
  const by = {};
  for (const r of rows) {
    const k = r.area || '';
    if (!by[k]) {
      by[k] = [];
      order.push(k);
    }
    by[k].push(r);
  }
  // unassigned items go last
  const named = order.filter(Boolean);
  const groups = [...named, ...(by[''] ? [''] : [])].map((k) => {
    const rs = by[k];
    const mrp = rs.reduce((s, r) => s + r.gross, 0);
    const net = rs.reduce((s, r) => s + r.net, 0);
    return {
      name: k || (named.length ? 'Other items' : 'Items'),
      rows: rs,
      mrp,
      net,
      discount: mrp - net,
      items: rs.length,
    };
  });
  return { groups, hasAreas: named.length > 0 };
}

// ---------------------------------------------------------------------------
// Layout
// ---------------------------------------------------------------------------
// Item table columns; widths add up to CONTENT_W (515.28)
function itemColumns(withImages, hidden = new Set()) {
  const cols = [
    { key: 'no', label: '#', w: 22, align: 'left' },
    ...(withImages ? [{ key: 'img', label: '', w: 42 }] : []),
    { key: 'product', label: 'Product', w: withImages ? 194.28 : 236.28 },
    { key: 'qty', label: 'Qty', w: 34, align: 'center' },
    { key: 'mrp', label: 'MRP', w: 58, align: 'right' },
    { key: 'disc', label: 'Disc.', w: 38, align: 'right' },
    { key: 'rate', label: 'Rate', w: 61, align: 'right' },
    { key: 'amount', label: 'Amount', w: 66, align: 'right' },
  ];
  const keys = {
    no: 'sno',
    img: 'image',
    qty: 'qty',
    mrp: 'mrp',
    disc: 'discount',
    rate: 'price',
    amount: 'total',
  };
  const visible = cols.filter((c) =>
    c.key === 'product' ? !(hidden.has('name') && hidden.has('code')) : !hidden.has(keys[c.key]),
  );
  const flexible = visible.find((c) => c.key === 'product') || visible[0];
  if (flexible) flexible.w += CONTENT_W - visible.reduce((sum, c) => sum + c.w, 0);
  const product = visible.find((c) => c.key === 'product');
  if (product) product.label = hidden.has('name') ? 'Company code' : 'Product';
  let x = M;
  for (const c of visible) {
    c.x = x;
    x += c.w;
  }
  return visible;
}

function discLabel(r) {
  if (!r.discount) return r.price && r.rate < r.price ? 'Net' : '—';
  if (String(r.discountType || 'percent').toLowerCase() !== 'percent') return 'Net';
  const p = Number(r.discountPercent) || 0;
  return `${p % 1 ? p.toFixed(1) : p}%`;
}

/** Page title used by room, summary and terms pages: "01 Master Bathroom ……… 17 items". */
function pageTitle(doc, y, { no, title, right }) {
  let x = M;
  if (no) {
    text(doc, no, x, y + 3, { size: 12, bold: true, color: RED, lineBreak: false });
    x += doc.widthOfString(no) + 8;
  }
  text(doc, title, x, y, {
    size: 15,
    bold: true,
    width: A4.w - M - x - 150,
    lineBreak: false,
    ellipsis: true,
  });
  if (right)
    text(doc, right, A4.w - M - 150, y + 5, {
      size: 8,
      color: MUTED,
      width: 150,
      align: 'right',
      lineBreak: false,
    });
  rule(doc, y + 26, { color: RED, w: 1 });
  return y + 26;
}

function tableHead(doc, y, cols) {
  for (const c of cols)
    if (c.label)
      label(doc, c.label, c.x + (c.align === 'right' ? 0 : 3), y + 9, {
        width: c.w - 3,
        align: c.align || 'left',
      });
  rule(doc, y + 22);
  return y + 22;
}

// ---------------------------------------------------------------------------
// Build
// ---------------------------------------------------------------------------
async function buildQuotationPdf(
  quotationId,
  { style = 'detailed', cover = null, version = null, exportOptions = {} } = {},
) {
  const [company, settings, data] = await Promise.all([
    getSetting('company'),
    getSetting('quotation'),
    loadQuotation(quotationId, { version }),
  ]);
  return renderQuotationPdf(data, { company, settings, style, cover, exportOptions });
}

/**
 * Draws the PDF from already-loaded data (also used by the sample script).
 *   style  detailed (photos) | compact (no photos, with product codes) | areawise (= detailed)
 *   cover  true / false; null uses the "cover page" setting (on by default)
 */
async function renderQuotationPdf(
  data,
  {
    company,
    settings,
    style = 'detailed',
    cover = null,
    exportOptions = {},
    documentLabel = 'Quotation',
  },
) {
  const { quotation, items, customer, shipTo, billing, creator, productInfo, versionNo } = data;
  style = ['detailed', 'compact', 'areawise'].includes(style) ? style : 'detailed';
  const hidden = new Set(Array.isArray(exportOptions?.hidden) ? exportOptions.hidden : []);
  const withImages = style !== 'compact' && !hidden.has('image');
  const showCover = cover == null ? settings.showCoverPage !== false : Boolean(cover);
  const brand = company.brandName || company.name || '';

  const site = shipTo || billing;
  const interState = Boolean(
    site?.state && company.state && norm(site.state) !== norm(company.state),
  );
  const totals = quotationTotals({
    items,
    extraDiscount: quotation.extraDiscount,
    extraDiscountType: quotation.extraDiscountType,
    shipping: quotation.shippingAmount,
    miscellaneousCharges: quotation.miscellaneousCharges,
    miscellaneousChargeItems: quotation.miscellaneousChargeItems,
    additionalDiscount: quotation.additionalDiscount,
    flatPrice: quotation.flatPrice,
    gstRate: quotation.gst,
    interState,
    discountMode: quotation.discountMode,
    gstBasis: quotation.gstBasis ?? (quotation.gstInclusive ? 'inclusive' : null),
  });
  const { groups, hasAreas } = groupByArea(totals.lines);
  const qDate = quotation.quotation_date || quotation.createdAt;
  const validDays = Number(settings.validityDays) || 15;
  const validTill = quotation.due_date || addDays(qDate, validDays);
  const ref = quotation.reference_number || 'Quotation';
  const client = customerName(customer);
  const vars = {
    validityDays: validDays,
    validTill: fmtDate(validTill),
    gst: totals.gstRate,
    company: brand,
  };

  const images = {};
  if (withImages) {
    const urls = {};
    for (const it of totals.lines.concat(totals.optionalLines)) {
      const url = it.imageUrl || productInfo[it.productId]?.image;
      if (url && !urls[it.productId]) urls[it.productId] = url;
    }
    await Promise.all(
      Object.entries(urls).map(async ([pid, url]) => (images[pid] = await loadImage(url))),
    );
  }

  const doc = makeDoc();
  const chunks = [];
  doc.on('data', (c) => chunks.push(c));
  const done = new Promise((resolve) => doc.on('end', () => resolve(Buffer.concat(chunks))));
  const bottom = A4.h - FOOTER_H - 20;
  let first = true;
  let pageLabel = 'Cover page';
  const pageLabels = [];
  const newPage = () => {
    if (!first) doc.addPage();
    first = false;
    pageLabels.push(pageLabel);
    return TOP;
  };

  // ---------------- cover ----------------
  if (showCover) {
    newPage();
    try {
      doc.image(await coverImage(settings), 0, 0, {
        cover: [A4.w, A4.h],
        align: 'center',
        valign: 'center',
      });
    } catch {
      doc.rect(0, 0, A4.w, A4.h).fill('#2b2622');
    }
    const shade = doc.linearGradient(0, A4.h * 0.55, 0, A4.h);
    shade.stop(0, '#000000', 0).stop(1, '#000000', 0.55);
    doc.rect(0, A4.h * 0.55, A4.w, A4.h * 0.45).fill(shade);
    try {
      doc.image(LOGO_WHITE, 50, 50, { height: 36 });
    } catch {
      text(doc, brand, 50, 54, { size: 18, bold: true, color: '#ffffff' });
    }
    const nameSize = client.length > 26 ? 22 : 28;
    const ny = A4.h - 102;
    const tag = `${documentLabel.toUpperCase()} FOR`;
    doc.font('R').fontSize(7);
    const tw = doc.widthOfString(tag, { characterSpacing: 1.8 }) + 14;
    doc.rect(50, ny - 26, tw, 15).fill(RED);
    text(doc, tag, 57, ny - 22, { size: 7, color: '#ffffff', spacing: 1.8, lineBreak: false });
    text(doc, client || quotation.document_title || '', 50, ny, {
      size: nameSize,
      bold: true,
      color: '#ffffff',
      width: A4.w - 100,
      height: nameSize * 1.3,
      ellipsis: true,
    });
    const coverSub = [client ? quotation.document_title : null, `${ref} · ${fmtDate(qDate)}`]
      .filter(Boolean)
      .join('   ·   ');
    text(doc, coverSub, 50, ny + nameSize * 1.25 + 4, {
      size: 8.5,
      color: '#e8e8e8',
      width: A4.w - 100,
      lineBreak: false,
      ellipsis: true,
    });
    doc.rect(0, A4.h - 12, A4.w, 12).fill(RED);
  }

  // ---------------- details page ----------------
  pageLabel = 'Product list';
  let y = newPage();
  try {
    doc.image(LOGO_RED, M, y, { height: 32 });
  } catch {
    text(doc, brand, M, y + 6, { size: 16, bold: true, color: RED });
  }
  text(doc, documentLabel, A4.w - M - 200, y - 2, {
    size: 19,
    bold: true,
    width: 200,
    align: 'right',
  });
  const meta = [
    ['No.', `${ref}${versionNo > 1 ? ` · rev ${versionNo - 1}` : ''}`],
    ['Date', fmtDate(qDate)],
    ['Valid until', fmtDate(validTill)],
  ];
  let my = y + 26;
  for (const [k, v] of meta) {
    text(doc, k, A4.w - M - 200, my, { size: 8, color: MUTED, width: 110, align: 'right' });
    text(doc, v, A4.w - M - 82, my, { size: 8, bold: true, width: 82, align: 'right' });
    my += 12;
  }
  y = Math.max(my, y + 62) + 6;
  rule(doc, y, { color: RED, w: 1 });
  y += 18;

  // prepared for / from
  const half = CONTENT_W / 2 - 10;
  label(doc, 'Prepared for', M, y);
  label(doc, 'From', A4.w - M - half, y, { width: half, align: 'right' });
  let ly = y + 12;
  text(doc, client || '—', M, ly, { size: 12.5, bold: true, width: half });
  ly += heightOf(doc, client || '—', half, { size: 12.5, bold: true }) + 3;
  const siteLines = [
    site && [site.street, site.city].filter(Boolean).join(', '),
    site && !site.city && site.state ? site.state : null,
    customer?.mobileNumber,
  ].filter(Boolean);
  for (const l of siteLines) {
    text(doc, l, M, ly, { size: 8.5, width: half });
    ly += heightOf(doc, l, half, { size: 8.5 }) + 3;
  }
  if (quotation.document_title) {
    ly += 1;
    text(doc, quotation.document_title, M, ly, { size: 8.5, color: MUTED, width: half });
    ly += heightOf(doc, quotation.document_title, half, { size: 8.5 }) + 3;
  }
  let ry = y + 13;
  const fromLines = [
    brand,
    company.address,
    [company.phone, String(company.website || '').replace(/^https?:\/\/(www\.)?/i, '')]
      .filter(Boolean)
      .join(' · '),
    company.gstin ? `GSTIN ${company.gstin}` : null,
  ].filter(Boolean);
  for (const [i, l] of fromLines.entries()) {
    text(doc, l, A4.w - M - half, ry, {
      size: 8.5,
      width: half,
      align: 'right',
      color: i === fromLines.length - 1 && creator ? MUTED : INK,
    });
    ry += heightOf(doc, l, half, { size: 8.5 }) + 3;
  }
  y = Math.max(ly, ry) + 20;

  // at a glance: what the customer looks for first
  {
    const glance = [
      ['Products', String(totals.lines.length)],
      ...(hasAreas ? [['Areas', String(groups.length)]] : []),
      ...(!hidden.has('discount') && !hidden.has('mrp')
        ? [
            [
              'You save',
              totals.mrpValue
                ? `${Math.round(((totals.lineDiscount + totals.extraDiscountAmount) / totals.mrpValue) * 100)}% on MRP`
                : '—',
            ],
          ]
        : []),
      ['Valid until', fmtDate(validTill)],
      ...(!hidden.has('total') ? [['Grand total', whole(totals.grandTotal)]] : []),
    ];
    const gw = CONTENT_W / glance.length;
    doc.roundedRect(M, y, CONTENT_W, 46, 6).fill('#f7f7f7');
    glance.forEach(([k, v], i) => {
      const x = M + i * gw;
      if (i)
        doc
          .moveTo(x, y + 9)
          .lineTo(x, y + 37)
          .lineWidth(0.5)
          .strokeColor(RULE)
          .stroke();
      label(doc, k, x + 12, y + 10, { width: gw - 18 });
      text(doc, v, x + 12, y + 23, {
        size: i === glance.length - 1 ? 11 : 10,
        bold: true,
        color: i === glance.length - 1 ? RED : INK,
        width: gw - 18,
        lineBreak: false,
        ellipsis: true,
      });
    });
    y += 66;
  }

  const cols = itemColumns(withImages, hidden);
  const rowsTable = (group, { no, startY }) => {
    if (!cols.length) return startY;
    let ty = startY;
    let rowsOnPage = 0;
    const head = (contd) => {
      ty = pageTitle(doc, ty, {
        no,
        title: `${group.name}${contd ? ' (contd.)' : ''}`,
        right: `${group.items} item${group.items === 1 ? '' : 's'}`,
      });
      ty = tableHead(doc, ty, cols);
    };
    head(false);
    group.rows.forEach((r, i) => {
      const info = productInfo[r.productId] || {};
      const pc = cols.find((c) => c.key === 'product');
      const code = hidden.has('code')
        ? ''
        : [r.companyCode || info.companyCode || r.productCode || '', withImages ? info.brand : null]
            .filter(Boolean)
            .join(' · ');
      const nameH =
        hidden.has('name') || !pc ? 0 : heightOf(doc, r.name || 'Item', pc.w - 8, { size: 8.5 });
      const h = Math.max(withImages ? 45 : 26, nameH + (code ? 10 : 0) + 16);
      // Reserve the room totals beneath the final row so they cannot orphan a page.
      const totalsHeight = i === group.rows.length - 1 && !hidden.has('roomTotals') ? 36 : 0;
      if (rowsOnPage >= 12 || ty + h + totalsHeight > bottom) {
        ty = newPage();
        rowsOnPage = 0;
        head(true);
      }
      const mid = ty + h / 2;
      for (const c of cols) {
        if (c.key === 'img') {
          let drawn = false;
          if (images[r.productId]) {
            try {
              doc.image(images[r.productId], c.x + 4, ty + 5, {
                fit: [34, h - 10],
                align: 'center',
                valign: 'center',
              });
              drawn = true;
            } catch {
              /* skip a bad image */
            }
          }
          if (!drawn) {
            // a quiet placeholder keeps the column even
            doc.roundedRect(c.x + 6, mid - 15, 30, 30, 4).fill('#f3f3f3');
            text(
              doc,
              String(r.name || '?')
                .trim()
                .charAt(0)
                .toUpperCase(),
              c.x + 6,
              mid - 6,
              { size: 10, color: '#c4c4c4', width: 30, align: 'center', lineBreak: false },
            );
          }
          continue;
        }
        if (c.key === 'product') {
          const block = nameH + (code ? 10 : 0);
          if (!hidden.has('name'))
            text(doc, r.name || 'Item', c.x + 4, mid - block / 2, { size: 8.5, width: c.w - 8 });
          if (code)
            text(doc, code, c.x + 4, mid - block / 2 + nameH + 1, {
              size: 7,
              color: MUTED,
              width: c.w - 8,
              lineBreak: false,
            });
          continue;
        }
        const val = {
          no: String(i + 1),
          qty: Number(r.qty).toLocaleString('en-IN'),
          mrp: whole(r.price),
          disc: discLabel(r),
          rate: paise(r.rate),
          amount: paise(r.net),
        }[c.key];
        const color = c.key === 'no' || c.key === 'mrp' || c.key === 'disc' ? MUTED : INK;
        text(doc, val, c.x + (c.align === 'right' ? 0 : 3), mid - 5, {
          size: 8.5,
          width: c.w - (c.align === 'right' ? 3 : 6),
          align: c.align || 'left',
          color,
          bold: c.key === 'amount',
          lineBreak: false,
        });
      }
      ty += h;
      rowsOnPage++;
      rule(doc, ty, { color: '#ececec' });
    });
    if (hidden.has('roomTotals')) return ty + 8;
    if (ty + 34 > bottom) ty = newPage();
    const subtotal = [
      !hidden.has('mrp') && `MRP ${whole(group.mrp)}`,
      !hidden.has('discount') && `Discount ${whole(group.discount)}`,
      !hidden.has('total') && `Subtotal (excl. GST) ${whole(group.net)}`,
    ]
      .filter(Boolean)
      .join('     ');
    text(doc, subtotal, M, ty + 10, {
      size: 9,
      width: CONTENT_W,
      align: 'right',
      lineBreak: false,
    });
    return ty + 36;
  };

  if (hasAreas) {
    label(doc, 'Areas covered', M, y, { color: RED, size: 7 });
    y += 16;
    label(doc, '#', M, y + 6);
    label(doc, 'Area', M + 40, y + 6);
    label(doc, 'Items', A4.w - M - 60, y + 6, { width: 57, align: 'right' });
    y += 20;
    rule(doc, y);
    for (const [i, g] of groups.entries()) {
      if (y + 24 > bottom) {
        y = newPage();
      }
      text(doc, two(i + 1), M, y + 8, { size: 9.5, color: RED, lineBreak: false });
      text(doc, g.name, M + 40, y + 8, {
        size: 9.5,
        width: CONTENT_W - 120,
        lineBreak: false,
        ellipsis: true,
      });
      text(doc, String(g.items), A4.w - M - 60, y + 8, {
        size: 9.5,
        width: 57,
        align: 'right',
        lineBreak: false,
      });
      y += 25;
      rule(doc, y);
    }
    y += 12;
    text(
      doc,
      `Room-wise product details follow, with the complete ${documentLabel.toLowerCase()} summary, inclusions and exclusions after the last room.`,
      M,
      y,
      { size: 8, color: MUTED, width: CONTENT_W },
    );
    groups.forEach((g, i) => {
      pageLabel = g.name;
      rowsTable(g, { no: two(i + 1), startY: newPage() });
    });
  } else {
    // no rooms: the items follow the customer details on the same page
    for (const g of groups) y = rowsTable(g, { no: null, startY: y + 4 }) + 12;
  }

  pageLabel = `${documentLabel} summary`;
  // ---------------- summary ----------------
  y = pageTitle(doc, newPage(), {
    title: `${documentLabel} summary`,
    right: `${ref} · ${fmtDate(qDate)}`,
  });
  if (groups.length > 1 || hasAreas) {
    const sc = [
      { label: 'Area', x: M, w: 200, align: 'left' },
      { label: 'Items', x: M + 200, w: 60, align: 'center' },
      { label: 'MRP value', x: M + 260, w: 85, align: 'right' },
      { label: 'Discount', x: M + 345, w: 80, align: 'right' },
      { label: 'Net amount', sub: '(excl. GST)', x: M + 425, w: 90.28, align: 'right' },
    ]
      .map((c, index) => ({ ...c, index }))
      .filter((c) => !hidden.has([null, 'qty', 'mrp', 'discount', 'total'][c.index]));
    let summaryX = M;
    const available = sc.reduce((sum, c) => sum + c.w, 0);
    for (const c of sc) {
      c.w *= CONTENT_W / available;
      c.x = summaryX;
      summaryX += c.w;
    }
    y += 6;
    for (const c of sc) {
      label(doc, c.label, c.x + (c.align === 'left' ? 4 : 0), c.sub ? y + 3 : y + 8, {
        width: c.w - 4,
        align: c.align,
      });
      if (c.sub) label(doc, c.sub, c.x, y + 12, { width: c.w - 4, align: c.align });
    }
    y += 24;
    rule(doc, y);
    for (const g of groups) {
      if (y + 24 > bottom) y = newPage();
      const vals = [g.name, String(g.items), whole(g.mrp), `−${whole(g.discount)}`, whole(g.net)];
      sc.forEach((c, i) =>
        text(doc, vals[c.index], c.x + (c.align === 'left' ? 4 : 0), y + 8, {
          size: 9,
          width: c.w - 4,
          align: c.align,
          color: i === 3 ? MUTED : INK,
          bold: i === 4,
          lineBreak: false,
          ellipsis: true,
        }),
      );
      y += 24;
      rule(doc, y);
    }
    y += 14;
  } else {
    y += 16;
  }

  if (!hidden.has('total')) {
    const avg = totals.mrpValue ? Math.round((totals.lineDiscount / totals.mrpValue) * 100) : 0;
    const lines = [
      ...(!hidden.has('mrp') ? [['Total MRP value', whole(totals.mrpValue)]] : []),
      ...(!hidden.has('discount') && totals.lineDiscount
        ? [[`Discount (${avg}% average)`, `−${whole(totals.lineDiscount)}`, { color: RED }]]
        : []),
      ...(totals.freight ? [['Freight / installation', whole(totals.freight)]] : []),
      ...normalizeCharges(quotation.miscellaneousChargeItems ?? quotation.miscellaneousCharges).map(
        (row) => [row.name, whole(row.amount)],
      ),
      ...(Number(quotation.additionalDiscount)
        ? [['Additional discount', `−${whole(quotation.additionalDiscount)}`]]
        : []),
      ...(quotation.flatPrice != null ? [['Flat goods price', whole(quotation.flatPrice)]] : []),
      ...(!hidden.has('discount') && totals.extraDiscountAmount
        ? [['Extra discount', `−${whole(totals.extraDiscountAmount)}`, { color: RED }]]
        : []),
      ['Net amount (excl. GST)', whole(totals.taxableValue), { bold: true }],
      ...(totals.gstRate
        ? [
            [
              `${interState ? 'IGST' : 'GST'} @ ${totals.gstRate}%`,
              whole(totals.gstAmount),
              {
                sub: interState
                  ? null
                  : `CGST ${totals.gstRate / 2}% + SGST ${totals.gstRate / 2}%`,
              },
            ],
          ]
        : [['GST', 'Not included']]),
      ...(Math.abs(totals.roundOff) >= 0.01
        ? [
            [
              'Round off',
              `${totals.roundOff < 0 ? '−' : '+'}${paise(Math.abs(totals.roundOff))}`,
              { color: MUTED },
            ],
          ]
        : []),
    ];
    const bx = A4.w - M - 240;
    if (y + lines.length * 18 + 80 > bottom) y = newPage();
    for (const [k, v, o = {}] of lines) {
      text(doc, k, bx + 6, y, {
        size: 9,
        bold: o.bold,
        color: o.color || INK,
        width: 150,
        lineBreak: false,
      });
      text(doc, v, bx + 150, y, {
        size: 9,
        bold: o.bold,
        color: o.color && o.color !== RED ? o.color : o.color === RED ? RED : INK,
        width: 84,
        align: 'right',
        lineBreak: false,
      });
      y += 13;
      if (o.sub) {
        text(doc, o.sub, bx + 6, y - 1, { size: 6.5, color: MUTED, width: 150, lineBreak: false });
        y += 8;
      }
      y += 5;
    }
    doc.roundedRect(bx, y + 2, 240, 36, 4).fill(RED);
    label(doc, 'Grand total', bx + 12, y + 17, { color: '#ffffff', size: 8 });
    text(doc, whole(totals.grandTotal), bx + 90, y + 10, {
      size: 17,
      bold: true,
      color: '#ffffff',
      width: 140,
      align: 'right',
      lineBreak: false,
    });
    y += 46;
    const words = amountInWords(totals.grandTotal);
    text(doc, words, bx - 60, y, { size: 7.5, color: MUTED, width: 296, align: 'right' });
    y += heightOf(doc, words, 296, { size: 7.5 }) + 6;
    const saved = totals.lineDiscount + totals.extraDiscountAmount;
    if (saved > 0 && !hidden.has('discount') && !hidden.has('mrp')) {
      text(doc, `You save ${whole(saved)} on the MRP of ${whole(totals.mrpValue)}`, bx - 60, y, {
        size: 8,
        bold: true,
        color: RED,
        width: 296,
        align: 'right',
      });
      y += 14;
    }
    y += 12;
  }

  if (totals.optionalLines.length) {
    if (y + 40 > bottom) y = newPage();
    label(doc, 'Optional items — not included in the total', M, y, { color: RED, size: 7 });
    y += 16;
    for (const o of totals.optionalLines) {
      const lbl = [
        !hidden.has('name') && (o.name || 'Item'),
        !hidden.has('code') && o.companyCode,
        !hidden.has('qty') && `× ${o.qty}`,
      ]
        .filter(Boolean)
        .join(' ');
      const lh = heightOf(doc, lbl, CONTENT_W - 100, { size: 8.5 });
      if (y + lh + 10 > bottom) y = newPage();
      text(doc, lbl, M, y, { size: 8.5, width: CONTENT_W - 100 });
      if (!hidden.has('total'))
        text(doc, paise(o.net), A4.w - M - 100, y, { size: 8.5, width: 100, align: 'right' });
      y += lh + 6;
      rule(doc, y - 3, { color: '#ececec' });
    }
  }

  pageLabel = 'Terms';
  // ---------------- inclusions, terms & payment ----------------
  y = pageTitle(doc, newPage(), { title: 'Inclusions, terms & payment', right: ref });
  y += 16;
  // a GST line makes no sense on a quotation without GST
  const includes = (settings.includes || [])
    .filter((s) => totals.gstRate || !/\{gst\}/.test(s))
    .map((s) => fillTemplate(s, vars))
    .filter(Boolean);
  const excludes = (settings.excludes || []).map((s) => fillTemplate(s, vars)).filter(Boolean);
  if (includes.length || excludes.length) {
    const cw = CONTENT_W / 2 - 12;
    const col = (title, list, x, mark) => {
      label(doc, title, x, y, { color: RED, size: 7 });
      let cy = y + 16;
      for (const s of list) {
        mark(x, cy);
        text(doc, s, x + 12, cy, { size: 8.5, width: cw - 12 });
        cy += heightOf(doc, s, cw - 12, { size: 8.5 }) + 6;
      }
      return cy;
    };
    const a = col('Price includes', includes, M, (x, cy) => tick(doc, x, cy + 1));
    const b = col('Price excludes', excludes, M + cw + 24, (x, cy) =>
      text(doc, '–', x + 1, cy - 0.5, { size: 8.5, color: MUTED, lineBreak: false }),
    );
    y = Math.max(a, b) + 12;
    rule(doc, y);
    y += 18;
  }
  const terms = (Array.isArray(settings.keyTerms) ? settings.keyTerms : [])
    .map((s) => fillTemplate(s, vars))
    .filter(Boolean);
  if (terms.length) {
    label(doc, 'Terms', M, y, { color: RED, size: 7 });
    y += 16;
    terms.forEach((t, i) => {
      const h = heightOf(doc, t, CONTENT_W - 16, { size: 8.5 });
      if (y + h > bottom) y = newPage();
      text(doc, `${i + 1}.`, M, y, { size: 8.5, width: 14, lineBreak: false });
      text(doc, t, M + 16, y, { size: 8.5, width: CONTENT_W - 16 });
      y += h + 5;
    });
    y += 10;
    rule(doc, y);
    y += 18;
  }
  const pay = [
    ['Account name', company.bankAccountName],
    ['Bank', company.bankName],
    ['Account no.', company.bankAccountNo],
    ['IFSC', company.bankIfsc],
    ['Branch', company.bankBranch],
    ['UPI', company.upiId],
  ].filter(([, v]) => v);
  if (pay.length) {
    if (y + pay.length * 20 + 30 > bottom) y = newPage();
    label(doc, 'Payment details', M, y, { color: RED, size: 7 });
    y += 14;
    const py = y;
    for (const [k, v] of pay) {
      text(doc, k, M, y + 6, { size: 8.5, color: MUTED, width: 100, lineBreak: false });
      text(doc, v, M + 106, y + 6, { size: 8.5, width: 260, lineBreak: false });
      y += 20;
      rule(doc, y, { x2: company.upiId ? A4.w - M - 110 : A4.w - M });
    }
    if (company.upiId) {
      try {
        const upi = `upi://pay?pa=${encodeURIComponent(company.upiId)}&pn=${encodeURIComponent(company.bankAccountName || brand)}&am=${totals.grandTotal.toFixed(2)}&cu=INR&tn=${encodeURIComponent(ref)}`;
        const png = await QRCode.toBuffer(upi, { margin: 0, width: 220 });
        doc.image(png, A4.w - M - 86, py + 6, { width: 86 });
        text(doc, 'Scan to pay with UPI', A4.w - M - 96, py + 98, {
          size: 6.5,
          color: MUTED,
          width: 96,
          align: 'center',
        });
      } catch {
        /* QR is optional */
      }
    }
    y += 16;
  }
  // signatures: ours, and the customer's acceptance (a signed copy confirms the order)
  {
    if (y + 90 > bottom) y = newPage();
    y = Math.max(y + 24, bottom - 64);
    const sw = (CONTENT_W - 40) / 2;
    const ox = M;
    const cx = M + sw + 40;
    if (quotation.signature_image && String(quotation.signature_image).startsWith('data:image')) {
      try {
        doc.image(
          Buffer.from(String(quotation.signature_image).split(',')[1], 'base64'),
          ox,
          y - 6,
          { fit: [110, 40] },
        );
      } catch {
        /* ignore a bad signature */
      }
    }
    rule(doc, y + 38, { x1: ox, x2: ox + sw, color: '#9a9a9a', w: 0.7 });
    label(doc, `For ${brand}`, ox, y + 44, { width: sw });
    text(
      doc,
      [
        quotation.signature_name && quotation.signature_name !== 'CM TRADING CO'
          ? quotation.signature_name
          : creator?.name || 'Authorised signatory',
      ].join(''),
      ox,
      y + 55,
      { size: 8, color: MUTED, width: sw, lineBreak: false },
    );
    rule(doc, y + 38, { x1: cx, x2: cx + sw, color: '#9a9a9a', w: 0.7 });
    label(doc, 'Accepted by the customer', cx, y + 44, { width: sw });
    text(doc, 'Name, signature and date', cx, y + 55, {
      size: 8,
      color: MUTED,
      width: sw,
      lineBreak: false,
    });
  }

  // ---------------- footer (every page but the cover) ----------------
  const range = doc.bufferedPageRange();
  const firstNumbered = range.start + (showCover ? 1 : 0);
  const count = range.start + range.count - firstNumbered;
  for (let i = firstNumbered; i < range.start + range.count; i++) {
    doc.switchToPage(i);
    const fy = A4.h - 30;
    rule(doc, fy - 8, { color: '#efefef' });
    text(doc, [brand, `${documentLabel} ${ref}`, client].filter(Boolean).join(' · '), M, fy, {
      size: 6.5,
      color: INK,
      width: 380,
      lineBreak: false,
      ellipsis: true,
    });
    text(doc, `${i - firstNumbered + 1} / ${count}`, A4.w - M - 60, fy, {
      size: 6.5,
      color: INK,
      width: 60,
      align: 'right',
      lineBreak: false,
    });
  }

  // Keep section names in the PDF itself, even when a proxy strips headers.
  doc.info.Subject = JSON.stringify({ quotationPages: pageLabels });
  doc.end();
  const buffer = await done;
  return {
    buffer,
    totals,
    pageLabels,
    filename: await documentExportFilename({ documentType: documentLabel === 'Order' ? 'order' : 'quotation', customerName: customer.displayName || customer.name || customer.companyName, documentNumber: ref, date: qDate }),
  };
}

/** PDF of a quotation that has not been saved yet (the cart's Preview). */
async function buildDraftQuotationPdf(draft, { style = 'detailed', cover = null } = {}) {
  const items = Array.isArray(draft.products) ? draft.products : [];
  const quotation = {
    ...draft,
    reference_number: draft.reference_number || 'DRAFT',
    createdAt: new Date(),
  };
  const [company, settings, data] = await Promise.all([
    getSetting('company'),
    getSetting('quotation'),
    enrichQuotation(quotation, items, null),
  ]);
  return renderQuotationPdf(data, { company, settings, style, cover });
}

module.exports = {
  groupByArea,
  enrichQuotation,
  buildQuotationPdf,
  buildDraftQuotationPdf,
  renderQuotationPdf,
  loadQuotation,
  customerName,
};
