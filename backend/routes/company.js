const express = require("express");
const router = express.Router();
const companyController = require("../controller/companyController");

router.post("/", companyController.createCompany);
router.get("/", companyController.getAllCompanies);
router.get("/:id", companyController.getCompanyById);
router.get("/parent/:parentId", companyController.getChildCompanies);
router.put("/:id", companyController.updateCompany);
router.delete("/:id", companyController.deleteCompany);

module.exports = router;
