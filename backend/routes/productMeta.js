const express = require("express");
const router = express.Router();
const productMetaController = require("../controller/productMetaController");
const { auth } = require("../middleware/auth");
router.use(auth);
router.post("/", productMetaController.createProductMeta);
router.get("/", productMetaController.getAllProductMeta);
router.get("/search", productMetaController.getProductMetaByTitle);
router.get("/:id", productMetaController.getProductMetaById);
router.put("/:id", productMetaController.updateProductMeta);
router.delete("/:id", productMetaController.deleteProductMeta);

module.exports = router;
