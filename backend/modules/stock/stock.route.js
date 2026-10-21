const express = require('express');
const router = express.Router();
const { auth } = require('../../middleware/auth');
const { guardModule } = require('../../middleware/permission');
const c = require('./stock.controller');

router.use(auth);
// Reading stock needs "inventory" view; any change needs "inventory" edit.
router.use(
  guardModule('inventory', [
    { method: 'GET', path: /^\/orders\//, module: 'orders', action: 'view' },
    { method: 'POST', path: /^\/availability$/, action: 'view' },
    { method: 'POST', path: /./, action: 'edit' },
    { method: 'PUT', path: /./, action: 'edit' },
  ]),
);

// Operations app
const ops = require('./operations');
const send = (fn) => async (req, res) => {
  try {
    res.json(await fn(req));
  } catch (err) {
    res
      .status(err.status || 500)
      .json({ message: err.message || 'Request failed', details: err.details });
  }
};
router.get(
  '/ops/board',
  send(() => ops.board()),
);
router.get(
  '/ops/receivable',
  send(async () => ({ data: await ops.receivable() })),
);
router.get(
  '/ops/gate-passes',
  send((req) => ops.gatePasses(req.query)),
);
router.post('/ops/entry', async (req, res) => {
  try {
    res.status(201).json(await ops.entry(req.body || {}, req.user.userId));
  } catch (err) {
    res
      .status(err.status || 500)
      .json({ message: err.message || 'Stock entry failed', details: err.details });
  }
});

router.get('/overview', c.overview);
router.post('/availability', c.availability);
router.get('/backorders', c.backorders);
// Reorder suggestions grouped by vendor
router.get('/reorder', async (req, res) => {
  try {
    res.json({ data: await require('./reorder').suggestions() });
  } catch (err) {
    res.status(500).json({ message: err.message || 'Could not work out reorder suggestions' });
  }
});
router.get('/ledger', c.ledger);
router.get('/products/:productId', c.productDetail);
router.get('/orders/:orderId', c.orderStock);
router.post('/orders/:orderId/resync', c.resyncOrder);

router.post('/adjust', c.adjust);
router.post('/transfer', c.transfer);
router.post('/reallocate', c.reallocate);

router.get('/warehouses', c.listWarehouses);
router.post('/warehouses', c.saveWarehouse);
router.put('/warehouses/:id', c.saveWarehouse);

router.get('/counts', c.listCounts);
router.post('/counts', c.createCount);
router.get('/counts/:id', c.getCount);
router.put('/counts/:id/lines', c.saveCountLines);
router.post('/counts/:id/approve', c.approveCount);

module.exports = router;
