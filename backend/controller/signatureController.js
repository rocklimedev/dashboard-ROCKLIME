const Signature = require("../models/signature");
const User = require("../models/users");
const axios = require("axios");
const path = require("path");
const FormData = require("form-data");
const { validate: isUUID } = require("uuid");

// 📌 Get All Signatures
exports.getAllSignatures = async (req, res) => {
  try {
    const signatures = await Signature.findAll({
      include: [{ model: User, attributes: ["userId", "name", "email"] }],
    });

    res.status(200).json(signatures);
  } catch (error) {
    console.error("Error fetching signatures:", error.stack);
    res.status(500).json({ error: "Failed to fetch signatures" });
  }
};

// 📌 Get Signature by ID
exports.getSignatureById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isUUID(id)) {
      return res.status(400).json({ error: "Invalid signature ID" });
    }
    const signature = await Signature.findByPk(id, {
      include: [{ model: User, attributes: ["userId", "name", "email"] }],
    });

    if (!signature) {
      return res.status(404).json({ error: "Signature not found" });
    }

    res.status(200).json(signature);
  } catch (error) {
    console.error("Error fetching signature:", error.stack);
    res.status(500).json({ error: "Failed to fetch signature" });
  }
};

// 📌 Delete a Signature
exports.deleteSignature = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isUUID(id)) {
      return res.status(400).json({ error: "Invalid signature ID" });
    }
    const signature = await Signature.findByPk(id);

    if (!signature) {
      return res.status(404).json({ error: "Signature not found" });
    }

    await signature.destroy();
    res.status(200).json({ message: "Signature deleted successfully" });
  } catch (error) {
    console.error("Error deleting signature:", error.stack);
    res.status(500).json({ error: "Failed to delete signature" });
  }
};

// 📌 Create a Signature
exports.createSignature = async (req, res) => {
  try {
    const { signature_name, mark_as_default, userId } = req.body;

    // Validate inputs
    if (!signature_name || typeof signature_name !== "string") {
      return res.status(400).json({ error: "Signature name is required" });
    }
    if (mark_as_default === undefined) {
      return res.status(400).json({ error: "Mark as default is required" });
    }
    const markAsDefault =
      mark_as_default === "true" ||
      mark_as_default === true ||
      mark_as_default === "1";
    if (!userId || !isUUID(userId)) {
      return res.status(400).json({ error: "Valid user ID is required" });
    }
    if (!req.file) {
      return res.status(400).json({ error: "Signature image is required" });
    }

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const fileExtension = path.extname(req.file.originalname).toLowerCase();
    const fileName = `${user.name.replace(/\s+/g, "_")}_${
      user.userId
    }_signature${fileExtension}`;

    const formData = new FormData();
    formData.append("file", req.file.buffer, fileName);

    let uploadResponse;
    try {
      uploadResponse = await axios.post(
        "https://static.cmtradingco.com/signatures",
        formData,
        {
          headers: {
            ...formData.getHeaders(),
            "User-Agent": "Mozilla/5.0 (Node.js Axios)", // Mimic browser
          },
        }
      );
    } catch (uploadError) {
      console.error("Error uploading to external server:", {
        message: uploadError.message,
        status: uploadError.response?.status,
        response: uploadError.response?.data,
      });
      return res.status(500).json({
        error: `Failed to upload image: ${
          uploadError.response?.status === 403
            ? "Server rejected request (403 Forbidden)"
            : uploadError.message
        }`,
      });
    }

    if (uploadResponse.status !== 200 || !uploadResponse.data) {
      console.error("Invalid upload response:", uploadResponse.data);
      return res
        .status(500)
        .json({ error: "Invalid response from image server" });
    }

    // Handle potential field name variations
    const imageUrl =
      uploadResponse.data.url ||
      uploadResponse.data.image_url ||
      uploadResponse.data.SIGNATUER_IAMGE;
    if (typeof imageUrl !== "string") {
      console.error("Invalid image URL in response:", uploadResponse.data);
      return res.status(500).json({ error: "Image URL is missing or invalid" });
    }

    try {
      const signature = await Signature.create({
        signature_name,
        signature_image: imageUrl,
        mark_as_default: markAsDefault,
        userId,
      });
      res
        .status(201)
        .json({ message: "Signature created successfully", signature });
    } catch (dbError) {
      console.error("Database error creating signature:", dbError.stack);
      return res.status(500).json({
        error: `Failed to save signature to database: ${dbError.message}`,
      });
    }
  } catch (error) {
    console.error("Error creating signature:", error.stack);
    res
      .status(500)
      .json({ error: `Failed to create signature: ${error.message}` });
  }
};

// 📌 Update a Signature
exports.updateSignature = async (req, res) => {
  try {
    const { id } = req.params;
    const { signature_name, mark_as_default, userId } = req.body;

    if (!isUUID(id)) {
      return res.status(400).json({ error: "Invalid signature ID" });
    }

    const signature = await Signature.findByPk(id);
    if (!signature) {
      return res.status(404).json({ error: "Signature not found" });
    }

    const updatedFields = {
      signature_name: signature_name || signature.signature_name,
      userId: userId || signature.userId,
    };

    if (mark_as_default !== undefined) {
      const markAsDefault =
        mark_as_default === "true" ||
        mark_as_default === true ||
        mark_as_default === "1";
      updatedFields.mark_as_default = markAsDefault;
    } else {
      updatedFields.mark_as_default = signature.mark_as_default;
    }

    if (userId && !isUUID(userId)) {
      return res.status(400).json({ error: "Valid user ID is required" });
    }

    if (req.file) {
      const user = await User.findByPk(userId || signature.userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const fileExtension = path.extname(req.file.originalname).toLowerCase();
      const fileName = `${user.name.replace(/\s+/g, "_")}_${
        user.userId
      }_signature${fileExtension}`;

      const formData = new FormData();
      formData.append("file", req.file.buffer, fileName);

      let uploadResponse;
      try {
        uploadResponse = await axios.post(
          "https://static.cmtradingco.com/signatures",
          formData,
          {
            headers: {
              ...formData.getHeaders(),
              "User-Agent": "Mozilla/5.0 (Node.js Axios)",
            },
          }
        );
      } catch (uploadError) {
        console.error("Error uploading to external server:", {
          message: uploadError.message,
          status: uploadError.response?.status,
          response: uploadError.response?.data,
        });
        return res.status(500).json({
          error: `Failed to upload image: ${
            uploadError.response?.status === 403
              ? "Server rejected request (403 Forbidden)"
              : uploadError.message
          }`,
        });
      }

      if (uploadResponse.status !== 200 || !uploadResponse.data) {
        console.error("Invalid upload response:", uploadResponse.data);
        return res
          .status(500)
          .json({ error: "Invalid response from image server" });
      }

      const imageUrl =
        uploadResponse.data.url ||
        uploadResponse.data.image_url ||
        uploadResponse.data.SIGNATUER_IAMGE;
      if (typeof imageUrl !== "string") {
        console.error("Invalid image URL in response:", uploadResponse.data);
        return res
          .status(500)
          .json({ error: "Image URL is missing or invalid" });
      }

      updatedFields.signature_image = imageUrl;
    }

    try {
      await signature.update(updatedFields);
      res.status(200).json({
        message: "Signature updated successfully",
        signature,
      });
    } catch (dbError) {
      console.error("Database error updating signature:", dbError.stack);
      return res.status(500).json({
        error: `Failed to update signature in database: ${dbError.message}`,
      });
    }
  } catch (error) {
    console.error("Error updating signature:", error.stack);
    res
      .status(500)
      .json({ error: `Failed to update signature: ${error.message}` });
  }
};
