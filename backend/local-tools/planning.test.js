const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { Sequelize } = require('sequelize');
const express = require('express');
const request = require('supertest');
const db = new Sequelize({ dialect: 'sqlite', storage: ':memory:', logging: false });
const dbPath = require.resolve('../config/database');
require.cache[dbPath] = { id: dbPath, filename: dbPath, loaded: true, exports: db };
const authPath = require.resolve('../middleware/auth');
require.cache[authPath] = {
  id: authPath,
  filename: authPath,
  loaded: true,
  exports: {
    auth: (req, res, next) => {
      if (!req.headers.authorization) return res.status(401).end();
      req.user = { userId: req.headers.authorization };
      next();
    },
  },
};
const migration = require('../migrations/20261022000100-planning');
const app = express();
app.use(express.json());
app.use('/tasks', require('../modules/tasks/task.route'));
app.use('/calendar/events', require('../modules/calendar/calendar.route'));
before(() => migration.up(db.getQueryInterface(), Sequelize));
after(async () => {
  await migration.down(db.getQueryInterface());
  await db.close();
});

test('task API enforces identity, ownership, versions and soft deletion', async () => {
  await request(app).get('/tasks').expect(401);
  const created = await request(app)
    .post('/tasks')
    .set('Authorization', 'alice')
    .send({ title: 'Order follow-up', dueDate: '2026-10-23' })
    .expect(201);
  const task = created.body;
  assert.equal(task.version, 1);
  assert.equal(task.status, 'Open');
  assert.equal(task.external, null);
  assert.equal(
    (await request(app).get('/tasks').set('Authorization', 'bob').expect(200)).body.total,
    0,
  );
  await request(app).get(`/tasks/${task.id}`).set('Authorization', 'bob').expect(404);
  await request(app)
    .patch(`/tasks/${task.id}`)
    .set('Authorization', 'bob')
    .send({ title: 'Stolen', version: 1 })
    .expect(404);
  await request(app)
    .delete(`/tasks/${task.id}`)
    .set('Authorization', 'bob')
    .send({ version: 1 })
    .expect(404);
  const updated = await request(app)
    .patch(`/tasks/${task.id}`)
    .set('Authorization', 'alice')
    .send({ status: 'Completed', version: 1 })
    .expect(200);
  assert.equal(updated.body.version, 2);
  assert.equal(updated.body.title, task.title);
  await request(app)
    .patch(`/tasks/${task.id}`)
    .set('Authorization', 'alice')
    .send({ title: 'Stale', version: 1 })
    .expect(409);
  await request(app)
    .delete(`/tasks/${task.id}`)
    .set('Authorization', 'alice')
    .send({ version: 1 })
    .expect(409);
  await request(app)
    .delete(`/tasks/${task.id}`)
    .set('Authorization', 'alice')
    .send({ version: 2 })
    .expect(204);
  assert.equal(
    (await request(app).get('/tasks').set('Authorization', 'alice').expect(200)).body.total,
    0,
  );
  const row = await require('../modules/tasks/task.model').findByPk(task.id, { paranoid: false });
  assert.ok(row.deletedAt);
});

test('validation rejects provider metadata, owner spoofing, invalid dates and unbounded pagination', async () => {
  for (const input of [
    { title: ' ' },
    { title: 'Test', ownerId: 'bob' },
    { title: 'Test', external: { recordId: 'remote' } },
    { title: 'Test', dueDate: '2026-02-30' },
    { title: 'Test', status: 'Invalid' },
  ]) {
    await request(app).post('/tasks').set('Authorization', 'alice').send(input).expect(400);
  }
  await request(app).get('/tasks?limit=10000').set('Authorization', 'alice').expect(400);
  await request(app).get('/tasks/invalid-id').set('Authorization', 'alice').expect(400);
});

test('calendar validates UTC instants and timezones and persists events independently', async () => {
  const event = {
    title: 'Planning meeting',
    startAt: '2026-10-23T09:00:00+05:30',
    endAt: '2026-10-23T10:00:00+05:30',
    timeZone: 'Asia/Calcutta',
  };
  const result = await request(app)
    .post('/calendar/events')
    .set('Authorization', 'alice')
    .send(event)
    .expect(201);
  assert.equal(result.body.startAt, '2026-10-23T03:30:00.000Z');
  await request(app)
    .post('/calendar/events')
    .set('Authorization', 'alice')
    .send({ ...event, endAt: event.startAt })
    .expect(400);
  await request(app)
    .post('/calendar/events')
    .set('Authorization', 'alice')
    .send({ ...event, timeZone: 'Bad/Zone' })
    .expect(400);
  assert.equal(
    (await request(app).get('/calendar/events').set('Authorization', 'bob').expect(200)).body.total,
    0,
  );
  assert.equal(
    (
      await request(app)
        .get('/calendar/events?page=1&limit=1')
        .set('Authorization', 'alice')
        .expect(200)
    ).body.total,
    1,
  );
});
