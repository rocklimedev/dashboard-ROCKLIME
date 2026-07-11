const sequelize = require("../../config/database");
const { Product, ProductMeta, Keyword, Category } = require("../../models");
const { uploadToFtp } = require("../../middleware/upload");
const {
  ensureAssociations,
  parseJsonSafely,
  enrichKeywords,
  buildMetaMap,
  buildMetaDetails,
  KEYWORD_INCLUDE,
  COMPANY_CODE_META_ID,
} = require("./productHelpers");
const { generateProductCode } = require("./productCodeService");

/**
 * Uploads any files on the request to the given remote dir, skipping (and logging)
 * individual failures instead of failing the whole request.
 */
async function uploadProductImages(files = []) {
  const imageUrls = [];
  for (const file of files) {
    try {
      const url = await uploadToFtp(file.buffer, file.originalname, {
        remoteDir: "/product_images",
      });
      imageUrls.push(url);
    } catch (uploadErr) {
      console.error("Image upload failed for:", file.originalname, uploadErr);
    }
  }
  return imageUrls;
}

function normalizeKeywordIds(keywordIds) {
  if (Array.isArray(keywordIds)) return keywordIds.filter(Boolean);
  if (typeof keywordIds === "string") {
    return keywordIds
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean);
  }
  return [];
}

async function createProduct(req) {
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

    const metaObj = metaInput ? parseJsonSafely(metaInput, {}, "meta") : {};
    const imageUrls =
      req.files?.length > 0 ? await uploadProductImages(req.files) : [];

    const productData = {
      name: name?.trim() || "Unnamed Product",
      quantity: parseInt(quantity, 10) || 0,
      images: imageUrls.length > 0 ? JSON.stringify(imageUrls) : null,
      meta: Object.keys(metaObj).length > 0 ? metaObj : null,
      isFeatured: isFeatured === "true" || isFeatured === true,
      status: status || (quantity > 0 ? "active" : "out_of_stock"),
      description: restFields.description?.trim() || null,
      tax: restFields.tax ? parseFloat(restFields.tax) : null,
      alert_quantity: restFields.alert_quantity
        ? parseInt(restFields.alert_quantity, 10)
        : null,
      categoryId: restFields.categoryId || null,
      brandId: restFields.brandId || null,
      vendorId: restFields.vendorId || null,
      brand_parentcategoriesId: restFields.brand_parentcategoriesId || null,
    };

    // ── product_code: auto-generate if missing ─────────────────────
    let finalProductCode = (inputProductCode || "").trim();

    if (!finalProductCode) {
      finalProductCode = await generateProductCode({
        brandId: restFields.brandId,
        categoryId: restFields.categoryId,
        companyCode: metaObj?.[COMPANY_CODE_META_ID] || null,
        transaction: t,
      });
    }

    // ── Ensure uniqueness with simple collision handling ────────────
    let attempt = 0;
    const maxAttempts = 10;

    while (attempt < maxAttempts) {
      const duplicate = await Product.findOne({
        where: { product_code: finalProductCode },
        transaction: t,
      });
      if (!duplicate) break;
      finalProductCode =
        finalProductCode.replace(/-\d+$/, "") + `-${attempt + 2}`;
      attempt++;
    }

    if (attempt >= maxAttempts) {
      const err = new Error(
        "Could not generate a unique product code after multiple attempts",
      );
      err.status = 409;
      throw err;
    }

    productData.product_code = finalProductCode;

    let finalProduct;

    if (isMaster === "true" || isMaster === true) {
      // CASE 1: Master product
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
    } else if (masterProductId) {
      // CASE 2: Variant of existing master
      const master = await Product.findOne({
        where: { productId: masterProductId, isMaster: true },
        transaction: t,
      });

      if (!master) {
        const err = new Error("Master product not found");
        err.status = 400;
        throw err;
      }

      const variantOpts = parseJsonSafely(variantOptionsInput, {});
      const generatedVariantKey = Object.values(variantOpts)
        .filter(Boolean)
        .join(" ");
      const generatedSkuSuffix = generatedVariantKey
        ? `-${generatedVariantKey.toUpperCase().replace(/\s+/g, "-")}`
        : "";

      finalProduct = await Product.create(
        {
          ...productData,
          name:
            name?.trim() || `${master.name} - ${generatedVariantKey}`.trim(),
          masterProductId: master.productId,
          isMaster: false,
          variantOptions: Object.keys(variantOpts).length ? variantOpts : null,
          variantKey: generatedVariantKey || variantKey || null,
          skuSuffix: generatedSkuSuffix || skuSuffix || null,
          categoryId: restFields.categoryId || master.categoryId,
          brandId: restFields.brandId || master.brandId,
          vendorId: restFields.vendorId || master.vendorId,
          brand_parentcategoriesId:
            restFields.brand_parentcategoriesId ||
            master.brand_parentcategoriesId,
          images:
            imageUrls.length > 0 ? JSON.stringify(imageUrls) : master.images,
          meta: Object.keys(metaObj).length > 0 ? metaObj : master.meta,
          description: restFields.description?.trim() || master.description,
        },
        { transaction: t },
      );
    } else {
      // CASE 3: Standalone product
      finalProduct = await Product.create(
        { ...productData, isMaster: false },
        { transaction: t },
      );
    }

    const cleanKeywordIds = normalizeKeywordIds(keywordIds);
    if (cleanKeywordIds.length > 0) {
      await finalProduct.setKeywords(cleanKeywordIds, { transaction: t });
    }

    await t.commit();

    const createdProduct = await Product.findByPk(finalProduct.productId, {
      include: [KEYWORD_INCLUDE],
    });

    return {
      ...createdProduct.toJSON(),
      images: createdProduct.images ? JSON.parse(createdProduct.images) : [],
      meta: createdProduct.meta || {},
      keywords: enrichKeywords(createdProduct.toJSON().keywords),
      variantOptions: createdProduct.variantOptions || {},
      variantKey: createdProduct.variantKey || null,
      skuSuffix: createdProduct.skuSuffix || null,
      isMaster: !!createdProduct.isMaster,
      isVariant: !!createdProduct.masterProductId,
    };
  } catch (error) {
    await t.rollback();
    throw error;
  }
}

