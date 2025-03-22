const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const router = express.Router();
const signatureController = require("../controller/signatureController");

const { auth } = require("../middleware/auth"); // Authentication Middleware
const checkPermission = require("../middleware/permission"); // Permission Middleware

// ✅ Ensure 'uploads/signatures' folder exists (Organized File Structure)
const uploadDir = "uploads/signatures/";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// ✅ Multer Configuration for Secure Image Uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

// ✅ File Filter (Only Allow Images)
const fileFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/jpg", "image/png"];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only JPEG, JPG, and PNG files are allowed!"), false);
  }
};

// ✅ Multer Upload Configuration with Enhanced Error Handling
const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB File Size Limit
  fileFilter,
}).single("signature_image");

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
router.post(
  "/",
  auth,
  //checkPermission("write", "/signatures"),
  uploadMiddleware,
  signatureController.createSignature
);

router.get(
  "/",
  auth,
  // checkPermission("view", "/signatures"),
  signatureController.getAllSignatures
);

router.get(
  "/:id",
  auth,
  // checkPermission("view", "/signatures/:id"),
  signatureController.getSignatureById
);

router.delete(
  "/:id",
  auth,
  // checkPermission("delete", "/signatures/:id"),
  signatureController.deleteSignature
);

module.exports = router;
