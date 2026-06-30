const { sendNotification } = require("./notificationController");
const { Brand, Product } = require("../models");
const { ActivityLog } = require("../models");
const logActivity = require("../utils/activityLogger");
const ADMIN_USER_ID = "2ef0f07a-a275-4fe1-832d-fe9a5d145f60";

// Get total products of a brand
const getTotalProductOfBrand = async (req, res) => {
  try {
    const { brandId } = req.params;

    const totalProducts = await Product.count({
      where: { brandId },
    });

    res.status(200).json({ brandId, totalProducts });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Create a new brand
const createBrand = async (req, res) => {
  try {
    const { brandName, brandSlug, logo } = req.body;

    const brand = await Brand.create({
      brandName,
      brandSlug,
      logo: logo || null, // Allow null if no logo provided
    });
    // Activity Log
    logActivity({
      userId: req.user?.userId || null,

      contextTag: ActivityLog.CONTEXT_TAGS.CATALOG,
      subContext: ActivityLog.SUB_CONTEXTS.BRAND,

      action: "BRAND_CREATED",

      entityId: brand.brandId,
      entityName: brand.brandName,

      description: `Brand "${brand.brandName}" was created`,

      newValues: {
        brandId: brand.brandId,
        brandName: brand.brandName,
        brandSlug: brand.brandSlug,
        logo: brand.logo,
      },

      metadata: {
        createdBy: req.user?.userId || null,
      },

      req,
    }).catch(console.error);

    await sendNotification({
      userId: ADMIN_USER_ID,
      title: "New Brand Created",
      message: `A new brand "${brandName}" with slug "${brandSlug}" has been created.`,
    });

    res.status(201).json(brand);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get all brands
const getBrands = async (req, res) => {
  try {
    const brands = await Brand.findAll({
      order: [["brandName", "ASC"]],
    });
    res.status(200).json(brands);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get a brand by ID
const getBrandById = async (req, res) => {
  try {
    const brand = await Brand.findByPk(req.params.id);
    if (brand) {
      res.status(200).json(brand);
    } else {
      res.status(404).json({ message: "Brand not found" });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateBrand = async (req, res) => {
  try {
    const { id } = req.params;
    const { brandName, brandSlug, logo } = req.body;

    const brand = await Brand.findByPk(id);

    if (!brand) {
      return res.status(404).json({
        message: "Brand not found.",
      });
    }

    const oldValues = {
      brandName: brand.brandName,
      brandSlug: brand.brandSlug,
      logo: brand.logo,
    };

    const updateData = {};

    if (brandName !== undefined) updateData.brandName = brandName;
    if (brandSlug !== undefined) updateData.brandSlug = brandSlug;
    if (logo !== undefined) updateData.logo = logo;

    await brand.update(updateData);

    // Activity Log
    logActivity({
      userId: req.user?.userId || null,

      contextTag: ActivityLog.CONTEXT_TAGS.CATALOG,
      subContext: ActivityLog.SUB_CONTEXTS.BRAND,

      action: "BRAND_UPDATED",

      entityId: brand.brandId,
      entityName: brand.brandName,

      description: `Brand "${brand.brandName}" was updated`,

      oldValues,

      newValues: {
        brandName: brand.brandName,
        brandSlug: brand.brandSlug,
        logo: brand.logo,
      },

      metadata: {
        updatedBy: req.user?.userId || null,
      },

      req,
    }).catch(console.error);

    await sendNotification({
      userId: ADMIN_USER_ID,
      title: "Brand Updated",
      message: `The brand "${brand.brandName}" has been updated.`,
    });

    res.json({
      message: "Brand updated successfully.",
      brand,
    });
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
};
const deleteBrand = async (req, res) => {
  try {
    const brand = await Brand.findByPk(req.params.id);

    if (!brand) {
      return res.status(404).json({
        message: "Brand not found",
      });
    }

    await sendNotification({
      userId: ADMIN_USER_ID,
      title: "Brand Deleted",
      message: `The brand "${brand.brandName}" with slug "${brand.brandSlug}" has been deleted.`,
    });

    // Activity Log
    logActivity({
      userId: req.user?.userId || null,

      contextTag: ActivityLog.CONTEXT_TAGS.CATALOG,
      subContext: ActivityLog.SUB_CONTEXTS.BRAND,

      action: "BRAND_DELETED",

      entityId: brand.brandId,
      entityName: brand.brandName,

      description: `Brand "${brand.brandName}" was deleted`,

      oldValues: {
        brandId: brand.brandId,
        brandName: brand.brandName,
        brandSlug: brand.brandSlug,
        logo: brand.logo,
      },

      metadata: {
        deletedBy: req.user?.userId || null,
      },

      req,
    }).catch(console.error);

    await brand.destroy();

    res.status(204).send();
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
};
module.exports = {
  createBrand,
  getBrands,
  getBrandById,
  updateBrand,
  deleteBrand,
  getTotalProductOfBrand,
};
