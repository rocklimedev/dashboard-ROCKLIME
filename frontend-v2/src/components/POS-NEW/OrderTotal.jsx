// Totals box for the cart, quotation and order forms. Every line is shown
// (zero lines too) so the customer's price is never a surprise. Same maths as
// the server and the PDF (utils/quotationMath). GST rate and freight can be
// changed right here when the form passes onGstChange / onShippingChange.
import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { InputNumber, Select, Typography } from 'antd';
import { quotationTotals, inr } from '../../utils/quotationMath';

const { Text } = Typography;
const GST_RATES = [0, 5, 12, 18, 28];

const Line = ({ label, sub, value, strong, muted, negative, control }) => (
  <div
    style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 8,
      padding: '7px 2px',
      borderBottom: '1px solid #f3f3f3',
    }}
  >
    <div style={{ minWidth: 0 }}>
      <Text strong={strong} type={muted ? 'secondary' : undefined}>
        {label}
      </Text>
      {sub && (
        <div>
          <Text type="secondary" style={{ fontSize: 11.5 }}>
            {sub}
          </Text>
        </div>
      )}
    </div>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      {control}
      <Text
        strong={strong}
        type={muted && !negative ? 'secondary' : undefined}
        style={{ color: negative && value ? '#cf1322' : undefined, whiteSpace: 'nowrap' }}
      >
        {negative && value ? '− ' : ''}
        {inr(Math.abs(value))}
      </Text>
    </div>
  </div>
);

const OrderTotal = React.memo(
  ({
    subTotal = 0, // MRP value (price × qty)
    discount = 0, // line discounts
    extraDiscount = 0, // extra discount amount (or % with extraDiscountType "percent")
    extraDiscountType = 'fixed',
    shipping = 0, // freight / installation
    gst = 0, // GST rate %
    interState = false,
    itemCount = null,
    optionalTotal = 0,
    items,
    miscellaneousChargeItems = null,
    additionalDiscount = 0,
    flatPrice = null,
    onGstChange,
    onShippingChange,
  }) => {
    const n = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);
    const t = useMemo(
      () =>
        quotationTotals({
          items: items || [{ price: n(subTotal) - n(discount), quantity: 1 }],
          miscellaneousChargeItems,
          additionalDiscount,
          flatPrice,
          shipping: n(shipping),
          extraDiscount: n(extraDiscount),
          extraDiscountType,
          gstRate: n(gst),
          interState,
        }),
      [
        subTotal,
        discount,
        extraDiscount,
        extraDiscountType,
        shipping,
        gst,
        interState,
        items,
        miscellaneousChargeItems,
        additionalDiscount,
        flatPrice,
      ],
    );
    const avg = n(subTotal) ? Math.round((n(discount) / n(subTotal)) * 100) : 0;
    const half = t.gstRate / 2;

    return (
      <div>
        <Line
          label="MRP value"
          sub={itemCount != null ? `${itemCount} item${itemCount === 1 ? '' : 's'}` : null}
          value={n(subTotal)}
        />
        <Line
          label="Item discounts"
          sub={avg ? `${avg}% average` : null}
          value={n(discount)}
          negative
        />
        <Line label="Goods value" value={t.goodsValue} />
        {flatPrice != null && <Line label="Flat goods price" value={n(flatPrice)} />}
        {t.miscellaneousChargeItems.map((charge, index) => (
          <Line key={index} label={charge.name} value={charge.amount} />
        ))}
        {n(additionalDiscount) !== 0 && (
          <Line label="Additional discount" value={n(additionalDiscount)} negative />
        )}
        <Line
          label="Freight / installation"
          value={t.freight}
          control={
            onShippingChange ? (
              <InputNumber
                size="small"
                min={0}
                value={n(shipping) || null}
                placeholder="0"
                onChange={(v) => onShippingChange(v || 0)}
                style={{ width: 90 }}
              />
            ) : null
          }
        />
        <Line
          label="Extra discount"
          sub={extraDiscountType === 'percent' && n(extraDiscount) ? `${n(extraDiscount)}%` : null}
          value={t.extraDiscountAmount}
          negative
        />
        <Line label="Taxable value" value={t.taxableValue} strong />
        {interState ? (
          <Line label={`IGST ${t.gstRate}%`} value={t.igst} control={gstControl()} />
        ) : (
          <>
            <Line label={`CGST ${half}%`} value={t.cgst} control={gstControl()} />
            <Line label={`SGST ${half}%`} value={t.sgst} />
          </>
        )}
        <Line label="Round off" value={t.roundOff} muted negative={t.roundOff < 0} />
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: 10,
            padding: '12px 14px',
            background: '#d7232f',
            borderRadius: 10,
            color: '#fff',
          }}
        >
          <span style={{ letterSpacing: '0.08em', fontSize: 12, textTransform: 'uppercase' }}>
            Grand total
          </span>
          <span style={{ fontSize: 20, fontWeight: 600 }}>{inr(t.grandTotal)}</span>
        </div>
        {n(discount) + t.extraDiscountAmount > 0 && (
          <Text
            type="secondary"
            style={{ display: 'block', textAlign: 'right', fontSize: 12, marginTop: 6 }}
          >
            Customer saves {inr(n(discount) + t.extraDiscountAmount)} on MRP
          </Text>
        )}
        {n(optionalTotal) > 0 && (
          <Text type="secondary" style={{ display: 'block', textAlign: 'right', fontSize: 12 }}>
            Optional items (not in total): {inr(optionalTotal)}
          </Text>
        )}
      </div>
    );

    function gstControl() {
      return onGstChange ? (
        <Select
          size="small"
          value={t.gstRate}
          onChange={onGstChange}
          style={{ width: 76 }}
          options={GST_RATES.map((r) => ({ value: r, label: `${r}%` }))}
        />
      ) : null;
    }
  },
);

OrderTotal.displayName = 'OrderTotal';

OrderTotal.propTypes = {
  subTotal: PropTypes.number,
  discount: PropTypes.number,
  extraDiscount: PropTypes.number,
  extraDiscountType: PropTypes.string,
  shipping: PropTypes.number,
  gst: PropTypes.number,
  interState: PropTypes.bool,
  itemCount: PropTypes.number,
  optionalTotal: PropTypes.number,
  onGstChange: PropTypes.func,
  onShippingChange: PropTypes.func,
};

export default OrderTotal;
