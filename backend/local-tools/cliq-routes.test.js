const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const express = require('express');
const request = require('supertest');

function setup() {
  const calls = [];
  let failure;
  const cliq = {
    status: async (userId) => ({ connected: true, userId }),
    request: async (userId, url, options) => {
      calls.push({ userId, url, options });
      if (failure) throw failure;
      return { ok: true };
    },
  };
  function load(file, dependencies) {
    const module = { exports: {} };
    vm.runInNewContext(fs.readFileSync(path.resolve(__dirname, '../modules/zoho', file), 'utf8'), {
      module,
      exports: module.exports,
      process,
      require(id) {
        assert.ok(Object.hasOwn(dependencies, id), `Unexpected dependency ${id}`);
        return dependencies[id];
      },
    });
    return module.exports;
  }
  const auth = (req, res, next) => {
    if (!req.headers.authorization) return res.status(401).json({ message: 'Login required' });
    req.user = { userId: req.headers.authorization };
    next();
  };
  const controller = load('cliq/cliq.controller.js', { './cliq.service': cliq });
  const router = load('cliq/cliq.route.js', {
    express,
    '../../../middleware/auth': { auth },
    './cliq.controller': controller,
  });
  const zoho = load('zoho.route.js', {
    express,
    '../../middleware/auth': { auth },
    './zoho.auth': {},
    '../../middleware/permission': { guardModule: () => (req, res, next) => next() },
    '../crm/bigin': {},
    '../../lib/shareToken': { verifyShare: () => null },
    '../../config/clientUrl': require('../config/clientUrl'),
    './cliq/cliq.route': router,
  });
  const app = express();
  app.use(express.json());
  app.use('/api/zoho', zoho);
  app.use('/api/cliq', router);
  return {
    app,
    calls,
    fail: (error) => {
      failure = error;
    },
  };
}

test('Zoho mounts Cliq with login protection and keeps the compatibility URL', async () => {
  const { app } = setup();
  await request(app).get('/api/zoho/cliq/status').expect(401);
  for (const prefix of ['/api/zoho/cliq', '/api/cliq']) {
    const response = await request(app)
      .get(`${prefix}/status`)
      .set('Authorization', 'alice')
      .expect(200);
    assert.deepEqual(response.body, { connected: true, userId: 'alice' });
  }
});

test("Cliq forwards pagination and uses the signed-in user's identity", async () => {
  const { app, calls } = setup();
  for (const [url, upstream, key, value] of [
    ['chats?before=123', '/chats', 'modified_before', '123'],
    ['channels?next=next-page', '/channels', 'next_token', 'next-page'],
    ['people?next=people-page', '/users', 'next_token', 'people-page'],
    ['chats/chat%2Fid/messages?before=456', '/chats/chat%2Fid/messages', 'before', '456'],
  ]) {
    await request(app).get(`/api/zoho/cliq/${url}`).set('Authorization', 'bob').expect(200);
    assert.equal(calls.at(-1).userId, 'bob');
    assert.equal(calls.at(-1).url, upstream);
    assert.equal(calls.at(-1).options.params[key], value);
  }
});

test('Cliq validates messages before calling Zoho and preserves service errors', async () => {
  const { app, calls, fail } = setup();
  for (const text of [' ', 'x'.repeat(5001)]) {
    await request(app)
      .post('/api/zoho/cliq/chats/chat/messages')
      .set('Authorization', 'alice')
      .send({ text })
      .expect(400);
  }
  assert.equal(calls.length, 0);
  await request(app)
    .post('/api/zoho/cliq/chats/chat/messages')
    .set('Authorization', 'alice')
    .send({ text: ' Hello ' })
    .expect(200);
  assert.equal(calls[0].url, '/chats/chat/message');
  assert.equal(calls[0].options.method, 'POST');
  assert.equal(calls[0].options.data.text, 'Hello');
  fail(Object.assign(new Error('Reconnect Zoho'), { status: 409 }));
  const response = await request(app)
    .get('/api/zoho/cliq/chats')
    .set('Authorization', 'alice')
    .expect(409);
  assert.equal(response.body.message, 'Reconnect Zoho');
});
