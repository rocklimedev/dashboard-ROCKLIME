export function listRange(total, current, pageSize) {
  if (!total) return [0, 0];
  return [Math.min((current - 1) * pageSize + 1, total), Math.min(current * pageSize, total)];
}
