// Checks brand catalogues and the complete purchase order.
//   node local-tools/catalogue-po-check.js
// Catalogue: uploads a small generated PDF ("CATALOGUE CHECK") with page text,
// searches inside it, opens part of the file (Range), edits and deletes it.
// PO: fills vendor details, creates a PO with discounts, GST rates and freight,
// checks the totals against lib/poMath, the filters on the PO list, the PDF and
// the vendor link, then cancels the PO.
const path = require("path");
const PDFDocument = require("pdfkit");
const { poTotals } = require(path.join(__dirname, "../lib/poMath"));
const BASE = process.env.API || "http://localhost:5050/api";
const ADMIN = { email: process.env.LOCAL_ADMIN_EMAIL || "admin@cmtrading.local", password: process.env.LOCAL_ADMIN_PASSWORD || "Admin@12345" };

let token;
let failed = 0;
const check = (ok, label, extra = "") => {
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}${extra !== "" ? "  → " + extra : ""}`);
  if (!ok) failed++;
};
const call = async (method, p, body, { raw = false, headers = {}, auth = true } = {}) => {
  const isForm = body instanceof FormData;
  const r = await fetch(p.startsWith("http") ? p : BASE + p, {
    method,
    headers: { ...(auth ? { Authorization: `Bearer ${token}` } : {}), ...(body && !isForm ? { "Content-Type": "application/json" } : {}), ...headers },
    body: body ? (isForm ? body : JSON.stringify(body)) : undefined,
  });
  if (raw) return { status: r.status, headers: r.headers, buf: Buffer.from(await r.arrayBuffer()) };
  const text = await r.text();
  let data;
  try { data = JSON.parse(text); } catch { data = text; }
  return { status: r.status, data };
};
const makePdf = () =>
  new Promise((resolve) => {
    const doc = new PDFDocument({ size: "A4" });
    const chunks = [];
    doc.on("data", (c) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.fontSize(28).text("CATALOGUE CHECK 2026");
    doc.addPage().fontSize(14).text("Euphoria 310 Shower System, code 26075000");
    doc.addPage().fontSize(14).text("Essence Wall-Hung WC, code 3957100H. Uniset frame.");
    doc.end();
  });

(async () => {
  token = (await call("POST", "/auth/login", ADMIN)).data?.accessToken;
  check(!!token, "admin logs in");

  // ---------------- catalogues ----------------
  const pdf = await makePdf();
  const fd = new FormData();
  fd.append("file", new Blob([pdf], { type: "application/pdf" }), "catalogue-check.pdf");
  fd.append("title", "CATALOGUE CHECK");
  fd.append("category", "Product catalogue");
  fd.append("year", "2026");
  fd.append("pageCount", "3");
  fd.append("pages", JSON.stringify(["CATALOGUE CHECK 2026", "Euphoria 310 Shower System, code 26075000", "Essence Wall-Hung WC, code 3957100H. Uniset frame."]));
  let r = await call("POST", "/catalogues", fd);
  check(r.status === 201 && r.data.catalogue?.pages === 3 && r.data.catalogue.textIndexed, "a PDF catalogue uploads with its page text", r.data?.message);
  const cat = r.data.catalogue;

  r = await call("GET", "/catalogues?category=Product%20catalogue");
  check(r.status === 200 && r.data.data.some((c) => c.id === cat.id) && r.data.categories.includes("Product catalogue"), "catalogue list filters by type");
  r = await call("GET", `/catalogues/search?q=${encodeURIComponent("3957100H")}`);
  const hit = (r.data.data || []).find((h) => h.catalogueId === cat.id);
  check(!!hit && hit.page === 3 && /3957100H/.test(hit.snippet), "search inside catalogues finds the page", hit ? `page ${hit.page}: ${hit.snippet}` : "no hit");
  r = await call("GET", "/catalogues/search?q=x");
  check(r.status === 200 && r.data.data.length === 0, "one-letter searches return nothing");

  const part = await call("GET", `/catalogues/${cat.id}/file`, null, { raw: true, headers: { Range: "bytes=0-99" } });
  check(part.status === 206 && part.buf.length === 100 && part.buf.slice(0, 4).toString() === "%PDF", "the PDF opens in parts (Range request)", `${part.status}, ${part.buf.length} bytes`);
  const noauth = await call("GET", `/catalogues/${cat.id}/file`, null, { raw: true, auth: false });
  check(noauth.status === 401, "the PDF needs a login");

  r = await call("PUT", `/catalogues/${cat.id}`, { title: "CATALOGUE CHECK edited", category: "Price list", year: "2027" });
  check(r.status === 200 && r.data.catalogue.title === "CATALOGUE CHECK edited" && r.data.catalogue.category === "Price list", "catalogue details can be edited");
  r = await call("POST", `/catalogues/${cat.id}/text`, { pages: ["one", "two Lido hand shower"], pageCount: 2 });
  const re = await call("GET", "/catalogues/search?q=Lido%20hand");
  check(r.status === 200 && (re.data.data || []).some((h) => h.catalogueId === cat.id && h.page === 2), "search text can be saved again (re-index)");
  r = await call("DELETE", `/catalogues/${cat.id}`);
  const gone = await call("GET", `/catalogues/${cat.id}`);
  check(r.status === 200 && gone.status === 404, "catalogue deleted with its file");

  // ---------------- purchase order ----------------
  const vendors = (await call("GET", "/vendors")).data;
  const vendor = (Array.isArray(vendors) ? vendors : vendors?.data || [])[0];
  check(!!vendor, "a vendor exists");
  r = await call("PUT", `/vendors/${vendor.id}`, { vendorName: vendor.vendorName, vendorId: vendor.vendorId, brandId: vendor.brandId, brandSlug: vendor.brandSlug, gstin: "07aaacs1234f1z9", state: "Delhi", city: "New Delhi", address: "Plot 14, Kirti Nagar", phone: "9811022334", contactPerson: "Rakesh", paymentTerms: "30 days from invoice" });
  check(r.status === 200 && r.data.vendor?.gstin === "07AAACS1234F1Z9", "vendor GST and contact details save (GSTIN upper-cased)", r.data?.message);
  r = await call("PUT", `/vendors/${vendor.id}`, { vendorName: vendor.vendorName, gstin: "123" });
  check(r.status === 400, "a wrong GSTIN is refused", r.data?.message);

  const products = ((await call("GET", "/stock/overview?limit=5")).data.data || []).slice(0, 3);
  const items = [
    { productId: products[0].productId, quantity: 4, unitPrice: 36270, discount: 52, discountType: "percent", tax: 18 },
    { productId: products[1].productId, quantity: 4, unitPrice: 10200, discount: 5700, discountType: "fixed", tax: 18 },
    { productId: products[2].productId, quantity: 120, unitPrice: 650, discount: 10, discountType: "percent", tax: 12 },
  ];
  r = await call("POST", "/purchase-orders", { vendorId: vendor.id, items, freight: 1500, vendorRef: "PO CHECK", deliveryTerms: "Back gate", notes: "PO CHECK", expectDeliveryDate: new Date(Date.now() + 7 * 864e5).toISOString().slice(0, 10) });
  check(r.status === 201, "purchase order created", r.data?.message);
  const po = r.data.purchaseOrder;
  const expect = poTotals({ items, freight: 1500, interState: false });
  check(Math.abs(Number(po.totalAmount) - expect.grandTotal) < 0.01 && Math.abs(Number(po.gstAmount) - expect.gstAmount) < 0.01, "PO total = discounts + GST per line + freight GST, rounded", `₹${po.totalAmount} (expected ₹${expect.grandTotal})`);
  check(po.paymentTerms === "30 days from invoice" && po.vendorRef === "PO CHECK" && Number(po.freight) === 1500, "PO keeps vendor terms, reference and freight");
  check(po.interState === false, "same-state vendor → CGST + SGST");

  r = await call("PUT", `/purchase-orders/${po.id}`, { freight: 0 });
  const after = await call("GET", `/purchase-orders/${po.id}`);
  const expect2 = poTotals({ items, freight: 0 });
  check(Math.abs(Number(after.data.totalAmount) - expect2.grandTotal) < 0.01, "changing freight recalculates the total", `₹${after.data.totalAmount}`);

  r = await call("GET", `/purchase-orders?search=${po.poNumber}&status=pending&vendorId=${vendor.id}`);
  check(r.status === 200 && (r.data.data || []).some((x) => x.id === po.id), "PO list filters by number, status and vendor");
  r = await call("GET", `/purchase-orders?status=delivered&search=${po.poNumber}`);
  check(r.status === 200 && !(r.data.data || []).some((x) => x.id === po.id), "a status filter leaves other POs out");

  const doc = await call("GET", `/purchase-orders/${po.id}/pdf`, null, { raw: true });
  check(doc.status === 200 && doc.buf.slice(0, 4).toString() === "%PDF", "PO PDF opens", `${Math.round(doc.buf.length / 1024)} KB`);
  r = await call("POST", `/purchase-orders/${po.id}/share`);
  const pub = r.data?.url ? await call("GET", r.data.url, null, { raw: true, auth: false }) : { status: 0 };
  check(r.status === 200 && /wa\.me\/919811022334/.test(r.data.whatsapp) && pub.status === 200, "Send to vendor: WhatsApp message with a link that opens without login");

  r = await call("PATCH", `/purchase-orders/${po.id}/status`, { status: "cancelled" });
  check(r.status === 200, "test PO cancelled", r.data?.message || "");

  console.log(failed ? `\n${failed} check(s) FAILED` : "\nAll catalogue and purchase order checks passed");
  process.exit(failed ? 1 : 0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
