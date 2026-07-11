// ──────── RESPONSE HELPERS ────────

/**
 * Sends a standardized JSON error response.
 */
const sendErrorResponse = (res, status, message, details = null) => {
  const response = { message };
  if (details) response.details = details;
  return res.status(status).json(response);
};

module.exports = { sendErrorResponse };
