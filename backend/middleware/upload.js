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
 * @param {Buffer} buffer - File buffer
 * @param {string} filename - Original filename
 * @param {object|string} options - { remoteDir: string } or string path
 * @returns {Promise<string>} Public URL
 */
async function uploadToFtp(buffer, filename, options = {}) {
  const client = new ftp.Client();
  client.ftp.verbose = process.env.NODE_ENV === "development";

  try {
    // ====================== CRITICAL FIX ======================
    // Use environment variable with strong fallback
    let MEDIA_BASE_URL =
      process.env.MEDIA_BASE_URL || "https://media.cmtradingco.com";

    // Ensure correct format: https://media.cmtradingco.com (no missing slash)
    MEDIA_BASE_URL = MEDIA_BASE_URL.trim();

    if (MEDIA_BASE_URL.endsWith(":")) {
      MEDIA_BASE_URL += "//";
    } else if (
      !MEDIA_BASE_URL.endsWith("//") &&
      !MEDIA_BASE_URL.includes("://")
    ) {
      MEDIA_BASE_URL = MEDIA_BASE_URL.replace(/\/+$/, "") + "://";
    }

    // Generate unique filename
    const ext = path.extname(filename) || ".jpg";
    const uniqueName = `${uuidv4()}${ext}`;

    // Handle remote directory
    let remoteDir = "/product_images"; // default folder

    if (typeof options === "string") {
      remoteDir = options;
    } else if (options && options.remoteDir) {
      remoteDir = options.remoteDir;
    }

    if (!remoteDir.startsWith("/")) {
      remoteDir = "/" + remoteDir;
    }

    // Connect to FTP
    await client.access({
      host: process.env.FTP_HOST,
      port: parseInt(process.env.FTP_PORT) || 21,
      user: process.env.FTP_USER,
      password: process.env.FTP_PASSWORD,
      secure: process.env.FTP_SECURE === "true",
      timeout: 0,
    });

    // Ensure directory exists
    await client.ensureDir(remoteDir);
    await client.cd(remoteDir);

    // Upload the file
    await client.uploadFrom(bufferToStream(buffer), uniqueName);

    // Set permissions 775
    try {
      await client.send(`SITE CHMOD 775 ${uniqueName}`);
      console.log(`✓ Uploaded with 775: ${uniqueName}`);
    } catch (chmodErr) {
      console.warn(`⚠️ CHMOD warning for ${uniqueName}:`, chmodErr.message);
    }

    // ====================== FINAL URL CONSTRUCTION ======================
    const baseUrl = MEDIA_BASE_URL.replace(/\/$/, "");
    const finalUrl = `${baseUrl}${remoteDir}/${uniqueName}`.replace(
      /\/+/g,
      "/",
    );

    console.log("✅ Image uploaded successfully:", finalUrl);

    return finalUrl;
  } catch (error) {
    console.error("FTP Upload Error:", error);
    throw new Error(`FTP upload failed: ${error.message}`);
  } finally {
    client.close();
  }
}

/**
 * Download file from FTP (if needed in future)
 */
async function downloadFromFtp(ftpPath) {
  const client = new ftp.Client();
  client.ftp.verbose = process.env.NODE_ENV === "development";

  try {
    let remotePath = ftpPath;
    if (ftpPath.startsWith("http")) {
      const url = new URL(ftpPath);
      remotePath = url.pathname;
    }

    await client.access({
      host: process.env.FTP_HOST,
      port: parseInt(process.env.FTP_PORT) || 21,
      user: process.env.FTP_USER,
      password: process.env.FTP_PASSWORD,
      secure: process.env.FTP_SECURE === "true",
    });

    const chunks = [];
    const writable = new (require("stream").Writable)({
      write(chunk, encoding, callback) {
        chunks.push(Buffer.from(chunk));
        callback();
      },
    });

    await client.downloadTo(writable, remotePath);
    return Buffer.concat(chunks);
  } catch (err) {
    console.error("FTP Download Error:", err);
    throw new Error(`Failed to download file: ${err.message}`);
  } finally {
    client.close();
  }
}

module.exports = {
  uploadToFtp,
  downloadFromFtp,
};
