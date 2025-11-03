const Address = require("../models/address");
const User = require("../models/users");
const Customer = require("../models/customers");
const { sendNotification } = require("./notificationController");
const { Op } = require("sequelize");
const { v4: uuidv4 } = require("uuid");

// ─────────────────────────────────────────────────────────────────────────────
// CREATE ADDRESS
// ─────────────────────────────────────────────────────────────────────────────
exports.createAddress = async (req, res) => {
  try {
    const {
      street,
      city,
      state,
      postalCode,
      country,
      userId,
      customerId,
      status,
    } = req.body;

    // ── 1. Required fields ───────────────────────────────────────────────
    if (!street || !city || !state || !country) {
      return res
        .status(400)
        .json({ message: "Street, city, state, and country are required" });
    }

    // ── 2. Exactly ONE of userId or customerId must be present ─────────────
    if ((userId && customerId) || (!userId && !customerId)) {
      return res.status(400).json({
        message: "Address must belong to exactly one: User or Customer",
      });
    }

    // ── 3. Validate the owner (User OR Customer) ───────────────────────────
    if (userId) {
      const user = await User.findByPk(userId);
      if (!user) return res.status(404).json({ message: "User not found" });
    }

    if (customerId) {
      const customer = await Customer.findByPk(customerId);
      if (!customer)
        return res.status(404).json({ message: "Customer not found" });
    }

    // ── 4. Determine status (especially for customers) ───────────────────
    let finalStatus = "ADDITIONAL";

    if (customerId) {
      const existing = await Address.findAll({
        where: { customerId },
        order: [["createdAt", "ASC"]],
      });

      if (existing.length === 0) {
        finalStatus = "BILLING";
      } else if (existing.length === 1) {
        finalStatus = "PRIMARY";
      } else if (["BILLING", "PRIMARY"].includes(status)) {
        // Demote any other address with same status
        await Address.update(
          { status: "ADDITIONAL" },
          { where: { customerId, status } }
        );
        finalStatus = status;
      }
    } else {
      // For users, allow any status (or default to ADDITIONAL)
      finalStatus = status || "ADDITIONAL";
    }

    // ── 5. Create address ─────────────────────────────────────────────────
    const address = await Address.create({
      addressId: uuidv4(),
      street,
      city,
      state,
      postalCode,
      country,
      status: finalStatus,
      userId: userId || null,
      customerId: customerId || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return res.status(201).json({
      message: "Address created successfully",
      addressId: address.addressId,
      data: address,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to create address",
      error: error.message,
    });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// UPDATE ADDRESS
// ─────────────────────────────────────────────────────────────────────────────
exports.updateAddress = async (req, res) => {
  try {
    const { addressId } = req.params;
    const {
      street,
      city,
      state,
      postalCode,
      country,
      userId,
      customerId,
      status,
    } = req.body;

    const address = await Address.findByPk(addressId);
    if (!address) return res.status(404).json({ message: "Address not found" });

    // ── Prevent changing ownership type (user ↔ customer) ─────────────────
    if (
      (userId && address.customerId) ||
      (customerId && address.userId) ||
      (userId && customerId)
    ) {
      return res.status(400).json({
        message:
          "Cannot change address ownership from User to Customer or vice versa",
      });
    }

    // ── Validate new owner if provided ─────────────────────────────────────
    if (userId && userId !== address.userId) {
      const user = await User.findByPk(userId);
      if (!user) return res.status(404).json({ message: "User not found" });
    }
    if (customerId && customerId !== address.customerId) {
      const customer = await Customer.findByPk(customerId);
      if (!customer)
        return res.status(404).json({ message: "Customer not found" });
    }

    // ── Status logic for customer addresses ───────────────────────────────
    let finalStatus = status || address.status;

    if (address.customerId && ["BILLING", "PRIMARY"].includes(status)) {
      await Address.update(
        { status: "ADDITIONAL" },
        {
          where: {
            customerId: address.customerId,
            status,
            addressId: { [Op.ne]: addressId },
          },
        }
      );
      finalStatus = status;
    }

    // ── Update address ────────────────────────────────────────────────────
    await address.update({
      street: street || address.street,
      city: city || address.city,
      state: state || address.state,
      postalCode: postalCode || address.postalCode,
      country: country || address.country,
      status: finalStatus,
      userId: userId ?? address.userId,
      customerId: customerId ?? address.customerId,
      updatedAt: new Date(),
    });

    // ── Notification ──────────────────────────────────────────────────────
    const recipientId =
      userId || customerId || address.userId || address.customerId;
    await sendNotification({
      userId: recipientId,
      title: "Address Updated",
      message: `Your ${finalStatus} address was updated.`,
    });

    return res.json({
      message: "Address updated successfully",
      addressId: address.addressId,
      data: address,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to update address",
      error: error.message,
    });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// DELETE ADDRESS
// ─────────────────────────────────────────────────────────────────────────────
exports.deleteAddress = async (req, res) => {
  try {
    const { addressId } = req.params;
    const address = await Address.findByPk(addressId);
    if (!address) return res.status(404).json({ message: "Address not found" });

    const isCustomerAddress = !!address.customerId;
    const ownerId = address.userId || address.customerId;

    // ── Reassign BILLING/PRIMARY if deleting one ──────────────────────────
    if (isCustomerAddress && ["BILLING", "PRIMARY"].includes(address.status)) {
      const others = await Address.findAll({
        where: {
          customerId: address.customerId,
          addressId: { [Op.ne]: addressId },
        },
        order: [["createdAt", "ASC"]],
      });

      if (others.length > 0) {
        if (address.status === "BILLING") {
          await others[0].update({ status: "BILLING" });
        }
        if (address.status === "PRIMARY" && others.length > 1) {
          await others[1].update({ status: "PRIMARY" });
        }
      }
    }

    // ── Notification ──────────────────────────────────────────────────────
    await sendNotification({
      userId: ownerId,
      title: "Address Deleted",
      message: `Your ${address.status} address was removed.`,
    });

    await address.destroy();

    return res.json({ message: "Address deleted successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Failed to delete address" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET ALL ADDRESSES (filter by userId OR customerId)
// ─────────────────────────────────────────────────────────────────────────────
exports.getAllAddresses = async (req, res) => {
  try {
    const { userId, customerId } = req.query;
    const where = {};

    if (userId) where.userId = userId;
    if (customerId) where.customerId = customerId;

    const addresses = await Address.findAll({
      where,
      include: [
        { model: User, as: "user", attributes: ["userId", "name", "email"] },
        {
          model: Customer,
          as: "customer",
          attributes: ["customerId", "name", "email"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    return res.json(addresses);
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch addresses" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET ADDRESS BY ID
// ─────────────────────────────────────────────────────────────────────────────
exports.getAddressById = async (req, res) => {
  try {
    const { addressId } = req.params;
    const address = await Address.findByPk(addressId, {
      include: [
        { model: User, as: "user", attributes: ["userId", "name", "email"] },
        {
          model: Customer,
          as: "customer",
          attributes: ["customerId", "name", "email"],
        },
      ],
    });

    if (!address) return res.status(404).json({ message: "Address not found" });

    return res.json(address);
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch address" });
  }
};
// ─────────────────────────────────────────────────────────────────────────────
// GET ALL USER ADDRESSES
// ─────────────────────────────────────────────────────────────────────────────
exports.getAllUserAddresses = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ["userId", "name", "email"],
      include: [
        {
          model: Address,
          as: "addresses", // must match association alias
          attributes: [
            "addressId",
            "street",
            "city",
            "state",
            "postalCode",
            "country",
            "status",
            "createdAt",
          ],
          where: { userId: { [Op.ne]: null } },
          required: false,
        },
      ],
      order: [[{ model: Address, as: "addresses" }, "createdAt", "DESC"]],
    });

    return res.json({
      message: "Fetched all user addresses successfully",
      data: users,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch user addresses",
      error: error.message,
    });
  }
};
// ─────────────────────────────────────────────────────────────────────────────
// GET ALL CUSTOMER ADDRESSES
// ─────────────────────────────────────────────────────────────────────────────
exports.getAllCustomerAddresses = async (req, res) => {
  try {
    const customers = await Customer.findAll({
      attributes: ["customerId", "name", "email"],
      include: [
        {
          model: Address,
          as: "addresses", // must match association alias
          attributes: [
            "addressId",
            "street",
            "city",
            "state",
            "postalCode",
            "country",
            "status",
            "createdAt",
          ],
          where: { customerId: { [Op.ne]: null } },
          required: false,
        },
      ],
      order: [[{ model: Address, as: "addresses" }, "createdAt", "DESC"]],
    });

    return res.json({
      message: "Fetched all customer addresses successfully",
      data: customers,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch customer addresses",
      error: error.message,
    });
  }
};
