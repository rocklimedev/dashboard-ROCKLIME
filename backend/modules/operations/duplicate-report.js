const normalize = (value) =>
  String(value ?? "")
    .normalize("NFKC")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
function parse(value) {
  return typeof value === "string" ? JSON.parse(value) : value;
}
function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === "object")
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, stable(value[key])]),
    );
  return value;
}
function similarity(a, b) {
  if (a === b) return 1;
  if (!a || !b) return 0;
  let previous = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const current = [i];
    for (let j = 1; j <= b.length; j++)
      current[j] = Math.min(
        current[j - 1] + 1,
        previous[j] + 1,
        previous[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
    previous = current;
  }
  return 1 - previous[b.length] / Math.max(a.length, b.length);
}
function buildDuplicateReport(products, productMetas, threshold = 0.9) {
  if (!Array.isArray(products) || !Array.isArray(productMetas))
    throw new Error("Products and productMetas must be arrays");
  if (!Number.isFinite(threshold) || threshold < 0.9 || threshold > 1)
    throw new Error("Threshold must be between 0.9 and 1");
  const codeIds = productMetas
    .filter(
      (field) => normalize(field.slug).replace(/[_\s-]/g, "") === "companycode",
    )
    .map((field) => field.id);
  const buckets = new Map();
  const skipped = [];
  for (const original of products) {
    let product;
    try {
      product = { ...original, meta: parse(original.meta) || {} };
      for (const field of ["images", "variantOptions"])
        if (product[field] != null) product[field] = parse(product[field]);
    } catch {
      skipped.push({ product: original, reason: "invalid_json" });
      continue;
    }
    const codes = [
      ...new Set(
        [
          ...codeIds.map((id) => product.meta[id]),
          product.meta.companyCode,
          product.meta.company_code,
          product.companyCode,
          product.company_code,
        ]
          .map(normalize)
          .filter(Boolean),
      ),
    ];
    if (codes.length !== 1 || !normalize(product.name)) {
      skipped.push({
        product: original,
        reason:
          codes.length > 1
            ? "conflicting_company_codes"
            : !codes.length
              ? "missing_company_code"
              : "missing_name",
      });
      continue;
    }
    if (!buckets.has(codes[0])) buckets.set(codes[0], []);
    buckets.get(codes[0]).push(product);
  }
  const exact = [],
    review = [];
  const ignored = new Set([
    "productId",
    "product_code",
    "createdAt",
    "updatedAt",
  ]);
  for (const [companyCode, group] of buckets) {
    for (let i = 0; i < group.length; i++)
      for (let j = i + 1; j < group.length; j++) {
        const left = group[i],
          right = group[j];
        const a = normalize(left.name),
          b = normalize(right.name);
        if (
          Math.min(a.length, b.length) / Math.max(a.length, b.length) <
          threshold
        )
          continue;
        const score = similarity(a, b);
        if (score + Number.EPSILON < threshold) continue;
        const differences = Object.keys({ ...left, ...right })
          .filter(
            (key) =>
              !ignored.has(key) &&
              JSON.stringify(stable(left[key])) !==
                JSON.stringify(stable(right[key])),
          )
          .map((field) => ({
            field,
            left: left[field] ?? null,
            right: right[field] ?? null,
          }));
        const pair = {
          companyCode,
          nameSimilarity: Number(score.toFixed(6)),
          matchType: a === b ? "same_normalized_name" : "similar_name",
          differences,
          products: [left, right],
        };
        // Any business-field difference, including variant, stock or brand, requires review.
        (differences.length ? review : exact).push(pair);
      }
  }
  return {
    exact,
    review,
    skipped,
    summary: {
      scannedProducts: products.length,
      companyCodeBuckets: buckets.size,
      exactPairs: exact.length,
      reviewPairs: review.length,
      skippedProducts: skipped.length,
      threshold,
      generatedAt: new Date().toISOString(),
      policy:
        "Read-only candidates; no product is safe to delete automatically. IDs, internal product codes and timestamps are excluded from business-field comparison.",
    },
  };
}
module.exports = { buildDuplicateReport, similarity };
