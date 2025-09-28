const Address = require("../models/address");
const User = require("../models/users");
const Customer = require("../models/customers");

// Create a new address
exports.createAddress = async (req, res) => {
  try {
    const { street, city, state, postalCode, country, userId, customerId } =
      req.body;

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

    // Create address
    const address = await Address.create({
      addressId: require("uuid").v4(),
      street,
      city,
      state,
      postalCode,
      country,
      userId,
      customerId,
      createdAt: new Date(),
      updatedAt: new Date(),
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
    const { street, city, state, postalCode, country, userId, customerId } =
      req.body;

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

    // Update address
    await address.update({
      street,
      city,
      state,
      postalCode,
      country,
      userId,
      customerId,
      updatedAt: new Date(),
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

// Delete an address
exports.deleteAddress = async (req, res) => {
  try {
    const { addressId } = req.params;

    const address = await Address.findByPk(addressId);
    if (!address) {
      return res.status(404).json({ message: "Address not found" });
    }

    await address.destroy();

    res.json({ message: "Address deleted successfully" });
  } catch (error) {
    console.error("Error in deleteAddress:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
