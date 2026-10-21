// Gate pass for one dispatch, in the same format as the quotation: what leaves
// the godown, for whom, on which vehicle, with a tick column for checking the
// load and four signatures. Opened by a signed link (and its QR code) so the
// guard can check it on a phone without logging in.
//
//   buildGatePass(dispatchId) → { buffer, filename }
//   gatePassLink(dispatch)    → signed URL
//   renderGatePass(data)      → { buffer, filename }   (no database; used by the sample script)
const path = require('path');
const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');
const { getSetting } = require('../settings/settings.service');

const ASSETS = path.join(__dirname, '../../assets');
const LOGO_RED = path.join(ASSETS, 'quotation/logo-red.png');
const A4 = { w: 595.28, h: 841.89 };
const M = 40;
const W = A4.w - M * 2;
const INK = '#1a1a1a';
const MUTED = '#8a8a8a';
const RULE = '#e2e2e2';
const RED = '#D7232F';
const BOTTOM = A4.h - 60;

const fmtDate = (d) =>
  new Date(d || Date.now()).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'Asia/Kolkata',
  });
const fmtTime = (d) =>
  new Date(d || Date.now()).toLocaleTimeString('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'Asia/Kolkata',
  });
const asList = (v) => {
  let x = v;
  for (let i = 0; i < 3 && typeof x === 'string'; i++) {
    try {
      x = JSON.parse(x);
    } catch {
      return [];
    }
  }
  return Array.isArray(x) ? x : [];
};
const clean = (s) => (s && s !== '--' ? s : null);

function gatePassLink(dispatch) {
  const { signShare } = require('../../lib/shareToken');
  const base = (
    process.env.PUBLIC_BACKEND_URL || `http://localhost:${process.env.PORT || 5050}`
  ).replace(/\/+$/, '');
  return `${base}/api/public/gp/${signShare({ t: 'gp', id: dispatch.id }, 365 * 8)}.pdf`;
}

async function buildGatePass(dispatchId) {
  const {
    OrderDispatch,
    Order,
    Customer,
    Address,
    Product,
    TaxInvoice,
    Quotation,
    User,
  } = require('../../models');
  const d = await OrderDispatch.findByPk(dispatchId);
  if (!d) throw Object.assign(new Error('Dispatch not found'), { status: 404 });
  const order = await Order.findByPk(d.orderId);
  const [customer, ship, company, invoice, quotation, by] = await Promise.all([
    order?.createdFor
      ? Customer.findByPk(order.createdFor, {
          attributes: ['name', 'gender', 'mobileNumber', 'companyName'],
        })
      : null,
    order?.shipTo ? Address.findByPk(order.shipTo) : null,
    getSetting('company'),
    TaxInvoice
      ? TaxInvoice.findOne({
          where: { dispatchId: d.id, status: 'ISSUED' },
          attributes: ['invoiceNo'],
        }).catch(() => null)
      : null,
    order?.quotationId
      ? Quotation.findByPk(order.quotationId, { attributes: ['reference_number'] })
      : null,
    d.dispatchedBy
      ? User.findByPk(d.dispatchedBy, { attributes: ['name', 'username'] }).catch(() => null)
      : null,
  ]);
  const items = asList(d.items);
  const ids = [...new Set(items.map((i) => i.productId).filter(Boolean))];
  const products = ids.length
    ? await Product.findAll({
        where: { productId: ids },
        attributes: ['productId', 'name', 'product_code'],
        raw: true,
      })
    : [];
  const P = Object.fromEntries(products.map((p) => [p.productId, p]));
  return renderGatePass({
    company,
    dispatch: d.toJSON(),
    order: order?.toJSON() || {},
    customer: customer?.toJSON() || null,
    ship: ship?.toJSON() || null,
    invoiceNo: invoice?.invoiceNo || null,
    quotationRef: quotation?.reference_number || null,
    issuedBy: by ? by.name || by.username : null,
    lines: items.map((it) => ({
      name: P[it.productId]?.name || it.name || 'Item',
      code: P[it.productId]?.product_code || it.productCode || '',
      quantity: Number(it.quantity) || 0,
    })),
    link: gatePassLink(d),
  });
}

