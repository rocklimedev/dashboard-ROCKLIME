// utils/ftpUpload.js  (or middleware/upload.js – whatever file has uploadToFtp)
const ftp = require("basic-ftp");
const { v4: uuidv4 } = require("uuid");
const path = require("path");
const fs = require("fs").promises; // for temp file handling if needed
require("dotenv").config();

function bufferToStream(buffer) {
  const { Readable } = require("stream");
  const stream = new Readable();
  stream.push(buffer);
  stream.push(null);
  return stream;
}

/**
 * Upload a Buffer to FTP and return the public URL.
 */
async function uploadToFtp(buffer, originalName, options = {}) {
  const ext = path.extname(originalName);
  const uniqueName = `${uuidv4()}${ext}`;

  const client = new ftp.Client();
  client.ftp.verbose = process.env.NODE_ENV === "development";

  try {
    await client.access({
      host: process.env.FTP_HOST,
      port: process.env.FTP_PORT || 21,
      user: process.env.FTP_USER,
      password: process.env.FTP_PASSWORD,
      secure: process.env.FTP_SECURE === "true",
      timeout: 0, // prevent control socket timeout
      ...options,
    });

    const uploadDir = "/product_images";
    await client.ensureDir(uploadDir);
    await client.cd(uploadDir);

    const stream = bufferToStream(buffer);
    await client.uploadFrom(stream, uniqueName);

    return `${process.env.FTP_BASE_URL}${uploadDir}/${uniqueName}`;
  } finally {
    client.close();
  }
}

/**
 * Download file from FTP path and return Buffer
 * @param {string} ftpPath - full FTP path or public URL
 * @returns {Promise<Buffer>}
 */
async function downloadFromFtp(ftpPath) {
  const client = new ftp.Client();
  client.ftp.verbose = process.env.NODE_ENV === "development";

  try {
    // If ftpPath is a full URL like https://static.cmtradingco.com/..., extract the path
    let remotePath = ftpPath;
    if (ftpPath.startsWith("http")) {
      const url = new URL(ftpPath);
      remotePath = url.pathname; // e.g. /product_images/abc123.xlsx
    }

    await client.access({
      host: process.env.FTP_HOST,
      port: process.env.FTP_PORT || 21,
      user: process.env.FTP_USER,
      password: process.env.FTP_PASSWORD,
      secure: process.env.FTP_SECURE === "true",
      timeout: 0, // important for larger files
    });

    // Download to memory (Buffer)
    const buffer = await client.downloadToBuffer(remotePath);

    return buffer;
  } catch (err) {
    console.error("FTP download error:", err);
    throw err;
  } finally {
    client.close();
  }
}

module.exports = {
  uploadToFtp,
  downloadFromFtp, // ← now exported
};
