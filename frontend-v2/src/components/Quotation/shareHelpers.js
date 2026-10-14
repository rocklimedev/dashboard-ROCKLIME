export const shareKey = (loc) => loc?.shareId || `${loc?.floorId || ""}::${loc?.roomId || ""}`;

export const nextSectionPriority = (products, floorId, roomId) => {
  const priorities = products.flatMap((p) => {
    const locations = p.locations?.length ? p.locations : [{ ...p, priority: p.priority }];
    return locations.filter((l) => (l.floorId || null) === (floorId || null) &&
      (l.roomId || null) === (roomId || null)).map((l) => Number(l.priority ?? p.priority) || 0);
  });
  return Math.max(-1, ...priorities) + 1;
};

export const reorderShares = (products, rows) => {
  const order = new Map(rows.map((row, index) => [`${row.productId}::${row._locationKey}`, index]));
  return products.map((p) => {
    const locations = p.locations?.length ? p.locations : [{
      floorId: p.floorId || null, roomId: p.roomId || null,
      floorName: p.floorName || null, roomName: p.roomName || null,
      areaId: p.areaId || null, areaName: p.areaName || null,
      assignedQuantity: Number(p.qty) || 0, priority: p.priority ?? 0,
    }];
    let changed = false;
    const updated = locations.map((l) => {
      const key = `${p.productId}::${shareKey(l)}`;
      if (!order.has(key)) return l;
      changed = true;
      return { ...l, priority: order.get(key) };
    });
    return changed ? { ...p, locations: updated,
      priority: updated.length === 1 ? updated[0].priority : p.priority } : p;
  });
};
