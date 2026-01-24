// routes/siteMap.js
const router = require("express").Router();
const siteMapController = require("../controller/siteMapController");
const { auth } = require("../middleware/auth");

// router.use(auth);
router.post("/", siteMapController.createSiteMap);
// CORRECT — matches your RTK Query
router.get("/", siteMapController.getSiteMapsByCustomer);
router.get("/:id", siteMapController.getSiteMapById);
router.put("/:id", siteMapController.updateSiteMap);
router.delete("/:id", siteMapController.deleteSiteMap);

router.post(
  "/:id/generate-quotation",
  siteMapController.generateQuotationFromSiteMap,
);
router.post("/attach", siteMapController.attachToQuotation);
router.post("/detach", siteMapController.detachFromQuotation);

module.exports = router;
