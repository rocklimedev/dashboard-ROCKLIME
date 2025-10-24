const slugify = require("slugify");
const Brand = require("../models/brand");
const BrandParentCategory = require("../models/brandParentCategory");
const BrandParentCategoryBrand = require("../models/brandParentCategoryBrand");
const ParentCategory = require("../models/parentCategory");
const { sendNotification } = require("./notificationController"); // Import sendNotification

// Assume an admin user ID or system channel for notifications
const ADMIN_USER_ID = "2ef0f07a-a275-4fe1-832d-fe9a5d145f60"; // Replace with actual admin user ID or channel

// Create a new BrandParentCategory (e.g., CP Fitting)
exports.create = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ message: "Name required" });

    const slug = slugify(name, { lower: true, strict: true });

    const bpc = await BrandParentCategory.create({ name, slug });

    // Send notification to admin or system channel
    await sendNotification({
      userId: ADMIN_USER_ID,
      title: "New BrandParentCategory Created",
      message: `A new BrandParentCategory "${name}" with slug "${slug}" has been created.`,
    });

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

    // Send notification if any brands were attached
    if (attachedBrandNames.length > 0) {
      await sendNotification({
        userId: ADMIN_USER_ID,
        title: "Brands Attached to BrandParentCategory",
        message: `Brands [${attachedBrandNames.join(
          ", "
        )}] have been attached to BrandParentCategory "${bpc.name}".`,
      });
    }

    return res.json({ message: "Brands attached", results });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// Get all BrandParentCategories with their brands (no notification needed)
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

    // Send notification to admin or system channel
    await sendNotification({
      userId: ADMIN_USER_ID,
      title: "BrandParentCategory Deleted",
      message: `BrandParentCategory "${bpc.name}" with slug "${bpc.slug}" has been deleted.`,
    });

    await bpc.destroy();
    return res.json({ message: "Deleted successfully" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// Get BrandParentCategory by ID (no notification needed)
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

// Detach a brand from a BrandParentCategory
exports.detachBrand = async (req, res) => {
  try {
    const { id, brandId } = req.params; // id is BrandParentCategoryId
    const bpc = await BrandParentCategory.findByPk(id);
    const brand = await Brand.findByPk(brandId);

    if (!bpc)
      return res.status(404).json({ message: "BrandParentCategory not found" });
    if (!brand) return res.status(404).json({ message: "Brand not found" });

    const deleted = await BrandParentCategoryBrand.destroy({
      where: { brandParentCategoryId: id, brandId },
    });
    if (!deleted) return res.status(404).json({ message: "Link not found" });

    // Send notification to admin or system channel
    await sendNotification({
      userId: ADMIN_USER_ID,
      title: "Brand Detached from BrandParentCategory",
      message: `Brand "${brand.brandName}" has been detached from BrandParentCategory "${bpc.name}".`,
    });

    return res.json({ message: "Detached", id, brandId });
  } catch (e) {
    return res.status(500).json({ message: e.message });
  }
};
