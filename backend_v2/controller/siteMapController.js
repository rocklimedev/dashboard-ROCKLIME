// controllers/siteMapController.js
const SiteMap = require("../models/siteMap");
const Quotation = require("../models/quotation");
const sequelize = require("../config/database");
const Product = require("../models/product");
const Customer = require("../models/customers");
const { Op } = require("sequelize");
const { v4: uuidv4 } = require("uuid");

// Helper: Recompute summaries + pagination logic
const computeSummaries = (items, floorDetails) => {
  const perFloor = {};
  const perType = {};
  const concealed = {
    overall: { qty: 0, amount: 0, items: 0 },
    perFloor: {},
    perRoom: {},
    byCategory: {},
  };

  let overall = {
    totalItems: 0,
    totalQty: 0,
    totalAmount: 0,
    totalWithGST: 0,
    visible: { qty: 0, amount: 0, items: 0 },
    concealed: concealed.overall,
  };

  items.forEach((item) => {
    const floor = item.floor_number?.toString() || "Unassigned";
    const roomKey = item.room_id ? `${floor}-${item.room_id}` : floor;
    const type = item.productType || "Others";

    const amount = item.quantity * item.price;

    // Overall
    overall.totalQty += item.quantity;
    overall.totalAmount += amount;
    overall.totalItems += 1;

    if (item.isConcealed) {
      overall.concealed.qty += item.quantity;
      overall.concealed.amount += amount;
      overall.concealed.items += 1;
    } else {
      overall.visible.qty += item.quantity;
      overall.visible.amount += amount;
      overall.visible.items += 1;
    }

    // Per Floor
    if (!perFloor[floor]) {
      const floorInfo = floorDetails.find(
        (f) => f.floor_number === item.floor_number
      );
      perFloor[floor] = {
        floorName: floorInfo?.floor_name || floor,
        qty: 0,
        amount: 0,
        items: 0,
        visible: { qty: 0, amount: 0, items: 0 },
        concealed: { qty: 0, amount: 0, items: 0 },
      };
    }
    perFloor[floor].qty += item.quantity;
    perFloor[floor].amount += amount;
    perFloor[floor].items += 1;

    if (item.isConcealed) {
      perFloor[floor].concealed.qty += item.quantity;
      perFloor[floor].concealed.amount += amount;
      perFloor[floor].concealed.items += 1;
    } else {
      perFloor[floor].visible.qty += item.quantity;
      perFloor[floor].visible.amount += amount;
      perFloor[floor].visible.items += 1;
    }

    // Concealed-only breakdowns
    if (item.isConcealed) {
      // By category
      const cat = item.concealedCategory || "others";
      if (!concealed.byCategory[cat]) {
        concealed.byCategory[cat] = { qty: 0, amount: 0, items: 0, name: cat };
      }
      concealed.byCategory[cat].qty += item.quantity;
      concealed.byCategory[cat].amount += amount;
      concealed.byCategory[cat].items += 1;

      // Per room (optional deep dive)
      if (item.room_id) {
        if (!concealed.perRoom[roomKey])
          concealed.perRoom[roomKey] = { qty: 0, amount: 0 };
        concealed.perRoom[roomKey].qty += item.quantity;
        concealed.perRoom[roomKey].amount += amount;
      }
    }

    // Existing perType logic...
    if (!perType[type])
      perType[type] = { qty: 0, amount: 0, items: 0, pages: 0 };
    perType[type].qty += item.quantity;
    perType[type].amount += amount;
    perType[type].items += 1;
    perType[type].pages = Math.ceil(perType[type].items / 10);
  });

  overall.totalWithGST = overall.totalAmount * 1.18;

  return {
    overall,
    perFloor,
    perType,
    concealed: {
      summary: concealed.overall,
      byCategory: concealed.byCategory,
      perFloor: Object.fromEntries(
        Object.entries(perFloor).map(([k, v]) => [k, v.concealed])
      ),
      // perRoom: concealed.perRoom
    },
  };
};
// Helper for nice floor names
function getOrdinal(n) {
  const s = ["th", "st", "nd", "rd"],
    v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}
