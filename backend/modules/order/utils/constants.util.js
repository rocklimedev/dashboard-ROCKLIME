// ──────── SHARED CONSTANTS ────────

const VALID_STATUSES = [
  "PREPARING",
  "CHECKING",
  "INVOICE",
  "DISPATCHED",
  "DELIVERED",
  "PARTIALLY_DELIVERED",
  "CANCELED",
  "DRAFT",
  "ONHOLD",
  "CLOSED",
];

// Subset used by getFilteredOrders (kept identical to original behavior,
// which did not include CLOSED in its own local copy)
const VALID_STATUSES_FILTER = [
  "PREPARING",
  "CHECKING",
  "INVOICE",
  "DISPATCHED",
  "DELIVERED",
  "PARTIALLY_DELIVERED",
  "CANCELED",
  "DRAFT",
  "ONHOLD",
];

const VALID_PRIORITIES = ["high", "medium", "low"];

const VALID_RESOURCE_TYPES = ["Order", "Product", "Customer"];

// Replace with actual admin user ID or channel
const ADMIN_USER_ID = "2ef0f07a-a275-4fe1-832d-fe9a5d145f60";

module.exports = {
  VALID_STATUSES,
  VALID_STATUSES_FILTER,
  VALID_PRIORITIES,
  VALID_RESOURCE_TYPES,
  ADMIN_USER_ID,
};
