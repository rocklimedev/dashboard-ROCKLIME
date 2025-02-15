const Address = require("../models/address");
const User = require("../models/users");

// Create a new address
exports.createAddress = async (req, res) => {
  try {
    const { street, city, state, postalCode, country, userId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: "User ID is required." });
    }

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const address = await Address.create({
      street,
      city,
      state,
      postalCode,
      country,
      userId,
    });

    res.status(201).json(address);
  } catch (error) {
    console.error("Error creating address:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Get all addresses
exports.getAllAddresses = async (req, res) => {
  try {
    const addresses = await Address.findAll({ include: User });
    res.json(addresses);
  } catch (error) {
    console.error("Error fetching addresses:", error);
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
    console.error("Error fetching address:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Update an address
exports.updateAddress = async (req, res) => {
  try {
    const { addressId } = req.params;
    const { street, city, state, postalCode, country } = req.body;

    const address = await Address.findByPk(addressId);
    if (!address) {
      return res.status(404).json({ message: "Address not found." });
    }

    await address.update({ street, city, state, postalCode, country });

    res.json({ message: "Address updated successfully.", address });
  } catch (error) {
    console.error("Error updating address:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

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
    console.error("Error deleting address:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
