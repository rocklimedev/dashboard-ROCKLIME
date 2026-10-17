const router = require("express").Router();
const service = require("./brandOnboarding.service").createService(
  require("../../models"),
);
for (const action of ["preview", "commit"])
  router.post(`/${action}`, async (req, res) => {
    try {
      res.json(await service[action](req.body, req.user.userId));
    } catch (error) {
      console.error("Brand onboarding:", error);
      res
        .status(error.status || 400)
        .json({
          message: error.status
            ? error.message
            : "Import failed. No changes were saved. Check for existing names/codes or retry.",
        });
    }
  });
module.exports = router;
