// utils/ftpUpload.js
const ftp = require("basic-ftp");
const { v4: uuidv4 } = require("uuid");
const path = require("path");
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
 * @param {Buffer} buffer
 * @param {string} originalName
 * @returns {Promise<string>} public URL
 */
async function uploadToFtp(buffer, originalName) {
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

module.exports = { uploadToFtp };
