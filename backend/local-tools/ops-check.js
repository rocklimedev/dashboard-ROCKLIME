// Checks the Operations app, the new quotation format and the gate pass.
//   node local-tools/ops-check.js
// Uses one product with stock: adds 3, marks 2 damaged, repairs 1, writes off
// 1, removes 2 (net zero on good stock, back to the same damaged count) and
// checks every balance on the way.
const BASE = process.env.API || "http://localhost:5050/api";
const ADMIN = { email: process.env.LOCAL_ADMIN_EMAIL || "admin@cmtrading.local", password: process.env.LOCAL_ADMIN_PASSWORD || "Admin@12345" };

let token;
let failed = 0;
const check = (ok, label, extra = "") => {
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}${extra !== "" ? "  → " + extra : ""}`);
  if (!ok) failed++;
};
const call = async (method, path, body, { raw = false, auth = true } = {}) => {
  const r = await fetch(path.startsWith("http") ? path : BASE + path, {
    method,
    headers: { ...(auth && token ? { Authorization: `Bearer ${token}` } : {}), ...(body ? { "Content-Type": "application/json" } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (raw) return { status: r.status, buf: Buffer.from(await r.arrayBuffer()) };
  const text = await r.text();
  let data;
  try { data = JSON.parse(text); } catch { data = text; }
  return { status: r.status, data };
};
const pages = (buf) => (buf.toString("latin1").match(/\/Type\s*\/Page[^s]/g) || []).length;

(async () => {
  token = (await call("POST", "/auth/login", ADMIN)).data?.accessToken;
  check(!!token, "admin logs in");

  // Today board
  const b = await call("GET", "/stock/ops/board");
  check(b.status === 200 && b.data.counts && Array.isArray(b.data.toDispatch) && Array.isArray(b.data.onRoad) && Array.isArray(b.data.toReceive), "Operations board loads", JSON.stringify(b.data?.counts));
  check(b.data.toDispatch.every((o) => o.reserved <= o.left && typeof o.ready === "boolean"), "each order shows how much of it is in stock");
  check(b.data.counts.readyToPack + b.data.counts.waitingForStock === b.data.counts.toDispatch, "ready + waiting = to dispatch");

  // Stock entry round trip
  const stock = ((await call("GET", "/stock/overview?limit=200")).data.data || []).filter((p) => p.available >= 3).sort((a, b2) => b2.available - a.available);
  check(stock.length > 0, "a product with stock exists");
  const P = stock[0];
  const bal = async () => (await call("GET", `/stock/products/${P.productId}`)).data.totals;
  const start = await bal();
  const steps = [
    ["IN", 3, { onHand: 3, damaged: 0 }],
    ["DAMAGE", 2, { onHand: -2, damaged: 2 }],
    ["REPAIR", 1, { onHand: 1, damaged: -1 }],
    ["WRITE_OFF", 1, { onHand: 0, damaged: -1 }],
    ["OUT", 2, { onHand: -2, damaged: 0 }],
  ];
  let expectOn = start.onHand;
  let expectDmg = start.damaged;
  for (const [type, quantity, d] of steps) {
    const r = await call("POST", "/stock/ops/entry", { type, productId: P.productId, quantity, reason: "OPS CHECK" });
    expectOn += d.onHand;
    expectDmg += d.damaged;
    const now = await bal();
    check(r.status === 201 && now.onHand === expectOn && now.damaged === expectDmg, `stock entry ${type} ${quantity}`, `on hand ${now.onHand}, damaged ${now.damaged}`);
  }
  const end = await bal();
  check(end.onHand === start.onHand && end.damaged === start.damaged, "the round trip leaves stock where it started");
  let r = await call("POST", "/stock/ops/entry", { type: "IN", productId: P.productId, quantity: 1 });
  check(r.status === 400, "an entry without a reason is refused", r.data?.message);
  r = await call("POST", "/stock/ops/entry", { type: "OUT", productId: P.productId, quantity: end.onHand + 1000, reason: "OPS CHECK" });
  check(r.status === 409, "removing more than is available is refused", r.data?.message);
  r = await call("POST", "/stock/ops/entry", { type: "WRITE_OFF", productId: P.productId, quantity: end.damaged + 1, reason: "OPS CHECK" });
  check(r.status === 409, "writing off more than is damaged is refused", r.data?.message);
  const led = await call("GET", "/stock/ledger?refType=STOCK_ENTRY&limit=5");
  check(led.status === 200 && led.data.data.length >= 5 && led.data.data.every((x) => x.refType === "STOCK_ENTRY"), "stock entries show in movements with their own filter");

  // Receive goods list
  const rec = await call("GET", "/stock/ops/receivable");
  check(rec.status === 200 && Array.isArray(rec.data.data), "goods-to-receive list loads", `${rec.data.data?.length} PO(s)`);

  // Gate passes
  const gp = await call("GET", "/stock/ops/gate-passes?limit=5");
  check(gp.status === 200 && Array.isArray(gp.data.data), "gate pass register loads", `${gp.data.total} dispatch(es)`);
  if (gp.data.data?.length) {
    const pdf = await call("GET", gp.data.data[0].printLink, null, { raw: true, auth: false });
    check(pdf.status === 200 && pdf.buf.slice(0, 4).toString() === "%PDF", "a gate pass prints from the register", `${gp.data.data[0].gpNo}, ${Math.round(pdf.buf.length / 1024)} KB`);
  }

  // Quotation format
  const q = ((await call("GET", "/quotation?limit=1")).data.data || [])[0];
  if (q) {
    const withCover = await call("GET", `/quotation/${q.quotationId}/pdf`, null, { raw: true });
    const noCover = await call("GET", `/quotation/${q.quotationId}/pdf?cover=0`, null, { raw: true });
    check(withCover.status === 200 && withCover.buf.slice(0, 4).toString() === "%PDF", "quotation PDF in the new format", `${pages(withCover.buf)} pages`);
    check(pages(withCover.buf) === pages(noCover.buf) + 1, "the cover page is on by default and can be turned off");
  }
  const cust = ((await call("GET", "/customers?limit=1")).data.data || [])[0];
  const draft = await call(
    "POST",
    "/quotation/preview-pdf",
    {
      draft: {
        customerId: cust?.customerId,
        gst: 18,
        floors: [{ floorId: "f1", floorName: "Ground", rooms: [{ roomId: "r1", roomName: "Master Bathroom" }] }],
        products: [{ productId: P.productId, name: P.name, quantity: 2, price: 1000, discount: 10, discountType: "percent", floorId: "f1", roomId: "r1" }],
      },
    },
    { raw: true },
  );
  check(draft.status === 200 && draft.buf.slice(0, 4).toString() === "%PDF", "an unsaved quotation previews in the same format", `${pages(draft.buf)} pages`);
  const empty = await call("POST", "/quotation/preview-pdf", { draft: { products: [] } });
  check(empty.status === 400, "an empty cart has nothing to preview");

  // Apps home numbers
  const day = await call("GET", "/dashboard/my-day");
  check(day.status === 200 && day.data.quoteCounts && typeof day.data.toReceive === "number", "the apps home gets its tile numbers", JSON.stringify({ ...day.data.quoteCounts, toReceive: day.data.toReceive }));

  console.log(failed ? `\n${failed} check(s) FAILED` : "\nAll operations checks passed");
  process.exit(failed ? 1 : 0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
