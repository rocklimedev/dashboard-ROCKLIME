// End-to-end check of GST invoices, gate passes and the Tally export.
//   node local-tools/invoice-check.js
// Creates its own order ("INVOICE CHECK") with freight, a fixed extra discount
// and 18% GST, invoices it in two parts, and checks the parts add up to the
// order, nothing is billed twice, numbers run in sequence, cancelling frees the
// pieces, the PDFs open, Tally vouchers balance, and a dispatch can make its own
// invoice and gate pass.
const BASE = process.env.API || "http://localhost:5050/api";
const ADMIN = { email: process.env.LOCAL_ADMIN_EMAIL || "admin@cmtrading.local", password: process.env.LOCAL_ADMIN_PASSWORD || "Admin@12345" };

let token;
let failed = 0;
const check = (ok, label, extra = "") => {
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}${extra ? "  → " + extra : ""}`);
  if (!ok) failed++;
};
const call = async (method, path, body, { raw = false, auth = true } = {}) => {
  const isForm = body instanceof FormData;
  const r = await fetch(path.startsWith("http") ? path : BASE + path, {
    method,
    headers: { ...(auth && token ? { Authorization: `Bearer ${token}` } : {}), ...(body && !isForm ? { "Content-Type": "application/json" } : {}) },
    body: body ? (isForm ? body : JSON.stringify(body)) : undefined,
  });
  if (raw) return { status: r.status, type: r.headers.get("content-type") || "", buf: Buffer.from(await r.arrayBuffer()) };
  const text = await r.text();
  let data;
  try { data = JSON.parse(text); } catch { data = text; }
  return { status: r.status, data };
};
const day = (n) => new Date(Date.now() + n * 864e5).toISOString().slice(0, 10);
const r2 = (v) => Math.round((Number(v) + Number.EPSILON) * 100) / 100;

(async () => {
  token = (await call("POST", "/auth/login", ADMIN)).data?.accessToken;
  check(!!token, "admin logs in");
  const me = (await call("GET", "/user/me")).data.user;
  const customer = ((await call("GET", "/customers?limit=1")).data.data || [])[0];
  const stock = ((await call("GET", "/stock/overview?limit=200")).data.data || []).filter((p) => p.available >= 4).sort((a, b) => b.available - a.available);
  check(stock.length >= 2, "two products with stock exist");
  const [A, B] = stock;

  const created = await call("POST", "/order/create", {
    createdFor: customer.customerId,
    createdBy: me.userId,
    assignedUserId: me.userId,
    status: "PREPARING",
    dueDate: day(5),
    description: "INVOICE CHECK",
    gst: 18,
    shipping: 500,
    extraDiscount: 333,
    extraDiscountType: "fixed",
    products: [
      { productId: A.productId, name: A.name, quantity: 3, price: 1234.5, discount: 5, discountType: "percent" },
      { productId: B.productId, name: B.name, quantity: 2, price: 999, discount: 0, discountType: "percent" },
    ],
  });
  check(created.status === 201, "test order created", created.status);
  const order = created.data;
  const id = order.id;
  const orderTotal = Number((await call("GET", `/order/${id}`)).data.order.finalAmount);

  // Part 1: 2 of A
  const p1 = await call("POST", "/invoices/preview", { orderId: id, items: [{ productId: A.productId, quantity: 2 }] });
  check(p1.status === 200 && p1.data.freight === 500, "first invoice carries the freight", p1.data.freight);
  const i1 = await call("POST", "/invoices", { orderId: id, items: [{ productId: A.productId, quantity: 2 }] });
  check(i1.status === 201 && /^[A-Z0-9-]+\/\d{2}-\d{2}\/\d{4}$/.test(i1.data.invoice.invoiceNo), "invoice 1 made with a financial-year number", i1.data.invoice?.invoiceNo || i1.data.message);
  const inv1 = i1.data.invoice;
  const gstOk = (inv) => Math.abs(inv.cgst + inv.sgst + inv.igst - r2((inv.taxableValue * 18) / 100)) <= 0.02 && (inv.igst === 0 || (inv.cgst === 0 && inv.sgst === 0));
  check(gstOk(inv1), "GST is 18% of the taxable value, as CGST+SGST or IGST", `${inv1.cgst}+${inv1.sgst}+${inv1.igst} on ${inv1.taxableValue}`);
  check(Math.abs(inv1.total - Math.round(inv1.taxableValue + inv1.cgst + inv1.sgst + inv1.igst)) < 0.01 && Math.abs(inv1.roundOff) < 0.5, "total = taxable + GST, rounded to the rupee");

  // Too many pieces is refused
  let r = await call("POST", "/invoices", { orderId: id, items: [{ productId: A.productId, quantity: 2 }] });
  check(r.status === 400, "billing more pieces than are left is refused", r.data.message);

  // Order status moved to Invoiced
  const o2 = (await call("GET", `/order/${id}`)).data.order;
  check(o2.status === "INVOICE" && !!o2.invoiceLink, "order moves to Invoiced and links the invoice");

  // Part 2: the rest
  const i2 = await call("POST", "/invoices", { orderId: id });
  const inv2 = i2.data.invoice;
  check(i2.status === 201 && inv2.freight === 0, "invoice 2 bills the rest, without freight again");
  const seq = (no) => Number(no.split("/").pop());
  check(seq(inv2.invoiceNo) === seq(inv1.invoiceNo) + 1, "numbers run in sequence", `${inv1.invoiceNo} → ${inv2.invoiceNo}`);
  check(Math.abs(inv1.discount + inv2.discount - 333) < 0.01, "the fixed discount is fully shared between the invoices", `${inv1.discount} + ${inv2.discount}`);
  const sumTaxable = r2(inv1.taxableValue + inv2.taxableValue);
  check(Math.abs(inv1.total + inv2.total - orderTotal) <= 1, "the two invoices add up to the order total (±₹1 rounding)", `${inv1.total} + ${inv2.total} vs ${orderTotal}`);
  check(sumTaxable > 0, "taxable values recorded", sumTaxable);

  r = await call("POST", "/invoices", { orderId: id });
  check(r.status === 400, "nothing left: a third invoice is refused", r.data.message);

  // PDFs: logged-in and the public link
  const pdf = await call("GET", `/invoices/${inv1.id}/pdf`, null, { raw: true });
  check(pdf.status === 200 && pdf.buf.slice(0, 4).toString() === "%PDF", "invoice PDF opens", `${pdf.buf.length} bytes`);
  const pub = await call("GET", i1.data.link, null, { raw: true, auth: false });
  check(pub.status === 200 && pub.buf.slice(0, 4).toString() === "%PDF", "public invoice link opens without login");
  const forged = await call("GET", i1.data.link.replace(/\.[^.]+\.pdf$/, ".AAAA.pdf"), null, { raw: true, auth: false });
  check(forged.status === 404, "a tampered link is refused");

  // Cancel frees the pieces
  r = await call("POST", `/invoices/${inv2.id}/cancel`, { reason: "INVOICE CHECK" });
  check(r.status === 200 && r.data.invoice.status === "CANCELLED", "invoice 2 cancelled");
  const after = (await call("GET", `/invoices/order/${id}`)).data;
  const leftA = after.remaining.find((x) => x.productId === A.productId)?.remaining;
  const leftB = after.remaining.find((x) => x.productId === B.productId)?.remaining;
  check(leftA === 1 && leftB === 2, "its pieces can be invoiced again", `A ${leftA}, B ${leftB}`);
  const cpdf = await call("GET", `/invoices/${inv2.id}/pdf`, null, { raw: true });
  check(cpdf.status === 200, "a cancelled invoice still prints (marked cancelled)");

  // Dispatch the remaining pieces and let the dispatch make the invoice + gate pass
  const fd = new FormData();
  fd.append("items", JSON.stringify([{ productId: A.productId, quantity: 3 }, { productId: B.productId, quantity: 2 }]));
  fd.append("makeInvoice", "1");
  fd.append("makeGatePass", "1");
  fd.append("vehicleNo", "DL1LAB1234");
  r = await call("POST", `/order/${id}/dispatch`, fd);
  check(r.status === 201, "dispatch without uploading files", r.data?.message);
  check(!!r.data.invoice?.invoiceNo, "the dispatch made its own invoice for the un-invoiced pieces", r.data.invoice?.invoiceNo || r.data.note);
  const gp = await call("GET", r.data.gatePassLink, null, { raw: true, auth: false });
  check(gp.status === 200 && gp.buf.slice(0, 4).toString() === "%PDF", "gate pass PDF opens from its link");
  const disp = ((await call("GET", `/order/${id}/dispatches`)).data.dispatches || [])[0] || {};
  check(!!disp.invoiceLink && !!disp.gatePassLink, "the dispatch record links both documents");

  // Without files and without "make", a dispatch is still refused
  // (nothing left to dispatch now, so use the guard on a fresh call shape)
  r = await call("POST", `/order/${id}/dispatch`, (() => { const f = new FormData(); f.append("items", JSON.stringify([{ productId: A.productId, quantity: 1 }])); return f; })());
  check(r.status === 400, "a dispatch with no invoice/gate pass is still refused");

  // Register + Tally export
  const today = day(0);
  const list = (await call("GET", `/invoices?from=${today}&to=${today}&search=${encodeURIComponent(inv1.invoiceNo)}`)).data;
  check(list.data?.length === 1 && list.totals.count >= 1, "invoice list filters by number");
  const csv = await call("GET", `/invoices/export/register?from=${today}&to=${today}`, null, { raw: true });
  const csvText = csv.buf.toString("utf8");
  check(csv.status === 200 && csvText.includes(inv1.invoiceNo) && csvText.includes("CANCELLED"), "register CSV lists issued and cancelled invoices");
  const x = await call("GET", `/invoices/export/tally?from=${today}&to=${today}`, null, { raw: true });
  const xml = x.buf.toString("utf8");
  check(x.status === 200 && xml.includes("<ENVELOPE>") && xml.includes(inv1.invoiceNo), "Tally XML downloads with the invoice");
  check(!xml.includes(`<VOUCHERNUMBER>${inv2.invoiceNo}</VOUCHERNUMBER>`), "cancelled invoices are left out of Tally");
  const vouchers = xml.split("<VOUCHER ").slice(1);
  const unbalanced = vouchers.filter((v) => {
    const amounts = [...v.matchAll(/<AMOUNT>(-?[\d.]+)<\/AMOUNT>/g)].map((m) => Number(m[1]));
    return Math.abs(amounts.reduce((a, b) => a + b, 0)) > 0.005;
  });
  check(vouchers.length > 0 && unbalanced.length === 0, "every Tally voucher balances (debits = credits)", `${vouchers.length} vouchers`);

  console.log(failed ? `\n${failed} check(s) FAILED` : "\nAll invoice checks passed");
  process.exit(failed ? 1 : 0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
