const ftp = require('basic-ftp');
const { randomUUID } = require('crypto');
const { Transform } = require('stream');

const REMOTE_DIR = '/catalogues';
const isCdn = (name) => /^cdn\/[a-f0-9-]+\.(?:pdf|jpg)$/.test(name || '');
const filenameFor = (name) => {
  if (!isCdn(name)) throw new Error('Invalid catalogue CDN filename');
  return name.slice(4);
};
const cdnUrl = (name) => {
  const base = (process.env.MEDIA_BASE_URL || 'https://media.cmtradingco.com')
    .trim()
    .replace(/\/+$/, '');
  return `${base.includes('://') ? base : `https://${base}`}${REMOTE_DIR}/${filenameFor(name)}`;
};

async function connect(client) {
  // Catalogue uploads must never fall back to local storage.
  if (!process.env.FTP_HOST)
    throw Object.assign(
      new Error('CDN upload is not configured. Set FTP_HOST, FTP_USER and FTP_PASSWORD.'),
      { status: 503 },
    );
  await client.access({
    host: process.env.FTP_HOST,
    port: Number(process.env.FTP_PORT) || 21,
    user: process.env.FTP_USER,
    password: process.env.FTP_PASSWORD,
    secure: process.env.FTP_SECURE === 'true',
  });
}

async function remove(name) {
  if (!isCdn(name)) return;
  const client = new ftp.Client();
  try {
    await connect(client);
    await client.remove(`${REMOTE_DIR}/${filenameFor(name)}`, true);
  } finally {
    client.close();
  }
}

// Multer streams each upload to FTP with backpressure, including 300 MB PDFs.
// The short cdn/ marker fits the existing storedName / coverName columns.
const storage = {
  _handleFile(req, file, callback) {
    const client = new ftp.Client();
    const filename = `${randomUUID()}${file.fieldname === 'cover' ? '.jpg' : '.pdf'}`;
    let size = 0;
    const counter = new Transform({
      transform(chunk, encoding, done) {
        size += chunk.length;
        done(null, chunk);
      },
    });
    const onError = (error) => counter.destroy(error);
    file.stream.on('error', onError);
    // Avoid unhandled errors while FTP is connecting.
    counter.on('error', () => {});
    (async () => {
      try {
        await connect(client);
        await client.ensureDir(REMOTE_DIR);
        file.stream.pipe(counter);
        await client.uploadFrom(counter, filename);
        if (file.stream.truncated)
          throw Object.assign(new Error('The file is too large (300 MB at most)'), {
            code: 'LIMIT_FILE_SIZE',
          });
        await client.send(`SITE CHMOD 755 ${filename}`);
        callback(null, { filename: `cdn/${filename}`, size });
      } catch (error) {
        file.stream.unpipe(counter);
        counter.destroy();
        // A failed or truncated upload must not leave a partial file on the CDN.
        try {
          await client.remove(`${REMOTE_DIR}/${filename}`, true);
        } catch {
          /* connection may have failed */
        }
        callback(error);
      } finally {
        file.stream.removeListener('error', onError);
        client.close();
      }
    })();
  },
  _removeFile(req, file, callback) {
    remove(file.filename).then(() => callback(null), callback);
  },
};

module.exports = { storage, isCdn, cdnUrl, remove };
