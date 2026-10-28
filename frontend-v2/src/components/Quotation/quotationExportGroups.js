// PDF pagination is an implementation detail: selection and sorting operate on rooms.
export function groupExportPages(pages, pageOrder, floors = []) {
  const rank = new Map((pageOrder ?? pages.map(page => page.id)).map((id, index) => [id, index]));
  const groups = new Map();
  for (const page of pages) {
    const label = page.label.replace(/ \(continued \d+\)$/, '');
    if (!groups.has(label)) groups.set(label, { id: `room:${label}`, label, pages: [] });
    groups.get(label).pages.push(page.id);
  }
  const floorGroups = new Map();
  for (const room of groups.values()) {
    const floor = floors.find(f => labelMatchesFloor(room.label, f));
    const split = room.label.indexOf(' · ');
    const floorLabel = floor?.floorName || (split >= 0 ? room.label.slice(0, split) : null);
    const key = floorLabel ? `floor:${floorLabel}` : room.id;
    if (!floorGroups.has(key)) floorGroups.set(key, { id: key, label: floorLabel || room.label, isFloor: !!floorLabel, rooms: [] });
    if (floorLabel && room.label.startsWith(`${floorLabel} · `)) room.label = room.label.slice(floorLabel.length + 3);
    floorGroups.get(key).rooms.push(room);
  }
  const position = ids => Math.min(...ids.map(id => rank.get(id) ?? (pages.length + id)));
  const result = [...floorGroups.values()];
  for (const floor of result) floor.rooms.sort((a, b) => position(a.pages) - position(b.pages));
  return result.sort((a, b) => position(a.rooms.flatMap(r => r.pages)) - position(b.rooms.flatMap(r => r.pages)));
}
function labelMatchesFloor(label, floor) {
  return label === floor.floorName || label.startsWith(`${floor.floorName} · `) ||
    (floor.rooms || []).some(room => label === room.roomName);
}
export function flattenExportGroups(groups, selected) {
  const included = new Set(selected);
  return groups.flatMap(floor => floor.rooms.flatMap(room => room.pages.filter(id => included.has(id))));
}
