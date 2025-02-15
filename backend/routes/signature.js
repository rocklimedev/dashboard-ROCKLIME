const express = require("express");
const multer = require("multer");
const router = express.Router();
const signatureController = require("../controller/signatureController");

// Multer Configuration for Image Uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // Save images in 'uploads' folder
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage });

// API Routes
router.post("/", upload.single("signature_image"), signatureController.createSignature);
router.get("/", signatureController.getAllSignatures);
router.get("/:id", signatureController.getSignatureById);
router.delete("/:id", signatureController.deleteSignature);

module.exports = router;
