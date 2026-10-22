import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createPlanningRepository, planningRecord } from './repository.js';

test('personal records persist independently for each profile', () => {
  const records = new Map();
  const storage = {
    getItem: (key) => records.get(key),
    setItem: (key, value) => records.set(key, value),
  };
  const first = createPlanningRepository(storage, 'first');
  const second = createPlanningRepository(storage, 'second');
  first.save({ tasks: [{ id: 'task' }], events: [] });
  assert.deepEqual(first.load().tasks, [{ id: 'task' }]);
  assert.deepEqual(second.load(), { tasks: [], events: [] });
});

test('linked edits preserve identity and provider references while marking pending', () => {
  const previous = {
    id: 'local',
    createdAt: '2026-01-01',
    external: { provider: 'zoho-projects', recordId: '99999999999999999999' },
  };
  const edited = planningRecord({ title: 'Edited' }, previous);
  assert.equal(edited.id, previous.id);
  assert.equal(edited.createdAt, previous.createdAt);
  assert.deepEqual(edited.external, previous.external);
  assert.equal(edited.syncState, 'pending');
  assert.equal(planningRecord({ title: 'New' }).syncState, 'local');
});

test('unreadable data and failed writes surface errors', () => {
  assert.throws(() => createPlanningRepository({ getItem: () => '{' }, 'user').load());
  assert.throws(() =>
    createPlanningRepository({ getItem: () => '{"tasks":null,"events":[]}' }, 'user').load(),
  );
  assert.throws(
    () =>
      createPlanningRepository(
        {
          setItem: () => {
            throw new Error('Storage full');
          },
        },
        'user',
      ).save({ tasks: [], events: [] }),
    /Storage full/,
  );
});