async function updateProduct(productId, req) {
  const t = await sequelize.transaction();

  try {
    const product = await Product.findByPk(productId, { transaction: t });
    if (!product) {
      await t.rollback();
      const err = new Error("Product not found");
      err.status = 404;
      throw err;
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

    const metaObj = metaInput ? parseJsonSafely(metaInput, {}, "meta") : {};

    // ── Images ───────────────────────────────────────────────────────
    let currentImages = product.images
      ? parseJsonSafely(product.images, [], "existing images")
      : [];

    let imagesToDelete = [];
    if (deleteInput) {
      try {
        imagesToDelete =
          typeof deleteInput === "string"
            ? JSON.parse(deleteInput)
            : Array.isArray(deleteInput)
              ? deleteInput
              : [];
      } catch (e) {
        console.error("Failed to parse imagesToDelete:", deleteInput);
      }
    }

    currentImages = currentImages.filter(
      (url) => !imagesToDelete.includes(url),
    );

    if (req.files?.length > 0) {
      const newUrls = await uploadProductImages(req.files);
      currentImages.push(...newUrls);
    }

    const isMaster = isMasterInput === "true" || isMasterInput === true;

    const updateData = {
      name: name?.trim() || product.name,
      product_code: product_code?.trim() || product.product_code,
      quantity:
        quantity !== undefined ? parseInt(quantity, 10) : product.quantity,
      images: JSON.stringify(currentImages),
      meta: Object.keys(metaObj).length > 0 ? metaObj : null,
      isFeatured:
        isFeatured === "true" || isFeatured === true || product.isFeatured,
      status: status || product.status,
      description: restFields.description?.trim() || product.description,
      tax:
        restFields.tax !== undefined ? parseFloat(restFields.tax) : product.tax,
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

    // ── Master / Variant transitions ────────────────────────────────
    if (isMaster && !product.isMaster) {
      const hasVariants = await Product.count({
        where: { masterProductId: product.productId },
        transaction: t,
      });

      if (hasVariants > 0) {
        const err = new Error(
          "Cannot convert to master product: it already has variants",
        );
        err.status = 400;
        throw err;
      }

      Object.assign(updateData, {
        isMaster: true,
        masterProductId: null,
        variantOptions: null,
        variantKey: null,
        skuSuffix: null,
      });
    } else if (
      !isMaster &&
      newMasterId &&
      newMasterId !== product.masterProductId
    ) {
      const master = await Product.findOne({
        where: { productId: newMasterId, isMaster: true },
        transaction: t,
      });

      if (!master) {
        const err = new Error("Master product not found");
        err.status = 400;
        throw err;
      }

      const variantOpts = parseJsonSafely(variantOptionsInput, {});
      const generatedVariantKey = Object.values(variantOpts)
        .filter(Boolean)
        .join(" ");
      const generatedSkuSuffix = generatedVariantKey
        ? `-${generatedVariantKey.toUpperCase().replace(/\s+/g, "-")}`
        : "";

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
            ? Object.values(parseJsonSafely(variantOptionsInput, {}))
                .filter(Boolean)
                .join(" ")
            : product.variantKey);

        const finalSuffix = finalKey
          ? `-${finalKey.toUpperCase().replace(/\s+/g, "-")}`
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

    await product.update(updateData, { transaction: t });

    const cleanKeywordIds = normalizeKeywordIds(keywordIds);
    await product.setKeywords(cleanKeywordIds, { transaction: t });

    const updated = await Product.findByPk(productId, {
      transaction: t,
      include: [KEYWORD_INCLUDE],
    });

    await t.commit();

    return {
      ...updated.toJSON(),
      images: updated.images ? JSON.parse(updated.images) : [],
      meta: updated.meta || {},
      keywords: enrichKeywords(updated.toJSON().keywords),
      variantOptions: updated.variantOptions || {},
      variantKey: updated.variantKey || null,
      skuSuffix: updated.skuSuffix || null,
      isMaster: !!updated.isMaster,
      isVariant: !!updated.masterProductId,
    };
  } catch (error) {
    if (t && !t.finished) {
      await t.rollback().catch((rollbackErr) => {
        console.error("Rollback error:", rollbackErr);
      });
    }
    throw error;
  }
}

async function getProductById(productId) {
  const product = await Product.findByPk(productId, {
    include: [KEYWORD_INCLUDE],
  });
  if (!product) return null;

  const raw = product.toJSON();

  const safeJsonParse = (value, fallback = []) => {
    if (value == null) return fallback;
    if (typeof value !== "string") return value;
    const trimmed = value.trim();
    if (trimmed === "" || trimmed === "null" || trimmed === "undefined")
      return fallback;
    try {
      const parsed = JSON.parse(trimmed);
      return Array.isArray(parsed) ? parsed : [parsed];
    } catch (err) {
      return fallback;
    }
  };

  const images = safeJsonParse(raw.images, []);
  const metaObj = safeJsonParse(raw.meta, {});
  const metaMap = await buildMetaMap(new Set(Object.keys(metaObj)));

  return {
    ...raw,
    images,
    meta: metaObj,
    metaDetails: buildMetaDetails(metaObj, metaMap),
    keywords: enrichKeywords(raw.keywords),
    variantOptions: raw.variantOptions || {},
    variantKey: raw.variantKey || null,
    skuSuffix: raw.skuSuffix || null,
    isMaster: !!raw.isMaster,
    isVariant: !!raw.masterProductId,
    masterProductId: raw.masterProductId || raw.productId,
  };
}

async function deleteProduct(productId) {
  const product = await Product.findByPk(productId);
  if (!product) return false;
  await product.destroy();
  return true;
}

async function updateProductFeatured(productId, isFeatured) {
  if (typeof isFeatured !== "boolean") {
    const err = new Error("isFeatured must be a boolean");
    err.status = 400;
    throw err;
  }

  const product = await Product.findOne({ where: { productId } });
  if (!product) return null;

  product.isFeatured = isFeatured;
  await product.save();
  return product;
}

module.exports = {
  createProduct,
  updateProduct,
  getProductById,
  deleteProduct,
  updateProductFeatured,
};
