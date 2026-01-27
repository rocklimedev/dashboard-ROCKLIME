// middleware/upload.js (or utils/ftpUpload.js)
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

async function uploadToFtp(buffer, originalName, options = {}) {
  // Your existing upload code is fine (uses uploadFrom with stream) → no change needed
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
      timeout: 0,
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

function bufferToStream(buffer) {
  const stream = new Readable();
  stream.push(buffer);
  stream.push(null);
  return stream;
}

async function downloadFromFtp(ftpPath) {
  const client = new ftp.Client();
  client.ftp.verbose = process.env.NODE_ENV === "development";

  try {
    // Extract remote path from URL if needed
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

    // Use a writable that collects into Buffer
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
