// middleware/upload.js or utils/ftpUpload.js
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
 * Upload buffer to FTP.
 * @param {Buffer} buffer
 * @param {string} filename
 * @param {object} options { remoteDir: string, chmod: string }
 */
async function uploadToFtp(buffer, filename, options = {}) {
  const client = new ftp.Client();
  client.ftp.verbose = process.env.NODE_ENV === "development";

  const ext = path.extname(filename) || ".bin";
  const uniqueName = `${uuidv4()}${ext}`;

  const remoteDir =
    typeof options.remoteDir === "string" ? options.remoteDir : "/";
  const chmod = options.chmod;

  try {
    await client.access({
      host: process.env.FTP_HOST,
      port: process.env.FTP_PORT || 21,
      user: process.env.FTP_USER,
      password: process.env.FTP_PASSWORD,
      secure: process.env.FTP_SECURE === "true",
      timeout: 0,
    });

    // Ensure directory exists (string required)
    await client.ensureDir(remoteDir);
    await client.cd(remoteDir);

    // Upload
    await client.uploadFrom(bufferToStream(buffer), uniqueName);

    // Set permissions if provided
    if (chmod) {
      await client.send(`SITE CHMOD ${chmod} ${uniqueName}`);
    }

    return `${process.env.FTP_BASE_URL}${remoteDir}/${uniqueName}`;
  } finally {
    client.close();
  }
}

/**
 * Download file from FTP
 * @param {string} ftpPath - either full URL or remote path
 */
async function downloadFromFtp(ftpPath) {
  const client = new ftp.Client();
  client.ftp.verbose = process.env.NODE_ENV === "development";

  try {
    let remotePath = ftpPath;
    if (ftpPath.startsWith("http")) {
      const url = new URL(ftpPath);
      remotePath = url.pathname; // extract path from URL
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
