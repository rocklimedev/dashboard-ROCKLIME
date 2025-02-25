const express = require("express");
const {
  createBrand, getBrandById, getBrands, updateBrand, deleteBrand
} = require("../controller/brandController");

const router = express.Router();

router.post("/add", createBrand);
router.get("/", getBrands);
router.get("/:id", getBrandById);
router.put("/:id", updateBrand);
router.post("/:id", deleteBrand);


module.exports = router;
