// End-to-end check of the quotation pipeline against a running local backend.
//   node local-tools/pipeline-check.js
// Creates its own quotations (titled "PIPELINE CHECK") and walks them through
// Draft → Sent → Negotiation → Won / Lost / Expired, the follow-up log and
// the counts. Test orders are cancelled at the end so stock is released.
const BASE = process.env.API || "http://localhost:5050/api";
const ADMIN = { email: process.env.LOCAL_ADMIN_EMAIL || "admin@cmtrading.local", password: process.env.LOCAL_ADMIN_PASSWORD || "Admin@12345" };

let token;
let failed = 0;
const check = (ok, label, extra = "") => {
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}${extra ? "  → " + extra : ""}`);
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
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const status = async (id) => (await call("GET", `/quotation/${id}`)).data.status;

(async () => {
  token = (await call("POST", "/auth/login", ADMIN)).data?.accessToken;
  check(!!token, "admin logs in");
  const me = (await call("GET", "/user/me")).data.user;
  const customer = ((await call("GET", "/customers?limit=1")).data.data || [])[0];
  const product = ((await call("GET", "/stock/overview?limit=200")).data.data || []).sort((a, b) => b.available - a.available)[0];
  check(!!customer && !!product, "a customer and a product with stock exist");

  const newQuote = async (extra = {}) => {
    const r = await call("POST", "/quotation/add", {
      customerId: customer.customerId,
      document_title: "PIPELINE CHECK",
      quotation_date: day(0),
      due_date: day(10),
      gst: 18,
      products: [{ productId: product.productId, name: product.name, quantity: 1, price: 1000, discount: 0, discountType: "percent", tax: 18 }],
      ...extra,
    });
    if (r.status !== 201) console.log("      create quotation failed:", r.status, JSON.stringify(r.data).slice(0, 200));
    return r.data.quotation;
  };

  const before = (await call("GET", "/quotation/pipeline/summary")).data;

  // 1. New quotation is a draft
  const q1 = await newQuote();
  check(q1?.status === "DRAFT", "a new quotation starts as Draft", q1?.status);

  // 2. Sharing a link marks it sent
  const share = await call("POST", `/quotation/${q1.quotationId}/share`, { style: "compact" });
  check(share.status === 200 && (await status(q1.quotationId)) === "SENT", "sharing a link moves Draft → Sent");

  // 3. Manual move to negotiation
  let r = await call("PATCH", `/quotation/${q1.quotationId}/status`, { status: "NEGOTIATION" });
  check(r.status === 200 && r.data.quotation.status === "NEGOTIATION", "Sent → Negotiation by hand");

  // 4. Won can't be set by hand
  r = await call("PATCH", `/quotation/${q1.quotationId}/status`, { status: "WON" });
  check(r.status === 400, "Won can't be set by hand", r.data.message);

  // 5. Lost needs a reason
  r = await call("PATCH", `/quotation/${q1.quotationId}/status`, { status: "LOST" });
  check(r.status === 400, "Lost without a reason is refused");

  // 6. Follow-up log + next date
  r = await call("POST", `/quotation/${q1.quotationId}/followups`, { channel: "CALL", note: "PIPELINE CHECK call", nextDate: day(0) });
  const fu = (await call("GET", `/quotation/${q1.quotationId}/followups`)).data.data || [];
  const qd = (await call("GET", `/quotation/${q1.quotationId}`)).data;
  check(r.status === 201 && fu.length === 1 && qd.nextFollowUp === day(0), "follow-up is logged and sets the next follow-up date", qd.nextFollowUp);
  r = await call("POST", `/quotation/${q1.quotationId}/followups`, { note: "x", nextDate: day(-1) });
  check(r.status === 400, "next follow-up in the past is refused");
  const due = (await call("GET", "/quotation/?followUpDue=1&limit=100")).data.data || [];
  check(due.some((q) => q.quotationId === q1.quotationId), "it appears under Follow-up due");

  // 7. Converting to an order marks it won; cancelling the order reopens it
  const order = await call("POST", "/order/create", {
    createdFor: customer.customerId,
    createdBy: me.userId,
    assignedUserId: me.userId,
    status: "PREPARING",
    dueDate: day(7),
    description: "PIPELINE CHECK",
    quotationId: q1.quotationId,
    products: [{ productId: product.productId, name: product.name, quantity: 1, price: 1000 }],
  });
  check(order.status === 201, "order created from the quotation", order.status);
  await sleep(400);
  check((await status(q1.quotationId)) === "WON", "the quotation becomes Won");
  const qWon = (await call("GET", `/quotation/${q1.quotationId}`)).data;
  check(qWon.nextFollowUp === null && (qWon.orders || []).length === 1, "Won clears the follow-up and lists its order");
  r = await call("PATCH", `/quotation/${q1.quotationId}/status`, { status: "LOST", lostReason: "Other" });
  check(r.status === 400, "a Won quotation can't be marked lost while its order is live");
  await call("PUT", "/order/update-status", { id: order.data.id, status: "CANCELED" });
  await sleep(400);
  check((await status(q1.quotationId)) === "NEGOTIATION", "cancelling the order sends it back to Negotiation");

  // 8. Lost with reason, then reopen
  r = await call("PATCH", `/quotation/${q1.quotationId}/status`, { status: "LOST", lostReason: "Price too high", lostNote: "PIPELINE CHECK" });
  check(r.status === 200 && r.data.quotation.lostReason === "Price too high", "Lost with a reason is saved");
  r = await call("PATCH", `/quotation/${q1.quotationId}/status`, { status: "NEGOTIATION" });
  check(r.status === 200 && r.data.quotation.lostReason === null, "a lost quotation can be reopened");

  // 9. Expiry: valid-till in the past → Expired; extending it reopens
  const q2 = await newQuote({ quotation_date: day(-30), due_date: day(-1) });
  const list = (await call("GET", "/quotation/?status=EXPIRED&limit=200")).data.data || [];
  // the list call runs the expiry (throttled to once a minute), so also check the record itself
  let s2 = await status(q2.quotationId);
  if (s2 !== "EXPIRED") {
    await sleep(61000);
    await call("GET", "/quotation/?limit=1");
    s2 = await status(q2.quotationId);
  }
  check(s2 === "EXPIRED" || list.some((q) => q.quotationId === q2.quotationId), "a quotation past its valid-till date expires", s2);
  r = await call("PATCH", `/quotation/${q2.quotationId}/status`, { status: "SENT" });
  check(r.status === 400, "an expired quotation can't be reopened without a new valid-till date");
  const full = (await call("GET", `/quotation/${q2.quotationId}`)).data;
  await call("PUT", `/quotation/${q2.quotationId}`, {
    customerId: customer.customerId,
    document_title: full.document_title,
    quotation_date: day(0),
    due_date: day(10),
    gst: 18,
    products: full.items,
  });
  check((await status(q2.quotationId)) === "DRAFT", "moving the valid-till date forward reopens it", await status(q2.quotationId));

  // 10. Counts
  const after = (await call("GET", "/quotation/pipeline/summary")).data;
  const total = (s) => Object.values(s.byStatus).reduce((a, x) => a + x.count, 0);
  check(total(after) === total(before) + 2, "summary counts every quotation once", `${total(before)} → ${total(after)}`);
  check(Array.isArray(after.lostReasons) && after.lostReasons.length > 3, "summary lists the lost reasons");

  // Clean up the test quotations
  for (const q of [q1, q2]) await call("DELETE", `/quotation/${q.quotationId}`);

  console.log(failed ? `\n${failed} check(s) FAILED` : "\nAll pipeline checks passed");
  process.exit(failed ? 1 : 0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
