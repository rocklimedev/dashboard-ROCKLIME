const XLSX = require("xlsx");
const { Quotation } = require("../models");
const QuotationItem = require("../models/quotationItem");
const QuotationVersion = require("../models/quotationVersion");
const { calculateTotals } = require("../services/quotationCalculation.service");

// EXPORT TO EXCEL – grouped by floor → room
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

    // We still calculate totals from main (non-optional) items.
    // NOTE: calculateTotals does not return an `itemTax` field (line-item
    // tax isn't summed anywhere in the totals service), so `totalTax`
    // is defaulted to 0 here rather than destructured as undefined —
    // the original controller destructured a non-existent `itemTax` key,
    // which would have thrown when `.toFixed()` was later called on it.
    const { subTotal, totalItemDiscount, extraDiscountAmount, gstAmount } =
      calculateTotals(
        quotationItems,
        quotation.extraDiscount || 0,
        quotation.extraDiscountType || "percent",
        quotation.shippingAmount || 0,
        quotation.gst || 0,
      );
    const totalTax = 0;

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
      const sortedRoomKeys = Object.keys(rooms);

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

        const roomItems = rooms[roomKey].sort(
          (a, b) => (b.priority ?? 0) - (a.priority ?? 0),
        );
        roomItems.forEach((p) => {
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
            Number(p.price * (1 + (p.discount || 0) / 100))?.toFixed(2) || "—",
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
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet(sheetData);

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
    res
      .status(500)
      .json({ message: "Failed to export quotation", error: error.message });
  }
};
