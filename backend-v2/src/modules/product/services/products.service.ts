import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/sequelize';
import { Op, Sequelize } from 'sequelize';
import { ProductMeta } from '../models/product-meta.model'; // TODO: adjust to your models barrel path

import { Category } from '@/modules/brands/models/category.model'; // TODO: adjust to your models barrel path
import { Product } from '../models/product.model';
import { Keyword } from '@/modules/brands/models/keyword.model';
import { CreateProductDto } from '../dto/create-product.dto';
import { UpdateProductDto } from '../dto/update-product.dto';
import { GetProductsByIdsDto } from '../dto/get-products-by-ids.dto';

import { parseJsonSafely, parseJsonArraySafely } from '../utils/json.util';
import { buildMetaMap, enrichProductJson } from '../utils/enrich-product.util';
import { ensureAssociations } from '../utils/ensure-associations';
import { PRODUCT_IMAGE_REMOTE_DIR } from '../utils/product-constants';

import { ProductCodeGeneratorService } from './product-code-generator.service';
import { UploadService } from './upload.service';

const KEYWORD_INCLUDE = [
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

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);

  constructor(
    @InjectModel(Product) private readonly productModel: typeof Product,
    @InjectModel(ProductMeta)
    private readonly productMetaModel: typeof ProductMeta,
    @InjectConnection() private readonly sequelize: Sequelize,
    private readonly codeGenerator: ProductCodeGeneratorService,
    private readonly uploadService: UploadService,
  ) {
    ensureAssociations();
  }

  private normalizeKeywordIds(keywordIds: unknown): string[] {
    if (Array.isArray(keywordIds)) return keywordIds.filter(Boolean);
    if (typeof keywordIds === 'string') {
      return keywordIds
        .split(',')
        .map((id) => id.trim())
        .filter(Boolean);
    }
    return [];
  }

  private async uploadImages(files: Express.Multer.File[]): Promise<string[]> {
    const urls: string[] = [];
    for (const file of files || []) {
      try {
        const url = await this.uploadService.uploadToFtp(
          file.buffer,
          file.originalname,
          {
            remoteDir: PRODUCT_IMAGE_REMOTE_DIR,
          },
        );
        urls.push(url);
      } catch (err) {
        this.logger.error(
          `Image upload failed for ${file.originalname}`,
          err as Error,
        );
        // Continue with other files instead of failing the whole request.
      }
    }
    return urls;
  }

  // ─────────────────────────────────────────────────────────────
  // CREATE
  // ─────────────────────────────────────────────────────────────
  async create(dto: CreateProductDto, files: Express.Multer.File[] = []) {
    const t = await this.sequelize.transaction();

    try {
      const metaObj = dto.meta ? parseJsonSafely(dto.meta, {}, 'meta') : {};
      const imageUrls = await this.uploadImages(files);
      const quantity = parseInt(String(dto.quantity ?? 0), 10) || 0;

      const productData: Record<string, any> = {
        name: dto.name?.trim() || 'Unnamed Product',
        quantity,
        images: imageUrls.length > 0 ? JSON.stringify(imageUrls) : null,
        meta: Object.keys(metaObj).length > 0 ? metaObj : null,
        isFeatured: dto.isFeatured === true || dto.isFeatured === 'true',
        status: dto.status || (quantity > 0 ? 'active' : 'out_of_stock'),
        description: dto.description?.trim() || null,
        tax: dto.tax ? parseFloat(String(dto.tax)) : null,
        alert_quantity: dto.alert_quantity
          ? parseInt(String(dto.alert_quantity), 10)
          : null,
        categoryId: dto.categoryId || null,
        brandId: dto.brandId || null,
        vendorId: dto.vendorId || null,
        brand_parentcategoriesId: dto.brand_parentcategoriesId || null,
      };

      // product_code: use caller's value if given, otherwise auto-generate,
      // then guarantee uniqueness either way.
      let finalProductCode = (dto.product_code || '').trim();
      if (!finalProductCode) {
        finalProductCode = await this.codeGenerator.generate({
          brandId: dto.brandId,
          companyCode:
            metaObj?.[this.codeGenerator.COMPANY_CODE_META_ID] || null,
          transaction: t,
        });
      }
      finalProductCode = await this.codeGenerator.ensureUnique(
        finalProductCode,
        t,
      );
      productData.product_code = finalProductCode;

      let finalProduct: Product;
      const isMaster = dto.isMaster === true || dto.isMaster === 'true';

      if (isMaster) {
        finalProduct = await this.productModel.create(
          {
            ...productData,
            isMaster: true,
            masterProductId: null,
            variantOptions: null,
            variantKey: null,
            skuSuffix: null,
          },
          { transaction: t },
        );
      } else if (dto.masterProductId) {
        const master = await this.productModel.findOne({
          where: { productId: dto.masterProductId, isMaster: true },
          transaction: t,
        });
        if (!master) throw new BadRequestException('Master product not found');

        const variantOpts = parseJsonSafely(dto.variantOptions, {});
        const generatedVariantKey = Object.values(variantOpts)
          .filter(Boolean)
          .join(' ');
        const generatedSkuSuffix = generatedVariantKey
          ? `-${generatedVariantKey.toUpperCase().replace(/\s+/g, '-')}`
          : '';

        finalProduct = await this.productModel.create(
          {
            ...productData,
            name:
              dto.name?.trim() ||
              `${master.name} - ${generatedVariantKey}`.trim(),
            masterProductId: master.productId,
            isMaster: false,
            variantOptions: Object.keys(variantOpts).length
              ? variantOpts
              : null,
            variantKey: generatedVariantKey || dto.variantKey || null,
            skuSuffix: generatedSkuSuffix || dto.skuSuffix || null,
            categoryId: dto.categoryId || master.categoryId,
            brandId: dto.brandId || master.brandId,
            vendorId: dto.vendorId || master.vendorId,
            brand_parentcategoriesId:
              dto.brand_parentcategoriesId || master.brand_parentcategoriesId,
            images:
              imageUrls.length > 0 ? JSON.stringify(imageUrls) : master.images,
            meta: Object.keys(metaObj).length > 0 ? metaObj : master.meta,
            description: dto.description?.trim() || master.description,
          },
          { transaction: t },
        );
      } else {
        finalProduct = await this.productModel.create(
          { ...productData, isMaster: false },
          { transaction: t },
        );
      }

      const cleanKeywordIds = this.normalizeKeywordIds(dto.keywordIds);
      if (cleanKeywordIds.length > 0) {
        await (finalProduct as any).setKeywords(cleanKeywordIds, {
          transaction: t,
        });
      }

      await t.commit();
      return this.findById(finalProduct.productId);
    } catch (error) {
      await t.rollback();
      if (error instanceof BadRequestException) throw error;
      throw new InternalServerErrorException(
        `Failed to create product: ${(error as Error).message}`,
      );
    }
  }

  // ─────────────────────────────────────────────────────────────
  // UPDATE
  // ─────────────────────────────────────────────────────────────
  async update(
    productId: string,
    dto: UpdateProductDto,
    files: Express.Multer.File[] = [],
  ) {
    const t = await this.sequelize.transaction();

    try {
      const product = await this.productModel.findByPk(productId, {
        transaction: t,
      });
      if (!product) throw new NotFoundException('Product not found');

      const metaObj = dto.meta ? parseJsonSafely(dto.meta, {}, 'meta') : {};

      let currentImages = parseJsonArraySafely(product.images, []);
      const imagesToDelete = Array.isArray(dto.imagesToDelete)
        ? dto.imagesToDelete
        : parseJsonArraySafely(dto.imagesToDelete, []);
      currentImages = currentImages.filter(
        (url) => !imagesToDelete.includes(url),
      );
      currentImages.push(...(await this.uploadImages(files)));

      const isMaster = dto.isMaster === true || dto.isMaster === 'true';

      const updateData: Record<string, any> = {
        name: dto.name?.trim() || product.name,
        product_code: dto.product_code?.trim() || product.product_code,
        quantity:
          dto.quantity !== undefined
            ? parseInt(String(dto.quantity), 10)
            : product.quantity,
        images: JSON.stringify(currentImages),
        meta: Object.keys(metaObj).length > 0 ? metaObj : null,
        isFeatured:
          dto.isFeatured === true ||
          dto.isFeatured === 'true' ||
          product.isFeatured,
        status: dto.status || product.status,
        description: dto.description?.trim() || product.description,
        tax: dto.tax !== undefined ? parseFloat(String(dto.tax)) : product.tax,
        alert_quantity:
          dto.alert_quantity !== undefined
            ? parseInt(String(dto.alert_quantity), 10)
            : product.alert_quantity,
        categoryId: dto.categoryId || product.categoryId,
        brandId: dto.brandId || product.brandId,
        vendorId: dto.vendorId || product.vendorId,
        brand_parentcategoriesId:
          dto.brand_parentcategoriesId || product.brand_parentcategoriesId,
      };

      if (isMaster && !product.isMaster) {
        const variantCount = await this.productModel.count({
          where: { masterProductId: product.productId },
          transaction: t,
        });
        if (variantCount > 0) {
          throw new BadRequestException(
            'Cannot convert to master product: it already has variants',
          );
        }
        Object.assign(updateData, {
          isMaster: true,
          masterProductId: null,
          variantOptions: null,
          variantKey: null,
          skuSuffix: null,
        });
      } else if (
        !isMaster &&
        dto.masterProductId &&
        dto.masterProductId !== product.masterProductId
      ) {
        const master = await this.productModel.findOne({
          where: { productId: dto.masterProductId, isMaster: true },
          transaction: t,
        });
        if (!master) throw new BadRequestException('Master product not found');

        const variantOpts = parseJsonSafely(dto.variantOptions, {});
        const generatedVariantKey = Object.values(variantOpts)
          .filter(Boolean)
          .join(' ');
        const generatedSkuSuffix = generatedVariantKey
          ? `-${generatedVariantKey.toUpperCase().replace(/\s+/g, '-')}`
          : '';

        Object.assign(updateData, {
          masterProductId: master.productId,
          isMaster: false,
          variantOptions: Object.keys(variantOpts).length ? variantOpts : null,
          variantKey: generatedVariantKey || dto.variantKey || null,
          skuSuffix: generatedSkuSuffix || dto.skuSuffix || null,
          name:
            dto.name?.trim() ||
            `${master.name} - ${generatedVariantKey}`.trim(),
          categoryId: dto.categoryId || master.categoryId,
          brandId: dto.brandId || master.brandId,
        });
      } else {
        updateData.isMaster = isMaster;

        if (!isMaster) {
          const finalKey =
            dto.variantKey ||
            (dto.variantOptions
              ? Object.values(parseJsonSafely(dto.variantOptions, {}))
                  .filter(Boolean)
                  .join(' ')
              : product.variantKey);
          const finalSuffix = finalKey
            ? `-${finalKey.toUpperCase().replace(/\s+/g, '-')}`
            : product.skuSuffix;

          updateData.variantKey = finalKey;
          updateData.skuSuffix = finalSuffix;
          updateData.variantOptions = dto.variantOptions
            ? parseJsonSafely(dto.variantOptions, {})
            : product.variantOptions;
        } else {
          updateData.variantOptions = null;
          updateData.variantKey = null;
          updateData.skuSuffix = null;
          updateData.masterProductId = null;
        }
      }

      await product.update(updateData, { transaction: t });

      const cleanKeywordIds = this.normalizeKeywordIds(dto.keywordIds);
      await (product as any).setKeywords(cleanKeywordIds, { transaction: t });

      await t.commit();
      return this.findById(productId);
    } catch (error) {
      if (!t.finished) {
        await t
          .rollback()
          .catch((e) => this.logger.error('Rollback error', e as Error));
      }
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      )
        throw error;
      throw new InternalServerErrorException(
        `Failed to update product: ${(error as Error).message}`,
      );
    }
  }

  // ─────────────────────────────────────────────────────────────
  // READ
  // ─────────────────────────────────────────────────────────────
  async findAll(query: {
    page: number;
    limit: number;
    search?: string;
    tab: string;
    lowStockThreshold: number;
  }) {
    const { page, limit, search, tab, lowStockThreshold } = query;
    const offset = (page - 1) * limit;
    const where: any = {};

    if (search?.trim()) {
      const pattern = `%${search.trim().toLowerCase()}%`;
      where[Op.or] = [
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
        { product_code: { [Op.like]: pattern } },
      ];
    }

    if (tab === 'in-stock') where.quantity = { [Op.gt]: 0 };
    else if (tab === 'out-of-stock') where.quantity = 0;
    else if (tab === 'low-stock')
      where.quantity = { [Op.gt]: 0, [Op.lte]: lowStockThreshold };

    // Inventory sort: in-stock first, then most recently updated.
    const order: any = [
      [
        this.sequelize.literal(
          'CASE WHEN `Product`.`quantity` > 0 THEN 0 ELSE 1 END',
        ),
        'ASC',
      ],
      ['updatedAt', 'DESC'],
      ['name', 'ASC'],
    ];

    const { count: total, rows: products } =
      await this.productModel.findAndCountAll({
        where,
        order,
        offset,
        limit,
        distinct: true,
        subQuery: false,
        include: KEYWORD_INCLUDE,
      });

    if (total === 0) {
      return { data: [], pagination: { total: 0, page, limit, totalPages: 0 } };
    }

    const metaMap = await buildMetaMap(
      this.productMetaModel,
      products.map((p) => p.toJSON()),
    );

    const data = products.map((p) => {
      const raw = p.toJSON();
      return {
        ...enrichProductJson(raw, metaMap),
        quantity: Number(raw.quantity) || 0,
      };
    });

    return {
      data,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findById(productId: string) {
    const product = await this.productModel.findByPk(productId, {
      include: KEYWORD_INCLUDE,
    });
    if (!product) throw new NotFoundException('Product not found');

    const raw: any = product.toJSON();
    const metaMap = await buildMetaMap(this.productMetaModel, [raw]);

    return {
      ...enrichProductJson(raw, metaMap),
      masterProductId: raw.masterProductId || raw.productId,
    };
  }

  async findByIds(dto: GetProductsByIdsDto) {
    const products = await this.productModel.findAll({
      where: { productId: { [Op.in]: dto.productIds } },
      attributes: { exclude: ['createdAt', 'updatedAt'] },
      order: [['name', 'ASC']],
      include: KEYWORD_INCLUDE,
    });

    const foundIds = products.map((p) => p.productId);
    const missingIds = dto.productIds.filter((id) => !foundIds.includes(id));
    if (missingIds.length > 0) {
      throw new NotFoundException(
        `Products not found for IDs: ${missingIds.join(', ')}`,
      );
    }

    const metaMap = await buildMetaMap(
      this.productMetaModel,
      products.map((p) => p.toJSON()),
    );
    const data = products.map((p) => enrichProductJson(p.toJSON(), metaMap));

    return {
      data,
      pagination: {
        total: data.length,
        page: 1,
        limit: data.length,
        totalPages: 1,
      },
    };
  }

  async remove(productId: string) {
    const product = await this.productModel.findByPk(productId);
    if (!product) throw new NotFoundException('Product not found');
    await product.destroy();
    return { message: 'Product deleted successfully' };
  }

  async updateFeatured(productId: string, isFeatured: boolean) {
    const product = await this.productModel.findOne({ where: { productId } });
    if (!product) throw new NotFoundException('Product not found');

    product.isFeatured = isFeatured;
    await product.save();

    return { message: 'Product featured status updated successfully', product };
  }

  async checkProductCode(code: string) {
    if (!code) throw new BadRequestException('Code is required');
    const existing = await this.productModel.findOne({
      where: { product_code: code.trim() },
      attributes: ['product_code'],
    });
    return { exists: !!existing };
  }

  async getAllProductCodes() {
    const products = await this.productModel.findAll({
      attributes: ['productId', 'product_code', 'name', 'categoryId', 'images'],
      include: [
        {
          model: this.productMetaModel,
          as: 'product_metas',
          attributes: ['id', 'title', 'slug', 'fieldType', 'unit'],
        },
      ],
    });

    const data = products.map((p) => {
      const raw: any = p.toJSON();
      if (raw.meta) {
        raw.metaDetails = Object.keys(raw.meta).map((metaId) => {
          const metaField = raw.product_metas?.find(
            (mf: any) => mf.id === metaId,
          );
          return {
            id: metaId,
            title: metaField?.title || 'Unknown',
            slug: metaField?.slug || null,
            value: raw.meta[metaId],
            fieldType: metaField?.fieldType || null,
            unit: metaField?.unit || null,
          };
        });
      }
      delete raw.product_metas;
      return raw;
    });

    return { success: true, count: products.length, data };
  }

  async getAllProductCodesBrandWise() {
    const products = await this.productModel.findAll({
      attributes: ['product_code', 'brandId'],
      where: { status: 'active' },
      raw: true,
    });

    const grouped = (products as any[]).reduce(
      (acc: Record<string, string[]>, p) => {
        const brandId = p.brandId || 'unknown';
        if (!acc[brandId]) acc[brandId] = [];
        acc[brandId].push(p.product_code);
        return acc;
      },
      {},
    );

    return { success: true, count: products.length, data: grouped };
  }

  async getCount() {
    const count = await this.productModel.count();
    return { success: true, totalProducts: count };
  }
}
