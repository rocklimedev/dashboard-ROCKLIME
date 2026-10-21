// Cliq uses the same OAuth grant and token refresh as Bigin.
const axios = require('axios');
const auth = require('../zoho.auth');
async function status(userId) {
  const shared = await auth.status(userId);
  return {
    connected: shared.services.cliq,
    configured: shared.configured,
    redirectUri: shared.redirectUri,
    webUrl: auth.cliqHost(shared.accountsUrl),
  };
}
async function request(userId, path, { method = 'GET', params, data } = {}, retry = true) {
  const row = await auth.access(userId);
  if (!auth.hasScopes(row, auth.CLIQ_SCOPES))
    throw Object.assign(new Error('Reconnect Zoho from Connectors to enable Cliq.'), {
      status: 409,
    });
  try {
    return (
      await axios({
        url: `${auth.cliqHost(row.accountsUrl)}/api/v2${path}`,
        method,
        params,
        data,
        headers: { Authorization: `Zoho-oauthtoken ${row.accessToken}` },
        timeout: 15000,
      })
    ).data;
  } catch (error) {
    if (error.response?.status === 401 && retry) {
      await auth.access(userId, true);
      return request(userId, path, { method, params, data }, false);
    }
    throw Object.assign(
      new Error(
        error.response?.status === 403
          ? 'Cliq access is restricted. Reconnect Zoho with the required permissions.'
          : 'Could not reach Zoho Cliq. Please try again.',
      ),
      { status: error.response?.status === 429 ? 429 : 502 },
    );
  }
}
module.exports = { status, request };
