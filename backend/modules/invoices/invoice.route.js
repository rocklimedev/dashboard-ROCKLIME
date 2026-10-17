const express = require("express");
const { auth } = require("../../middleware/auth");
const { guardModule } = require("../../middleware/permission");
const c = require("./invoice.controller");

const router = express.Router();
router.use(auth);
// Reading and exporting need orders view; making or cancelling an invoice needs orders edit.
router.use(
  guardModule("orders", [
    { method: "POST", path: /^\/preview$/, action: "view" },
    { method: "POST", path: /./, action: "edit" },
  ]),
);

router.get("/", c.list);
router.get("/export/tally", c.exportTally);
router.get("/export/register", c.exportRegister);
router.get("/order/:orderId", c.forOrder);
router.post("/preview", c.preview);
router.post("/", c.create);
router.get("/:id", c.get);
router.get("/:id/pdf", c.pdf);
router.post("/:id/cancel", c.cancel);

module.exports = router;
