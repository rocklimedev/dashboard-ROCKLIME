const path = require("path");
const ftp = require("basic-ftp");
const { v4: uuidv4 } = require("uuid");
const { Readable } = require("stream");

/**
 * Converts a Buffer into a readable stream (required by basic-ftp uploads).
 */
function bufferToStream(buffer) {
  const stream = new Readable();
  stream.push(buffer);
  stream.push(null);
  return stream;
}

/**
 * Uploads a file (e.g. multer file object) to the FTP-backed CDN and
 * returns its public URL. Used for generic "invoice_pdfs" uploads.
 */
const uploadToCDN = async (file) => {
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

    const uploadDir = "/invoice_pdfs";
    await client.ensureDir(uploadDir);
    await client.cd(uploadDir);

    const ext = path.extname(file.originalname);
    const uniqueName = `${uuidv4()}-${Date.now()}${ext}`;
    await client.uploadFrom(bufferToStream(file.buffer), uniqueName);
    const fileUrl = `https://media.cmtradingco.com/invoice_pdfs/${uniqueName}`;
    return fileUrl;
  } catch (err) {
    throw new Error(`FTP upload failed: ${err.message}`);
  } finally {
    client.close();
  }
};

module.exports = { bufferToStream, uploadToCDN };
