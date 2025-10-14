const Address = require("../models/address");
const User = require("../models/users");
const Customer = require("../models/customers");
const { sendNotification } = require("./notificationController");
const { Op } = require("sequelize");

// Create a new address
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

    // Validate userId if provided
    if (userId) {
      const user = await User.findByPk(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
    }

    // Validate customerId if provided
    if (customerId) {
      const customer = await Customer.findByPk(customerId);
      if (!customer) {
        return res.status(404).json({ message: "Customer not found" });
      }
    }

    // Require at least one of userId or customerId
    if (!userId && !customerId) {
      return res
        .status(400)
        .json({ message: "Either userId or customerId is required" });
    }

    let finalStatus = status || "ADDITIONAL";

    // Enforce status rules for customer addresses
    if (customerId) {
      const existingAddresses = await Address.findAll({
        where: { customerId },
        order: [["createdAt", "ASC"]],
      });

      if (existingAddresses.length === 0) {
        finalStatus = "BILLING";
      } else if (existingAddresses.length === 1) {
        finalStatus = "PRIMARY";
      } else if (status === "BILLING" || status === "PRIMARY") {
        await Address.update(
          { status: "ADDITIONAL" },
          { where: { customerId, status } }
        );
        finalStatus = status;
      }
    }

    // Create address
    const address = await Address.create({
      addressId: require("uuid").v4(),
      street,
      city,
      state,
      postalCode,
      country,
      status: finalStatus,
      userId,
      customerId,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Send notification
    const recipientId =
      userId || customerId || "56a3ba45-0557-47ac-bb5d-409f93d6661d";
    const recipientType = userId ? "User" : "Customer";
    await sendNotification({
      userId: recipientId,
      title: "New Address Created",
      message: `A new ${finalStatus} address has been added: ${street}, ${city}, ${state}, ${postalCode}, ${country}`,
    });

    res.status(201).json({
      message: "Address created successfully",
      addressId: address.addressId,
      data: address,
    });
  } catch (error) {
    console.error("Error in createAddress:", error);
    res.status(500).json({
      message: `Failed to create address: ${
        error.message || "Unknown server error"
      }`,
    });
  }
};

// Update an address
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

    // Find address
    const address = await Address.findByPk(addressId);
    if (!address) {
      return res.status(404).json({ message: "Address not found" });
    }

    // Validate userId if provided
    if (userId) {
      const user = await User.findByPk(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
    }

    // Validate customerId if provided
    if (customerId) {
      const customer = await Customer.findByPk(customerId);
      if (!customer) {
        return res.status(404).json({ message: "Customer not found" });
      }
    }

    let finalStatus = status || address.status;

    // Enforce status rules for customer addresses
    if (
      customerId &&
      status &&
      (status === "BILLING" || status === "PRIMARY")
    ) {
      await Address.update(
        { status: "ADDITIONAL" },
        {
          where: {
            customerId,
            status,
            addressId: { [Op.ne]: addressId },
          },
        }
      );
      finalStatus = status;
    }

    // Update address
    await address.update({
      street,
      city,
      state,
      postalCode,
      country,
      status: finalStatus,
      userId,
      customerId,
      updatedAt: new Date(),
    });

    // Send notification
    const recipientId =
      userId ||
      customerId ||
      address.customerId ||
      "56a3ba45-0557-47ac-bb5d-409f93d6661d";
    const recipientType = userId || address.userId ? "User" : "Customer";
    await sendNotification({
      userId: recipientId,
      title: "Address Updated",
      message: `Your ${finalStatus} address has been updated: ${street}, ${city}, ${state}, ${postalCode}, ${country}`,
    });

    res.json({
      message: "Address updated successfully",
      addressId: address.addressId,
      data: address,
    });
  } catch (error) {
    console.error("Error in updateAddress:", error);
    res.status(500).json({
      message: `Failed to update address: ${
        error.message || "Unknown server error"
      }`,
    });
  }
};

// Delete an address
exports.deleteAddress = async (req, res) => {
  try {
    const { addressId } = req.params;

    const address = await Address.findByPk(addressId);
    if (!address) {
      return res.status(404).json({ message: "Address not found" });
    }

    // Reassign statuses if deleting BILLING or PRIMARY
    if (
      address.customerId &&
      (address.status === "BILLING" || address.status === "PRIMARY")
    ) {
      const remainingAddresses = await Address.findAll({
        where: {
          customerId: address.customerId,
          addressId: { [Op.ne]: addressId },
        },
        order: [["createdAt", "ASC"]],
      });

      if (remainingAddresses.length > 0) {
        if (address.status === "BILLING") {
          await remainingAddresses[0].update({ status: "BILLING" });
        }
        if (address.status === "PRIMARY" && remainingAddresses.length > 1) {
          await remainingAddresses[1].update({ status: "PRIMARY" });
        }
      }
    }

    // Send notification
    const recipientId =
      address.userId ||
      address.customerId ||
      "56a3ba45-0557-47ac-bb5d-409f93d6661d";
    const recipientType = address.userId ? "User" : "Customer";
    await sendNotification({
      userId: recipientId,
      title: "Address Deleted",
      message: `Your ${address.status} address has been deleted: ${address.street}, ${address.city}, ${address.state}, ${address.postalCode}, ${address.country}`,
    });

    await address.destroy();

    res.json({ message: "Address deleted successfully" });
  } catch (error) {
    console.error("Error in deleteAddress:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Get all addresses
exports.getAllAddresses = async (req, res) => {
  try {
    const { userId, customerId } = req.query;
    const where = {};
    if (userId) where.userId = userId;
    if (customerId) where.customerId = customerId;

    const addresses = await Address.findAll({
      where,
      include: [
        { model: User, attributes: ["userId", "name", "email"] },
        { model: Customer, attributes: ["customerId", "name", "email"] },
      ],
    });
    res.json(addresses);
  } catch (error) {
    console.error("Error in getAllAddresses:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Get a specific address by ID
exports.getAddressById = async (req, res) => {
  try {
    const { addressId } = req.params;
    const address = await Address.findByPk(addressId, {
      include: [
        { model: User, attributes: ["userId", "name", "email"] },
        { model: Customer, attributes: ["customerId", "name", "email"] },
      ],
    });

    if (!address) {
      return res.status(404).json({ message: "Address not found" });
    }

    res.json(address);
  } catch (error) {
    console.error("Error in getAddressById:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
