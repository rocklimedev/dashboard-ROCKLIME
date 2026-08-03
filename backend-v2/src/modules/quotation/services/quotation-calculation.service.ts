import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import {
  DiscountType,
  EnrichedProduct,
  Floor,
  QuotationTotals,
} from '../utils/quotation.interface';

/**
 * All pure, side-effect-free math and structural derivation for quotations:
 * totals calculation, floor/room grouping, and id generation.
 * Kept dependency-free so it's trivial to unit test.
 */
@Injectable()
export class QuotationCalculationService {
  generateGroupId(): string {
    return 'grp-' + uuidv4().slice(0, 8);
  }

  generateFloorId(): string {
    return 'fl_' + uuidv4().slice(0, 8);
  }

  generateRoomId(floorId = ''): string {
    return (floorId ? floorId + '_' : 'rm_') + uuidv4().slice(0, 8);
  }

  /**
   * Derives a floors[] structure (with nested rooms) from a flat list of
   * enriched products, when the caller didn't explicitly supply `floors`.
   */
  buildFloorsFromProducts(
    products: Array<{
      locations?:
        | {
            floorId: string;
            floorName?: string | null;
            roomId?: string | null;
            roomName?: string | null;
          }[]
        | null;
      floorId?: string | null;
      floorName?: string | null;
    }>,
  ): Floor[] {
    const floorMap = new Map<string, Floor>();

    products.forEach((item) => {
      const locationList = Array.isArray(item.locations)
        ? item.locations
        : item.floorId
          ? [{ floorId: item.floorId, floorName: item.floorName }]
          : [];

      locationList.forEach((loc) => {
        if (!loc.floorId) return;

        if (!floorMap.has(loc.floorId)) {
          floorMap.set(loc.floorId, {
            floorId: loc.floorId,
            floorName: loc.floorName || `Floor ${floorMap.size + 1}`,
            sortOrder: floorMap.size,
            rooms: [],
          });
        }

        const floor = floorMap.get(loc.floorId)!;
        if (loc.roomId && !floor.rooms.some((r) => r.roomId === loc.roomId)) {
          floor.rooms.push({
            roomId: loc.roomId,
            roomName: loc.roomName || 'Unnamed Room',
            areas: [],
            sortOrder: floor.rooms.length,
          });
        }
      });
    });

    return Array.from(floorMap.values());
  }

  /**
   * Computes the full financial breakdown for a quotation: subtotal, item
   * discounts, extra discount, shipping, GST, round-off and final total.
   */
  calculateTotals(
    items: Array<Partial<EnrichedProduct>> = [],
    extraDiscount = 0,
    extraDiscountType: DiscountType = 'percent',
    shippingAmount = 0,
    gst = 0,
  ): QuotationTotals {
    const mainItems = items.filter((item) => !item.isOptionFor);

    let subTotal = 0;
    let totalItemDiscount = 0;
    let taxableAmount = 0;

    mainItems.forEach((p) => {
      const price = Number(p.price) || 0;
      const qty = Number(p.quantity) || 1;
      const discount = Number(p.discount) || 0;
      const discountType = p.discountType || 'percent';

      const lineGross = price * qty;
      const discountAmount =
        discountType === 'percent'
          ? lineGross * (discount / 100)
          : discount * qty;

      const lineAfterDiscount = lineGross - discountAmount;

      subTotal += lineGross;
      totalItemDiscount += discountAmount;
      taxableAmount += lineAfterDiscount;
    });

    const baseForExtraDiscount = taxableAmount + Number(shippingAmount || 0);

    const extraDiscountAmount =
      extraDiscountType === 'percent'
        ? (baseForExtraDiscount * Number(extraDiscount)) / 100
        : Number(extraDiscount);

    const amountBeforeGst = baseForExtraDiscount - extraDiscountAmount;

    // Simple round-off to nearest whole number
    const roundedAmount = Math.round(amountBeforeGst);
    const roundOff = roundedAmount - amountBeforeGst;

    const gstAmount = roundedAmount * (Number(gst || 0) / 100);
    const finalAmount = roundedAmount + gstAmount;

    // Optional items potential (line items marked as options, not counted in main total)
    const optionalItems = items.filter((item) => !!item.isOptionFor);
    let optionalPotential = 0;
    optionalItems.forEach((p) => {
      optionalPotential += (Number(p.price) || 0) * (Number(p.quantity) || 1);
    });

    return {
      subTotal: Number(subTotal.toFixed(2)),
      totalItemDiscount: Number(totalItemDiscount.toFixed(2)),
      taxableAmount: Number(taxableAmount.toFixed(2)),
      extraDiscountAmount: Number(extraDiscountAmount.toFixed(2)),
      shippingAmount: Number(shippingAmount || 0),
      amountBeforeGst: Number(amountBeforeGst.toFixed(2)),
      roundOff: Number(roundOff.toFixed(2)),
      gstAmount: Number(gstAmount.toFixed(2)),
      finalAmount: Number(finalAmount.toFixed(2)),
      optionalItemsCount: optionalItems.length,
      optionalPotentialTotal: Number(optionalPotential.toFixed(2)),
    };
  }
}
