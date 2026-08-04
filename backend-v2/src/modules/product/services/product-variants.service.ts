import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize';

import { Product } from '../models/product.model';
import { CreateVariantDto } from '../dto/create-variant.dto';
import { enrichProductJson } from '../utils/enrich-product.util';

@Injectable()
export class ProductVariantsService {
  constructor(
    @InjectModel(Product) private readonly productModel: typeof Product,
    @InjectConnection() private readonly sequelize: Sequelize,
  ) {}

  async getWithVariants(productId: string) {
    const master = await this.productModel.findByPk(productId);
    if (!master) throw new NotFoundException('Not found');

    let mainProduct: any = master.toJSON();
    let variants: Product[];

    if (mainProduct.isMaster || !mainProduct.masterProductId) {
      // This is the master → fetch all its variants.
      variants = await this.productModel.findAll({
        where: { masterProductId: productId },
        order: [['variantKey', 'ASC']],
      });
    } else {
      // This is a variant → fetch its master + all sibling variants.
      const masterRecord = await this.productModel.findByPk(
        mainProduct.masterProductId,
      );
      mainProduct = masterRecord?.toJSON();
      variants = await this.productModel.findAll({
        where: { masterProductId: mainProduct.masterProductId },
      });
    }

    const enrichedVariants = variants.map((v) => enrichProductJson(v.toJSON()));

    return {
      master: enrichProductJson(mainProduct),
      variants: enrichedVariants,
      totalVariants: enrichedVariants.length,
    };
  }

  async createVariant(masterId: string, dto: CreateVariantDto) {
    const t = await this.sequelize.transaction();
    try {
      const master = await this.productModel.findByPk(masterId, {
        transaction: t,
      });
      if (!master || !master.isMaster) {
        throw new BadRequestException('Invalid master product');
      }

      const variantKey = Object.values(dto.variantOptions || {}).join(' ');
      const suffix = `-${variantKey.toUpperCase().replace(/\s+/g, '-')}`;

      const variant = await this.productModel.create(
        {
          name: dto.name || `${master.name} - ${variantKey}`,
          product_code: `${master.product_code}${suffix}`,
          quantity: dto.quantity ?? 0,
          masterProductId: masterId,
          isMaster: false,
          variantOptions: dto.variantOptions,
          variantKey,
          skuSuffix: suffix,
          categoryId: master.categoryId,
          brandId: master.brandId,
          images: master.images,
          description: master.description,
          meta: dto.meta ? JSON.stringify(dto.meta) : master.meta,
          status: 'active',
        },
        { transaction: t },
      );

      await t.commit();
      return { message: 'Variant created', variant };
    } catch (error) {
      await t.rollback();
      if (error instanceof BadRequestException) throw error;
      throw new InternalServerErrorException((error as Error).message);
    }
  }
}
