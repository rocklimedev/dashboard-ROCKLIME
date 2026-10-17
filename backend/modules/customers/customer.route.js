const express = require("express");
const router = express.Router();
const customerController = require("./customer.controller");
const { auth } = require("../../middleware/auth");
const { guardModule } = require("../../middleware/permission");
router.use(auth);
router.use(guardModule("customers"));
// Only Admin, SuperAdmin, and Sales can create a customer
router.post(
  "/",
  customerController.createCustomer,
);

// Admin, SuperAdmin, Sales, and Accounts can view customers
router.get(
  "/",
  customerController.getCustomers,
);

// Admin, SuperAdmin, Sales, and Accounts can view a specific customer
router.get(
  "/:id",
  customerController.getCustomerById,
);

// Only Admin and SuperAdmin can edit a customer
router.put(
  "/:id",
  customerController.updateCustomer,
);

// Only SuperAdmin can delete a customer
router.delete(
  "/:id",
  customerController.deleteCustomer,
);

router.get("/:id/invoices", customerController.getCustomerInvoices);

// Customer 360 and the credit check used by order forms
router.get("/:id/overview", async (req, res) => {
  try {
    res.json(await require("./overview").overview(req.params.id));
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
});
router.get("/:id/credit", async (req, res) => {
  try {
    res.json(await require("./overview").creditCheck(req.params.id, Number(req.query.amount) || 0));
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
});

module.exports = router;
