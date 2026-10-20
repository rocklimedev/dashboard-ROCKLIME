const axios = require("axios");
const db = require("../../config/database");
const { signShare, verifyShare } = require("../../lib/shareToken");
const CLIQ_SCOPES = ["ZohoCliq.Chats.READ", "ZohoCliq.Messages.READ", "ZohoCliq.Channels.READ", "ZohoCliq.Users.READ", "ZohoCliq.Webhooks.CREATE"];
const BIGIN_SCOPES = ["ZohoBigin.modules.ALL", "ZohoBigin.settings.ALL", "ZohoBigin.users.READ", "ZohoBigin.org.READ"];
const clientId = () => process.env.ZOHO_CLIENT_ID;
const clientSecret = () => process.env.ZOHO_CLIENT_SECRET;
const redirectUri = () => process.env.ZOHO_AUTH_REDIRECT_URI || `${(process.env.PUBLIC_BACKEND_URL || process.env.BACKEND_URL || "http://localhost:5050").replace(/\/$/, "")}/api/zoho/callback`;
const fail = (message, status = 400) => Object.assign(new Error(message), { status });
function accountsUrl(value = process.env.ZOHO_ACCOUNTS_URL || "https://accounts.zoho.in") {
  let url;
  try { url = new URL(value); } catch { throw fail("Invalid Zoho data centre"); }
  if (url.protocol !== "https:" || !/^accounts\.zoho\.(in|com|eu|com\.au|jp|ca|sa|uk|com\.cn)$/.test(url.hostname) || url.port || url.username || url.password) throw fail("Invalid Zoho data centre");
  return url.origin;
}
const isAdmin = user => (user?.roles || []).some(role => ["ADMIN", "SUPER_ADMIN", "DEVELOPER"].includes(role));
const cliqHost = centre => accountsUrl(centre).replace("accounts.", "cliq.");
const biginHost = centre => accountsUrl(centre).replace("accounts.zoho.", "www.zohoapis.");
const configured = () => Boolean(clientId() && clientSecret());
async function connection(userId) {
  const [rows] = await db.query("SELECT * FROM zoho_connections WHERE userId=?", { replacements: [userId] });
  return rows[0];
}
async function biginConnection() {
  const [rows] = await db.query("SELECT z.* FROM zoho_connections z JOIN zoho_service_connections s ON s.userId=z.userId WHERE s.service='bigin'");
  return rows[0];
}
async function hasBiginGrant() {
  const [rows] = await db.query("SELECT service FROM zoho_service_connections WHERE service='bigin'");
  return rows.length > 0;
}
const hasScopes = (row, scopes) => scopes.every(scope => String(row?.scope || "").split(/[ ,]+/).includes(scope));
async function status(userId) {
  const row = await connection(userId);
  const bigin = await biginConnection();
  return { connected: Boolean(row), configured: configured(), accountsUrl: row?.accountsUrl || accountsUrl(), redirectUri: redirectUri(),
    services: { cliq: hasScopes(row, CLIQ_SCOPES), bigin: hasScopes(bigin, BIGIN_SCOPES) }, ownsBigin: Boolean(bigin && bigin.userId === userId) };
}
function authorize(user, centre) {
  if (!configured()) throw fail("Configure ZOHO_CLIENT_ID and ZOHO_CLIENT_SECRET on the server.");
  const b = isAdmin(user);
  const state = signShare({ t: "zoho", u: user.userId, b, a: accountsUrl(centre) }, 1 / 96);
  const scopes = [...CLIQ_SCOPES, ...(b ? BIGIN_SCOPES : [])];
  return accountsUrl(centre) + "/oauth/v2/auth?" + new URLSearchParams({ scope: scopes.join(","), client_id: clientId(), response_type: "code", access_type: "offline", prompt: "consent", redirect_uri: redirectUri(), state });
}
async function token(centre, params) {
  try {
    const { data } = await axios.post(`${accountsUrl(centre)}/oauth/v2/token`, null, { params: { client_id: clientId(), client_secret: clientSecret(), ...params }, timeout: 20000 });
    if (!data.access_token) throw fail("Zoho authorization expired or was declined. Please reconnect.");
    return data;
  } catch (error) { throw error.status ? error : fail("Could not authorize Zoho. Please try again.", 502); }
}
async function callback(query) {
  const state = verifyShare(query.state);
  if (!state || state.t !== "zoho" || !state.u) throw fail("The Zoho connection link expired. Please try again.");
  if (query.error) throw fail("Zoho connection was cancelled or declined.");
  const centre = accountsUrl(query["accounts-server"] || state.a);
  const data = await token(centre, { code: String(query.code || ""), redirect_uri: redirectUri(), grant_type: "authorization_code" });
  const scopes = [...CLIQ_SCOPES, ...(state.b ? BIGIN_SCOPES : [])];
  if (!data.refresh_token || (data.scope && !hasScopes({ scope: data.scope }, scopes))) throw fail("Zoho did not grant all requested permissions. Please reconnect.");
  try {
    const headers = { Authorization: `Zoho-oauthtoken ${data.access_token}` };
    await Promise.all([
      axios.get(`${cliqHost(centre)}/api/v2/chats`, { headers, params: { limit: 1 }, timeout: 15000 }),
      ...(state.b ? [axios.get(`${biginHost(centre)}/bigin/v2/org`, { headers, timeout: 15000 })] : []),
    ]);
  } catch { throw fail("Zoho did not allow access to the requested services. Check your Bigin and Cliq access, then reconnect."); }
  await db.transaction(async transaction => {
    await db.query("INSERT INTO zoho_connections (userId, refreshToken, accessToken, accountsUrl, scope, expiresAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, NOW()) ON DUPLICATE KEY UPDATE refreshToken=VALUES(refreshToken), accessToken=VALUES(accessToken), accountsUrl=VALUES(accountsUrl), scope=VALUES(scope), expiresAt=VALUES(expiresAt), updatedAt=NOW()", {
      replacements: [state.u, data.refresh_token, data.access_token, centre, data.scope || scopes.join(","), new Date(Date.now() + (Number(data.expires_in) || 3600) * 1000)], transaction,
    });
    if (state.b) {
      await db.query("INSERT INTO zoho_service_connections (service,userId) VALUES ('bigin',?) ON DUPLICATE KEY UPDATE userId=VALUES(userId)", { replacements: [state.u], transaction });
      // Once replaced, an old Bigin-only grant must not reactivate on disconnect.
      await db.query("DELETE FROM crm_zoho_connection WHERE `key`='bigin'", { transaction });
    }
  });
  return state.u;
}
const refreshing = new Map();
async function access(userId, force = false) {
  const row = await connection(userId);
  if (!row) throw fail("Connect Zoho from Connectors.", 409);
  if (!force && row.accessToken && new Date(row.expiresAt).getTime() > Date.now() + 60000) return row;
  if (!refreshing.has(userId)) refreshing.set(userId, (async () => {
    const data = await token(row.accountsUrl, { refresh_token: row.refreshToken, grant_type: "refresh_token" });
    await db.query("UPDATE zoho_connections SET accessToken=?, expiresAt=?, updatedAt=NOW() WHERE userId=?", { replacements: [data.access_token, new Date(Date.now() + (Number(data.expires_in) || 3600) * 1000), userId] });
    return { ...row, accessToken: data.access_token };
  })().finally(() => refreshing.delete(userId)));
  return refreshing.get(userId);
}
async function disconnect(userId) {
  await db.transaction(async transaction => {
    await db.query("UPDATE zoho_service_connections SET userId='' WHERE userId=?", { replacements: [userId], transaction });
    await db.query("DELETE FROM zoho_connections WHERE userId=?", { replacements: [userId], transaction });
  });
}
module.exports = { status, authorize, callback, access, connection, biginConnection, hasBiginGrant, disconnect, accountsUrl, cliqHost, biginHost, redirectUri, configured, isAdmin, hasScopes, CLIQ_SCOPES, BIGIN_SCOPES };
