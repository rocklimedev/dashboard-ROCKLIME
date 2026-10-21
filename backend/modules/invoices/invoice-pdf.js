// GST tax invoice PDF (real text, A4). Everything printed comes from the
// frozen invoice record, so a reprint always matches what was issued.
//
//   buildInvoicePdf(invoiceId) → { buffer, filename }
const path = require('path');
const PDFDocument = require('pdfkit');
const { amountInWords, inr, r2 } = require('../../lib/quotationMath');
const { getSetting } = require('../settings/settings.service');

const ASSETS = path.join(__dirname, '../../assets');
const FONT = path.join(ASSETS, 'fonts/Inter-Regular.otf');
const FONT_BOLD = path.join(ASSETS, 'fonts/Inter-SemiBold.otf');
const LOGO = path.join(ASSETS, 'logo.png');

const RED = '#C8102E';
const INK = '#1f1f1f';
const MUTED = '#6b6b6b';
const RULE = '#d9d9d9';
const TINT = '#f4f4f4';
const A4 = { w: 595.28, h: 841.89 };
const M = 36;
const W = A4.w - M * 2;

const money = (v) => inr(v, { symbol: false });
const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        timeZone: 'Asia/Kolkata',
      })
    : '';
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
const asObj = (v) => {
  let x = v;
  for (let i = 0; i < 3 && typeof x === 'string'; i++) {
    try {
      x = JSON.parse(x);
    } catch {
      return {};
    }
  }
  return x && typeof x === 'object' ? x : {};
};

function makeDoc(title) {
  const doc = new PDFDocument({
    size: 'A4',
    margin: M,
    bufferPages: true,
    info: { Title: title, Producer: 'CM ERP', Creator: 'CM ERP' },
  });
  try {
    doc.registerFont('R', FONT);
    doc.registerFont('B', FONT_BOLD);
  } catch {
    doc.registerFont('R', 'Helvetica');
    doc.registerFont('B', 'Helvetica-Bold');
  }
  return doc;
}
const text = (doc, str, x, y, o = {}) =>
  doc
    .font(o.bold ? 'B' : 'R')
    .fontSize(o.size || 8.5)
    .fillColor(o.color || INK)
    .text(str == null ? '' : String(str), x, y, {
      width: o.width,
      align: o.align || 'left',
      lineBreak: o.lineBreak !== false,
    });
const heightOf = (doc, str, width, { bold, size = 8.5 } = {}) =>
  doc
    .font(bold ? 'B' : 'R')
    .fontSize(size)
    .heightOfString(String(str || ''), { width });
const rule = (doc, y, { color = RULE, x1 = M, x2 = A4.w - M, w = 0.6 } = {}) =>
  doc.moveTo(x1, y).lineTo(x2, y).lineWidth(w).strokeColor(color).stroke();
const label = (doc, s, x, y, width) =>
  text(doc, s.toUpperCase(), x, y, { size: 7, bold: true, color: RED, width });
const addrLines = (a) =>
  a
    ? [a.street, [a.city, a.state, a.postalCode].filter(Boolean).join(', ')].filter(
        (s) => s && s !== '--',
      )
    : [];

const COLS = (() => {
  const base = [
    { key: 'no', label: '#', w: 18 },
    { key: 'product', label: 'Description of goods', w: 183.28 },
    { key: 'hsn', label: 'HSN/SAC', w: 46 },
    { key: 'qty', label: 'Qty', w: 36, align: 'right' },
    { key: 'unit', label: 'Unit', w: 32 },
    { key: 'rate', label: 'Rate', w: 58, align: 'right' },
    { key: 'disc', label: 'Disc', w: 50, align: 'right' },
    { key: 'taxable', label: 'Taxable value', w: 100, align: 'right' },
  ];
  let x = M;
  for (const c of base) {
    c.x = x;
    x += c.w;
  }
  return base;
})();

