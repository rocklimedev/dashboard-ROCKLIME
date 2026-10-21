const { Op } = require('sequelize');
const { containsReference } = require('./product-merge.service');
const fail = (message, status = 503) => Object.assign(new Error(message), { status });
const labels = {
  Quotation: 'Quotations',
  Order: 'Orders',
  PurchaseOrder: 'Purchase orders',
  FieldGuidedSheet: 'Field guided sheets',
  Cart: 'Carts',
  InventoryHistory: 'Inventory history',
  Product: 'Product variants',
};
const parse = (value) => (typeof value === 'string' ? JSON.parse(value) : value);

async function mongoReferences(ids) {
  if (require('mongoose').connection.readyState !== 1)
    throw fail(
      'MongoDB is unavailable. Reference checks could not complete. Retry before deleting.',
    );
  const registry = [
    ['Cart', '../cart/models/carts.model', ['items.productId'], '_id'],
    ['Order', '../orders/models/order-item.model', ['items.productId'], 'orderId'],
    [
      'Quotation',
      '../quotations/models/quotation-item.model',
      ['items.productId', 'items.parentProductId', 'items.isOptionFor'],
      'quotationId',
    ],
    [
      'Quotation',
      '../quotations/models/quotation-version.model',
      [
        'quotationItems.productId',
        'quotationItems.parentProductId',
        'quotationItems.isOptionFor',
        'quotationData.products.productId',
        'quotationData.products.id',
      ],
      'quotationId',
    ],
    ['PurchaseOrder', '../purchase-order/models/po-item.model', ['items.productId'], 'poId'],
    ['FieldGuidedSheet', '../purchase-order/models/fgs-item.model', ['items.productId'], 'fgsId'],
  ];
  const result = [];
  for (const [category, path, paths, parentKey] of registry) {
    const projection = Object.fromEntries(
      [...paths, parentKey, 'poNumber', 'fgsNumber', 'version'].map((key) => [key, 1]),
    );
    const rows = await require(path)
      .collection.find(
        { $or: paths.map((key) => ({ [key]: { $in: ids } })) },
        { projection, maxTimeMS: 10000 },
      )
      .limit(10001)
      .toArray();
    if (rows.length > 10000)
      throw fail('Too many references to safely preview. Select fewer products.');
    for (const row of rows)
      result.push({
        category,
        id: String(row[parentKey] || row._id),
        label: row.poNumber || row.fgsNumber,
        data: row,
      });
  }
  return result;
}

function createProductDeletionService(models, loadMongo = mongoReferences) {
  const { sequelize, Product } = models;
  async function preview(ids, transaction) {
    if (
      !Array.isArray(ids) ||
      !ids.length ||
      ids.length > 500 ||
      new Set(ids).size !== ids.length ||
      ids.some((id) => !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id))
    )
      throw fail('Select between 1 and 500 valid products.', 400);
    const products = await Product.findAll({
      where: { productId: { [Op.in]: ids } },
      transaction,
      ...(transaction ? { lock: transaction.LOCK.UPDATE } : {}),
    });
    if (products.length !== ids.length)
      throw fail('Some selected products no longer exist. Refresh and select again.', 409);
    const groups = new Map(Object.keys(labels).map((key) => [key, new Map()]));
    const add = (category, id, label, matched) => {
      if (!matched.length) return;
      if (!groups.has(category)) groups.set(category, new Map());
      const entries = groups.get(category),
        key = String(id);
      const old = entries.get(key);
      entries.set(key, {
        id: key,
        label: label || old?.label || key,
        productIds: [...new Set([...(old?.productIds || []), ...matched])],
      });
    };
    for (const model of Object.values(sequelize.models)) {
      if (
        [
          models.ProductMeta,
          models.ProductKeyword,
          models.ActivityLog,
          models.OrderActivity,
        ].includes(model)
      )
        continue;
      const attributes = model.rawAttributes || {},
        fields = Object.entries(attributes)
          .filter(([, value]) => value.type?.key === 'JSON')
          .map(([key]) => key);
      const direct =
        model === Product ? 'masterProductId' : attributes.productId ? 'productId' : null;
      if (model === Product) fields.length = 0;
      const conditions = direct ? [{ [direct]: { [Op.in]: ids } }] : [];
      for (const field of fields)
        for (const id of ids)
          conditions.push(
            sequelize.where(sequelize.cast(sequelize.col(field), 'CHAR'), {
              [Op.like]: `%${id}%`,
            }),
          );
      if (!conditions.length) continue;
      const rows = await model.findAll({
        where: { [Op.or]: conditions },
        transaction,
        raw: true,
        limit: 10001,
      });
      if (rows.length > 10000)
        throw fail('Too many references to safely preview. Select fewer products.');
      for (const row of rows) {
        const matched = ids.filter(
          (id) =>
            row[direct] === id || fields.some((field) => containsReference(parse(row[field]), id)),
        );
        const key = model.primaryKeyAttributes?.length
          ? model.primaryKeyAttributes.map((field) => row[field]).join(':')
          : row.id;
        add(
          model.name,
          key,
          row.reference_number || row.orderNo || row.poNumber || row.fgsNumber || row.name,
          matched,
        );
      }
    }
    for (const row of await loadMongo(ids))
      add(
        row.category,
        row.id,
        row.label,
        ids.filter((id) => containsReference(row.data, id)),
      );
    // Mongo line items hold parent IDs; resolve their human document numbers from SQL.
    for (const [category, field] of [
      ['Quotation', 'reference_number'],
      ['Order', 'orderNo'],
      ['PurchaseOrder', 'poNumber'],
      ['FieldGuidedSheet', 'fgsNumber'],
    ]) {
      const model = models[category],
        entries = groups.get(category);
      if (!model || !entries?.size || !model.rawAttributes[field]) continue;
      const primary = model.primaryKeyAttributes[0];
      const heads = await model.findAll({
        where: { [primary]: { [Op.in]: [...entries.keys()] } },
        attributes: [primary, field],
        raw: true,
        transaction,
      });
      for (const head of heads)
        if (head[field]) entries.get(String(head[primary])).label = head[field];
    }
    const references = [...groups].map(([category, entries]) => ({
      category,
      label: labels[category] || category.replace(/([a-z])([A-Z])/g, '$1 $2'),
      count: entries.size,
      records: [...entries.values()],
    }));
    return {
      products: products.map((product) => ({
        productId: product.productId,
        name: product.name,
      })),
      references,
      canDelete: references.every((group) => group.count === 0),
      checkedAt: new Date().toISOString(),
      impact:
        'Referenced documents and inventory history are preserved. Products with references cannot be deleted. For unreferenced products, the product and its keyword links are permanently removed.',
    };
  }
  async function remove(ids) {
    return sequelize.transaction(async (transaction) => {
      const report = await preview(ids, transaction);
      if (!report.canDelete)
        throw Object.assign(
          fail(
            'Products are referenced by other records. Review the references before deleting.',
            409,
          ),
          { references: report.references },
        );
      await models.ProductKeyword.destroy({
        where: { productId: { [Op.in]: ids } },
        transaction,
      });
      await Product.destroy({
        where: { productId: { [Op.in]: ids } },
        transaction,
        individualHooks: true,
      });
      return { message: `Deleted ${ids.length} products.`, productIds: ids };
    });
  }
  return { preview, remove };
}
module.exports = { createProductDeletionService, mongoReferences };
