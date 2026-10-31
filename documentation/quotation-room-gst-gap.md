# Room quotation GST gap — 29 October 2026

## Latest rule: identical final payable in both modes

The latest user instruction supersedes the earlier two-decimal calculation
policy below. D2 now retains full precision internally and displays two decimals
only. Both modes use the same inclusive source for charges, discounts and final
rounding. Exclusive line amounts are reconciled by paise so their displayed sum
matches the converted goods value. Any adjustment-level paise reconciliation is
shown as taxable rounding.

For the 68 reconstructed room rows, both modes now produce **₹769,267** final
payable, from the same **₹769,267.10** before-round amount. The exclusive taxable
value is ₹651,921.27 and GST is ₹117,345.83. The inclusive tax split continues
to extract GST after final payable rounding, so tax components may differ by
paise; the final payable is identical.

The sections below preserve the original diagnosis and prior rounding policy.

Sources: supplied QUO281026101 inclusive and QUO281026102 exclusive PDFs.
All 68 room rows were extracted and paired by room, row number, product code,
quantity and MRP. PDFs contain 49 distinct products expanded into room rows;
rounding allocations can differ by paise from independent room-line calculations.
No saved quotations or database records were changed.

## Cause and correction

Four Uniset WC rows have an inclusive flat rate of ₹4,500; a flush plate has an
inclusive flat rate of ₹1,900. They remained unchanged in the exclusive PDF,
then received 18% GST. Their erroneous extra tax is:

`(4 × ₹4,500 + ₹1,900) × 18% = ₹3,582`.

Percentage-discount rounding partly offsets this, resulting in the supplied
₹772,839 exclusive total versus ₹769,267 inclusive total (₹3,572 difference).

Flat inputs are now converted before adding GST:

| Input inclusive net rate | Correct exclusive rate | Qty of room rows |
| ---: | ---: | ---: |
| ₹4,500 | ₹3,813.56 | 4 |
| ₹1,900 | ₹1,610.17 | 1 |

The full input line amount is divided by 1.18 and rounded to paise; the displayed
unit rate is not rounded first and multiplied. Quotation-wide flat price inputs
use the same conversion. Zero overrides remain valid and optional products stay
outside the payable total.

The inclusive summary also omitted ₹25,200 of flat-price savings from its
discount total. It now includes those savings: ₹788,776.90 discount rather than
₹763,576.90, while its goods value and payable remain unchanged.

## Previous difference: two-decimal discount policy (superseded)

The user explicitly chose to retain two-decimal D2 discounts. Reconstructing all
68 rows using that policy gives:

| Field | Inclusive | Corrected exclusive |
| --- | ---: | ---: |
| MRP | ₹1,558,044.00 | ₹1,558,044.00 |
| Goods value | ₹769,267.10 | ₹651,912.65 |
| GST | ₹117,345.81 included | ₹117,344.28 added |
| Final rounded total | **₹769,267** | **₹769,257** |

The remaining ₹10 is the expected effect of rounding individual derived D2
discounts to two decimals, not an extra GST charge. No balancing adjustment is
inserted to hide that difference. Exact totals from regenerated saved quotations
may differ by paise before whole-rupee rounding due to product/room allocation.

## Regression checks

```powershell
node --test backend/local-tools/quotation-room-reference.test.js
```

Tests cover every inclusive line, corrected flat prices, flat-price savings,
full-precision D2 with identical mode totals, quantities, optional products, zero
overrides and quotation-wide flat prices. `quotation-mode-parity.test.js` also
checks 150 adjustment/rate combinations and low-value rounding boundaries.
Generic pricing remains unchanged.
