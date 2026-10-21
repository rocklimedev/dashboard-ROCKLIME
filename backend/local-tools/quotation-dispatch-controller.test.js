const test = require('node:test');
const assert = require('node:assert/strict');
const clone = (value) => JSON.parse(JSON.stringify(value));
let activeOrder = null,
  lastLimits = null,
  synced = 0;
let events = [],
  stockQuantity = 20,
  committed = 0,
  rolledBack = 0,
  locks = 0;
const source = {
  quotationId: 'q1',
  reference_number: 'Q1',
  customerId: 'customer',
  status: 'SENT',
  products: [{ productId: 'p1', name: 'Tap', quantity: 5, price: 100 }],
};
const quotation = {
  ...source,
  toJSON: () => clone(source),
  update: async (values) => Object.assign(quotation, values),
};
let createdOrders = 0;
let queue = Promise.resolve();
const sequelize = {
  transaction(callback) {
    const result = queue.then(async () => {
      const before = clone(events),
        beforeStock = stockQuantity,
        beforeOrder = activeOrder,
        beforeCount = createdOrders;
      try {
        const value = await callback({ LOCK: { UPDATE: 'UPDATE' } });
        committed++;
        return value;
      } catch (error) {
        events = before;
        stockQuantity = beforeStock;
        activeOrder = beforeOrder;
        createdOrders = beforeCount;
        rolledBack++;
        throw error;
      }
    });
    queue = result.catch(() => {});
    return result;
  },
};
const mock = (path, exports) => {
  const id = require.resolve(path);
  require.cache[id] = { id, filename: id, loaded: true, exports };
};
mock('../config/database', sequelize);
mock('../models', {
  Quotation: {
    findByPk: async (id, opts) => {
      if (opts?.lock === 'UPDATE') locks++;
      return id === 'q1' ? quotation : null;
    },
  },
  Order: {
    findAll: async (opts) =>
      opts.where.status ? (activeOrder ? [activeOrder] : []) : [{ id: 'linked-order' }],
    create: async (values) => {
      createdOrders++;
      activeOrder = {
        ...values,
        id: 'linked-order',
        update: async (patch) => Object.assign(activeOrder, patch),
      };
      return activeOrder;
    },
  },
  Address: {
    findByPk: async (id) =>
      id === 'address' ? { customerId: 'customer' } : { customerId: 'another-customer' },
  },
  User: { findByPk: async (id) => (id === 'missing' ? null : { userId: id, status: true }) },
  Customer: { findByPk: async () => ({}) },
  OrderDispatch: {
    findAll: async () => events,
    count: async () => events.filter((event) => !event.orderId).length,
    create: async (value) => {
      const row = clone({ ...value, id: 'd' + (events.length + 1) });
      events.push(row);
      return row;
    },
    findByPk: async (id) => events.find((row) => row.id === id),
  },
});
mock('../middleware/permission', {
  can: async (user, module, action) =>
    user?.grants
      ? user.grants.includes(`${module}:${action}`)
      : (user?.allowed || []).includes(module),
});
mock('../modules/orders/order-number', async () => '191026101');
mock('../modules/stock/stock.service', {
  dispatchOut: async (_, items, opts) => {
    lastLimits = clone(opts.reservationLimits);
    const quantity = items.reduce((sum, item) => sum + item.quantity, 0);
    if (quantity > stockQuantity)
      throw Object.assign(new Error('Insufficient stock'), { status: 409 });
    stockQuantity -= quantity;
  },
  orderNeeds: async (order) => [
    {
      needed: Math.max(
        0,
        5 -
          events
            .flatMap((d) => d.items)
            .flatMap((item) => item.orderAllocations || [])
            .filter((a) => a.orderId === order.id)
            .reduce((sum, a) => sum + a.quantity, 0),
      ),
    },
  ],
  syncOrder: async () => {
    synced++;
  },
});
mock('../modules/settings/settings.service', { getSetting: async () => ({}) });
mock('../modules/quotations/quotation-pdf', {
  enrichQuotation: async (quotation, items) =>
    clone({ quotation, items, customer: { name: 'Customer' }, productInfo: {} }),
});
mock('../modules/orders/order-dispatch.controller', { transportFields: () => ({ values: {} }) });
const controller = require('../modules/orders/quotation-dispatch.controller');
const response = () => ({
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
const request = (quantity, id = 'q1') => ({
  params: { id },
  body: { items: [{ productId: 'p1', quantity }], orderName: 'Site order', shipTo: 'address' },
  user: { userId: 'user', allowed: ['orders'] },
});
const reset = () => {
  activeOrder = null;
  createdOrders = 0;
  lastLimits = null;
  synced = 0;
  events = [];
  stockQuantity = 20;
  committed = 0;
  rolledBack = 0;
  locks = 0;
};
test('quotation dispatch commits stock and immutable shipment snapshots together', async () => {
  reset();
  const res = response();
  await controller.create(request(2), res);
  assert.equal(res.statusCode, 201);
  assert.equal(stockQuantity, 18);
  assert.equal(committed, 1);
  assert.equal(locks, 1);
  assert.equal(events[0].documentSnapshot.items[0].quantity, 2);
  assert.equal(events[0].quotationId, 'q1');
  assert.equal(events[0].orderId, null);
  assert.equal(events[0].totalAmount, 200);
  source.products[0].price = 999;
  assert.equal(events[0].documentSnapshot.items[0].price, 100);
  source.products[0].price = 100;
});
test('concurrent shipments serialize and cannot exceed the quotation quantity', async () => {
  reset();
  const a = response(),
    b = response();
  await Promise.all([controller.create(request(3), a), controller.create(request(3), b)]);
  assert.deepEqual([a.statusCode, b.statusCode], [201, 400]);
  assert.equal(events.length, 1);
  assert.equal(stockQuantity, 17);
  assert.equal(rolledBack, 1);
});
test('stock failure rolls back the dispatch, leaving the remaining quantity intact', async () => {
  reset();
  stockQuantity = 1;
  const res = response();
  await controller.create(request(2), res);
  assert.equal(res.statusCode, 409);
  assert.equal(events.length, 0);
  assert.equal(stockQuantity, 1);
  assert.equal(activeOrder, null);
  assert.equal(createdOrders, 0);
});

test('first shipment creates a self-assigned order and subsequent shipments reuse it', async () => {
  reset();
  const first = response();
  await controller.create(request(2), first);
  assert.equal(first.statusCode, 201);
  assert.equal(createdOrders, 1);
  assert.equal(activeOrder.assignedUserId, 'user');
  assert.equal(activeOrder.assignedTeamId, null);
  assert.equal(activeOrder.description, 'Site order');
  assert.equal(activeOrder.shipTo, 'address');
  assert.equal(activeOrder.products[0].quantity, 5);
  assert.equal(activeOrder.finalAmount, 500);
  assert.equal(first.body.fullyDispatched, false);
  const second = response();
  await controller.create(request(3), second);
  assert.equal(second.statusCode, 201);
  assert.equal(createdOrders, 1);
  assert.equal(second.body.fullyDispatched, true);
  assert.equal(activeOrder.status, 'DISPATCHED');
  assert.equal(second.body.orders[0].id, activeOrder.id);
  const listed = response();
  await controller.list({ params: { id: 'q1' } }, listed);
  assert.equal(listed.body.fullyDispatched, true);
  assert.equal(listed.body.orders[0].id, activeOrder.id);
});

test('order assignment can select another user', async () => {
  reset();
  const req = request(1);
  req.body.assignedUserId = 'salesperson';
  const res = response();
  await controller.create(req, res);
  assert.equal(res.statusCode, 201);
  assert.equal(activeOrder.assignedUserId, 'salesperson');
});

test("missing name, another customer's address and invalid assignee cannot create an order or dispatch", async () => {
  for (const patch of [{ orderName: ' ' }, { shipTo: 'wrong' }, { assignedUserId: 'missing' }]) {
    reset();
    const req = request(1);
    Object.assign(req.body, patch);
    const res = response();
    await controller.create(req, res);
    assert.equal(res.statusCode, 400);
    assert.equal(createdOrders, 0);
    assert.equal(events.length, 0);
  }
});

test('quotation dispatch cannot bypass order permissions', async () => {
  for (const grants of [[], ['orders:view'], ['orders:write']]) {
    reset();
    const req = request(1);
    req.user.grants = grants;
    const res = response();
    await controller.create(req, res);
    assert.equal(res.statusCode, 403);
    assert.equal(createdOrders, 0);
    assert.equal(events.length, 0);
  }
});

test('automatic order carries quotation freight, GST, discounts and optional-line exclusions', async () => {
  reset();
  Object.assign(source, {
    gst: 18,
    shippingAmount: 50,
    extraDiscount: 10,
    extraDiscountType: 'percent',
    additionalDiscount: 20,
    miscellaneousChargeItems: [{ name: 'Handling', amount: 30 }],
  });
  source.products.push({ productId: 'optional', quantity: 10, price: 1000, isOption: true });
  try {
    const res = response();
    await controller.create(request(2), res);
    assert.equal(res.statusCode, 201);
    assert.equal(activeOrder.products.length, 1);
    assert.equal(activeOrder.shipping, 80);
    assert.equal(activeOrder.extraDiscount, 78);
    assert.equal(activeOrder.gstValue, 90.36);
    assert.equal(activeOrder.finalAmount, 592);
  } finally {
    source.products.pop();
    for (const key of [
      'gst',
      'shippingAmount',
      'extraDiscount',
      'extraDiscountType',
      'additionalDiscount',
      'miscellaneousChargeItems',
    ])
      delete source[key];
  }
});

test('legacy quotation dispatches are excluded from the new order quantities', async () => {
  reset();
  events.push({
    id: 'old',
    quotationId: 'q1',
    orderId: null,
    items: [{ productId: 'p1', quantity: 2 }],
  });
  const res = response();
  await controller.create(request(3), res);
  assert.equal(res.statusCode, 201);
  assert.equal(activeOrder.products[0].quantity, 3);
  assert.equal(activeOrder.finalAmount, 300);
  assert.equal(res.body.fullyDispatched, true);
});
test('linked order shipments count toward the quotation budget', async () => {
  reset();
  events.push({ id: 'old', orderId: 'linked-order', items: [{ productId: 'p1', quantity: 4 }] });
  const res = response();
  await controller.create(request(2), res);
  assert.equal(res.statusCode, 400);
  assert.equal(events.length, 1);
});
test('dispatch details enforce source permissions and return the saved document', async () => {
  reset();
  await controller.create(request(1), response());
  const forbidden = response();
  await controller.details({ params: { dispatchId: 'd1' }, user: { allowed: [] } }, forbidden);
  assert.equal(forbidden.statusCode, 403);
  const allowed = response();
  await controller.details(
    { params: { dispatchId: 'd1' }, user: { allowed: ['quotations'] } },
    allowed,
  );
  assert.equal(allowed.statusCode, 200);
  assert.equal(allowed.body.document.quotation.reference_number, 'Q1/D1');
});

test('linked reservations are credited and order status is synchronized in the transaction', async () => {
  reset();
  activeOrder = {
    id: 'linked-order',
    products: [{ productId: 'p1', name: 'Tap', quantity: 5, price: 100 }],
    status: 'PREPARING',
    update: async (values) => Object.assign(activeOrder, values),
  };
  const res = response();
  await controller.create(request(2), res);
  assert.equal(res.statusCode, 201);
  assert.deepEqual(lastLimits, { p1: { 'linked-order': 2 } });
  assert.equal(activeOrder.status, 'PARTIALLY_DISPATCHED');
  assert.equal(synced, 1);
  assert.deepEqual(events[0].items[0].orderAllocations, [{ orderId: 'linked-order', quantity: 2 }]);
});
