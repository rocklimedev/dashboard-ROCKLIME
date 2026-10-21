export const shareKey = (loc) => loc?.shareId || `${loc?.floorId || ''}::${loc?.roomId || ''}`;

// Keep one product entry and add quantity to the active floor/room share.
export const addCatalogShare = (products, newProduct, target, shareId) => {
  const index = products.findIndex((p) => p.productId === newProduct.productId);
  const priority = nextSectionPriority(products, target.floorId, target.roomId);
  const share = { ...target, shareId, areaId: null, areaName: null, assignedQuantity: 1, priority };
  if (index === -1) return [...products, { ...newProduct, priority, locations: [share] }];
  const product = products[index];
  const locations = product.locations?.length
    ? product.locations
    : [
        {
          floorId: product.floorId || null,
          roomId: product.roomId || null,
          floorName: product.floorName || null,
          roomName: product.roomName || null,
          areaId: product.areaId || null,
          areaName: product.areaName || null,
          assignedQuantity: Number(product.qty) || 0,
          priority: product.priority ?? 0,
        },
      ];
  const matching = locations.findIndex(
    (l) =>
      (l.floorId || null) === (target.floorId || null) &&
      (l.roomId || null) === (target.roomId || null),
  );
  const updated =
    matching === -1
      ? [...locations, share]
      : locations.map((l, i) =>
          i === matching ? { ...l, assignedQuantity: (Number(l.assignedQuantity) || 0) + 1 } : l,
        );
  const single = updated.length === 1 ? updated[0] : null;
  return products.map((p, i) =>
    i === index
      ? {
          ...p,
          companyCode: p.companyCode || newProduct.companyCode,
          qty: updated.reduce((sum, l) => sum + (Number(l.assignedQuantity) || 0), 0),
          locations: updated,
          floorId: single?.floorId || null,
          roomId: single?.roomId || null,
          floorName: single?.floorName || null,
          roomName: single?.roomName || null,
        }
      : p,
  );
};

export const nextSectionPriority = (products, floorId, roomId) => {
  const priorities = products.flatMap((p) => {
    const locations = p.locations?.length ? p.locations : [{ ...p, priority: p.priority }];
    return locations
      .filter(
        (l) => (l.floorId || null) === (floorId || null) && (l.roomId || null) === (roomId || null),
      )
      .map((l) => Number(l.priority ?? p.priority) || 0);
  });
  return Math.max(-1, ...priorities) + 1;
};

export const reorderShares = (products, rows) => {
  const order = new Map(rows.map((row, index) => [`${row.productId}::${row._locationKey}`, index]));
  return products.map((p) => {
    const locations = p.locations?.length
      ? p.locations
      : [
          {
            floorId: p.floorId || null,
            roomId: p.roomId || null,
            floorName: p.floorName || null,
            roomName: p.roomName || null,
            areaId: p.areaId || null,
            areaName: p.areaName || null,
            assignedQuantity: Number(p.qty) || 0,
            priority: p.priority ?? 0,
          },
        ];
    let changed = false;
    const updated = locations.map((l) => {
      const key = `${p.productId}::${shareKey(l)}`;
      if (!order.has(key)) return l;
      changed = true;
      return { ...l, priority: order.get(key) };
    });
    return changed
      ? {
          ...p,
          locations: updated,
          priority: updated.length === 1 ? updated[0].priority : p.priority,
        }
      : p;
  });
};
