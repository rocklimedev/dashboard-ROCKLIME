const Keyword = require("../models/keyword");
const Category = require("../models/category"); // Assuming your Category model exists

// ✅ Create a new keyword
exports.createKeyword = async (req, res) => {
  try {
    const { keyword, categoryId } = req.body;

    if (!keyword || !categoryId) {
      return res
        .status(400)
        .json({ error: "Keyword and categoryId are required" });
    }

    // Validate if categoryId exists
    const category = await Category.findByPk(categoryId);
    if (!category) {
      return res.status(400).json({ error: "Invalid categoryId" });
    }

    const newKeyword = await Keyword.create({ keyword, categoryId });

    return res.status(201).json({
      message: "Keyword added successfully",
      newKeyword,
    });
  } catch (error) {
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

// ✅ Get all keywords
exports.getAllKeywords = async (req, res) => {
  try {
    const keywords = await Keyword.findAll({
      include: [
        {
          model: Category,
          as: "categories",
          attributes: ["categoryId", "name"],
        },
      ],
    });
    return res.status(200).json({ keywords });
  } catch (error) {
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

// ✅ Get single keyword by ID
exports.getKeywordById = async (req, res) => {
  try {
    const { id } = req.params;
    const keyword = await Keyword.findByPk(id, {
      include: [{ model: Category, attributes: ["categoryId", "name"] }],
    });

    if (!keyword) {
      return res.status(404).json({ error: "Keyword not found" });
    }

    return res.status(200).json({ keyword });
  } catch (error) {
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

// ✅ Update keyword
exports.updateKeyword = async (req, res) => {
  try {
    const { id } = req.params;
    const { keyword, categoryId } = req.body;

    const existingKeyword = await Keyword.findByPk(id);
    if (!existingKeyword) {
      return res.status(404).json({ error: "Keyword not found" });
    }

    if (keyword) existingKeyword.keyword = keyword;

    if (categoryId) {
      const category = await Category.findByPk(categoryId);
      if (!category) {
        return res.status(400).json({ error: "Invalid categoryId" });
      }
      existingKeyword.categoryId = categoryId;
    }

    await existingKeyword.save();

    return res.status(200).json({
      message: "Keyword updated successfully",
      keyword: existingKeyword,
    });
  } catch (error) {
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

// ✅ Delete keyword
exports.deleteKeyword = async (req, res) => {
  try {
    const { id } = req.params;
    const keyword = await Keyword.findByPk(id);

    if (!keyword) {
      return res.status(404).json({ error: "Keyword not found" });
    }

    await keyword.destroy();
    return res.status(200).json({ message: "Keyword deleted successfully" });
  } catch (error) {
    return res.status(500).json({ error: "Internal Server Error" });
  }
};
