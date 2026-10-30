import './OrderTotal.styles.css';
// Totals box for the cart, quotation and order forms. Every line is shown
// (zero lines too) so the customer's price is never a surprise. Same maths as
// the server and the PDF (utils/quotationMath). GST rate and freight can be
// changed right here when the form passes onGstChange / onShippingChange.
import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { Alert, InputNumber, Select, Typography } from 'antd';
import { quotationTotals, inr } from '../../utils/quotationMath';
import { useGetSettingsQuery } from '../../api/settingsApi';

const { Text } = Typography;
const GST_RATES = [0, 5, 12, 18, 28];

const Line = ({ label, sub, value, strong, muted, negative, control }) => (
  <div className="fv2-ordertotal-80d7a86e54">
    <div className="fv2-ordertotal-4d26cba4a0">
      <Text strong={strong} type={muted ? 'secondary' : undefined}>
        {label}
      </Text>
      {sub && (
        <div>
          <Text className="fv2-ordertotal-ae070caf83" type="secondary">
            {sub}
          </Text>
        </div>
      )}
    </div>
    <div className="fv2-ordertotal-1cc4f2d2d8">
      {control}
      <Text
        className="fv2-ordertotal-c70a10cd2d"
        strong={strong}
        type={muted && !negative ? 'secondary' : undefined}
        style={{ color: negative && value ? '#cf1322' : undefined }}
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
    discountMode = 'generic',
    gstBasis = null,
    onPricingChange,
    onGstChange,
    onShippingChange,
    showGstCalculation = false,
  }) => {
    const { data: settingsResponse } = useGetSettingsQuery(undefined, { skip: !onPricingChange });
    const presets = settingsResponse?.data?.quotation?.discountPresets || [];
    const n = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);
    const t = useMemo(() => {
      if (discountMode === 'advanced' && !gstBasis)
        return {
          goodsValue: 0,
          freight: 0,
          miscellaneousChargeItems: [],
          extraDiscountAmount: 0,
          taxableValue: 0,
          gstRate: n(gst),
          cgst: 0,
          sgst: 0,
          igst: 0,
          gstAmount: 0,
          roundOff: 0,
          grandTotal: 0,
        };
      return quotationTotals({
        items: items || [{ price: n(subTotal) - n(discount), quantity: 1 }],
        miscellaneousChargeItems,
        additionalDiscount,
        flatPrice,
        shipping: n(shipping),
        extraDiscount: n(extraDiscount),
        extraDiscountType,
        gstRate: n(gst),
        discountMode,
        gstBasis,
        interState,
      });
    }, [
      subTotal,
      discount,
      extraDiscount,
      extraDiscountType,
      shipping,
      gst,
      discountMode,
      gstBasis,
      interState,
      items,
      miscellaneousChargeItems,
      additionalDiscount,
      flatPrice,
    ]);
    const displayedDiscount = items ? t.lineDiscount : n(discount);
    const avg = n(subTotal) ? Math.round((displayedDiscount / n(subTotal)) * 100) : 0;

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
          value={displayedDiscount}
          negative
        />
        <Line label="Goods value" value={t.goodsValue} />
        {flatPrice != null && <Line label="Flat goods price" value={t.goodsValue} />}
        {t.miscellaneousChargeItems.map((charge, index) => (
          <Line key={index} label={charge.name} value={charge.amount} />
        ))}
        {n(additionalDiscount) !== 0 && (
          <Line label="Additional discount" value={t.additionalDiscountAmount ?? n(additionalDiscount)} negative />
        )}
        <Line
          label="Freight / installation"
          value={t.freight}
          control={
            onShippingChange ? (
              <InputNumber
                className="fv2-ordertotal-08875aefa5"
                size="small"
                min={0}
                value={n(shipping) || null}
                placeholder="0"
                onChange={(v) => onShippingChange(v || 0)}
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
        {onPricingChange && (
          <div>
            <Select
              placeholder="Import discount preset"
              value={undefined}
              options={presets.map((p) => ({ value: p.id, label: p.name }))}
              onChange={(id) => {
                const p = presets.find((p) => p.id === id);
                if (!p) return;
                onPricingChange('discountMode', p.discountMode);
                onPricingChange('gstBasis', p.gstBasis);
                onGstChange?.(p.gstRate);
              }}
            />
            <Text>Discount mode</Text>{' '}
            <Select
              value={discountMode}
              onChange={(v) => onPricingChange('discountMode', v)}
              options={[
                { value: 'generic', label: 'Generic' },
                { value: 'advanced', label: 'Advanced' },
              ]}
            />
            {discountMode === 'advanced' && (
              <Select
                placeholder="Choose GST basis"
                value={gstBasis}
                onChange={(v) => onPricingChange('gstBasis', v)}
                options={[
                  { value: 'inclusive', label: 'Inclusive' },
                  { value: 'exclusive', label: 'Exclusive' },
                ]}
              />
            )}
          </div>
        )}
        {discountMode === 'advanced' && !gstBasis && (
          <Alert
            type="warning"
            message="Choose GST inclusive or exclusive for advanced discounting"
          />
        )}
        {t.gstInclusive && (
          <Line label="GST included in total" value={t.gstAmount} control={gstControl()} />
        )}
        {t.taxableRoundingAdjustment !== 0 && t.taxableRoundingAdjustment != null && (
          <Line label="Taxable rounding" value={t.taxableRoundingAdjustment} negative={t.taxableRoundingAdjustment < 0} muted />
        )}
        <Line label="Taxable value" value={t.taxableValue} strong />
        {!t.gstInclusive && (
          <Line label={`GST ${t.gstRate}%`} value={t.gstAmount} control={gstControl()} />
        )}
        <Line label="Round off" value={t.roundOff} muted negative={t.roundOff < 0} />
        {showGstCalculation && !(discountMode === 'advanced' && !gstBasis) && (
          <section className="quotation-gst-calculation" aria-label="GST calculation">
            <Text strong>GST calculation · {t.gstInclusive ? 'Inclusive' : 'Exclusive'}</Text>
            <Text type="secondary">
              {t.gstExcluded
                ? 'Exclusive discounts retain full precision internally. Display rounding does not change the final payable amount.'
                : t.gstInclusive
                ? 'GST is included in the price. The payable amount is rounded before GST is extracted.'
                : 'GST is added to the amount after discounts and charges.'}
              {discountMode === 'generic' && ' Generic discount mode uses exclusive GST.'}
            </Text>
            {t.gstExcluded ? (
              <>
                <div>D2 = 100 − (100 − D1) ÷ (1 + {t.gstRate} ÷ 100)</div>
                {t.lines.map((line, index) => (
                  <div key={index}>
                    {line.name || `Item ${index + 1}`}: D1 {line.d1DiscountPercent.toFixed(2)}% → D2 {line.d2DiscountPercent.toFixed(2)}% · {inr(line.net)}
                  </div>
                ))}
                <div>Exclusive subtotal: {inr(t.taxableValue)}</div>
                <div>GST {t.gstRate}%: {inr(t.gstAmount)}</div>
                <div>Final payable including GST: {inr(t.grandTotal)}</div>
              </>
            ) : t.gstInclusive ? (
              <>
                <div>Amount including GST: {inr(t.beforeRound)}</div>
                <div>Rounded payable amount: {inr(t.grandTotal)}</div>
                <div>Included GST = {inr(t.grandTotal)} × {t.gstRate} ÷ (100 + {t.gstRate}) = {inr(t.gstAmount)}</div>
                <div>Taxable value = {inr(t.grandTotal)} − {inr(t.gstAmount)} = {inr(t.taxableValue)}</div>
              </>
            ) : (
              <>
                <div>Taxable value after discounts and charges: {inr(t.taxableValue)}</div>
                <div>GST = {inr(t.taxableValue)} × {t.gstRate} ÷ 100 = {inr(t.gstAmount)}</div>
                <div>Total before rounding = {inr(t.taxableValue)} + {inr(t.gstAmount)} = {inr(t.beforeRound)}</div>
                <div>Rounded payable amount: {inr(t.grandTotal)}</div>
              </>
            )}
            <Text type="secondary">
              {`GST ${t.gstRate}%: ${inr(t.gstAmount)}`}
            </Text>
          </section>
        )}
        <div className="fv2-ordertotal-196763f7ac">
          <span className="fv2-ordertotal-7f63929170">Grand total</span>
          <span className="fv2-ordertotal-53ea192b55">{inr(t.grandTotal)}</span>
        </div>
        {displayedDiscount + t.extraDiscountAmount > 0 && (
          <Text className="fv2-ordertotal-e8acd27b53" type="secondary">
            Customer saves {inr(displayedDiscount + t.extraDiscountAmount)} on MRP
          </Text>
        )}
        {n(optionalTotal) > 0 && (
          <Text className="fv2-ordertotal-6d8009f27c" type="secondary">
            Optional items (not in total): {inr(optionalTotal)}
          </Text>
        )}
      </div>
    );

    function gstControl() {
      return onGstChange ? (
        <Select
          className="fv2-ordertotal-8226c438fd"
          size="small"
          value={t.gstRate}
          onChange={onGstChange}

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
  showGstCalculation: PropTypes.bool,
};

export default OrderTotal;
