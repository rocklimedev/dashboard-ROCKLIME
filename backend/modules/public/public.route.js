// Links customers open without logging in. Every link is signed and expires
// (lib/shareToken); nothing here lists or searches data.
const express = require("express");
const { verifyShare } = require("../../lib/shareToken");
const { buildQuotationPdf } = require("../quotations/quotation-pdf");

const router = express.Router();

// GET /api/public/q/:token.pdf — the quotation PDF exactly as shared
router.get("/q/:token", async (req, res) => {
  const p = verifyShare(req.params.token);
  if (!p || p.t !== "q") {
    return res.status(404).type("text/plain").send("This link has expired or is not valid. Please ask CM Trading Co. for a new one.");
  }
  try {
    const { buffer, filename } = await buildQuotationPdf(p.id, { style: p.s, cover: p.c == null ? null : Boolean(p.c) });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="${filename}"`);
    res.setHeader("Cache-Control", "private, max-age=300");
    res.setHeader("X-Robots-Tag", "noindex");
    return res.send(buffer);
  } catch (err) {
    return res.status(err.status === 404 ? 404 : 500).type("text/plain").send("This quotation is not available.");
  }
});

// GET /api/public/inv/:token.pdf — a tax invoice (link printed on the order / sent to the customer)
router.get("/inv/:token", async (req, res) => {
  const p = verifyShare(req.params.token);
  if (!p || p.t !== "inv") {
    return res.status(404).type("text/plain").send("This link is not valid. Please ask CM Trading Co. for the invoice.");
  }
  try {
    const { buildInvoicePdf } = require("../invoices/invoice-pdf");
    const { buffer, filename } = await buildInvoicePdf(p.id);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="${filename}"`);
    res.setHeader("Cache-Control", "private, max-age=300");
    res.setHeader("X-Robots-Tag", "noindex");
    return res.send(buffer);
  } catch (err) {
    return res.status(err.status === 404 ? 404 : 500).type("text/plain").send("This invoice is not available.");
  }
});

// GET /api/public/gp/:token.pdf — gate pass of one dispatch (for the guard / driver)
router.get("/gp/:token", async (req, res) => {
  const p = verifyShare(req.params.token);
  if (!p || p.t !== "gp") return res.status(404).type("text/plain").send("This gate pass link is not valid.");
  try {
    const { buildGatePass } = require("../orders/gate-pass");
    const { buffer, filename } = await buildGatePass(p.id);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="${filename}"`);
    res.setHeader("Cache-Control", "private, max-age=60");
    res.setHeader("X-Robots-Tag", "noindex");
    return res.send(buffer);
  } catch (err) {
    return res.status(err.status === 404 ? 404 : 500).type("text/plain").send("This gate pass is not available.");
  }
});

// GET /api/public/po/:token.pdf — a purchase order sent to the vendor
router.get("/po/:token", async (req, res) => {
  const p = verifyShare(req.params.token);
  if (!p || p.t !== "po") return res.status(404).type("text/plain").send("This purchase order link is not valid.");
  try {
    const { buildPoPdf } = require("../purchase-order/po-pdf");
    const { buffer, filename } = await buildPoPdf(p.id);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="${filename}"`);
    res.setHeader("Cache-Control", "private, max-age=60");
    res.setHeader("X-Robots-Tag", "noindex");
    return res.send(buffer);
  } catch (err) {
    return res.status(err.status === 404 ? 404 : 500).type("text/plain").send("This purchase order is not available.");
  }
});

// Dispatch links use the same document renderer and expiring signature as quotations.
router.get("/dispatch/:token", async (req, res) => {
  const p = verifyShare(req.params.token);
  if (!p || p.t !== "dispatch") return res.status(404).type("text/plain").send("This dispatch link has expired or is not valid.");
  try {
    const { dispatchData } = require("../orders/quotation-dispatch.controller");
    const { document } = await dispatchData(p.id);
    const { getSetting } = require("../settings/settings.service");
    const [company, settings] = await Promise.all([getSetting("company"), getSetting("quotation")]);
    const { renderQuotationPdf } = require("../quotations/quotation-pdf");
    const { buffer, filename } = await renderQuotationPdf(document, { company, settings, documentLabel: "Dispatch", style: p.s, cover: p.c == null ? null : Boolean(p.c) });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", 'inline; filename="Dispatch-' + filename.replace(/["\r\n]/g, "").replace(/[/\\]/g, "-") + '"');
    res.setHeader("Cache-Control", "private, max-age=300");
    res.setHeader("X-Robots-Tag", "noindex");
    return res.send(buffer);
  } catch (err) { return res.status(err.status === 404 ? 404 : 500).type("text/plain").send("This dispatch is not available."); }
});
module.exports = router;
