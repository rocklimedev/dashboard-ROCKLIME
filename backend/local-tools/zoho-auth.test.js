const test = require('node:test');
const assert = require('node:assert/strict');
process.env.ZOHO_CLIENT_ID = 'test-client';
process.env.ZOHO_CLIENT_SECRET = 'test-secret';
process.env.JWT_SECRET = 'test-only-zoho-state-secret';
const dbPath = require.resolve('../config/database');
const axiosPath = require.resolve('axios');
const grants = new Map();
let owner = null,
  registry = false,
  refreshes = 0,
  partialScopes = false,
  denyService = false;
const calls = [];
const axios = {
  get: async () => {
    if (denyService) throw new Error('Service denied');
    return { data: {} };
  },
  post: async (url, body, options) => {
    const params = options.params;
    calls.push(params);
    if (params.grant_type === 'refresh_token') {
      refreshes++;
      return { data: { access_token: 'renewed', expires_in: 3600 } };
    }
    return {
      data: {
        access_token: 'access-' + params.code,
        refresh_token: 'refresh-' + params.code,
        expires_in: 3600,
        ...(partialScopes ? { scope: 'ZohoCliq.Chats.READ' } : {}),
      },
    };
  },
};
require.cache[axiosPath] = { id: axiosPath, filename: axiosPath, loaded: true, exports: axios };
require.cache[dbPath] = {
  id: dbPath,
  filename: dbPath,
  loaded: true,
  exports: {
    transaction: (fn) => fn({}),
    query: async (sql, { replacements: r = [] } = {}) => {
      if (sql.startsWith('SELECT z.*')) return [[grants.get(owner)].filter(Boolean)];
      if (sql.startsWith('SELECT service')) return [registry ? [{ service: 'bigin' }] : []];
      if (sql.startsWith('SELECT')) return [[grants.get(r[0])].filter(Boolean)];
      if (sql.startsWith('INSERT INTO zoho_connections'))
        grants.set(r[0], {
          userId: r[0],
          refreshToken: r[1],
          accessToken: r[2],
          accountsUrl: r[3],
          scope: r[4],
          expiresAt: r[5],
        });
      if (sql.startsWith('INSERT INTO zoho_service_connections')) {
        owner = r[0];
        registry = true;
      }
      if (sql.startsWith('UPDATE zoho_connections SET accessToken'))
        Object.assign(grants.get(r[2]), { accessToken: r[0], expiresAt: r[1] });
      if (sql.startsWith('UPDATE zoho_service_connections') && owner === r[0]) owner = '';
      if (sql.startsWith('DELETE FROM zoho_connections')) grants.delete(r[0]);
      return [];
    },
  },
};
const auth = require('../modules/zoho/zoho.auth');
const { verifyShare } = require('../lib/shareToken');

test('shared Zoho consent, token refresh and disconnect preserve service ownership', async () => {
  const consent = new URL(
    auth.authorize({ userId: 'admin', roles: ['ADMIN'] }, 'https://accounts.zoho.in'),
  );
  const scopes = consent.searchParams.get('scope');
  assert.match(scopes, /ZohoCliq.Chats.READ/);
  assert.match(scopes, /ZohoBigin.modules.ALL/);
  assert.match(consent.searchParams.get('redirect_uri'), /\/api\/zoho\/callback$/);
  assert.equal(verifyShare(consent.searchParams.get('state')).t, 'zoho');
  await auth.callback({ state: consent.searchParams.get('state'), code: 'admin' });
  assert.equal(grants.size, 1);
  assert.equal((await auth.biginConnection()).userId, 'admin');
  assert.deepEqual((await auth.status('admin')).services, {
    cliq: true,
    bigin: true,
    projects: false,
    calendar: false,
  });

  const personal = new URL(
    auth.authorize({ userId: 'sales', roles: ['USER'] }, 'https://accounts.zoho.eu'),
  );
  assert.doesNotMatch(personal.searchParams.get('scope'), /ZohoBigin/);
  await auth.callback({ state: personal.searchParams.get('state'), code: 'sales' });
  assert.equal((await auth.biginConnection()).userId, 'admin');
  assert.equal((await auth.status('sales')).ownsBigin, false);
  assert.equal((await auth.status('sales')).refreshToken, undefined);
  grants.get('admin').expiresAt = new Date(0);
  await Promise.all([auth.access('admin'), auth.access('admin')]);
  assert.equal(refreshes, 1);
  assert.equal((await auth.access('admin')).accessToken, 'renewed');

  await auth.disconnect('sales');
  assert.equal((await auth.status('sales')).connected, false);
  assert.equal((await auth.biginConnection()).userId, 'admin');
  await auth.disconnect('admin');
  assert.equal(await auth.biginConnection(), undefined);
  assert.equal(
    await auth.hasBiginGrant(),
    true,
    'legacy grants stay suppressed after shared disconnect',
  );
  await assert.rejects(auth.callback({ state: 'invalid', code: 'x' }), /expired/);
});
test('Zoho callback and data centres cannot be redirected to arbitrary hosts', () => {
  for (const centre of [
    'http://accounts.zoho.in',
    'https://accounts.zoho.in.evil.test',
    'https://user:secret@accounts.zoho.in',
    'https://accounts.zoho.in:8443',
  ])
    assert.throws(() => auth.accountsUrl(centre));
});

test('optional planning consent grants Projects and Calendar without taking company Bigin ownership', async () => {
  const url = new URL(
    auth.authorize({ userId: 'planner', roles: ['USER'] }, 'https://accounts.zoho.in', true),
  );
  assert.match(url.searchParams.get('scope'), /ZohoProjects.tasks.READ/);
  assert.match(url.searchParams.get('scope'), /ZohoCalendar.event.READ/);
  assert.doesNotMatch(url.searchParams.get('scope'), /ZohoBigin/);
  await auth.callback({ state: url.searchParams.get('state'), code: 'planner' });
  const status = await auth.status('planner');
  assert.equal(status.services.projects, true);
  assert.equal(status.services.calendar, true);
  assert.equal(status.ownsBigin, false);
});
test('incomplete consent or service access never records a connected grant', async () => {
  const url = new URL(auth.authorize({ userId: 'incomplete', roles: ['ADMIN'] }));
  const query = { state: url.searchParams.get('state'), code: 'incomplete' };
  partialScopes = true;
  await assert.rejects(auth.callback(query), /all requested permissions/);
  assert.equal(grants.has('incomplete'), false);
  partialScopes = false;
  denyService = true;
  await assert.rejects(auth.callback(query), /did not allow access/);
  assert.equal(grants.has('incomplete'), false);
  denyService = false;
});
