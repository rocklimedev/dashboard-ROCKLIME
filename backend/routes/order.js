const express = require("express");
const router = express.Router();
const orderController = require("../controller/orderController");
const checkPermission = require("../middleware/permission");
const { auth } = require("../middleware/auth");
const multer = require("multer");
require("dotenv").config();

// router.use(auth);
// ──────── MULTER CONFIG ────────
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
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  }).single(fieldName);
};

// Separate uploaders
const uploadInvoice = createUploader("invoice");
const uploadGatePass = createUploader("gatepass");

// ──────── ROUTES ────────
router.post("/comments", orderController.addComment);
router.get("/comments", orderController.getComments);
router.delete("/comments/:commentId", orderController.deleteComment);
router.post("/delete-comment", orderController.deleteCommentsByResource);
router.get("/:id/download-invoice", auth, orderController.downloadInvoice);
router.post("/create", orderController.createOrder);
router.get("/all", orderController.getAllOrders);
router.get("/:id", orderController.getOrderDetails);
router.put("/update-status", orderController.updateOrderStatus);
router.delete("/delete/:id", orderController.deleteOrder);
router.get("/recent", orderController.recentOrders);
router.put("/:id", orderController.updateOrderById);
router.post("/draft", orderController.draftOrder);
router.get("/filter", orderController.getFilteredOrders);
router.put("/update-team", orderController.updateOrderTeam);

// ── INVOICE UPLOAD ──
router.put(
  "/invoice-upload/:orderId",
  (req, res, next) => {
    uploadInvoice(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        return res
          .status(400)
          .json({ message: `Upload error: ${err.message}` });
      } else if (err) {
        return res.status(400).json({ message: err.message });
      }
      next();
    });
  },
  orderController.uploadInvoiceAndLinkOrder,
);

// ── GATEPASS UPLOAD ──
router.post(
  "/:orderId/gatepass",
  (req, res, next) => {
    uploadGatePass(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        return res
          .status(400)
          .json({ message: `Gatepass upload error: ${err.message}` });
      } else if (err) {
        return res.status(400).json({ message: err.message });
      }
      next();
    });
  },
  orderController.issueGatePass,
);

router.get("/count", orderController.countOrders);

module.exports = router;
