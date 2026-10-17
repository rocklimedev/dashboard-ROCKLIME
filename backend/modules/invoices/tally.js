// Tally Prime / ERP 9 import file (XML "Vouchers"): one Sales voucher per live
// invoice and one Receipt voucher per payment received, for a date range.
// Import in Tally: Gateway → Import → Vouchers → choose the file.
// Ledger names come from Settings → Company & documents → Accounts (Tally);
// the party ledger is the customer's name, so create customers as ledgers
// under Sundry Debtors first (or let Tally create them on import).
const { Op } = require("sequelize");
const { getSetting } = require("../settings/settings.service");
const { r2 } = require("../../lib/quotationMath");

const esc = (s) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
const tdate = (d) => String(d).slice(0, 10).replace(/-/g, "");
const amt = (n) => r2(n).toFixed(2);
const asList = (v) => {
  let x = v;
  for (let i = 0; i < 3 && typeof x === "string"; i++) {
    try {
      x = JSON.parse(x);
    } catch {
      return [];
    }
  }
  return Array.isArray(x) ? x : [];
};

// Debit = deemed positive, negative amount (Tally convention); credit = positive amount.
const entry = (ledger, amount, debit) =>
  Number(amount)
    ? `<ALLLEDGERENTRIES.LIST><LEDGERNAME>${esc(ledger)}</LEDGERNAME><ISDEEMEDPOSITIVE>${debit ? "Yes" : "No"}</ISDEEMEDPOSITIVE><AMOUNT>${debit ? "-" : ""}${amt(Math.abs(amount))}</AMOUNT></ALLLEDGERENTRIES.LIST>`
    : "";

function salesVoucher(inv, L) {
  const lines = asList(inv.lines);
  const goodsTaxable = r2(lines.reduce((s, l) => s + Number(l.taxable || 0), 0));
  const freightTaxable = r2(Number(inv.taxableValue) - goodsTaxable);
  const round = Number(inv.roundOff) || 0;
  return [
    `<TALLYMESSAGE xmlns:UDF="TallyUDF"><VOUCHER VCHTYPE="Sales" ACTION="Create" OBJVIEW="Accounting Voucher View">`,
    `<DATE>${tdate(inv.invoiceDate)}</DATE><VOUCHERTYPENAME>Sales</VOUCHERTYPENAME>`,
    `<VOUCHERNUMBER>${esc(inv.invoiceNo)}</VOUCHERNUMBER><REFERENCE>${esc(inv.invoiceNo)}</REFERENCE>`,
    `<PARTYLEDGERNAME>${esc(inv.customerName)}</PARTYLEDGERNAME>`,
    inv.customerGstin ? `<PARTYGSTIN>${esc(inv.customerGstin)}</PARTYGSTIN>` : "",
    inv.placeOfSupply ? `<PLACEOFSUPPLY>${esc(inv.placeOfSupply)}</PLACEOFSUPPLY>` : "",
    `<NARRATION>${esc(`Order ${inv.orderNo}`)}</NARRATION>`,
    entry(inv.customerName, inv.total, true),
    entry(L.tallySalesLedger, goodsTaxable, false),
    entry(L.tallyFreightLedger, freightTaxable, false),
    entry(L.tallyCgstLedger, inv.cgst, false),
    entry(L.tallySgstLedger, inv.sgst, false),
    entry(L.tallyIgstLedger, inv.igst, false),
    round ? entry(L.tallyRoundOffLedger, round, round < 0) : "",
    `</VOUCHER></TALLYMESSAGE>`,
  ].join("");
}

