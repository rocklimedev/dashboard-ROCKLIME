const express = require("express");
const router = express.Router();
const orderController = require("../controller/orderController");
const checkPermission = require("../middleware/permission");
const multer = require("multer");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const ftp = require("basic-ftp");
require("dotenv").config();

// Configure Multer for memory storage (temporary before FTP upload)
// Multer memory storage (for direct FTP upload later)
const upload = multer({
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
      cb(new Error("Only PDF, PNG, and JPG files are allowed"), false);
    }
  },
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
}).single("invoice");

// Routes

// Route definitions
router.post("/comments", orderController.addComment);
router.get("/comments", orderController.getComments);
router.delete("/comments/:commentId", orderController.deleteComment);
router.post("/delete-comment", orderController.deleteCommentsByResource);
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
router.put(
  "/invoice-upload/:orderId",
  (req, res, next) => {
    upload(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        return res
          .status(400)
          .json({ message: `Multer error: ${err.message}` });
      } else if (err) {
        return res.status(400).json({ message: err.message });
      }
      next();
    });
  },
  orderController.uploadInvoiceAndLinkOrder
);
//
router.get("/count", orderController.countOrders);

module.exports = router;
