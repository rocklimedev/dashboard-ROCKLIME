const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { asList } = require('../modules/orders/dispatch-document');
const source = fs.readFileSync(
  require.resolve('../modules/orders/order-dispatch.controller'),
  'utf8',
);
const code = source.slice(
  source.indexOf('exports.markDispatchDelivered ='),
  source.indexOf('// GET /api/order/:id/pick-list'),
);
const res = () => ({
  statusCode: 200,
  status(code) {
    this.statusCode = code;
    return this;
  },
  json(body) {
    this.body = body;
    return this;
  },
});
function fixture() {
  const dispatch = {
    id: 'd',
    orderId: null,
    quotationId: 'q',
    status: 'DISPATCHED',
    items: [{ productId: 'p', quantity: 2, orderAllocations: [{ orderId: 'o', quantity: 2 }] }],
    update: async (values) => Object.assign(dispatch, values),
  };
  const order = {
    id: 'o',
    quotationId: 'q',
    status: 'DISPATCHED',
    update: async (values) => Object.assign(order, values),
  };
  const dependencies = {
    exports: {},
    OrderDispatch: { findOne: async () => dispatch, findAll: async () => [] },
    Order: { findByPk: async () => order },
    stock: { orderNeeds: async () => [{ needed: 0 }] },
    require: (path) =>
      path === './dispatch-document' ? { asList } : { creditedDispatches: async () => [dispatch] },
    sendErrorResponse: (response, status, message) => response.status(status).json({ message }),
    logOrderActivity: async () => {},
  };
  const deliver = new Function(
    ...Object.keys(dependencies),
    code + '; return exports.markDispatchDelivered;',
  )(...Object.values(dependencies));
  return { dispatch, order, deliver };
}
test('quotation delivery confirmation updates its credited order', async () => {
  const { dispatch, order, deliver } = fixture();
  const response = res();
  await deliver({ params: { dispatchId: 'd' }, body: { receivedBy: 'Site supervisor' } }, response);
  assert.equal(response.statusCode, 200);
  assert.equal(dispatch.status, 'DELIVERED');
  assert.equal(order.status, 'DELIVERED');
  assert.equal(dispatch.receivedBy, 'Site supervisor');
});
test('delivery confirmation requires a receiver or proof before changing status', async () => {
  const { dispatch, deliver } = fixture();
  const response = res();
  await deliver({ params: { dispatchId: 'd' }, body: {} }, response);
  assert.equal(response.statusCode, 400);
  assert.equal(dispatch.status, 'DISPATCHED');
});