async function renderGatePass({
  company,
  dispatch: d,
  order = {},
  customer,
  ship,
  invoiceNo,
  quotationRef,
  issuedBy,
  lines,
  link,
}) {
  const { customerName } = require('../quotations/quotation-pdf');
  const brand = company.brandName || company.name || '';
  const gpNo = `GP-${d.orderNo}-${d.dispatchNumber}`;
  const client = customerName(customer) || '—';

  const doc = new PDFDocument({
    size: 'A4',
    margin: 0,
    bufferPages: true,
    info: { Title: `Gate pass ${gpNo}` },
  });
  const chunks = [];
  doc.on('data', (c) => chunks.push(c));
  const done = new Promise((resolve) => doc.on('end', () => resolve(Buffer.concat(chunks))));
  doc.registerFont('R', path.join(ASSETS, 'fonts/Inter-Regular.otf'));
  doc.registerFont('B', path.join(ASSETS, 'fonts/Inter-SemiBold.otf'));
  const t = (s, x, y, o = {}) =>
    doc
      .font(o.bold ? 'B' : 'R')
      .fontSize(o.size || 9)
      .fillColor(o.color || INK)
      .text(String(s ?? ''), x, y, {
        width: o.width,
        align: o.align,
        lineBreak: o.lineBreak !== false,
        characterSpacing: o.spacing || 0,
        ellipsis: o.ellipsis,
        height: o.height,
      });
  const label = (s, x, y, o = {}) =>
    t(String(s).toUpperCase(), x, y, {
      size: o.size || 6.5,
      color: o.color || MUTED,
      spacing: 0.9,
      width: o.width,
      align: o.align,
      lineBreak: false,
    });
  const rule = (y, o = {}) =>
    doc
      .moveTo(o.x1 ?? M, y)
      .lineTo(o.x2 ?? M + W, y)
      .lineWidth(o.w || 0.5)
      .strokeColor(o.color || RULE)
      .stroke();
  const hOf = (s, width, size = 8.5) =>
    doc
      .font('R')
      .fontSize(size)
      .heightOfString(String(s || ''), { width });

  // header
  let y = 44;
  try {
    doc.image(LOGO_RED, M, y, { height: 32 });
  } catch {
    t(brand, M, y + 6, { size: 16, bold: true, color: RED });
  }
  t('Gate pass', A4.w - M - 220, y - 2, { size: 19, bold: true, width: 220, align: 'right' });
  const meta = [
    ['No.', gpNo],
    ['Date', fmtDate(d.dispatchDate || d.createdAt)],
    ['Time out', fmtTime(d.dispatchDate || d.createdAt)],
  ];
  let my = y + 26;
  for (const [k, v] of meta) {
    t(k, A4.w - M - 220, my, { size: 8, color: MUTED, width: 120, align: 'right' });
    t(v, A4.w - M - 92, my, { size: 8, bold: true, width: 92, align: 'right' });
    my += 12;
  }
  y = Math.max(my, y + 62) + 6;
  rule(y, { color: RED, w: 1 });
  y += 18;

  // deliver to · references
  const half = W / 2 - 10;
  label('Deliver to', M, y);
  label('References', A4.w - M - half, y, { width: half, align: 'right' });
  let ly = y + 12;
  t(client, M, ly, { size: 12.5, bold: true, width: half });
  ly += hOf(client, half, 12.5) + 3;
  const addr = ship
    ? [clean(ship.street), clean(ship.city), clean(ship.state), clean(ship.postalCode)]
        .filter(Boolean)
        .join(', ')
    : null;
  for (const l of [addr, customer?.mobileNumber].filter(Boolean)) {
    t(l, M, ly, { size: 8.5, width: half });
    ly += hOf(l, half) + 3;
  }
  let ry = y + 13;
  const refs = [
    ['Order', `#${d.orderNo}`],
    [
      'Dispatch',
      `${d.dispatchNumber}${order.status === 'PARTIALLY_DISPATCHED' ? ' (part delivery)' : ''}`,
    ],
    ['Tax invoice', invoiceNo || (d.invoiceLink ? 'Attached' : null)],
    ['Quotation', quotationRef],
  ].filter(([, v]) => v);
  for (const [k, v] of refs) {
    t(k, A4.w - M - half, ry, { size: 8.5, color: MUTED, width: half - 110, align: 'right' });
    t(v, A4.w - M - 104, ry, { size: 8.5, bold: true, width: 104, align: 'right' });
    ry += 14;
  }
  y = Math.max(ly, ry) + 16;

  // transport
  const boxes = [
    ['Vehicle no.', d.vehicleNo],
    ['Driver', [d.driverName, d.driverPhone].filter(Boolean).join(' · ')],
    ['Transporter', d.transporter || d.carrier],
    ['LR no.', d.lrNumber || d.trackingNumber],
    ['E-way bill', d.ewayBillNo],
  ];
  const bw = W / boxes.length;
  doc.rect(M, y, W, 50).fill('#f6f6f6');
  boxes.forEach(([k, v], i) => {
    const x = M + i * bw;
    if (i)
      doc
        .moveTo(x, y + 8)
        .lineTo(x, y + 42)
        .lineWidth(0.5)
        .strokeColor(RULE)
        .stroke();
    label(k, x + 10, y + 9, { width: bw - 16 });
    t(v || '—', x + 10, y + 21, {
      size: 8.5,
      bold: Boolean(v),
      color: v ? INK : MUTED,
      width: bw - 16,
      height: 22,
      ellipsis: true,
    });
  });
  y += 66;

  // items
  const cols = [
    { k: 'no', l: '#', x: M, w: 26 },
    { k: 'name', l: 'Product', x: M + 26, w: 300 },
    { k: 'code', l: 'Code', x: M + 326, w: 95 },
    { k: 'qty', l: 'Qty', x: M + 421, w: 50, a: 'right' },
    { k: 'chk', l: 'Checked', x: M + 471, w: W - 471, a: 'center' },
  ];
  const head = () => {
    for (const c of cols)
      label(c.l, c.x + (c.a === 'right' ? 0 : 3), y + 8, { width: c.w - 3, align: c.a || 'left' });
    y += 22;
    rule(y);
  };
  label('Items leaving the godown', M, y, { color: RED, size: 7 });
  y += 10;
  head();
  let total = 0;
  lines.forEach((it, i) => {
    const nh = hOf(it.name, 292);
    const h = Math.max(26, nh + 14);
    if (y + h > BOTTOM - 150) {
      doc.addPage();
      y = 44;
      label(`Gate pass ${gpNo} (contd.)`, M, y);
      y += 12;
      head();
    }
    const mid = y + h / 2;
    t(String(i + 1), M + 3, mid - 5, { size: 8.5, color: MUTED, lineBreak: false });
    t(it.name, M + 29, mid - nh / 2, { size: 8.5, width: 292 });
    t(it.code || '—', M + 329, mid - 5, {
      size: 8.5,
      color: MUTED,
      width: 90,
      lineBreak: false,
      ellipsis: true,
    });
    t(Number(it.quantity).toLocaleString('en-IN'), M + 421, mid - 5, {
      size: 9,
      bold: true,
      width: 47,
      align: 'right',
      lineBreak: false,
    });
    doc
      .rect(M + 471 + (W - 471) / 2 - 5, mid - 5, 10, 10)
      .lineWidth(0.7)
      .strokeColor('#b5b5b5')
      .stroke();
    total += Number(it.quantity) || 0;
    y += h;
    rule(y, { color: '#ececec' });
  });
  t(`${lines.length} line${lines.length === 1 ? '' : 's'}`, M + 26, y + 9, {
    size: 8.5,
    color: MUTED,
    lineBreak: false,
  });
  t('Total pieces', M + 300, y + 9, { size: 9, width: 115, align: 'right', lineBreak: false });
  t(total.toLocaleString('en-IN'), M + 421, y + 8, {
    size: 11,
    bold: true,
    color: RED,
    width: 47,
    align: 'right',
    lineBreak: false,
  });
  y += 34;

  // notes + QR
  if (y > BOTTOM - 150) {
    doc.addPage();
    y = 44;
  }
  const notes = [
    d.remarks,
    'Please check the goods against this list before signing. Count and condition are confirmed at the time of loading.',
    'This is not a tax invoice. Goods may leave the premises only with this gate pass.',
  ].filter(Boolean);
  let qrOk = false;
  if (link) {
    try {
      const png = await QRCode.toBuffer(link, { margin: 0, width: 200 });
      doc.image(png, A4.w - M - 64, y, { width: 64 });
      t('Scan to verify', A4.w - M - 74, y + 68, {
        size: 6.5,
        color: MUTED,
        width: 84,
        align: 'center',
      });
      qrOk = true;
    } catch {
      /* QR is optional */
    }
  }
  label('Notes', M, y, { color: RED, size: 7 });
  let ny = y + 14;
  for (const n of notes) {
    t(n, M, ny, { size: 8, color: n === d.remarks ? INK : MUTED, width: W - (qrOk ? 90 : 0) });
    ny += hOf(n, W - (qrOk ? 90 : 0), 8) + 4;
  }
  y = Math.max(ny, y + (qrOk ? 82 : 0)) + 24;

  // signatures
  const signs = [
    ['Packed by', issuedBy],
    ['Checked by (godown)', null],
    ['Security / guard', null],
    ['Received by (customer)', d.receivedBy],
  ];
  const sw = (W - 3 * 16) / 4;
  const sy = Math.max(y + 30, BOTTOM - 46);
  signs.forEach(([k, v], i) => {
    const x = M + i * (sw + 16);
    if (v) t(v, x, sy - 14, { size: 8.5, width: sw, lineBreak: false, ellipsis: true });
    doc
      .moveTo(x, sy)
      .lineTo(x + sw, sy)
      .lineWidth(0.7)
      .strokeColor('#9a9a9a')
      .stroke();
    label(k, x, sy + 6, { width: sw });
    t('Name, sign & time', x, sy + 16, {
      size: 6.5,
      color: '#b0b0b0',
      width: sw,
      lineBreak: false,
    });
  });

  // footer
  const range = doc.bufferedPageRange();
  for (let i = range.start; i < range.start + range.count; i++) {
    doc.switchToPage(i);
    t(
      [brand, `Gate pass ${gpNo}`, client !== '—' ? client : null].filter(Boolean).join(' · '),
      M,
      A4.h - 30,
      { size: 6.5, width: 380, lineBreak: false, ellipsis: true },
    );
    t(`${i - range.start + 1} / ${range.count}`, A4.w - M - 60, A4.h - 30, {
      size: 6.5,
      width: 60,
      align: 'right',
      lineBreak: false,
    });
  }
  doc.end();
  return { buffer: await done, filename: `GatePass-${gpNo}.pdf` };
}

module.exports = { buildGatePass, gatePassLink, renderGatePass };
