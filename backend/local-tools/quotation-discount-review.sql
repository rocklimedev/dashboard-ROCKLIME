-- Read-only review. Do not infer the missing GST rate or recalculate saved totals.
SELECT quotationId, reference_number, quotation_date, gst, gstAmount,
       finalAmount, discountMode, gstBasis, gstInclusive
FROM quotations
WHERE gstInclusive = TRUE AND (gst IS NULL OR gst = 0)
ORDER BY quotation_date, reference_number;
