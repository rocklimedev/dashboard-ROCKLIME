// controllers/category.controller.js
const { Op } = require("sequelize");
const sequelize = require("../config/database");

const slugify = require("slugify");
const {
  BrandParentCategory,
  Keyword,
  Brand,
  ParentCategory,
  Category,
} = require("../models");
// Create Category (with optional keywords)
exports.createCategory = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { name, brandId, parentCategoryId, keywords = [] } = req.body;
    if (!name || !brandId || !parentCategoryId) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: "name, brandId and parentCategoryId are required",
      });
    }

    // validate Brand & ParentCategory
    const [brand, parent] = await Promise.all([
      Brand.findByPk(brandId, { transaction: t }),
      ParentCategory.findByPk(parentCategoryId, { transaction: t }),
    ]);
    if (!brand) {
      await t.rollback();
      return res
        .status(400)
        .json({ success: false, message: "Invalid brandId" });
    }
    if (!parent) {
      await t.rollback();
      return res
        .status(400)
        .json({ success: false, message: "Invalid parentCategoryId" });
    }

    // Ensure Brand-ParentCategory link exists (create if missing)
    await BrandParentCategory.findOrCreate({
      where: { brandId, parentCategoryId },
      defaults: { brandId, parentCategoryId },
      transaction: t,
    });

    const slug = slugify(name, { lower: true, strict: true });

    const category = await Category.create(
      { name, slug, brandId, parentCategoryId },
      { transaction: t }
    );

    if (Array.isArray(keywords) && keywords.length) {
      const clean = [
        ...new Set(
          keywords
            .map(String)
            .map((k) => k.trim())
            .filter(Boolean)
        ),
      ];
      // If your Keyword model is globally unique on `keyword`, replace with findOrCreate or switch to composite unique (see note at bottom).
      for (const k of clean) {
        await Keyword.create(
          { keyword: k, categoryId: category.categoryId },
          { transaction: t }
        );
      }
    }

    await t.commit();

    const created = await Category.findByPk(category.categoryId, {
      include: [
        {
          model: ParentCategory,
          as: "parentCategory",
          attributes: ["id", "name", "slug"],
        },
        {
          model: Brand,
          as: "brand",
          attributes: ["id", "brandName", "brandSlug"],
        },
        { model: Keyword, as: "keywords" },
      ],
    });

    return res.status(201).json({ success: true, category: created });
  } catch (error) {
    await t.rollback();
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Get All Categories (with brand, parent, keywords)
exports.getAllCategories = async (req, res) => {
  try {
    const categories = await Category.findAll({
      include: [
        {
          model: ParentCategory,
          as: "parentCategory",
          attributes: ["id", "name", "slug"],
        },
        {
          model: Brand,
          as: "brand",
          attributes: ["id", "brandName", "brandSlug"],
        },
        { model: Keyword, as: "keywords" },
      ],
      order: [
        ["name", "ASC"],
        [{ model: Keyword, as: "keywords" }, "keyword", "ASC"],
      ],
    });
    res.status(200).json({ success: true, categories });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get Category by ID (with brand, parent, keywords)
exports.getCategoryById = async (req, res) => {
  try {
    const { id } = req.params; // id is categoryId
    const category = await Category.findByPk(id, {
      include: [
        {
          model: ParentCategory,
          as: "parentCategory",
          attributes: ["id", "name", "slug"],
        },
        {
          model: Brand,
          as: "brand",
          attributes: ["id", "brandName", "brandSlug"],
        },
        { model: Keyword, as: "keywords" },
      ],
    });
    if (!category)
      return res
        .status(404)
        .json({ success: false, message: "Category not found" });
    res.status(200).json({ success: true, category });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update Category (and optionally replace keywords)
exports.updateCategory = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params; // categoryId
    const { name, brandId, parentCategoryId, keywords } = req.body;

    const category = await Category.findByPk(id, { transaction: t });
    if (!category) {
      await t.rollback();
      return res
        .status(404)
        .json({ success: false, message: "Category not found" });
    }

    // validate brand/parent if provided
    if (brandId) {
      const brand = await Brand.findByPk(brandId, { transaction: t });
      if (!brand) {
        await t.rollback();
        return res
          .status(400)
          .json({ success: false, message: "Invalid brandId" });
      }
      category.brandId = brandId;
    }
    if (parentCategoryId) {
      const parent = await ParentCategory.findByPk(parentCategoryId, {
        transaction: t,
      });
      if (!parent) {
        await t.rollback();
        return res
          .status(400)
          .json({ success: false, message: "Invalid parentCategoryId" });
      }
      // ensure link exists
      await BrandParentCategory.findOrCreate({
        where: { brandId: category.brandId, parentCategoryId },
        defaults: { brandId: category.brandId, parentCategoryId },
        transaction: t,
      });
      category.parentCategoryId = parentCategoryId;
    }

    if (name) {
      category.name = name;
      category.slug = slugify(name, { lower: true, strict: true });
    }

    await category.save({ transaction: t });

    // optional full replace of keywords if provided
    if (Array.isArray(keywords)) {
      const incoming = [
        ...new Set(
          keywords
            .map(String)
            .map((k) => k.trim())
            .filter(Boolean)
        ),
      ];
      const existing = await Keyword.findAll({
        where: { categoryId: id },
        transaction: t,
      });
      const existingSet = new Set(existing.map((k) => k.keyword));
      const toAdd = incoming.filter((k) => !existingSet.has(k));
      const toRemove = existing
        .filter((k) => !incoming.includes(k.keyword))
        .map((k) => k.keyword);

      if (toRemove.length) {
        await Keyword.destroy({
          where: { categoryId: id, keyword: { [Op.in]: toRemove } },
          transaction: t,
        });
      }
      for (const k of toAdd) {
        await Keyword.create(
          { keyword: k, categoryId: id },
          { transaction: t }
        );
      }
    }

    await t.commit();

    const fresh = await Category.findByPk(id, {
      include: [
        {
          model: ParentCategory,
          as: "parentCategory",
          attributes: ["id", "name", "slug"],
        },
        {
          model: Brand,
          as: "brand",
          attributes: ["id", "brandName", "brandSlug"],
        },
        { model: Keyword, as: "keywords" },
      ],
    });

    res.status(200).json({
      success: true,
      message: "Category updated successfully",
      category: fresh,
    });
  } catch (error) {
    await t.rollback();
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete Category
exports.deleteCategory = async (req, res) => {
  try {
    const { id } = req.params; // categoryId
    const category = await Category.findByPk(id);
    if (!category)
      return res
        .status(404)
        .json({ success: false, message: "Category not found" });
    await category.destroy(); // keywords cascade if FK is CASCADE + hooks: true
    res
      .status(200)
      .json({ success: true, message: "Category deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Replace only keywords for a category (utility endpoint)
exports.replaceCategoryKeywords = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params; // categoryId
    const { keywords = [] } = req.body;

    const category = await Category.findByPk(id, { transaction: t });
    if (!category) {
      await t.rollback();
      return res
        .status(404)
        .json({ success: false, message: "Category not found" });
    }

    const incoming = [
      ...new Set(
        (Array.isArray(keywords) ? keywords : [])
          .map(String)
          .map((k) => k.trim())
          .filter(Boolean)
      ),
    ];

    const existing = await Keyword.findAll({
      where: { categoryId: id },
      transaction: t,
    });
    const existingSet = new Set(existing.map((k) => k.keyword));
    const toAdd = incoming.filter((k) => !existingSet.has(k));
    const toRemove = existing
      .filter((k) => !incoming.includes(k.keyword))
      .map((k) => k.keyword);

    if (toRemove.length) {
      await Keyword.destroy({
        where: { categoryId: id, keyword: { [Op.in]: toRemove } },
        transaction: t,
      });
    }
    for (const k of toAdd) {
      await Keyword.create({ keyword: k, categoryId: id }, { transaction: t });
    }

    await t.commit();
    const fresh = await Category.findByPk(id, {
      include: [{ model: Keyword, as: "keywords" }],
    });
    return res
      .status(200)
      .json({ success: true, message: "Keywords updated", category: fresh });
  } catch (error) {
    await t.rollback();
    return res.status(500).json({ success: false, message: error.message });
  }
};
