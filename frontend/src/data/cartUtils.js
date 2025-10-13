import moment from "moment";

// Generate Quotation Number
export const generateQuotationNumber = () => {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(1000 + Math.random() * 9000);
  return `QUO-${timestamp}-${random}`;
};

// Generate Order Number
export const generateOrderNumber = (orders) => {
  const today = moment();
  const day = today.format("D");
  const month = today.format("M");
  const year = today.format("YY");
  const todayOrders = orders.filter((order) =>
    moment(order.createdAt).isSame(today, "day")
  );
  const serialNumber = todayOrders.length + 101;
  return `${day}${month}${year}${serialNumber}`;
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
