const express = require("express");
const {
  createBrand,
  getBrandById,
  getBrands,
  updateBrand,
  deleteBrand,
} = require("../controller/brandController");
const checkPermission = require("../middleware/permission");

const router = express.Router();

router.post("/add", checkPermission("CREATE_BRAND"), createBrand);
router.get("/", checkPermission("VIEW_BRANDS"), getBrands);
router.get("/:id", checkPermission("VIEW_BRAND"), getBrandById);
router.put("/:id", checkPermission("UPDATE_BRAND"), updateBrand);
router.delete("/:id", checkPermission("DELETE_BRAND"), deleteBrand);

module.exports = router;
