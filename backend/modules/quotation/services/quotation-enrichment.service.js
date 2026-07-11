const { generateGroupId } = require("../utils/id.util");

/**
 * Enrichment for CREATE flow.
 * - isOption derived from isOption / isOptionFor / optionType
 * - tax comes from the incoming payload (falls back to 0)
 * - no `total` field is pre-computed (left to the DB/consumer)
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

      // === OPTION FIELDS ===
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
 * Enrichment for UPDATE flow.
 * - isOption is derived ONLY from isOptionFor (stricter than create)
 * - tax is hard-zeroed (line items don't carry tax post-update)
 * - a `total` string field is pre-computed
 * - throws if a product's assigned location quantities exceed its total
 *   quantity (caller must catch and roll back the transaction)
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
    } else if (p.floorId) {
      // Backward compatibility
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

      locations,
      // Backward compatibility
      floorId: locations?.[0]?.floorId || null,
      floorName: locations?.[0]?.floorName || null,
      roomId: locations?.[0]?.roomId || null,
      roomName: locations?.[0]?.roomName || null,
    };
  });
}

/**
 * Enrichment for CLONE flow.
 * - isOption derived from isOption OR isOptionFor
 * - tax hard-zeroed, `total` pre-computed (same as update)
 * - throws on location-quantity overflow (same as update)
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

module.exports = {
  enrichProductsForCreate,
  enrichProductsForUpdate,
  enrichProductsForClone,
};