function header(doc, inv, company) {
  const top = M;
  try {
    doc.image(LOGO, M, top, { height: 38 });
  } catch {
    text(doc, company.name, M, top, { size: 15, bold: true, color: RED });
  }
  const cx = M + 130;
  const cw = 210;
  let y = top - 1;
  text(doc, company.legalName || company.name, cx, y, { bold: true, size: 9.5, width: cw });
  y += 13;
  text(
    doc,
    `GSTIN ${company.gstin || '— (add in Settings)'}${company.stateCode ? ` · State ${company.state} (${company.stateCode})` : ''}`,
    cx,
    y,
    { size: 8, width: cw },
  );
  y += 11;
  if (company.pan) {
    text(doc, `PAN ${company.pan}`, cx, y, { size: 8, width: cw });
    y += 11;
  }
  text(doc, company.address, cx, y, { size: 8, color: MUTED, width: cw });
  y += heightOf(doc, company.address, cw, { size: 8 }) + 1;
  text(doc, [company.phone, company.email, company.website].filter(Boolean).join(' · '), cx, y, {
    size: 8,
    color: MUTED,
    width: cw,
  });
  y += 11;

  const rx = A4.w - M - 165;
  text(doc, 'TAX INVOICE', rx, top - 2, {
    bold: true,
    size: 13,
    color: RED,
    width: 165,
    align: 'right',
  });
  text(doc, 'Original for recipient', rx, top + 14, {
    size: 7.5,
    color: MUTED,
    width: 165,
    align: 'right',
  });
  const rows = [
    ['Invoice no.', inv.invoiceNo],
    ['Date', fmtDate(inv.invoiceDate)],
    ['Order no.', inv.orderNo],
    inv.ewayBillNo ? ['E-way bill', inv.ewayBillNo] : null,
    inv.vehicleNo ? ['Vehicle', inv.vehicleNo] : null,
  ].filter(Boolean);
  let ry = top + 28;
  for (const [k, v] of rows) {
    text(doc, k, rx, ry, { size: 8, color: MUTED, width: 70 });
    text(doc, v, rx + 70, ry, { size: 8, bold: true, width: 95, align: 'right' });
    ry += 11;
  }
  const hb = Math.max(y, ry) + 4;
  rule(doc, hb, { color: INK, w: 0.8 });
  return hb + 8;
}

function parties(doc, y, inv) {
  const bill = asObj(inv.billTo);
  const ship = asObj(inv.shipTo);
  const half = (W - 16) / 2;
  const bx = M;
  const sx = M + half + 16;
  label(doc, 'Bill to', bx, y, half);
  label(doc, 'Ship to / place of supply', sx, y, half);
  let by = y + 11;
  text(doc, bill.name || inv.customerName || 'Customer', bx, by, {
    bold: true,
    size: 9.5,
    width: half,
  });
  by += 13;
  for (const l of [
    ...addrLines(bill.address),
    bill.phone ? `Phone ${bill.phone}` : null,
    `GSTIN ${inv.customerGstin || 'Unregistered'}`,
  ].filter(Boolean)) {
    text(doc, l, bx, by, { size: 8, width: half, color: l.startsWith('GSTIN') ? INK : MUTED });
    by += heightOf(doc, l, half, { size: 8 }) + 1;
  }
  let sy = y + 11;
  text(doc, ship.name || bill.name || '', sx, sy, { bold: true, size: 9.5, width: half });
  sy += 13;
  const pos = `Place of supply: ${inv.placeOfSupply || '—'} · ${inv.interState ? 'IGST' : 'CGST + SGST'}`;
  for (const l of [...addrLines(ship.address), pos]) {
    text(doc, l, sx, sy, { size: 8, width: half, color: l === pos ? INK : MUTED });
    sy += heightOf(doc, l, half, { size: 8 }) + 1;
  }
  return Math.max(by, sy) + 8;
}

function tableHeader(doc, y) {
  doc.rect(M, y, W, 18).fill(TINT);
  for (const c of COLS)
    text(doc, c.label, c.x + 3, y + 5, { bold: true, size: 7.5, width: c.w - 6, align: c.align });
  return y + 20;
}

function lineRow(doc, y, l, i) {
  const name = `${l.name}${l.code ? `\n${l.code}` : ''}`;
  const h = Math.max(heightOf(doc, name, COLS[1].w - 6, { size: 8 }), 10) + 7;
  const cells = {
    no: String(i + 1),
    product: name,
    hsn: l.hsn || '—',
    qty: String(l.qty),
    unit: l.unit || 'PCS',
    rate: money(l.price),
    disc: Number(l.discount) ? money(l.discount) : '—',
    taxable: money(l.taxable),
  };
  for (const c of COLS)
    text(doc, cells[c.key], c.x + 3, y + 4, {
      size: 8,
      width: c.w - 6,
      align: c.align,
      color: c.key === 'hsn' && !l.hsn ? MUTED : INK,
    });
  rule(doc, y + h, { w: 0.4 });
  return y + h;
}

