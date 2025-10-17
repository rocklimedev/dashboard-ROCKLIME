const express = require("express");
const multer = require("multer");
const router = express.Router();
const signatureController = require("../controller/signatureController");
const { auth } = require("../middleware/auth");
const checkPermission = require("../middleware/permission");

// Multer configuration for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["image/png", "image/jpeg", "image/jpg"];
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error("Only PNG or JPEG images are allowed"));
    }
    cb(null, true);
  },
}).single("file");

const uploadMiddleware = (req, res, next) => {
  upload(req, res, (err) => {
    if (err instanceof multer.MulterError)
      return res
        .status(400)
        .json({ error: `File upload error: ${err.message}` });
    else if (err) return res.status(400).json({ error: err.message });
    next();
  });
};

// ==============================
// SIGNATURE ROUTES (ERP-ONLY)
// ==============================

// Create a new signature
router.post("/", auth, uploadMiddleware, signatureController.createSignature);

// Get all signatures
router.get("/", auth, signatureController.getAllSignatures);

// Get a signature by ID
router.get("/:id", auth, signatureController.getSignatureById);

// Update a signature
router.put("/:id", auth, uploadMiddleware, signatureController.updateSignature);

// Delete a single signature
router.delete("/:id", auth, signatureController.deleteSingleSignature);

// Get signatures by user
router.get("/user/:userId", auth, signatureController.getSignaturesByUser);

// Get signatures by customer
router.get(
  "/customer/:customerId",
  auth,
  signatureController.getSignaturesByCustomer
);

// Get signatures by vendor
router.get(
  "/vendor/:vendorId",
  auth,
  signatureController.getSignaturesByVendor
);

// Set a signature as default
router.put("/:id/default", auth, signatureController.setDefaultSignature);

// Get default signature for entity
router.get("/default", auth, signatureController.getDefaultSignature);

// Delete all signatures for an entity
router.delete("/", auth, signatureController.deleteAllSignaturesByEntity);

module.exports = router;
