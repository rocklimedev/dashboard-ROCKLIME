// middleware/upload.js
const ftp = require("basic-ftp");
const { Readable, Writable } = require("stream");
const { v4: uuidv4 } = require("uuid");
const path = require("path");

require("dotenv").config();

/**
 * Buffer to Stream
 */
function bufferToStream(buffer) {
  const stream = new Readable();
  stream.push(buffer);
  stream.push(null);
  return stream;
}

function createBufferWritable() {
  const chunks = [];
  const writable = new Writable({
    write(chunk, encoding, callback) {
      chunks.push(Buffer.from(chunk));
      callback();
    },
  });
  writable.getBuffer = () => Buffer.concat(chunks);
  return writable;
}

/**
 * FINAL ROBUST UPLOAD FUNCTION
 */
async function uploadToFtp(buffer, filename, options = {}) {
  const client = new ftp.Client();
  client.ftp.verbose = process.env.NODE_ENV === "development";

  try {
    // ==================== STRONG BASE URL FIX ====================
    let baseUrl = (
      process.env.MEDIA_BASE_URL || "https://media.cmtradingco.com"
    ).trim();

    // Ensure it always ends with https:// (most important fix)
    if (!baseUrl.endsWith("//") && baseUrl.includes("://")) {
      // Already has protocol, make sure double slash exists
      baseUrl = baseUrl.replace(/:\/+/, "://");
    } else if (baseUrl.endsWith(":")) {
      baseUrl += "//";
    } else if (!baseUrl.includes("://")) {
      baseUrl = "https://" + baseUrl.replace(/^https?:\/\//, "");
    }

    baseUrl = baseUrl.replace(/\/+$/, ""); // remove trailing slash from base

    console.log("DEBUG → Base URL used:", baseUrl);

    // Generate filename
    const ext = path.extname(filename) || ".jpg";
    const uniqueName = `${uuidv4()}${ext}`;

    // Remote directory
    let remoteDir = "/product_images";
    if (typeof options === "string") {
      remoteDir = options;
    } else if (options?.remoteDir) {
      remoteDir = options.remoteDir;
    }
    if (!remoteDir.startsWith("/")) remoteDir = "/" + remoteDir;

    console.log("DEBUG → Remote Dir:", remoteDir);

    // FTP Upload
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

    try {
      await client.send(`SITE CHMOD 775 ${uniqueName}`);
    } catch (e) {}

    // ==================== FINAL URL CONSTRUCTION (STRONG FIX) ====================
    let finalUrl = baseUrl + remoteDir + "/" + uniqueName;
    finalUrl = finalUrl.replace(/\/+/g, "/"); // collapse multiple slashes
    finalUrl = finalUrl.replace("https:/", "https://"); // Extra safety net

    console.log("✅ SUCCESSFULLY UPLOADED:", finalUrl);

    return finalUrl;
  } catch (error) {
    console.error("❌ FTP Upload Error:", error.message);
    throw new Error(`FTP upload failed: ${error.message}`);
  } finally {
    client.close();
  }
}
/**
 * Download function (unchanged)
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
      timeout: 0,
    });

    const bufferWritable = createBufferWritable();
    await client.downloadTo(bufferWritable, remotePath);
    return bufferWritable.getBuffer();
  } catch (err) {
    console.error("FTP download error:", err);
    throw new Error(`Failed to download file from FTP: ${err.message}`);
  } finally {
    client.close();
  }
}

module.exports = {
  uploadToFtp,
  downloadFromFtp,
};
