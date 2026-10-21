module.exports = function requireZoho(status) {
  return async (req, res, next) => {
    // Connection setup and stage metadata remain available in Connectors.
    if (req.path === '/meta' || req.path === '/bigin' || req.path.startsWith('/bigin/'))
      return next();
    try {
      if (!(await status()).connected)
        return res.status(403).json({
          code: 'ZOHO_CONNECTION_REQUIRED',
          message: 'Connect Zoho from Connectors to unlock CRM.',
        });
      next();
    } catch (error) {
      next(error);
    }
  };
};
