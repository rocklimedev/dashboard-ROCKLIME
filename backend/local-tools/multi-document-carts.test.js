const test = require('node:test');
const assert = require('node:assert/strict');
const { initialWorkspace, transition } = require('../modules/cart/quotation-workspace');
const snapshot = (parent, product) => ({
  parent,
  layout: {
    localCartItems: [{ productId: product, quantity: 2 }],
    shipping: 75,
    gst: 18,
    itemDiscounts: { [product]: 10 },
  },
});

test('quotation, order and purchase order drafts retain independent products and form details', () => {
  const quote = snapshot(
    { selectedCustomer: 'customer-A', quotationData: { floors: [{ floorId: 'first' }] } },
    'tap',
  );
  const order = snapshot(
    {
      selectedCustomer: 'customer-B',
      orderData: { dueDate: '2026-11-01', assignedUserId: 'sales', extraDiscount: 15 },
    },
    'sink',
  );
  const po = snapshot(
    {
      selectedVendor: 'vendor-C',
      purchaseOrderData: {
        freight: 90,
        paymentTerms: 'Net 30',
        items: [{ productId: 'pipe', unitPrice: 120 }],
      },
    },
    'pipe',
  );
  let state = initialWorkspace();
  const quoteId = state.activeId;
  let result = transition(state, { action: 'document', documentType: 'order', snapshot: quote });
  state = result.workspace;
  const orderId = state.activeId;
  assert.deepEqual(result.items, []);
  assert.equal(state.drafts.find((d) => d.id === orderId).documentType, 'order');
  result = transition(state, {
    action: 'document',
    documentType: 'purchase-order',
    snapshot: order,
  });
  state = result.workspace;
  const poId = state.activeId;
  result = transition(state, { action: 'document', documentType: 'quotation', snapshot: po });
  assert.equal(result.workspace.activeId, quoteId);
  assert.deepEqual(result.items, quote.layout.localCartItems);
  result = transition(result.workspace, {
    action: 'document',
    documentType: 'order',
    snapshot: quote,
  });
  assert.equal(result.workspace.activeId, orderId);
  assert.deepEqual(result.workspace.drafts.find((d) => d.id === orderId).snapshot, order);
  result = transition(result.workspace, { action: 'switch', targetId: poId, snapshot: order });
  assert.deepEqual(result.workspace.drafts.find((d) => d.id === poId).snapshot, po);
  const complete = transition(result.workspace, { action: 'complete' });
  assert.equal(
    complete.workspace.drafts.find((d) => d.id === complete.workspace.activeId).documentType,
    'purchase-order',
  );
  assert.deepEqual(complete.workspace.drafts.find((d) => d.id === quoteId).snapshot, quote);
  assert.deepEqual(complete.workspace.drafts.find((d) => d.id === orderId).snapshot, order);
});
test('document tabs resume their last selected draft and older quotation carts are preserved', () => {
  let state = initialWorkspace('order');
  state = transition(state, {
    action: 'new',
    snapshot: snapshot({ orderData: {} }, 'tap'),
  }).workspace;
  const selectedOrder = state.activeId;
  state = transition(state, { action: 'document', documentType: 'quotation' }).workspace;
  assert.equal(
    transition(state, { action: 'document', documentType: 'order' }).workspace.activeId,
    selectedOrder,
  );
  const legacy = initialWorkspace();
  delete legacy.drafts[0].documentType;
  const migrated = transition(legacy, { action: 'document', documentType: 'purchase-order' });
  assert.equal(migrated.workspace.drafts[0].documentType, 'quotation');
  assert.throws(
    () => transition(legacy, { action: 'document', documentType: 'invalid' }),
    /Invalid document/,
  );
});

for (const documentType of ['quotation', 'order', 'purchase-order']) {
  test(`completing ${documentType} claims submitted products across all saved carts`, () => {
    let state = initialWorkspace(documentType);
    const completedId = state.activeId;
    const otherIds = [];
    for (const type of ['quotation', 'order', 'purchase-order']) {
      state = transition(state, { action: 'new', documentType: type }).workspace;
      otherIds.push(state.activeId);
      const saved = snapshot(
        {
          selectedCustomer: 'customer',
          purchaseOrderData: { freight: 90, items: [{ productId: 'tap' }, { productId: 'sink' }] },
        },
        'tap',
      );
      saved.layout.localCartItems.push({ productId: 'sink', quantity: 1 });
      saved.layout.itemTaxes = { tap: 18, sink: 5 };
      saved.layout.itemDiscountTypes = { tap: 'percent', sink: 'fixed' };
      state = transition(state, { action: 'save', snapshot: saved }).workspace;
    }
    state = transition(state, { action: 'switch', targetId: completedId }).workspace;
    const before = structuredClone(state);
    // Explicit submitted IDs work even when the active draft has not autosaved yet.
    const result = transition(state, { action: 'complete', claimedProductIds: ['tap'] });
    assert.deepEqual(state, before);
    assert.deepEqual(result.items, []);
    assert.ok(!result.workspace.drafts.some((d) => d.id === completedId));
    for (const id of otherIds) {
      const saved = result.workspace.drafts.find((d) => d.id === id).snapshot;
      assert.deepEqual(saved.layout.localCartItems, [{ productId: 'sink', quantity: 1 }]);
      assert.deepEqual(saved.parent.purchaseOrderData.items, [{ productId: 'sink' }]);
      assert.equal(saved.parent.selectedCustomer, 'customer');
      assert.equal(saved.parent.purchaseOrderData.freight, 90);
      assert.deepEqual(saved.layout.itemDiscounts, {});
      assert.deepEqual(saved.layout.itemTaxes, { sink: 5 });
      assert.deepEqual(saved.layout.itemDiscountTypes, { sink: 'fixed' });
      const resumed = transition(result.workspace, { action: 'switch', targetId: id });
      assert.deepEqual(resumed.items, saved.layout.localCartItems);
    }
  });
}

test('completion falls back to saved products, while deleting a draft does not claim them', () => {
  const first = initialWorkspace();
  let state = transition(first, { action: 'new', snapshot: snapshot({}, 'tap') }).workspace;
  state = transition(state, { action: 'save', snapshot: snapshot({}, 'tap') }).workspace;
  const deleted = transition(state, { action: 'delete', targetId: state.activeId });
  assert.equal(deleted.workspace.drafts[0].snapshot.layout.localCartItems.length, 1);
  const completed = transition(state, { action: 'complete' });
  assert.deepEqual(completed.workspace.drafts[0].snapshot.layout.localCartItems, []);
  assert.throws(
    () => transition(state, { action: 'complete', claimedProductIds: 'tap' }),
    /Invalid claimed/,
  );
});
