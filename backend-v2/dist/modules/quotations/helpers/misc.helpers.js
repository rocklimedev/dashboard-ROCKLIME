"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.META_SLUGS = exports.generateRoomId = exports.generateFloorId = exports.generateGroupId = void 0;
exports.buildFloorsFromProducts = buildFloorsFromProducts;
exports.getMetaValue = getMetaValue;
exports.extractFirstImageUrl = extractFirstImageUrl;
const uuid_1 = require("uuid");
function buildFloorsFromProducts(products) {
    const floorMap = new Map();
    products.forEach((item) => {
        const locationList = Array.isArray(item.locations)
            ? item.locations
            : item.floorId
                ? [{ floorId: item.floorId, floorName: item.floorName }]
                : [];
        locationList.forEach((loc) => {
            if (!loc.floorId)
                return;
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
                    roomName: loc.roomName || 'Unnamed Room',
                    areas: [],
                    sortOrder: floor.rooms.length,
                });
            }
        });
    });
    return Array.from(floorMap.values());
}
const generateGroupId = () => 'grp-' + (0, uuid_1.v4)().slice(0, 8);
exports.generateGroupId = generateGroupId;
const generateFloorId = () => 'fl_' + (0, uuid_1.v4)().slice(0, 8);
exports.generateFloorId = generateFloorId;
const generateRoomId = (floorId = '') => (floorId ? floorId + '_' : 'rm_') + (0, uuid_1.v4)().slice(0, 8);
exports.generateRoomId = generateRoomId;
exports.META_SLUGS = {
    sellingPrice: '9ba862ef-f993-4873-95ef-1fef10036aa5',
    companyCode: 'd11da9f9-3f2e-4536-8236-9671200cca4a',
    barcode: '4ded1cb3-5d31-42e8-90ec-a381a6ab1e35',
    productGroup: '81cd6d76-d7d2-4226-b48e-6704e6224c2b',
};
function getMetaValue(meta, uuid) {
    if (!meta || !uuid)
        return null;
    let parsed = meta;
    if (typeof meta === 'string') {
        try {
            parsed = JSON.parse(meta);
        }
        catch {
            return null;
        }
    }
    if (!parsed || typeof parsed !== 'object')
        return null;
    return parsed[uuid] || null;
}
function extractFirstImageUrl(imagesField) {
    if (!imagesField)
        return null;
    try {
        if (Array.isArray(imagesField))
            return imagesField[0] || null;
        if (typeof imagesField === 'string') {
            const trimmed = imagesField.trim();
            if (trimmed.startsWith('http'))
                return trimmed;
            const parsed = JSON.parse(trimmed);
            if (Array.isArray(parsed))
                return parsed[0] || null;
            if (typeof parsed === 'string' && parsed.startsWith('http'))
                return parsed;
        }
        return null;
    }
    catch {
        const str = String(imagesField).trim();
        if (str.startsWith('http'))
            return str.replace(/^["']|["']$/g, '');
        return null;
    }
}
//# sourceMappingURL=misc.helpers.js.map