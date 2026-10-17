const { createHash } = require("node:crypto");
const { Op } = require("sequelize");
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const error = (message, status = 400) =>
  Object.assign(new Error(message), { status });
const stable = (value) =>
  Array.isArray(value)
    ? value.map(stable)
    : value instanceof Date
      ? value.toISOString()
      : value && typeof value === "object"
        ? Object.fromEntries(
            Object.keys(value)
              .sort()
              .map((key) => [key, stable(value[key])]),
          )
        : value;
const hash = (value) =>
  createHash("sha256")
    .update(JSON.stringify(stable(value)))
    .digest("hex");
const json = (value, fallback = {}) =>
  value == null
    ? fallback
    : typeof value === "string"
      ? JSON.parse(value)
      : value;
const present = (value) => value != null && String(value).trim() !== "";
const normalized = (value) =>
  String(value ?? "")
    .normalize("NFKC")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
const identifierKeys = new Set([
  "id",
  "productId",
  "parentProductId",
  "masterProductId",
  "isOptionFor",
]);

// Only exact product identifiers are rewritten. Names, prices, totals and prose stay intact.
function rewriteProductReferences(value, sourceId, keeperId) {
  if (Array.isArray(value))
    return value.map((item) =>
      rewriteProductReferences(item, sourceId, keeperId),
    );
  if (!value || typeof value !== "object")
    return value === sourceId ? keeperId : value;
  if (Object.hasOwn(value, sourceId) && Object.hasOwn(value, keeperId))
    throw error(
      "A record contains both products as keyed entries. Resolve those entries before merging.",
      409,
    );
  return Object.fromEntries(
    Object.entries(value).map(([key, child]) => [
      key === sourceId ? keeperId : key,
      identifierKeys.has(key) && child === sourceId
        ? keeperId
        : child && typeof child === "object"
          ? rewriteProductReferences(child, sourceId, keeperId)
          : child,
    ]),
  );
}
function containsReference(value, id) {
  if (Array.isArray(value))
    return value.some((item) => containsReference(item, id));
  if (typeof value === "string") return value === id;
  return (
    !!value &&
    typeof value === "object" &&
    Object.entries(value).some(
      ([key, child]) =>
        key === id ||
        (identifierKeys.has(key) && child === id) ||
        (child && typeof child === "object" && containsReference(child, id)),
    )
  );
}

