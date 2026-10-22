const { test } = require('node:test');
const assert = require('node:assert/strict');
const authPath = require.resolve('../modules/zoho/zoho.auth');
const axiosPath = require.resolve('axios');
const calls = [];
let grant = true,
  failure = null,
  attempts = 0,
  refreshes = 0;
require.cache[authPath] = {
  id: authPath,
  filename: authPath,
  loaded: true,
  exports: {
    accountsUrl: (centre) => {
      if (!/^https:\/\/accounts\.zoho\.(in|eu|com|jp)$/.test(centre)) throw new Error('Bad centre');
      return centre;
    },
    access: async (userId, force) => {
      if (force) refreshes++;
      return {
        accessToken: `${userId}-${refreshes}`,
        accountsUrl: userId === 'bob' ? 'https://accounts.zoho.eu' : 'https://accounts.zoho.in',
      };
    },
    hasScopes: () => grant,
  },
};
require.cache[axiosPath] = {
  id: axiosPath,
  filename: axiosPath,
  loaded: true,
  exports: async (options) => {
    calls.push(options);
    attempts++;
    if (failure && (failure !== 401 || attempts % 2 === 1))
      throw { status: failure, response: { status: failure, data: { token: 'never disclose' } } };
    return { data: { items: [] } };
  },
};
const projects = require('../modules/zoho/projects/projects.service');
const calendar = require('../modules/zoho/calendar/calendar.service');

test('Zoho adapters select per-user credentials and current Projects V3 paths with pagination', async () => {
  await projects.portals('alice');
  assert.equal(calls.at(-1).url, 'https://projects.zoho.in/api/v3.1/portals');
  assert.equal(calls.at(-1).headers.Authorization, 'Bearer alice-0');
  await projects.tasks('bob', '123', '99999999999999999999', { page: '2', per_page: '25' });
  assert.equal(
    calls.at(-1).url,
    'https://projects.zoho.eu/api/v3/portal/123/projects/99999999999999999999/tasks',
  );
  assert.deepEqual(calls.at(-1).params, { page: 2, per_page: 25 });
  assert.throws(() => projects.tasks('alice', '../bad', '1', {}));
  assert.throws(() => projects.projects('alice', '1', { per_page: 10000 }));
});

test('Calendar encodes calendar UIDs and enforces the documented 31-day range', async () => {
  await calendar.events('alice', 'abc==', {
    start: '2026-10-01T00:00:00Z',
    end: '2026-10-22T00:00:00Z',
  });
  const call = calls.at(-1);
  assert.equal(call.url, 'https://calendar.zoho.in/api/v1/calendars/abc%3D%3D/events');
  assert.equal(call.headers.Authorization, 'Zoho-oauthtoken alice-0');
  assert.deepEqual(JSON.parse(call.params.range), {
    start: '20261001T000000Z',
    end: '20261022T000000Z',
  });
  assert.throws(() =>
    calendar.events('alice', 'abc', { start: '2026-10-01T00:00:00Z', end: '2026-12-01T00:00:00Z' }),
  );
  assert.throws(() =>
    calendar.events('alice', 'abc', { start: '2026-10-01T00:00:00Z', end: '2026-09-01T00:00:00Z' }),
  );
});

test('missing consent blocks provider requests; token rejection refreshes once; errors are sanitized', async () => {
  grant = false;
  const before = calls.length;
  await assert.rejects(projects.portals('alice'), { status: 409 });
  assert.equal(calls.length, before);
  grant = true;
  failure = 401;
  attempts = 0;
  await projects.portals('alice');
  assert.equal(refreshes, 1);
  assert.equal(attempts, 2);
  failure = 429;
  await assert.rejects(
    calendar.calendars('alice', {}),
    (error) => error.status === 429 && !error.message.includes('never disclose'),
  );
  failure = null;
});
