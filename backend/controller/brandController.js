const Brand = require("../models/brand")

const createBrand = async (req, res) => {
  try {
    const {  brandName, brandSlug } = req.body;
    const brand = await Brand.create({ brandName, brandSlug });
    res.status(201).json(brand);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getBrands = async (req, res) => {
  try {
    const brands = await Brand.findAll();
    res.status(200).json(brands);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

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
    const {id} = req.params;
    const { brandName, brandSlug } = req.body;
    const brand = await Brand.findByPk(id);
   
      if (!brand) {
        return res.status(404).json({ message: "Brand not found." });
      }
  
      await brand.update({ brandName, brandSlug });
  
      res.json({ message: "Brand updated successfully.", brand });
    } 
  catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deleteBrand = async (req, res) => {
  try {
    const brand = await Brand.findByPk(req.params.id);
    if (brand) {
      await brand.destroy();
      res.status(204).send();
    } else {
      res.status(404).json({ message: "Brand not found" });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { createBrand, getBrands, getBrandById, updateBrand, deleteBrand };