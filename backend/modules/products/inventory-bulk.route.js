const express = require("express");
const { Op } = require("sequelize");
const models = require("../../models");
const {
  Product,
  ProductMeta,
  InventoryHistory,
  User,
  Role,
  Permission,
  sequelize,
} = models;
const router = express.Router();
const {
  createProductMergeService,
  countMongoReferences,
} = require("./product-merge.service");
const productMerge = createProductMergeService(models, countMongoReferences);
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const fail = (message, status = 400) =>
  Object.assign(new Error(message), { status });
const json = (value) =>
  typeof value === "string" ? JSON.parse(value) : value || {};
const present = (value) => value != null && String(value).trim() !== "";
const slug = (value) =>
  String(value || "")
    .replace(/[_\s-]/g, "")
    .toLowerCase();
function idsFrom(body) {
  const ids = body.productIds;
  if (
    !Array.isArray(ids) ||
    !ids.length ||
    ids.length > 500 ||
    ids.some((id) => typeof id !== "string" || !uuid.test(id))
  )
    throw fail("Select between 1 and 500 valid products.");
  if (new Set(ids).size !== ids.length)
    throw fail("Duplicate product IDs are not allowed.");
  return [...ids].sort();
}
async function authorize(req, res, next) {
  try {
    const user = await User.findByPk(req.user.userId, {
      attributes: ["roleId"],
    });
    const role =
      user &&
      (await Role.findByPk(user.roleId, {
        include: [
          { model: Permission, as: "permissions", through: { attributes: [] } },
        ],
      }));
    if (!role) return res.status(403).json({ message: "User role not found." });
    const action =
      req.path === "/delete"
        ? "delete"
        : req.path === "/export"
          ? "export"
          : "edit";
    const requiredActions = ["/merge", "/merge-preview"].includes(req.path)
      ? ["edit", "delete"]
      : [action];
    const permitted =
      ["SUPER_ADMIN", "DEVELOPER"].includes(role.roleName) ||
      requiredActions.every((required) =>
        (role.permissions || []).some(
          (permission) =>
            permission.api === required &&
            ["products", "inventory"].includes(permission.module),
        ),
      );
    if (!permitted)
      return res
        .status(403)
        .json({ message: `Missing ${action} permission for inventory.` });
    next();
  } catch (error) {
    next(error);
  }
}
router.use(authorize);
router.post("/merge-preview", async (req, res, next) => {
  try {
    res.json(await productMerge.preview(req.body));
  } catch (error) {
    if (error.status)
      return res.status(error.status).json({ message: error.message });
    next(error);
  }
});
router.post("/merge", async (req, res, next) => {
  try {
    res.json(await productMerge.merge(req.body, req.user.userId));
  } catch (error) {
    if (error.status)
      return res.status(error.status).json({ message: error.message });
    if (
      [
        "SequelizeForeignKeyConstraintError",
        "SequelizeUniqueConstraintError",
      ].includes(error.name)
    )
      return res
        .status(409)
        .json({
          message:
            "A referenced record prevents this merge. No products were changed.",
        });
    next(error);
  }
});
async function fields(transaction) {
  const definitions = await ProductMeta.findAll({ raw: true, transaction });
  return {
    definitions,
    price: definitions.find((field) => slug(field.slug) === "sellingprice"),
    code: definitions.find((field) => slug(field.slug) === "companycode"),
  };
}
function productValues(product, definitions) {
  const meta = json(product.meta);
  const first = (...values) => values.find(present);
  const code = first(
    meta[definitions.code?.id],
    meta.companyCode,
    meta.company_code,
  );
  const rawPrice = first(
    meta[definitions.price?.id],
    meta.sellingPrice,
    meta.selling_price,
  );
  return {
    meta,
    companyCode: code == null ? null : String(code),
    sellingPrice:
      rawPrice == null || !Number.isFinite(Number(rawPrice))
        ? null
        : Number(rawPrice),
  };
}
async function selectedProducts(ids, transaction, lock = false) {
  const products = await Product.findAll({
    where: { productId: { [Op.in]: ids } },
    order: [["productId", "ASC"]],
    transaction,
    ...(lock ? { lock: transaction.LOCK.UPDATE } : {}),
  });
  if (products.length !== ids.length)
    throw fail(
      "Some selected products no longer exist. Refresh inventory and select again.",
      409,
    );
  return products;
}
router.post("/update", async (req, res, next) => {
  try {
    const updates = req.body.updates;
    const ids = idsFrom({
      productIds: Array.isArray(updates)
        ? updates.map((update) => update?.productId)
        : null,
    });
    for (const update of updates) {
      if (update.quantity === undefined && update.sellingPrice === undefined)
        throw fail("Each product requires a stock or price change.");
      if (
        update.quantity !== undefined &&
        (!Number.isSafeInteger(update.quantity) ||
          update.quantity < 0 ||
          update.quantity > 2147483647 ||
          !Number.isSafeInteger(update.expectedQuantity))
      )
        throw fail(
          "Stock must be a nonnegative whole number and include the previous quantity.",
        );
      if (
        update.sellingPrice !== undefined &&
        (typeof update.sellingPrice !== "number" ||
          !Number.isFinite(update.sellingPrice) ||
          update.sellingPrice < 0 ||
          update.sellingPrice > 999999999999)
      )
        throw fail("Selling price must be a valid nonnegative number.");
    }
    const result = await sequelize.transaction(async (transaction) => {
      const products = await selectedProducts(ids, transaction, true);
      const definitions = await fields(transaction);
      if (
        updates.some((update) => update.sellingPrice !== undefined) &&
        !definitions.price
      )
        throw fail("Selling price metadata definition is missing.");
      const byId = new Map(updates.map((update) => [update.productId, update]));
      const changed = [];
      for (const product of products) {
        const update = byId.get(product.productId);
        const values = productValues(product, definitions);
        const oldQuantity = Number(product.quantity);
        if (
          update.quantity !== undefined &&
          oldQuantity !== update.expectedQuantity
        )
          throw fail(
            `Stock changed for ${product.name}. Refresh inventory before applying this update.`,
            409,
          );
        if (
          update.sellingPrice !== undefined &&
          update.expectedSellingPrice !== values.sellingPrice
        )
          throw fail(
            `Price changed for ${product.name}. Refresh inventory before applying this update.`,
            409,
          );
        const changes = {};
        if (update.quantity !== undefined) changes.quantity = update.quantity;
        if (update.sellingPrice !== undefined) {
          const price = Math.round(update.sellingPrice * 100) / 100;
          changes.meta = { ...values.meta, [definitions.price.id]: price };
          for (const key of ["sellingPrice", "selling_price"])
            if (Object.hasOwn(changes.meta, key)) changes.meta[key] = price;
        }
        await product.update(changes, { transaction });
        if (changes.quantity !== undefined && changes.quantity !== oldQuantity)
          await InventoryHistory.create(
            {
              productId: product.productId,
              change: changes.quantity - oldQuantity,
              quantityAfter: changes.quantity,
              action: "adjustment",
              userId: req.user.userId,
              message: String(
                req.body.message || "Bulk inventory adjustment",
              ).slice(0, 2000),
            },
            { transaction },
          );
        changed.push(product.productId);
      }
      return changed;
    });
    res.json({
      message: `Updated ${result.length} products.`,
      productIds: result,
    });
  } catch (error) {
    if (error.status)
      return res.status(error.status).json({ message: error.message });
    next(error);
  }
});
router.post("/delete", async (req, res, next) => {
  try {
    const ids = idsFrom(req.body);
    await sequelize.transaction(async (transaction) => {
      const products = await selectedProducts(ids, transaction, true);
      if (
        await InventoryHistory.count({
          where: { productId: { [Op.in]: ids } },
          transaction,
        })
      )
        throw fail(
          "Selected products have inventory history. Deselect them before deleting.",
          409,
        );
      if (
        await Product.count({
          where: { masterProductId: { [Op.in]: ids } },
          transaction,
        })
      )
        throw fail(
          "Selected products own variants. Deselect their master products before deleting.",
          409,
        );
      // Preserve references held in JSON snapshots as well as relational records.
      for (const model of Object.values(sequelize.models)) {
        if (
          model === Product ||
          model === models.ProductKeyword ||
          model === ProductMeta
        )
          continue;
        const attributes = model.rawAttributes || {};
        const conditions = [];
        if (attributes.productId)
          conditions.push({ productId: { [Op.in]: ids } });
        for (const [key, attribute] of Object.entries(attributes))
          if (attribute.type?.key === "JSON") {
            for (const id of ids)
              conditions.push(
                sequelize.where(sequelize.cast(sequelize.col(key), "CHAR"), {
                  [Op.like]: `%${id}%`,
                }),
              );
          }
        if (
          conditions.length &&
          (await model.count({ where: { [Op.or]: conditions }, transaction }))
        )
          throw fail(
            `Selected products are referenced by ${model.name}. Deselect them before deleting.`,
            409,
          );
      }
      await models.ProductKeyword.destroy({
        where: { productId: { [Op.in]: ids } },
        transaction,
      });
      for (const product of products) await product.destroy({ transaction });
    });
    res.json({ message: `Deleted ${ids.length} products.`, productIds: ids });
  } catch (error) {
    if (error.status)
      return res.status(error.status).json({ message: error.message });
    if (error.name === "SequelizeForeignKeyConstraintError")
      return res
        .status(409)
        .json({
          message:
            "Selected products are referenced by other records and cannot be deleted.",
        });
    next(error);
  }
});
router.post("/export", async (req, res, next) => {
  try {
    const ids = idsFrom(req.body);
    const result = await sequelize.transaction(
      { isolationLevel: "REPEATABLE READ" },
      async (transaction) => {
        const products = await selectedProducts(ids, transaction);
        const definitions = await fields(transaction);
        const rows = products.map((product) => {
          const data = product.toJSON();
          const values = productValues(data, definitions);
          return {
            ...data,
            companyCode: values.companyCode,
            sellingPrice: values.sellingPrice,
          };
        });
        const history =
          req.body.includeHistory === true
            ? await InventoryHistory.findAll({
                where: { productId: { [Op.in]: ids } },
                order: [
                  ["createdAt", "ASC"],
                  ["id", "ASC"],
                ],
                raw: true,
                transaction,
              })
            : [];
        if (history.length > 1048575)
          throw fail(
            "Too many history rows for a single Excel sheet. Select fewer products.",
          );
        const userIds = [
          ...new Set(history.map((record) => record.userId).filter(Boolean)),
        ];
        const users = userIds.length
          ? await User.findAll({
              where: { userId: { [Op.in]: userIds } },
              attributes: ["userId", "name", "username"],
              raw: true,
              transaction,
            })
          : [];
        return {
          products: rows,
          history,
          users,
          exportedAt: new Date().toISOString(),
        };
      },
    );
    res.json(result);
  } catch (error) {
    if (error.status)
      return res.status(error.status).json({ message: error.message });
    next(error);
  }
});
module.exports = router;
