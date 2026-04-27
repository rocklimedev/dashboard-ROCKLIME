const { sendNotification } = require("./notificationController");
const { Brand, Product } = require("../models");

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

// Update a brand
const updateBrand = async (req, res) => {
  try {
    const { id } = req.params;
    const { brandName, brandSlug, logo } = req.body;

    const brand = await Brand.findByPk(id);

    if (!brand) {
      return res.status(404).json({ message: "Brand not found." });
    }

    const updateData = {};
    if (brandName !== undefined) updateData.brandName = brandName;
    if (brandSlug !== undefined) updateData.brandSlug = brandSlug;
    if (logo !== undefined) updateData.logo = logo;

    await brand.update(updateData);

    await sendNotification({
      userId: ADMIN_USER_ID,
      title: "Brand Updated",
      message: `The brand "${brand.brandName || brandName}" has been updated.`,
    });

    res.json({
      message: "Brand updated successfully.",
      brand: brand,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete a brand
const deleteBrand = async (req, res) => {
  try {
    const brand = await Brand.findByPk(req.params.id);
    if (brand) {
      await sendNotification({
        userId: ADMIN_USER_ID,
        title: "Brand Deleted",
        message: `The brand "${brand.brandName}" with slug "${brand.brandSlug}" has been deleted.`,
      });

      await brand.destroy();
      res.status(204).send();
    } else {
      res.status(404).json({ message: "Brand not found" });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
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
