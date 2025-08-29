const ProductMeta = require("../models/productMeta");
// Create a new ProductMeta
exports.createProductMeta = async (req, res) => {
  try {
    const { title, fieldType, unit, slug } = req.body;

    // Validate required fields
    if (!title || !fieldType) {
      return res
        .status(400)
        .json({ message: "Title and fieldType are required" });
    }

    // Validate fieldType
    const validFieldTypes = [
      "string",
      "number",
      "mm",
      "inch",
      "pcs",
      "box",
      "feet",
    ];
    if (!validFieldTypes.includes(fieldType)) {
      return res.status(400).json({
        message: `fieldType must be one of: ${validFieldTypes.join(", ")}`,
      });
    }

    // Validate slug uniqueness if provided
    if (slug) {
      const existingMeta = await ProductMeta.findOne({ where: { slug } });
      if (existingMeta) {
        return res.status(400).json({ message: "Slug must be unique" });
      }
    }

    const productMeta = await ProductMeta.create({
      title,
      fieldType,
      unit,
      slug,
    });
    return res
      .status(201)
      .json({ message: "ProductMeta created successfully", productMeta });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error creating ProductMeta", error: error.message });
  }
};

// Get all ProductMeta records
exports.getAllProductMeta = async (req, res) => {
  try {
    const productMetas = await ProductMeta.findAll({
      attributes: ["id", "title", "slug", "fieldType", "unit", "createdAt"],
    });
    return res.status(200).json(productMetas);
  } catch (error) {
    return res.status(500).json({
      message: "Error fetching ProductMeta records",
      error: error.message,
    });
  }
};

// Get a single ProductMeta by ID
exports.getProductMetaById = async (req, res) => {
  try {
    const productMeta = await ProductMeta.findByPk(req.params.id, {
      attributes: ["id", "title", "slug", "fieldType", "unit", "createdAt"],
    });
    if (!productMeta) {
      return res.status(404).json({ message: "ProductMeta not found" });
    }
    return res.status(200).json(productMeta);
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error fetching ProductMeta", error: error.message });
  }
};

// Update a ProductMeta
exports.updateProductMeta = async (req, res) => {
  try {
    const { title, fieldType, unit, slug } = req.body;
    const productMeta = await ProductMeta.findByPk(req.params.id);
    if (!productMeta) {
      return res.status(404).json({ message: "ProductMeta not found" });
    }

    // Validate fieldType if provided
    if (fieldType) {
      const validFieldTypes = [
        "string",
        "number",
        "mm",
        "inch",
        "pcs",
        "box",
        "feet",
      ];
      if (!validFieldTypes.includes(fieldType)) {
        return res.status(400).json({
          message: `fieldType must be one of: ${validFieldTypes.join(", ")}`,
        });
      }
    }

    // Validate slug uniqueness if provided and changed
    if (slug && slug !== productMeta.slug) {
      const existingMeta = await ProductMeta.findOne({ where: { slug } });
      if (existingMeta) {
        return res.status(400).json({ message: "Slug must be unique" });
      }
    }

    await productMeta.update({ title, fieldType, unit, slug });
    return res
      .status(200)
      .json({ message: "ProductMeta updated successfully", productMeta });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error updating ProductMeta", error: error.message });
  }
};

// Delete a ProductMeta
exports.deleteProductMeta = async (req, res) => {
  try {
    const productMeta = await ProductMeta.findByPk(req.params.id);
    if (!productMeta) {
      return res.status(404).json({ message: "ProductMeta not found" });
    }

    // Check if any products reference this ProductMeta in their meta field
    const productsUsingMeta = await Product.findAll({
      where: {
        meta: {
          [Op.contains]: { [productMeta.id]: { [Op.ne]: null } },
        },
      },
    });

    if (productsUsingMeta.length > 0) {
      return res.status(400).json({
        message:
          "Cannot delete ProductMeta; it is referenced by one or more products",
        productIds: productsUsingMeta.map((p) => p.productId),
      });
    }

    await productMeta.destroy();
    return res
      .status(200)
      .json({ message: "ProductMeta deleted successfully" });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error deleting ProductMeta", error: error.message });
  }
};

// Get ProductMeta by title
exports.getProductMetaByTitle = async (req, res) => {
  try {
    const { title } = req.query;
    if (!title) {
      return res
        .status(400)
        .json({ message: "Title query parameter is required" });
    }

    const productMetas = await ProductMeta.findAll({
      where: {
        title: { [Op.iLike]: `%${title}%` },
      },
      attributes: ["id", "title", "slug", "fieldType", "unit", "createdAt"],
    });

    if (productMetas.length === 0) {
      return res
        .status(404)
        .json({ message: "No ProductMeta found with the given title" });
    }

    return res.status(200).json(productMetas);
  } catch (error) {
    return res.status(500).json({
      message: "Error searching ProductMeta by title",
      error: error.message,
    });
  }
};

// Get ProductMeta by slug
exports.getProductMetaBySlug = async (req, res) => {
  try {
    const { slug } = req.query;
    if (!slug) {
      return res
        .status(400)
        .json({ message: "Slug query parameter is required" });
    }

    const productMetas = await ProductMeta.findAll({
      where: {
        slug: { [Op.iLike]: `%${slug}%` },
      },
      attributes: ["id", "title", "slug", "fieldType", "unit", "createdAt"],
    });

    if (productMetas.length === 0) {
      return res
        .status(404)
        .json({ message: "No ProductMeta found with the given slug" });
    }

    return res.status(200).json(productMetas);
  } catch (error) {
    return res.status(500).json({
      message: "Error searching ProductMeta by slug",
      error: error.message,
    });
  }
};