function summary(doc, y, inv) {
  const rows = [
    ['Goods value', money(inv.goodsValue)],
    Number(inv.freight) ? ['Freight', money(inv.freight)] : null,
    Number(inv.discount) ? ['Less discount', `− ${money(inv.discount)}`] : null,
    ['Taxable value', money(inv.taxableValue), true],
    ...(inv.interState
      ? [[`IGST ${r2(inv.gstRate)}%`, money(inv.igst)]]
      : [
          [`CGST ${r2(inv.gstRate / 2)}%`, money(inv.cgst)],
          [`SGST ${r2(inv.gstRate / 2)}%`, money(inv.sgst)],
        ]),
    Number(inv.roundOff)
      ? ['Round off', `${Number(inv.roundOff) > 0 ? '+' : '−'} ${money(Math.abs(inv.roundOff))}`]
      : null,
  ].filter(Boolean);
  const x = A4.w - M - 230;
  let sy = y;
  for (const [k, v, bold] of rows) {
    text(doc, k, x, sy, { size: 8.5, bold, width: 140 });
    text(doc, v, x + 140, sy, { size: 8.5, bold, width: 90, align: 'right' });
    sy += 13;
  }
  doc.rect(x - 6, sy, 236, 22).fill('#fbe9eb');
  text(doc, 'Invoice total', x, sy + 6, { bold: true, size: 10 });
  text(doc, `₹ ${money(inv.total)}`, x + 100, sy + 6, {
    bold: true,
    size: 10,
    width: 130,
    align: 'right',
  });
  sy += 28;
  text(doc, amountInWords(inv.total), x - 6, sy, {
    size: 8,
    color: MUTED,
    width: 236,
    align: 'right',
  });
  sy += heightOf(doc, amountInWords(inv.total), 236, { size: 8 }) + 4;
  return sy;
}

function hsnSummary(doc, y, inv) {
  const lines = asList(inv.lines);
  const by = {};
  for (const l of lines) {
    const k = l.hsn || '—';
    by[k] = r2((by[k] || 0) + Number(l.taxable || 0));
  }
  if (Number(inv.freight))
    by['9965 (freight)'] = r2(
      (by['9965 (freight)'] || 0) +
        Number(inv.taxableValue) -
        lines.reduce((s, l) => s + Number(l.taxable || 0), 0),
    );
  const rate = Number(inv.gstRate) || 0;
  const cols = inv.interState
    ? [
        ['HSN/SAC', 130],
        ['Taxable value', 100],
        [`IGST ${r2(rate)}%`, 100],
        ['Total tax', 100],
      ]
    : [
        ['HSN/SAC', 110],
        ['Taxable value', 90],
        [`CGST ${r2(rate / 2)}%`, 80],
        [`SGST ${r2(rate / 2)}%`, 80],
        ['Total tax', 80],
      ];
  label(doc, 'Tax by HSN', M, y, 200);
  y += 11;
  let x = M;
  doc
    .rect(
      M,
      y,
      cols.reduce((s, c) => s + c[1], 0),
      16,
    )
    .fill(TINT);
  for (const [h, w] of cols) {
    text(doc, h, x + 3, y + 4, {
      bold: true,
      size: 7.5,
      width: w - 6,
      align: h === 'HSN/SAC' ? 'left' : 'right',
    });
    x += w;
  }
  y += 18;
  const rows = Object.entries(by);
  let sum = 0;
  rows.forEach(([hsn, taxable], i) => {
    // last row takes the remainder so the tax column adds up to the invoice
    const tax =
      i === rows.length - 1
        ? r2(Number(inv.cgst) + Number(inv.sgst) + Number(inv.igst) - sum)
        : r2((taxable * rate) / 100);
    sum = r2(sum + tax);
    const half = r2(tax / 2);
    const cells = inv.interState
      ? [hsn, money(taxable), money(tax), money(tax)]
      : [hsn, money(taxable), money(half), money(r2(tax - half)), money(tax)];
    x = M;
    cols.forEach(([, w], j) => {
      text(doc, cells[j], x + 3, y + 2, {
        size: 8,
        width: w - 6,
        align: j === 0 ? 'left' : 'right',
      });
      x += w;
    });
    y += 13;
  });
  return y + 6;
}

