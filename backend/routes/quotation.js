const express = require("express");
const router = express.Router();
const quotationController = require("../controller/quotationController");
const { auth } = require("../middleware/auth"); // Authentication middleware
const checkPermission = require("../middleware/permission"); // Permission middleware

// ✅ Create a new quotation (Only Admins & Managers)
router.post(
  "/add",
  auth,
  //checkPermission("write", "create_quotation", "quotations", "/quotations/add"),
  quotationController.createQuotation
);

// ✅ Get all quotations (Admins, Managers & Sales Team)
router.get(
  "/",
  // checkPermission("view", "get_all_quotations", "quotations", "/quotations"),
  quotationController.getAllQuotations
);

// ✅ Get a single quotation by ID (Admins, Managers & Sales Team)
router.get(
  "/:id",
  auth,
  // checkPermission(
  //   "view",
  //   "get_quotation_by_id",
  //   "quotations",
  //   "/quotations/:id"
  // ),
  quotationController.getQuotationById
);

// ✅ edit a quotation by ID (Only Admins & Managers)
router.put(
  "/:id",
  auth,
  // checkPermission("edit", "update_quotation", "quotations", "/quotations/:id"),
  quotationController.updateQuotation
);

// ✅ Delete a quotation by ID (Only Admins)
router.delete(
  "/:id",
  auth,
  // checkPermission(
  //   "delete",
  //   "delete_quotation",
  //   "quotations",
  //   "/quotations/:id"
  // ),
  quotationController.deleteQuotation
);

// ✅ Export a quotation by ID (Admins, Managers & Sales Team)
router.post(
  "/export/:id/:version?",
  auth,
  // checkPermission("export", "export_quotation", "quotations", "/quotations/export/:id"),
  quotationController.exportQuotation
);
router.post(
  "/clone/:id",
  // checkPermission(
  //   "post",
  //   "clone_quotation",
  //   "quotations",
  //   "/quotations/clone/:id"
  // ),
  quotationController.cloneQuotation
);

// New routes for versioning
router.get("/:id/versions/:version?", quotationController.getQuotationVersions);
router.post(
  "/:id/restore/:version",
  quotationController.restoreQuotationVersion
);

module.exports = router;
