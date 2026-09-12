const { Quotation } = require("../../../models");
const QuotationVersion = require("../models/quotation-version.model");
const QuotationItem = require("../models/quotation-item.model");

/**
 * Create a new version snapshot before update.
 * Non-fatal – errors are logged but do not abort the main flow.
 */
async function createVersionSnapshot(id, req, transaction) {
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
      transaction,
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

  return newVersionNumber;
}

module.exports = {
  createVersionSnapshot,
};
