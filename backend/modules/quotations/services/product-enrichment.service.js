const { Product } = require("../../../models");
const { META_SLUGS, getMetaValue } = require("../helpers/meta.helpers");
const { extractFirstImageUrl } = require("../helpers/image.helpers");
const { generateGroupId } = require("../helpers/id.helpers");

/**
 * Fetch product master data and build productMap
 * Used by create / update / clone
 */
async function fetchProductMap(productIds, transaction) {
  const productMap = {};
  if (productIds.length > 0) {
    const dbProducts = await Product.findAll({
      where: { productId: productIds },
      attributes: [
        "productId",
        "name",
        "images",
        "product_code",
        "meta",
        "tax",
        "discountType",
      ],
      transaction,
    });

    dbProducts.forEach((p) => {
      const imageUrl = extractFirstImageUrl(p.images);

      productMap[p.productId] = {
        name: p.name?.trim() || "Unnamed Product",
        imageUrl, // Much more reliable now
        productCode: p.product_code || null,
        companyCode: getMetaValue(p.meta, META_SLUGS.companyCode), // optional improvement
        tax: p.tax || 0,
        discountType: p.discountType || "percent",
      };
    });
  }
  return productMap;
}

/**
 * Enrichment used by CREATE
 * (preserves exact original create logic)
 */
function enrichProductsForCreate(incomingProducts, productMap) {
  return incomingProducts.map((p, index) => {
    const id = p.productId || p.id;
    const db = productMap[id] || {};

    const price = Number(p.price || 0);
    const quantity = Number(p.quantity) || 1;
    const discount = Number(p.discount || 0);
    const discountType = p.discountType || db.discountType || "percent";

    // === Option / Addon Handling ===
    const isOption =
      Boolean(p.isOption) ||
      Boolean(p.isOptionFor) ||
      Boolean(p.optionType && p.optionType !== "main");

    const optionType = p.optionType || null;
    const parentProductId = p.parentProductId || p.isOptionFor || null;

    // === Location Handling ===
    let locations = [];
    if (Array.isArray(p.locations) && p.locations.length > 0) {
      locations = p.locations
        .filter((loc) => loc.floorId && Number(loc.assignedQuantity) > 0)
        .map((loc) => ({
          floorId: loc.floorId,
          floorName: loc.floorName || `Floor ${loc.floorId}`,
          roomId: loc.roomId || null,
          roomName: loc.roomName || null,
          areaId: loc.areaId || null,
          areaName: loc.areaName || null,
          assignedQuantity: Number(loc.assignedQuantity),
        }));
    } else if (p.floorId) {
      // Backward compatibility
      locations = [
        {
          floorId: p.floorId,
          floorName: p.floorName || null,
          roomId: p.roomId || null,
          roomName: p.roomName || null,
          assignedQuantity: quantity,
        },
      ];
    }

    return {
      productId: id,
      name: p.name || db.name || "Unknown Product",
      imageUrl: p.imageUrl || db.imageUrl || null,
      companyCode: p.companyCode || db.companyCode || null,
      productCode: p.productCode || db.productCode || null,

      quantity,
      price: Number(price.toFixed(2)),
      discount: Number(discount.toFixed(2)),
      discountType,
      tax: Number(p.tax || 0),

      priority: Number(p.priority ?? index),

      // === OPTION FIELDS - CRITICAL ===
      isOption: isOption,
      optionType: optionType,
      isOptionFor: isOption ? parentProductId : null,
      parentProductId: parentProductId,
      groupId: p.groupId || (isOption ? null : generateGroupId()),

      // Locations
      locations: locations.length > 0 ? locations : null,

      // Backward compatibility fields
      floorId: locations[0]?.floorId || null,
      floorName: locations[0]?.floorName || null,
      roomId: locations[0]?.roomId || null,
      roomName: locations[0]?.roomName || null,
    };
  });
}

/**
 * Enrichment used by UPDATE
 * (preserves exact original update logic including quantity overflow check)
 */
