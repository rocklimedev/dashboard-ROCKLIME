const test = require('node:test');
const assert = require('node:assert/strict');
const authPath = require.resolve('../modules/zoho/zoho.auth');
const axiosPath = require.resolve('axios');
const modelsPath = require.resolve('../models');
const requests = [];
let refresh = false;
const grant = {
  userId: 'admin',
  accountsUrl: 'https://accounts.zoho.eu',
  accessToken: 'shared-access',
};
require.cache[authPath] = {
  id: authPath,
  filename: authPath,
  loaded: true,
  exports: {
    biginConnection: async () => grant,
    hasBiginGrant: async () => true,
    biginHost: (centre) => centre.replace('accounts.zoho.', 'www.zohoapis.'),
    access: async (userId, force) => {
      assert.equal(userId, 'admin');
      refresh = force;
      return grant;
    },
  },
};
require.cache[axiosPath] = {
  id: axiosPath,
  filename: axiosPath,
  loaded: true,
  exports: {
    request: async (options) => {
      requests.push(options);
      return { status: 200, data: { org: [] } };
    },
  },
};
require.cache[modelsPath] = {
  id: modelsPath,
  filename: modelsPath,
  loaded: true,
  exports: {
    sequelize: {
      query: async (sql) => {
        assert.match(sql, /^UPDATE zoho_connections SET lastSyncAt/);
        return [];
      },
    },
  },
};
const bigin = require('../modules/crm/bigin');
test('Bigin requests and sync metadata consume the unified Zoho grant', async () => {
  await bigin.request('GET', '/org');
  assert.equal(requests[0].headers.Authorization, 'Zoho-oauthtoken shared-access');
  assert.equal(requests[0].url, 'https://www.zohoapis.eu/bigin/v2/org');
  assert.equal(refresh, false);
  await bigin.recordSync({ updated: 2 });
  assert.equal((await bigin.status()).connected, true);
  await assert.rejects(bigin.disconnect(), /shared Zoho connection/);
});
