import { test } from 'node:test';
import assert from 'node:assert/strict';
import dayjs from 'dayjs';
import { monthDays, weekStart, itemsOnDay, layoutDayEvents } from './calendarHelpers.js';

test('month grid starts on Monday and includes all dates across year and leap boundaries', () => {
  for (const month of ['2024-02-15', '2026-12-31', '2027-01-01']) {
    const selected = dayjs(month);
    const days = monthDays(selected);
    assert.equal(days.length, 42);
    assert.equal(days[0].day(), 1);
    assert.equal(
      days.filter((day) => day.isSame(selected, 'month')).length,
      selected.daysInMonth(),
    );
    assert.equal(weekStart(dayjs('2026-10-25')).format('YYYY-MM-DD'), '2026-10-19');
  }
});
const event = (id, start, end) => ({
  id,
  title: id,
  startAt: `2026-10-22T${start}:00`,
  endAt: `2026-10-22T${end}:00`,
});

test('midnight endpoints are exclusive while date-only task deadlines stay on their day', () => {
  const events = [
    { id: 'overnight', startAt: '2026-10-21T23:00:00', endAt: '2026-10-22T00:00:00' },
  ];
  assert.equal(itemsOnDay(dayjs('2026-10-22'), events).length, 0);
  assert.equal(itemsOnDay(dayjs('2026-10-21'), events).length, 1);
  assert.equal(
    itemsOnDay(dayjs('2026-10-22'), events, [{ id: 'due', dueDate: '2026-10-22' }])[0].kind,
    'task',
  );
});

test('overlapping appointments get separate lanes; disjoint groups regain full width', () => {
  const entries = layoutDayEvents(dayjs('2026-10-22'), [
    event('a', '09:00', '10:30'),
    event('b', '10:00', '11:00'),
    event('c', '10:45', '12:00'),
    event('d', '14:00', '15:00'),
  ]);
  assert.equal(entries[0].lanes, 2);
  assert.notEqual(entries[0].lane, entries[1].lane);
  assert.notEqual(entries[1].lane, entries[2].lane);
  assert.equal(entries[3].lanes, 1);
});

test('multi-day events are clipped to visible day boundaries', () => {
  const [entry] = layoutDayEvents(dayjs('2026-10-22'), [
    { id: 'long', startAt: '2026-10-21T20:00:00', endAt: '2026-10-23T10:00:00' },
  ]);
  assert.equal(entry.startMinute, 0);
  assert.equal(entry.endMinute, 1440);
});
