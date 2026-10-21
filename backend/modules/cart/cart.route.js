const express = require('express');
const router = express.Router();
const cartController = require('./cart.controller');
const { auth, isAdmin } = require('../../middleware/auth');
const { guardModule } = require('../../middleware/permission');

router.use(auth);
router.use(guardModule('cart'));

// A user works on their own cart. The userId sent by the client must be the
// logged-in user's, unless an admin is acting on someone else's cart.
const ownCartOnly = (req, res, next) => {
  const own = req.user.userId;
  const asked = req.params.userId || req.body?.userId;
  if (asked && asked !== own && !isAdmin(req.user)) {
    return res.status(403).json({ message: 'You can only use your own cart.' });
  }
  if (req.body && typeof req.body === 'object' && !req.body.userId) {
    req.body.userId = own;
  }
  next();
};

// Fixed paths before "/:userId"
router.get('/quotation-workspace', require('./quotation-workspace.controller').get);
router.post('/quotation-workspace', require('./quotation-workspace.controller').update);
router.get('/workspace', require('./quotation-workspace.controller').get);
router.post('/workspace', require('./quotation-workspace.controller').update);
router.get(
  '/all',
  (req, res, next) => {
    if (!isAdmin(req.user)) {
      return res.status(403).json({ message: 'Only admins can list all carts.' });
    }
    next();
  },
  cartController.getAllCarts,
);
router.post('/add', ownCartOnly, cartController.addToCart);
router.post('/add-to-cart', ownCartOnly, cartController.addProductToCart);
router.post('/update', ownCartOnly, cartController.updateCart);
router.post('/remove', ownCartOnly, cartController.removeFromCart);
router.post('/reduce', ownCartOnly, cartController.reduceQuantity);
router.post('/clear', ownCartOnly, cartController.clearCart);
router.post('/convert-to-cart/:quotationId', ownCartOnly, cartController.convertQuotationToCart);
router.get('/:userId', ownCartOnly, cartController.getCart);

module.exports = router;