const siteMapController = {
  // 1. Create New Site Map
  async createSiteMap(req, res) {
    const t = await sequelize.transaction();
    try {
      const {
        customerId,
        name,
        siteSizeInBHK,
        totalFloors = 1,
        floorDetails = [],
        items = [],
        quotationId = null,
      } = req.body;

      if (!customerId || !name) {
        return res
          .status(400)
          .json({ success: false, message: "customerId and name required" });
      }

      const customer = await Customer.findByPk(customerId);
      if (!customer)
        return res
          .status(404)
          .json({ success: false, message: "Customer not found" });

      // Auto-generate floorDetails if empty, including default rooms (optional: customize based on siteSizeInBHK)
      let finalFloorDetails = floorDetails.length > 0 ? floorDetails : [];
      if (finalFloorDetails.length === 0) {
        for (let i = 1; i <= totalFloors; i++) {
          const floorName =
            i === 1 ? "Ground Floor" : `${getOrdinal(i - 1)} Floor`;
          finalFloorDetails.push({
            floor_number: i,
            floor_name: floorName,
            floor_size: "",
            details: "",
            rooms: [], // Default empty; user can add rooms later
          });
        }
      }

      // Validate items' floor_number and room_id (optional: add stricter validation)
      items.forEach((item) => {
        if (item.floor_number) {
          const floor = finalFloorDetails.find(
            (f) => f.floor_number === item.floor_number
          );
          if (!floor)
            throw new Error(`Invalid floor_number: ${item.floor_number}`);
          if (
            item.room_id &&
            !floor.rooms.find((r) => r.room_id === item.room_id)
          ) {
            throw new Error(
              `Invalid room_id: ${item.room_id} for floor ${item.floor_number}`
            );
          }
        }
      });

      const summaries = computeSummaries(items, finalFloorDetails);

      const siteMap = await SiteMap.create(
        {
          id: uuidv4(),
          customerId,
          name,
          siteSizeInBHK,
          totalFloors,
          floorDetails: finalFloorDetails,
          items,
          summaries,
          quotationId,
          status: quotationId ? "converted" : "draft",
        },
        { transaction: t }
      );

      // If linked to quotation at creation
      if (quotationId) {
        await Quotation.update(
          { siteMapId: siteMap.id },
          { where: { quotationId }, transaction: t }
        );
      }

      await t.commit();
      res.status(201).json({ success: true, data: siteMap });
    } catch (error) {
      await t.rollback();
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // 2. Get All Site Maps for a Customer
  async getSiteMapsByCustomer(req, res) {
    try {
      const { customerId } = req.query;
      if (!customerId)
        return res
          .status(400)
          .json({ success: false, message: "customerId required" });

      const siteMaps = await SiteMap.findAll({
        where: { customerId },
        order: [["createdAt", "DESC"]],
      });

      res.json({ success: true, data: siteMaps });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // 3. Get Single Site Map (Full Details)
  async getSiteMapById(req, res) {
    try {
      const { id } = req.params;
      const siteMap = await SiteMap.findByPk(id, {
        include: [{ model: Customer, attributes: ["name", "mobileNumber"] }],
      });

      if (!siteMap)
        return res
          .status(404)
          .json({ success: false, message: "Site Map not found" });

      res.json({ success: true, data: siteMap });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // 4. Update Site Map
  async updateSiteMap(req, res) {
    const t = await sequelize.transaction();
    try {
      const { id } = req.params;
      const updates = req.body;

      const siteMap = await SiteMap.findByPk(id);
      if (!siteMap)
        return res.status(404).json({ success: false, message: "Not found" });

      // Recompute if items or floors changed
      if (updates.items || updates.floorDetails || updates.totalFloors) {
        const finalItems = updates.items || siteMap.items;
        const finalFloors = updates.floorDetails || siteMap.floorDetails;

        // Validate items' floor_number and room_id
        finalItems.forEach((item) => {
          if (item.floor_number) {
            const floor = finalFloors.find(
              (f) => f.floor_number === item.floor_number
            );
            if (!floor)
              throw new Error(`Invalid floor_number: ${item.floor_number}`);
            if (
              item.room_id &&
              !floor.rooms.find((r) => r.room_id === item.room_id)
            ) {
              throw new Error(
                `Invalid room_id: ${item.room_id} for floor ${item.floor_number}`
              );
            }
          }
        });

        updates.summaries = computeSummaries(finalItems, finalFloors);
      }

      await siteMap.update(updates, { transaction: t });

      // If quotation linked and sync requested
      if (siteMap.quotationId && updates.syncToQuotation) {
        await Quotation.update(
          {
            products: siteMap.items,
            finalAmount: siteMap.summaries.overall.totalAmount * 1.18,
          },
          { where: { quotationId: siteMap.quotationId }, transaction: t }
        );
      }

      await t.commit();
      res.json({ success: true, data: siteMap.reload() });
    } catch (error) {
      await t.rollback();
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // 5. Delete Site Map
  async deleteSiteMap(req, res) {
    const t = await sequelize.transaction();
    try {
      const { id } = req.params;
      const siteMap = await SiteMap.findByPk(id);

      if (!siteMap) return res.status(404).json({ success: false });

      if (siteMap.quotationId) {
        await Quotation.update(
          { siteMapId: null },
          { where: { quotationId: siteMap.quotationId }, transaction: t }
        );
      }

      await siteMap.destroy({ transaction: t });
      await t.commit();

      res.json({ success: true, message: "Site Map deleted" });
    } catch (error) {
      await t.rollback();
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // 6. Generate Quotation from Site Map
  async generateQuotationFromSiteMap(req, res) {
    const t = await sequelize.transaction();
    try {
      const { id } = req.params;
      const siteMap = await SiteMap.findByPk(id);
      if (!siteMap) return res.status(404).json({ success: false });

      const quotation = await Quotation.create(
        {
          quotationId: uuidv4(),
          customerId: siteMap.customerId,
          document_title: `${siteMap.name} - Site Based Quotation`,
          quotation_date: new Date(),
          due_date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // +15 days
          products: siteMap.items,
          finalAmount: siteMap.summaries.overall.totalWithGST,
          gst: 18,
          siteMapId: siteMap.id,
          createdBy: req.user?.userId || null,
        },
        { transaction: t }
      );

      await siteMap.update(
        { quotationId: quotation.quotationId, status: "converted" },
        { transaction: t }
      );
      await t.commit();

      res.json({
        success: true,
        quotationId: quotation.quotationId,
        data: quotation,
      });
    } catch (error) {
      await t.rollback();
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // 7. Attach Existing Site Map to Existing Quotation
  async attachToQuotation(req, res) {
    const t = await sequelize.transaction();
    try {
      const { siteMapId, quotationId } = req.body;

      await SiteMap.update(
        { quotationId },
        { where: { id: siteMapId }, transaction: t }
      );
      await Quotation.update(
        { siteMapId },
        { where: { quotationId }, transaction: t }
      );

      await t.commit();
      res.json({ success: true, message: "Site Map attached to quotation" });
    } catch (error) {
      await t.rollback();
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // 8. Detach Site Map from Quotation
  async detachFromQuotation(req, res) {
    const t = await sequelize.transaction();
    try {
      const { siteMapId } = req.body;

      const siteMap = await SiteMap.findByPk(siteMapId);
      if (siteMap?.quotationId) {
        await Quotation.update(
          { siteMapId: null },
          { where: { quotationId: siteMap.quotationId }, transaction: t }
        );
        await siteMap.update(
          { quotationId: null, status: "draft" },
          { transaction: t }
        );
      }

      await t.commit();
      res.json({ success: true, message: "Detached successfully" });
    } catch (error) {
      await t.rollback();
      res.status(500).json({ success: false, error: error.message });
    }
  },
};

module.exports = siteMapController;