function createProductMergeService(models, countMongoReferences) {
  const {
    Product,
    ProductMeta,
    ProductKeyword,
    InventoryHistory,
    ActivityLog,
    sequelize,
  } = models;
  async function plan(input, transaction) {
    const { keeperId, sourceId } = input;
    if (
      typeof keeperId !== "string" ||
      typeof sourceId !== "string" ||
      !uuid.test(keeperId) ||
      !uuid.test(sourceId) ||
      keeperId === sourceId
    )
      throw error(
        "Select exactly two different products and choose which one to keep.",
      );
    const products = await Product.findAll({
      where: { productId: { [Op.in]: [keeperId, sourceId].sort() } },
      order: [["productId", "ASC"]],
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (products.length !== 2)
      throw error(
        "One of the products no longer exists. Refresh inventory.",
        409,
      );
    const keeper = products.find((product) => product.productId === keeperId),
      source = products.find((product) => product.productId === sourceId);
    const keeperData = keeper.toJSON(),
      sourceData = source.toJSON();
    const definitions = await ProductMeta.findAll({ raw: true, transaction });
    const slug = (value) =>
      String(value || "")
        .replace(/[_\s-]/g, "")
        .toLowerCase();
    const codeIds = definitions
      .filter((field) => slug(field.slug) === "companycode")
      .map((field) => field.id);
    const priceField = definitions.find(
      (field) => slug(field.slug) === "sellingprice",
    );
    const values = (product) => {
      const meta = json(product.meta);
      const codes = [
        ...new Set(
          [
            ...codeIds.map((id) => meta[id]),
            meta.companyCode,
            meta.company_code,
          ]
            .filter(present)
            .map(normalized),
        ),
      ];
      const rawPrice = [
        meta[priceField?.id],
        meta.sellingPrice,
        meta.selling_price,
      ].find(present);
      return {
        meta,
        codes,
        sellingPrice:
          rawPrice == null || !Number.isFinite(Number(rawPrice))
            ? null
            : Number(rawPrice),
      };
    };
    const keeperValues = values(keeperData),
      sourceValues = values(sourceData);
    const blockers = [];
    if (
      keeperValues.codes.length !== 1 ||
      sourceValues.codes.length !== 1 ||
      keeperValues.codes[0] !== sourceValues.codes[0]
    )
      blockers.push("Products must have the same unambiguous company code.");
    if ((keeper.brandId || null) !== (source.brandId || null))
      blockers.push("Products belong to different brands.");
    if (
      keeper.isMaster ||
      source.isMaster ||
      (keeper.masterProductId || null) !== (source.masterProductId || null) ||
      hash(json(keeper.variantOptions)) !== hash(json(source.variantOptions)) ||
      normalized(keeper.variantKey) !== normalized(source.variantKey) ||
      normalized(keeper.skuSuffix) !== normalized(source.skuSuffix)
    )
      blockers.push("Master products or different variants cannot be merged.");
    if (
      await Product.count({
        where: { masterProductId: { [Op.in]: [keeperId, sourceId] } },
        transaction,
      })
    )
      blockers.push("A selected product owns variants.");
    for (const product of products)
      if (
        !Number.isSafeInteger(Number(product.quantity)) ||
        Number(product.quantity) < 0
      )
        blockers.push(`Invalid stock quantity for ${product.name}.`);
    const keywords = await ProductKeyword.findAll({
      where: { productId: { [Op.in]: [keeperId, sourceId] } },
      raw: true,
      order: [
        ["productId", "ASC"],
        ["keywordId", "ASC"],
      ],
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    const rows = [],
      references = [];
    for (const model of Object.values(sequelize.models).sort((a, b) =>
      a.name.localeCompare(b.name),
    )) {
      if (
        [Product, ProductMeta, ProductKeyword, ActivityLog].includes(model) ||
        model.name === "OrderActivity"
      )
        continue;
      const conditions = [];
      const attributes = model.rawAttributes || {};
      if (attributes.productId) conditions.push({ productId: sourceId });
      const jsonKeys = Object.entries(attributes)
        .filter(([, attribute]) => attribute.type?.key === "JSON")
        .map(([key]) => key);
      for (const key of jsonKeys)
        conditions.push(
          sequelize.where(sequelize.cast(sequelize.col(key), "CHAR"), {
            [Op.like]: `%${sourceId}%`,
          }),
        );
      if (!conditions.length) continue;
      const instances = await model.findAll({
        where: { [Op.or]: conditions },
        transaction,
        lock: transaction.LOCK.UPDATE,
        limit: 10001,
        order: model.primaryKeyAttributes.map((key) => [key, "ASC"]),
      });
      if (instances.length > 10000)
        throw error(
          `Too many ${model.name} references for an interactive merge.`,
          409,
        );
      let changedRows = 0;
      for (const instance of instances) {
        const before = instance.toJSON(),
          changes = {};
        if (attributes.productId && before.productId === sourceId)
          changes.productId = keeperId;
        for (const key of jsonKeys) {
          let value;
          try {
            value = json(before[key], null);
          } catch {
            value = before[key];
          }
          if (!containsReference(value, sourceId)) continue;
          if (containsReference(value, keeperId)) {
            blockers.push(
              `${model.name} already contains both products. Resolve its duplicate lines before merging.`,
            );
            continue;
          }
          changes[key] = rewriteProductReferences(value, sourceId, keeperId);
        }
        if (Object.keys(changes).length) {
          if (model === InventoryHistory)
            changes.message =
              `${before.message || ""}\nMerged from ${source.name} (${sourceId}); original quantity after: ${before.quantityAfter}.`.trim();
          rows.push({ model, instance, before, changes });
          changedRows++;
        }
      }
      if (changedRows)
        references.push({
          storage: "MySQL",
          model: model.name,
          records: changedRows,
          action: "transfer",
        });
    }
    const mongoReferences = await countMongoReferences(sourceId);
    for (const reference of mongoReferences)
      if (reference.records) {
        references.push({
          ...reference,
          storage: "MongoDB",
          action: "blocked",
        });
        blockers.push(
          `${reference.model} references the product being removed (${reference.records} records). Keep that referenced product or resolve these references first.`,
        );
      }
    const ignored = new Set([
      "productId",
      "product_code",
      "createdAt",
      "updatedAt",
      "quantity",
    ]);
    const differences = Object.keys({ ...keeperData, ...sourceData })
      .filter(
        (key) =>
          !ignored.has(key) &&
          hash(keeperData[key] ?? null) !== hash(sourceData[key] ?? null),
      )
      .map((field) => ({
        field,
        keeper: keeperData[field] ?? null,
        source: sourceData[field] ?? null,
      }));
    const fingerprint = hash({
      keeper: keeperData,
      source: sourceData,
      definitions,
      keywords,
      rows: rows.map((row) => ({ model: row.model.name, before: row.before })),
      mongoReferences,
    });
    return {
      keeper,
      source,
      keeperData,
      sourceData,
      keeperValues,
      sourceValues,
      priceField,
      keywords,
      rows,
      references,
      blockers: [...new Set(blockers)],
      differences,
      fingerprint,
    };
  }
  const publicPlan = (result) => ({
    keeper: {
      ...result.keeperData,
      sellingPrice: result.keeperValues.sellingPrice,
    },
    source: {
      ...result.sourceData,
      sellingPrice: result.sourceValues.sellingPrice,
    },
    companyCode: result.keeperValues.codes[0] || null,
    fingerprint: result.fingerprint,
    references: result.references,
    blockers: result.blockers,
    differences: result.differences,
    historyRecordsToTransfer: result.rows.filter(
      (row) => row.model === InventoryHistory,
    ).length,
    sourceKeywords: result.keywords.filter(
      (row) => row.productId === result.source.productId,
    ).length,
  });
  async function preview(input) {
    return sequelize.transaction((transaction) =>
      plan(input, transaction).then(publicPlan),
    );
  }
  async function merge(input, userId) {
    if (!/^[a-f0-9]{64}$/.test(input.fingerprint || ""))
      throw error("Preview the merge before confirming.");
    if (!["keep", "sum", "source", "custom"].includes(input.stockMode))
      throw error("Choose how to handle stock.");
    if (!["keep", "source", "custom"].includes(input.priceMode))
      throw error("Choose which selling price to keep.");
    return sequelize.transaction(async (transaction) => {
      const result = await plan(input, transaction);
      if (result.fingerprint !== input.fingerprint)
        throw error(
          "Products or references changed since the preview. Load a fresh preview before merging.",
          409,
        );
      if (result.blockers.length) throw error(result.blockers.join(" "), 409);
      const keeperQuantity = Number(result.keeper.quantity),
        sourceQuantity = Number(result.source.quantity);
      const quantity =
        input.stockMode === "sum"
          ? keeperQuantity + sourceQuantity
          : input.stockMode === "source"
            ? sourceQuantity
            : input.stockMode === "custom"
              ? input.quantity
              : keeperQuantity;
      if (
        !Number.isSafeInteger(quantity) ||
        quantity < 0 ||
        quantity > 2147483647
      )
        throw error(
          "Final stock must be a nonnegative whole number within the stock limit.",
        );
      const sellingPrice =
        input.priceMode === "source"
          ? result.sourceValues.sellingPrice
          : input.priceMode === "custom"
            ? input.sellingPrice
            : result.keeperValues.sellingPrice;
      if (
        sellingPrice != null &&
        (typeof sellingPrice !== "number" ||
          !Number.isFinite(sellingPrice) ||
          sellingPrice < 0 ||
          sellingPrice > 999999999999)
      )
        throw error("Final selling price must be a valid nonnegative number.");
      if (input.priceMode !== "keep" && sellingPrice == null)
        throw error(
          "Enter a selling price or choose a product with a price set.",
        );
      if (input.priceMode !== "keep" && !result.priceField)
        throw error("Selling price metadata definition is missing.");
      // Preserve the keeper's identity and business-field choices; only fill absent metadata.
      const meta = { ...result.keeperValues.meta };
      for (const [key, value] of Object.entries(result.sourceValues.meta))
        if (!present(meta[key])) meta[key] = value;
      if (result.priceField) {
        if (sellingPrice == null) delete meta[result.priceField.id];
        else meta[result.priceField.id] = Math.round(sellingPrice * 100) / 100;
      }
      for (const key of ["sellingPrice", "selling_price"])
        if (Object.hasOwn(meta, key)) {
          if (sellingPrice == null) delete meta[key];
          else meta[key] = Math.round(sellingPrice * 100) / 100;
        }
      const keeperImages = json(result.keeper.images, []),
        sourceImages = json(result.source.images, []);
      if (!Array.isArray(keeperImages) || !Array.isArray(sourceImages))
        throw error("Product images must be valid arrays.");
      const images = [
        ...new Map(
          [...keeperImages, ...sourceImages].map((image) => [
            hash(image),
            image,
          ]),
        ).values(),
      ];
      for (const row of result.rows)
        await row.instance.update(row.changes, { transaction, silent: true });
      const keeperKeywords = new Set(
        result.keywords
          .filter((row) => row.productId === input.keeperId)
          .map((row) => row.keywordId),
      );
      for (const keyword of result.keywords.filter(
        (row) => row.productId === input.sourceId,
      ))
        if (!keeperKeywords.has(keyword.keywordId)) {
          await ProductKeyword.create(
            { productId: input.keeperId, keywordId: keyword.keywordId },
            { transaction },
          );
          keeperKeywords.add(keyword.keywordId);
        }
      await ProductKeyword.destroy({
        where: { productId: input.sourceId },
        transaction,
      });
      await result.keeper.update({ meta, images }, { transaction });
      await mergeStock(input.sourceId, input.keeperId, quantity, userId, transaction);
      const history = await InventoryHistory.create(
        {
          productId: input.keeperId,
          change: quantity - keeperQuantity,
          quantityAfter: quantity,
          action: "correction",
          userId,
          message: `Merged ${result.source.name} (${input.sourceId}) into ${result.keeper.name}. Stock mode: ${input.stockMode}; old stocks ${keeperQuantity} and ${sourceQuantity}; final stock ${quantity}. Transferred history retains original balances. ${String(input.note || "").slice(0, 2000)}`,
        },
        { transaction },
      );
      const audit = await ActivityLog.create(
        {
          userId,
          contextTag: "CATALOG",
          subContext: "PRODUCT",
          action: "PRODUCTS_MERGED",
          entityId: input.keeperId,
          entityName: result.keeper.name,
          severity: "warning",
          description: `Merged ${input.sourceId} into ${input.keeperId}`,
          oldValues: { keeper: result.keeperData, source: result.sourceData },
          newValues: result.keeper.toJSON(),
          metadata: {
            stockMode: input.stockMode,
            priceMode: input.priceMode,
            historyRecordId: history.id,
            movedReferences: result.references,
            transferredRecords: result.rows.map((row) => ({
              model: row.model.name,
              primaryKey: Object.fromEntries(
                row.model.primaryKeyAttributes.map((key) => [
                  key,
                  row.before[key],
                ]),
              ),
            })),
            originalKeywords: result.keywords,
            note: String(input.note || "").slice(0, 2000),
          },
        },
        { transaction },
      );
      // Foreign keys remain enabled. Unexpected constraints roll back the entire merge.
      await result.source.destroy({ transaction });
      return {
        message: "Products merged successfully.",
        keeperId: input.keeperId,
        removedProductId: input.sourceId,
        quantity,
        sellingPrice,
        auditId: audit.activityLogId,
        historyRecordsTransferred: result.rows.filter(
          (row) => row.model === InventoryHistory,
        ).length,
      };
    });
  }
  return { preview, merge };
}

// Move the source product's stock (balances, reservations, ledger) onto the
// keeper, then set the keeper's available stock to the chosen final figure.
async function mergeStock(sourceId, keeperId, finalAvailable, userId, transaction) {
  const stock = require("../stock/stock.service");
  const { StockBalance, StockReservation, StockLedger } = require("../../models");
  const t = transaction;
  for (const r of await StockReservation.findAll({ where: { productId: sourceId }, transaction: t })) {
    const [keep] = await StockReservation.findOrCreate({
      where: { orderId: r.orderId, productId: keeperId, warehouseId: r.warehouseId },
      defaults: { orderId: r.orderId, orderNo: r.orderNo, productId: keeperId, warehouseId: r.warehouseId, quantity: 0, status: r.status },
      transaction: t,
    });
    if (keep.id !== r.id) {
      await keep.update({ quantity: keep.quantity + (r.status === "ACTIVE" ? r.quantity : 0), status: r.status === "ACTIVE" || keep.status === "ACTIVE" ? "ACTIVE" : keep.status }, { transaction: t });
      await r.destroy({ transaction: t });
    }
  }
  for (const b of await StockBalance.findAll({ where: { productId: sourceId }, transaction: t })) {
    const [keep] = await StockBalance.findOrCreate({
      where: { productId: keeperId, warehouseId: b.warehouseId },
      defaults: { productId: keeperId, warehouseId: b.warehouseId },
      transaction: t,
    });
    await keep.update(
      { onHand: keep.onHand + b.onHand, reserved: keep.reserved + b.reserved, incoming: keep.incoming + b.incoming, damaged: keep.damaged + b.damaged },
      { transaction: t },
    );
    await b.destroy({ transaction: t });
  }
  await StockLedger.update({ productId: keeperId }, { where: { productId: sourceId }, transaction: t });
  const { totals } = await stock.productStock(keeperId, { t });
  await stock.setOnHand(
    { productId: keeperId, counted: Math.max(finalAvailable, 0) + totals.reserved - (totals.onHand - (await defaultOnHand(keeperId, t))), reason: `Merged with product ${sourceId}`, userId },
    { t },
  );
  await stock.syncProductQuantity(keeperId, t);
}

// On-hand in the default godown (setOnHand works on one godown at a time)
async function defaultOnHand(productId, t) {
  const stock = require("../stock/stock.service");
  const { StockBalance } = require("../../models");
  const wh = await stock.getDefaultWarehouse(t);
  const b = await StockBalance.findOne({ where: { productId, warehouseId: wh.id }, transaction: t });
  return b ? b.onHand : 0;
}

async function countMongoReferences(sourceId) {
  const mongoose = require("mongoose");
  if (mongoose.connection.readyState !== 1)
    throw error(
      "MongoDB is unavailable. Product reference checks could not complete.",
      503,
    );
  const registry = [
    ["Cart", require("../cart/models/carts.model"), ["items.productId"]],
    [
      "OrderItem",
      require("../orders/models/order-item.model"),
      ["items.productId"],
    ],
    [
      "QuotationItem",
      require("../quotations/models/quotation-item.model"),
      ["items.productId", "items.parentProductId", "items.isOptionFor"],
    ],
    [
      "QuotationVersion",
      require("../quotations/models/quotation-version.model"),
      [
        "quotationItems.productId",
        "quotationItems.parentProductId",
        "quotationItems.isOptionFor",
        "quotationData.products.productId",
        "quotationData.products.id",
      ],
    ],
    [
      "PoItem",
      require("../purchase-order/models/po-item.model"),
      ["items.productId"],
    ],
    [
      "FgsItem",
      require("../purchase-order/models/fgs-item.model"),
      ["items.productId"],
    ],
  ];
  const references = [];
  for (const [model, collection, paths] of registry)
    references.push({
      model,
      records: await collection.collection.countDocuments(
        { $or: paths.map((path) => ({ [path]: sourceId })) },
        { maxTimeMS: 10000 },
      ),
    });
  return references;
}
module.exports = {
  createProductMergeService,
  countMongoReferences,
  rewriteProductReferences,
  containsReference,
};
