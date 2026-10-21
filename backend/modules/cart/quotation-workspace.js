const { randomUUID } = require("crypto");
const bad = message => Object.assign(new Error(message), { status: 400 });
const clone = value => JSON.parse(JSON.stringify(value));
const labels = { quotation: "Quotation", order: "Order", "purchase-order": "Purchase order" };
function initialWorkspace(documentType = "quotation") {
  if (!labels[documentType]) throw bad("Invalid document type");
  const id = randomUUID();
  return { revision: 0, activeId: id, drafts: [{ id, documentType, name: `${labels[documentType]} 1`, snapshot: {}, updatedAt: new Date().toISOString() }] };
}
function validateSnapshot(snapshot) {
  if (typeof snapshot !== "object" || snapshot === null || Array.isArray(snapshot) || JSON.stringify(snapshot).length > 4000000) throw bad("Invalid quotation cart snapshot");
  if (snapshot.layout?.localCartItems && !Array.isArray(snapshot.layout.localCartItems)) throw bad("Invalid cart products");
}
function transition(workspace, { action, snapshot, targetId, name, documentType, initialSnapshot = {}, claimedProductIds }, serverItems = []) {
  const next = clone(workspace);
  next.drafts.forEach(draft => { draft.documentType ||= "quotation"; });
  const current = next.drafts.find(draft => draft.id === next.activeId);
  const type = documentType || current?.documentType;
  if (!labels[type]) throw bad("Invalid document type");
  if (!current) throw bad("Active quotation cart not found");
  if (snapshot != null) {
    validateSnapshot(snapshot);
    current.snapshot = clone(snapshot);
    current.updatedAt = new Date().toISOString();
  }
  // The server may have received products from the catalogue since the last draft save.
  if (!current.snapshot.layout?.localCartItems) current.snapshot.layout = { ...current.snapshot.layout, localCartItems: clone(serverItems) };
  next.lastActive = { ...next.lastActive, [current.documentType]: current.id };
  if (action === "save") return { workspace: { ...next, revision: next.revision + 1 } };
  if (action === "rename") {
    const draft = next.drafts.find(d => d.id === (targetId || next.activeId));
    if (!draft || !String(name || "").trim()) throw bad("Enter a draft name");
    draft.name = String(name).trim().slice(0, 120);
  } else if (action === "switch") {
    if (!next.drafts.some(d => d.id === targetId)) throw bad("Quotation cart not found");
    next.activeId = targetId;
  } else if (action === "document" && next.drafts.some(d => d.documentType === type)) {
    const existing = next.drafts.find(d => d.id === next.lastActive[type]) || next.drafts.find(d => d.documentType === type);
    next.activeId = existing.id;
  } else if (["new", "complete", "delete", "document"].includes(action)) {
    if (action === "complete") {
      if (claimedProductIds != null && (!Array.isArray(claimedProductIds) || claimedProductIds.some(id => !["string", "number"].includes(typeof id)))) throw bad("Invalid claimed products");
      const claimed = new Set((claimedProductIds || current.snapshot.layout.localCartItems.map(item => item.productId)).filter(id => id != null).map(String));
      for (const draft of next.drafts) {
        if (draft.id === current.id) continue;
        const saved = draft.snapshot;
        const keep = item => !claimed.has(String(item.productId ?? item.id));
        if (saved.layout?.localCartItems) saved.layout.localCartItems = saved.layout.localCartItems.filter(keep);
        for (const key of ["itemDiscounts", "itemDiscountTypes", "itemTaxes"]) {
          if (saved.layout?.[key]) for (const id of claimed) delete saved.layout[key][id];
        }
        // PO checkout keeps its edited lines separately from the cart products.
        if (saved.parent?.purchaseOrderData?.items) saved.parent.purchaseOrderData.items = saved.parent.purchaseOrderData.items.filter(keep);
      }
    }
    if (action === "delete" || action === "complete") {
      const id = action === "complete" ? next.activeId : targetId;
      if (!next.drafts.some(d => d.id === id)) throw bad("Quotation cart not found");
      next.drafts = next.drafts.filter(d => d.id !== id);
      if (id !== next.activeId) return { workspace: { ...next, revision: next.revision + 1 } };
    }
    const id = randomUUID();
    validateSnapshot(initialSnapshot);
    let number = 1;
    while (next.drafts.some(draft => draft.name === `${labels[type]} ${number}`)) number++;
    next.drafts.push({ id, documentType: type, name: String(name || `${labels[type]} ${number}`).slice(0, 120), snapshot: clone(initialSnapshot), updatedAt: new Date().toISOString() });
    next.activeId = id;
  } else throw bad("Unknown quotation cart action");
  next.revision++;
  const active = next.drafts.find(d => d.id === next.activeId);
  next.lastActive[active.documentType] = active.id;
  return { workspace: next, ...(next.activeId !== workspace.activeId ? { items: active.snapshot.layout?.localCartItems || [] } : {}) };
}
module.exports = { initialWorkspace, transition };
