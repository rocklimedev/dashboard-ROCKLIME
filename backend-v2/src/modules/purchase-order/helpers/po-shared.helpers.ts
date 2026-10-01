import { BadRequestException } from '@nestjs/common';
import { Op, Transaction } from 'sequelize';
import * as moment from 'moment';
import { Product } from '../../products/entities/product.entity';

const COMPANY_CODE_META_ID = 'd11da9f9-3f2e-4536-8236-9671200cca4a';

export interface RawPoItemInput {
  productId: string;
  quantity: number | string;
  unitPrice?: number | string;
  mrp?: number | string;
  discount?: number | string;
  discountType?: 'percent' | 'fixed';
  tax?: number | string;
}

/**
 * Port of validateAndCalculateItems() - identical in both
 * fgs.controller.js and purchase-order.controller.js in the legacy repo.
 */
export async function validateAndCalculateItems(
  productModel: typeof Product,
  items: RawPoItemInput[],
  transaction: Transaction,
) {
  if (!Array.isArray(items) || items.length === 0) {
    throw new BadRequestException('Items must be a non-empty array');
  }

  let total = 0;
  const prepared: any[] = [];

  for (const item of items) {
    if (!item.productId) throw new BadRequestException('Every item must have productId');

    const product = await productModel.findByPk(item.productId, { transaction });
    if (!product) throw new BadRequestException(`Product not found: ${item.productId}`);

    const qty = Number(item.quantity);
    if (qty <= 0 || isNaN(qty)) {
      throw new BadRequestException(`Invalid quantity: ${item.productId}`);
    }

    const price = Number(item.unitPrice ?? item.mrp ?? 0);
    if (price <= 0 || isNaN(price)) {
      throw new BadRequestException(`Invalid unit price: ${item.productId}`);
    }

    const lineTotal = qty * price;
    total += lineTotal;

    let imageUrl: string | null = null;
    if (product.images) {
      if (Array.isArray(product.images) && (product.images as any).length > 0) {
        imageUrl = (product.images as any)[0];
      } else if (typeof product.images === 'string' && product.images.trim()) {
        try {
          const parsed = JSON.parse(product.images);
          if (Array.isArray(parsed) && parsed.length > 0) imageUrl = parsed[0];
        } catch {
          /* silent fail, matches legacy */
        }
      }
    }

    prepared.push({
      productId: item.productId,
      productName: product.name || 'Unnamed',
      companyCode: (product.meta as any)?.[COMPANY_CODE_META_ID] || null,
      productCode: product.product_code || '',
      imageUrl,
      quantity: qty,
      unitPrice: price,
      mrp: Number(item.mrp ?? price),
      discount: Number(item.discount ?? 0),
      discountType: item.discountType || 'percent',
      tax: Number(item.tax ?? 0),
      total: lineTotal,
    });
  }

  return { totalAmount: Number(total.toFixed(2)), preparedItems: prepared };
}

/** Port of generateDailyFGSNumber()/generateDailyPONumber() (identical shape, different prefix) */
export async function generateDailyDocNumber(
  model: any,
  numberField: string,
  prefixLetters: string,
  transaction: Transaction,
): Promise<string> {
  const todayStart = moment().startOf('day').toDate();
  const todayEnd = moment().endOf('day').toDate();
  const datePrefix = moment().format('DDMMYY');
  const fullPrefix = `${prefixLetters}${datePrefix}`;

  const MAX_ATTEMPTS = 20;
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const last = await model.findOne({
      where: {
        [numberField]: { [Op.like]: `${fullPrefix}%` },
        createdAt: { [Op.between]: [todayStart, todayEnd] },
      },
      attributes: [numberField],
      order: [[numberField, 'DESC']],
      limit: 1,
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    let nextSeq = 101;
    if (last) {
      const parsed = parseInt(last[numberField].slice(fullPrefix.length), 10);
      if (!isNaN(parsed)) nextSeq = parsed + 1;
    }

    const candidate = `${fullPrefix}${nextSeq}`;
    const conflict = await model.findOne({ where: { [numberField]: candidate }, transaction });
    if (!conflict) return candidate;
  }

  throw new Error(`Failed to generate unique ${prefixLetters} number after ${MAX_ATTEMPTS} attempts`);
}
