const slugify = require("slugify");
const { sendNotification } = require("./notificationController");

const { BrandParentCategory, Brand, ParentCategory } = require("../models");

const ADMIN_USER_ID = "2ef0f07a-a275-4fe1-832d-fe9a5d145f60";

// Create a new BrandParentCategory
exports.create = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ message: "Name is required" });

    const slug = slugify(name, { lower: true, strict: true });

    const bpc = await BrandParentCategory.create({ name, slug });

    await sendNotification({
      userId: ADMIN_USER_ID,
      title: "New BrandParentCategory Created",
      message: `A new BrandParentCategory "${name}" with slug "${slug}" has been created.`,
    });

    return res.status(201).json({
      success: true,
      message: "BrandParentCategory created successfully",
      brandParentCategory: bpc,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// Update BrandParentCategory
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, slug } = req.body;

    const bpc = await BrandParentCategory.findByPk(id);
    if (!bpc) {
      return res.status(404).json({ message: "BrandParentCategory not found" });
    }

    // Auto-generate slug from name if name is provided and slug is not
    let finalSlug = slug;
    if (name && !slug) {
      finalSlug = slugify(name, { lower: true, strict: true });
    }

    const updateData = {};
    if (name) updateData.name = name;
    if (finalSlug) updateData.slug = finalSlug;

    await bpc.update(updateData);

    await sendNotification({
      userId: ADMIN_USER_ID,
      title: "BrandParentCategory Updated",
      message: `BrandParentCategory "${bpc.name}" has been updated successfully.`,
    });

    return res.json({
      success: true,
      message: "BrandParentCategory updated successfully",
      brandParentCategory: bpc,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// Attach brands to a BrandParentCategory
exports.attachBrands = async (req, res) => {
  try {
    const { id } = req.params;
    const { brandIds = [] } = req.body;

    const bpc = await BrandParentCategory.findByPk(id);
    if (!bpc)
      return res.status(404).json({ message: "BrandParentCategory not found" });

    const results = [];
    const attachedBrandNames = [];

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
      attachedBrandNames.push(brand.brandName);
    }

    if (attachedBrandNames.length > 0) {
      await sendNotification({
        userId: ADMIN_USER_ID,
        title: "Brands Attached to BrandParentCategory",
        message: `Brands [${attachedBrandNames.join(", ")}] have been attached to BrandParentCategory "${bpc.name}".`,
      });
    }

    return res.json({
      success: true,
      message: "Brands attached successfully",
      results,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// Get all BrandParentCategories with their attached brands
exports.list = async (req, res) => {
  try {
    const list = await BrandParentCategory.findAll({
      include: [
        {
          model: Brand,
          as: "brands",
          attributes: ["id", "brandName", "brandSlug"],
        },
      ],
      order: [["name", "ASC"]],
    });

    return res.json(list);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// Delete BrandParentCategory
exports.delete = async (req, res) => {
  try {
    const { id } = req.params;
    const bpc = await BrandParentCategory.findByPk(id);

    if (!bpc)
      return res.status(404).json({ message: "BrandParentCategory not found" });

    await sendNotification({
      userId: ADMIN_USER_ID,
      title: "BrandParentCategory Deleted",
      message: `BrandParentCategory "${bpc.name}" with slug "${bpc.slug}" has been deleted.`,
    });

    await bpc.destroy();

    return res.json({
      success: true,
      message: "BrandParentCategory deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// Get BrandParentCategory by ID
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

    if (!bpc)
      return res.status(404).json({ message: "BrandParentCategory not found" });

    return res.json(bpc);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// Detach a brand from a BrandParentCategory
exports.detachBrand = async (req, res) => {
  try {
    const { id, brandId } = req.params;

    const bpc = await BrandParentCategory.findByPk(id);
    const brand = await Brand.findByPk(brandId);

    if (!bpc)
      return res.status(404).json({ message: "BrandParentCategory not found" });
    if (!brand) return res.status(404).json({ message: "Brand not found" });

    const deleted = await BrandParentCategoryBrand.destroy({
      where: { brandParentCategoryId: id, brandId },
    });

    if (!deleted) return res.status(404).json({ message: "Link not found" });

    await sendNotification({
      userId: ADMIN_USER_ID,
      title: "Brand Detached from BrandParentCategory",
      message: `Brand "${brand.brandName}" has been detached from BrandParentCategory "${bpc.name}".`,
    });

    return res.json({
      success: true,
      message: "Brand detached successfully",
      id,
      brandId,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// Get BrandParentCategory Tree (BPC → Brands + ParentCategories)
exports.getBpcTree = async (req, res) => {
  try {
    const { id } = req.params;

    const bpc = await BrandParentCategory.findByPk(id, {
      include: [
        {
          model: Brand,
          as: "brands",
          attributes: ["id", "brandName", "brandSlug"],
          through: { attributes: [] },
        },
        {
          model: ParentCategory,
          as: "parentCategories",
          attributes: ["id", "name", "slug"],
        },
      ],
      order: [
        [{ model: Brand, as: "brands" }, "brandName", "ASC"],
        [{ model: ParentCategory, as: "parentCategories" }, "name", "ASC"],
      ],
    });

    if (!bpc) {
      return res.status(404).json({ message: "BrandParentCategory not found" });
    }

    const tree = {
      id: bpc.id,
      name: bpc.name,
      slug: bpc.slug,
      brands: bpc.brands || [],
      parentCategories: bpc.parentCategories || [],
    };

    return res.json({
      success: true,
      brandParentCategory: tree,
    });
  } catch (error) {
    console.error("Error in getBpcTree:", error);
    return res.status(500).json({ message: error.message });
  }
};

// Export all functions
module.exports = {
  create: exports.create,
  update: exports.update,
  attachBrands: exports.attachBrands,
  list: exports.list,
  delete: exports.delete,
  getById: exports.getById,
  detachBrand: exports.detachBrand,
  getBpcTree: exports.getBpcTree,
};