function footer(doc, y, { company, accounts }) {
  if (y > A4.h - M - 130) {
    doc.addPage();
    y = M;
  }
  const half = (W - 16) / 2;
  label(doc, 'Bank details', M, y, half);
  let by = y + 11;
  const bank = [
    company.bankAccountName ? `A/c name: ${company.bankAccountName}` : null,
    company.bankName
      ? `Bank: ${company.bankName}${company.bankBranch ? `, ${company.bankBranch}` : ''}`
      : null,
    company.bankAccountNo ? `A/c no.: ${company.bankAccountNo}` : null,
    company.bankIfsc ? `IFSC: ${company.bankIfsc}` : null,
    company.upiId ? `UPI: ${company.upiId}` : null,
  ].filter(Boolean);
  for (const l of bank.length ? bank : ['Add bank details in Settings → Company & documents']) {
    text(doc, l, M, by, { size: 8, width: half, color: bank.length ? INK : MUTED });
    by += 11;
  }
  const terms = accounts.invoiceTerms || [];
  if (terms.length) {
    by += 4;
    label(doc, 'Terms', M, by, half);
    by += 11;
    terms.forEach((t, i) => {
      const s = `${i + 1}. ${t}`;
      text(doc, s, M, by, { size: 7.5, color: MUTED, width: half });
      by += heightOf(doc, s, half, { size: 7.5 }) + 1;
    });
  }
  const sx = M + half + 16;
  text(doc, `For ${company.legalName || company.name}`, sx, y + 11, {
    bold: true,
    size: 9,
    width: half,
    align: 'right',
  });
  rule(doc, y + 62, { x1: sx + half - 150, x2: sx + half, color: MUTED });
  text(doc, 'Authorised signatory', sx, y + 66, {
    size: 8,
    color: MUTED,
    width: half,
    align: 'right',
  });
  return Math.max(by, y + 80);
}

async function buildInvoicePdf(invoiceId) {
  const { TaxInvoice } = require('../../models');
  const inv = await TaxInvoice.findByPk(invoiceId);
  if (!inv) throw Object.assign(new Error('Invoice not found'), { status: 404 });
  const [company, accounts] = await Promise.all([getSetting('company'), getSetting('accounts')]);
  const data = inv.toJSON();
  for (const k of [
    'goodsValue',
    'freight',
    'discount',
    'taxableValue',
    'gstRate',
    'cgst',
    'sgst',
    'igst',
    'roundOff',
    'total',
  ])
    data[k] = Number(data[k]);

  const doc = makeDoc(`Tax invoice ${data.invoiceNo}`);
  const chunks = [];
  doc.on('data', (c) => chunks.push(c));
  const done = new Promise((resolve) => doc.on('end', () => resolve(Buffer.concat(chunks))));

  let y = header(doc, data, company);
  y = parties(doc, y, data);
  y = tableHeader(doc, y);
  const lines = asList(data.lines);
  lines.forEach((l, i) => {
    if (y > A4.h - M - 60) {
      doc.addPage();
      y = tableHeader(doc, M);
    }
    y = lineRow(doc, y, l, i);
  });
  if (data.freight) {
    text(doc, 'Freight / cartage', COLS[1].x + 3, y + 4, { size: 8, width: COLS[1].w - 6 });
    text(doc, '9965', COLS[2].x + 3, y + 4, { size: 8, width: COLS[2].w - 6 });
    text(doc, money(data.freight), COLS[7].x + 3, y + 4, {
      size: 8,
      width: COLS[7].w - 6,
      align: 'right',
    });
    y += 17;
    rule(doc, y, { w: 0.4 });
  }
  y += 8;
  if (y > A4.h - M - 200) {
    doc.addPage();
    y = M;
  }
  y = summary(doc, y, data) + 6;
  if (y > A4.h - M - 120) {
    doc.addPage();
    y = M;
  }
  y = hsnSummary(doc, y, data) + 4;
  rule(doc, y);
  footer(doc, y + 8, { company, accounts });

  // Cancelled stamp + page numbers
  const range = doc.bufferedPageRange();
  for (let i = range.start; i < range.start + range.count; i++) {
    doc.switchToPage(i);
    if (data.status === 'CANCELLED') {
      doc.save();
      doc.rotate(-30, { origin: [A4.w / 2, A4.h / 2] });
      doc
        .font('B')
        .fontSize(64)
        .fillColor(RED)
        .opacity(0.18)
        .text('CANCELLED', 0, A4.h / 2 - 40, { width: A4.w, align: 'center' });
      doc.restore();
      doc.opacity(1);
    }
    // write inside the bottom margin without pdfkit starting a new page
    const bottom = doc.page.margins.bottom;
    doc.page.margins.bottom = 0;
    text(
      doc,
      `${data.invoiceNo} · page ${i + 1} of ${range.count} · computer-generated invoice`,
      M,
      A4.h - M + 10,
      { size: 7, color: MUTED, width: W, align: 'center', lineBreak: false },
    );
    doc.page.margins.bottom = bottom;
  }
  doc.end();
  const buffer = await done;
  return { buffer, filename: `Invoice-${data.invoiceNo.replace(/\//g, '-')}.pdf`, invoice: data };
}

module.exports = { buildInvoicePdf };
