import moment from "moment";

// Helper: Get today's prefix in format DDMMYY (e.g., 271225 for Dec 27, 2025)
const getTodayPrefix = () => {
  const now = moment();
  const day = now.format("D"); // 1-31 (no leading zero)
  const month = now.format("M"); // 1-12 (no leading zero)
  const year = now.format("YY"); // Last 2 digits of year (25 for 2025)
  return `${day}${month}${year}`;
};

// === 1. Generate Quotation Number (Daily Sequential) ===
export const generateQuotationNumber = (quotations = []) => {
  const prefix = getTodayPrefix(); // e.g., "271225"

  // Filter quotations created today
  const todayQuotations = quotations.filter((q) =>
    q.quotationNo?.startsWith(prefix)
  );

  let sequence = 101; // Start from 101

  if (todayQuotations.length > 0) {
    const sequenceNumbers = todayQuotations
      .map((q) => parseInt(q.quotationNo.slice(prefix.length), 10))
      .filter((num) => !isNaN(num));

    const maxSequence = Math.max(...sequenceNumbers, 100);
    sequence = maxSequence + 1;
  }

  return `QUO${prefix}${sequence}`; // e.g., QUO271225101, QUO271225102
};

// === 2. Generate Order Number (Daily Sequential - Your Desired Format) ===
export const generateOrderNumber = (orders = []) => {
  const prefix = getTodayPrefix(); // e.g., "271225"

  const todayOrders = orders.filter((o) => o.orderNo?.startsWith(prefix));

  let sequence = 101;

  if (todayOrders.length > 0) {
    const sequenceNumbers = todayOrders
      .map((o) => parseInt(o.orderNo.slice(prefix.length), 10))
      .filter((num) => !isNaN(num));

    const maxSequence = Math.max(...sequenceNumbers, 100);
    sequence = maxSequence + 1;
  }

  return `${prefix}${sequence}`; // e.g., 271225101, 271225102
};

// === 3. Generate Purchase Order Number (Daily Sequential) ===
export const generatePurchaseOrderNumber = (purchaseOrders = []) => {
  const prefix = getTodayPrefix(); // e.g., "271225"

  const todayPOs = purchaseOrders.filter((po) =>
    po.purchaseOrderNo?.startsWith(prefix)
  );

  let sequence = 101;

  if (todayPOs.length > 0) {
    const sequenceNumbers = todayPOs
      .map((po) => parseInt(po.purchaseOrderNo.slice(prefix.length), 10))
      .filter((num) => !isNaN(num));

    const maxSequence = Math.max(...sequenceNumbers, 100);
    sequence = maxSequence + 1;
  }

  return `PO${prefix}${sequence}`; // e.g., PO271225101, PO271225102
};
