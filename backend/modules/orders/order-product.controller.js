// controllers/order-product.controller.js

const OrderItem = require("./models/order-item.model");
const { Product, Order } = require("../../models");

// ============================================================
// HELPERS
// ============================================================

const sendErrorResponse = (res, status, message, details = null) => {
  const response = { message };

  if (details) {
    response.details = details;
  }

  return res.status(status).json(response);
};

// ============================================================
// NORMALIZE PRODUCT IDS
// ============================================================

const normalizeProductIds = (productIds) => {
  if (!Array.isArray(productIds)) {
    return [];
  }

  return [
    ...new Set(
      productIds
        .filter(Boolean)
        .map((id) => String(id).trim())
        .filter(Boolean),
    ),
  ];
};

// ============================================================
// NORMALIZE IMAGES
// ============================================================

const getImageUrl = (images) => {
  if (!images) {
    return null;
  }

  // Already an array
  if (Array.isArray(images)) {
    return images[0] || null;
  }

  // JSON string
  if (typeof images === "string") {
    try {
      const parsed = JSON.parse(images);

      if (Array.isArray(parsed)) {
        return parsed[0] || null;
      }

      if (typeof parsed === "string") {
        return parsed;
      }
    } catch (error) {
      // Sometimes images may already be a normal URL
      if (images.startsWith("http://") || images.startsWith("https://")) {
        return images;
      }
    }
  }

  return null;
};

// ============================================================
// NORMALIZE INVENTORY PRODUCT
// ============================================================

const normalizeInventoryProduct = (product) => {
  if (!product) {
    return null;
  }

  const data =
    typeof product.toJSON === "function" ? product.toJSON() : product;

  return {
    productId: data.productId || data.id || null,

    name: data.name || null,

    productCode: data.productCode || data.product_code || null,

    companyCode: data.companyCode || data.company_code || null,

    imageUrl: data.imageUrl || getImageUrl(data.images),

    quantity:
      data.quantity !== null && data.quantity !== undefined
        ? Number(data.quantity)
        : 0,

    alertQuantity:
      data.alertQuantity !== null && data.alertQuantity !== undefined
        ? Number(data.alertQuantity)
        : data.alert_quantity !== null && data.alert_quantity !== undefined
          ? Number(data.alert_quantity)
          : null,

    status: data.status || null,

    tax: data.tax !== null && data.tax !== undefined ? Number(data.tax) : null,

    discountType: data.discountType || null,

    masterProductId: data.masterProductId || null,

    isMaster: Boolean(data.isMaster),

    variantOptions: data.variantOptions || null,

    variantKey: data.variantKey || null,

    skuSuffix: data.skuSuffix || null,

    brandId: data.brandId || null,

    categoryId: data.categoryId || null,

    vendorId: data.vendorId || null,
  };
};

// ============================================================
// NORMALIZE ORDER ITEM
// ============================================================

const normalizeOrderItem = (item) => {
  if (!item) {
    return null;
  }

  return {
    productId: item.productId || item.product_id || null,

    name: item.name || item.productName || null,

    imageUrl: item.imageUrl || item.image_url || null,

    productCode: item.productCode || item.product_code || null,

    companyCode: item.companyCode || item.company_code || null,

    quantity: Number(item.quantity || 0),

    price: Number(item.price || 0),

    discount: Number(item.discount || 0),

    discountType: item.discountType || "percent",

    tax: Number(item.tax || 0),

    total: Number(item.total || 0),
  };
};

// ============================================================
// GET LOW STOCK / INVENTORY PRODUCTS
// ============================================================

