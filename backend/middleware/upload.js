// middleware/upload.js
const ftp = require("basic-ftp");
const { Readable, Writable } = require("stream");
const { v4: uuidv4 } = require("uuid");
const path = require("path");
require("dotenv").config();

// Helper: Create a writable stream that collects data into a Buffer
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

function bufferToStream(buffer) {
  const stream = new Readable();
  stream.push(buffer);
  stream.push(null);
  return stream;
}

/**
 * Upload buffer to FTP with 775 permissions
 * @param {Buffer} buffer
 * @param {string} filename
 * @param {object|string} options { remoteDir: string } or just string path
 */
async function uploadToFtp(buffer, filename, options = {}) {
  const client = new ftp.Client();
  client.ftp.verbose = process.env.NODE_ENV === "development";

  const ext = path.extname(filename) || ".bin";
  const uniqueName = `${uuidv4()}${ext}`;

  // Handle both string and object input for backward compatibility
  let remoteDir = "/";
  if (typeof options === "string") {
    remoteDir = options;
  } else if (typeof options?.remoteDir === "string") {
    remoteDir = options.remoteDir;
  }

  // Ensure remoteDir starts with /
  if (!remoteDir.startsWith("/")) {
    remoteDir = "/" + remoteDir;
  }

  try {
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

    // Upload the file
    await client.uploadFrom(bufferToStream(buffer), uniqueName);

    // 🔥 Always set 775 permissions
    try {
      await client.send(`SITE CHMOD 775 ${uniqueName}`);
      console.log(`✓ Uploaded with 775: ${uniqueName}`);
    } catch (chmodErr) {
      console.warn(
        `⚠️ Failed to set CHMOD 775 on ${uniqueName}:`,
        chmodErr.message,
      );
      // Don't fail the upload if chmod fails
    }
    const FTP_BASE_URL = "https://media.cmtradingco.com";
    // Clean URL construction (prevents double slash)
    const baseUrl = FTP_BASE_URL.replace(/\/$/, "");
    const cleanUrl = `${baseUrl}${remoteDir}/${uniqueName}`.replace(
      /\/+/g,
      "/",
    );

    return cleanUrl;
  } catch (error) {
    console.error("FTP Upload Error:", error);
    throw new Error(`FTP upload failed: ${error.message}`);
  } finally {
    client.close();
  }
}

/**
 * Download file from FTP
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
