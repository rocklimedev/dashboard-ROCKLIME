function resolveGstRate(value, settings) {
  const rate =
    value === undefined || value === null || value === '' ? settings.defaultGstRate : value;
  const n = Number(rate);
  if (!Number.isFinite(n) || n < 0)
    throw Object.assign(new Error('Invalid GST rate'), { status: 400 });
  return n;
}
module.exports = { resolveGstRate };
