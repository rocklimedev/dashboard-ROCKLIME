// Zoho Bigin client for the CRM app — the same setup as INOS (OAuth with an
// offline refresh token, Bigin v2 REST API), but one connection for the whole
// company instead of one per user: an administrator connects once and every
// salesperson's deals mirror through it.
//
// Two ways to connect:
//   1. "Connect Zoho Bigin" (OAuth): needs ZOHO_CLIENT_ID, ZOHO_CLIENT_SECRET
//      and ZOHO_REDIRECT_URI (…/api/crm/bigin/callback) in backend/.env, and
//      that redirect URI added to the client in api-console.zoho.in.
//   2. A Self Client refresh token pasted by an administrator in CRM settings
//      (or ZOHO_BIGIN_REFRESH_TOKEN in .env). Still needs the client id/secret.
//
// Data centre: Chhabra Marble's Zoho is on zoho.in, so accounts.zoho.in is the
// default (ZOHO_ACCOUNTS_URL changes it). The API host comes from Zoho's
// api_domain in the token response.
const axios = require("axios");
const { QueryTypes } = require("sequelize");

const SCOPES = (process.env.ZOHO_BIGIN_SCOPES ||
  "ZohoBigin.modules.ALL,ZohoBigin.settings.ALL,ZohoBigin.users.READ,ZohoBigin.org.READ").split(",");
const DEFAULT_ACCOUNTS = process.env.ZOHO_ACCOUNTS_URL || "https://accounts.zoho.in";
const KEY = "bigin";

const db = () => require("../../models").sequelize;
const q = (sql, r = []) => db().query(sql, { replacements: r, type: QueryTypes.SELECT });
const run = (sql, r = []) => db().query(sql, { replacements: r });

const clientId = () => process.env.ZOHO_CLIENT_ID || "";
const clientSecret = () => process.env.ZOHO_CLIENT_SECRET || "";
const redirectUri = () =>
  process.env.ZOHO_REDIRECT_URI || `${(process.env.BACKEND_URL || "http://localhost:5050").replace(/\/$/, "")}/api/crm/bigin/callback`;
const configured = () => Boolean(clientId() && clientSecret());

/** Only real Zoho accounts servers (plus localhost while developing, for the check script). */
function safeAccountsUrl(url) {
  const u = String(url || DEFAULT_ACCOUNTS).trim().replace(/\/$/, "");
  let host;
  try {
    host = new URL(u).hostname;
  } catch {
    throw Object.assign(new Error("Not a valid Zoho accounts address"), { status: 400 });
  }
  const zoho = /^accounts\.zoho\.(com|in|eu|com\.au|jp|ca|com\.cn|sa|uk)$/.test(host) || /^accounts\.zohocloud\.ca$/.test(host);
  const local = process.env.NODE_ENV !== "production" && (host === "localhost" || host === "127.0.0.1");
  if (!zoho && !local) throw Object.assign(new Error("Only Zoho accounts servers (accounts.zoho.in, .com …) are allowed"), { status: 400 });
  return u;
}

async function connection() {
  try {
    const [row] = await q("SELECT * FROM crm_zoho_connection WHERE `key` = ?", [KEY]);
    if (row) return row;
  } catch {
    return null;
  }
  // a refresh token in .env counts as a connection too
  if (process.env.ZOHO_BIGIN_REFRESH_TOKEN && configured()) {
    await saveTokens({ refresh_token: process.env.ZOHO_BIGIN_REFRESH_TOKEN }, DEFAULT_ACCOUNTS, null);
    const [row] = await q("SELECT * FROM crm_zoho_connection WHERE `key` = ?", [KEY]);
    return row || null;
  }
  return null;
}

