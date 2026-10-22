import dayjs from 'dayjs';

export function weekStart(date) {
  return date.startOf('day').subtract((date.day() + 6) % 7, 'day');
}
export function monthDays(date) {
  const start = weekStart(date.startOf('month'));
  return Array.from({ length: 42 }, (_, index) => start.add(index, 'day'));
}
export function itemsOnDay(date, events, tasks = []) {
  const start = date.startOf('day');
  const end = start.add(1, 'day');
  return [
    ...tasks
      .filter((task) => task.dueDate === date.format('YYYY-MM-DD'))
      .map((task) => ({ ...task, kind: 'task' })),
    ...events
      .filter((event) => dayjs(event.startAt).isBefore(end) && dayjs(event.endAt).isAfter(start))
      .map((event) => ({ ...event, kind: 'event' })),
  ].sort((a, b) => (a.startAt || '').localeCompare(b.startAt || ''));
}

// Allocate columns within each overlapping event group, including chained
// overlaps. A short appointment keeps its own lane instead of hiding another.
export function layoutDayEvents(date, events) {
  const startOfDay = date.startOf('day');
  const endOfDay = startOfDay.add(1, 'day');
  const entries = itemsOnDay(date, events)
    .map((event) => {
      const start = dayjs(event.startAt);
      const end = dayjs(event.endAt);
      const startMinute = start.isBefore(startOfDay) ? 0 : start.hour() * 60 + start.minute();
      const endMinute = !end.isBefore(endOfDay) ? 1440 : end.hour() * 60 + end.minute();
      return { ...event, startMinute, endMinute, visualEnd: Math.max(startMinute + 30, endMinute) };
    })
    .sort((a, b) => a.startMinute - b.startMinute || b.endMinute - a.endMinute);
  let group = [],
    groupEnd = 0;
  const finish = () => {
    const lanes = [];
    for (const event of group) {
      let lane = lanes.findIndex((end) => end <= event.startMinute);
      if (lane === -1) lane = lanes.length;
      lanes[lane] = event.visualEnd;
      event.lane = lane;
    }
    for (const event of group) event.lanes = lanes.length;
  };
  for (const event of entries) {
    if (group.length && event.startMinute >= groupEnd) {
      finish();
      group = [];
    }
    group.push(event);
    groupEnd = Math.max(...group.map((item) => item.visualEnd));
  }
  finish();
  return entries;
}
