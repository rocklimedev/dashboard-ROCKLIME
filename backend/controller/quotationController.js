const { v4: uuidv4 } = require("uuid");
const moment = require("moment");
const { Op } = require("sequelize");
const sequelize = require("../config/database");
const { Product, Quotation } = require("../models");
const QuotationItem = require("../models/quotationItem"); // MongoDB model
const QuotationVersion = require("../models/quotationVersion");
// META_SLUGS (same as you have in your Cart controller)
const META_SLUGS = {
  sellingPrice: "9ba862ef-f993-4873-95ef-1fef10036aa5",
  companyCode: "d11da9f9-3f2e-4536-8236-9671200cca4a",
  barcode: "4ded1cb3-5d31-42e8-90ec-a381a6ab1e35",
  productGroup: "81cd6d76-d7d2-4226-b48e-6704e6224c2b",
};

// Safe meta value extractor (reuse from your cart code)
const getMetaValue = (meta, uuid) => {
  if (!meta || !uuid) return null;

  let parsed = meta;
  if (typeof meta === "string") {
    try {
      parsed = JSON.parse(meta);
    } catch {
      return null;
    }
  }
  if (!parsed || typeof parsed !== "object") return null;

  return parsed[uuid] || null;
};
// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function generateGroupId() {
  return "grp-" + uuidv4().slice(0, 8);
}

function generateFloorId() {
  return "fl_" + uuidv4().slice(0, 8);
}

function generateRoomId(floorId = "") {
  return (floorId ? floorId + "_" : "rm_") + uuidv4().slice(0, 8);
}

