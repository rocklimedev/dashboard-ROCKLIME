const axios = require("axios");
const path = require("path");
const { Vendor, User, Customer, Signature } = require("../models");
const FormData = require("form-data");
const { validate: isUUID } = require("uuid");

/* ---------------------------------------------
   📌 FETCH ALL SIGNATURES
--------------------------------------------- */
exports.getAllSignatures = async (req, res) => {
  try {
    const signatures = await Signature.findAll({
      include: [
        { model: User, attributes: ["userId", "name", "email"] },
        { model: Customer, attributes: ["customerId", "name", "email"] },
        { model: Vendor, attributes: ["id", "vendorName", "vendorId"] },
      ],
    });
    res.status(200).json(signatures);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch signatures" });
  }
};

/* ---------------------------------------------
   📌 FETCH SIGNATURE BY ID
--------------------------------------------- */
exports.getSignatureById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isUUID(id))
      return res.status(400).json({ error: "Invalid signature ID" });

    const signature = await Signature.findByPk(id, {
      include: [
        { model: User, attributes: ["userId", "name", "email"] },
        { model: Customer, attributes: ["customerId", "name", "email"] },
        { model: Vendor, attributes: ["id", "vendorName", "vendorId"] },
      ],
    });

    if (!signature)
      return res.status(404).json({ error: "Signature not found" });

    res.status(200).json(signature);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch signature" });
  }
};

/* ---------------------------------------------
   📌 FETCH SIGNATURES BY USER
--------------------------------------------- */
exports.getSignaturesByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!isUUID(userId))
      return res.status(400).json({ error: "Invalid userId" });

    const signatures = await Signature.findAll({
      where: { userId },
      include: [{ model: User, attributes: ["userId", "name", "email"] }],
    });

    res.status(200).json(signatures);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch user signatures" });
  }
};

/* ---------------------------------------------
   📌 FETCH SIGNATURES BY CUSTOMER
--------------------------------------------- */
exports.getSignaturesByCustomer = async (req, res) => {
  try {
    const { customerId } = req.params;
    if (!isUUID(customerId))
      return res.status(400).json({ error: "Invalid customerId" });

    const signatures = await Signature.findAll({
      where: { customerId },
      include: [
        { model: Customer, attributes: ["customerId", "name", "email"] },
      ],
    });

    res.status(200).json(signatures);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch customer signatures" });
  }
};

/* ---------------------------------------------
   📌 FETCH SIGNATURES BY VENDOR
--------------------------------------------- */
exports.getSignaturesByVendor = async (req, res) => {
  try {
    const { vendorId } = req.params;
    if (!isUUID(vendorId))
      return res.status(400).json({ error: "Invalid vendorId" });

    const signatures = await Signature.findAll({
      where: { vendorId },
      include: [
        { model: Vendor, attributes: ["id", "vendorName", "vendorId"] },
      ],
    });

    res.status(200).json(signatures);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch vendor signatures" });
  }
};

/* ---------------------------------------------
   📌 CREATE SIGNATURE (same as before)
--------------------------------------------- */
exports.createSignature = async (req, res) => {
  try {
    const { signature_name, mark_as_default, userId, customerId, vendorId } =
      req.body;

    if (!signature_name)
      return res.status(400).json({ error: "Signature name is required" });
    if (mark_as_default === undefined)
      return res.status(400).json({ error: "Mark as default is required" });
    if (!req.file)
      return res.status(400).json({ error: "Signature image is required" });

    if (userId && !isUUID(userId))
      return res.status(400).json({ error: "Invalid userId format" });
    if (customerId && !isUUID(customerId))
      return res.status(400).json({ error: "Invalid customerId format" });
    if (vendorId && !isUUID(vendorId))
      return res.status(400).json({ error: "Invalid vendorId format" });

    const markAsDefault =
      mark_as_default === "true" ||
      mark_as_default === true ||
      mark_as_default === "1";

    let userName = "anonymous";
    if (userId) {
      const user = await User.findByPk(userId);
      if (user) userName = user.name;
    }

    const fileExtension = path.extname(req.file.originalname).toLowerCase();
    const fileName = `${userName.replace(
      /\s+/g,
      "_"
    )}_${Date.now()}_signature${fileExtension}`;
    const formData = new FormData();
    formData.append("file", req.file.buffer, fileName);

    const uploadResponse = await axios.post(
      "https://static.cmtradingco.com/signatures",
      formData,
      { headers: { ...formData.getHeaders() } }
    );

    const imageUrl =
      uploadResponse.data.url ||
      uploadResponse.data.image_url ||
      uploadResponse.data.SIGNATUER_IAMGE;

    if (!imageUrl)
      return res.status(500).json({ error: "Failed to obtain image URL" });

    const signature = await Signature.create({
      signature_name,
      signature_image: imageUrl,
      mark_as_default: markAsDefault,
      userId: userId || null,
      customerId: customerId || null,
      vendorId: vendorId || null,
    });

    res.status(201).json({
      message: "Signature created successfully",
      signature,
    });
  } catch (error) {
    res
      .status(500)
      .json({ error: `Failed to create signature: ${error.message}` });
  }
};

