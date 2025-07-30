const slugify = require("slugify");
const Brand = require("../models/brand");
const BrandParentCategory = require("../models/brandParentCategory");
const BrandParentCategoryBrand = require("../models/brandParentCategoryBrand");
const ParentCategory = require("../models/parentCategory");

// Create a new BrandParentCategory (e.g., CP Fitting)
exports.create = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ message: "Name required" });

    const slug = slugify(name, { lower: true, strict: true });

    const bpc = await BrandParentCategory.create({ name, slug });
    return res.status(201).json({ success: true, brandParentCategory: bpc });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// Attach brands to a BrandParentCategory
exports.attachBrands = async (req, res) => {
  try {
    const { id } = req.params; // BrandParentCategoryId
    const { brandIds = [] } = req.body;

    const bpc = await BrandParentCategory.findByPk(id);
    if (!bpc)
      return res.status(404).json({ message: "BrandParentCategory not found" });

    const results = [];
    for (const brandId of brandIds) {
      const brand = await Brand.findByPk(brandId);
      if (!brand) {
        results.push({ brandId, status: "skipped", reason: "Brand not found" });
        continue;
      }
      await BrandParentCategoryBrand.findOrCreate({
        where: { brandParentCategoryId: id, brandId },
      });
      results.push({ brandId, status: "attached" });
    }

    return res.json({ message: "Brands attached", results });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// Get all BrandParentCategories with their brands
exports.list = async (req, res) => {
  try {
    const list = await BrandParentCategory.findAll({
      include: [
        { model: Brand, as: "brands", attributes: ["id", "brandName"] },
      ],
    });
    return res.json(list);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// Delete BrandParentCategory (will not delete brands)
exports.delete = async (req, res) => {
  try {
    const { id } = req.params;
    const bpc = await BrandParentCategory.findByPk(id);
    if (!bpc) return res.status(404).json({ message: "Not found" });

    await bpc.destroy();
    return res.json({ message: "Deleted successfully" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
// controller/brandParentCategory.controller.js (add these if you want)
exports.getById = async (req, res) => {
  try {
    const { id } = req.params;
    const bpc = await BrandParentCategory.findByPk(id, {
      include: [
        {
          model: Brand,
          as: "brands",
          attributes: ["id", "brandName", "brandSlug"],
        },
      ],
    });
    if (!bpc) return res.status(404).json({ message: "Not found" });
    return res.json(bpc);
  } catch (e) {
    return res.status(500).json({ message: e.message });
  }
};

exports.detachBrand = async (req, res) => {
  try {
    const { id, brandId } = req.params; // id is BrandParentCategoryId
    const deleted = await BrandParentCategoryBrand.destroy({
      where: { brandParentCategoryId: id, brandId },
    });
    if (!deleted) return res.status(404).json({ message: "Link not found" });
    return res.json({ message: "Detached", id, brandId });
  } catch (e) {
    return res.status(500).json({ message: e.message });
  }
};