async function saveTokens(data, accountsUrl, userId) {
  const expiresAt = data.access_token ? new Date(Date.now() + (Number(data.expires_in) || 3600) * 1000) : null;
  const [existing] = await q("SELECT `key` FROM crm_zoho_connection WHERE `key` = ?", [KEY]);
  if (existing) {
    await run(
      `UPDATE crm_zoho_connection SET accessToken = COALESCE(?, accessToken), refreshToken = COALESCE(?, refreshToken),
         apiDomain = COALESCE(?, apiDomain), accountsUrl = ?, scope = COALESCE(?, scope), expiresAt = COALESCE(?, expiresAt),
         connectedBy = COALESCE(?, connectedBy), updatedAt = NOW() WHERE \`key\` = ?`,
      [data.access_token || null, data.refresh_token || null, data.api_domain || null, accountsUrl, data.scope || null, expiresAt, userId, KEY],
    );
  } else {
    if (!data.refresh_token) throw Object.assign(new Error("Zoho did not return a refresh token. Connect again (the consent screen must be shown)."), { status: 400 });
    await run(
      `INSERT INTO crm_zoho_connection (\`key\`, accessToken, refreshToken, apiDomain, accountsUrl, scope, expiresAt, connectedBy, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [KEY, data.access_token || null, data.refresh_token, data.api_domain || null, accountsUrl, data.scope || null, expiresAt, userId],
    );
  }
}

const zohoError = (err, fallback) => {
  const d = err?.response?.data;
  const msg = d?.data?.[0]?.message || d?.message || d?.error || err?.message || fallback;
  const code = d?.data?.[0]?.code || d?.code || d?.error;
  return Object.assign(new Error(typeof msg === "string" ? msg : JSON.stringify(msg)), {
    status: err?.response?.status === 401 ? 502 : err?.response?.status || 502,
    zohoCode: code,
  });
};

async function tokenRequest(accountsUrl, params) {
  try {
    const { data } = await axios.post(`${accountsUrl}/oauth/v2/token`, null, { params, timeout: 20000 });
    if (!data?.access_token) throw Object.assign(new Error(data?.error === "invalid_code" ? "The Zoho code or token is not valid (it may be used or expired)" : `Zoho refused the token request: ${data?.error || "unknown error"}`), { status: 400 });
    return data;
  } catch (err) {
    if (err.status) throw err;
    throw zohoError(err, "Could not reach Zoho");
  }
}

/** OAuth consent link (state is a signed, short-lived token). */
function authorizeUrl(state, accountsUrl) {
  if (!configured()) throw Object.assign(new Error("Add ZOHO_CLIENT_ID and ZOHO_CLIENT_SECRET to backend/.env first"), { status: 400 });
  const p = new URLSearchParams({
    scope: SCOPES.join(","),
    client_id: clientId(),
    response_type: "code",
    access_type: "offline",
    redirect_uri: redirectUri(),
    prompt: "consent",
    state,
  });
  return `${safeAccountsUrl(accountsUrl)}/oauth/v2/auth?${p}`;
}

/** OAuth callback: code → tokens. Zoho sends `accounts-server` for the user's data centre. */
async function exchangeCode(code, accountsServer, userId) {
  const accountsUrl = safeAccountsUrl(accountsServer || DEFAULT_ACCOUNTS);
  const data = await tokenRequest(accountsUrl, {
    code,
    client_id: clientId(),
    client_secret: clientSecret(),
    redirect_uri: redirectUri(),
    grant_type: "authorization_code",
  });
  await saveTokens(data, accountsUrl, userId);
  await afterConnect();
}

/** Self Client: an administrator pastes a refresh token generated in the Zoho API console. */
async function connectWithRefreshToken(refreshToken, accountsUrlIn, userId) {
  if (!configured()) throw Object.assign(new Error("Add ZOHO_CLIENT_ID and ZOHO_CLIENT_SECRET to backend/.env first"), { status: 400 });
  const token = String(refreshToken || "").trim();
  if (!/^[\w.]{20,}$/.test(token)) throw Object.assign(new Error("That does not look like a Zoho refresh token"), { status: 400 });
  const accountsUrl = safeAccountsUrl(accountsUrlIn);
  const data = await tokenRequest(accountsUrl, {
    refresh_token: token,
    client_id: clientId(),
    client_secret: clientSecret(),
    grant_type: "refresh_token",
  });
  await run("DELETE FROM crm_zoho_connection WHERE `key` = ?", [KEY]);
  await saveTokens({ ...data, refresh_token: token }, accountsUrl, userId);
  await afterConnect();
}

async function afterConnect() {
  try {
    const org = await request("GET", "/org");
    const name = org?.org?.[0]?.company_name || org?.org?.[0]?.name || null;
    if (name) await run("UPDATE crm_zoho_connection SET orgName = ? WHERE `key` = ?", [name, KEY]);
  } catch {
    /* org name is only for display */
  }
}

async function disconnect() {
  const c = await connection();
  await run("DELETE FROM crm_zoho_connection WHERE `key` = ?", [KEY]);
  if (c?.refreshToken && configured()) {
    axios.post(`${c.accountsUrl}/oauth/v2/token/revoke`, null, { params: { token: c.refreshToken }, timeout: 10000 }).catch(() => {});
  }
}

async function accessToken(force = false) {
  const c = await connection();
  if (!c) throw Object.assign(new Error("Zoho Bigin is not connected"), { status: 400, notConnected: true });
  if (!force && c.accessToken && c.expiresAt && new Date(c.expiresAt).getTime() - 60000 > Date.now()) {
    return { token: c.accessToken, apiDomain: c.apiDomain };
  }
  const data = await tokenRequest(c.accountsUrl, {
    refresh_token: c.refreshToken,
    client_id: clientId(),
    client_secret: clientSecret(),
    grant_type: "refresh_token",
  });
  await saveTokens(data, c.accountsUrl, null);
  return { token: data.access_token, apiDomain: data.api_domain || c.apiDomain };
}

const apiBase = (apiDomain) =>
  `${String(apiDomain || process.env.ZOHO_API_DOMAIN || "https://www.zohoapis.in").replace(/\/$/, "")}/bigin/v2`;

/** One Bigin API call; refreshes the access token once on 401. */
async function request(method, path, { params, data } = {}, retried = false) {
  const { token, apiDomain } = await accessToken(retried);
  try {
    const res = await axios.request({
      method,
      url: apiBase(apiDomain) + path,
      params,
      data,
      timeout: 25000,
      headers: { Authorization: `Zoho-oauthtoken ${token}`, Accept: "application/json" },
    });
    return res.status === 204 ? {} : res.data;
  } catch (err) {
    if (err?.response?.status === 401 && !retried) return request(method, path, { params, data }, true);
    throw zohoError(err, "Bigin request failed");
  }
}

// ---------------------------------------------------------------- records

const PIPELINE_FIELDS = "id,Deal_Name,Sub_Pipeline,Stage,Amount,Closing_Date,Contact_Name,Account_Name,Owner,Description,Modified_Time,Created_Time";

async function listPipelines({ modifiedSince, maxPages = 20 } = {}) {
  const out = [];
  for (let page = 1; page <= maxPages; page++) {
    const res = await request("GET", "/Pipelines", {
      params: { fields: PIPELINE_FIELDS, per_page: 200, page, sort_by: "Modified_Time", sort_order: "desc" },
    });
    const rows = res?.data || [];
    let stop = false;
    for (const r of rows) {
      if (modifiedSince && r.Modified_Time && new Date(r.Modified_Time) < modifiedSince) {
        stop = true;
        break;
      }
      out.push(r);
    }
    if (stop || !res?.info?.more_records) break;
  }
  return out;
}

const getContact = (id) =>
  request("GET", `/Contacts/${encodeURIComponent(id)}`, { params: { fields: "id,First_Name,Last_Name,Email,Phone,Mobile,Account_Name,Mailing_City" } }).then((r) => r?.data?.[0] || null);

/** Find a contact by phone or email, or create one. Returns its id. */
async function upsertContact({ name, phone, email, company }) {
  const digits = String(phone || "").replace(/\D/g, "").slice(-10);
  const tries = [];
  if (digits.length === 10) tries.push(`((Mobile:equals:${digits})or(Phone:equals:${digits}))`);
  if (email) tries.push(`(Email:equals:${email})`);
  for (const criteria of tries) {
    try {
      const r = await request("GET", "/Contacts/search", { params: { criteria, fields: "id" } });
      if (r?.data?.[0]?.id) return r.data[0].id;
    } catch {
      /* search is best-effort */
    }
  }
  const parts = String(name || "").trim().split(/\s+/);
  const last = parts.length > 1 ? parts.pop() : parts[0] || "Customer";
  const first = parts.length ? parts.join(" ") : undefined;
  const rec = { Last_Name: last, ...(first ? { First_Name: first } : {}), ...(digits ? { Mobile: digits } : {}), ...(email ? { Email: email } : {}) };
  if (company) rec.Description = `Company: ${company}`;
  const r = await request("POST", "/Contacts", { data: { data: [rec] } });
  const row = r?.data?.[0];
  if (row?.status === "error") throw Object.assign(new Error(row.message || "Bigin refused the contact"), { status: 400 });
  return row?.details?.id || null;
}

async function writePipeline(biginId, record) {
  const r = biginId
    ? await request("PUT", `/Pipelines/${encodeURIComponent(biginId)}`, { data: { data: [record] } })
    : await request("POST", "/Pipelines", { data: { data: [record] } });
  const row = r?.data?.[0];
  if (row?.status === "error") {
    throw Object.assign(new Error(`${row.message || "Bigin refused the deal"}${row.details?.api_name ? ` (${row.details.api_name})` : ""}`), { status: 400 });
  }
  return row?.details?.id || biginId;
}

const deletePipeline = (biginId) => request("DELETE", `/Pipelines/${encodeURIComponent(biginId)}`);

/** Bigin pipelines and the stages of each (from the layout metadata, like INOS). */
async function pipelineStages() {
  const res = await request("GET", "/settings/layouts", { params: { module: "Pipelines" } });
  const out = {};
  for (const layout of res?.layouts || []) {
    const fields = (layout.sections || []).flatMap((s) => s.fields || []);
    const sub = fields.find((f) => ["sub_pipeline", "pipeline"].includes(String(f.api_name).toLowerCase()));
    for (const v of sub?.pick_list_values || []) {
      const stages = (v.maps || []).flatMap((m) => m.pick_list_values || []).map((s) => s.display_value);
      if (stages.length) out[v.display_value] = stages;
    }
  }
  if (!Object.keys(out).length) {
    // older orgs: one flat Stage picklist
    const f = await request("GET", "/settings/fields", { params: { module: "Pipelines" } });
    const stage = (f?.fields || []).find((x) => x.api_name === "Stage");
    const subs = (f?.fields || []).find((x) => x.api_name === "Sub_Pipeline");
    const names = (stage?.pick_list_values || []).map((s) => s.display_value);
    for (const s of subs?.pick_list_values || [{ display_value: "Sales Pipeline" }]) out[s.display_value] = names;
  }
  return out;
}

async function status() {
  const c = await connection().catch(() => null);
  return {
    configured: configured(),
    connected: Boolean(c),
    orgName: c?.orgName || null,
    accountsUrl: c?.accountsUrl || DEFAULT_ACCOUNTS,
    redirectUri: redirectUri(),
    lastSyncAt: c?.lastSyncAt || null,
    lastSyncResult: c?.lastSyncResult ? safeJson(c.lastSyncResult) : null,
    connectedAt: c?.createdAt || null,
  };
}
const safeJson = (s) => {
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
};

async function recordSync(result) {
  await run("UPDATE crm_zoho_connection SET lastSyncAt = NOW(), lastSyncResult = ? WHERE `key` = ?", [JSON.stringify(result), KEY]);
}

module.exports = {
  configured,
  connection,
  status,
  authorizeUrl,
  exchangeCode,
  connectWithRefreshToken,
  disconnect,
  request,
  listPipelines,
  getContact,
  upsertContact,
  writePipeline,
  deletePipeline,
  pipelineStages,
  recordSync,
  redirectUri,
};
