const test = require('node:test');
const assert = require('node:assert/strict');
const { initialWorkspace, transition } = require('../modules/cart/quotation-workspace');
const snapshot = {
  parent: {
    selectedCustomer: 'customer-A',
    quotationData: { documentTitle: 'Villa', floors: [{ floorId: 'f1' }], discountAmount: 10 },
    dealId: 'deal-A',
    billingAddressId: 'address-A',
    useBillingAddress: true,
  },
  layout: {
    localCartItems: [
      {
        productId: 'tap',
        quantity: 3,
        price: 100,
        isOptionFor: null,
        locations: [{ floorId: 'f1', roomId: 'r1', assignedQuantity: 3 }],
      },
    ],
    itemDiscounts: { tap: 15 },
    itemDiscountTypes: { tap: 'percent' },
    shipping: 50,
    gst: 18,
  },
};
test('save and new parks the complete quotation and opens an empty independent cart', () => {
  const first = initialWorkspace();
  const { workspace, items } = transition(first, { action: 'new', snapshot });
  assert.equal(workspace.drafts.length, 2);
  assert.notEqual(workspace.activeId, first.activeId);
  assert.deepEqual(items, []);
  assert.deepEqual(workspace.drafts[0].snapshot, snapshot);
  assert.deepEqual(first.drafts[0].snapshot, {}, 'input workspace is immutable');
  const secondSnapshot = {
    parent: { selectedCustomer: 'customer-B' },
    layout: { localCartItems: [{ productId: 'sink', quantity: 1 }] },
  };
  const restored = transition(workspace, {
    action: 'switch',
    targetId: first.activeId,
    snapshot: secondSnapshot,
  });
  assert.deepEqual(restored.items, snapshot.layout.localCartItems);
  assert.deepEqual(restored.workspace.drafts[0].snapshot.parent, snapshot.parent);
  assert.deepEqual(restored.workspace.drafts[1].snapshot, secondSnapshot);
});
test('publishing or deleting one cart preserves other quotation drafts', () => {
  const first = initialWorkspace();
  const second = transition(first, { action: 'new', snapshot }).workspace;
  const completed = transition(second, { action: 'complete' });
  assert.deepEqual(completed.items, []);
  assert.equal(completed.workspace.drafts.length, 2);
  assert.ok(completed.workspace.drafts.find((d) => d.id === first.activeId));
  const renamed = transition(completed.workspace, {
    action: 'rename',
    targetId: first.activeId,
    name: '  Villa A  ',
  });
  assert.equal(renamed.workspace.drafts.find((d) => d.id === first.activeId).name, 'Villa A');
  const deleted = transition(renamed.workspace, { action: 'delete', targetId: first.activeId });
  assert.equal(deleted.workspace.drafts.length, 1);
  assert.equal(deleted.workspace.activeId, completed.workspace.activeId);
  assert.equal(deleted.items, undefined);
});
test('invalid switches and malformed snapshots cannot mutate saved carts', () => {
  const workspace = initialWorkspace();
  assert.throws(
    () => transition(workspace, { action: 'switch', targetId: 'not-owned' }),
    /not found/,
  );
  assert.throws(
    () =>
      transition(workspace, {
        action: 'save',
        snapshot: { layout: { localCartItems: 'invalid' } },
      }),
    /Invalid cart/,
  );
  const saved = transition(workspace, { action: 'save' }, [
    { productId: 'catalogue-add', quantity: 2 },
  ]);
  assert.equal(
    saved.workspace.drafts[0].snapshot.layout.localCartItems[0].productId,
    'catalogue-add',
  );
});
