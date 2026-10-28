/** Copy layout assignments, increasing product quantities without consuming existing shares. */
export function duplicateQuotationLocation(floors, products, floorId, roomId, makeId) {
  const source = floors.find(f => f.floorId === floorId);
  if (!source) return { floors, products };
  const sourceRooms = (source.rooms || []).filter(r => !roomId || r.roomId === roomId);
  if (roomId && !sourceRooms.length) return { floors, products };
  const copyName = (name, siblings, field) => {
    let index = 1;
    let value;
    do { value = `${name} (copy${index === 1 ? '' : ` ${index}`})`; index++; }
    while (siblings.some(s => s[field] === value));
    return value;
  };
  const newFloorId = roomId ? floorId : makeId();
  const floorName = roomId ? source.floorName : copyName(source.floorName, floors, 'floorName');
  const roomMap = new Map();
  const areaMap = new Map();
  const rooms = sourceRooms.map(room => {
    const copy = {
      ...room, roomId: makeId(),
      roomName: roomId ? copyName(room.roomName, source.rooms || [], 'roomName') : room.roomName,
      areas: (room.areas || []).map(area => {
        const areaId = makeId();
        areaMap.set(area.areaId, areaId);
        return { ...area, areaId };
      }),
    };
    roomMap.set(room.roomId, copy);
    return copy;
  });
  const nextFloors = roomId
    ? floors.map(f => f.floorId === floorId ? { ...f, rooms: [...(f.rooms || []), ...rooms.map((r, i) => ({ ...r, sortOrder: (f.rooms || []).length + i }))] } : f)
    : [...floors, { ...source, floorId: newFloorId, floorName, implicit: false, sortOrder: floors.length, rooms }];
  const nextProducts = products.map(product => {
    const quantityField = Object.hasOwn(product, 'qty') ? 'qty' : 'quantity';
    const quantity = Number(product[quantityField]) || 0;
    const locations = product.locations?.length ? product.locations : [{
      floorId: product.floorId, roomId: product.roomId, floorName: product.floorName,
      roomName: product.roomName, assignedQuantity: quantity, priority: product.priority,
    }];
    const copies = locations.filter(l => l.floorId === floorId && roomMap.has(l.roomId) && Number(l.assignedQuantity) > 0).map(location => ({
      ...location, shareId: makeId(), floorId: newFloorId, floorName,
      roomId: roomMap.get(location.roomId).roomId, roomName: roomMap.get(location.roomId).roomName,
      areaId: areaMap.get(location.areaId) || null,
    }));
    if (!copies.length) return product;
    const addedQuantity = copies.reduce((sum, l) => sum + Number(l.assignedQuantity), 0);
    return { ...product, [quantityField]: quantity + addedQuantity, locations: [...locations, ...copies] };
  });
  return { floors: nextFloors, products: nextProducts, floorId: newFloorId, roomId: roomId ? rooms[0].roomId : rooms[0]?.roomId };
}
