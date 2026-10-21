const { test } = require('node:test');
const assert = require('node:assert/strict');
const { Sequelize, DataTypes } = require('sequelize');
const {
  createProductMergeService,
  rewriteProductReferences,
} = require('../modules/products/product-merge.service');
const keeperId = '11111111-1111-4111-8111-111111111111';
const sourceId = '22222222-2222-4222-8222-222222222222';
async function fixture() {
  const sequelize = new Sequelize({ dialect: 'sqlite', storage: ':memory:', logging: false });
  const Product = sequelize.define('Product', {
    productId: { type: DataTypes.UUID, primaryKey: true },
    name: DataTypes.STRING,
    product_code: { type: DataTypes.STRING, unique: true },
    quantity: DataTypes.INTEGER,
    meta: DataTypes.JSON,
    images: DataTypes.JSON,
    brandId: DataTypes.STRING,
    masterProductId: DataTypes.UUID,
    isMaster: DataTypes.BOOLEAN,
    variantOptions: DataTypes.JSON,
    variantKey: DataTypes.STRING,
    skuSuffix: DataTypes.STRING,
    status: DataTypes.STRING,
  });
  const ProductMeta = sequelize.define('ProductMeta', {
    id: { type: DataTypes.STRING, primaryKey: true },
    slug: DataTypes.STRING,
  });
  const ProductKeyword = sequelize.define('ProductKeyword', {
    productId: {
      type: DataTypes.UUID,
      primaryKey: true,
      references: { model: Product, key: 'productId' },
      onDelete: 'CASCADE',
    },
    keywordId: { type: DataTypes.STRING, primaryKey: true },
  });
  const InventoryHistory = sequelize.define('InventoryHistory', {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    productId: {
      type: DataTypes.UUID,
      references: { model: Product, key: 'productId' },
      onDelete: 'RESTRICT',
    },
    change: DataTypes.INTEGER,
    quantityAfter: DataTypes.INTEGER,
    action: DataTypes.STRING,
    userId: DataTypes.STRING,
    message: DataTypes.TEXT,
  });
  const ActivityLog = sequelize.define('ActivityLog', {
    activityLogId: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    userId: DataTypes.STRING,
    contextTag: DataTypes.STRING,
    subContext: DataTypes.STRING,
    action: DataTypes.STRING,
    entityId: DataTypes.STRING,
    entityName: DataTypes.STRING,
    severity: DataTypes.STRING,
    description: DataTypes.STRING,
    oldValues: DataTypes.JSON,
    newValues: DataTypes.JSON,
    metadata: DataTypes.JSON,
  });
  const Order = sequelize.define('Order', {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    products: DataTypes.JSON,
    total: DataTypes.INTEGER,
  });
  const CreditItem = sequelize.define('CreditItem', {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    productId: {
      type: DataTypes.UUID,
      references: { model: Product, key: 'productId' },
      onDelete: 'RESTRICT',
    },
    price: DataTypes.INTEGER,
  });
  await sequelize.sync({ force: true });
  await ProductMeta.bulkCreate([
    { id: 'code', slug: 'companyCode' },
    { id: 'price', slug: 'sellingPrice' },
  ]);
  await Product.bulkCreate([
    {
      productId: keeperId,
      name: 'Kept basin',
      product_code: 'KEEP',
      quantity: 20,
      brandId: 'same-brand',
      status: 'active',
      meta: { code: 'CODE', price: 200, color: 'white' },
      images: ['one.jpg'],
    },
    {
      productId: sourceId,
      name: 'Duplicate basin',
      product_code: 'REMOVE',
      quantity: 10,
      brandId: 'same-brand',
      status: 'active',
      meta: { code: 'code', price: 100, color: 'white', extra: 'preserve' },
      images: ['one.jpg', 'two.jpg'],
    },
  ]);
  await ProductKeyword.bulkCreate([
    { productId: keeperId, keywordId: 'shared' },
    { productId: sourceId, keywordId: 'shared' },
    { productId: sourceId, keywordId: 'extra' },
  ]);
  const originalHistory = await InventoryHistory.create({
    productId: sourceId,
    change: 10,
    quantityAfter: 10,
    action: 'add-stock',
    userId: 'original-actor',
    message: 'Original stock',
    createdAt: new Date('2026-07-24T00:00:00Z'),
  });
  let mongo = [];
  const models = { sequelize, Product, ProductMeta, ProductKeyword, InventoryHistory, ActivityLog };
  const service = createProductMergeService(models, async () => mongo);
  return {
    ...models,
    Order,
    CreditItem,
    service,
    originalHistory,
    setMongo: (value) => {
      mongo = value;
    },
    close: () => sequelize.close(),
  };
}
const choices = (preview) => ({
  keeperId,
  sourceId,
  fingerprint: preview.fingerprint,
  stockMode: 'sum',
  priceMode: 'source',
});
test('merge combines chosen stock, transfers SQL references/history, unions keywords and writes a full audit', async () => {
  const fixtureData = await fixture();
  const {
    service,
    Product,
    InventoryHistory,
    ProductKeyword,
    ActivityLog,
    Order,
    CreditItem,
    originalHistory,
  } = fixtureData;
  try {
    const order = await Order.create({
      products: [
        { productId: sourceId, name: 'Historical name', price: 80, quantity: 2, total: 160 },
      ],
      total: 160,
    });
    await CreditItem.create({ productId: sourceId, price: 80 });
    const preview = await service.preview({ keeperId, sourceId });
    assert.equal(preview.blockers.length, 0);
    assert.equal(preview.historyRecordsToTransfer, 1);
    const result = await service.merge(choices(preview), 'merger');
    assert.equal(result.quantity, 30);
    assert.equal(result.sellingPrice, 100);
    assert.equal(await Product.findByPk(sourceId), null);
    const keeper = await Product.findByPk(keeperId);
    assert.equal(keeper.name, 'Kept basin');
    assert.equal(keeper.product_code, 'KEEP');
    assert.equal(keeper.meta.price, 100);
    assert.equal(keeper.meta.extra, 'preserve');
    assert.deepEqual(keeper.images, ['one.jpg', 'two.jpg']);
    assert.equal(await ProductKeyword.count({ where: { productId: keeperId } }), 2);
    const history = await InventoryHistory.findByPk(originalHistory.id);
    assert.equal(history.productId, keeperId);
    assert.equal(history.quantityAfter, 10);
    assert.equal(history.userId, 'original-actor');
    assert.equal(history.createdAt.toISOString(), '2026-07-24T00:00:00.000Z');
    assert.ok(history.message.includes(sourceId));
    assert.equal(
      (await InventoryHistory.findOne({ where: { action: 'correction' } })).userId,
      'merger',
    );
    const updatedOrder = await Order.findByPk(order.id);
    assert.deepEqual(updatedOrder.products, [
      { productId: keeperId, name: 'Historical name', price: 80, quantity: 2, total: 160 },
    ]);
    assert.equal(updatedOrder.total, 160);
    assert.equal((await CreditItem.findOne()).productId, keeperId);
    const audit = await ActivityLog.findByPk(result.auditId);
    assert.equal(audit.oldValues.source.productId, sourceId);
    assert.equal(audit.oldValues.keeper.quantity, 20);
    assert.equal(audit.newValues.quantity, 30);
    await assert.rejects(service.merge(choices(preview), 'merger'), /no longer exists/);
  } finally {
    await fixtureData.close();
  }
});
test('keep stock avoids double-counting, and explicit zero prices are supported', async () => {
  const f = await fixture();
  try {
    const preview = await f.service.preview({ keeperId, sourceId });
    const result = await f.service.merge(
      { ...choices(preview), stockMode: 'keep', priceMode: 'custom', sellingPrice: 0 },
      'merger',
    );
    assert.equal(result.quantity, 20);
    assert.equal((await f.Product.findByPk(keeperId)).meta.price, 0);
  } finally {
    await f.close();
  }
});
test('stale data and new references reject the entire merge', async () => {
  const f = await fixture();
  try {
    const preview = await f.service.preview({ keeperId, sourceId });
    await f.Product.update({ quantity: 25 }, { where: { productId: keeperId } });
    await assert.rejects(f.service.merge(choices(preview), 'merger'), /changed since the preview/);
    assert.equal(await f.Product.count(), 2);
    assert.equal(await f.ActivityLog.count(), 0);
    const fresh = await f.service.preview({ keeperId, sourceId });
    f.setMongo([{ model: 'Cart', records: 1 }]);
    await assert.rejects(f.service.merge(choices(fresh), 'merger'), /changed since the preview/);
    const blocked = await f.service.preview({ keeperId, sourceId });
    assert.ok(blocked.blockers.some((reason) => reason.includes('Cart')));
    await assert.rejects(f.service.merge(choices(blocked), 'merger'), /Cart references/);
    assert.equal(await f.Product.count(), 2);
  } finally {
    await f.close();
  }
});
test('audit failure rolls back stock, history transfers, references and keyword writes', async () => {
  const f = await fixture();
  try {
    await f.CreditItem.create({ productId: sourceId, price: 80 });
    const preview = await f.service.preview({ keeperId, sourceId });
    f.ActivityLog.addHook('beforeCreate', () => {
      throw Error('Audit unavailable');
    });
    await assert.rejects(f.service.merge(choices(preview), 'merger'), /Audit unavailable/);
    assert.equal(await f.Product.count(), 2);
    assert.equal((await f.Product.findByPk(keeperId)).quantity, 20);
    assert.equal((await f.InventoryHistory.findByPk(f.originalHistory.id)).productId, sourceId);
    assert.equal((await f.CreditItem.findOne()).productId, sourceId);
    assert.equal(await f.ProductKeyword.count({ where: { productId: sourceId } }), 2);
    assert.equal(await f.InventoryHistory.count({ where: { action: 'correction' } }), 0);
  } finally {
    await f.close();
  }
});
test('different brands/codes/variants and overlapping document lines block merges', async () => {
  const f = await fixture();
  try {
    await f.Product.update(
      {
        brandId: 'different',
        meta: { code: 'OTHER', price: 100 },
        variantOptions: { color: 'red' },
      },
      { where: { productId: sourceId } },
    );
    const blocked = await f.service.preview({ keeperId, sourceId });
    assert.ok(blocked.blockers.some((reason) => reason.includes('company code')));
    assert.ok(blocked.blockers.some((reason) => reason.includes('brands')));
    assert.ok(blocked.blockers.some((reason) => reason.includes('variants')));
    await assert.rejects(f.service.merge(choices(blocked), 'merger'), /company code/);
    await f.Order.create({ products: [{ id: sourceId }, { id: keeperId }] });
    assert.ok(
      (await f.service.preview({ keeperId, sourceId })).blockers.some((reason) =>
        reason.includes('both products'),
      ),
    );
    assert.equal(await f.Product.count(), 2);
  } finally {
    await f.close();
  }
});
test('reference rewriting changes exact identifiers and preserves financial snapshots and literal prose', () => {
  const value = {
    products: [
      {
        id: sourceId,
        productId: sourceId,
        price: 100,
        total: 500,
        description: `Ref ${sourceId}`,
        name: sourceId,
      },
    ],
    map: { [sourceId]: { quantity: 5 } },
    productIds: [sourceId],
  };
  const output = rewriteProductReferences(value, sourceId, keeperId);
  assert.equal(output.products[0].id, keeperId);
  assert.equal(output.products[0].productId, keeperId);
  assert.equal(output.products[0].price, 100);
  assert.equal(output.products[0].total, 500);
  assert.equal(output.products[0].description, `Ref ${sourceId}`);
  assert.deepEqual(output.map[keeperId], { quantity: 5 });
  assert.equal(value.products[0].id, sourceId);
  assert.equal(output.products[0].name, sourceId);
  assert.deepEqual(output.productIds, [keeperId]);
});
