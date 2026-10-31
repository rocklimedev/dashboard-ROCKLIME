// Read-only dry run of the supplied PDFs. No database or saved quotation changes.
// node backend/local-tools/quotation-reference-audit.js
const fixture = require('./quotation-reference-fixtures.json');
const { quotationTotals, r2 } = require('../lib/quotationMath');

function inputs(basis) {
  return fixture.items.map(({ inclusive, exclusive, ...item }) => ({
    ...item, discount: (basis === 'inclusive' ? inclusive : exclusive).discount,
    discountType: (basis === 'inclusive' ? inclusive : exclusive).discountType,
  }));
}
function compare(actual, expected) {
  return Object.entries(expected).map(([field, value]) => ({
    field, expected: value, actual: actual[field],
    difference: r2(actual[field] - value), matches: actual[field] === value,
  }));
}
function referenceInputs() {
  return inputs('inclusive').map((item, index) => fixture.items[index].inclusive.label === 'Net'
    ? { ...item, flatPrice: r2(fixture.items[index].exclusive.rate * (1 + fixture.gstRate / 100)) }
    : item);
}
function audit(math = { quotationTotals }) {
  const calculate = math.quotationTotals;
  const d1Items = inputs('inclusive');
  const inclusive = calculate({ items: d1Items, discountMode: 'advanced', gstBasis: 'inclusive', gstRate: fixture.gstRate });
  const exclusive = calculate({ items: referenceInputs(), discountMode: 'advanced', gstBasis: 'exclusive', gstRate: fixture.gstRate });
  const automatic = calculate({ items: d1Items, discountMode: 'advanced', gstBasis: 'exclusive', gstRate: fixture.gstRate });
  // Existing generic maths reproduces the PDF when supplied its inferred D2
  // discounts directly. This is a diagnostic, not a proposed pricing-mode change.
  const pdfExclusiveReplay = calculate({ items: inputs('exclusive'), gstRate: fixture.gstRate });
  const pdfInclusiveReplay = calculate({ items: d1Items, gstRate: 0 });
  const doubleConverted = calculate({ items: inputs('exclusive'), discountMode: 'advanced', gstBasis: 'exclusive', gstRate: fixture.gstRate });
  return {
    notes: fixture.notes,
    lines: fixture.items.map((item, index) => {
      const actual = exclusive.lines[index];
      return {
        productId: item.productId, quantity: item.quantity,
        d1: item.inclusive.discount, d1Type: item.inclusive.discountType,
        d2ExactPercent: 100 - (100 - actual.d1DiscountPercent) / 1.18,
        d2RoundedPercent: r2(actual.d2DiscountPercent),
        pdfD2: item.exclusive.discount, pdfD2Type: item.exclusive.discountType,
        inclusive: compare(inclusive.lines[index], { rate: item.inclusive.rate, net: item.inclusive.net }),
        exclusive: compare(actual, { rate: item.exclusive.rate, net: item.exclusive.net }),
      };
    }),
    inclusive: compare(inclusive, fixture.inclusiveTotals),
    inclusiveTaxMetadata: {
      pdfLabel: 'GST Not included', currentGstAmount: inclusive.gstAmount,
      currentTaxableValue: inclusive.taxableValue,
    },
    exclusive: compare(exclusive, fixture.exclusiveTotals),
    exclusiveWithoutNetOverride: compare(automatic, fixture.exclusiveTotals),
    pdfInclusiveReplay: compare(pdfInclusiveReplay, fixture.inclusiveTotals),
    pdfExclusiveReplay: compare(pdfExclusiveReplay, fixture.exclusiveTotals),
    doubleConversionWarning: { grandTotal: doubleConverted.grandTotal, expectedPdfGrandTotal: fixture.exclusiveTotals.grandTotal },
    matchesExclusiveReference: compare(exclusive, fixture.exclusiveTotals).every((row) => row.matches),
  };
}
if (require.main === module) process.stdout.write(`${JSON.stringify(audit(), null, 2)}\n`);
module.exports = { audit, inputs, referenceInputs, fixture };
