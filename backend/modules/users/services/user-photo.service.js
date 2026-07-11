const path = require("path");
const ftp = require("basic-ftp");
const sharp = require("sharp");
const { v4: uuidv4 } = require("uuid");
const { Readable } = require("stream");
const { User } = require("../models");

const excludeSensitiveFields = {
  attributes: {
    exclude: ["password", "createdAt", "updatedAt"],
  },
};

/**
 * Convert buffer to stream
 */
const bufferToStream = (buffer) => {
  return Readable.from(buffer);
};

/**
 * Upload user photo to FTP server
 */
exports.uploadUserPhoto = async (
  userId,
  fileBuffer,
  mimeType,
  originalName,
) => {
  // 1. Validate file
  if (!fileBuffer) {
    throw new Error("No photo provided");
  }

  const allowedMime = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
  if (!allowedMime.includes(mimeType)) {
    throw new Error("Only JPEG, PNG, or WEBP images are allowed");
  }

  // 2. Generate unique filenames
  const ext = path.extname(originalName);
  const uid = uuidv4();
  const uploadedOriginalName = `${uid}${ext}`;
  const thumbName = `${uid}_thumb${ext}`;

  // 3. Prepare FTP client
  const client = new ftp.Client();
  client.ftp.verbose = process.env.NODE_ENV === "development";

  let originalUrl, thumbUrl;

  try {
    await client.access({
      host: process.env.FTP_HOST,
      port: process.env.FTP_PORT || 21,
      user: process.env.FTP_USER,
      password: process.env.FTP_PASSWORD,
      secure: process.env.FTP_SECURE === "true",
    });

    const uploadDir = "/user_photos";
    await client.ensureDir(uploadDir);
    await client.cd(uploadDir);

    // ---- Upload original ----
    await client.uploadFrom(bufferToStream(fileBuffer), uploadedOriginalName);
    await client.send(`SITE CHMOD 644 ${uploadedOriginalName}`);
    originalUrl = `https://media.cmtradingco.com${uploadDir}/${uploadedOriginalName}`;

    // ---- Create & upload thumbnail ----
    const thumbBuffer = await sharp(fileBuffer)
      .resize(200, 200, { fit: "cover", withoutEnlargement: true })
      .toBuffer();

    await client.uploadFrom(bufferToStream(thumbBuffer), thumbName);
    await client.send(`SITE CHMOD 644 ${thumbName}`);
    thumbUrl = `https://media.cmtradingco.com${uploadDir}/${thumbName}`;
  } catch (ftpErr) {
    throw new Error(`FTP upload failed: ${ftpErr.message}`);
  } finally {
    client.close();
  }

  // 4. Update user record
  const user = await User.findByPk(userId);
  if (!user) {
    throw new Error("User not found");
  }

  user.photo_original = originalUrl;
  user.photo_thumbnail = thumbUrl;
  await user.save();

  // 5. Return updated user
  const safeUser = await User.findByPk(user.userId, excludeSensitiveFields);

  return {
    photo_original: originalUrl,
    photo_thumbnail: thumbUrl,
    user: safeUser,
  };
};
