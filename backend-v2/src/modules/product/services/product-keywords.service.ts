import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize';
import { ProductKeyword } from '../models/product-keywords.model'; // TODO: adjust to your models barrel path
import { Category } from '@/modules/brands/models/category.model'; // TODO: adjust to your models barrel path
import { Product } from '../models/product.model';
import { Keyword } from '@/modules/brands/models/keyword.model';
import { AddKeywordsDto } from '../dto/add-keywords.dto';
import { ReplaceKeywordsDto } from '../dto/replace-keywords.dto';

@Injectable()
export class ProductKeywordsService {
  constructor(
    @InjectModel(Product) private readonly productModel: typeof Product,
    @InjectModel(Keyword) private readonly keywordModel: typeof Keyword,
    @InjectModel(ProductKeyword)
    private readonly productKeywordModel: typeof ProductKeyword,
    @InjectConnection() private readonly sequelize: Sequelize,
  ) {}

  async addKeywords(productId: string, dto: AddKeywordsDto) {
    const t = await this.sequelize.transaction();
    try {
      const product = await this.productModel.findByPk(productId, {
        transaction: t,
      });
      if (!product) throw new NotFoundException('Product not found');

      const keywords = await this.keywordModel.findAll({
        where: { id: dto.keywordIds },
        transaction: t,
      });
      if (keywords.length !== dto.keywordIds.length) {
        throw new BadRequestException('One or more keyword IDs are invalid');
      }

      const associations = dto.keywordIds.map((keywordId) => ({
        productId,
        keywordId,
      }));
      await this.productKeywordModel.bulkCreate(associations, {
        ignoreDuplicates: true,
        transaction: t,
      });

      await t.commit();

      const updated = await this.productKeywordModel.findAll({
        where: { productId },
        include: [
          {
            model: Keyword,
            as: 'keyword',
            attributes: ['id', 'keyword', 'categoryId'],
            include: [
              {
                model: Category,
                as: 'categories',
                attributes: ['name', 'slug'],
              },
            ],
          },
        ],
      });

      return {
        message: 'Keywords added successfully',
        keywords: updated.map((pk: any) => ({
          id: pk.keyword.id,
          keyword: pk.keyword.keyword,
          category: pk.keyword.categories,
        })),
      };
    } catch (error) {
      await t.rollback();
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      )
        throw error;
      throw new InternalServerErrorException((error as Error).message);
    }
  }

  async removeKeyword(productId: string, keywordId: string) {
    const deleted = await this.productKeywordModel.destroy({
      where: { productId, keywordId },
    });
    if (deleted === 0)
      throw new NotFoundException('Keyword not associated with this product');
    return { message: 'Keyword removed successfully' };
  }

  async removeAllKeywords(productId: string) {
    await this.productKeywordModel.destroy({ where: { productId } });
    return { message: 'All keywords removed' };
  }

  async replaceAllKeywords(productId: string, dto: ReplaceKeywordsDto) {
    const t = await this.sequelize.transaction();
    try {
      const cleanIds = [...new Set((dto.keywordIds || []).filter(Boolean))];

      const product = await this.productModel.findByPk(productId, {
        transaction: t,
      });
      if (!product) throw new NotFoundException('Product not found');

      await (product as any).setKeywords(cleanIds, { transaction: t });
      await t.commit();

      const updated = await this.productModel.findByPk(productId, {
        include: [
          {
            model: Keyword,
            as: 'keywords',
            attributes: ['id', 'keyword'],
            through: { attributes: [] },
            include: [
              {
                model: Category,
                as: 'categories',
                attributes: ['categoryId', 'name', 'slug'],
              },
            ],
          },
        ],
      });

      return {
        message: 'Keywords updated successfully',
        keywords: (updated as any)?.keywords || [],
      };
    } catch (error) {
      await t.rollback();
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('Failed to update keywords');
    }
  }
}
