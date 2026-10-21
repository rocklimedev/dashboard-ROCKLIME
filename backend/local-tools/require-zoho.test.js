const test = require('node:test');
const assert = require('node:assert/strict');
const requireZoho = require('../modules/crm/require-zoho');

test('CRM reads and writes stay locked while Zoho is disconnected', async () => {
  for (const path of ['/board', '/deals', '/deals/123/stage', '/tasks', '/customer/123']) {
    let response,
      status,
      passed = false;
    await requireZoho(async () => ({ connected: false }))(
      { path },
      {
        status(code) {
          status = code;
          return this;
        },
        json(body) {
          response = body;
        },
      },
      () => {
        passed = true;
      },
    );
    assert.equal(status, 403);
    assert.equal(response.code, 'ZOHO_CONNECTION_REQUIRED');
    assert.equal(passed, false);
  }
});

test('connected CRM unlocks and connection setup remains available', async () => {
  let passed = 0;
  const disconnected = requireZoho(async () => {
    throw new Error('Setup should not check connection');
  });
  for (const path of ['/meta', '/bigin/status', '/bigin/authorize', '/bigin/token', '/bigin']) {
    await disconnected({ path }, {}, () => passed++);
  }
  await requireZoho(async () => ({ connected: true }))({ path: '/deals' }, {}, () => passed++);
  assert.equal(passed, 6);
});
