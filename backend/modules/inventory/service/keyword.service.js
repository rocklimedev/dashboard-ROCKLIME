const sequelize = require("../../config/database");
const { Product, Keyword, ProductKeyword, Category } = require("../../models");

async function addKeywordsToProduct(productId, keywordIds) {
  if (!Array.isArray(keywordIds) || keywordIds.length === 0) {
    const err = new Error("keywordIds array is required");
    err.status = 400;
    throw err;
  }

  const t = await sequelize.transaction();

  try {
    const product = await Product.findByPk(productId);
    if (!product) {
      await t.rollback();
      const err = new Error("Product not found");
      err.status = 404;
      throw err;
    }

    const keywords = await Keyword.findAll({ where: { id: keywordIds } });
    if (keywords.length !== keywordIds.length) {
      await t.rollback();
      const err = new Error("One or more keyword IDs are invalid");
      err.status = 400;
      throw err;
    }

    const associations = keywordIds.map((kid) => ({
      productId,
      keywordId: kid,
    }));
    await ProductKeyword.bulkCreate(associations, {
      ignoreDuplicates: true,
      transaction: t,
    });

    await t.commit();

    const updatedKeywords = await ProductKeyword.findAll({
      where: { productId },
      include: [
        {
          model: Keyword,
          as: "keyword",
          attributes: ["id", "keyword", "categoryId"],
          include: [
            { model: Category, as: "categories", attributes: ["name", "slug"] },
          ],
        },
      ],
    });

    return updatedKeywords.map((pk) => ({
      id: pk.Keyword.id,
      keyword: pk.Keyword.keyword,
      category: pk.Keyword.categories,
    }));
  } catch (error) {
    if (t && !t.finished) await t.rollback();
    throw error;
  }
}

async function removeKeywordFromProduct(productId, keywordId) {
  const deleted = await ProductKeyword.destroy({
    where: { productId, keywordId },
  });
  return deleted > 0;
}

async function removeAllKeywordsFromProduct(productId) {
  await ProductKeyword.destroy({ where: { productId } });
}

async function replaceAllKeywordsForProduct(productId, keywordIdsInput) {
  const t = await sequelize.transaction();

  try {
    let keywordIds = keywordIdsInput;

    if (typeof keywordIds === "string") {
      try {
        keywordIds = JSON.parse(keywordIds);
      } catch {
        keywordIds = [];
      }
    }
    if (!Array.isArray(keywordIds)) keywordIds = [];

    const cleanIds = [...new Set(keywordIds.filter(Boolean))];

    const product = await Product.findByPk(productId, { transaction: t });
    if (!product) {
      await t.rollback();
      const err = new Error("Product not found");
      err.status = 404;
      throw err;
    }

    await product.setKeywords(cleanIds, { transaction: t });
    await t.commit();

    const updatedProduct = await Product.findByPk(productId, {
      include: [
        {
          model: Keyword,
          as: "keywords",
          attributes: ["id", "keyword"],
          through: { attributes: [] },
          include: [
            {
              model: Category,
              as: "categories",
              attributes: ["categoryId", "name", "slug"],
            },
          ],
        },
      ],
    });

    return updatedProduct.keywords || [];
  } catch (error) {
    if (t && !t.finished) await t.rollback();
    throw error;
  }
}

module.exports = {
  addKeywordsToProduct,
  removeKeywordFromProduct,
  removeAllKeywordsFromProduct,
  replaceAllKeywordsForProduct,
};
