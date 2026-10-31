# GST quotation reference dry run — 29 October 2026

## Implementation update

The latest requirement is equal final payable in both advanced modes. Derived
D2 now retains full precision internally and is rounded only for display. Both
modes share the same commercial price and final rounding. The historical PDFs'
rounded D2 prices remain reference evidence, not the current pricing target.
See `quotation-room-gst-gap.md` for the verified ₹769,267 result in both modes.

The following records the earlier implementation, before that requirement:

Advanced-exclusive previously rounded each derived item discount to two decimals and
adds GST once to the exclusive subtotal. Item and quotation flat prices now
use the inclusive input basis, just like D1, and are divided by the GST factor
in advanced-exclusive mode. This corrects the later room-quotation gap caused
by leaving ₹4,500/₹1,900 flat prices unchanged and then adding GST.

The valve reference needs an inclusive flat input of ₹600.03 to reproduce the
observed exclusive ₹508.50 unit price. That is a fixture input, not a special
rounding rule or a product-specific price hardcoded into production.

With that entered flat price and the original per-item D1 percentages, all four
exclusive rates and amounts, ₹22,969.49 subtotal, ₹4,134.51 GST and ₹27,104 final
total match. Inclusive payable remains ₹27,102. The contradictory inclusive PDF
GST label remains a reference-document issue; the system continues to identify
inclusive GST as included in the price.

The audit below records the **pre-change baseline**. The repeatable audit command
now reports `matchesExclusiveReference: true`, and also reports the result without
the manual net-price override separately. Regression tests assert the advanced
exclusive mode directly against the reference, including explicit zero flat prices.

## Original dry-run result (before the changes above)

The current advanced-inclusive calculation matches all four item rates, line amounts,
MRP, discount total and final payable in QUO251026102. Current advanced-exclusive
does **not** match QUO291026101. No production pricing rules or saved records were
changed during this audit.

The inclusive filename and its document disagree: its summary says **GST Not
included**, while the current advanced-inclusive mode extracts GST from the price.
The amount payable matches; the tax breakdown does not. The filename alone cannot
establish the intended tax treatment.

## Item inputs and inferred discounts

Source: supplied PDFs, physical page 2 (items) and physical page 3 (summary).
Net-price rows can be represented by equivalent fixed discounts per unit; the PDFs
do not establish whether their source records used fixed discounts or flat prices.

| Product code | Qty | MRP/unit | Inclusive discount or net rate | Exclusive discount or net rate | PDF exclusive line amount | Current advanced-exclusive line amount from inclusive inputs |
| --- | ---: | ---: | --- | --- | ---: | ---: |
| 2201600M | 11 | ₹1,450 | Net ₹600 (equivalent ₹850 discount/unit) | Net ₹508.50 (equivalent ₹941.50 discount/unit) | ₹5,593.50 | ₹5,593.22 |
| 24254001 | 1 | ₹11,800 | 55% | Inferred 61.86%; displayed 61.9% | ₹4,500.52 | ₹4,500.00 |
| 19917000 | 6 | ₹2,970 | 40% | Inferred 49.15%; displayed 49.1% | ₹9,061.47 | ₹9,061.02 |
| 13262000 | 1 | ₹10,000 | 55% | Inferred 61.86%; displayed 61.9% | ₹3,814.00 | ₹3,813.56 |

The inclusive line amounts are ₹6,600, ₹5,310, ₹10,692 and ₹4,500. All match.

## Discount conversion and precision

Per item: `D2 = (1 − ((100 − D1) / 1.18 / 100)) × 100`.

- 55% D1 gives 61.8644067797% exact D2. The PDF amounts reproduce with **61.86%**.
- 40% D1 gives 49.1525423729% exact D2. The PDF amount reproduces with **49.15%**.
- These two-decimal inputs are inferred from amounts; the printed percentage
  labels contain only one decimal and must not be used to reconstruct prices.
- The valve's ₹600 / 1.18 = ₹508.474576. The observed ₹508.50 is consistent with
  a manual net price or another rounding policy. These two PDFs do not establish
  a general rule for rounding net-price products.
- The trimset's exact discounted unit price is ₹1,510.245. Multiplying by six,
  then rounding, gives ₹9,061.47. Multiplying its displayed ₹1,510.25 gives the
  wrong ₹9,061.50.

## Totals comparison

| Field | Inclusive PDF | Current advanced-inclusive | Exclusive PDF | Current advanced-exclusive from D1 |
| --- | ---: | ---: | ---: | ---: |
| MRP | ₹55,570.00 | ₹55,570.00 | ₹55,570.00 | ₹55,570.00 |
| Discount | ₹28,468.00 | ₹28,468.00 | ₹32,600.51* | ₹32,602.20 |
| Goods value | ₹27,102.00 | ₹27,102.00 | ₹22,969.49* | ₹22,967.80 |
| GST | “Not included” | ₹4,134.20 extracted | ₹4,134.51* added | ₹0.00 |
| Grand total | ₹27,102 | ₹27,102 | **₹27,104** | **₹22,968** |

*Paise values are reconstructed from the printed item amounts; summary rows are
displayed in whole rupees. `₹22,969.49 × 18% = ₹4,134.51`, rounded to paise.
`₹22,969.49 + ₹4,134.51 = ₹27,104.00`.

The exclusive PDF therefore **adds GST after the discounted exclusive subtotal**.
This conflicts with the earlier confirmed rule to stop at the exclusive amount
without adding GST. That rule is why the current system returns ₹22,968.

Supplying the PDF's already-converted exclusive discounts to current advanced-
exclusive mode would convert them twice and produce ₹19,466. Preserve the
distinction between entered inclusive discounts and already-exclusive inputs.

## Repeatable checks

Run from the repository root:

```powershell
node backend/local-tools/quotation-reference-audit.js
node --test backend/local-tools/quotation-reference-audit.test.js
```

The audit prints expected values, actual values and differences for every line
and total. It also replays the PDF's inferred exclusive inputs through the
existing generic arithmetic, which reproduces the reference exactly. This is
a diagnostic replay, not proof that advanced-exclusive currently matches.

The tests verify both documents' arithmetic using reconstructed inputs, the
two-decimal percentage inference, line-versus-unit rounding, the observed manual
net-price difference, and identical frontend/backend audit output. They do not
assert that current advanced-exclusive pricing satisfies the exclusive PDF.

To match the reference in production, the remaining decisions are GST addition
after D2, rounding derived D2 to two decimals, the net-price override policy, and
the inclusive document's contradictory GST label. These were left unchanged in
this dry run.