function receiptVoucher(p, customerName, L) {
  const cash = String(p.mode).toUpperCase() === "CASH";
  return [
    `<TALLYMESSAGE xmlns:UDF="TallyUDF"><VOUCHER VCHTYPE="Receipt" ACTION="Create" OBJVIEW="Accounting Voucher View">`,
    `<DATE>${tdate(new Date(p.receivedAt).toISOString())}</DATE><VOUCHERTYPENAME>Receipt</VOUCHERTYPENAME>`,
    `<VOUCHERNUMBER>${esc(p.receiptNo)}</VOUCHERNUMBER>`,
    `<NARRATION>${esc(`Order ${p.orderNo}${p.reference ? ` · ${p.mode} ${p.reference}` : ` · ${p.mode}`}`)}</NARRATION>`,
    entry(cash ? L.tallyCashLedger : L.tallyBankLedger, p.amount, true),
    entry(customerName || "Customer", p.amount, false),
    `</VOUCHER></TALLYMESSAGE>`,
  ].join("");
}

async function tallyXml({ from, to }) {
  const { TaxInvoice, OrderPayment, Customer } = require("../../models");
  const L = await getSetting("accounts");
  const company = await getSetting("company");
  const range = { [Op.gte]: from, [Op.lte]: to };
  const invoices = await TaxInvoice.findAll({ where: { status: "ISSUED", invoiceDate: range }, order: [["invoiceDate", "ASC"], ["invoiceNo", "ASC"]] });
  const payments = await OrderPayment.findAll({
    where: { status: "RECEIVED", receivedAt: { [Op.gte]: new Date(`${from}T00:00:00+05:30`), [Op.lte]: new Date(`${to}T23:59:59+05:30`) } },
    order: [["receivedAt", "ASC"]],
  });
  const custIds = [...new Set(payments.map((p) => p.customerId).filter(Boolean))];
  const customers = custIds.length ? await Customer.findAll({ where: { customerId: custIds }, attributes: ["customerId", "name", "companyName"] }) : [];
  const name = Object.fromEntries(customers.map((c) => [c.customerId, c.companyName || c.name]));
  const body = [
    ...invoices.map((i) => salesVoucher(i.toJSON(), L)),
    ...payments.map((p) => receiptVoucher(p.toJSON(), name[p.customerId], L)),
  ].join("\n");
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<ENVELOPE><HEADER><TALLYREQUEST>Import Data</TALLYREQUEST></HEADER><BODY><IMPORTDATA>
<REQUESTDESC><REPORTNAME>Vouchers</REPORTNAME><STATICVARIABLES><SVCURRENTCOMPANY>${esc(company.legalName || company.name)}</SVCURRENTCOMPANY></STATICVARIABLES></REQUESTDESC>
<REQUESTDATA>
${body}
</REQUESTDATA></IMPORTDATA></BODY></ENVELOPE>
`;
  return { xml, invoices: invoices.length, payments: payments.length };
}

/** Invoice register (CSV) for the accountant / GSTR-1. */
async function registerCsv({ from, to }) {
  const { TaxInvoice } = require("../../models");
  const rows = await TaxInvoice.findAll({ where: { invoiceDate: { [Op.gte]: from, [Op.lte]: to } }, order: [["invoiceDate", "ASC"], ["invoiceNo", "ASC"]] });
  const q = (s) => `"${String(s ?? "").replace(/"/g, '""')}"`;
  const head = ["Invoice no", "Date", "Customer", "GSTIN", "Place of supply", "Type", "Taxable value", "GST %", "CGST", "SGST", "IGST", "Round off", "Invoice total", "Status", "Order no", "Cancel reason"];
  const lines = rows.map((r) =>
    [
      r.invoiceNo,
      r.invoiceDate,
      r.customerName,
      r.customerGstin || "",
      r.placeOfSupply || "",
      r.customerGstin ? "B2B" : "B2C",
      amt(r.taxableValue),
      amt(r.gstRate),
      amt(r.cgst),
      amt(r.sgst),
      amt(r.igst),
      amt(r.roundOff),
      amt(r.total),
      r.status,
      r.orderNo,
      r.cancelReason || "",
    ].map(q).join(","),
  );
  return "﻿" + [head.map(q).join(","), ...lines].join("\r\n") + "\r\n";
}

module.exports = { tallyXml, registerCsv, esc };
