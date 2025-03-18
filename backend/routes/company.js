const express = require("express");
const router = express.Router();
const companyController = require("../controller/companyController");
const checkPermission = require("../middleware/permission");
const role = require("../middleware/role"); // Role-based access middleware
const { ROLES } = require("../config/constant");

// Only Admin and SuperAdmin can create a company
router.post(
  "/",
  role.check(ROLES.Admin), // Only Admins can create companies
  checkPermission("write", "/companies"),
  companyController.createCompany
);

// All users can view companies
router.get(
  "/",
  role.check(ROLES.Users), // Minimum role required is Users
  checkPermission("view", "/companies"),
  companyController.getAllCompanies
);

// All users can view a specific company
router.get(
  "/:id",
  role.check(ROLES.Users),
  checkPermission("view", "/companies/:id"),
  companyController.getCompanyById
);

// Only Admin, SuperAdmin, and Accounts can view child companies
router.get(
  "/parent/:parentId",
  role.check(ROLES.Accounts), // Minimum role required is Accounts
  checkPermission("view", "/companies/parent/:parentId"),
  companyController.getChildCompanies
);

// Only Admin and SuperAdmin can edit a company
router.put(
  "/:id",
  role.check(ROLES.Admin), // Only Admins can edit companies
  checkPermission("edit", "/companies/:id"),
  companyController.updateCompany
);

// Only SuperAdmin can delete a company
router.delete(
  "/:id",
  role.check(ROLES.SuperAdmin), // Only SuperAdmin can delete companies
  checkPermission("delete", "/companies/:id"),
  companyController.deleteCompany
);

module.exports = router;
