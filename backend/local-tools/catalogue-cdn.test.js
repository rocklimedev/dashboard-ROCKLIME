const test = require('node:test');
const assert = require('node:assert/strict');
const { Readable } = require('stream');
const express = require('express');
const request = require('supertest');

const remote = new Map();
const permissions = new Map();
let failUpload = false,
  failDatabase = false,
  lastRequest;
const mock = (path, exports) => {
  const id = require.resolve(path);
  require.cache[id] = { id, filename: id, loaded: true, exports };
};
mock('basic-ftp', {
  Client: class {
    async access() {}
    async ensureDir(dir) {
      this.dir = dir;
    }
    async uploadFrom(stream, name) {
      const parts = [];
      for await (const part of stream) parts.push(part);
      remote.set(`${this.dir}/${name}`, Buffer.concat(parts));
      if (failUpload) throw new Error('CDN unavailable');
    }
    async remove(name) {
      remote.delete(name);
    }
    async send(command) {
      const match = /^SITE CHMOD 755 (.+)$/.exec(command);
      assert.ok(match, 'Catalogue uploads must set permission 755');
      permissions.set(`${this.dir}/${match[1]}`, '755');
    }
    close() {}
  },
});
mock('axios', {
  get: async (url, options) => {
    lastRequest = { url, options };
    return {
      status: options.headers.Range ? 206 : 200,
      headers: { 'content-length': '4', 'content-range': 'bytes 0-3/10', 'accept-ranges': 'bytes' },
      data: Readable.from([Buffer.from('%PDF')]),
    };
  },
});

let rows = new Map();
const database = {
  async transaction(callback) {
    const before = new Map(rows);
    try {
      return await callback({});
    } catch (error) {
      rows = before;
      throw error;
    }
  },
  async query(sql, { replacements: values } = {}) {
    if (sql.startsWith('INSERT INTO catalogues')) {
      if (failDatabase) throw new Error('Database unavailable');
      const [
        id,
        title,
        brandId,
        brandName,
        category,
        year,
        fileName,
        storedName,
        coverName,
        sizeBytes,
        pages,
      ] = values;
      rows.set(id, { id, title, fileName, storedName, coverName, sizeBytes, pages });
      return [];
    }
    if (sql.startsWith('SELECT')) return rows.has(values?.[0]) ? [rows.get(values[0])] : [];
    if (sql.startsWith('DELETE FROM catalogues')) rows.delete(values[0]);
    return [];
  },
};
mock('../models', { sequelize: database });
mock('../middleware/auth', {
  auth: (req, res, next) => {
    if (!req.headers.authorization) return res.sendStatus(401);
    req.user = { userId: 'user' };
    next();
  },
});
mock('../middleware/permission', { guardModule: () => (req, res, next) => next() });
const storage = require('../modules/catalogues/catalogue-storage');
const app = express();
app.use('/catalogues', require('../modules/catalogues/catalogue.route'));
const reset = () => {
  rows.clear();
  remote.clear();
  failUpload = false;
  failDatabase = false;
  process.env.FTP_HOST = 'cdn.test';
  process.env.MEDIA_BASE_URL = 'https://cdn.test';
  process.env.UPLOAD_MODE = 'local';
};
const upload = () =>
  request(app)
    .post('/catalogues')
    .set('Authorization', 'Bearer test')
    .field('title', 'Brand catalogue')
    .attach('file', Buffer.from('%PDF-1.7 catalogue'), {
      filename: 'brand.pdf',
      contentType: 'application/pdf',
    });

test('catalogues stream to CDN even when general uploads use local mode', async () => {
  reset();
  const result = await upload().attach('cover', Buffer.from('jpeg'), {
    filename: 'cover.jpg',
    contentType: 'image/jpeg',
  });
  assert.equal(result.status, 201);
  const row = result.body.catalogue;
  assert.equal(storage.isCdn(row.storedName), true);
  assert.equal(storage.isCdn(row.coverName), true);
  assert.equal(remote.size, 2);
  assert.equal(row.sizeBytes, 18);
  for (const name of remote.keys()) assert.equal(permissions.get(name), '755');
  assert.match(storage.cdnUrl(row.storedName), /^https:\/\/cdn.test\/catalogues\/.+\.pdf$/);
});

test('catalogue uploads require CDN configuration and do not fall back to disk', async () => {
  reset();
  delete process.env.FTP_HOST;
  const result = await upload();
  assert.equal(result.status, 503);
  assert.equal(remote.size, 0);
  assert.equal(rows.size, 0);
});

test('failed FTP and database writes clean up uploaded CDN files', async () => {
  for (const failure of ['upload', 'database']) {
    reset();
    failUpload = failure === 'upload';
    failDatabase = failure === 'database';
    const result = await upload();
    assert.equal(result.status, 500);
    assert.equal(remote.size, 0);
    assert.equal(rows.size, 0);
  }
});

test('PDF byte ranges stream from CDN without forwarding login credentials', async () => {
  reset();
  const result = await upload();
  const id = result.body.catalogue.id;
  const pdf = await request(app)
    .get(`/catalogues/${id}/file`)
    .set('Authorization', 'Bearer secret')
    .set('Range', 'bytes=0-3');
  assert.equal(pdf.status, 206);
  assert.equal(pdf.headers['content-range'], 'bytes 0-3/10');
  assert.deepEqual(lastRequest.options.headers, { Range: 'bytes=0-3' });
  const denied = await request(app).get(`/catalogues/${id}/file`);
  assert.equal(denied.status, 401);
});

test('covers redirect to CDN and deletion removes both remote assets', async () => {
  reset();
  const result = await upload().attach('cover', Buffer.from('jpeg'), {
    filename: 'cover.jpg',
    contentType: 'image/jpeg',
  });
  const row = result.body.catalogue;
  const cover = await request(app).get(`/catalogues/${row.id}/cover`);
  assert.equal(cover.status, 302);
  assert.equal(cover.headers.location, storage.cdnUrl(row.coverName));
  const deleted = await request(app)
    .delete(`/catalogues/${row.id}`)
    .set('Authorization', 'Bearer test');
  assert.equal(deleted.status, 200);
  assert.equal(remote.size, 0);
  assert.equal(rows.size, 0);
});

test('unsafe CDN paths are rejected', () => {
  assert.equal(storage.isCdn('cdn/../../private.pdf'), false);
  assert.throws(() => storage.cdnUrl('https://other.test/file.pdf'), /Invalid/);
});
