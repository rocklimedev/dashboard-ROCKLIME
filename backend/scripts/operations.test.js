const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const express = require('express');
const request = require('supertest');

test('operations authorize administrators, export snapshots and separate report downloads', async () => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'erp-operations-test-'));
  process.env.OPERATIONS_STORAGE_DIR = directory;
  const modelsPath = require.resolve('../models');
  const authPath = require.resolve('../middleware/auth');
  const products = [1, 2].map((id) => ({
    productId: String(id),
    product_code: String(id),
    name: 'Basin',
    meta: { companyCode: 'CODE' },
  }));
  let fail = false;
  require.cache[modelsPath] = {
    id: modelsPath,
    filename: modelsPath,
    loaded: true,
    exports: {
      Product: {
        findAll: async () => {
          if (fail) throw new Error('DB unavailable');
          return products;
        },
      },
      ProductMeta: { findAll: async () => [] },
      sequelize: { transaction: async (_, callback) => callback({}) },
    },
  };
  require.cache[authPath] = {
    id: authPath,
    filename: authPath,
    loaded: true,
    exports: {
      auth: (req, res, next) => {
        if (!req.headers.authorization) return res.sendStatus(401);
        req.user = { roles: [req.headers.authorization], userId: 'tester' };
        next();
      },
    },
  };
  const app = express();
  app.use(express.json());
  app.use('/operations', require('../modules/operations/operations.route'));
  app.use((error, req, res, next) => res.status(500).json({ message: error.message }));
  try {
    await request(app).get('/operations').expect(401);
    await request(app).post('/operations/product-backup').set('Authorization', 'USERS').expect(403);
    const backup = await request(app)
      .post('/operations/product-backup')
      .set('Authorization', 'ADMIN')
      .expect(201);
    const exported = await request(app)
      .get(`/operations/artifacts/${backup.body.id}`)
      .set('Authorization', 'ADMIN')
      .expect(200);
    assert.deepEqual(exported.body.products, products);
    assert.ok(exported.headers['content-disposition'].includes('attachment'));
    await request(app)
      .post('/operations/duplicate-scan')
      .set('Authorization', 'ADMIN')
      .send({ threshold: 0.8 })
      .expect(400);
    const scan = await request(app)
      .post('/operations/duplicate-scan')
      .set('Authorization', 'ADMIN')
      .send({ threshold: 0.9 })
      .expect(201);
    const exact = await request(app)
      .get(`/operations/artifacts/${scan.body.id}/exact`)
      .set('Authorization', 'ADMIN')
      .expect(200);
    assert.equal(exact.body.length, 1);
    await request(app)
      .get(`/operations/artifacts/${scan.body.id}/unknown`)
      .set('Authorization', 'ADMIN')
      .expect(400);
    await request(app)
      .get('/operations/artifacts/not-an-id')
      .set('Authorization', 'ADMIN')
      .expect(400);
    const listed = await request(app).get('/operations').set('Authorization', 'ADMIN').expect(200);
    assert.equal(listed.body.artifacts.length, 2);
    fail = true;
    await request(app).post('/operations/product-backup').set('Authorization', 'ADMIN').expect(500);
    fail = false;
    await request(app).post('/operations/product-backup').set('Authorization', 'ADMIN').expect(201);
  } finally {
    await fs.rm(directory, { recursive: true, force: true });
    delete process.env.OPERATIONS_STORAGE_DIR;
  }
});