/* ---------------------------------------------
   📌 UPDATE SIGNATURE (same, expanded for vendor/customer)
--------------------------------------------- */
exports.updateSignature = async (req, res) => {
  try {
    const { id } = req.params;
    const { signature_name, mark_as_default, userId, customerId, vendorId } =
      req.body;

    if (!isUUID(id))
      return res.status(400).json({ error: "Invalid signature ID" });

    const signature = await Signature.findByPk(id);
    if (!signature)
      return res.status(404).json({ error: "Signature not found" });

    const updatedFields = {
      signature_name: signature_name || signature.signature_name,
      userId: userId || signature.userId,
      customerId: customerId || signature.customerId,
      vendorId: vendorId || signature.vendorId,
    };

    if (mark_as_default !== undefined) {
      updatedFields.mark_as_default =
        mark_as_default === "true" ||
        mark_as_default === true ||
        mark_as_default === "1";
    }

    if (req.file) {
      const user = await User.findByPk(userId || signature.userId);
      const fileExtension = path.extname(req.file.originalname).toLowerCase();
      const fileName = `${user?.name?.replace(/\s+/g, "_") || "anon"}_${
        user?.userId || Date.now()
      }_signature${fileExtension}`;

      const formData = new FormData();
      formData.append("file", req.file.buffer, fileName);

      const uploadResponse = await axios.post(
        "https://static.cmtradingco.com/signatures",
        formData,
        { headers: { ...formData.getHeaders() } }
      );

      const imageUrl =
        uploadResponse.data.url ||
        uploadResponse.data.image_url ||
        uploadResponse.data.SIGNATUER_IAMGE;
      updatedFields.signature_image = imageUrl;
    }

    await signature.update(updatedFields);

    res
      .status(200)
      .json({ message: "Signature updated successfully", signature });
  } catch (error) {
    res
      .status(500)
      .json({ error: `Failed to update signature: ${error.message}` });
  }
};

/* ---------------------------------------------
   📌 SET A SIGNATURE AS DEFAULT FOR ENTITY
--------------------------------------------- */
exports.setDefaultSignature = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isUUID(id))
      return res.status(400).json({ error: "Invalid signature ID" });

    const signature = await Signature.findByPk(id);
    if (!signature)
      return res.status(404).json({ error: "Signature not found" });

    // Reset all existing defaults for same entity
    await Signature.update(
      { mark_as_default: false },
      {
        where: {
          [sequelize.Op.or]: [
            { userId: signature.userId },
            { customerId: signature.customerId },
            { vendorId: signature.vendorId },
          ],
        },
      }
    );

    signature.mark_as_default = true;
    await signature.save();

    res
      .status(200)
      .json({ message: "Default signature set successfully", signature });
  } catch (error) {
    res
      .status(500)
      .json({ error: `Failed to set default signature: ${error.message}` });
  }
};

/* ---------------------------------------------
   📌 FETCH DEFAULT SIGNATURE FOR ENTITY
--------------------------------------------- */
exports.getDefaultSignature = async (req, res) => {
  try {
    const { userId, customerId, vendorId } = req.query;

    const where = {};
    if (userId) where.userId = userId;
    if (customerId) where.customerId = customerId;
    if (vendorId) where.vendorId = vendorId;
    where.mark_as_default = true;

    const signature = await Signature.findOne({ where });
    if (!signature)
      return res.status(404).json({ error: "No default signature found" });

    res.status(200).json(signature);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch default signature" });
  }
};

/* ---------------------------------------------
   📌 DELETE ALL SIGNATURES FOR AN ENTITY
--------------------------------------------- */
exports.deleteAllSignaturesByEntity = async (req, res) => {
  try {
    const { userId, customerId, vendorId } = req.query;
    const where = {};

    if (userId) where.userId = userId;
    if (customerId) where.customerId = customerId;
    if (vendorId) where.vendorId = vendorId;

    const deleted = await Signature.destroy({ where });

    res.status(200).json({
      message: `${deleted} signatures deleted successfully for entity`,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete signatures for entity" });
  }
};
// 📌 Delete Single Signature (ERP internal use only)
exports.deleteSingleSignature = async (req, res) => {
  try {
    const { id } = req.params;
    const { userRole, userId } = req.user || {}; // from middleware/JWT (preferred)

    if (!isUUID(id)) {
      return res.status(400).json({ error: "Invalid signature ID" });
    }

    const signature = await Signature.findByPk(id);
    if (!signature) {
      return res.status(404).json({ error: "Signature not found" });
    }

    await signature.destroy();

    res.status(200).json({
      message: "Signature deleted successfully",
      deletedSignatureId: id,
    });
  } catch (error) {
    res.status(500).json({
      error: `Failed to delete signature: ${error.message}`,
    });
  }
};
