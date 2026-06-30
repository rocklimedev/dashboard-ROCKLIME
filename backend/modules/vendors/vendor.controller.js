const { Vendor } = require("../models");
const logActivity = require("../utils/activityLogger");
const { ActivityLog } = require("../models");
const createVendor = async (req, res) => {
  try {
    const { vendorId, vendorName, brandSlug, brandId } = req.body;

    // Convert empty string to null
    const safeVendorId = vendorId?.trim() || null;

    const vendor = await Vendor.create({
      vendorId: safeVendorId,
      vendorName,
      brandSlug,
      brandId,
    });
    await logActivity({
      userId: req.user?.userId,
      contextTag: "PROCUREMENT",
      subContext: "VENDOR",
      action: "CREATE_VENDOR",
      entityId: vendor.vendorId,
      entityName: vendor.vendorName,
      description: `Vendor "${vendor.vendorName}" created`,

      metadata: {
        vendorId: vendor.vendorId,
        vendorName: vendor.vendorName,
        brandId: vendor.brandId || null,
        brandSlug: vendor.brandSlug || null,
        createdVia: "ADMIN_PANEL",
      },

      req,
    });
    res.status(201).json(vendor);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getVendors = async (req, res) => {
  try {
    const vendors = await Vendor.findAll();
    res.status(200).json(vendors);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getVendorById = async (req, res) => {
  try {
    const vendor = await Vendor.findByPk(req.params.id);
    if (vendor) {
      res.status(200).json(vendor);
    } else {
      res.status(404).json({ message: "Vendor not found" });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateVendor = async (req, res) => {
  try {
    const { id } = req.params;
    const { vendorId, vendorName, brandSlug, brandId } = req.body;

    const vendor = await Vendor.findByPk(id);
    if (!vendor) {
      return res.status(404).json({ message: "Vendor not found." });
    }

    await vendor.update({
      vendorId: vendorId?.trim() || null,
      vendorName,
      brandSlug,
      brandId,
    });
    await logActivity({
      userId: req.user?.userId,
      contextTag: "PROCUREMENT",
      subContext: "VENDOR",
      action: "UPDATE_VENDOR",
      entityId: vendor.id,
      entityName: vendor.vendorName,

      description: `Vendor "${vendor.vendorName}" updated`,

      oldValues: {
        vendorId: vendor._previousDataValues.vendorId,
        vendorName: vendor._previousDataValues.vendorName,
        brandSlug: vendor._previousDataValues.brandSlug,
        brandId: vendor._previousDataValues.brandId,
      },

      newValues: {
        vendorId: vendor.vendorId,
        vendorName: vendor.vendorName,
        brandSlug: vendor.brandSlug,
        brandId: vendor.brandId,
      },

      metadata: {
        changedFields: Object.keys(req.body),
        vendorId: vendor.id,
      },

      req,
    });
    res.json({ message: "Vendor updated successfully.", vendor });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deleteVendor = async (req, res) => {
  try {
    const vendor = await Vendor.findByPk(req.params.id);
    if (vendor) {
      await vendor.destroy();
      await logActivity({
        userId: req.user?.userId,
        contextTag: "PROCUREMENT",
        subContext: "VENDOR",
        action: "DELETE_VENDOR",
        entityId: vendor.id,
        entityName: vendor.vendorName,

        description: `Vendor "${vendor.vendorName}" deleted`,

        oldValues: {
          vendorId: vendor.id,
          vendorName: vendor.vendorName,
          email: vendor.email || null,
          phone: vendor.phone || null,
          status: vendor.status || null,
        },

        metadata: {
          deletionType: "HARD_DELETE",
          warning: "Vendor removed permanently from system",
        },

        req,
      });
      res.status(204).send();
    } else {
      res.status(404).json({ message: "Vendor not found" });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const checkVendorId = async (req, res) => {
  try {
    const { vendorId } = req.params;

    // Treat empty strings as null
    if (!vendorId || vendorId.trim() === "") {
      return res.status(200).json({ isUnique: true });
    }

    const vendor = await Vendor.findOne({ where: { vendorId } });
    res.status(200).json({ isUnique: !vendor });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createVendor,
  getVendors,
  getVendorById,
  updateVendor,
  deleteVendor,
  checkVendorId,
};
