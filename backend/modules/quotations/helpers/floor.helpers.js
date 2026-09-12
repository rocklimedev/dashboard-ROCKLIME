function buildFloorsFromProducts(products) {
  const floorMap = new Map();

  products.forEach((item) => {
    const locationList = Array.isArray(item.locations)
      ? item.locations
      : item.floorId
        ? [{ floorId: item.floorId, floorName: item.floorName }]
        : [];

    locationList.forEach((loc) => {
      if (!loc.floorId) return;

      if (!floorMap.has(loc.floorId)) {
        floorMap.set(loc.floorId, {
          floorId: loc.floorId,
          floorName: loc.floorName || `Floor ${floorMap.size + 1}`,
          sortOrder: floorMap.size,
          rooms: [],
        });
      }

      const floor = floorMap.get(loc.floorId);
      if (loc.roomId && !floor.rooms.some((r) => r.roomId === loc.roomId)) {
        floor.rooms.push({
          roomId: loc.roomId,
          roomName: loc.roomName || "Unnamed Room",
          areas: [],
          sortOrder: floor.rooms.length,
        });
      }
    });
  });

  return Array.from(floorMap.values());
}

module.exports = {
  buildFloorsFromProducts,
};
