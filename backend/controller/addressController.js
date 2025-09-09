const Address = require("../models/address");
const User = require("../models/users");

// Create a new address
exports.createAddress = async (req, res) => {
  try {
    const { street, city, state, postalCode, country, userId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const address = await Address.create({
      street,
      city,
      state,
      postalCode,
      country,
      userId,
    });

    res.status(201).json({
      message: "Address created successfully",
      addressId: address.addressId,
      data: address,
    });
  } catch (error) {
    console.error("Error in createAddress:", error);
    res
      .status(500)
      .json({
        message: `Failed to create address: ${
          error.message || "Unknown server error"
        }`,
      });
  }
};

exports.updateAddress = async (req, res) => {
  try {
    const { addressId } = req.params;
    const { street, city, state, postalCode, country } = req.body;

    const address = await Address.findByPk(addressId);
    if (!address) {
      return res.status(404).json({ message: "Address not found" });
    }

    await address.update({ street, city, state, postalCode, country });

    res.json({
      message: "Address updated successfully",
      addressId: address.addressId,
      data: address,
    });
  } catch (error) {
    console.error("Error in updateAddress:", error);
    res
      .status(500)
      .json({
        message: `Failed to update address: ${
          error.message || "Unknown server error"
        }`,
      });
  }
};
// Get all addresses
exports.getAllAddresses = async (req, res) => {
  try {
    const addresses = await Address.findAll({ include: User });
    res.json(addresses);
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Get a specific address by ID
exports.getAddressById = async (req, res) => {
  try {
    const { addressId } = req.params;
    const address = await Address.findByPk(addressId, { include: User });

    if (!address) {
      return res.status(404).json({ message: "Address not found." });
    }

    res.json(address);
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Update an address

// Delete an address
exports.deleteAddress = async (req, res) => {
  try {
    const { addressId } = req.params;

    const address = await Address.findByPk(addressId);
    if (!address) {
      return res.status(404).json({ message: "Address not found." });
    }

    await address.destroy();

    res.json({ message: "Address deleted successfully." });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
};
