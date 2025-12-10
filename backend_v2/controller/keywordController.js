// Create a new keyword
const { Category, Keyword } = require("../models");
const { Op } = require("sequelize");
const sequelize = require("../config/database"); // <-- ADD THIS
exports.createKeyword = async (req, res) => {
  try {
    const { keyword, categoryId } = req.body;

    const trimmed = keyword?.trim();
    if (!trimmed || !categoryId) {
      return res
        .status(400)
        .json({ message: "Keyword and categoryId required" });
    }

    // MySQL case-insensitive search (works on MySQL, MariaDB, SQLite, etc.)
    let existing = await Keyword.findOne({
      where: {
        categoryId,
        [Op.and]: sequelize.where(
          sequelize.fn("LOWER", sequelize.col("keyword")),
          sequelize.fn("LOWER", trimmed)
        ),
      },
    });

    if (existing) {
      const withCat = await Keyword.findByPk(existing.id, {
        include: [
          {
            model: Category,
            as: "category",
            attributes: ["categoryId", "name", "slug"],
          },
        ],
      });
      return res.status(200).json(withCat); // return existing
    }

    // Create new
    const newKeyword = await Keyword.create({
      keyword: trimmed,
      categoryId,
    });

    const keywordWithCategory = await Keyword.findByPk(newKeyword.id, {
      include: [
        {
          model: Category,
          as: "category",
          attributes: ["categoryId", "name", "slug"],
        },
      ],
    });

    return res.status(201).json(keywordWithCategory);
  } catch (error) {
    console.error("createKeyword error:", error);
    return res.status(500).json({ message: "Failed to create keyword" });
  }
};
// Get all keywords (with category)
exports.getAllKeywords = async (req, res) => {
  try {
    const keywords = await Keyword.findAll({
      include: [
        {
          model: Category,
          as: "category",
          attributes: ["categoryId", "name", "slug"],
        },
      ],
      order: [["keyword", "ASC"]],
    });
    return res.status(200).json({ keywords });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

// Get keywords by category
exports.getKeywordsByCategoryId = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const keywords = await Keyword.findAll({
      where: { categoryId },
      order: [["keyword", "ASC"]],
    });
    return res.status(200).json({ categoryId, keywords });
  } catch (error) {
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

// Get single keyword by ID
exports.getKeywordById = async (req, res) => {
  try {
    const { id } = req.params;
    const keyword = await Keyword.findByPk(id, {
      include: [
        {
          model: Category,
          as: "category",
          attributes: ["categoryId", "name", "slug"],
        },
      ],
    });
    if (!keyword) return res.status(404).json({ error: "Keyword not found" });
    return res.status(200).json({ keyword });
  } catch (error) {
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

// Update keyword
exports.updateKeyword = async (req, res) => {
  try {
    const { id } = req.params;
    const { keyword, categoryId } = req.body;

    const existingKeyword = await Keyword.findByPk(id);
    if (!existingKeyword)
      return res.status(404).json({ error: "Keyword not found" });

    if (keyword) existingKeyword.keyword = String(keyword).trim();
    if (categoryId) {
      const category = await Category.findByPk(categoryId);
      if (!category)
        return res.status(400).json({ error: "Invalid categoryId" });
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

// Delete keyword
exports.deleteKeyword = async (req, res) => {
  try {
    const { id } = req.params;
    const keyword = await Keyword.findByPk(id);
    if (!keyword) return res.status(404).json({ error: "Keyword not found" });
    await keyword.destroy();
    return res.status(200).json({ message: "Keyword deleted successfully" });
  } catch (error) {
    return res.status(500).json({ error: "Internal Server Error" });
  }
};