const getInventoryProducts = async (productIds, orderItemMap = new Map()) => {
  const normalizedProductIds = normalizeProductIds(productIds);

  if (normalizedProductIds.length === 0) {
    return [];
  }

  // ==========================================================
  // FIND PRODUCTS
  // ==========================================================

  const products = await Product.findAll({
    where: {
      productId: normalizedProductIds,
    },

    attributes: [
      "productId",
      "name",
      "product_code",
      "quantity",
      "alert_quantity",
      "status",
      "images",
      "tax",
      "discountType",
      "masterProductId",
      "isMaster",
      "variantOptions",
      "variantKey",
      "skuSuffix",
      "brandId",
      "categoryId",
      "vendorId",
    ],

    order: [["name", "ASC"]],
  });

  // ==========================================================
  // PRODUCT MAP
  // ==========================================================

  const productMap = new Map(
    products.map((product) => [String(product.productId), product]),
  );

  // ==========================================================
  // BUILD RESULT
  // ==========================================================

  return normalizedProductIds.map((productId) => {
    const product = productMap.get(String(productId));

    const rawOrderItem = orderItemMap.get(String(productId));

    const orderItem = normalizeOrderItem(rawOrderItem);

    // ========================================================
    // PRODUCT NOT FOUND
    // ========================================================

    if (!product) {
      const orderedQuantity = Number(orderItem?.quantity || 0);

      return {
        productId,

        name: orderItem?.name || "Product not found",

        productCode: orderItem?.productCode || null,

        companyCode: orderItem?.companyCode || null,

        imageUrl: orderItem?.imageUrl || null,

        availableInInventory: false,

        inventoryStatus: "NOT_FOUND",

        currentStock: 0,

        alertQuantity: null,

        orderedQuantity,

        shortage: orderedQuantity,

        isLowStock: true,

        isBelowAlertLevel: false,

        insufficientForOrder: orderedQuantity > 0,

        orderItem,

        product: null,
      };
    }

    // ========================================================
    // NORMALIZED PRODUCT
    // ========================================================

    const productData = normalizeInventoryProduct(product);

    const currentStock = Number(productData.quantity || 0);

    const alertQuantity = productData.alertQuantity;

    const orderedQuantity = Number(orderItem?.quantity || 0);

    // ========================================================
    // CHECKS
    // ========================================================

    const insufficientForOrder = orderedQuantity > currentStock;

    const isBelowAlertLevel =
      alertQuantity !== null && currentStock <= alertQuantity;

    const isLowStock = insufficientForOrder || isBelowAlertLevel;

    const shortage = Math.max(orderedQuantity - currentStock, 0);

    // ========================================================
    // STATUS
    // ========================================================

    let inventoryStatus = "AVAILABLE";

    if (currentStock <= 0) {
      inventoryStatus = "OUT_OF_STOCK";
    } else if (insufficientForOrder) {
      inventoryStatus = "INSUFFICIENT";
    } else if (isBelowAlertLevel) {
      inventoryStatus = "LOW_STOCK";
    }

    // ========================================================
    // RESPONSE
    // ========================================================

    return {
      // ------------------------------------------------------
      // PRODUCT IDENTITY
      // ------------------------------------------------------

      productId: productData.productId,

      name: productData.name || orderItem?.name || "—",

      productCode: productData.productCode || orderItem?.productCode || null,

      companyCode: productData.companyCode || orderItem?.companyCode || null,

      imageUrl: productData.imageUrl || orderItem?.imageUrl || null,

      // ------------------------------------------------------
      // INVENTORY
      // ------------------------------------------------------

      availableInInventory: true,

      inventoryStatus,

      currentStock,

      alertQuantity,

      // ------------------------------------------------------
      // ORDER
      // ------------------------------------------------------

      orderedQuantity,

      shortage,

      // ------------------------------------------------------
      // FLAGS
      // ------------------------------------------------------

      isLowStock,

      isBelowAlertLevel,

      insufficientForOrder,

      // ------------------------------------------------------
      // ORDER SNAPSHOT
      // ------------------------------------------------------

      orderItem,

      // ------------------------------------------------------
      // NORMALIZED PRODUCT
      // ------------------------------------------------------

      product: productData,
    };
  });
};

// ============================================================
// GET LOW STOCK PRODUCTS BY ORDER ID

