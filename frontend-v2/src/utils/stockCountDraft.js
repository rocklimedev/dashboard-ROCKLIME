/** Pending count quantities are backed up locally and saved serially to the draft. */
export function createStockCountDraft({ key, storage, save, onChange, delay = 1200 }) {
  let pending = {}, edits = {}, timer = null, running = null, active = true, writable = true;
  let status = "Draft up to date", saving = false, storageFailed = false;
  const notify = () => { if (active) onChange({ edits: { ...edits }, pendingCount: Object.keys(pending).length, status, saving, ready: true }); };
  const backup = () => {
    if (!active) return;
    try {
      if (Object.keys(pending).length) storage.setItem(key, JSON.stringify({ edits: pending, savedAt: new Date().toISOString() }));
      else storage.removeItem(key);
      storageFailed = false;
    } catch { storageFailed = true; }
  };
  const cancel = () => { clearTimeout(timer); timer = null; };
  const schedule = () => { cancel(); if (active && writable && Object.keys(pending).length) timer = setTimeout(() => { void flush(); }, delay); };
  async function flush() {
    cancel();
    if (running) return running;
    if (!active || !writable) return !Object.keys(pending).length;
    running = Promise.resolve().then(async () => {
      while (active && writable && Object.keys(pending).length) {
        const snapshot = { ...pending };
        saving = true; status = "Saving draft…"; notify();
        try {
          await save(Object.entries(snapshot).map(([productId, countedQty]) => ({ productId, countedQty })));
        } catch {
          if (!active || !writable) return false;
          saving = false; backup();
          status = storageFailed ? "Draft not saved. Keep this page open and retry Save." : "Server save failed. Draft kept in this browser; retry Save or reconnect.";
          notify(); return false;
        }
        if (!active || !writable) return false;
        for (const [id, value] of Object.entries(snapshot)) if (pending[id] === value) delete pending[id];
        backup();
      }
      saving = false; status = "Draft saved"; notify(); return true;
    });
    try { return await running; } finally { running = null; }
  }
  function restore(serverLines) {
    const validIds = new Set(serverLines.map(line => line.productId));
    const serverValues = new Map(serverLines.map(line => [line.productId, line.countedQty == null ? null : Number(line.countedQty)]));
    try {
      const saved = JSON.parse(storage.getItem(key));
      for (const [id, value] of Object.entries(saved?.edits || {})) {
        if (!validIds.has(id) || !(value === null || Number.isSafeInteger(value) && value >= 0)) continue;
        if (serverValues.get(id) !== value) pending[id] = value;
      }
    } catch { /* An unavailable or malformed backup must not block counting. */ }
    edits = { ...pending };
    status = Object.keys(pending).length ? "Draft restored; waiting to save" : "Draft up to date";
    backup(); notify(); schedule();
  }
  function receive(serverLines, enabled, approved = false) {
    writable = enabled;
    if (!writable) {
      cancel(); saving = false;
      if (approved) { pending = {}; edits = {}; backup(); }
      status = approved ? "Count approved" : "Read-only count"; notify(); return;
    }
    for (const line of serverLines) {
      const value = line.countedQty == null ? null : Number(line.countedQty);
      if (!(line.productId in pending) && edits[line.productId] === value) delete edits[line.productId];
    }
    notify();
  }
  function edit(productId, value) {
    if (!active || !writable) return;
    const countedQty = value === null || value === "" ? null : Number(value);
    if (countedQty !== null && (!Number.isSafeInteger(countedQty) || countedQty < 0)) return;
    pending[productId] = countedQty; edits[productId] = countedQty;
    backup();
    status = storageFailed ? "Browser backup unavailable; waiting for server save" : "Draft backed up; waiting to save";
    notify(); schedule();
  }
  return { restore, receive, edit, flush, dispose() { cancel(); active = false; } };
}
