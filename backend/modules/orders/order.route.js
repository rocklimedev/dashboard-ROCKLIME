const express = require('express');
const router = express.Router();

const quotationDispatch = require('./quotation-dispatch.controller');
const orderController = require('./order.controller');
const orderDispatchController = require('./order-dispatch.controller');
const orderCreditNoteController = require('./order-credit-note.controller');
const orderProductController = require('./order-product.controller');
const { auth } = require('../../middleware/auth');
const { guardModule } = require('../../middleware/permission');

const multer = require('multer');
require('dotenv').config();

// ============================================================
// MULTER CONFIG
// ============================================================

const createUploader = (fieldName) => {
  return multer({
    storage: multer.memoryStorage(),

    fileFilter: (req, file, cb) => {
      const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];

      if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('Only PDF, PNG, JPG allowed'), false);
      }
    },

    limits: {
      fileSize: 5 * 1024 * 1024,
    },
  }).single(fieldName);
};

// ============================================================
// GENERIC UPLOAD ERROR HANDLER
// ============================================================

const handleUpload = (uploader) => (req, res, next) => {
  uploader(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({
        message: `Upload error: ${err.message}`,
      });
    }

    if (err) {
      return res.status(400).json({
        message: err.message,
      });
    }

    next();
  });
};

// ============================================================
// UPLOADERS
// ============================================================

const uploadInvoice = createUploader('invoice');

const uploadGatePass = createUploader('gatepass');

const uploadCreditNote = createUploader('file');

const uploadReceivingDocument = createUploader('file');

// ============================================================
// DISPATCH DOCUMENT UPLOADER
// ============================================================

const uploadDispatchDocuments = multer({
  storage: multer.memoryStorage(),

  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, PNG, JPG allowed'), false);
    }
  },

  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 2,
  },
}).fields([
  {
    name: 'invoice',
    maxCount: 1,
  },
  {
    name: 'gatePass',
    maxCount: 1,
  },
]);

const handleFieldsUpload = (uploader) => (req, res, next) => {
  uploader(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({
        message: `Upload error: ${err.message}`,
      });
    }

    if (err) {
      return res.status(400).json({
        message: err.message,
      });
    }

    next();
  });
};

// ============================================================
// ACCESS: every order route needs a login plus "orders" permission
// ============================================================

router.use(auth);
router.use(
  guardModule('orders', [
    { method: 'POST', path: /^\/dispatch\/[^/]+\/(?:delivered|share)$/, skip: true },
    { method: 'GET', path: /^\/dispatch-history$/, skip: true },
    { method: 'GET', path: /^\/dispatch\/[^/]+(?:\/pdf)?$/, skip: true },
    { path: /^\/comments/, action: 'view' },
    { method: 'POST', path: /^\/delete-comment$/, action: 'view' },
    { method: 'POST', path: /^\/low-stock-products$/, action: 'view' },
  ]),
);

// Who did it always comes from the login, never from the request body.
router.use((req, res, next) => {
  if (req.body && typeof req.body === 'object' && !Array.isArray(req.body)) {
    if ('userId' in req.body) req.body.userId = req.user.userId;
    if (req.method === 'POST' && /^\/(create|draft)$/.test(req.path)) {
      req.body.createdBy = req.user.userId;
    }
  }
  next();
});

// ============================================================
// COMMENTS
// ============================================================

router.post('/comments', orderController.addComment);

router.get('/comments', orderController.getComments);

router.delete('/comments/:commentId', orderController.deleteComment);

router.post('/delete-comment', orderController.deleteCommentsByResource);

// ============================================================
// ORDER CRUD - STATIC ROUTES FIRST
// ============================================================

router.post('/create', orderController.createOrder);

router.get('/all', orderController.getAllOrders);

router.get('/status-counts', orderController.statusCounts);

router.get('/recent', orderController.recentOrders);

router.get('/filter', orderController.getFilteredOrders);

router.get('/count', orderController.countOrders);
router.get('/:id/pdf', require('./order-document').pdf);

// ============================================================
// ORDER STATUS
// ============================================================

