import { Alert, Descriptions, Table, Typography } from 'antd';
import ModalShell from '../Common/ModalShell';
import { lineAmounts, quotationTotals, pricingFromRecord, isOptional } from '../../utils/quotationMath';

const money = (value) => Number(value || 0).toLocaleString('en-IN', {
  style: 'currency', currency: 'INR', minimumFractionDigits: 2,
});
const percent = (value) => `${Number(value).toFixed(4).replace(/\.?0+$/, '')}%`;

export function calculationMap(formData) {
  const pricing = pricingFromRecord(formData);
  if (pricing.discountMode === 'advanced' && !pricing.gstBasis) return null;
  const items = (formData.products || []).map((p) => ({
    ...p, price: Number(p.sellingPrice ?? p.price ?? 0),
    quantity: Number(p.qty ?? p.quantity ?? 1), discountType: p.discountType || 'fixed',
  }));
  const totals = quotationTotals({
    ...pricing,
    items,
    gstRate: Number(formData.gst || 0),
    shipping: Number(formData.shippingAmount || 0),
    extraDiscount: Number(formData.extraDiscount || 0),
    extraDiscountType: formData.extraDiscountType || 'percent',
    miscellaneousChargeItems: formData.miscellaneousChargeItems,
    miscellaneousCharges: formData.miscellaneousCharges,
    additionalDiscount: formData.additionalDiscount,
    flatPrice: formData.flatPrice,
  });
  const orderedItems = [...items.filter((item) => !isOptional(item)), ...items.filter(isOptional)];
  const rows = [...totals.lines, ...totals.optionalLines].map((line, index) => {
    const input = orderedItems[index];
    const original = lineAmounts(input);
    const flat = input.flatPrice != null && input.flatPrice !== '';
    const d1 = original.gross ? (flat
      ? (original.gross - Number(input.flatPrice) * original.qty) / original.gross * 100
      : original.discount / original.gross * 100) : 0;
    const d2 = 100 - (100 - d1) / (1 + totals.gstRate / 100);
    return { ...line, key: index, d1, d2, optional: index >= totals.lines.length };
  });
  return { totals, rows };
}

export default function QuotationCalculationMap({ open, onClose, formData }) {
  const result = open ? calculationMap(formData) : null;
  const totals = result?.totals;
  const advanced = totals?.discountMode === 'advanced';
  const columns = [
    { title: 'Product', dataIndex: 'name', fixed: 'left', width: 190,
      render: (name, row) => <>{name || row.productId}{row.optional ? ' (Optional)' : ''}</> },
    { title: 'Qty', dataIndex: 'qty', width: 65 },
    { title: 'MRP / unit', dataIndex: 'price', render: money, width: 115 },
    { title: 'MRP × Qty', dataIndex: 'gross', render: money, width: 120 },
    { title: 'D1 (%)', dataIndex: 'd1', render: percent, width: 105 },
    { title: 'D2 (%)', dataIndex: 'd2', width: 105, render: (value) => advanced ? percent(value) : '—' },
    { title: 'Additional discount / unit', dataIndex: 'additionalDiscount', render: money, width: 150 },
    { title: totals?.gstInclusive ? 'Rate incl. GST' : 'Rate excl. GST', dataIndex: 'rate', render: money, width: 125 },
    { title: totals?.gstInclusive ? 'Amount incl. GST' : 'Amount excl. GST', dataIndex: 'net', render: money, width: 140 },
  ];
  return (
    <ModalShell open={open} onCancel={onClose} title="Calculation Map" width={1200}
      footer={null}>
      {!result ? <Alert type="info" message="Choose GST inclusive or exclusive to view the calculation." /> : <>
        <Typography.Paragraph>
          {advanced ? (totals.gstInclusive ? 'Inclusive GST: D1 is applied; GST is included in the amount.'
            : 'Exclusive GST: D2 is applied to obtain the taxable amount, then GST is added.')
            : 'Generic discounting: the entered discount is applied, then GST is added. D2 conversion does not apply.'}
          {advanced && <> D2 = 100 − (100 − D1) ÷ (1 + {totals.gstRate} ÷ 100).
            D2 is displayed to four decimals; calculations retain full precision.</>}
        </Typography.Paragraph>
        <Typography.Paragraph type="secondary">
          D1 is the percentage equivalent of the entered discount (or flat unit price).
          Inclusive line amount = (MRP × quantity after D1, or flat price × quantity) − additional discount × quantity.
          {totals.gstExcluded && <> Exclusive line amount = inclusive line amount ÷ (1 + {totals.gstRate} / 100).</>}
          Optional products are shown separately and excluded from the quotation total.
        </Typography.Paragraph>
        <Table columns={columns} dataSource={result.rows} pagination={false} size="small" scroll={{ x: 1220 }} />
        <Descriptions title="Quotation calculation" bordered column={1} size="small">
          <Descriptions.Item label="MRP value">{money(totals.mrpValue)}</Descriptions.Item>
          <Descriptions.Item label="Line discounts">{money(totals.lineDiscount)}</Descriptions.Item>
          <Descriptions.Item label="Goods value (after line adjustments)">{money(totals.goodsValue)}</Descriptions.Item>
          <Descriptions.Item label="Freight / installation">+ {money(totals.freight)}</Descriptions.Item>
          {(totals.miscellaneousChargeItems || []).map((charge, index) =>
            <Descriptions.Item key={index} label={charge.name}>+ {money(charge.amount)}</Descriptions.Item>)}
          <Descriptions.Item label="Extra discount">− {money(totals.extraDiscountAmount)}</Descriptions.Item>
          <Descriptions.Item label="Additional quotation discount">− {money(totals.additionalDiscountAmount ?? formData.additionalDiscount)}</Descriptions.Item>
          {formData.flatPrice != null && <Descriptions.Item label="Flat goods price override">{money(formData.flatPrice)}</Descriptions.Item>}
          {!!totals.taxableRoundingAdjustment && <Descriptions.Item label="Taxable rounding adjustment">{money(totals.taxableRoundingAdjustment)}</Descriptions.Item>}
          <Descriptions.Item label="Taxable value (excluding GST)">{money(totals.taxableValue)}</Descriptions.Item>
          <Descriptions.Item label={`GST (${totals.gstRate}%) ${totals.gstInclusive ? 'included' : 'added'}`}>
            {money(totals.gstAmount)}
            {totals.gstInclusive
              ? ` = ${money(totals.grandTotal)} × ${totals.gstRate} / ${100 + totals.gstRate}`
              : ` (taxable value × ${totals.gstRate} / 100; adjusted for paise rounding)`}
          </Descriptions.Item>
          <Descriptions.Item label="Total before rounding">{money(totals.beforeRound)}</Descriptions.Item>
          <Descriptions.Item label="Round off">{money(totals.roundOff)}</Descriptions.Item>
          <Descriptions.Item label="Amount including GST"><strong>{money(totals.grandTotal)}</strong></Descriptions.Item>
        </Descriptions>
      </>}
    </ModalShell>
  );
}
