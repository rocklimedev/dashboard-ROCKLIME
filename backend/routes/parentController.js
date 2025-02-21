const express = require("express");
const router = express.Router();
const parentCategoryController = require("../controller/parentCategoryController");

// Routes
router.post("/", parentCategoryController.createParentCategory);
router.get("/", parentCategoryController.getAllParentCategories);
router.get("/:id", parentCategoryController.getParentCategoryById);
router.put("/:id", parentCategoryController.updateParentCategory);
router.delete("/:id", parentCategoryController.deleteParentCategory);

module.exports = router;
