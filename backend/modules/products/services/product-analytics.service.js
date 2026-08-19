const {
  Op,
  Product,
  Keyword,
  Category,
  Quotation,
  Order,
  parseJsonSafely,
} = require("./product.helpers");

exports.getTopSellingProducts = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    const salesMap = new Map(); // productId → total sold quantity

    const processItemsArray = (items) => {
      if (!Array.isArray(items)) return;

      items.forEach((item) => {
        const id = item.productId;
        const qty = Number(item.quantity) || 0;
        if (id && qty > 0) {
          salesMap.set(id, (salesMap.get(id) || 0) + qty);
        }
      });
    };

    // Step 1: Fetch all Quotations (using the correct 'products' column)
    const quotations = await Quotation.findAll({
      attributes: ["quotationId", "products"],
      raw: true,
    });

    // Process quotations
    quotations.forEach((q) => {
      if (q.products) {
        let items;
        try {
          items =
            typeof q.products === "string"
              ? JSON.parse(q.products)
              : q.products;
        } catch (e) {
          return;
        }
        processItemsArray(items);
      }
    });

    // Step 2: Fetch all Orders
    const orders = await Order.findAll({
      attributes: ["id", "products", "quotationId"],
      raw: true,
    });

    // Build map: quotationId → products array (for fallback)
    const quotationProductsMap = new Map();
    quotations.forEach((q) => {
      if (q.products) {
        try {
          const items =
            typeof q.products === "string"
              ? JSON.parse(q.products)
              : q.products;
          if (Array.isArray(items)) {
            quotationProductsMap.set(q.quotationId, items);
          }
        } catch (e) {
          // skip malformed
        }
      }
    });

    // Process orders
    orders.forEach((order) => {
      let itemsToUse = null;

      // Priority 1: Use order's own products if present
      if (order.products && order.products !== null) {
        try {
          const parsed =
            typeof order.products === "string"
              ? JSON.parse(order.products)
              : order.products;
          if (Array.isArray(parsed) && parsed.length > 0) {
            itemsToUse = parsed;
          }
        } catch (e) {}
      }

      // Priority 2: Fallback to linked quotation's products
      if (
        !itemsToUse &&
        order.quotationId &&
        quotationProductsMap.has(order.quotationId)
      ) {
        itemsToUse = quotationProductsMap.get(order.quotationId);
      }

      if (itemsToUse) {
        processItemsArray(itemsToUse);
      }
    });

    // Convert to sorted array: highest sold first
    const salesArray = Array.from(salesMap, ([productId, totalSold]) => ({
      productId,
      totalSold, // ← Clear, meaningful name
    })).sort((a, b) => b.totalSold - a.totalSold);

    if (salesArray.length === 0) {
      return res.status(200).json({ data: [], total: 0 });
    }

    // Get top 50 candidates to enrich
    const topProductIds = salesArray.slice(0, 50).map((s) => s.productId);

    // Fetch full product details with associations
    const products = await Product.findAll({
      where: {
        productId: { [Op.in]: topProductIds },
      },
      order: [["name", "ASC"]],
      include: [
        {
          model: Keyword,
          as: "keywords",
          attributes: ["id", "keyword"],
          through: { attributes: [] },
          include: [
            {
              model: Category,
              as: "category",
              attributes: ["categoryId", "name", "slug"],
            },
          ],
        },
      ],
    });

    // Enrich with metaDetails, images, keywords, and totalSold
    const enrichedProducts = products.map((product) => {
      const raw = product.toJSON();

      const metaObj = raw.meta
        ? typeof raw.meta === "string"
          ? JSON.parse(raw.meta)
          : raw.meta
        : {};
      const images = raw.images
        ? typeof raw.images === "string"
          ? JSON.parse(raw.images)
          : raw.images
        : [];

      const metaDetails = Object.entries(metaObj).map(([id, value]) => ({
        id,
        title: "Unknown Field",
        slug: id,
        value: value != null ? String(value) : "",
        fieldType: "text",
        unit: null,
      }));

      const keywords = (raw.keywords || []).map((k) => ({
        id: k.id,
        keyword: k.keyword,
        categories: k.categories
          ? {
              categoryId: k.categories.categoryId,
              name: k.categories.name,
              slug: k.categories.slug,
            }
          : null,
      }));

      const totalSold =
        salesArray.find((s) => s.productId === raw.productId)?.totalSold || 0;

      return {
        ...raw,
        images,
        meta: metaObj,
        metaDetails,
        keywords,
        totalSold, // ← This is the new clear field
      };
    });

    // Final sort by totalSold and apply limit
    const finalTopProducts = enrichedProducts
      .sort((a, b) => b.totalSold - a.totalSold)
      .slice(0, limit);

    res.status(200).json({
      data: finalTopProducts,
      total: finalTopProducts.length,
    });
  } catch (err) {
    res.status(500).json({
      message: "Failed to fetch top selling products",
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
};
