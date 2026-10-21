const test = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const request = require('supertest');
process.env.SHARE_SECRET = 'dispatch-test-signing-secret';
const { signShare } = require('../lib/shareToken');
const mock = (path, exports) => {
  const id = require.resolve(path);
  require.cache[id] = { id, filename: id, loaded: true, exports };
};
let lookedUp = [],
  options;
mock('../modules/orders/quotation-dispatch.controller', {
  dispatchData: async (id) => {
    lookedUp.push(id);
    return {
      document: {
        quotation: { reference_number: 'Q1/D1' },
        items: [{ productId: 'p', quantity: 2 }],
      },
    };
  },
});
mock('../modules/quotations/quotation-pdf', {
  renderQuotationPdf: async (document, opts) => {
    options = opts;
    assert.equal(document.items[0].quantity, 2);
    return { buffer: Buffer.from('%PDF-dispatch-test'), filename: 'Q1/D1.pdf' };
  },
});
mock('../modules/settings/settings.service', { getSetting: async () => ({}) });
const app = express();
app.use(require('../modules/public/public.route'));
test('public dispatch PDFs require an unexpired dispatch-specific signature', async () => {
  lookedUp = [];
  for (const token of [
    'invalid',
    signShare({ t: 'q', id: 'q1' }),
    signShare({ t: 'dispatch', id: 'd' }, -1),
  ])
    await request(app)
      .get('/dispatch/' + token + '.pdf')
      .expect(404);
  assert.deepEqual(lookedUp, []);
  const token = signShare({ t: 'dispatch', id: 'd1', s: 'compact', c: 0 });
  const response = await request(app)
    .get('/dispatch/' + token + '.pdf')
    .expect(200);
  assert.deepEqual(lookedUp, ['d1']);
  assert.equal(options.documentLabel, 'Dispatch');
  assert.equal(options.style, 'compact');
  assert.equal(options.cover, false);
  assert.match(response.headers['content-disposition'], /Dispatch-Q1-D1.pdf/);
  assert.equal(response.headers['x-robots-tag'], 'noindex');
});
