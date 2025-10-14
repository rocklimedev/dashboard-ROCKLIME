const Vendor = require("../models/vendor");

const createVendor = async (req, res) => {
  try {
    const { vendorId, vendorName, brandSlug, brandId } = req.body;
    const vendor = await Vendor.create({
      vendorId,
      vendorName,
      brandSlug,
      brandId,
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
    await vendor.update({ vendorId, vendorName, brandSlug, brandId });
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
