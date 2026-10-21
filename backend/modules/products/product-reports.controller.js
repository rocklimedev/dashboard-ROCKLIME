const {
  Op,
  sequelize,
  Product,
  ProductMeta,
  Keyword,
  Category,
  Quotation,
  Order,
  ensureAssociations,
  parseJsonSafely,
} = require('./product-controller.shared');

// GET /api/products/count
exports.getProductCount = async (req, res) => {
  try {
    const count = await Product.count();

    res.json({
      success: true,
      totalProducts: count,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch product count',
    });
  }
};

// GET /api/products/low-stock
exports.getLowStockProducts = async (req, res) => {
  try {
    ensureAssociations();

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    // An explicit ?threshold= wins; otherwise each product's own alert
    // quantity is used, or 10 when none is set (same rule as the dashboard).
    const explicit = req.query.threshold !== undefined && req.query.threshold !== '';
    const threshold = explicit ? parseInt(req.query.threshold, 10) || 0 : null;
    const lowStockWhere = explicit
      ? { quantity: { [Op.lte]: threshold } }
      : sequelize.literal('quantity <= COALESCE(NULLIF(alert_quantity, 0), 10)');

    // ================= FETCH LOW STOCK =================
    const { count: totalLowStock, rows: products } = await Product.findAndCountAll({
      where: lowStockWhere,
      attributes: [
        'productId',
        'name',
        'quantity',
        'alert_quantity',
        'product_code',
        'images',
        'status',
        'meta',
        'updatedAt',
      ],
      order: [['quantity', 'ASC']],
      limit,
      offset,
      distinct: true,
      subQuery: false,
    });

    if (totalLowStock === 0) {
      return res.json({
        success: true,
        totalLowStock: 0,
        threshold,
        products: [],
        pagination: {
          total: 0,
          page,
          limit,
          totalPages: 0,
        },
      });
    }

    // ================= META ENRICHMENT =================
    const metaIds = new Set();

    products.forEach((p) => {
      const meta = parseJsonSafely(p.meta, {});
      Object.keys(meta || {}).forEach((key) => metaIds.add(key));
    });

    const metaDefs =
      metaIds.size > 0
        ? await ProductMeta.findAll({
            where: { id: { [Op.in]: Array.from(metaIds) } },
            attributes: ['id', 'title', 'slug', 'fieldType', 'unit'],
          })
        : [];

    const metaMap = Object.fromEntries(metaDefs.map((m) => [m.id, m.toJSON()]));

    // ================= ENRICH PRODUCTS =================
    const enriched = products.map((p) => {
      const raw = p.toJSON ? p.toJSON() : p;

      const metaObj = parseJsonSafely(raw.meta, {});
      const images = parseJsonSafely(raw.images, []);

      const metaDetails = Object.entries(metaObj).map(([id, value]) => {
        const def = metaMap[id] || {};

        return {
          id,
          title: def.title || 'Unknown Field',
          slug: def.slug || null,
          value: value != null ? String(value) : '',
          fieldType: def.fieldType || 'text',
          unit: def.unit || null,
        };
      });

      return {
        productId: raw.productId,
        name: raw.name,
        quantity: Number(raw.quantity) || 0,
        alert_quantity: Number(raw.alert_quantity || threshold),
        product_code: raw.product_code,
        status: raw.status,

        images,
        meta: metaObj,
        metaDetails,

        stockStatus:
          raw.quantity === 0 ? 'OUT_OF_STOCK' : raw.quantity <= threshold ? 'LOW_STOCK' : 'OK',

        updatedAt: raw.updatedAt,
      };
    });

    return res.json({
      success: true,
      totalLowStock,
      threshold,
      products: enriched,
      pagination: {
        total: totalLowStock,
        page,
        limit,
        totalPages: Math.ceil(totalLowStock / limit),
      },
    });
  } catch (error) {
    console.error('Low Stock Error:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to fetch low stock products',
    });
  }
};

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
      attributes: ['quotationId', 'products'],
      raw: true,
    });

    // Process quotations
    quotations.forEach((q) => {
      if (q.products) {
        let items;
        try {
          items = typeof q.products === 'string' ? JSON.parse(q.products) : q.products;
        } catch (e) {
          return;
        }
        processItemsArray(items);
      }
    });

    // Step 2: Fetch all Orders
    const orders = await Order.findAll({
      attributes: ['id', 'products', 'quotationId'],
      raw: true,
    });

    // Build map: quotationId → products array (for fallback)
    const quotationProductsMap = new Map();
    quotations.forEach((q) => {
      if (q.products) {
        try {
          const items = typeof q.products === 'string' ? JSON.parse(q.products) : q.products;
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
            typeof order.products === 'string' ? JSON.parse(order.products) : order.products;
          if (Array.isArray(parsed) && parsed.length > 0) {
            itemsToUse = parsed;
          }
        } catch (e) {}
      }

      // Priority 2: Fallback to linked quotation's products
      if (!itemsToUse && order.quotationId && quotationProductsMap.has(order.quotationId)) {
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
      order: [['name', 'ASC']],
      include: [
        {
          model: Keyword,
          as: 'keywords',
          attributes: ['id', 'keyword'],
          through: { attributes: [] },
          include: [
            {
              model: Category,
              as: 'category',
              attributes: ['categoryId', 'name', 'slug'],
            },
          ],
        },
      ],
    });

    // Enrich with metaDetails, images, keywords, and totalSold
    const enrichedProducts = products.map((product) => {
      const raw = product.toJSON();

      const metaObj = raw.meta
        ? typeof raw.meta === 'string'
          ? JSON.parse(raw.meta)
          : raw.meta
        : {};
      const images = raw.images
        ? typeof raw.images === 'string'
          ? JSON.parse(raw.images)
          : raw.images
        : [];

      const metaDetails = Object.entries(metaObj).map(([id, value]) => ({
        id,
        title: 'Unknown Field',
        slug: id,
        value: value != null ? String(value) : '',
        fieldType: 'text',
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

      const totalSold = salesArray.find((s) => s.productId === raw.productId)?.totalSold || 0;

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
      message: 'Failed to fetch top selling products',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
  }
};
