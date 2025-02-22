const Keyword = require("../models/keyword");

// ✅ Create a new keyword
exports.createKeyword = async (req, res) => {
  try {
    const { keyword, type } = req.body;

    if (!keyword || !type || !["Ceramics", "Sanitary"].includes(type)) {
      return res.status(400).json({ error: "Invalid keyword or type" });
    }

    const newKeyword = await Keyword.create({ keyword, type });
    return res.status(201).json({ message: "Keyword added successfully", newKeyword });
  } catch (error) {
    console.error("Error creating keyword:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

// ✅ Read all keywords
exports.getAllKeywords = async (req, res) => {
  try {
    const keywords = await Keyword.findAll();
    return res.status(200).json({ keywords });
  } catch (error) {
    console.error("Error fetching keywords:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

// ✅ Read a single keyword by ID
exports.getKeywordById = async (req, res) => {
  try {
    const { id } = req.params;
    const keyword = await Keyword.findByPk(id);

    if (!keyword) {
      return res.status(404).json({ error: "Keyword not found" });
    }

    return res.status(200).json({ keyword });
  } catch (error) {
    console.error("Error fetching keyword:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

// ✅ Update a keyword
exports.updateKeyword = async (req, res) => {
  try {
    const { id } = req.params;
    const { keyword, type } = req.body;

    const existingKeyword = await Keyword.findByPk(id);
    if (!existingKeyword) {
      return res.status(404).json({ error: "Keyword not found" });
    }

    if (keyword) existingKeyword.keyword = keyword;
    if (type && ["Ceramics", "Sanitary"].includes(type)) existingKeyword.type = type;

    await existingKeyword.save();
    return res.status(200).json({ message: "Keyword updated successfully", keyword: existingKeyword });
  } catch (error) {
    console.error("Error updating keyword:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

// ✅ Delete a keyword
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
    console.error("Error deleting keyword:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};
