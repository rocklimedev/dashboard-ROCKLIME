// Checks Home "My day", every report, reorder suggestions and the daily summary.
//   node local-tools/insights-check.js
// Read-only: nothing is created or changed.
const BASE = process.env.API || "http://localhost:5050/api";
const ADMIN = { email: process.env.LOCAL_ADMIN_EMAIL || "admin@cmtrading.local", password: process.env.LOCAL_ADMIN_PASSWORD || "Admin@12345" };
const SALES = { email: "sales@cmtrading.local", password: "Sales@12345" };

let failed = 0;
const check = (ok, label, extra = "") => {
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}${extra ? "  → " + extra : ""}`);
  if (!ok) failed++;
};
const login = async (who) => (await (await fetch(BASE + "/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(who) })).json()).accessToken;
const get = async (token, path) => {
  const r = await fetch(BASE + path, { headers: { Authorization: `Bearer ${token}` } });
  let data;
  try { data = await r.json(); } catch { data = null; }
  return { status: r.status, data };
};

(async () => {
  const admin = await login(ADMIN);
  check(!!admin, "admin logs in");

  const day = await get(admin, "/dashboard/my-day");
  check(day.status === 200 && Array.isArray(day.data.followUps) && Array.isArray(day.data.toDispatch) && day.data.money && day.data.counts, "My day has follow-ups, orders to dispatch, counts and money", JSON.stringify(day.data?.counts));
  check(day.data.scope === "everyone", "admins see everyone's work");

  const list = await get(admin, "/reports");
  const keys = (list.data?.data || []).map((r) => r.key);
  check(keys.length >= 9, "report list loads", keys.join(", "));
  const from = new Date(Date.now() - 90 * 864e5).toISOString().slice(0, 10);
  const to = new Date().toISOString().slice(0, 10);
  for (const k of keys) {
    const r = await get(admin, `/reports/${k}?from=${from}&to=${to}`);
    const ok = r.status === 200 && Array.isArray(r.data.rows) && Array.isArray(r.data.columns) && r.data.columns.every((c) => c.key && c.title);
    check(ok, `report ${k} runs`, ok ? `${r.data.rows.length} rows` : `${r.status} ${r.data?.message || ""}`);
  }
  const weekly = await get(admin, `/reports/sales-by-period?from=${from}&to=${to}&group=week`);
  check(weekly.status === 200 && weekly.data.rows.every((x) => /-W\d{2}$/.test(x.period)), "sales by period groups by week");
  const bad = await get(admin, `/reports/sales-by-period?from=${to}&to=${from}`);
  check(bad.status === 400, "a reversed date range is refused");

  const reorder = await get(admin, "/stock/reorder");
  const groups = reorder.data?.data || [];
  check(reorder.status === 200 && Array.isArray(groups), "reorder suggestions load", `${groups.length} vendor group(s), ${groups.reduce((a, g) => a + g.items.length, 0)} product(s)`);
  check(groups.every((g) => g.items.every((i) => i.suggest >= 1 && i.available + i.incoming - i.waiting <= i.reorderPoint)), "every suggestion is at or below its reorder point and asks for at least 1");

  const sum = await get(admin, "/dashboard/daily-summary");
  check(sum.status === 200 && /Orders:/.test(sum.data.text) && sum.data.html.includes("<table"), "daily summary builds", sum.data?.text?.split("\n")[2]);

  const sales = await login(SALES);
  const sday = await get(sales, "/dashboard/my-day");
  check(sday.status === 200 && sday.data.scope === "mine", "sales users see their own day");
  const sreport = await get(sales, "/reports");
  check(sreport.status === 200, "sales users get the reports their role allows", (sreport.data?.data || []).map((r) => r.key).join(", ") || "none");
  const send = await fetch(BASE + "/dashboard/daily-summary/send", { method: "POST", headers: { Authorization: `Bearer ${sales}` } });
  check(send.status === 403, "only administrators can send the summary email");

  console.log(failed ? `\n${failed} check(s) FAILED` : "\nAll insights checks passed");
  process.exit(failed ? 1 : 0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
