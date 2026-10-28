import { test } from 'node:test';
import assert from 'node:assert/strict';
import { duplicateQuotationLocation } from './duplicateQuotationLocation.js';
const floors = [{ floorId: 'f', floorName: 'Ground', rooms: [{ roomId: 'r', roomName: 'Master', areas: [{ areaId: 'a', areaName: 'Shower' }] }, { roomId: 's', roomName: 'Guest' }] }];
const products = [{ productId: 'p', qty: 7, sellingPrice: 100, flatPrice: 80, locations: [{ shareId: 'old', floorId: 'f', roomId: 'r', areaId: 'a', assignedQuantity: 2, priority: 3 }, { floorId: 'f', roomId: 's', assignedQuantity: 3 }] }];
let count = 0;
const id = () => `new-${++count}`;
test('room duplication preserves other shares and adds only copied quantity with fresh identifiers', () => {
  const copy = duplicateQuotationLocation(floors, products, 'f', 'r', id);
  assert.equal(copy.products[0].qty, 9);
  assert.equal(copy.products[0].flatPrice, 80);
  assert.equal(copy.products[0].locations.length, 3);
  const room = copy.floors[0].rooms[2];
  assert.equal(room.roomName, 'Master (copy)');
  const share = copy.products[0].locations[2];
  assert.equal(share.roomId, room.roomId);
  assert.equal(share.areaId, room.areas[0].areaId);
  assert.notEqual(share.shareId, 'old');
  assert.equal(products[0].qty, 7);
  assert.equal(floors[0].rooms.length, 2);
});
test('floor duplication copies every room and adds assigned quantities only', () => {
  const copy = duplicateQuotationLocation(floors, products, 'f', null, id);
  assert.equal(copy.floors[1].floorName, 'Ground (copy)');
  assert.equal(copy.floors[1].rooms.length, 2);
  assert.equal(copy.products[0].qty, 12);
  assert.ok(copy.products[0].locations.slice(2).every(l => l.floorId === copy.floorId));
});
test('cart quantities and legacy assignments are copied and repeated names stay unique', () => {
  const initial = [{ productId: 'p', quantity: 2, floorId: 'f', roomId: 'r', discount: 10 }];
  const first = duplicateQuotationLocation(floors, initial, 'f', 'r', id);
  assert.equal(first.products[0].quantity, 4);
  assert.equal(first.products[0].discount, 10);
  const second = duplicateQuotationLocation(first.floors, first.products, 'f', 'r', id);
  assert.equal(second.products[0].quantity, 6);
  assert.equal(second.floors[0].rooms[3].roomName, 'Master (copy 2)');
});
