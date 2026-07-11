const { Quotation } = require("../models");
const QuotationItem = require("../models/quotationItem");
const logActivity = require("../utils/activityLogger");

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

    await logActivity({
      userId: req.user?.userId,
      contextTag: "SALES",
      subContext: "QUOTATION",
      action: "DELETE_QUOTATION",
      entityId: quotation.quotationId,
      entityName: quotation.reference_number || quotation.quotationId,
      description: `Quotation ${quotation.reference_number || quotation.quotationId} deleted`,
      oldValues: {
        quotationId: quotation.quotationId,
        referenceNumber: quotation.reference_number,
        createdBy: quotation.createdBy,
        customerId: quotation.customerId,
      },
      metadata: {
        deletionType: "HARD_DELETE",
        isAdminAction: req.user.roles.includes("ADMIN"),
        isOwnerAction: req.user.userId === quotation.createdBy,
        warning: "Quotation permanently deleted",
        hasMongoCleanup: true,
      },
      req,
    });

    res.status(200).json({ message: "Quotation deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
