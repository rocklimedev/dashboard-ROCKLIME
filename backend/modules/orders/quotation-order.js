const { Order, Address, User, Customer } = require('../../models');
const { quotationTotals, lineAmounts, r2, pricingFromRecord } = require('../../lib/quotationMath');
const { remainingLines, batchQuotation, asList } = require('./dispatch-document');
const generateOrderNumber = require('./order-number');

const bad = (message) => Object.assign(new Error(message), { status: 400 });

// Called while the quotation is locked, in the dispatch transaction. Existing
// shipments are excluded when an older quotation has never had an order.
async function createQuotationOrder(quotation, history, input, userId, transaction) {
  const name = String(input.orderName || '').trim();
  if (!name || name.length > 250) throw bad('Enter an order name (up to 250 characters).');
  const shipTo = input.shipTo || quotation.shipTo;
  const address = shipTo && (await Address.findByPk(shipTo, { transaction }));
  if (!address || address.customerId !== quotation.customerId)
    throw bad('Select a shipping address belonging to this customer.');
  const assignedUserId = input.assignedUserId || userId;
  const user = await User.findByPk(assignedUserId, { transaction });
  if (!user || user.status === false) throw bad('Select an active user for assignment.');
  if (!(await Customer.findByPk(quotation.customerId, { transaction })))
    throw bad('The quotation customer no longer exists.');

  const remaining = remainingLines(quotation.products, history)
    .filter((line) => line.remaining > 0)
    .map(({ dispatched, remaining, ...line }) => ({ ...line, quantity: remaining }));
  if (!remaining.length) throw bad('This quotation is already fully dispatched.');
  const source = batchQuotation(
    quotation.toJSON(),
    asList(quotation.products),
    remaining,
    quotation.reference_number,
  );
  const totals = quotationTotals({
    ...source,
    ...pricingFromRecord(source),
    items: remaining,
    shipping: source.shippingAmount,
    gstRate: source.gst,
  });
  const ordinaryGoods = quotationTotals({ items: remaining }).goodsValue;
  const products = remaining.map((line) => {
    const net = lineAmounts(line).net;
    // Order pricing has no quotation-level flat price; allocate it to the lines.
    if (source.flatPrice != null) {
      const total = r2(
        ordinaryGoods
          ? (net * totals.goodsValue) / ordinaryGoods
          : (totals.goodsValue * line.quantity) / remaining.reduce((sum, p) => sum + p.quantity, 0),
      );
      return {
        ...line,
        price: total / line.quantity,
        discount: 0,
        discountType: 'fixed',
        flatPrice: null,
        additionalDiscount: 0,
        total,
      };
    }
    return { ...line, total: net };
  });
  return Order.create(
    {
      orderNo: await generateOrderNumber(transaction),
      quotationId: quotation.quotationId,
      createdFor: quotation.customerId,
      createdBy: userId,
      assignedUserId,
      assignedTeamId: null,
      status: 'PREPARING',
      priority: 'medium',
      dueDate: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
      description: name,
      shipTo,
      products,
      shipping: r2(totals.freight + totals.miscellaneousCharges),
      gst: source.gst ?? null,
      gstValue: totals.gstAmount,
      extraDiscount: r2(totals.extraDiscountAmount + (Number(source.additionalDiscount) || 0)),
      extraDiscountType: 'fixed',
      extraDiscountValue: r2(totals.extraDiscountAmount + (Number(source.additionalDiscount) || 0)),
      finalAmount: totals.grandTotal,
    },
    { transaction },
  );
}

module.exports = { createQuotationOrder };
