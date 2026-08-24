const { OrderActivity } = require("../../models");

function extractIp(req) {
  if (!req) return null;
  const forwarded = req.headers?.["x-forwarded-for"];
  if (forwarded) return String(forwarded).split(",")[0].trim();
  return req.ip || req.connection?.remoteAddress || null;
}

async function logOrderActivity({
  orderId,
  orderNo,
  action,
  description = null,
  oldValue = null,
  newValue = null,
  performedBy = null,
  metadata = null,
  req = null,
}) {
  if (!orderId || !orderNo || !action) {
    console.error(
      "logOrderActivity: orderId, orderNo, and action are required",
    );
    return null;
  }

  try {
    return await OrderActivity.create({
      orderId,
      orderNo,
      action,
      description,
      oldValue,
      newValue,
      performedBy,
      metadata,
      ipAddress: extractIp(req),
    });
  } catch (err) {
    console.error("Failed to write order_activity entry:", err.message);
    return null;
  }
}

module.exports = logOrderActivity;
