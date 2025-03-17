const Company = require("../models/company");
const { Op } = require("sequelize");

// Create a new company
exports.createCompany = async (req, res) => {
  try {
    const { name, address, website, createdDate, slug, parentCompanyId } =
      req.body;

    const newCompany = await Company.create({
      name,
      address,
      website,
      createdDate,
      slug,
      parentCompanyId: parentCompanyId || null, // NULL if it's the main company
    });

    res.status(201).json({ success: true, company: newCompany });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get all companies (including parent-child relationships)
exports.getAllCompanies = async (req, res) => {
  try {
    const companies = await Company.findAll({
      include: [
        {
          model: Company,
          as: "ChildCompanies",
        },
      ],
    });

    res.status(200).json({ success: true, companies });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get a single company by ID
exports.getCompanyById = async (req, res) => {
  try {
    const company = await Company.findByPk(req.params.id, {
      include: [{ model: Company, as: "ChildCompanies" }],
    });

    if (!company) {
      return res
        .status(404)
        .json({ success: false, message: "Company not found" });
    }

    res.status(200).json({ success: true, company });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get all child companies under a specific parent
exports.getChildCompanies = async (req, res) => {
  try {
    const { parentId } = req.params;

    const childCompanies = await Company.findAll({
      where: { parentCompanyId: parentId },
    });

    res.status(200).json({ success: true, childCompanies });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Update company details
exports.updateCompany = async (req, res) => {
  try {
    const { name, address, website, createdDate, slug } = req.body;
    const { id } = req.params;

    const company = await Company.findByPk(id);
    if (!company) {
      return res
        .status(404)
        .json({ success: false, message: "Company not found" });
    }

    await company.update({ name, address, website, createdDate, slug });

    res
      .status(200)
      .json({ success: true, message: "Company updated", company });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Delete a company
exports.deleteCompany = async (req, res) => {
  try {
    const { id } = req.params;

    const company = await Company.findByPk(id);
    if (!company) {
      return res
        .status(404)
        .json({ success: false, message: "Company not found" });
    }

    await company.destroy();
    res.status(200).json({ success: true, message: "Company deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
