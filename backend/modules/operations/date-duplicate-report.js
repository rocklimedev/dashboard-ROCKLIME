const DEFAULT_DATE = '2026-07-24';
const DEFAULT_TIMEZONE = 'Asia/Kolkata';

function buildDateDuplicateReport(report, products, productMetas, options = {}) {
  const targetDate = options.updatedOn ?? DEFAULT_DATE;
  const timezone = options.timezone ?? DEFAULT_TIMEZONE;
  const timestampOffset = options.timestampOffset ?? '+00:00';
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(targetDate) ||
    !Number.isFinite(Date.parse(`${targetDate}T00:00:00Z`)) ||
    new Date(`${targetDate}T00:00:00Z`).toISOString().slice(0, 10) !== targetDate
  )
    throw new Error('Updated-on date must be a valid calendar date in YYYY-MM-DD format');
  if (
    !/^[+-](?:0\d|1[0-4]):[0-5]\d$/.test(timestampOffset) ||
    (timestampOffset.slice(1, 3) === '14' && timestampOffset.slice(4) !== '00')
  )
    throw new Error('Timestamp offset must be a valid UTC offset such as +00:00 or +05:30');
  let formatter;
  try {
    formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  } catch {
    throw new Error('Timezone must be a valid IANA timezone, such as Asia/Kolkata');
  }
  const localDay = (value) => {
    if (value == null || value === '') return null;
    let parsed;
    if (value instanceof Date) parsed = value;
    else if (typeof value === 'string') {
      let text = value.trim();
      const calendarDay = text.slice(0, 10);
      if (
        !/^\d{4}-\d{2}-\d{2}$/.test(calendarDay) ||
        !Number.isFinite(Date.parse(`${calendarDay}T00:00:00Z`)) ||
        new Date(`${calendarDay}T00:00:00Z`).toISOString().slice(0, 10) !== calendarDay
      )
        return null;
      if (/^\d{4}-\d{2}-\d{2}$/.test(text)) text += 'T00:00:00';
      text = text.replace(' ', 'T');
      if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?$/.test(text))
        text += timestampOffset;
      if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:\d{2})$/i.test(text))
        return null;
      parsed = new Date(text);
    } else return null;
    if (!Number.isFinite(parsed.getTime())) return null;
    const parts = Object.fromEntries(
      formatter.formatToParts(parsed).map((part) => [part.type, part.value]),
    );
    return `${parts.year}-${parts.month}-${parts.day}`;
  };
  const normalizeSlug = (value) =>
    String(value || '')
      .replace(/[_\s-]/g, '')
      .toLowerCase();
  const priceIds = productMetas
    .filter((field) => normalizeSlug(field.slug) === 'sellingprice')
    .map((field) => field.id);
  const annotation = (product) => {
    const createdDay = localDay(product.createdAt),
      updatedDay = localDay(product.updatedAt);
    let meta = product.meta || {};
    if (typeof meta === 'string') {
      try {
        meta = JSON.parse(meta) || {};
      } catch {
        meta = {};
      }
    }
    const rawPrice = [
      ...priceIds.map((id) => meta[id]),
      meta.sellingPrice,
      meta.selling_price,
    ].find((value) => value != null && String(value).trim() !== '');
    const currentSellingPrice =
      rawPrice == null || !Number.isFinite(Number(rawPrice)) ? null : Number(rawPrice);
    return {
      productId: product.productId,
      name: product.name,
      product_code: product.product_code,
      createdAt: product.createdAt ?? null,
      updatedAt: product.updatedAt ?? null,
      createdDay,
      updatedDay,
      createdOnTargetDate: createdDay === targetDate,
      updatedOnTargetDate: updatedDay === targetDate,
      creationRelation: !createdDay
        ? 'unknown'
        : createdDay < targetDate
          ? 'created_before_target_date'
          : createdDay === targetDate
            ? 'created_on_target_date'
            : 'created_after_target_date',
      currentSellingPrice,
    };
  };
  const updatedPairs = [],
    createdPairs = [];
  const matched = new Map();
  for (const [category, pairs] of Object.entries({ exact: report.exact, review: report.review }))
    for (const pair of pairs) {
      const dateEvidence = pair.products.map(annotation);
      const selected = {
        ...pair,
        category,
        dateEvidence,
        currentPricesDiffer:
          dateEvidence[0].currentSellingPrice !== dateEvidence[1].currentSellingPrice,
      };
      if (dateEvidence.some((item) => item.updatedOnTargetDate)) updatedPairs.push(selected);
      if (dateEvidence.some((item) => item.createdOnTargetDate)) createdPairs.push(selected);
      for (let index = 0; index < pair.products.length; index++) {
        const product = pair.products[index],
          evidence = dateEvidence[index];
        if (!evidence.updatedOnTargetDate && !evidence.createdOnTargetDate) continue;
        if (!matched.has(product.productId))
          matched.set(product.productId, {
            ...evidence,
            companyCode: pair.companyCode,
            product,
            duplicates: [],
          });
        const entry = matched.get(product.productId);
        const other = 1 - index;
        if (
          !entry.duplicates.some(
            (item) => item.product.productId === pair.products[other].productId,
          )
        )
          entry.duplicates.push({
            product: pair.products[other],
            dateEvidence: dateEvidence[other],
            nameSimilarity: pair.nameSimilarity,
            category,
            differences: pair.differences,
          });
      }
    }
  const annotations = products.map(annotation);
  const invalidDates = annotations.filter((item) => !item.createdDay || !item.updatedDay);
  const summary = {
    targetDate,
    timezone,
    timestampOffset,
    updatedOnDateProducts: annotations.filter((item) => item.updatedOnTargetDate).length,
    createdOnDateProducts: annotations.filter((item) => item.createdOnTargetDate).length,
    updatedOnDateProductsWithDuplicates: [...matched.values()].filter(
      (item) => item.updatedOnTargetDate,
    ).length,
    olderProductsUpdatedOnDateWithDuplicates: [...matched.values()].filter(
      (item) => item.updatedOnTargetDate && item.creationRelation === 'created_before_target_date',
    ).length,
    createdOnDateProductsWithDuplicates: [...matched.values()].filter(
      (item) => item.createdOnTargetDate,
    ).length,
    updatedOnDateDuplicatePairs: updatedPairs.length,
    createdOnDateDuplicatePairs: createdPairs.length,
    productsWithMissingOrInvalidDates: invalidDates.length,
    evidenceLimit:
      'updatedAt is the latest product update, not a pricing audit trail. Later updates overwrite evidence of earlier updates. Current prices do not prove the price changed on the target date. Created-on-date matches remain included even if later updated. Counterparts may have been created after the target date; check creationRelation.',
  };
  return {
    updatedPairs,
    createdPairs,
    matchedProducts: [...matched.values()],
    invalidDates,
    summary,
  };
}
module.exports = { buildDateDuplicateReport, DEFAULT_DATE, DEFAULT_TIMEZONE };
