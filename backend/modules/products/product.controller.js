// Keep the existing controller API for routes and background workers.
module.exports = {
  ...require("./product-write.controller"),
  ...require("./product-read.controller"),
  ...require("./product-codes.controller"),
  ...require("./product-inventory.controller"),
  ...require("./product-variants.controller"),
  ...require("./product-keywords.controller"),
  ...require("./product-reports.controller"),
  ...require("./product-import.controller"),
};
