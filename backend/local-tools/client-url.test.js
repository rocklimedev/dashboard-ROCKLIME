const test = require('node:test');
const assert = require('node:assert/strict');
const clientUrl = require('../config/clientUrl');

test('frontend defaults match local and production deployments', () => {
  assert.equal(clientUrl({}), 'http://localhost:5173');
  assert.equal(clientUrl({ NODE_ENV: 'production' }), 'https://erp.cmtradingco.com');
});

test('configured origins take precedence and legacy local ports use Vite', () => {
  assert.equal(clientUrl({ CLIENT_URL: 'http://localhost:3000/' }), 'http://localhost:5173');
  assert.equal(clientUrl({ CLIENT_URL: 'http://127.0.0.1:3000' }), 'http://127.0.0.1:5173');
  assert.equal(
    clientUrl({ CLIENT_URL: 'https://erp.cmtradingco.com/', APP_URL: 'http://localhost:3000' }),
    'https://erp.cmtradingco.com',
  );
  assert.equal(clientUrl({ APP_URL: 'http://localhost:5173/' }), 'http://localhost:5173');
});