exports.getLowStockProductByOrderId = async (req, res) => {
  try {
    const orderId = req.params.id;

    if (!orderId) {
      return sendErrorResponse(res, 400, "orderId is required");
    }

    // ========================================================
    // FIND ORDER
    // ========================================================

    const order = await Order.findByPk(orderId, {
      attributes: [
        "id",
        "orderNo",
        "status",
        "createdFor",
        "createdBy",
        "assignedUserId",
        "createdAt",
      ],
    });

    if (!order) {
      return sendErrorResponse(res, 404, "Order not found");
    }

    // ========================================================
    // FIND ORDER ITEMS
    // ========================================================

    const orderItemsDocument = await OrderItem.findOne({
      orderId: String(orderId),
    }).lean();

    const orderItems = Array.isArray(orderItemsDocument?.items)
      ? orderItemsDocument.items
      : [];

    if (orderItems.length === 0) {
      return res.status(200).json({
        message: "No products found in this order",

        order: {
          id: order.id,
          orderNo: order.orderNo,
          status: order.status,
          createdAt: order.createdAt,
        },

        count: 0,

        products: [],
      });
    }

    // ========================================================
    // ORDER ITEM MAP
    // ========================================================

    const orderItemMap = new Map();

    for (const item of orderItems) {
      if (!item?.productId) {
        continue;
      }

      orderItemMap.set(String(item.productId), item);
    }

    const productIds = [...orderItemMap.keys()];

    if (productIds.length === 0) {
      return res.status(200).json({
        message: "No valid products found in this order",

        order: {
          id: order.id,
          orderNo: order.orderNo,
          status: order.status,
          createdAt: order.createdAt,
        },

        count: 0,

        products: [],
      });
    }

    // ========================================================
    // INVENTORY
    // ========================================================

    const inventoryResults = await getInventoryProducts(
      productIds,
      orderItemMap,
    );

    // ========================================================
    // ONLY ATTENTION PRODUCTS
    // ========================================================

    const lowStockProducts = inventoryResults.filter(
      (product) => product.isLowStock,
    );

    // ========================================================
    // RESPONSE
    // ========================================================

    return res.status(200).json({
      message: "Low stock products fetched successfully",

      order: {
        id: order.id,
        orderNo: order.orderNo,
        status: order.status,
        createdAt: order.createdAt,
      },

      count: lowStockProducts.length,

      products: lowStockProducts,
    });
  } catch (err) {
    console.error("Get Low Stock Products By Order ID Error:", err);

    return sendErrorResponse(
      res,
      500,
      "Failed to fetch low stock products",
      err.message,
    );
  }
};

exports.getLowStockProductsForIncomingOrder = async (req, res) => {
  try {
    // ======================================================
    // PRODUCTS OBJECT
    // ======================================================

    const incomingProducts = Array.isArray(req.body?.products)
      ? req.body.products
      : [];

    // ======================================================
    // PRODUCT IDS FALLBACK
    // ======================================================

    const incomingProductIds = normalizeProductIds(req.body?.productIds);

    // ======================================================
    // PRODUCT OBJECTS PROVIDED
    // ======================================================

    if (incomingProducts.length > 0) {
      const orderItemMap = new Map();

      for (const item of incomingProducts) {
        if (!item?.productId) {
          continue;
        }

        const normalizedItem = normalizeOrderItem(item);

        orderItemMap.set(String(item.productId), normalizedItem);
      }

      const productIds = [...orderItemMap.keys()];

      if (productIds.length === 0) {
        return res.status(200).json({
          message: "No valid products supplied",

          count: 0,

          products: [],
        });
      }

      // ====================================================
      // INVENTORY
      // ====================================================

      const inventoryResults = await getInventoryProducts(
        productIds,
        orderItemMap,
      );

      // ====================================================
      // RETURN ALL PRODUCTS
      // ====================================================

      return res.status(200).json({
        message: "Incoming products inventory checked successfully",

        count: inventoryResults.length,

        products: inventoryResults,
      });
    }

    // ======================================================
    // ONLY PRODUCT IDS PROVIDED
    // ======================================================

    if (incomingProductIds.length > 0) {
      const inventoryResults = await getInventoryProducts(
        incomingProductIds,
        new Map(),
      );

      return res.status(200).json({
        message: "Products inventory checked successfully",

        count: inventoryResults.length,

        products: inventoryResults,
      });
    }

    // ======================================================
    // NOTHING PROVIDED
    // ======================================================

    return res.status(200).json({
      message: "No products supplied for inventory check",

      count: 0,

      products: [],
    });
  } catch (err) {
    console.error("Get Low Stock Products For Incoming Order Error:", err);

    return sendErrorResponse(
      res,
      500,
      "Failed to check incoming products inventory",
      err.message,
    );
  }
};
