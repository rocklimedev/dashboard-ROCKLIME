// Editor sessions are temporary. Persisted drafts are loaded through the cart API.
export function createSessionStorage() {
  const values = new Map();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
  };
}

export const sessionKey = (userId) => `document-sessions-v2-${userId}`;
export function readSessions(storage, userId) {
  try {
    return JSON.parse(storage.getItem(sessionKey(userId))) || { sessions: {} };
  } catch {
    return { sessions: {} };
  }
}
export function newSession(
  documentType,
  snapshot = { parent: {}, layout: { localCartItems: [] } },
) {
  return { id: crypto.randomUUID(), documentType, snapshot, savedDraftId: null };
}
export function hasSessionContent(snapshot) {
  const ignored = new Set(['quotationDate', 'orderDate', 'expectDeliveryDate', 'dueDate']);
  const defaults = {
    signatureName: 'CM TRADING CO',
    status: 'PREPARING',
    priority: 'medium',
    discountType: 'fixed',
    extraDiscountType: 'fixed',
  };
  const meaningful = (value, key) => {
    if (ignored.has(key) || value === defaults[key]) return false;
    if (Array.isArray(value)) return value.length > 0;
    if (value && typeof value === 'object')
      return Object.entries(value).some(([k, v]) => meaningful(v, k));
    return value != null && value !== false && value !== 0 && String(value).trim() !== '';
  };
  return meaningful(snapshot);
}
export function storeSession(storage, userId, session, snapshot) {
  const bundle = readSessions(storage, userId);
  bundle.sessions ||= {};
  const baseline = session.baseline || snapshot;
  const changed = JSON.stringify(snapshot) !== JSON.stringify(baseline);
  const next = {
    ...session,
    snapshot,
    baseline,
    hasChanges: changed || session.hasChanges || false,
  };
  if (hasSessionContent(snapshot) || changed || session.savedDraftId)
    bundle.sessions[session.documentType] = next;
  else delete bundle.sessions[session.documentType];
  bundle.activeType = session.documentType;
  storage.setItem(sessionKey(userId), JSON.stringify(bundle));
  return next;
}
export function removeClaimedFromSessions(bundle, ids) {
  const claimed = new Set(ids.map(String));
  for (const session of Object.values(bundle.sessions || {})) {
    const snapshot = session.snapshot;
    const keep = (item) => !claimed.has(String(item.productId ?? item.id));
    if (snapshot.layout?.localCartItems)
      snapshot.layout.localCartItems = snapshot.layout.localCartItems.filter(keep);
    for (const key of ['itemDiscounts', 'itemDiscountTypes', 'itemTaxes']) {
      if (snapshot.layout?.[key]) for (const id of claimed) delete snapshot.layout[key][id];
    }
    if (snapshot.parent?.purchaseOrderData?.items)
      snapshot.parent.purchaseOrderData.items =
        snapshot.parent.purchaseOrderData.items.filter(keep);
  }
  return bundle;
}
