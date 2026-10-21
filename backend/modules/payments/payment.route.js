const express = require('express');
const { auth } = require('../../middleware/auth');
const { guardModule } = require('../../middleware/permission');
const c = require('./payment.controller');

const router = express.Router();
router.use(auth);
// Reading needs orders view; recording or cancelling a payment needs orders edit.
router.use(guardModule('orders', [{ method: 'POST', path: /./, action: 'edit' }]));

router.get('/due', c.due);
router.get('/order/:orderId', c.forOrder);
router.get('/', c.list);
router.post('/', c.create);
router.post('/:id/cancel', c.cancel);

module.exports = router;