function enrichProductsForUpdate(incomingProducts, productMap) {
  return incomingProducts.map((p) => {
    const id = p.productId || p.id;
    const db = productMap[id] || {};

    const price = Number(p.price || 0);
    const totalQuantity = Number(p.quantity) || 1;
    const discount = Number(p.discount || 0);
    const discountType = p.discountType || db.discountType || "percent";

    // === Location Quantity Validation ===
    let locations = [];
    let validatedTotalAssignedQty = 0;

    if (Array.isArray(p.locations) && p.locations.length > 0) {
      p.locations.forEach((loc) => {
        const assignedQty = Number(loc.assignedQuantity) || 0;
        if (assignedQty > 0) {
          validatedTotalAssignedQty += assignedQty;
          locations.push({
            floorId: loc.floorId,
            floorName: loc.floorName || `Floor ${loc.floorId}`,
            roomId: loc.roomId || null,
            roomName: loc.roomName || null,
            areaId: loc.areaId || null,
            areaName: loc.areaName || null,
            assignedQuantity: assignedQty,
          });
        }
      });
    }
    // Backward compatibility
    else if (p.floorId) {
      locations.push({
        floorId: p.floorId,
        floorName: p.floorName || null,
        roomId: p.roomId || null,
        roomName: p.roomName || null,
        assignedQuantity: totalQuantity,
      });
      validatedTotalAssignedQty = totalQuantity;
    }

    if (validatedTotalAssignedQty > totalQuantity) {
      throw new Error(
        `Quantity overflow for product ${p.name || id}. Total assigned (${validatedTotalAssignedQty}) > available (${totalQuantity})`,
      );
    }

    if (locations.length === 0) {
      locations = null;
    }

    const isOption = !!p.isOptionFor;

    return {
      productId: id,
      name: p.name || db.name || "Unknown Product",

      // ← FIXED: Now properly saving imageUrl and companyCode
      imageUrl: p.imageUrl || db.imageUrl || null,
      companyCode: p.companyCode || db.companyCode || null,
      productCode: p.productCode || db.productCode || null,

      quantity: totalQuantity,
      price: Number(price.toFixed(2)),
      discount: Number(discount.toFixed(2)),
      discountType,
      tax: 0,
      priority: Number(p.priority ?? db.priority ?? 0),
      total: Number(
        discountType === "percent"
          ? price * totalQuantity * (1 - discount / 100)
          : (price - discount) * totalQuantity,
      ).toFixed(2),

      isOptionFor: isOption ? p.isOptionFor : null,
      optionType: p.optionType || null,
      groupId: p.groupId || (isOption ? null : generateGroupId()),

      locations, // New split support
      // Backward compatibility
      floorId: locations?.[0]?.floorId || null,
      floorName: locations?.[0]?.floorName || null,
      roomId: locations?.[0]?.roomId || null,
      roomName: locations?.[0]?.roomName || null,
    };
  });
}

/**
 * Enrichment used by CLONE
 * (preserves exact original clone logic)
 */
function enrichProductsForClone(originalProducts, productMap) {
  return originalProducts.map((p) => {
    const id = p.productId || p.id;
    const db = productMap[id] || {};

    const price = Number(p.price || 0);
    const totalQuantity = Number(p.quantity) || 1;
    const discount = Number(p.discount || 0);
    const discountType = p.discountType || db.discountType || "percent";

    // Location handling
    let locations = null;
    let validatedTotalAssignedQty = 0;

    if (Array.isArray(p.locations) && p.locations.length > 0) {
      p.locations.forEach((loc) => {
        const assignedQty = Number(loc.assignedQuantity) || 0;
        if (assignedQty > 0) validatedTotalAssignedQty += assignedQty;
      });
      locations = p.locations;
    } else if (p.floorId) {
      locations = [
        {
          floorId: p.floorId,
          floorName: p.floorName || null,
          roomId: p.roomId || null,
          roomName: p.roomName || null,
          assignedQuantity: totalQuantity,
        },
      ];
    }

    if (validatedTotalAssignedQty > totalQuantity) {
      throw new Error(`Quantity overflow for product ${p.name || id}`);
    }

    if (locations && locations.length === 0) locations = null;

    const isOption = Boolean(p.isOption) || Boolean(p.isOptionFor);

    return {
      productId: id,
      name: p.name || db.name || "Unknown Product",
      imageUrl: p.imageUrl || db.imageUrl || null,
      companyCode: p.companyCode || db.companyCode || null,
      productCode: p.productCode || db.productCode || null,

      quantity: totalQuantity,
      price: Number(price.toFixed(2)),
      discount: Number(discount.toFixed(2)),
      discountType,
      tax: 0,
      priority: Number(p.priority ?? 0),
      total: Number(
        discountType === "percent"
          ? price * totalQuantity * (1 - discount / 100)
          : (price - discount) * totalQuantity,
      ).toFixed(2),

      isOptionFor: isOption ? p.isOptionFor || p.parentProductId : null,
      optionType: p.optionType || null,
      groupId: p.groupId || (isOption ? null : generateGroupId()),

      locations,
      floorId: locations?.[0]?.floorId || null,
      floorName: locations?.[0]?.floorName || null,
      roomId: locations?.[0]?.roomId || null,
      roomName: locations?.[0]?.roomName || null,
    };
  });
}

/**
 * Special productMap builder used only inside updateQuotation
 * (keeps the slightly different image parsing that was present in update)
 */
async function fetchProductMapForUpdate(productIds, transaction) {
  const productMap = {};
  if (productIds.length > 0) {
    const dbProducts = await Product.findAll({
      where: { productId: productIds },
      attributes: [
        "productId",
        "name",
        "images",
        "product_code",
        "meta",
        "tax",
        "discountType",
      ],
      transaction,
    });

    dbProducts.forEach((p) => {
      let imageUrl = null;
      if (p.images) {
        try {
          imageUrl = JSON.parse(p.images)?.[0] ?? null;
        } catch {}
      }
      productMap[p.productId] = {
        name: p.name?.trim() || "Unnamed Product",
        imageUrl,
        productCode: p.product_code || null,
        companyCode: p.meta?.["d11da9f9-3f2e-4536-8236-9671200cca4a"] || null,
        tax: p.tax || 0,
        discountType: p.discountType || "percent",
      };
    });
  }
  return productMap;
}

module.exports = {
  fetchProductMap,
  fetchProductMapForUpdate,
  enrichProductsForCreate,
  enrichProductsForUpdate,
  enrichProductsForClone,
};