router.put('/update-status', orderController.updateOrderStatus);

// ============================================================
// ORDER TEAM
// ============================================================

router.put('/update-team', orderController.updateOrderTeam);

// ============================================================
// DRAFT
// ============================================================

router.post('/draft', orderController.draftOrder);
router.get('/dispatch-history', orderDispatchController.getAllDispatchHistory);
router.get('/dispatch/:dispatchId', quotationDispatch.details);
router.get('/dispatch/:dispatchId/pdf', quotationDispatch.pdf);
router.post('/dispatch/:dispatchId/share', quotationDispatch.share);
router.post(
  '/dispatch/:dispatchId/delivered',
  quotationDispatch.authorizeDelivery,
  handleUpload(createUploader('file')),
  orderDispatchController.markDispatchDelivered,
);
// ============================================================
// ORDER DELETE
// ============================================================

router.delete('/delete/:id', orderController.deleteOrder);

// ============================================================
// ORDER DOCUMENT UPLOADS
// ============================================================

// Invoice upload
router.put(
  '/invoice-upload/:orderId',
  handleUpload(uploadInvoice),
  orderController.uploadInvoiceAndLinkOrder,
);
// Check products before the order exists
router.post('/low-stock-products', orderProductController.getLowStockProductsForIncomingOrder);
// Gate pass upload
router.post('/:orderId/gatepass', handleUpload(uploadGatePass), orderController.issueGatePass);

// ============================================================
// ORDER DOCUMENT DOWNLOADS
// ============================================================

// Invoice download
router.get('/:id/download-invoice', orderController.downloadInvoice);

router.get('/:orderId/download', orderController.getDownloadDocument);

// Order summary/download
router.get('/:id/download-order', require('./order-document').pdf);

// ============================================================
// DISPATCH
// ============================================================

router.post(
  '/:id/dispatch',
  handleFieldsUpload(uploadDispatchDocuments),
  orderDispatchController.createDispatch,
);

// Get all dispatches for order
router.get('/:id/dispatches', orderDispatchController.getOrderDispatches);

router.post(
  '/:orderId/dispatches/:dispatchId/delivered',
  handleUpload(createUploader('file')),
  orderDispatchController.markDispatchDelivered,
);
router.get('/:id/pick-list', orderDispatchController.pickList);

router.get(
  '/:orderId/dispatches/:dispatchId/download',
  orderDispatchController.getDispatchDocument,
);
// ============================================================
// ORDER ACTIVITY
// ============================================================

router.get('/:id/activity', orderDispatchController.getOrderActivity);

// ============================================================
// CREDIT NOTES
// ============================================================

router.post(
  '/:id/credit-note',
  handleUpload(uploadCreditNote),
  orderCreditNoteController.createOrderCreditNote,
);

// Get all credit notes
router.get('/:orderId/credit-notes', orderCreditNoteController.getOrderCreditNotes);

// Get specific credit note
router.get('/:orderId/credit-note/:creditNoteId', orderCreditNoteController.getOrderCreditNoteById);

// Cancel credit note
router.delete(
  '/:orderId/credit-note/:creditNoteId',
  orderCreditNoteController.cancelOrderCreditNote,
);

// Upload / replace credit note document
router.post(
  '/:orderId/credit-note/:creditNoteId/document',
  handleUpload(uploadCreditNote),
  orderCreditNoteController.uploadCreditNoteDocument,
);

// ============================================================
// RECEIVING DOCUMENT
// ============================================================

router.post(
  '/:orderId/receiving-document',
  handleUpload(uploadReceivingDocument),
  orderDispatchController.uploadReceivingDocument,
);

// Get single order
router.get('/:id', orderController.getOrderDetails);

// ============================================================
// ORDER PRODUCT / STOCK
// ============================================================

// Get low-stock products belonging to an order
//
// GET /api/order/:id/low-stock-products
//
router.get('/:id/low-stock-products', orderProductController.getLowStockProductByOrderId);

// Update complete order
router.put('/:id', orderController.updateOrderById);

// ============================================================
// EXPORT
// ============================================================

module.exports = router;
