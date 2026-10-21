const { randomUUID } = require('crypto');
const bad = (message) => Object.assign(new Error(message), { status: 400 });
const labels = { quotation: 'Quotation', order: 'Order', 'purchase-order': 'Purchase order' };
const defaults = {
  signatureName: 'CM TRADING CO',
  status: 'PREPARING',
  priority: 'medium',
  discountType: 'fixed',
  extraDiscountType: 'fixed',
};
function hasContent(value, key = '') {
  if (
    ['quotationDate', 'orderDate', 'expectDeliveryDate', 'dueDate'].includes(key) ||
    value === defaults[key]
  )
    return false;
  if (Array.isArray(value)) return value.length > 0;
  if (value && typeof value === 'object')
    return Object.entries(value).some(([k, v]) => hasContent(v, k));
  return (
    value !== null &&
    value !== undefined &&
    value !== false &&
    value !== 0 &&
    String(value).trim() !== ''
  );
}
function removeClaimed(snapshot, ids) {
  const keep = (item) => !ids.has(String(item.productId ?? item.id));
  if (snapshot.layout?.localCartItems)
    snapshot.layout.localCartItems = snapshot.layout.localCartItems.filter(keep);
  for (const key of ['itemDiscounts', 'itemDiscountTypes', 'itemTaxes']) {
    if (snapshot.layout?.[key]) for (const id of ids) delete snapshot.layout[key][id];
  }
  if (snapshot.parent?.purchaseOrderData?.items)
    snapshot.parent.purchaseOrderData.items = snapshot.parent.purchaseOrderData.items.filter(keep);
}
function savedTransition(workspace, body) {
  const next = structuredClone(workspace);
  // Existing nonempty drafts remain available when upgrading from autosaved carts.
  if (next.version !== 2) next.drafts = next.drafts.filter((d) => hasContent(d.snapshot));
  const { action, snapshot, documentType, savedDraftId, targetId, name } = body;
  if (!labels[documentType]) throw bad('Invalid document type');
  if (
    snapshot != null &&
    (typeof snapshot !== 'object' ||
      Array.isArray(snapshot) ||
      JSON.stringify(snapshot).length > 4000000 ||
      (snapshot.layout?.localCartItems != null && !Array.isArray(snapshot.layout.localCartItems)))
  )
    throw bad('Invalid cart snapshot');
  let result = {};
  if (action === 'save' || action === 'new') {
    if (!snapshot || (!hasContent(snapshot) && body.hasChanges !== true))
      throw bad('Add products or enter a field before saving a draft');
    let draft = savedDraftId ? next.drafts.find((d) => d.id === savedDraftId) : null;
    if (savedDraftId && !draft)
      throw bad('Saved draft no longer exists. Reopen your drafts before saving');
    if (!draft) {
      draft = {
        id: randomUUID(),
        documentType,
        name: `${labels[documentType]} ${next.drafts.length + 1}`,
      };
      next.drafts.push(draft);
    }
    draft.snapshot = structuredClone(snapshot);
    draft.updatedAt = new Date().toISOString();
    result.savedDraftId = draft.id;
  } else if (action === 'rename' || action === 'delete') {
    const draft = next.drafts.find((d) => d.id === targetId);
    if (!draft) throw bad('Saved draft not found');
    if (action === 'delete') next.drafts = next.drafts.filter((d) => d.id !== targetId);
    else {
      if (!String(name || '').trim()) throw bad('Enter a draft name');
      draft.name = String(name).trim().slice(0, 120);
    }
  } else if (action === 'complete') {
    if (
      !Array.isArray(body.claimedProductIds) ||
      body.claimedProductIds.some((id) => !['string', 'number'].includes(typeof id))
    )
      throw bad('Invalid claimed products');
    const ids = new Set(body.claimedProductIds.map(String));
    next.drafts = next.drafts.filter((d) => d.id !== savedDraftId);
    next.drafts.forEach((d) => removeClaimed(d.snapshot, ids));
  } else if (action !== 'session') throw bad('Unknown draft action');
  next.revision++;
  next.version = 2;
  if (
    body.items != null &&
    (!Array.isArray(body.items) ||
      body.items.some((item) => !item || typeof item !== 'object' || !item.productId))
  )
    throw bad('Invalid cart products');
  return { workspace: next, ...result, ...(body.items ? { items: body.items } : {}) };
}
module.exports = { savedTransition, hasContent, removeClaimed };
