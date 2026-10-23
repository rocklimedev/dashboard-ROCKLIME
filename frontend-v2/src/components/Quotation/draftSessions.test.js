import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createSessionStorage,
  hasSessionContent,
  newSession,
  readSessions,
  storeSession,
  removeClaimedFromSessions,
} from './draftSessions.js';
const storage = () => {
  const entries = new Map();
  return { getItem: (key) => entries.get(key), setItem: (key, value) => entries.set(key, value) };
};
const blank = {
  parent: {
    selectedCustomer: '',
    quotationData: {
      quotationDate: '2026-10-21',
      signatureName: 'CM TRADING CO',
      discountType: 'fixed',
      floors: [],
    },
  },
  layout: { localCartItems: [], shipping: 0, gst: 0 },
};

test('untouched forms do not create session drafts, first edit does', () => {
  const db = storage();
  let session = storeSession(db, 'alice', newSession('quotation'), blank);
  assert.deepEqual(readSessions(db, 'alice').sessions, {});
  session = storeSession(db, 'alice', session, {
    ...blank,
    parent: { ...blank.parent, selectedCustomer: 'customer' },
  });
  assert.equal(
    readSessions(db, 'alice').sessions.quotation.snapshot.parent.selectedCustomer,
    'customer',
  );
  assert.deepEqual(readSessions(db, 'bob').sessions, {});
});
test('changing even a default date persists locally', () => {
  const db = storage();
  const session = storeSession(db, 'alice', newSession('quotation'), blank);
  storeSession(db, 'alice', session, {
    ...blank,
    parent: {
      ...blank.parent,
      quotationData: { ...blank.parent.quotationData, quotationDate: '2026-11-01' },
    },
  });
  assert.equal(readSessions(db, 'alice').sessions.quotation.hasChanges, true);
});
test('editing a saved working copy leaves the saved snapshot unchanged and keeps its identity', () => {
  const db = storage();
  const saved = {
    parent: { selectedCustomer: 'Alice' },
    layout: { localCartItems: [{ productId: 'tap' }] },
  };
  let session = { ...newSession('order', structuredClone(saved)), savedDraftId: 'saved-1' };
  session = storeSession(db, 'alice', session, {
    ...session.snapshot,
    parent: { selectedCustomer: 'Bob' },
  });
  assert.equal(saved.parent.selectedCustomer, 'Alice');
  assert.equal(readSessions(db, 'alice').sessions.order.savedDraftId, 'saved-1');
  assert.equal(session.snapshot.parent.selectedCustomer, 'Bob');
});
test('completion removes claimed products from other local sessions', () => {
  const bundle = {
    sessions: {
      order: newSession('order', {
        layout: { localCartItems: [{ productId: 'tap' }, { productId: 'sink' }] },
      }),
    },
  };
  removeClaimedFromSessions(bundle, ['tap']);
  assert.deepEqual(bundle.sessions.order.snapshot.layout.localCartItems, [{ productId: 'sink' }]);
  assert.equal(hasSessionContent(blank), false);
});

test('a reopened editor cannot restore an older session over API data', () => {
  const previousEditor = createSessionStorage();
  const snapshot = {
    parent: { quotationData: { gst: 0 } },
    layout: { localCartItems: [{ productId: 'old', quantity: 1 }] },
  };
  storeSession(previousEditor, 'alice', newSession('quotation'), snapshot);
  assert.equal(
    readSessions(previousEditor, 'alice').sessions.quotation.snapshot.layout.localCartItems[0]
      .productId,
    'old',
  );
  const reopenedEditor = createSessionStorage();
  assert.deepEqual(readSessions(reopenedEditor, 'alice'), { sessions: {} });
  assert.deepEqual(readSessions(previousEditor, 'bob'), { sessions: {} });
});
