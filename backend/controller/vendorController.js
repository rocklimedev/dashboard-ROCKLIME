
const Vendor = require("../models/vendor")

const createVendor = async (req, res) => {
  try {
    const { vendorId, vendorName, brandId } = req.body;
    const vendor = await Vendor.create({ vendorId, vendorName, brandId });
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
    const { vendorName, brandId } = req.body;
    const vendor = await Vendor.findByPk(req.params.id);
    if (vendor) {
      vendor.vendorName = vendorName;
      vendor.brandId = brandId;
      await vendor.save();
      res.status(200).json(vendor);
    } else {
      res.status(404).json({ message: "Vendor not found" });
    }
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

module.exports = {createVendor, getVendors, getVendorById, updateVendor, deleteVendor,}