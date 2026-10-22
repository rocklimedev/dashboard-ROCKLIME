// Local adapter. Future server adapters must preserve these canonical records and
// external references; OAuth credentials must never be stored here.
export function createPlanningRepository(storage, ownerId) {
  const key = `cmtrading:planning:v1:${ownerId}`;
  return {
    load() {
      const raw = storage.getItem(key);
      if (!raw) return { tasks: [], events: [] };
      const data = JSON.parse(raw);
      if (!Array.isArray(data.tasks) || !Array.isArray(data.events)) {
        throw new Error('Saved planning data could not be read.');
      }
      return data;
    },
    save(data) {
      storage.setItem(key, JSON.stringify(data));
    },
  };
}

export function planningRecord(values, previous) {
  return {
    ...previous,
    ...values,
    id: previous?.id || crypto.randomUUID(),
    createdAt: previous?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    // IDs are strings: provider identifiers can exceed JS integer precision.
    external: previous?.external || null,
    syncState: previous?.external ? 'pending' : 'local',
  };
}
