const express = require("express");
const multer = require("multer");
const router = express.Router();
const signatureController = require("../controller/signatureController");
const { auth } = require("../middleware/auth");
const checkPermission = require("../middleware/permission");

// Multer Configuration for Secure Image Uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["image/png", "image/jpeg", "image/jpg"];
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error("Only PNG or JPEG images are allowed"));
    }
    cb(null, true);
  },
}).single("file"); // Match frontend's FormData key

// Middleware for Handling File Upload Errors
const uploadMiddleware = (req, res, next) => {
  upload(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      return res
        .status(400)
        .json({ error: `File upload error: ${err.message}` });
    } else if (err) {
      return res.status(400).json({ error: err.message });
    }
    next();
  });
};

// API Routes with Authentication and Secure Uploads
router.post("/", auth, uploadMiddleware, signatureController.createSignature);
router.get("/", auth, signatureController.getAllSignatures);
router.put("/:id", auth, uploadMiddleware, signatureController.updateSignature); // Add uploadMiddleware
router.get("/:id", auth, signatureController.getSignatureById);
router.delete("/:id", auth, signatureController.deleteSignature);

module.exports = router;
