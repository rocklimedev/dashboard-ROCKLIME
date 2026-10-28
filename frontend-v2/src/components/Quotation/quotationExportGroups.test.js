import { test } from 'node:test';
import assert from 'node:assert/strict';
import { groupExportPages, flattenExportGroups } from './quotationExportGroups.js';
const pages = [
  { id: 0, label: 'Cover page' },
  { id: 1, label: 'Ground · Master' },
  { id: 2, label: 'Ground · Master (continued 2)' },
  { id: 3, label: 'Ground · Guest' },
  { id: 4, label: 'First · Master' },
  { id: 5, label: 'First · Master (continued 2)' },
  { id: 6, label: 'Quotation summary' },
];
test('rooms group their continuation pages under the correct floor', () => {
  const groups = groupExportPages(pages, null);
  assert.equal(groups.length, 4);
  assert.deepEqual(groups[1].rooms.map(r => [r.label, r.pages]), [['Master', [1, 2]], ['Guest', [3]]]);
  assert.deepEqual(groups[2].rooms[0].pages, [4, 5]);
});
test('moving a floor carries all room pages; room pagination stays in source order', () => {
  const groups = groupExportPages(pages, [0, 2, 1, 3, 4, 5, 6]);
  const reordered = [groups[0], groups[2], groups[1], groups[3]];
  assert.deepEqual(flattenExportGroups(reordered, pages.map(p => p.id)), [0, 4, 5, 1, 2, 3, 6]);
  reordered[2].rooms.reverse();
  assert.deepEqual(flattenExportGroups(reordered, [0, 1, 2, 3, 6]), [0, 3, 1, 2, 6]);
});
test('single-floor room labels resolve using the quotation floor structure', () => {
  const groups = groupExportPages([{ id: 0, label: 'Master' }, { id: 1, label: 'Master (continued 2)' }], null,
    [{ floorName: 'Ground', rooms: [{ roomName: 'Master' }] }]);
  assert.equal(groups[0].label, 'Ground');
  assert.deepEqual(groups[0].rooms[0].pages, [0, 1]);
});
