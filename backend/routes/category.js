const express = require("express");
const categoryController = require("../controller/categoryController")
const router = express.Router();

router.post("/", categoryController.createCategory)
router.get("/all", categoryController.getAllCategories)
router.get("/:id", categoryController.getCategoryById)
router.put("/:id", categoryController.updateCategory)
router.delete("/:id", categoryController.deleteCategory)


module.exports = router;
