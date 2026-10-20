const test = require("node:test");
const assert = require("node:assert/strict");
const authPath = require.resolve("../modules/zoho/zoho.auth");
const axiosPath = require.resolve("axios");
const calls = [];
const grants = { alice: { userId: "alice", accessToken: "alice-access", accountsUrl: "https://accounts.zoho.in" }, bob: { userId: "bob", accessToken: "bob-access", accountsUrl: "https://accounts.zoho.eu" } };
require.cache[authPath] = { id: authPath, filename: authPath, loaded: true, exports: {
  access: async id => { if (!grants[id]) throw new Error("Connect Zoho"); return grants[id]; },
  hasScopes: () => true, CLIQ_SCOPES: [], cliqHost: centre => centre.replace("accounts.", "cliq."),
  status: async id => ({ services: { cliq: Boolean(grants[id]) }, configured: true, accountsUrl: grants[id]?.accountsUrl || "https://accounts.zoho.in", redirectUri: "/api/zoho/callback" }),
} };
const axios = async options => { calls.push(options); return { data: { chats: [] } }; };
require.cache[axiosPath] = { id: axiosPath, filename: axiosPath, loaded: true, exports: axios };
const cliq = require("../modules/cliq/cliq.service");
test("Cliq consumes shared Zoho authentication without sharing users' chat tokens", async () => {
  await cliq.request("alice", "/chats");
  assert.equal(calls.at(-1).headers.Authorization, "Zoho-oauthtoken alice-access");
  assert.equal(calls.at(-1).url, "https://cliq.zoho.in/api/v2/chats");
  await cliq.request("bob", "/chats");
  assert.equal(calls.at(-1).headers.Authorization, "Zoho-oauthtoken bob-access");
  const status = await cliq.status("alice");
  assert.equal(status.connected, true);
  assert.equal(status.accessToken, undefined);
  assert.equal(status.redirectUri, "/api/zoho/callback");
  await assert.rejects(cliq.request("unconnected", "/chats"), /Connect Zoho/);
});
