const axios = require('axios');
const auth = require('./zoho.auth');
const scopes = require('./planning.scopes');
const { fail } = require('../planning/validation');
const domains = {
  projects: {
    in: 'projects.zoho.in',
    com: 'projects.zoho.com',
    eu: 'projects.zoho.eu',
    'com.au': 'projects.zoho.com.au',
    jp: 'projects.zoho.jp',
    ca: 'projects.zohocloud.ca',
    'com.cn': 'projects.zoho.com.cn',
    sa: 'projects.zoho.sa',
    uk: 'projects.zoho.uk',
  },
  calendar: {
    in: 'calendar.zoho.in',
    com: 'calendar.zoho.com',
    eu: 'calendar.zoho.eu',
    'com.au': 'calendar.zoho.com.au',
    'com.cn': 'calendar.zoho.com.cn',
  },
};
function host(service, centre) {
  const suffix = new URL(auth.accountsUrl(centre)).hostname.replace('accounts.zoho.', '');
  const domain = domains[service]?.[suffix];
  if (!domain) throw fail('This Zoho service is not configured for your data centre.', 409);
  return `https://${domain}`;
}
async function request(userId, service, path, params, retry = true) {
  const row = await auth.access(userId);
  if (!auth.hasScopes(row, scopes[service]))
    throw fail(`Reconnect Zoho with planning access to enable ${service}.`, 409);
  const url = `${host(service, row.accountsUrl)}${path}`;
  try {
    return (
      await axios({
        method: 'GET',
        url,
        params,
        headers: {
          Authorization: `${service === 'projects' ? 'Bearer' : 'Zoho-oauthtoken'} ${row.accessToken}`,
        },
        timeout: 15000,
      })
    ).data;
  } catch (error) {
    if (error.response?.status === 401 && retry) {
      await auth.access(userId, true);
      return request(userId, service, path, params, false);
    }
    const status = error.response?.status;
    throw fail(
      status === 403 ? `Zoho ${service} access is restricted.` : `Could not reach Zoho ${service}.`,
      [403, 404, 429].includes(status) ? status : 502,
    );
  }
}
module.exports = { host, request };
