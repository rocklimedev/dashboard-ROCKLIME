import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/sequelize';
import { Op, Sequelize } from 'sequelize';
import { ProductMeta } from '../models/product-meta.model'; // TODO: adjust to your models barrel path

import { Category } from '@/modules/brands/models/category.model'; // TODO: adjust to your models barrel path
import { Product } from '../models/product.model';
import { Keyword } from '@/modules/brands/models/keyword.model';
import { ProductsByRelationQueryDto } from '../dto/products-by-relation-query.dto';
import { SearchProductsDto } from '../dto/search-products.dto';
import { buildMetaMap, enrichProductJson } from '../utils/enrich-product.util';
import { ensureAssociations } from '../utils/ensure-associations';
import { ProductCodeGeneratorService } from './product-code-generator.service';

@Injectable()
export class ProductQueryService {
  constructor(
    @InjectModel(Product) private readonly productModel: typeof Product,
    @InjectModel(ProductMeta)
    private readonly productMetaModel: typeof ProductMeta,
    @InjectConnection() private readonly sequelize: Sequelize,
    private readonly codeGenerator: ProductCodeGeneratorService,
  ) {
    ensureAssociations();
  }

  async findByCategory(categoryId: string, query: ProductsByRelationQueryDto) {
    if (!categoryId) throw new BadRequestException('Category ID is required.');
    const page = query.page ?? 1;
    const limit = query.limit ?? 50;
    const offset = (page - 1) * limit;

    const where: any = { categoryId };
    if (query.search?.trim()) {
      where[Op.or] = this.buildTextSearchOr(
        `%${query.search.trim().toLowerCase()}%`,
      );
    }

    const { count: total, rows: products } =
      await this.productModel.findAndCountAll({
        where,
        offset,
        limit,
        order: [['name', 'ASC']],
        include: this.keywordInclude(),
        subQuery: false,
      });

    return this.paginateAndEnrich(products, total, page, limit);
  }

  async findByBrand(brandId: string, query: ProductsByRelationQueryDto) {
    if (!brandId) throw new BadRequestException('Brand ID is required.');
    const page = query.page ?? 1;
    const limit = query.limit ?? 50;
    const offset = (page - 1) * limit;

    const where: any = { brandId };
    if (query.search?.trim()) {
      const words = query.search
        .trim()
        .toLowerCase()
        .split(/\s+/)
        .filter(Boolean);
      if (words.length > 0) {
        // AND across words, OR across fields within each word — same
        // "must contain every word, in any of these fields" search as the
        // original brand-search implementation.
        where[Op.and] = words.map((word) => ({
          [Op.or]: this.buildTextSearchOr(`%${word}%`),
        }));
      }
    }

    const { count: total, rows: products } =
      await this.productModel.findAndCountAll({
        where,
        offset,
        limit,
        order: [['name', 'ASC']],
        include: this.keywordInclude(),
        subQuery: false,
      });

    return this.paginateAndEnrich(products, total, page, limit);
  }

  async search(dto: SearchProductsDto) {
    const searchTerm = (dto.q || dto.query || '').trim();
    const where: any = {};

    if (searchTerm) {
      const pattern = `%${searchTerm.toLowerCase()}%`;
      where[Op.or] = [
        this.sequelize.where(
          this.sequelize.fn('LOWER', this.sequelize.col('Product.name')),
          Op.like,
          pattern,
        ),
        this.sequelize.where(
          this.sequelize.fn(
            'LOWER',
            this.sequelize.col('Product.product_code'),
          ),
          Op.like,
          pattern,
        ),
        this.sequelize.where(
          this.sequelize.fn(
            'LOWER',
            this.sequelize.fn(
              'JSON_EXTRACT',
              this.sequelize.col('Product.meta'),
              this.sequelize.literal(
                `'$."${this.codeGenerator.COMPANY_CODE_META_ID}"'`,
              ),
            ),
          ),
          Op.like,
          pattern,
        ),
        { brandId: { [Op.eq]: searchTerm } },
        { categoryId: { [Op.eq]: searchTerm } },
      ];
    }

    if (dto.name) where.name = { [Op.iLike]: `%${dto.name}%` };
    if (dto.sellingPrice)
      where['meta->sellingPrice'] = Number(dto.sellingPrice);
    if (dto.minSellingPrice)
      where['meta->sellingPrice'] = { [Op.gte]: Number(dto.minSellingPrice) };
    if (dto.maxSellingPrice)
      where['meta->sellingPrice'] = { [Op.lte]: Number(dto.maxSellingPrice) };
    if (dto.productCode) where.product_code = dto.productCode;
    if (dto.brandId) where.brandId = dto.brandId;
    if (dto.categoryId) where.categoryId = dto.categoryId;

    const products = await this.productModel.findAll({
      where,
      include: [
        {
          model: this.productMetaModel,
          as: 'product_metas',
          attributes: ['id', 'title', 'slug', 'fieldType', 'unit'],
        },
      ],
      order: [['name', 'ASC']],
      limit: 100,
    });

    if (products.length === 0) return [];

    const metaMap = await buildMetaMap(
      this.productMetaModel,
      products.map((p) => p.toJSON()),
    );
    return products.map((p) => enrichProductJson(p.toJSON(), metaMap));
  }

  private buildTextSearchOr(pattern: string) {
    return [
      this.sequelize.where(
        this.sequelize.fn('LOWER', this.sequelize.col('Product.name')),
        Op.like,
        pattern,
      ),
      this.sequelize.where(
        this.sequelize.fn(
          'LOWER',
          this.sequelize.fn(
            'JSON_EXTRACT',
            this.sequelize.col('Product.meta'),
            this.sequelize.literal(
              `'$."${this.codeGenerator.COMPANY_CODE_META_ID}"'`,
            ),
          ),
        ),
        Op.like,
        pattern,
      ),
      this.sequelize.where(
        this.sequelize.fn('LOWER', this.sequelize.col('keywords.keyword')),
        Op.like,
        pattern,
      ),
      this.sequelize.where(
        this.sequelize.fn(
          'LOWER',
          this.sequelize.col('keywords.categories.name'),
        ),
        Op.like,
        pattern,
      ),
    ];
  }

  private keywordInclude() {
    return [
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
    ];
  }

  private async paginateAndEnrich(
    products: Product[],
    total: number,
    page: number,
    limit: number,
  ) {
    if (total === 0)
      return { data: [], pagination: { total: 0, page, limit, totalPages: 0 } };

    const metaMap = await buildMetaMap(
      this.productMetaModel,
      products.map((p) => p.toJSON()),
    );
    const data = products.map((p) => enrichProductJson(p.toJSON(), metaMap));

    return {
      data,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }
}
