const test = require('node:test');
const assert = require('node:assert/strict');
const { savedTransition } = require('../modules/cart/saved-drafts');
const empty = () => ({ version: 2, activeId: null, revision: 0, drafts: [] });
const snapshot = (name) => ({
  parent: { selectedCustomer: name },
  layout: { localCartItems: [{ productId: 'tap', quantity: 1 }] },
});
const run = (state, body) => savedTransition(state, { documentType: 'quotation', ...body });

test('empty sessions and default form values never create database drafts', () => {
  let state = empty();
  for (let i = 0; i < 3; i++) state = run(state, { action: 'session', items: [] }).workspace;
  assert.deepEqual(state.drafts, []);
  assert.throws(
    () =>
      run(state, {
        action: 'save',
        snapshot: {
          parent: {
            quotationData: {
              quotationDate: '2026-10-21',
              signatureName: 'CM TRADING CO',
              discountType: 'fixed',
              floors: [],
            },
          },
          layout: { localCartItems: [], shipping: 0, gst: 0 },
        },
      }),
    /enter a field/,
  );
});
test('session edits and switching never overwrite saved snapshots; repeated explicit saves update one entry', () => {
  const first = run(empty(), { action: 'save', snapshot: snapshot('Alice') });
  let state = first.workspace;
  const original = structuredClone(state.drafts[0]);
  for (let i = 0; i < 3; i++)
    state = run(state, { action: 'session', snapshot: snapshot('Bob'), items: [] }).workspace;
  assert.deepEqual(state.drafts, [original]);
  const updated = run(state, {
    action: 'save',
    savedDraftId: first.savedDraftId,
    snapshot: snapshot('Bob'),
  });
  assert.equal(updated.workspace.drafts.length, 1);
  assert.equal(updated.savedDraftId, first.savedDraftId);
  assert.equal(updated.workspace.drafts[0].snapshot.parent.selectedCustomer, 'Bob');
  assert.equal(first.workspace.drafts[0].snapshot.parent.selectedCustomer, 'Alice');
});
test('saving a field-only change survives future session operations', () => {
  const saved = run(empty(), {
    action: 'save',
    snapshot: { parent: { orderData: { dueDate: '2026-12-01' } } },
    hasChanges: true,
  });
  const next = run(saved.workspace, { action: 'session' });
  assert.equal(next.workspace.drafts.length, 1);
});
test('Save and new saves once and never inserts an empty replacement', () => {
  const saved = run(empty(), { action: 'new', snapshot: snapshot('Alice'), items: [] });
  assert.equal(saved.workspace.drafts.length, 1);
  assert.deepEqual(saved.items, []);
  assert.throws(
    () =>
      run(saved.workspace, { action: 'save', savedDraftId: 'missing', snapshot: snapshot('Bob') }),
    /no longer exists/,
  );
});
test('completion claims products in other saved drafts without generating empty drafts', () => {
  const first = run(empty(), { action: 'save', snapshot: snapshot('Alice') });
  const second = run(first.workspace, {
    action: 'save',
    snapshot: snapshot('Bob'),
    documentType: 'purchase-order',
  });
  const completed = run(second.workspace, {
    action: 'complete',
    savedDraftId: first.savedDraftId,
    claimedProductIds: ['tap'],
    items: [],
  });
  assert.equal(completed.workspace.drafts.length, 1);
  assert.deepEqual(completed.workspace.drafts[0].snapshot.layout.localCartItems, []);
  assert.deepEqual(completed.items, []);
});
