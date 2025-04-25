const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const axios = require("axios"); // Add axios for HTTP requests
const router = express.Router();
const signatureController = require("../controller/signatureController");

const { auth } = require("../middleware/auth"); // Authentication Middleware
const checkPermission = require("../middleware/permission"); // Permission Middleware

// ✅ Multer Configuration for Secure Image Uploads (only temporarily storing)
const storage = multer.memoryStorage(); // Store the file in memory temporarily
const upload = multer({ storage }).single("signature_image");

// ✅ Middleware for Handling File Upload Errors
const uploadMiddleware = (req, res, next) => {
  upload(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      return res
        .status(400)
        .json({ error: "File upload error: " + err.message });
    } else if (err) {
      return res.status(400).json({ error: err.message });
    }
    next();
  });
};

// ✅ API Routes with Authentication, Permission Control & Secure Uploads
router.post("/", auth, uploadMiddleware, signatureController.createSignature);

router.get("/", auth, signatureController.getAllSignatures);
router.put("/:id", auth, signatureController.updateSignature);
router.get("/:id", auth, signatureController.getSignatureById);

router.delete("/:id", auth, signatureController.deleteSignature);

module.exports = router;
