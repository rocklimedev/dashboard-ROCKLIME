const express = require("express");
const router = express.Router();
const companyController = require("../controller/companyController");
const checkPermission = require("../middleware/permission");

// Only Admin and SuperAdmin can create a company
router.post(
  "/",
  // checkPermission("write", "create_company", "companies", "/companies"),
  companyController.createCompany
);

// All users can view companies
router.get(
  "/",
  //  checkPermission("view", "get_all_companies", "companies", "/companies"),
  companyController.getAllCompanies
);

// All users can view a specific company
router.get(
  "/:id",
  //checkPermission("view", "get_company_by_id", "companies", "/companies/:id"),
  companyController.getCompanyById
);

// Only Admin, SuperAdmin, and Accounts can view child companies
router.get(
  "/parent/:parentId",
  // checkPermission(
  //   "view",
  //   "get_child_companies",
  //   "companies",
  //   "/companies/parent/:parentId"
  // ),
  companyController.getChildCompanies
);

// Only Admin and SuperAdmin can edit a company
router.put(
  "/:id",
  //checkPermission("edit", "update_company", "companies", "/companies/:id"),
  companyController.updateCompany
);

// Only SuperAdmin can delete a company
router.delete(
  "/:id",
  // checkPermission("delete", "delete_company", "companies", "/companies/:id"),
  companyController.deleteCompany
);

module.exports = router;
