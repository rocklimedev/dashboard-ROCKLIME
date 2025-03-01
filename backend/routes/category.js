const express = require("express");
const categoryController = require("../controller/categoryController");
const checkPermission = require("../middleware/permission");

const router = express.Router();

router.post(
  "/",
  checkPermission("/categories_create"),
  categoryController.createCategory
);
router.get(
  "/all",
  checkPermission("/categories_view"),
  categoryController.getAllCategories
);
router.get(
  "/:id",
  checkPermission("/categories_view_by_id"),
  categoryController.getCategoryById
);
router.put(
  "/:id",
  checkPermission("/categories_update"),
  categoryController.updateCategory
);
router.delete(
  "/:id",
  checkPermission("/categories_delete"),
  categoryController.deleteCategory
);

module.exports = router;
