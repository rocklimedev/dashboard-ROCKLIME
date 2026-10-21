// Logs in as the local admin and calls the main GET endpoint of every module.
// Prints status codes; exits 1 if any endpoint returns 5xx. Nothing is saved to disk.
const BASE = process.env.API || 'http://localhost:5050/api';
const EMAIL = process.env.LOCAL_ADMIN_EMAIL || 'admin@cmtrading.local';
const PASS = process.env.LOCAL_ADMIN_PASSWORD || 'Admin@12345';
const GETS =
  `auth/me/permissions auth/validate-token user/me user/ user/search?query=a order/comments order/all order/recent
order/filter order/count?date=2026-10-14 order/dispatch-history roles/ permission/ address/all/users address/all/customers address/
carts/all category/all vendors/ parent-categories/ brand-parent/ customers/ brands/ keyword/ products/ products/count
products/company-codes products/low-stock products/top-selling products/search/all?query=grohe products/codes/brand-wise
products/search/get-product-codes products/check-code?code=GB-23328 quotation/ role-permissions/ teams/all search/?query=grohe
purchase-orders/ product-meta/ product-meta/search?title=price notifications/ cached-permissions/ fgs/ jobs/ activity/ operations/`
    .split(/\s+/)
    .filter(Boolean);

(async () => {
  const r = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: EMAIL, password: PASS }),
  });
  const login = await r.json();
  if (!login.accessToken) {
    console.log('LOGIN FAILED', r.status, login);
    process.exit(1);
  }
  console.log(`login OK (${r.status}) as ${login.user.email} roles=${login.user.roles}`);
  const H = { Authorization: `Bearer ${login.accessToken}` };
  const get = async (p) => {
    const x = await fetch(`${BASE}/${p}`, { headers: H });
    let body = '';
    try {
      body = await x.text();
    } catch {}
    return { s: x.status, body };
  };
  // add a few detail endpoints using real IDs
  const first = async (p, pick) => {
    try {
      const j = JSON.parse((await get(p)).body);
      return pick(j);
    } catch {
      return null;
    }
  };
  const arr = (j) =>
    Array.isArray(j)
      ? j
      : j.data ||
        j.products ||
        j.customers ||
        j.orders ||
        j.quotations ||
        j.brands ||
        j.items ||
        j.rows ||
        [];
  const pid = await first('products/', (j) => arr(j)[0]?.productId);
  const cid = await first('customers/', (j) => arr(j)[0]?.customerId);
  const bid = await first('brands/', (j) => arr(j)[0]?.id);
  const qid = await first('quotation/', (j) => arr(j)[0]?.quotationId);
  const oid = await first('order/all', (j) => arr(j)[0]?.id);
  if (pid) GETS.push(`products/${pid}`);
  if (cid) GETS.push(`customers/${cid}`);
  if (bid) GETS.push(`brands/${bid}`, `products/brand/${bid}`);
  if (qid) GETS.push(`quotation/${qid}`);
  if (oid) GETS.push(`order/${oid}`);
  let bad = 0;
  for (const p of GETS) {
    const { s, body } = await get(p);
    const flag = s >= 500 ? 'FAIL' : s >= 400 ? 'warn' : 'ok';
    if (s >= 500) bad++;
    console.log(
      `${flag.padEnd(4)} ${s} GET /api/${p}${s >= 400 ? '  → ' + body.slice(0, 160).replace(/\s+/g, ' ') : ''}`,
    );
  }
  console.log(`\n${GETS.length} endpoints checked, ${bad} server error(s).`);
  process.exit(bad ? 1 : 0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