function buildFloorsFromProducts(products) {
  const floorMap = new Map();

  products.forEach((item) => {
    const locationList = Array.isArray(item.locations)
      ? item.locations
      : item.floorId
        ? [{ floorId: item.floorId, floorName: item.floorName }]
        : [];

    locationList.forEach((loc) => {
      if (!loc.floorId) return;

      if (!floorMap.has(loc.floorId)) {
        floorMap.set(loc.floorId, {
          floorId: loc.floorId,
          floorName: loc.floorName || `Floor ${floorMap.size + 1}`,
          sortOrder: floorMap.size,
          rooms: [],
        });
      }

      const floor = floorMap.get(loc.floorId);
      if (loc.roomId && !floor.rooms.some((r) => r.roomId === loc.roomId)) {
        floor.rooms.push({
          roomId: loc.roomId,
          roomName: loc.roomName || "Unnamed Room",
          areas: [],
          sortOrder: floor.rooms.length,
        });
      }
    });
  });

  return Array.from(floorMap.values());
}
// Add this helper function at the top
const extractFirstImageUrl = (imagesField) => {
  if (!imagesField) return null;

  try {
    // Case 1: Already an array
    if (Array.isArray(imagesField)) {
      return imagesField[0] || null;
    }

    // Case 2: String that might be JSON
    if (typeof imagesField === "string") {
      const trimmed = imagesField.trim();

      // If it looks like a direct URL (not starting with [ or {)
      if (trimmed.startsWith("http")) {
        return trimmed;
      }

      // Try parsing as JSON
      const parsed = JSON.parse(trimmed);

      if (Array.isArray(parsed)) {
        return parsed[0] || null;
      }

      if (typeof parsed === "string" && parsed.startsWith("http")) {
        return parsed;
      }
    }

    return null;
  } catch (err) {
    // Last resort: if it's a plain URL string with quotes or garbage
    const str = String(imagesField).trim();
    if (str.startsWith("http")) {
      return str.replace(/^["']|["']$/g, ""); // remove wrapping quotes
    }
    console.warn(`Failed to parse images for product: ${imagesField}`);
    return null;
  }
};
function calculateTotals(
  items = [],
  extraDiscount = 0,
  extraDiscountType = "percent",
  shippingAmount = 0,
  gst = 0,
) {
  const mainItems = items.filter((item) => !item.isOptionFor);

  let subTotal = 0;
  let totalItemDiscount = 0;
  let taxableAmount = 0;

  mainItems.forEach((p) => {
    const price = Number(p.price) || 0;
    const qty = Number(p.quantity) || 1;
    const discount = Number(p.discount) || 0;
    const discountType = p.discountType || "percent";

    const lineGross = price * qty;
    const discountAmount =
      discountType === "percent"
        ? lineGross * (discount / 100)
        : discount * qty;

    const lineAfterDiscount = lineGross - discountAmount;

    subTotal += lineGross;
    totalItemDiscount += discountAmount;
    taxableAmount += lineAfterDiscount;
  });

  const baseForExtraDiscount = taxableAmount + Number(shippingAmount || 0);

  const extraDiscountAmount =
    extraDiscountType === "percent"
      ? (baseForExtraDiscount * Number(extraDiscount)) / 100
      : Number(extraDiscount);

  const amountBeforeGst = baseForExtraDiscount - extraDiscountAmount;

  // Simple round-off to nearest whole number
  const roundedAmount = Math.round(amountBeforeGst);
  const roundOff = roundedAmount - amountBeforeGst;

  const gstAmount = roundedAmount * (Number(gst || 0) / 100);
  const finalAmount = roundedAmount + gstAmount;

  // Optional items potential
  const optionalItems = items.filter((item) => !!item.isOptionFor);
  let optionalPotential = 0;
  optionalItems.forEach((p) => {
    optionalPotential += (Number(p.price) || 0) * (Number(p.quantity) || 1);
  });

  return {
    subTotal: Number(subTotal.toFixed(2)),
    totalItemDiscount: Number(totalItemDiscount.toFixed(2)),
    taxableAmount: Number(taxableAmount.toFixed(2)),
    extraDiscountAmount: Number(extraDiscountAmount.toFixed(2)),
    shippingAmount: Number(shippingAmount || 0),
    amountBeforeGst: Number(amountBeforeGst.toFixed(2)),
    roundOff: Number(roundOff.toFixed(2)),
    gstAmount: Number(gstAmount.toFixed(2)),
    finalAmount: Number(finalAmount.toFixed(2)),
    optionalItemsCount: optionalItems.length,
    optionalPotentialTotal: Number(optionalPotential.toFixed(2)),
  };
}

async function generateQuotationNumber(t) {
  const today = moment();
  const prefixDate = today.format("DDMMYY");
  const fullPrefix = `QUO${prefixDate}`;
  const todayStart = today.startOf("day").toDate();
  const todayEnd = today.endOf("day").toDate();

  let attempt = 0;
  const MAX_ATTEMPTS = 15;

  while (attempt < MAX_ATTEMPTS) {
    attempt++;

    const last = await Quotation.findOne({
      where: {
        reference_number: { [Op.like]: `${fullPrefix}%` },
        createdAt: { [Op.between]: [todayStart, todayEnd] },
      },
      attributes: ["reference_number"],
      order: [["reference_number", "DESC"]],
      limit: 1,
      transaction: t,
      lock: t.LOCK.UPDATE,
    });

    let nextSeq = 101;
    if (last) {
      const seqStr = last.reference_number.slice(fullPrefix.length);
      const parsed = parseInt(seqStr, 10);
      if (!isNaN(parsed) && parsed >= 100) {
        nextSeq = parsed + 1;
      }
    }

    const candidate = `${fullPrefix}${nextSeq}`;
    const exists = await Quotation.findOne({
      where: { reference_number: candidate },
      transaction: t,
    });

    if (!exists) return candidate;
  }

  throw new Error(
    `Could not generate unique quotation number after ${MAX_ATTEMPTS} attempts`,
  );
}

// ─────────────────────────────────────────────
// CREATE QUOTATION
// ─────────────────────────────────────────────
exports.createQuotation = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    let {
      products: incomingProducts,
      floors: incomingFloors = [],
      extraDiscount = 0,
      extraDiscountType = "percent",
      shippingAmount = 0,
      gst = 0,
      customerId,
      quotation_date,
      due_date,
      document_title = "Quotation",
      shipTo,
      signature_name = "",
      signature_image = "",
      ...rest
    } = req.body;

    // Parse products if sent as string (common with FormData)
    if (typeof incomingProducts === "string") {
      try {
        incomingProducts = JSON.parse(incomingProducts);
      } catch {
        return res.status(400).json({ error: "Invalid products JSON format" });
      }
    }

    if (!Array.isArray(incomingProducts) || incomingProducts.length === 0) {
      return res
        .status(400)
        .json({ error: "At least one product is required" });
    }
    // Normalize due_date
    if (!due_date || due_date === "" || due_date === "null") {
      due_date = null;
    }
    if (!customerId) {
      return res.status(400).json({ error: "Customer ID is required" });
    }

    // ─── Fetch product master data ───
    const productIds = [
      ...new Set(
        incomingProducts.map((p) => p.productId || p.id).filter(Boolean),
      ),
    ];

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
        transaction: t,
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

    // ─── Enrich incoming products ───
    // ─── Enrich incoming products with location validation ───
    // ─── Enrich incoming products with location validation ───
    const enrichedProducts = incomingProducts.map((p) => {
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

      const isOption = Boolean(p.isOption) || Boolean(p.isOptionFor);
      return {
        productId: id,
        name: p.name || db.name || "Unknown Product",

        // ← FIXED: Now properly saving imageUrl and companyCode
        // ← Improved image handling
        imageUrl:
          p.imageUrl && p.imageUrl.trim() !== ""
            ? p.imageUrl
            : db.imageUrl || null,
        companyCode: p.companyCode || db.companyCode || null,
        productCode: p.productCode || db.productCode || null,

        quantity: totalQuantity,
        price: Number(price.toFixed(2)),
        discount: Number(discount.toFixed(2)),
        discountType,
        tax: 0,

        total: Number(
          discountType === "percent"
            ? price * totalQuantity * (1 - discount / 100)
            : (price - discount) * totalQuantity,
        ).toFixed(2),

        isOptionFor: isOption ? p.parentProductId || p.isOptionFor : null,
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

    // ─── Determine floors ───
    const floors =
      Array.isArray(incomingFloors) && incomingFloors.length > 0
        ? incomingFloors
        : buildFloorsFromProducts(enrichedProducts);

    // ─── Calculate totals ───
    const totals = calculateTotals(
      enrichedProducts,
      Number(extraDiscount),
      extraDiscountType,
      Number(shippingAmount),
      Number(gst),
    );

    // ─── Generate unique reference number ───
    const reference_number = await generateQuotationNumber(t);

    // ─── Create PostgreSQL quotation ───
    const quotation = await Quotation.create(
      {
        customerId,
        reference_number,
        document_title,
        quotation_date:
          quotation_date || new Date().toISOString().split("T")[0],
        due_date,
        products: enrichedProducts,
        floors,
        totalFloors: floors.length,
        extraDiscount: Number(extraDiscount) || 0,
        extraDiscountType: extraDiscountType || "percent",
        discountAmount: totals.extraDiscountAmount,
        shippingAmount: Number(shippingAmount) || 0,
        gst: Number(gst) || 0,
        gstAmount: totals.gstAmount,
        roundOff: totals.roundOff,
        finalAmount: totals.finalAmount,
        shipTo: shipTo || null,
        signature_name,
        signature_image,
        createdBy: req.user?.userId,
        ...rest,
      },
      { transaction: t },
    );

    // ─── Create MongoDB line items (NO session) ───
    await QuotationItem.create({
      quotationId: quotation.quotationId,
      items: enrichedProducts,
    });

    // ─── All good ───
    await t.commit();

    return res.status(201).json({
      message: "Quotation created successfully",
      quotation: {
        ...quotation.toJSON(),
        finalAmount: totals.finalAmount,
      },
      calculated: totals,
    });
  } catch (error) {
    await t.rollback().catch(() => {});
    console.error("Create Quotation Error:", error);

    return res.status(500).json({
      error: "Failed to create quotation",
      message: error.message,
      // stack: error.stack // uncomment only in development
    });
  }
};
// ─────────────────────────────────────────────
// UPDATE QUOTATION
// ─────────────────────────────────────────────
exports.updateQuotation = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const { id } = req.params;

    let {
      products: incomingProducts,
      floors: incomingFloors = [],
      followupDates = [],
      extraDiscount = 0,
      extraDiscountType = "percent",
      shippingAmount = 0,
      gst = 0,
      ...quotationData
    } = req.body;

    if (!id) {
      await t.rollback();
      return res.status(400).json({ message: "Quotation ID is required" });
    }

    const currentQuotation = await Quotation.findOne({
      where: { quotationId: id },
      transaction: t,
    });

    if (!currentQuotation) {
      await t.rollback();
      return res.status(404).json({ message: "Quotation not found" });
    }

    // ─── Versioning (outside transaction) ───
    let newVersionNumber = 1;
    try {
      const latest = await QuotationVersion.findOne({ quotationId: id })
        .sort({ version: -1 })
        .lean();

      if (latest) newVersionNumber = latest.version + 1;

      const currentMongoItems = await QuotationItem.findOne({
        quotationId: id,
      }).lean();

      const rawQuotation = await Quotation.findOne({
        where: { quotationId: id },
        attributes: [
          "quotationId",
          "reference_number",
          "customerId",
          "products",
          "floors",
          "totalFloors",
          "extraDiscount",
          "extraDiscountType",
          "discountAmount",
          "shippingAmount",
          "gst",
          "gstAmount",
          "roundOff",
          "finalAmount",
          "followupDates",
          "createdAt",
          "updatedAt",
        ],
        raw: true,
        transaction: t,
      });

      const safeData = {
        ...rawQuotation,
        createdAt: rawQuotation.createdAt?.toISOString() ?? null,
        updatedAt: rawQuotation.updatedAt?.toISOString() ?? null,
      };

      await QuotationVersion.create({
        quotationId: id,
        version: newVersionNumber,
        quotationData: safeData,
        quotationItems: currentMongoItems?.items || [],
        floors: safeData.floors || [],
        totalFloors: safeData.totalFloors || 0,
        updatedBy: req.user?.userId,
        updatedAt: new Date(),
      });
    } catch (err) {
      console.error("Versioning failed:", err);
      // non-fatal
    }

    if (!Array.isArray(incomingProducts) || incomingProducts.length === 0) {
      await t.rollback();
      return res
        .status(400)
        .json({ error: "At least one product is required" });
    }

    // Fetch product master data (same as create)
    const productIds = [
      ...new Set(
        incomingProducts.map((p) => p.productId || p.id).filter(Boolean),
      ),
    ];

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
        transaction: t,
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

    // Enrich products
    // ─── Enrich incoming products with location validation ───
    // ─── Enrich incoming products with location validation ───
    const enrichedProducts = incomingProducts.map((p) => {
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
    // Floors: prefer incoming → fallback to derived
    let floors =
      Array.isArray(incomingFloors) && incomingFloors.length > 0
        ? incomingFloors
        : buildFloorsFromProducts(enrichedProducts);

    const totals = calculateTotals(
      enrichedProducts,
      Number(extraDiscount),
      extraDiscountType,
      Number(shippingAmount),
      Number(gst),
    );

    await Quotation.update(
      {
        ...quotationData,
        products: enrichedProducts,
        floors,
        totalFloors: floors.length,
        extraDiscount: Number(extraDiscount) || 0,
        extraDiscountType: extraDiscountType || "percent",
        discountAmount: totals.extraDiscountAmount,
        shippingAmount: Number(shippingAmount) || 0,
        gst: Number(gst) || 0,
        gstAmount: totals.gstAmount,
        roundOff: totals.roundOff,
        finalAmount: totals.finalAmount,
        followupDates: followupDates.length > 0 ? followupDates : null,
      },
      { where: { quotationId: id }, transaction: t },
    );

    // Sync MongoDB items
    try {
      if (enrichedProducts.length > 0) {
        await QuotationItem.updateOne(
          { quotationId: id },
          { $set: { items: enrichedProducts } },
          { upsert: true },
        );
      } else {
        await QuotationItem.deleteOne({ quotationId: id });
      }
    } catch (mongoErr) {
      console.error("MongoDB sync failed:", mongoErr);
    }

    await t.commit();

    return res.status(200).json({
      message: "Quotation updated successfully",
      version: newVersionNumber,
      finalAmount: totals.finalAmount,
      calculated: totals,
    });
  } catch (error) {
    await t.rollback().catch(() => {});
    return res.status(500).json({
      error: "Failed to update quotation",
      details: error.message,
    });
  }
};

// EXPORT TO EXCEL – now grouped by floor → room
exports.exportQuotation = async (req, res) => {
  try {
    const { id, version } = req.params;

    let quotation,
      quotationItems = [],
      floors = [];

    if (version) {
      const versionData = await QuotationVersion.findOne({
        quotationId: id,
        version: Number(version),
      });
      if (!versionData)
        return res.status(404).json({ message: "Version not found" });
      quotation = versionData.quotationData;
      quotationItems = versionData.quotationItems || [];
      floors = versionData.floors || quotation.floors || [];
    } else {
      quotation = await Quotation.findByPk(id);
      if (!quotation)
        return res.status(404).json({ message: "Quotation not found" });
      const itemsDoc = await QuotationItem.findOne({ quotationId: id });
      quotationItems = itemsDoc ? itemsDoc.items : [];
      floors = quotation.floors || [];
    }

    // We still calculate totals from main (non-optional) items
    const {
      subTotal,
      totalItemDiscount,
      itemTax: totalTax, // usually 0
      extraDiscountAmount,
      gstAmount,
    } = calculateTotals(
      quotationItems,
      quotation.extraDiscount || 0,
      quotation.extraDiscountType || "percent",
      quotation.shippingAmount || 0,
      quotation.gst || 0,
    );

    const finalTotal =
      subTotal +
      totalTax +
      (quotation.shippingAmount || 0) +
      gstAmount -
      totalItemDiscount -
      extraDiscountAmount +
      (quotation.roundOff || 0);

    // ─────────────────────────────────────────────
    // Build grouped sheet data
    // ─────────────────────────────────────────────
    const sheetData = [
      ["Estimate / Quotation", "", "", "", "GROHE / AMERICAN STANDARD"],
      [""],
      [
        "M/s",
        quotation.companyName ||
          quotation.customer?.name ||
          quotation.customerId ||
          "CUSTOMER NAME",
        "",
        "Date",
        quotation.quotation_date
          ? new Date(quotation.quotation_date).toLocaleDateString("en-IN")
          : new Date().toLocaleDateString("en-IN"),
      ],
      [
        "Address",
        quotation.shipTo || "—",
        "",
        "Quotation No",
        quotation.reference_number || "—",
      ],
      [""],
    ];

    // Group items by floor → room
    const groupedItems = {};

    quotationItems.forEach((item) => {
      const floorId = item.floorId || "no-floor";
      const floorName =
        item.floorName ||
        floors.find((f) => f.floorId === floorId)?.floorName ||
        "Unassigned Floor";
      const roomId = item.roomId || "no-room";
      const roomName = item.roomName || "Unassigned Room";

      const floorKey = `${floorId}|${floorName}`;
      if (!groupedItems[floorKey]) groupedItems[floorKey] = {};

      const roomKey = `${roomId}|${roomName}`;
      if (!groupedItems[floorKey][roomKey])
        groupedItems[floorKey][roomKey] = [];

      groupedItems[floorKey][roomKey].push(item);
    });

    // Sort floors by sortOrder (if available) or by appearance
    const sortedFloorKeys = Object.keys(groupedItems).sort((a, b) => {
      const fa = floors.find((f) => f.floorId === a.split("|")[0]);
      const fb = floors.find((f) => f.floorId === b.split("|")[0]);
      return (fa?.sortOrder ?? 999) - (fb?.sortOrder ?? 999);
    });

    let rowIndex = 1;

    for (const floorKey of sortedFloorKeys) {
      const [floorId, floorName] = floorKey.split("|");

      // Floor header
      sheetData.push([`Floor: ${floorName}`, "", "", "", "", "", "", "", ""]);
      rowIndex++;

      const rooms = groupedItems[floorKey];
      const sortedRoomKeys = Object.keys(rooms); // can sort by name or id if needed

      for (const roomKey of sortedRoomKeys) {
        const [roomId, roomName] = roomKey.split("|");

        // Room header
        sheetData.push([`  Room: ${roomName}`, "", "", "", "", "", "", "", ""]);
        rowIndex++;

        // Items header
        sheetData.push([
          "S.No",
          "Product Image",
          "Product Name",
          "Product Code",
          "MRP",
          "Discount",
          "Rate",
          "Qty",
          "Total",
        ]);

        const roomItems = rooms[roomKey];
        roomItems.forEach((p, idx) => {
          const discountDisplay = p.discount
            ? p.discountType === "percent"
              ? `${Number(p.discount).toFixed(1)}%`
              : `₹${Number(p.discount).toFixed(2)}`
            : "—";

          sheetData.push([
            rowIndex++,
            p.imageUrl || "N/A",
            p.name || "—",
            p.productCode || p.product_code || "—",
            Number(p.price * (1 + (p.discount || 0) / 100))?.toFixed(2) || "—", // approximate MRP
            discountDisplay,
            Number(p.price || p.total || 0).toFixed(2),
            Number(p.quantity || 1),
            Number(p.total || 0).toFixed(2),
          ]);
        });

        sheetData.push([""]); // empty line between rooms
      }

      sheetData.push([""]); // empty line between floors
    }

    // Summary section
    sheetData.push(["", "", "", "", "", "", "Summary", "", ""]);
    sheetData.push([
      "",
      "",
      "",
      "",
      "",
      "",
      "Subtotal",
      "",
      subTotal.toFixed(2),
    ]);
    sheetData.push([
      "",
      "",
      "",
      "",
      "",
      "",
      "Item Discount",
      "",
      totalItemDiscount.toFixed(2),
    ]);

    if (extraDiscountAmount > 0) {
      sheetData.push([
        "",
        "",
        "",
        "",
        "",
        "",
        `Extra Discount ${quotation.extraDiscountType === "percent" ? `(${quotation.extraDiscount}%)` : ""}`,
        "",
        extraDiscountAmount.toFixed(2),
      ]);
    }

    sheetData.push([
      "",
      "",
      "",
      "",
      "",
      "",
      "Tax (if any)",
      "",
      totalTax.toFixed(2),
    ]);
    sheetData.push([
      "",
      "",
      "",
      "",
      "",
      "",
      "Shipping Charges",
      "",
      (quotation.shippingAmount || 0).toFixed(2),
    ]);
    sheetData.push(["", "", "", "", "", "", "GST", "", gstAmount.toFixed(2)]);
    sheetData.push([
      "",
      "",
      "",
      "",
      "",
      "",
      "Round Off",
      "",
      (quotation.roundOff || 0).toFixed(2),
    ]);
    sheetData.push([
      "",
      "",
      "",
      "",
      "",
      "",
      "GRAND TOTAL",
      "",
      finalTotal.toFixed(2),
    ]);

    // Create workbook
    const XLSX = require("xlsx"); // make sure it's imported at top if not already
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet(sheetData);

    // Column widths
    worksheet["!cols"] = [
      { wch: 6 }, // S.No
      { wch: 25 }, // Image
      { wch: 35 }, // Name
      { wch: 15 }, // Code
      { wch: 12 }, // MRP
      { wch: 12 }, // Discount
      { wch: 12 }, // Rate
      { wch: 8 }, // Qty
      { wch: 14 }, // Total
    ];

    XLSX.utils.book_append_sheet(workbook, worksheet, "Quotation");

    const buffer = XLSX.write(workbook, { bookType: "xlsx", type: "buffer" });

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=Quotation_${quotation.reference_number || id}${version ? `_v${version}` : ""}.xlsx`,
    );
    res.send(buffer);
  } catch (error) {
    console.error("Export error:", error);
    res
      .status(500)
      .json({ message: "Failed to export quotation", error: error.message });
  }
};

// CLONE QUOTATION – now includes floors & totalFloors
exports.cloneQuotation = async (req, res) => {
  try {
    const original = await Quotation.findByPk(req.params.id);
    if (!original)
      return res.status(404).json({ message: "Quotation not found" });

    const originalItems = await QuotationItem.findOne({
      quotationId: req.params.id,
    });
    const newId = uuidv4();

    const cloned = await Quotation.create({
      quotationId: newId,
      document_title: `${original.document_title} (Copy)`,
      quotation_date: new Date(),
      due_date: original.due_date,
      reference_number: await generateQuotationNumber(), // better to generate new number
      customerId: original.customerId,
      createdBy: req.user.userId,
      shipTo: original.shipTo,
      extraDiscount: original.extraDiscount,
      extraDiscountType: original.extraDiscountType,
      discountAmount: original.discountAmount,
      shippingAmount: original.shippingAmount,
      gst: original.gst,
      products: original.products,
      floors: original.floors || [], // ← new
      totalFloors: original.totalFloors || 0, // ← new
      roundOff: original.roundOff,
      finalAmount: original.finalAmount,
      signature_name: original.signature_name,
      signature_image: original.signature_image,
      followupDates: original.followupDates,
    });

    if (originalItems && Array.isArray(originalItems.items)) {
      await QuotationItem.create({
        quotationId: newId,
        items: originalItems.items.map((i) => ({ ...i })),
      });
    }

    await sendNotification({
      userId: req.user.userId,
      title: "Quotation Cloned",
      message: `Quotation "${original.document_title}" cloned as "${cloned.document_title}".`,
    });

    res.status(201).json({
      message: "Quotation cloned successfully",
      clonedQuotation: cloned,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to clone quotation", error: error.message });
  }
};

// RESTORE VERSION – now restores floors & totalFloors
exports.restoreQuotationVersion = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { id, version } = req.params;

    const versionData = await QuotationVersion.findOne({
      quotationId: id,
      version: Number(version),
    });
    if (!versionData) {
      await t.rollback();
      return res.status(404).json({ message: "Version not found" });
    }

    await Quotation.update(
      {
        ...versionData.quotationData,
        floors: versionData.floors || [], // ← restored
        totalFloors: versionData.totalFloors || 0, // ← restored
      },
      { where: { quotationId: id }, transaction: t },
    );

    if (versionData.quotationItems?.length > 0) {
      await QuotationItem.updateOne(
        { quotationId: id },
        { $set: { items: versionData.quotationItems } },
        { upsert: true },
      );
    } else {
      await QuotationItem.deleteOne({ quotationId: id });
    }

    await t.commit();

    await sendNotification({
      userId: req.user.userId,
      title: "Quotation Restored",
      message: `Quotation "${id}" restored to version ${version}.`,
    });

    res
      .status(200)
      .json({ message: `Quotation restored to version ${version}` });
  } catch (error) {
    await t.rollback();
    res
      .status(500)
      .json({ error: "Failed to restore quotation", details: error.message });
  }
};
// Get a single quotation by ID with items
exports.getQuotationById = async (req, res) => {
  try {
    const quotation = await Quotation.findByPk(req.params.id);
    if (!quotation) {
      return res.status(404).json({ message: "Quotation not found" });
    }

    const mongoDoc = await QuotationItem.findOne({
      quotationId: req.params.id,
    });
    const items = mongoDoc?.items || [];

    // Group for frontend convenience
    const grouped = {};
    items.forEach((item) => {
      const gid = item.groupId || "ungrouped";
      if (!grouped[gid]) grouped[gid] = { main: null, options: [] };
      if (!item.isOptionFor) {
        grouped[gid].main = item;
      } else {
        grouped[gid].options.push(item);
      }
    });

    const groupedItems = Object.values(grouped);

    const calculated = calculateTotals(
      items,
      quotation.extraDiscount,
      quotation.extraDiscountType,
      quotation.shippingAmount,
      quotation.gst,
    );

    res.status(200).json({
      ...quotation.toJSON(),
      items,
      groupedItems,
      calculated,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get all quotations with their items

exports.getAllQuotations = async (req, res) => {
  try {
    // ─────────────────────────────────────────────
    // Pagination parameters
    // ─────────────────────────────────────────────
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const offset = (page - 1) * limit;

    // ─────────────────────────────────────────────
    // Build dynamic WHERE clause
    // ─────────────────────────────────────────────
    const where = {};

    // Search filter (case-insensitive via LIKE on common collation)
    const search = req.query.search?.trim();
    if (search) {
      const searchTerm = `%${search}%`;
      where[Op.or] = [
        { document_title: { [Op.like]: searchTerm } },
        { reference_number: { [Op.like]: searchTerm } },
        // You can easily add more searchable fields here:
        // { customer_notes: { [Op.like]: searchTerm } },
      ];
    }

    // Customer filter
    if (req.query.customerId) {
      where.customerId = req.query.customerId;
    }

    // Status filter
    if (req.query.status) {
      where.status = req.query.status;
    }

    // Date range filter: ?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
    if (req.query.startDate || req.query.endDate) {
      where.quotation_date = {};
      if (req.query.startDate) {
        where.quotation_date[Op.gte] = req.query.startDate;
      }
      if (req.query.endDate) {
        where.quotation_date[Op.lte] = req.query.endDate;
      }
    }

    // ─────────────────────────────────────────────
    // Fetch paginated quotations (PostgreSQL → MySQL compatible)
    // ─────────────────────────────────────────────
    const { count: totalQuotations, rows: quotations } =
      await Quotation.findAndCountAll({
        where,
        offset,
        limit,
        order: [["quotation_date", "DESC"]], // or [['createdAt', 'DESC']]
        subQuery: false,
      });

    // If no results → early return with empty array
    if (quotations.length === 0) {
      return res.status(200).json({
        data: [],
        pagination: {
          total: totalQuotations,
          page,
          limit,
          totalPages: Math.ceil(totalQuotations / limit),
        },
      });
    }

    // ─────────────────────────────────────────────
    // Enrich with MongoDB items (your hybrid setup)
    // ─────────────────────────────────────────────
    const quotationIds = quotations.map((q) => q.quotationId);

    const mongoItems = await QuotationItem.find({
      quotationId: { $in: quotationIds },
    }).lean();

    // Build lookup: quotationId → items array
    const itemsMap = {};
    mongoItems.forEach((itemDoc) => {
      itemsMap[itemDoc.quotationId] = itemDoc.items || [];
    });

    // Merge items into SQL quotations
    const enrichedQuotations = quotations.map((q) => {
      const plain = q.toJSON();
      return {
        ...plain,
        items: itemsMap[plain.quotationId] || [],
      };
    });

    const totalPages = Math.ceil(totalQuotations / limit);

    // ─────────────────────────────────────────────
    // Final response
    // ─────────────────────────────────────────────
    return res.status(200).json({
      data: enrichedQuotations,
      pagination: {
        total: totalQuotations,
        page,
        limit,
        totalPages,
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error fetching quotations",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};
// Delete a quotation and its items
exports.deleteQuotation = async (req, res) => {
  try {
    const quotation = await Quotation.findByPk(req.params.id);
    if (!quotation) {
      return res.status(404).json({ message: "Quotation not found" });
    }
    // Check if user is admin or the creator
    if (
      !req.user.roles.includes("ADMIN") &&
      req.user.userId !== quotation.createdBy
    ) {
      return res.status(403).json({
        message:
          "Unauthorized: Only admins or the creator can delete this quotation",
      });
    }
    await Quotation.destroy({
      where: { quotationId: req.params.id },
    });
    await QuotationItem.deleteOne({ quotationId: req.params.id });
    res.status(200).json({ message: "Quotation deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
exports.getQuotationVersions = async (req, res) => {
  try {
    const { id } = req.params;

    const versions = await QuotationVersion.find({ quotationId: id })
      .sort({ version: -1 }) // ← NEWEST FIRST (critical for UX)
      .lean(); // ← Important: removes Mongoose wrappers

    if (!versions || versions.length === 0) {
      return res.status(404).json({ message: "No versions found" });
    }

    // Transform to clean, predictable shape
    const cleanedVersions = versions.map((v) => ({
      version: v.version,
      updatedBy: v.updatedBy || "Unknown",
      updatedAt: v.updatedAt,
      // Use saved PostgreSQL data if available, fallback to stored
      finalAmount: v.quotationData?.finalAmount || 0,
      document_title: v.quotationData?.document_title || "Untitled Quotation",
      customerId: v.quotationData?.customerId,
      quotation_date: v.quotationData?.quotation_date,
      // Items count
      itemCount: (v.quotationItems || []).length,
      // Full data for restore
      quotationData: v.quotationData,
      quotationItems: v.quotationItems || [],
    }));

    res.status(200).json(cleanedVersions);
  } catch (error) {
    res.status(500).json({
      error: "Failed to retrieve versions",
      details: error.message,
    });
  }
};
