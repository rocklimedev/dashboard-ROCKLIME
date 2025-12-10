const Company = require("../models/company");
const { Op } = require("sequelize");
const { sendNotification } = require("./notificationController"); // Import sendNotification

// Assume an admin user ID or system channel for notifications
const ADMIN_USER_ID = "admin-system"; // Replace with actual admin user ID or channel

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

    // Send notification to admin or system channel
    await sendNotification({
      userId: ADMIN_USER_ID,
      title: "New Company Created",
      message: `A new company "${name}" with slug "${slug}" has been created${
        parentCompanyId ? ` under parent company ID ${parentCompanyId}` : ""
      }.`,
    });

    res.status(201).json({ success: true, company: newCompany });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get all companies (including parent-child relationships) (no notification needed)
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

// Get a single company by ID (no notification needed)
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

// Get all child companies under a specific parent (no notification needed)
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

    // Send notification to admin or system channel
    await sendNotification({
      userId: ADMIN_USER_ID,
      title: "Company Updated",
      message: `Company "${name}" with slug "${slug}" has been updated.`,
    });

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

    // Send notification to admin or system channel
    await sendNotification({
      userId: ADMIN_USER_ID,
      title: "Company Deleted",
      message: `Company "${company.name}" with slug "${company.slug}" has been deleted.`,
    });

    await company.destroy();
    res.status(200).json({ success: true, message: "Company deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
