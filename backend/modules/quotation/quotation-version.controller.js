const { Quotation } = require("../models");
const QuotationItem = require("../models/quotationItem");
const QuotationVersion = require("../models/quotationVersion");
const sequelize = require("../config/database");
const { sendNotification } = require("./notificationController");

// RESTORE VERSION – restores floors & totalFloors too
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
        floors: versionData.floors || [],
        totalFloors: versionData.totalFloors || 0,
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

// List all saved versions of a quotation (newest first)
exports.getQuotationVersions = async (req, res) => {
  try {
    const { id } = req.params;

    const versions = await QuotationVersion.find({ quotationId: id })
      .sort({ version: -1 })
      .lean();

    if (!versions || versions.length === 0) {
      return res.status(404).json({ message: "No versions found" });
    }

    const cleanedVersions = versions.map((v) => ({
      version: v.version,
      updatedBy: v.updatedBy || "Unknown",
      updatedAt: v.updatedAt,
      finalAmount: v.quotationData?.finalAmount || 0,
      document_title: v.quotationData?.document_title || "Untitled Quotation",
      customerId: v.quotationData?.customerId,
      quotation_date: v.quotationData?.quotation_date,
      itemCount: (v.quotationItems || []).length,
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
