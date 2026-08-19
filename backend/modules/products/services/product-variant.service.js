const { sequelize, Product } = require("./product.helpers");

// GET /api/products/:productId/with-variants
exports.getProductWithVariants = async (req, res) => {
  try {
    const { productId } = req.params;

    const master = await Product.findByPk(productId);
    if (!master) return res.status(404).json({ message: "Not found" });

    let variants = [];
    let mainProduct = master.toJSON();

    if (mainProduct.isMaster || !mainProduct.masterProductId) {
      // This is master → fetch all variants
      variants = await Product.findAll({
        where: { masterProductId: productId },
        order: [["variantKey", "ASC"]],
      });
    } else {
      // This is a variant → fetch master + siblings
      mainProduct = await Product.findByPk(mainProduct.masterProductId);
      variants = await Product.findAll({
        where: { masterProductId: mainProduct.masterProductId },
      });
    }

    const enrichedVariants = variants.map((v) => enrichProduct(v)); // reuse your enrich logic

    res.json({
      master: enrichProduct(mainProduct),
      variants: enrichedVariants,
      totalVariants: enrichedVariants.length,
    });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};
// POST /api/products/:masterId/variants
exports.createVariant = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { masterId } = req.params;
    const { name, variantOptions, meta, quantity = 0 } = req.body;

    const master = await Product.findByPk(masterId, { transaction: t });
    if (!master || !master.isMaster) {
      await t.rollback();
      return res.status(400).json({ message: "Invalid master product" });
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
    res.status(201).json({ message: "Variant created", variant });
  } catch (e) {
    await t.rollback();
    res.status(500).json({ message: e.message });
  }
};
