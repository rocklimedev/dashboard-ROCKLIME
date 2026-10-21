const {
  lineAmounts,
  quotationTotals,
  normalizeCharges,
  isOptional,
  r2,
} = require('../../lib/quotationMath');
const asList = (value) => {
  for (let i = 0; i < 3 && typeof value === 'string'; i++) {
    try {
      value = JSON.parse(value);
    } catch {
      return [];
    }
  }
  return Array.isArray(value) ? value : [];
};
const fail = (message) => {
  throw Object.assign(new Error(message), { status: 400 });
};
const lineKey = (p, index) =>
  p.sourceLineKey || [p.productId || p.id, p.groupId || 'main', index].join(':');

function remainingLines(products, dispatches) {
  const lines = asList(products)
    .filter((p) => !isOptional(p))
    .map((p, index) => ({
      ...p,
      sourceLineKey: lineKey(p, index),
      quantity: Number(p.quantity ?? p.qty) || 0,
      dispatched: 0,
    }));
  for (const d of dispatches)
    for (const item of asList(d.items)) {
      let left = Number(item.quantity) || 0;
      const exact = item.sourceLineKey
        ? lines.filter((p) => p.sourceLineKey === item.sourceLineKey)
        : [];
      const candidates = exact.length ? exact : lines.filter((p) => p.productId === item.productId);
      for (const p of candidates) {
        const take = Math.min(Math.max(p.quantity - p.dispatched, 0), left);
        p.dispatched += take;
        left -= take;
      }
    }
  return lines.map((p) => ({ ...p, remaining: Math.max(0, p.quantity - p.dispatched) }));
}
function selectedLocations(p, qty) {
  let skip = p.dispatched || 0,
    left = qty;
  const selected = [];
  for (const loc of asList(p.locations)) {
    const available = Number(loc.assignedQuantity) || 0;
    const offset = Math.min(skip, available);
    skip -= offset;
    const take = Math.min(available - offset, left);
    if (take > 0) selected.push({ ...loc, assignedQuantity: take });
    left -= take;
  }
  return selected;
}
function selectDispatchItems(lines, requested) {
  if (!Array.isArray(requested) || !requested.length)
    fail('Select products and quantities to dispatch.');
  const quantities = new Map();
  for (const item of requested) {
    const matches = lines.filter((p) =>
      item.sourceLineKey ? p.sourceLineKey === item.sourceLineKey : p.productId === item.productId,
    );
    if (matches.length !== 1) fail('Select an exact quotation line for each product.');
    const line = matches[0],
      quantity = Number(item.quantity);
    if (!Number.isSafeInteger(quantity) || quantity <= 0)
      fail('Dispatch quantities must be positive whole numbers.');
    quantities.set(line.sourceLineKey, (quantities.get(line.sourceLineKey) || 0) + quantity);
  }
  return [...quantities].map(([key, quantity]) => {
    const p = lines.find((row) => row.sourceLineKey === key);
    if (quantity > p.remaining) fail('Only ' + p.remaining + ' remaining for "' + p.name + '".');
    const { remaining, dispatched, ...item } = p;
    const locations = selectedLocations(p, quantity);
    return {
      ...item,
      quantity,
      qty: quantity,
      locations,
      total: lineAmounts({ ...item, quantity }).net,
    };
  });
}
/** Allocate fixed quotation-level amounts to this shipment by its goods value. */
function batchQuotation(source, allItems, selected, reference, date = new Date()) {
  const full = quotationTotals({ items: allItems }).goodsValue;
  const batch = quotationTotals({ items: selected }).goodsValue;
  const fullQty = asList(allItems)
    .filter((p) => !isOptional(p))
    .reduce((sum, p) => sum + Number(p.quantity ?? p.qty ?? 0), 0);
  const ratio = Math.max(
    0,
    Math.min(
      1,
      full
        ? batch / full
        : fullQty
          ? selected.reduce((sum, p) => sum + p.quantity, 0) / fullQty
          : 0,
    ),
  );
  const proportional = (value) => r2((Number(value) || 0) * ratio);
  return {
    ...source,
    products: selected,
    reference_number: reference,
    quotation_date: new Date(date).toISOString().slice(0, 10),
    createdAt: date,
    shippingAmount: proportional(source.shippingAmount),
    additionalDiscount: proportional(source.additionalDiscount),
    flatPrice: source.flatPrice == null ? null : proportional(source.flatPrice),
    miscellaneousChargeItems: normalizeCharges(
      source.miscellaneousChargeItems ?? source.miscellaneousCharges,
    ).map((row) => ({ ...row, amount: proportional(row.amount) })),
    extraDiscount:
      source.extraDiscountType === 'percent'
        ? source.extraDiscount
        : proportional(source.extraDiscount),
  };
}
/** Credit a quotation shipment to existing linked orders in creation order. */
function allocateOrders(items, orders, history) {
  const needs = orders.map((order) => {
    const direct = history
      .filter((d) => !d.orderId)
      .map((d) => ({ items: allocatedItems(d, order.id) }));
    return {
      order,
      quantities: remainingLines(
        order.products,
        history.filter((d) => d.orderId === order.id).concat(direct),
      ),
    };
  });
  return items.map((item) => {
    let left = item.quantity;
    const orderAllocations = [];
    for (const { order, quantities } of needs)
      for (const line of quantities.filter((p) => p.productId === item.productId)) {
        const take = Math.min(left, line.remaining);
        if (take > 0) {
          orderAllocations.push({ orderId: order.id, quantity: take });
          line.remaining -= take;
          left -= take;
        }
      }
    return { ...item, orderAllocations };
  });
}
function allocatedItems(dispatch, orderId) {
  return asList(dispatch.items)
    .map((item) => {
      const quantity = asList(item.orderAllocations)
        .filter((a) => a.orderId === orderId)
        .reduce((sum, a) => sum + a.quantity, 0);
      return {
        ...item,
        sourceLineKey: undefined,
        quantity,
        total: lineAmounts({ ...item, quantity }).net,
      };
    })
    .filter((item) => item.quantity > 0);
}
module.exports = {
  allocateOrders,
  allocatedItems,
  asList,
  lineKey,
  remainingLines,
  selectDispatchItems,
  batchQuotation,
};
