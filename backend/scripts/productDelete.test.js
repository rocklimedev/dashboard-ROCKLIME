const { test } = require('node:test');
const assert = require('node:assert/strict');
const { Sequelize, DataTypes } = require('sequelize');
const { createProductDeletionService } = require('../modules/products/product-delete.service');
const ids = ['11111111-1111-4111-8111-111111111111', '22222222-2222-4222-8222-222222222222'];
async function fixture() {
  const sequelize = new Sequelize({ dialect: 'sqlite', storage: ':memory:', logging: false });
  const Product = sequelize.define('Product', { productId: { type: DataTypes.UUID, primaryKey: true }, name: DataTypes.STRING, masterProductId: DataTypes.UUID });
  const ProductKeyword = sequelize.define('ProductKeyword', { productId: DataTypes.UUID, keywordId: DataTypes.STRING });
  const Quotation = sequelize.define('Quotation', { quotationId: { type: DataTypes.UUID, primaryKey: true }, reference_number: DataTypes.STRING, products: DataTypes.JSON });
  const Order = sequelize.define('Order', { id: { type: DataTypes.UUID, primaryKey: true }, orderNo: DataTypes.STRING, products: DataTypes.JSON });
  const InventoryHistory = sequelize.define('InventoryHistory', { productId: DataTypes.UUID });
  const CreditItem = sequelize.define('CreditItem', { productId: DataTypes.UUID });
  await sequelize.sync({ force: true });
  await Product.bulkCreate(ids.map((productId, i) => ({ productId, name: `Product ${i}` })));
  await ProductKeyword.create({ productId: ids[0], keywordId: 'keyword' });
  let mongo = [];
  const service = createProductDeletionService({ sequelize, Product, ProductKeyword, Quotation, Order, InventoryHistory }, async () => { if (mongo instanceof Error) throw mongo; return mongo; });
  return { sequelize, Product, ProductKeyword, Quotation, Order, InventoryHistory, CreditItem, service, setMongo: rows => { mongo = rows; } };
}
test('deduplicates quotations across SQL, Mongo line items, versions, and selected products', async () => {
  const f = await fixture();
  try {
    const quoteId = '33333333-3333-4333-8333-333333333333';
    await f.Quotation.create({ quotationId: quoteId, reference_number: 'QT-123', products: ids.map(productId => ({ productId })) });
    f.setMongo([{ category: 'Quotation', id: quoteId, data: { items: [{ productId: ids[0] }] } }, { category: 'Quotation', id: quoteId, data: { quotationItems: [{ productId: ids[1] }] } }, { category: 'PurchaseOrder', id: 'po-1', label: 'PO-1', data: { items: [{ productId: ids[1] }] } }]);
    const report = await f.service.preview(ids);
    const quotes = report.references.find(group => group.category === 'Quotation');
    assert.equal(quotes.count, 1); assert.equal(quotes.records[0].label, 'QT-123'); assert.deepEqual(quotes.records[0].productIds.sort(), ids);
    assert.equal(report.references.find(group => group.category === 'PurchaseOrder').count, 1);
    await assert.rejects(f.service.remove(ids), /referenced/); assert.equal(await f.Product.count(), 2); assert.equal(await f.ProductKeyword.count(), 1);
  } finally { await f.sequelize.close(); }
});
test('reports inventory history, variants and relational references and ignores prose substrings', async () => {
  const f = await fixture();
  try {
    await f.InventoryHistory.create({ productId: ids[0] });
    await f.CreditItem.create({ productId: ids[1] });
    await f.Product.create({ productId: '44444444-4444-4444-8444-444444444444', masterProductId: ids[0], name: 'Variant' });
    await f.Order.create({ id: '33333333-3333-4333-8333-333333333333', products: [{ note: `Mentions ${ids[0]}` }] });
    const report = await f.service.preview(ids);
    for (const category of ['InventoryHistory', 'Product', 'CreditItem']) assert.equal(report.references.find(group => group.category === category).count, 1);
    assert.equal(report.references.find(group => group.category === 'Order').count, 0);
  } finally { await f.sequelize.close(); }
});
test('rechecks after a clear preview and rejects new references or incomplete checks', async () => {
  const f = await fixture();
  try {
    assert.equal((await f.service.preview(ids)).canDelete, true);
    f.setMongo([{ category: 'Order', id: 'new-order', data: { items: [{ productId: ids[0] }] } }]);
    await assert.rejects(f.service.remove(ids), /referenced/);
    f.setMongo(new Error('MongoDB unavailable'));
    await assert.rejects(f.service.remove(ids), /unavailable/);
    assert.equal(await f.Product.count(), 2);
    f.setMongo([]); await f.service.remove([ids[0]]);
    assert.equal(await f.Product.count(), 1); assert.equal(await f.ProductKeyword.count(), 0);
  } finally { await f.sequelize.close(); }
});
