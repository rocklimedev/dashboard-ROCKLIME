import { Injectable } from '@nestjs/common';

export interface ComputeTotalsInput {
  products?: Array<{ total?: number }>;
  shipping?: number;
  gst?: number | null;
  extraDiscount?: number | null;
  extraDiscountType?: 'fixed' | 'percent' | null;
  amountPaid?: number;
}

export interface ComputeTotalsResult {
  subTotal: number;
  totalWithShipping: number;
  gstValue: number;
  extraDiscountValue: number;
  finalAmount: number;
}

/**
 * Pure, side-effect-free financial calculations. Split out of the
 * controller so it can be unit tested in isolation and reused by both
 * `create` and `update` flows (and the PDF export).
 */
@Injectable()
export class OrderCalculationService {
  computeTotals({
    products = [],
    shipping = 0,
    gst = 0,
    extraDiscount = 0,
    extraDiscountType = 'fixed',
  }: ComputeTotalsInput): ComputeTotalsResult {
    const subTotal = products.reduce((sum, p) => sum + (p.total ?? 0), 0);
    const totalWithShipping = subTotal + Number(shipping);
    const gstValue = (totalWithShipping * Number(gst ?? 0)) / 100;

    let extraDiscountValue = 0;
    if (extraDiscount && extraDiscount > 0) {
      extraDiscountValue =
        extraDiscountType === 'percent'
          ? (totalWithShipping * Number(extraDiscount)) / 100
          : Number(extraDiscount);
    }

    const finalAmount = totalWithShipping + gstValue - extraDiscountValue;

    return {
      subTotal,
      totalWithShipping,
      gstValue,
      extraDiscountValue,
      finalAmount,
    };
  }

  /** Line-total check used when clients submit pre-computed totals (update / draft flows). */
  expectedLineTotal(
    price: number,
    quantity: number,
    discount: number,
    discountType: 'fixed' | 'percent',
  ): number {
    return discountType === 'percent'
      ? price * (1 - discount / 100) * quantity
      : (price - discount) * quantity;
  }
}
