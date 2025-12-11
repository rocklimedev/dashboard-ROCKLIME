const { Category, Brand, ParentCategory } = require("../models");
// ✅ Create Parent Category
exports.createParentCategory = async (req, res) => {
  try {
    const { name, slug } = req.body;
    const parentCategory = await ParentCategory.create({ name, slug });

    res.status(201).json({ success: true, data: parentCategory });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ Get All Parent Categories
exports.getAllParentCategories = async (req, res) => {
  try {
    const categories = await ParentCategory.findAll();
    res.status(200).json({ success: true, data: categories });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ Get Parent Category by ID
exports.getParentCategoryById = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await ParentCategory.findByPk(id);

    if (!category) {
      return res
        .status(404)
        .json({ success: false, message: "Category not found" });
    }

    res.status(200).json({ success: true, data: category });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ Update Parent Category
exports.updateParentCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, slug } = req.body;

    const category = await ParentCategory.findByPk(id);
    if (!category) {
      return res
        .status(404)
        .json({ success: false, message: "Category not found" });
    }

    category.name = name || category.name;
    category.slug = slug || category.slug;

    await category.save();
    res.status(200).json({ success: true, data: category });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ Delete Parent Category
exports.deleteParentCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await ParentCategory.findByPk(id);
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

exports.getParentCategoryWithBrandsAndCounts = async (req, res) => {
  try {
    const { id } = req.params;
    const parent = await ParentCategory.findByPk(id, {
      include: [
        { model: Brand, as: "brands", through: { attributes: [] } },
        { model: Category, as: "categories" },
      ],
    });
    if (!parent)
      return res
        .status(404)
        .json({ success: false, message: "Category not found" });

    const count = parent.categories?.length || 0;
    return res.status(200).json({
      success: true,
      data: {
        id: parent.id,
        name: parent.name,
        slug: parent.slug,
        brands: parent.brands,
        categoriesCount: count,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
