const { test } = require('node:test');
const assert = require('node:assert/strict');
const { validateConfiguration } = require('../modules/settings/admin-configuration');
const { documentExportFilename } = require('../lib/documentExportFilename');
const Module = require('node:module');
const load = Module._load;
let registry = [];
Module._load = function (name, parent, ...args) {
  if (parent?.filename.endsWith('app-lock.js') && name.includes('settings.service'))
    return { getSetting: async () => ({ entries: registry }) };
  return load.call(this, name, parent, ...args);
};
const { checkAppLock, lockedApp } = require('../middleware/app-lock');
Module._load = load;
test('formats select document type and date format and sanitize filenames', () => {
  const options = {
    customerName: 'Test Customer',
    documentNumber: 'SO/10',
    date: '2026-10-27T20:00:00Z',
    documentType: 'order',
    formats: { order: '{number} - {date} - {customer}', dateFormat: 'YYYY-MM-DD' },
  };
  assert.equal(documentExportFilename(options), 'SO-10 - 2026-10-28 - Test Customer.pdf');
  assert.equal(
    documentExportFilename({ ...options, formats: { dateFormat: 'DD-MMM-YYYY' } }),
    'Test Customer - SO-10 - 28-Oct-2026.pdf',
  );
});
test('invalid templates and registries are rejected', () => {
  for (const value of ['{customer}', '{number}/{date}', '{number} - {unknown}'])
    assert.throws(() => validateConfiguration('documentExports', { quotation: value }));
  assert.throws(() =>
    validateConfiguration('apps', {
      entries: [
        {
          key: 'test',
          name: 'App',
          custom: true,
          home: '//external.com',
          module: 'orders',
          lockedRoles: [],
        },
      ],
    }),
  );
});
test('role locks apply only to selected roles; administrators retain access', () => {
  const entries = [{ key: 'quotations', lockedRoles: ['SALES'] }];
  assert.equal(
    lockedApp(entries, { roles: ['SALES'] }, 'quotations', 'quotations').key,
    'quotations',
  );
  assert.equal(lockedApp(entries, { roles: ['MANAGER'] }, 'quotations', 'quotations'), undefined);
  assert.equal(lockedApp(entries, { roles: ['ADMIN', 'SALES'] }, 'quotations', 'quotations'), null);
});
test('API locks distinguish Accounts from Orders and cover purchase orders and typed carts', async () => {
  registry = [
    { key: 'accounts', module: 'orders', lockedRoles: ['SALES'] },
    { key: 'purchase', module: 'purchase_orders', lockedRoles: ['SALES'] },
  ];
  const user = { roles: ['SALES'] };
  assert.equal((await checkAppLock({ originalUrl: '/api/payments' }, user)).key, 'accounts');
  assert.equal(await checkAppLock({ originalUrl: '/api/order/123' }, user), undefined);
  assert.equal(
    (await checkAppLock({ originalUrl: '/api/purchase-orders/123' }, user)).key,
    'purchase',
  );
  assert.equal(
    (
      await checkAppLock(
        { originalUrl: '/api/carts/workspace', body: { documentType: 'purchase-order' } },
        user,
      )
    ).key,
    'purchase',
  );
  assert.equal(await checkAppLock({ originalUrl: '/api/settings' }, user), null);
});

test('Admin Console can be disabled or locked while administrators retain recovery access', async () => {
  registry = [{ key: 'settings', name: 'Admin Console', enabled: false, lockedRoles: ['SALES'] }];
  assert.doesNotThrow(() => validateConfiguration('apps', { entries: registry }));
  assert.equal((await checkAppLock({ originalUrl: '/api/customers' }, { roles: ['SALES'] })).key, 'settings');
  assert.equal(await checkAppLock({ originalUrl: '/api/customers' }, { roles: ['ADMIN'] }), null);
  assert.equal(await checkAppLock({ originalUrl: '/api/settings' }, { roles: ['SALES'] }), null);
});
