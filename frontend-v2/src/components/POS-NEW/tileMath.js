// Tile area → boxes maths, shared by the cart calculator and its check.
export function coverageFromProduct(product) {
  const m = (product?.metaDetails || []).find(
    (x) => x.slug === "coveragePerBox" || /^coverage/i.test(x.title || ""),
  );
  const v = Number(m?.value);
  return Number.isFinite(v) && v > 0 ? v : null;
}

export function boxesFor(area, coverage, wastagePct = 10) {
  const a = Number(area) || 0;
  const c = Number(coverage) || 0;
  if (a <= 0 || c <= 0) return 0;
  return Math.ceil((a * (1 + (Number(wastagePct) || 0) / 100)) / c - 1e-9);
}
