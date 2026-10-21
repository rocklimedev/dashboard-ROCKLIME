// Keep the existing controller API for routes and other consumers.
module.exports = {
  ...require('./order-create.controller'),
  ...require('./order-update.controller'),
  ...require('./order-status.controller'),
  ...require('./order-lifecycle.controller'),
  ...require('./order-read.controller'),
  ...require('./order-documents.controller'),
  ...require('./order-comments.controller'),
  ...require('./order-reports.controller'),
};
