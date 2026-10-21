const {
  sequelize,
  stock,
  Product,
  Keyword,
  Category,
  uploadToFtp,
  COMPANY_CODE_META_ID,
  ensureAssociations,
  parseJsonSafely,
  generateProductCode,
} = require('./product-controller.shared');

// ==================== CREATE PRODUCT ====================
exports.createProduct = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    ensureAssociations();

    const {
      name,
      product_code: inputProductCode,
      quantity = 0,
      isMaster,
      masterProductId,
      variantOptions: variantOptionsInput,
      variantKey,
      skuSuffix,
      meta: metaInput,
      isFeatured = false,
      status,
      keywordIds = [],
      ...restFields
    } = req.body;

    // Parse meta
    let metaObj = {};
    if (metaInput) {
      metaObj = parseJsonSafely(metaInput, {}, 'meta');
    }

    // Upload images
    // Upload images — ALWAYS to product_images folder (like in orderController)
    let imageUrls = [];
    if (req.files?.length > 0) {
      for (const file of req.files) {
        try {
          const url = await uploadToFtp(
            file.buffer,
            file.originalname,
            { remoteDir: '/product_images' }, // ← object
          );
          imageUrls.push(url);
        } catch (uploadErr) {
          console.error('Image upload failed for:', file.originalname, uploadErr);
          // Continue with other files instead of failing the whole request
        }
      }
    }
    // ────────────────────────────────────────────────
    // 1. Prepare base product data
    // ────────────────────────────────────────────────
    const productData = {
      name: name?.trim() || 'Unnamed Product',
      quantity: parseInt(quantity, 10) || 0,
      images: imageUrls.length > 0 ? imageUrls : [],
      meta: Object.keys(metaObj).length > 0 ? metaObj : null,
      isFeatured: isFeatured === 'true' || isFeatured === true,
      status: status || (quantity > 0 ? 'active' : 'out_of_stock'),
      description: restFields.description?.trim() || null,
      tax: restFields.tax ? parseFloat(restFields.tax) : null,
      alert_quantity: restFields.alert_quantity ? parseInt(restFields.alert_quantity, 10) : null,
      categoryId: restFields.categoryId || null,
      brandId: restFields.brandId || null,
      vendorId: restFields.vendorId || null,
      brand_parentcategoriesId: restFields.brand_parentcategoriesId || null,
      // product_code will be set below
    };

    // ────────────────────────────────────────────────
    // 2. Handle product_code – auto-generate if missing
    // ────────────────────────────────────────────────
    let finalProductCode = (inputProductCode || '').trim();

    if (!finalProductCode) {
      try {
        finalProductCode = await generateProductCode({
          brandId: restFields.brandId,
          categoryId: restFields.categoryId,
          companyCode: metaObj?.[COMPANY_CODE_META_ID] || null,
          transaction: t,
        });
      } catch (err) {
        await t.rollback();
        return res.status(500).json({
          message: 'Failed to auto-generate product code',
          error: err.message,
        });
      }
    }

    // ────────────────────────────────────────────────
    // 3. Ensure uniqueness with simple collision handling
    // ────────────────────────────────────────────────
    let attempt = 0;
    const maxAttempts = 10;

    while (attempt < maxAttempts) {
      const duplicate = await Product.findOne({
        where: { product_code: finalProductCode },
        transaction: t,
      });

      if (!duplicate) break;

      finalProductCode = finalProductCode.replace(/-\d+$/, '') + `-${attempt + 2}`;
      attempt++;
    }

    if (attempt >= maxAttempts) {
      await t.rollback();
      return res.status(409).json({
        message: 'Could not generate a unique product code after multiple attempts',
      });
    }

    // Assign the final safe code
    productData.product_code = finalProductCode;

    let finalProduct;

    // ────────────────────────────────────────────────
    // CASE 1: Master Product
    // ────────────────────────────────────────────────
    if (isMaster === 'true' || isMaster === true) {
      finalProduct = await Product.create(
        {
          ...productData,
          isMaster: true,
          masterProductId: null,
          variantOptions: null,
          variantKey: null,
          skuSuffix: null,
        },
        { transaction: t },
      );
    }

    // ────────────────────────────────────────────────
    // CASE 2: Variant of existing master
    // ────────────────────────────────────────────────
    else if (masterProductId) {
      const master = await Product.findOne({
        where: { productId: masterProductId, isMaster: true },
        transaction: t,
      });

      if (!master) {
        await t.rollback();
        return res.status(400).json({ message: 'Master product not found' });
      }

      const variantOpts = parseJsonSafely(variantOptionsInput, {});

      const generatedVariantKey = Object.values(variantOpts).filter(Boolean).join(' ');

      const generatedSkuSuffix = generatedVariantKey
        ? `-${generatedVariantKey.toUpperCase().replace(/\s+/g, '-')}`
        : '';

      finalProduct = await Product.create(
        {
          ...productData, // ← already has correct product_code
          name: name?.trim() || `${master.name} - ${generatedVariantKey}`.trim(),
          masterProductId: master.productId,
          isMaster: false,
          variantOptions: Object.keys(variantOpts).length ? variantOpts : null,
          variantKey: generatedVariantKey || variantKey || null,
          skuSuffix: generatedSkuSuffix || skuSuffix || null,
          categoryId: restFields.categoryId || master.categoryId,
          brandId: restFields.brandId || master.brandId,
          vendorId: restFields.vendorId || master.vendorId,
          brand_parentcategoriesId:
            restFields.brand_parentcategoriesId || master.brand_parentcategoriesId,
          images: imageUrls.length > 0 ? imageUrls : master.images,
          meta: Object.keys(metaObj).length > 0 ? metaObj : master.meta,
          description: restFields.description?.trim() || master.description,
        },
        { transaction: t },
      );
    }

    // ────────────────────────────────────────────────
    // CASE 3: Standalone / normal product
    // ────────────────────────────────────────────────
    else {
      finalProduct = await Product.create({ ...productData, isMaster: false }, { transaction: t });
    }

    // ────────────────────────────────────────────────
    // Attach keywords
    // ────────────────────────────────────────────────
    const cleanKeywordIds = Array.isArray(keywordIds)
      ? keywordIds.filter(Boolean)
      : typeof keywordIds === 'string'
        ? keywordIds
            .split(',')
            .map((id) => id.trim())
            .filter(Boolean)
        : [];

    if (cleanKeywordIds.length > 0) {
      await finalProduct.setKeywords(cleanKeywordIds, { transaction: t });
    }

    // Opening stock goes through the stock engine (it keeps
    // products.quantity equal to the available stock).
    const openingQty = parseInt(quantity, 10) || 0;
    await finalProduct.update({ quantity: 0 }, { transaction: t });
    if (openingQty > 0) {
      await stock.receiveGoods(
        {
          items: [
            {
              productId: finalProduct.productId,
              productName: finalProduct.name,
              quantity: openingQty,
            },
          ],
          userId: req.user?.userId || null,
          notes: 'Opening stock when the product was created',
        },
        { t },
      );
    }

    await t.commit();

    // ────────────────────────────────────────────────
    // Return fresh product with relations
    // ────────────────────────────────────────────────
    const createdProduct = await Product.findByPk(finalProduct.productId, {
      include: [
        {
          model: Keyword,
          as: 'keywords',
          attributes: ['id', 'keyword'],
          through: { attributes: [] },
          include: [
            {
              model: Category,
              as: 'categories',
              attributes: ['categoryId', 'name', 'slug'],
            },
          ],
        },
      ],
    });

    const keywords = (createdProduct.keywords || []).map((k) => ({
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

    res.status(201).json({
      message: 'Product created successfully',
      product: {
        ...createdProduct.toJSON(),
        images: Array.isArray(createdProduct.images) ? createdProduct.images : [],
        meta: createdProduct.meta || {},
        keywords,
        variantOptions: createdProduct.variantOptions || {},
        variantKey: createdProduct.variantKey || null,
        skuSuffix: createdProduct.skuSuffix || null,
        isMaster: !!createdProduct.isMaster,
        isVariant: !!createdProduct.masterProductId,
      },
    });
  } catch (error) {
    await t.rollback();

    res.status(500).json({
      message: 'Failed to create product',
      error: error.message,
    });
  }
};

// ==================== UPDATE PRODUCT ====================
exports.updateProduct = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const { productId } = req.params;

    // Fetch existing product
    const product = await Product.findByPk(productId, { transaction: t });
    if (!product) {
      await t.rollback();
      return res.status(404).json({ message: 'Product not found' });
    }

    const {
      name,
      product_code,
      quantity,
      isMaster: isMasterInput,
      masterProductId: newMasterId,
      variantOptions: variantOptionsInput,
      variantKey,
      skuSuffix,
      meta: metaInput,
      imagesToDelete: deleteInput,
      isFeatured,
      status,
      keywordIds = [],
      ...restFields
    } = req.body;

    // 1. Parse meta safely
    let metaObj = {};
    if (metaInput) {
      metaObj = parseJsonSafely(metaInput, {}, 'meta');
    }

    // 2. Handle images
    let currentImages = [];
    if (product.images) {
      currentImages = parseJsonSafely(product.images, [], 'existing images');
    }

    // Parse imagesToDelete
    let imagesToDelete = [];
    if (deleteInput) {
      try {
        imagesToDelete =
          typeof deleteInput === 'string'
            ? JSON.parse(deleteInput)
            : Array.isArray(deleteInput)
              ? deleteInput
              : [];
      } catch (e) {
        console.error('Failed to parse imagesToDelete:', deleteInput);
      }
    }

    // Remove deleted images
    currentImages = currentImages.filter((url) => !imagesToDelete.includes(url));

    // Upload new images
    if (req.files?.length > 0) {
      for (const file of req.files) {
        try {
          const url = await uploadToFtp(file.buffer, file.originalname, {
            remoteDir: '/product_images',
          });
          currentImages.push(url);
        } catch (uploadErr) {
          console.error('Image upload failed:', file.originalname, uploadErr);
        }
      }
    }

    // 3. Prepare update data
    const isMaster = isMasterInput === 'true' || isMasterInput === true;

    let updateData = {
      name: name?.trim() || product.name,
      product_code: product_code?.trim() || product.product_code,
      images: currentImages,
      meta: Object.keys(metaObj).length > 0 ? metaObj : null,
      isFeatured: isFeatured === 'true' || isFeatured === true || product.isFeatured,
      status: status || product.status,
      description: restFields.description?.trim() || product.description,
      tax: restFields.tax !== undefined ? parseFloat(restFields.tax) : product.tax,
      alert_quantity:
        restFields.alert_quantity !== undefined
          ? parseInt(restFields.alert_quantity, 10)
          : product.alert_quantity,
      categoryId: restFields.categoryId || product.categoryId,
      brandId: restFields.brandId || product.brandId,
      vendorId: restFields.vendorId || product.vendorId,
      brand_parentcategoriesId:
        restFields.brand_parentcategoriesId || product.brand_parentcategoriesId,
    };

    // 4. Master / Variant Logic
    if (isMaster && !product.isMaster) {
      const hasVariants = await Product.count({
        where: { masterProductId: product.productId },
        transaction: t,
      });

      if (hasVariants > 0) {
        await t.rollback();
        return res.status(400).json({
          message: 'Cannot convert to master product: it already has variants',
        });
      }

      Object.assign(updateData, {
        isMaster: true,
        masterProductId: null,
        variantOptions: null,
        variantKey: null,
        skuSuffix: null,
      });
    } else if (!isMaster && newMasterId && newMasterId !== product.masterProductId) {
      const master = await Product.findOne({
        where: { productId: newMasterId, isMaster: true },
        transaction: t,
      });

      if (!master) {
        await t.rollback();
        return res.status(400).json({ message: 'Master product not found' });
      }

      const variantOpts = parseJsonSafely(variantOptionsInput, {});
      const generatedVariantKey = Object.values(variantOpts).filter(Boolean).join(' ');

      const generatedSkuSuffix = generatedVariantKey
        ? `-${generatedVariantKey.toUpperCase().replace(/\s+/g, '-')}`
        : '';

      Object.assign(updateData, {
        masterProductId: master.productId,
        isMaster: false,
        variantOptions: Object.keys(variantOpts).length ? variantOpts : null,
        variantKey: generatedVariantKey || variantKey || null,
        skuSuffix: generatedSkuSuffix || skuSuffix || null,
        name: name?.trim() || `${master.name} - ${generatedVariantKey}`.trim(),
        categoryId: restFields.categoryId || master.categoryId,
        brandId: restFields.brandId || master.brandId,
      });
    } else {
      updateData.isMaster = isMaster;

      if (!isMaster) {
        const finalKey =
          variantKey ||
          (variantOptionsInput
            ? Object.values(parseJsonSafely(variantOptionsInput, {})).filter(Boolean).join(' ')
            : product.variantKey);

        const finalSuffix = finalKey
          ? `-${finalKey.toUpperCase().replace(/\s+/g, '-')}`
          : product.skuSuffix;

        updateData.variantKey = finalKey;
        updateData.skuSuffix = finalSuffix;
        updateData.variantOptions = variantOptionsInput
          ? parseJsonSafely(variantOptionsInput, {})
          : product.variantOptions;
      } else {
        updateData.variantOptions = null;
        updateData.variantKey = null;
        updateData.skuSuffix = null;
        updateData.masterProductId = null;
      }
    }

    // 5. Update the product
    await product.update(updateData, { transaction: t });

    // The form's stock field shows AVAILABLE stock. If it was changed, set
    // on-hand so that available becomes the new figure (reserved stays).
    if (quantity !== undefined && quantity !== '' && !isNaN(parseInt(quantity, 10))) {
      const wanted = Math.max(parseInt(quantity, 10), 0);
      const { totals } = await stock.productStock(product.productId, { t });
      if (wanted !== totals.available) {
        await stock.setOnHand(
          {
            productId: product.productId,
            counted: wanted + totals.reserved,
            reason: `Stock edited on the product form (available ${totals.available} → ${wanted})`,
            userId: req.user?.userId || null,
          },
          { t },
        );
      }
    }

    // 6. Update keywords
    const cleanKeywordIds = Array.isArray(keywordIds)
      ? keywordIds.filter(Boolean)
      : typeof keywordIds === 'string'
        ? keywordIds
            .split(',')
            .map((id) => id.trim())
            .filter(Boolean)
        : [];

    await product.setKeywords(cleanKeywordIds, { transaction: t });

    // 7. Fetch updated product BEFORE committing transaction
    const updated = await Product.findByPk(productId, {
      transaction: t,
      include: [
        {
          model: Keyword,
          as: 'keywords',
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

    // Commit transaction
    await t.commit();

    // Prepare keywords for response
    const keywords = (updated.keywords || []).map((k) => ({
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

    return res.json({
      message: 'Product updated successfully',
      product: {
        ...updated.toJSON(),
        images: Array.isArray(updated.images) ? updated.images : [],
        meta: updated.meta || {},
        keywords,
        variantOptions: updated.variantOptions || {},
        variantKey: updated.variantKey || null,
        skuSuffix: updated.skuSuffix || null,
        isMaster: !!updated.isMaster,
        isVariant: !!updated.masterProductId,
      },
    });
  } catch (error) {
    // Safe rollback - prevents the "Transaction cannot be rolled back" error
    if (t && !t.finished) {
      await t.rollback().catch((rollbackErr) => {
        console.error('Rollback error:', rollbackErr);
      });
    }

    return res.status(500).json({
      message: 'Failed to update product',
      error: error.message,
    });
  }
};

// ==================== DELETE PRODUCT ====================
exports.deleteProduct = async (req, res) => {
  try {
    const models = require('../../models');
    const user = await models.User.findByPk(req.user.userId);
    const role =
      user &&
      (await models.Role.findByPk(user.roleId, {
        include: [
          {
            model: models.Permission,
            as: 'permissions',
            through: { attributes: [] },
          },
        ],
      }));
    if (
      !role ||
      (!['SUPER_ADMIN', 'DEVELOPER'].includes(role.roleName) &&
        !(role.permissions || []).some(
          (permission) =>
            permission.api === 'delete' && ['products', 'inventory'].includes(permission.module),
        ))
    )
      return res.status(403).json({ message: 'Missing delete permission for products.' });
    const service = require('./product-delete.service').createProductDeletionService(models);
    res.json(await service.remove([req.params.productId]));
  } catch (error) {
    const status =
      error.status || (error.name === 'SequelizeForeignKeyConstraintError' ? 409 : 500);
    res.status(status).json({
      message: error.status
        ? error.message
        : status === 409
          ? 'Product is referenced by other records and cannot be deleted.'
          : 'Error checking references or deleting product.',
      references: error.references,
    });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Update isFeatured status
// ─────────────────────────────────────────────────────────────────────────────
exports.updateProductFeatured = async (req, res) => {
  const { productId } = req.params;
  const { isFeatured } = req.body;

  try {
    if (typeof isFeatured !== 'boolean') {
      return res.status(400).json({ message: 'isFeatured must be a boolean' });
    }

    const product = await Product.findOne({ where: { productId } });
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    product.isFeatured = isFeatured;
    await product.save();

    return res.status(200).json({
      message: 'Product featured status updated successfully',
      product,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.batchCreateProducts = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const {
      categoryId,
      brandId,
      vendorId,
      brand_parentcategoriesId,
      products, // array of { name, product_code, quantity, price, meta: { "1": "8GB", "2": "256GB" } }
    } = req.body;

    if (!Array.isArray(products) || products.length === 0 || products.length > 50) {
      return res.status(400).json({ message: 'Send 1–50 products' });
    }

    // Validate common fields
    if (!categoryId || !brandId) {
      return res.status(400).json({ message: 'categoryId and brandId required' });
    }

    const results = [];
    const errors = [];

    for (let i = 0; i < products.length; i++) {
      const p = products[i];
      const index = i + 1;

      if (!p.name?.trim() || !p.product_code?.trim()) {
        errors.push(`Row ${index}: Name and Code required`);
        continue;
      }

      try {
        const product = await Product.create(
          {
            name: p.name.trim(),
            product_code: p.product_code.trim(),
            quantity: parseInt(p.quantity) || 0,
            price: parseFloat(p.price) || 0,
            categoryId,
            brandId,
            vendorId: vendorId || null,
            brand_parentcategoriesId: brand_parentcategoriesId || null,
            description: p.description?.trim() || null,
            meta: p.meta && Object.keys(p.meta).length ? p.meta : null,
            images: '[]', // or allow bulk image later
            status: 'active',
            isFeatured: false,
          },
          { transaction: t },
        );

        results.push({
          row: index,
          productId: product.productId,
          name: product.name,
          product_code: product.product_code,
          status: 'success',
        });
      } catch (err) {
        if (err.name === 'SequelizeUniqueConstraintError') {
          errors.push(`Row ${index}: Code ${p.product_code} already exists`);
        } else {
          errors.push(`Row ${index}: ${err.message}`);
        }
      }
    }

    if (errors.length > 0 && results.length === 0) {
      await t.rollback();
      return res.status(400).json({ message: 'All failed', errors });
    }

    if (results.length > 0) {
      await t.commit();
    } else {
      await t.rollback();
    }

    return res.status(201).json({
      message: `${results.length} products created`,
      successCount: results.length,
      failedCount: errors.length,
      created: results,
      errors,
    });
  } catch (err) {
    await t.rollback();
    return res.status(500).json({ message: err.message });
  }
};
