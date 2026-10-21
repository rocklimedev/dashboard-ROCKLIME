const {
  Op,
  sequelize,
  Product,
  ProductMeta,
  COMPANY_CODE_META_ID,
} = require('./product-controller.shared');

// ─────────────────────────────────────────────────────────────────────────────
// Get all products - OPTIMIZED FOR INVENTORY
// ─────────────────────────────────────────────────────────────────────────────
exports.getCompanyCodes = async (req, res) => {
  try {
    const code = sequelize.fn(
      'TRIM',
      sequelize.fn(
        'JSON_UNQUOTE',
        sequelize.fn(
          'JSON_EXTRACT',
          sequelize.col('Product.meta'),
          sequelize.literal(`'$."${COMPANY_CODE_META_ID}"'`),
        ),
      ),
    );
    const rows = await Product.findAll({
      attributes: [[code, 'companyCode']],
      where: {
        [Op.and]: [
          sequelize.where(code, { [Op.ne]: '' }),
          sequelize.where(code, { [Op.ne]: 'null' }),
        ],
      },
      group: [code],
      having: sequelize.where(sequelize.fn('COUNT', sequelize.col('Product.productId')), {
        [Op.gt]: 1,
      }),
      order: [[code, 'ASC']],
      raw: true,
    });
    return res.json(rows.map((row) => row.companyCode));
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch company codes' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Get all product codes
// ─────────────────────────────────────────────────────────────────────────────
exports.getAllProductCodes = async (req, res) => {
  try {
    const products = await Product.findAll({
      attributes: ['productId', 'product_code', 'name', 'categoryId', 'images'],
      include: [
        {
          model: ProductMeta,
          as: 'product_metas',
          attributes: ['id', 'title', 'slug', 'fieldType', 'unit'],
        },
      ],
    });

    const enrichedProducts = products.map((product) => {
      const productData = product.toJSON();
      if (productData.meta) {
        productData.metaDetails = Object.keys(productData.meta).map((metaId) => {
          const metaField = productData.product_metas.find((mf) => mf.id === metaId);
          return {
            id: metaId,
            title: metaField ? metaField.title : 'Unknown',
            slug: metaField ? metaField.slug : null,
            value: productData.meta[metaId],
            fieldType: metaField ? metaField.fieldType : null,
            unit: metaField ? metaField.unit : null,
          };
        });
      }
      delete productData.product_metas;
      return productData;
    });

    res.status(200).json({
      success: true,
      count: products.length,
      data: enrichedProducts,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * GET /products/codes/brand-wise
 * Returns: { "Brand A": ["ABC-001", "ABC-002"], "Brand B": [...] }
 */
exports.getAllProductCodesBrandWise = async (req, res) => {
  try {
    const products = await Product.findAll({
      attributes: ['product_code', 'brandId'],
      where: { status: 'active' },
      raw: true,
    });

    // Group by brandId
    const grouped = products.reduce((acc, p) => {
      const brandId = p.brandId || 'unknown';
      if (!acc[brandId]) acc[brandId] = [];
      acc[brandId].push(p.product_code);
      return acc;
    }, {});

    return res.status(200).json({
      success: true,
      count: products.length,
      data: grouped,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch product codes',
      error: error.message,
    });
  }
};

exports.checkproductCode = async (req, res) => {
  try {
    const { code } = req.query;

    if (!code || typeof code !== 'string') {
      return res.status(400).json({ exists: false, message: 'Code is required' });
    }

    // Case-insensitive check (optional, but recommended for consistency)
    const existing = await Product.findOne({
      where: {
        product_code: code.trim(),
      },
      attributes: ['product_code'], // only fetch the code, minimal data
    });

    res.json({ exists: !!existing });
  } catch (error) {
    res.status(500).json({ exists: false, error: 'Server error' });
  }
};
