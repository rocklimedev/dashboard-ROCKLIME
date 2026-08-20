const express = require("express");
const router = express.Router();

const orderController = require("./order.controller");
const orderDispatchController = require("./order-dispatch.controller");
const orderCreditNoteController = require("./order-credit-note.controller");

const { auth } = require("../../middleware/auth");

const multer = require("multer");
require("dotenv").config();

// ============================================================
// MULTER CONFIG
// ============================================================

const createUploader = (fieldName) => {
  return multer({
    storage: multer.memoryStorage(),

    fileFilter: (req, file, cb) => {
      const allowedTypes = [
        "application/pdf",
        "image/png",
        "image/jpeg",
        "image/jpg",
      ];

      if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error("Only PDF, PNG, JPG allowed"), false);
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

const uploadInvoice = createUploader("invoice");

const uploadGatePass = createUploader("gatepass");

const uploadCreditNote = createUploader("file");

const uploadReceivingDocument = createUploader("file");

// ============================================================
// DISPATCH DOCUMENT UPLOADER
// ============================================================

const uploadDispatchDocuments = multer({
  storage: multer.memoryStorage(),

  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "application/pdf",
      "image/png",
      "image/jpeg",
      "image/jpg",
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only PDF, PNG, JPG allowed"), false);
    }
  },

  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 2,
  },
}).fields([
  {
    name: "invoice",
    maxCount: 1,
  },
  {
    name: "gatePass",
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
// COMMENTS
// ============================================================

router.post("/comments", orderController.addComment);

router.get("/comments", orderController.getComments);

router.delete("/comments/:commentId", orderController.deleteComment);

router.post("/delete-comment", orderController.deleteCommentsByResource);

// ============================================================
// ORDER CRUD - STATIC ROUTES FIRST
// ============================================================

router.post("/create", orderController.createOrder);

router.get("/all", orderController.getAllOrders);

router.get("/recent", orderController.recentOrders);

router.get("/filter", orderController.getFilteredOrders);

router.get("/count", orderController.countOrders);

// ============================================================
// ORDER STATUS
// ============================================================

router.put("/update-status", orderController.updateOrderStatus);

// ============================================================
// ORDER TEAM
// ============================================================

router.put("/update-team", orderController.updateOrderTeam);

// ============================================================
// DRAFT
// ============================================================

router.post("/draft", orderController.draftOrder);

// ============================================================
// ORDER DELETE
// ============================================================

router.delete("/delete/:id", orderController.deleteOrder);

// ============================================================
// ORDER DOCUMENT UPLOADS
// ============================================================

// Invoice upload
router.put(
  "/invoice-upload/:orderId",
  handleUpload(uploadInvoice),
  orderController.uploadInvoiceAndLinkOrder,
);

// Gate pass upload
router.post(
  "/:orderId/gatepass",
  handleUpload(uploadGatePass),
  orderController.issueGatePass,
);

// ============================================================
// ORDER DOCUMENT DOWNLOADS
// ============================================================

// Invoice download
router.get("/:id/download-invoice", auth, orderController.downloadInvoice);

// Generic order document download
//
// Example:
// GET /api/order/:orderId/download?type=invoice
// GET /api/order/:orderId/download?type=gatepass
//
router.get("/:orderId/download", orderController.getDownloadDocument);

// Order summary/download
router.get("/:id/download-order", orderController.downloadOrder);

// ============================================================
// DISPATCH
// ============================================================

// Create partial/full dispatch
//
// POST /api/order/:id/dispatch
//
// multipart/form-data:
// - invoice
// - gatePass
//
// body:
// {
//   items: [
//     {
//       productId,
//       quantity
//     }
//   ],
//   carrier,
//   trackingNumber,
//   remarks
// }
//
router.post(
  "/:id/dispatch",
  handleFieldsUpload(uploadDispatchDocuments),
  orderDispatchController.createDispatch,
);

// Get all dispatches for order
router.get("/:id/dispatches", orderDispatchController.getOrderDispatches);

// ============================================================
// ORDER ACTIVITY
// ============================================================

router.get("/:id/activity", orderDispatchController.getOrderActivity);

// ============================================================
// CREDIT NOTES
// ============================================================

// Create credit note
//
// POST /api/order/:orderId/credit-note
//
// multipart/form-data:
// - file
//
// body:
// {
//   items: [
//     {
//       productId,
//       quantity,
//       reason
//     }
//   ],
//   remarks
// }
//
router.post(
  "/:id/credit-note",
  handleUpload(uploadCreditNote),
  orderCreditNoteController.createOrderCreditNote,
);

// Get all credit notes
router.get(
  "/:orderId/credit-notes",
  orderCreditNoteController.getOrderCreditNotes,
);

// Get specific credit note
router.get(
  "/:orderId/credit-note/:creditNoteId",
  orderCreditNoteController.getOrderCreditNoteById,
);

// Cancel credit note
router.delete(
  "/:orderId/credit-note/:creditNoteId",
  orderCreditNoteController.cancelOrderCreditNote,
);

// Upload / replace credit note document
router.post(
  "/:orderId/credit-note/:creditNoteId/document",
  handleUpload(uploadCreditNote),
  orderCreditNoteController.uploadCreditNoteDocument,
);

// ============================================================
// RECEIVING DOCUMENT
// ============================================================

router.post(
  "/:orderId/receiving-document",
  handleUpload(uploadReceivingDocument),
  orderDispatchController.uploadReceivingDocument,
);

// ============================================================
// GENERIC ORDER ROUTES
// ============================================================
//
// IMPORTANT:
// These parameter routes stay AFTER all static routes.
//
// ============================================================

// Get single order
router.get("/:id", orderController.getOrderDetails);

// Update complete order
router.put("/:id", orderController.updateOrderById);

// ============================================================
// EXPORT
// ============================================================

module.exports = router;
