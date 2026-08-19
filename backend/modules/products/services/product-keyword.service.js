const {
  sequelize,
  Product,
  ProductKeyword,
  Keyword,
  Category,
} = require("./product.helpers");

exports.addKeywordsToProduct = async (req, res) => {
  const { productId } = req.params;
  const { keywordIds } = req.body; // array of keyword UUIDs

  if (!Array.isArray(keywordIds) || keywordIds.length === 0) {
    return res.status(400).json({ message: "keywordIds array is required" });
  }

  const t = await sequelize.transaction();
  try {
    const product = await Product.findByPk(productId);
    if (!product) {
      await t.rollback();
      return res.status(404).json({ message: "Product not found" });
    }

    // Validate all keywordIds exist
    const keywords = await Keyword.findAll({
      where: { id: keywordIds },
    });

    if (keywords.length !== keywordIds.length) {
      await t.rollback();
      return res
        .status(400)
        .json({ message: "One or more keyword IDs are invalid" });
    }

    // Bulk create associations (ignore duplicates)
    const associations = keywordIds.map((kid) => ({
      productId,
      keywordId: kid,
    }));

    await ProductKeyword.bulkCreate(associations, {
      ignoreDuplicates: true, // prevents duplicate entry error
      transaction: t,
    });

    await t.commit();

    // Return updated list of keywords for this product
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

    res.status(200).json({
      message: "Keywords added successfully",
      keywords: updatedKeywords.map((pk) => ({
        id: pk.Keyword.id,
        keyword: pk.Keyword.keyword,
        category: pk.Keyword.categories,
      })),
    });
  } catch (error) {
    await t.rollback();
    res.status(500).json({ message: error.message });
  }
};
exports.removeKeywordFromProduct = async (req, res) => {
  const { productId, keywordId } = req.params;

  try {
    const deleted = await ProductKeyword.destroy({
      where: { productId, keywordId },
    });

    if (deleted === 0) {
      return res
        .status(404)
        .json({ message: "Keyword not associated with this product" });
    }

    res.status(200).json({ message: "Keyword removed successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
exports.removeAllKeywordsFromProduct = async (req, res) => {
  const { productId } = req.params;
  try {
    await ProductKeyword.destroy({ where: { productId } });
    res.status(200).json({ message: "All keywords removed" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Replace ALL keywords for a product (clean version)
// ───────────────────────────────
exports.replaceAllKeywordsForProduct = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { productId } = req.params;
    let { keywordIds = [] } = req.body;

    // Normalize input
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
      return res.status(404).json({ message: "Product not found" });
    }

    // This magic line replaces ALL keywords in one query!
    await product.setKeywords(cleanIds.length > 0 ? cleanIds : [], {
      transaction: t,
    });

    await t.commit();

    // Fetch fresh keywords with category
    const updatedProduct = await Product.findByPk(productId, {
      include: [
        {
          model: Keyword,
          as: "keywords",
          attributes: ["id", "keyword"],
          through: { attributes: [] }, // don't return join table fields
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

    res.json({
      message: "Keywords updated successfully",
      keywords: updatedProduct.keywords || [],
    });
  } catch (error) {
    await t.rollback();

    res.status(500).json({ message: "Failed to update keywords" });
  }
};
