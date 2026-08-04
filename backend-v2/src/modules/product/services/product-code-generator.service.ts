import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Transaction } from 'sequelize';
import { Product } from '../models/product.model';
import { Brand } from '@/modules/brands/models/brand.model';

import {
  COMPANY_CODE_META_ID,
  MAX_PRODUCT_CODE_COLLISION_ATTEMPTS,
  MAX_PRODUCT_CODE_GENERATION_ATTEMPTS,
} from '../utils/product-constants';

interface GenerateCodeParams {
  brandId?: string;
  companyCode?: string | null;
  transaction?: Transaction;
}

@Injectable()
export class ProductCodeGeneratorService {
  readonly COMPANY_CODE_META_ID = COMPANY_CODE_META_ID;

  constructor(
    @InjectModel(Product) private readonly productModel: typeof Product,
    @InjectModel(Brand) private readonly brandModel: typeof Brand,
  ) {}

  /**
   * Builds a new candidate code: E + 2-letter brand short code (x2) + a
   * 4-digit base derived from the frontend's company/batch code + a random
   * 4-digit suffix, retrying on collision.
   */
  async generate({
    brandId,
    companyCode,
    transaction,
  }: GenerateCodeParams): Promise<string> {
    let brandShort = 'XX';
    let brandPrefix = 'XX';

    if (brandId) {
      const brand = await this.brandModel.findByPk(brandId, {
        attributes: ['brandName'],
        transaction,
      });
      if (brand?.brandName) {
        const name = brand.brandName.trim().toUpperCase();
        brandShort = name.slice(0, 2);
        brandPrefix = name.slice(0, 2);
      }
    }

    let baseCode = '0000';
    if (companyCode) {
      const digits = String(companyCode).trim().replace(/\D/g, '');
      if (digits.length >= 4) {
        baseCode = digits.slice(-4);
      } else if (digits.length > 0) {
        baseCode = digits.padEnd(4, '0');
      }
    } else {
      baseCode = new Date().getFullYear().toString().slice(-2) + '00';
    }

    const prefix = `E${brandShort}${brandPrefix}${baseCode}`;

    let newCode: string;
    let attempts = 0;

    do {
      if (attempts++ > MAX_PRODUCT_CODE_GENERATION_ATTEMPTS) {
        throw new Error(
          `Cannot generate unique product code after ${MAX_PRODUCT_CODE_GENERATION_ATTEMPTS} attempts`,
        );
      }
      const suffix = Math.floor(1000 + Math.random() * 9000).toString();
      newCode = `${prefix}${suffix}`;

      const exists = await this.productModel.findOne({
        where: { product_code: newCode },
        transaction,
      });
      if (!exists) break;
    } while (true);

    return newCode;
  }

  /**
   * Ensures `candidate` is unique, appending -2, -3, ... on collision
   * (used when the caller supplied their own product_code).
   */
  async ensureUnique(
    candidate: string,
    transaction?: Transaction,
  ): Promise<string> {
    let finalCode = candidate;
    let attempt = 0;

    while (attempt < MAX_PRODUCT_CODE_COLLISION_ATTEMPTS) {
      const duplicate = await this.productModel.findOne({
        where: { product_code: finalCode },
        transaction,
      });
      if (!duplicate) return finalCode;

      finalCode = finalCode.replace(/-\d+$/, '') + `-${attempt + 2}`;
      attempt++;
    }

    throw new Error(
      'Could not generate a unique product code after multiple attempts',
    );
  }
}
