// middleware/upload.js
const ftp = require("basic-ftp");
const { Readable } = require("stream");
const { v4: uuidv4 } = require("uuid");
const path = require("path");
require("dotenv").config();

/**
 * Convert Buffer to Readable Stream
 */
function bufferToStream(buffer) {
  const stream = new Readable();
  stream.push(buffer);
  stream.push(null);
  return stream;
}

/**
 * Upload file to FTP and return correct public URL
 */
async function uploadToFtp(buffer, filename, options = {}) {
  const client = new ftp.Client();
  client.ftp.verbose = process.env.NODE_ENV === "development";

  try {
    // ==================== MAIN FIX ====================
    let baseUrl = (
      process.env.MEDIA_BASE_URL || "https://media.cmtradingco.com"
    ).trim();

    // Force correct format
    if (baseUrl.endsWith(":")) {
      baseUrl += "//";
    }
    baseUrl = baseUrl.replace(/\/+$/, ""); // remove trailing slashes

    // Generate unique filename
    const ext = path.extname(filename) || ".jpg";
    const uniqueName = `${uuidv4()}${ext}`;

    // Remote directory
    let remoteDir = "/product_images";
    if (typeof options === "string") {
      remoteDir = options;
    } else if (options?.remoteDir) {
      remoteDir = options.remoteDir;
    }
    if (!remoteDir.startsWith("/")) {
      remoteDir = "/" + remoteDir;
    }

    // FTP Connection & Upload
    await client.access({
      host: process.env.FTP_HOST,
      port: parseInt(process.env.FTP_PORT) || 21,
      user: process.env.FTP_USER,
      password: process.env.FTP_PASSWORD,
      secure: process.env.FTP_SECURE === "true",
      timeout: 0,
    });

    await client.ensureDir(remoteDir);
    await client.cd(remoteDir);

    await client.uploadFrom(bufferToStream(buffer), uniqueName);

    // Set permissions
    try {
      await client.send(`SITE CHMOD 775 ${uniqueName}`);
    } catch (e) {
      console.warn("CHMOD warning:", e.message);
    }

    // ==================== FINAL URL (This fixes the https:/ issue) ====================
    const finalUrl = `${baseUrl}${remoteDir}/${uniqueName}`.replace(
      /\/+/g,
      "/",
    );

    console.log("✅ UPLOADED SUCCESSFULLY:", finalUrl);

    return finalUrl;
  } catch (error) {
    console.error("❌ FTP Upload Error:", error.message);
    throw new Error(`FTP upload failed: ${error.message}`);
  } finally {
    client.close();
  }
}

module.exports = {
  uploadToFtp,
};
