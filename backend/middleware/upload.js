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
 * Upload file to FTP and return public URL
 * @param {Buffer} buffer - File buffer
 * @param {string} filename - Original filename
 * @param {object|string} options - { remoteDir: string } or just string path
 * @returns {Promise<string>} Public URL of uploaded image
 */
async function uploadToFtp(buffer, filename, options = {}) {
  const client = new ftp.Client();
  client.ftp.verbose = process.env.NODE_ENV === "development";

  try {
    // Get environment-based base URL (Most Important Fix)
    const MEDIA_BASE_URL = "https://media.cmtradingco.com";

    // Generate unique filename
    const ext = path.extname(filename) || ".jpg";
    const uniqueName = `${uuidv4()}${ext}`;

    // Handle remote directory
    let remoteDir = "/product_images"; // Default folder

    if (typeof options === "string") {
      remoteDir = options;
    } else if (options?.remoteDir) {
      remoteDir = options.remoteDir;
    }

    // Ensure directory starts with /
    if (!remoteDir.startsWith("/")) {
      remoteDir = "/" + remoteDir;
    }

    // Connect to FTP
    await client.access({
      host: process.env.FTP_HOST,
      port: process.env.FTP_PORT || 21,
      user: process.env.FTP_USER,
      password: process.env.FTP_PASSWORD,
      secure: process.env.FTP_SECURE === "true",
      timeout: 0,
    });

    // Ensure directory exists and navigate
    await client.ensureDir(remoteDir);
    await client.cd(remoteDir);

    // Upload file
    await client.uploadFrom(bufferToStream(buffer), uniqueName);

    // Set proper permissions (775)
    try {
      await client.send(`SITE CHMOD 775 ${uniqueName}`);
      console.log(`✓ Uploaded with 775 permissions: ${uniqueName}`);
    } catch (chmodErr) {
      console.warn(`⚠️ CHMOD failed for ${uniqueName}:`, chmodErr.message);
    }

    // Generate final public URL
    const baseUrl = MEDIA_BASE_URL.replace(/\/$/, "");
    const cleanUrl = `${baseUrl}${remoteDir}/${uniqueName}`.replace(
      /\/+/g,
      "/",
    );

    console.log("✅ Image uploaded successfully:", cleanUrl);

    return cleanUrl;
  } catch (error) {
    console.error("FTP Upload Error:", error);
    throw new Error(`FTP upload failed: ${error.message}`);
  } finally {
    client.close();
  }
}

/**
 * Download file from FTP (Optional - if you need it)
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
      port: process.env.FTP_PORT || 21,
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
