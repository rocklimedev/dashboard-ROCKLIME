const sequelize = require("../../config/database");
const { Product } = require("../../models");
const { enrichProduct } = require("./productHelpers");

async function getProductWithVariants(productId) {
  const master = await Product.findByPk(productId);
  if (!master) return null;

  let mainProduct = master;
  let variants = [];

  const masterJson = master.toJSON();

  if (masterJson.isMaster || !masterJson.masterProductId) {
    // This IS the master → fetch all its variants
    variants = await Product.findAll({
      where: { masterProductId: productId },
      order: [["variantKey", "ASC"]],
    });
  } else {
    // This is a variant → fetch the master + all siblings
    mainProduct = await Product.findByPk(masterJson.masterProductId);
    variants = await Product.findAll({
      where: { masterProductId: masterJson.masterProductId },
    });
  }

  const enrichedVariants = await Promise.all(
    variants.map((v) => enrichProduct(v)),
  );

  return {
    master: await enrichProduct(mainProduct),
    variants: enrichedVariants,
    totalVariants: enrichedVariants.length,
  };
}

async function createVariant(
  masterId,
  { name, variantOptions, meta, quantity = 0 },
) {
  const t = await sequelize.transaction();

  try {
    const master = await Product.findByPk(masterId, { transaction: t });
    if (!master || !master.isMaster) {
      const err = new Error("Invalid master product");
      err.status = 400;
      throw err;
    }

    const variantKey = Object.values(variantOptions || {}).join(" ");
    const suffix = `-${variantKey.toUpperCase().replace(/\s+/g, "-")}`;

    const variant = await Product.create(
      {
        name: name || `${master.name} - ${variantKey}`,
        product_code: `${master.product_code}${suffix}`,
        quantity,
        masterProductId: masterId,
        isMaster: false,
        variantOptions,
        variantKey,
        skuSuffix: suffix,
        categoryId: master.categoryId,
        brandId: master.brandId,
        images: master.images,
        description: master.description,
        meta: meta ? JSON.stringify(meta) : master.meta,
        status: "active",
      },
      { transaction: t },
    );

    await t.commit();
    return variant;
  } catch (error) {
    await t.rollback();
    throw error;
  }
}

module.exports = { getProductWithVariants, createVariant };
