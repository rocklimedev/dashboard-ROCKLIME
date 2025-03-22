const express = require("express");
const router = express.Router();
const quotationController = require("../controller/quotationController");
const { auth } = require("../middleware/auth"); // Authentication middleware
const checkPermission = require("../middleware/permission"); // Permission middleware
const role = require("../middleware/role"); // Role-based access control (RBAC)
const { ROLES } = require("../config/constant"); // User role constants

// ✅ Create a new quotation (Only Admins & Managers)
router.post(
  "/add",
  auth,
  // role.check([ROLES.Admin, ROLES.Manager]),
  // checkPermission("write", "/quotations"),
  quotationController.createQuotation
);

// ✅ Get all quotations (Admins, Managers & Sales Team)
router.get(
  "/",
  auth,
  // role.check([ROLES.Admin, ROLES.Manager, ROLES.Sales]),
  //checkPermission("view", "/quotations"),
  quotationController.getAllQuotations
);

// ✅ Get a single quotation by ID (Admins, Managers & Sales Team)
router.get(
  "/:id",
  auth,
  //role.check([ROLES.Admin, ROLES.Accounts, ROLES.SALES]),
  //checkPermission("view", "/quotations/:id"),
  quotationController.getQuotationById
);

// ✅ edit a quotation by ID (Only Admins & Managers)
router.put(
  "/:id",
  auth,
  // role.check([ROLES.Admin, ROLES.Accounts]),
  //  checkPermission("edit", "/quotations/:id"),
  quotationController.updateQuotation
);

// ✅ Delete a quotation by ID (Only Admins)
router.delete(
  "/:id",
  auth,
  role.check(ROLES.Admin),
  checkPermission("delete", "/quotations/:id"),
  quotationController.deleteQuotation
);

// ✅ Export a quotation by ID (Admins, Managers & Sales Team)
router.post(
  "/export/:id",
  auth,
  //  role.check([ROLES.Admin, ROLES.Accounts, ROLES.SALES]),
  //  checkPermission("export", "/quotations/:id"),
  quotationController.exportQuotation
);
router.post("/clone/:id", quotationController.cloneQuotation);
module.exports = router;
