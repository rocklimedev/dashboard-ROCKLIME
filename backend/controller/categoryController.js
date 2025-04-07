const Category = require("../models/category");
const ParentCategory = require("../models/parentCategory");
const slugify = require("slugify");
const { v4: uuidv4 } = require("uuid");

// Create Category
exports.createCategory = async (req, res) => {
  try {
    const { name, parentCategory, parentCategoryId } = req.body;
    const slug = slugify(name, { lower: true });

    // Optional: validate parentCategoryId
    if (parentCategory && parentCategoryId) {
      const parent = await ParentCategory.findByPk(parentCategoryId);
      if (!parent) {
        return res.status(400).json({
          success: false,
          message: "Parent category not found",
        });
      }
    }

    const category = await Category.create({
      categoryId: uuidv4(),
      name,
      parentCategory,
      parentCategoryId: parentCategory ? parentCategoryId : null,
    });

    res.status(201).json({ success: true, category });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get All Categories
exports.getAllCategories = async (req, res) => {
  try {
    const categories = await Category.findAll({
      include: {
        model: ParentCategory,
        as: "parentcategories",
        attributes: ["id", "name", "slug"],
      },
    });

    res.status(200).json({ success: true, categories });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get Category by ID
exports.getCategoryById = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await Category.findByPk(id);
    if (!category) {
      return res
        .status(404)
        .json({ success: false, message: "Category not found" });
    }
    res.status(200).json({ success: true, category });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update Category
exports.updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, parentCategory, parentCategoryId } = req.body;

    const category = await Category.findByPk(id);
    if (!category) {
      return res
        .status(404)
        .json({ success: false, message: "Category not found" });
    }

    // Validate parentCategoryId if needed
    if (parentCategory && parentCategoryId) {
      const parent = await ParentCategory.findByPk(parentCategoryId);
      if (!parent) {
        return res.status(400).json({
          success: false,
          message: "Parent category not found",
        });
      }
    }

    const slug = name ? slugify(name, { lower: true }) : category.slug;

    await category.update({
      name,
      parentCategory,
      parentCategoryId: parentCategory ? parentCategoryId : null,
    });

    res.status(200).json({
      success: true,
      message: "Category updated successfully",
      category,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete Category
exports.deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await Category.findByPk(id);
    if (!category) {
      return res
        .status(404)
        .json({ success: false, message: "Category not found" });
    }

    await category.destroy();
    res
      .status(200)
      .json({ success: true, message: "Category deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
