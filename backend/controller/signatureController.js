const Signature = require("../models/signature");
const User = require("../models/users");
const fs = require("fs");

// 📌 Create a Signature
exports.createSignature = async (req, res) => {
  try {
    const { signature_name, mark_as_default, userId } = req.body;
    if (!req.file) {
      return res.status(400).json({ error: "Signature image is required" });
    }

    // Convert file to Buffer (binary format)
    const signature_image = fs.readFileSync(req.file.path);

    const signature = await Signature.create({
      signature_name,
      signature_image,
      mark_as_default,
      userId,
    });

    res.status(201).json({ message: "Signature created successfully", signature });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 📌 Get All Signatures
exports.getAllSignatures = async (req, res) => {
  try {
    const signatures = await Signature.findAll({
      include: [{ model: User, attributes: ["id", "name", "email"] }],
    });

    res.status(200).json(signatures);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 📌 Get Signature by ID
exports.getSignatureById = async (req, res) => {
  try {
    const { id } = req.params;
    const signature = await Signature.findByPk(id, {
      include: [{ model: User, attributes: ["id", "name", "email"] }],
    });

    if (!signature) {
      return res.status(404).json({ error: "Signature not found" });
    }

    res.status(200).json(signature);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 📌 Delete a Signature
exports.deleteSignature = async (req, res) => {
  try {
    const { id } = req.params;
    const signature = await Signature.findByPk(id);

    if (!signature) {
      return res.status(404).json({ error: "Signature not found" });
    }

    await signature.destroy();
    res.status(200).json({ message: "Signature deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
