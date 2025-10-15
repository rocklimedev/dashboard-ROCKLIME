import moment from "moment";

// Generate Quotation Number
export const generateQuotationNumber = () => {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(1000 + Math.random() * 9000);
  return `QUO-${timestamp}-${random}`;
};

// Generate Order Number
export const generateOrderNumber = (orders = []) => {
  const today = moment().format("DDMMYY"); // Changed from DDMMYYYY to DDMMYY
  const day = today.getDate(); // No leading zero (e.g., 1 instead of 01)
  const month = today.getMonth() + 1; // No leading zero (e.g., 1 instead of 01)
  const year = "25"; // Hardcode to 25 for 2025

  // Find the highest sequence number for orders with today's prefix (DDMM25)
  const prefix = `${day}${month}${year}`;
  const existingOrders = orders.filter((order) =>
    order.orderNo.startsWith(prefix)
  );
  let sequence = 101; // Start from 101

  if (existingOrders.length > 0) {
    const sequenceNumbers = existingOrders
      .map((order) => parseInt(order.orderNo.slice(prefix.length), 10))
      .filter((num) => !isNaN(num));
    const maxSequence = Math.max(...sequenceNumbers, 100); // Ensure at least 100
    sequence = maxSequence + 1; // Increment from the highest sequence
  }

  return `${prefix}${sequence}`;
};
// Generate Purchase Order Number
export const generatePurchaseOrderNumber = (orders) => {
  const today = moment().format("DDMMYYYY");
  const todayOrders = orders.filter((order) =>
    moment(order.createdAt).isSame(moment(), "day")
  );
  const serialNumber = String(todayOrders.length + 1).padStart(5, "0");
  return `PO-${today}-${serialNumber}`;
};
