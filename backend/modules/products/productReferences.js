const { Op } = require("sequelize");

function parseItems(value) {
  for (let i = 0; i < 2 && typeof value === "string"; i++) {
    try { value = JSON.parse(value); } catch { return []; }
  }
  return Array.isArray(value) ? value : [];
}

function makeReference(type, doc, items, productId) {
  const lines = parseItems(items).filter((p) => String(p.productId) === productId);
  if (!lines.length) return null;
  const id = type === "quotation" ? doc.quotationId : doc.id;
  const paths = { quotation: "quotation", order: "order", po: "po", fgs: "fgs" };
  return {
    key: `${type}:${id}`, type, id,
    number: doc.reference_number || doc.orderNo || doc.poNumber || doc.fgsNumber || id,
    date: doc.quotation_date || doc.orderDate || doc.createdAt,
    status: doc.status || "—", party: doc.customer?.name || doc.vendor?.vendorName || "—",
    href: `/${paths[type]}/${encodeURIComponent(id)}`,
    quantity: lines.reduce((sum, p) => sum + (Number(p.quantity ?? p.qty) || 0), 0),
    lines: lines.map((p) => ({
      name: p.name || p.productName, quantity: Number(p.quantity ?? p.qty) || 0,
      price: p.unitPrice ?? p.price ?? p.sellingPrice ?? null,
      discount: p.discount ?? 0, discountType: p.discountType,
      total: p.total ?? p.lineTotal ?? null, tax: p.tax ?? null,
      optionType: p.optionType || null,
      locations: p.locations?.length ? p.locations : p.floorName || p.roomName
        ? [{ floorName: p.floorName, roomName: p.roomName, assignedQuantity: p.quantity ?? p.qty }] : [],
    })),
  };
}

async function loadReferences(deps, productId) {
  const { sequelize, Quotation, Order, PurchaseOrder, FieldGuidedSheet,
    Customer, Vendor, QuotationItem, OrderItem, PoItem, FgsItem } = deps;
  const sources = [
    { type: "quotation", model: Quotation, items: QuotationItem, itemId: "quotationId", id: "quotationId", snapshot: true },
    { type: "order", model: Order, items: OrderItem, itemId: "orderId", id: "id", snapshot: true },
    { type: "po", model: PurchaseOrder, items: PoItem, itemId: "poId", id: "id" },
    { type: "fgs", model: FieldGuidedSheet, items: FgsItem, itemId: "fgsId", id: "id" },
  ];
  const results = await Promise.all(sources.map(async (source) => {
    const itemDocs = await source.items.find({ "items.productId": productId }).lean();
    const byId = new Map(itemDocs.map((d) => [String(d[source.itemId]), d.items]));
    const where = { [source.id]: { [Op.in]: [...byId.keys()] } };
    const condition = source.snapshot ? { [Op.or]: [where, sequelize.where(
      sequelize.fn("JSON_CONTAINS", sequelize.fn("JSON_UNQUOTE", sequelize.col("products")),
        JSON.stringify([{ productId }])), 1,
    )] } : where;
    if (!source.snapshot && !byId.size) return [];
    const documents = await source.model.findAll({ where: condition, include: source.snapshot
      ? [{ model: Customer, as: "customer", attributes: ["name"] }]
      : [{ model: Vendor, as: "vendor", attributes: ["vendorName"] }] });
    return documents.map((record) => {
      const doc = record.toJSON();
      const snapshot = parseItems(doc.products);
      return makeReference(source.type, doc, source.snapshot && snapshot.length
        ? snapshot : byId.get(String(doc[source.id])), productId);
    }).filter(Boolean);
  }));
  return results.flat().sort((a, b) => (new Date(b.date).getTime() || 0) - (new Date(a.date).getTime() || 0));
}

module.exports = { parseItems, makeReference, loadReferences };
