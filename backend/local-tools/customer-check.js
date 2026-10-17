// Checks Customer 360, credit limits and referrals.
//   node local-tools/customer-check.js
// Creates an architect and a customer they referred ("CUSTOMER CHECK"), gives
// the customer a ₹1,000 credit limit, places one order, then checks the
// overview figures, the credit warning, the referral link both ways, the
// customer list columns, and that bad credit values and self-referral are refused.
// At the end the test order is cancelled so its stock is freed.
const BASE = process.env.API || "http://localhost:5050/api";
const ADMIN = { email: process.env.LOCAL_ADMIN_EMAIL || "admin@cmtrading.local", password: process.env.LOCAL_ADMIN_PASSWORD || "Admin@12345" };

let token;
let failed = 0;
const check = (ok, label, extra = "") => {
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}${extra !== "" ? "  → " + extra : ""}`);
  if (!ok) failed++;
};
const call = async (method, path, body) => {
  const r = await fetch(BASE + path, {
    method,
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(body ? { "Content-Type": "application/json" } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await r.text();
  let data;
  try { data = JSON.parse(text); } catch { data = text; }
  return { status: r.status, data };
};
const day = (n) => new Date(Date.now() + n * 864e5).toISOString().slice(0, 10);
const stamp = Date.now().toString().slice(-6);

(async () => {
  token = (await call("POST", "/auth/login", ADMIN)).data?.accessToken;
  check(!!token, "admin logs in");
  const me = (await call("GET", "/user/me")).data.user;

  // Architect + referred customer
  const arch = await call("POST", "/customers", { name: `CUSTOMER CHECK Architect ${stamp}`, customerType: "Architect", mobileNumber: `90${stamp}01` });
  check(arch.status === 201, "architect created", arch.data?.message || "");
  const archId = arch.data.data.customerId;

  const cust = await call("POST", "/customers", {
    name: `CUSTOMER CHECK Client ${stamp}`,
    customerType: "Retail",
    mobileNumber: `90${stamp}02`,
    creditLimit: 1000,
    creditDays: 15,
    referredBy: archId,
    notes: "Test customer from customer-check",
  });
  check(cust.status === 201, "customer created with credit limit, credit days and referrer", cust.data?.message || "");
  const c = cust.data.data;
  check(Number(c.creditLimit) === 1000 && Number(c.creditDays) === 15 && c.referredBy === archId, "the new fields are saved", `${c.creditLimit} / ${c.creditDays} days`);

  // Validation
  let r = await call("PUT", `/customers/${c.customerId}`, { referredBy: c.customerId });
  check(r.status === 400, "a customer can't refer themselves", r.data?.message);
  r = await call("PUT", `/customers/${c.customerId}`, { creditLimit: -5 });
  check(r.status === 400, "a negative credit limit is refused", r.data?.message);
  r = await call("PUT", `/customers/${c.customerId}`, { creditDays: 999 });
  check(r.status === 400, "credit days over 365 are refused", r.data?.message);

  // Before any order
  r = await call("GET", `/customers/${c.customerId}/credit?amount=900`);
  check(r.status === 200 && r.data.due === 0 && r.data.overLimit === false, "a ₹900 order is within the ₹1,000 limit", JSON.stringify(r.data));
  r = await call("GET", `/customers/${c.customerId}/credit?amount=1500`);
  check(r.data.overLimit === true && r.data.afterOrder === 1500, "a ₹1,500 order would go over the limit");

  // Place an order
  const stock = ((await call("GET", "/stock/overview?limit=200")).data.data || []).filter((p) => p.available >= 1).sort((a, b) => b.available - a.available);
  check(stock.length >= 1, "a product with stock exists");
  const P = stock[0];
  const created = await call("POST", "/order/create", {
    createdFor: c.customerId,
    createdBy: me.userId,
    assignedUserId: me.userId,
    status: "PREPARING",
    dueDate: day(3),
    description: "CUSTOMER CHECK",
    gst: 18,
    products: [{ productId: P.productId, name: P.name, quantity: 1, price: 2000, discount: 0, discountType: "percent" }],
  });
  check(created.status === 201, "test order placed", created.status);
  const orderId = created.data.id;
  const orderTotal = Number((await call("GET", `/order/${orderId}`)).data.order.finalAmount);

  // Overview
  const ov = await call("GET", `/customers/${c.customerId}/overview`);
  check(ov.status === 200, "Customer 360 loads");
  const s = ov.data.stats;
  check(s.orders === 1 && Math.abs(s.orderValue - orderTotal) < 0.01, "order count and value", `${s.orders} order, ₹${s.orderValue}`);
  check(Math.abs(s.due - orderTotal) < 0.01 && s.paid === 0, "what they owe equals the unpaid order", `owes ₹${s.due}`);
  check(s.overLimit === true && Math.abs(s.creditLeft - (1000 - orderTotal)) < 0.01, "shows over limit and the (negative) credit left", `left ₹${s.creditLeft}`);
  check(s.overdue === 0 && s.creditDays === 15, "a new order is not overdue yet");
  check(ov.data.referrer?.customerId === archId, "shows who referred them", ov.data.referrer?.name);
  check(ov.data.timeline.some((e) => e.type === "order" && e.id === orderId), "the order is on the timeline");
  check(Array.isArray(ov.data.quotations) && Array.isArray(ov.data.payments) && Array.isArray(ov.data.invoices), "quotations, payments and invoices lists are present");

  r = await call("GET", `/customers/${c.customerId}/credit?amount=0`);
  check(r.data.overLimit === true && Math.abs(r.data.due - orderTotal) < 0.01, "the order form's credit check warns", `owes ₹${r.data.due} vs limit ₹${r.data.creditLimit}`);

  // Referrals the other way
  const aov = await call("GET", `/customers/${archId}/overview`);
  const ref = (aov.data.referrals || []).find((x) => x.customerId === c.customerId);
  check(!!ref && ref.orders === 1 && Math.abs(ref.orderValue - orderTotal) < 0.01, "the architect's page lists the referral and its business", ref ? `₹${ref.orderValue}` : "missing");

  // Referrals report
  const rep = await call("GET", `/reports/referrals?from=${day(-1)}&to=${day(1)}`);
  check(rep.status === 200 && rep.data.rows.some((x) => (x.name || x.referrer || "").includes(`Architect ${stamp}`)), "the referrals report includes the architect", rep.status);

  // Customer list columns
  const list = await call("GET", `/customers?search=${encodeURIComponent(`CUSTOMER CHECK Client ${stamp}`)}&limit=5`);
  const row = (list.data.data || []).find((x) => x.customerId === c.customerId);
  check(!!row && Math.abs(Number(row.due) - orderTotal) < 0.01 && !!row.lastOrder, "the customer list shows what they owe and the last order", row ? `₹${row.due}, ${row.lastOrder}` : "row missing");

  // Unknown customer
  r = await call("GET", `/customers/00000000-0000-0000-0000-000000000000/overview`);
  check(r.status === 404, "an unknown customer gives 404");

  // Clean up: cancel the order so its stock is released
  r = await call("PUT", "/order/update-status", { id: orderId, status: "CANCELED" });
  check(r.status === 200, "test order cancelled (stock released)", r.data?.message || "");
  const after = await call("GET", `/customers/${c.customerId}/credit?amount=0`);
  check(after.data.due === 0, "a cancelled order no longer counts as owed");

  console.log(failed ? `\n${failed} check(s) FAILED` : "\nAll customer checks passed");
  process.exit(failed ? 1 : 0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
