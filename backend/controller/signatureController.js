const Signature = require("../models/signature");
const User = require("../models/users");
const fs = require("fs");
const axios = require("axios");
const path = require("path");

// 📌 Get All Signatures
exports.getAllSignatures = async (req, res) => {
  try {
    const signatures = await Signature.findAll({
      include: [{ model: User, attributes: ["userId", "name", "email"] }],
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

// 📌 Create a Signature
exports.createSignature = async (req, res) => {
  try {
    const { signature_name, mark_as_default, userId } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: "Signature image is required" });
    }

    // Find the user to get their name for the file name
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Determine the file extension based on the file type (png or jpeg)
    const fileExtension = path.extname(req.file.originalname).toLowerCase();
    const fileName = `${user.name.replace(
      /\s+/g,
      "_"
    )}_signature${fileExtension}`;

    // Prepare FormData for the file upload to the external server
    const formData = new FormData();
    formData.append("file", req.file.buffer, fileName);

    // Upload the image to the remote server
    const uploadResponse = await axios.post(
      "https://static.cmtradingco.com/signatures",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

    if (uploadResponse.status !== 200) {
      return res.status(500).json({ error: "Image upload failed" });
    }

    const imageUrl = uploadResponse.data.url; // Assuming the URL is returned in the response

    const signature = await Signature.create({
      signature_name,
      signature_image: imageUrl, // Save the remote URL of the image
      mark_as_default,
      userId,
    });

    res
      .status(201)
      .json({ message: "Signature created successfully", signature });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 📌 Update a Signature
exports.updateSignature = async (req, res) => {
  try {
    const { id } = req.params;
    const { signature_name, mark_as_default, userId, signature_image } =
      req.body;

    const signature = await Signature.findByPk(id);
    if (!signature) {
      return res.status(404).json({ error: "Signature not found" });
    }

    const updatedFields = {
      signature_name: signature_name || signature.signature_name,
      mark_as_default:
        mark_as_default !== undefined
          ? mark_as_default
          : signature.mark_as_default,
      userId: userId || signature.userId,
    };

    // If new file is uploaded, upload it to the remote server
    if (req.file) {
      // Find the user to get their name for the file name
      const user = await User.findByPk(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Determine the file extension based on the file type (png or jpeg)
      const fileExtension = path.extname(req.file.originalname).toLowerCase();
      const fileName = `${user.name.replace(
        /\s+/g,
        "_"
      )}_signature${fileExtension}`;

      const formData = new FormData();
      formData.append("file", req.file.buffer, fileName);

      const uploadResponse = await axios.post(
        "https://static.cmtradingco.com/signatures",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (uploadResponse.status !== 200) {
        return res.status(500).json({ error: "Image upload failed" });
      }

      updatedFields.signature_image = uploadResponse.data.url; // Store the returned URL
    }

    // Optionally handle base64 image upload
    if (signature_image && !req.file) {
      const base64Data = signature_image.replace(
        /^data:image\/\w+;base64,/,
        ""
      );
      updatedFields.signature_image = Buffer.from(base64Data, "base64");
    }

    await signature.update(updatedFields);

    res.status(200).json({
      message: "Signature updated successfully",
      signature,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
