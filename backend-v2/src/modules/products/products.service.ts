import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  NotImplementedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { InjectConnection } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize-typescript';
import { Op } from 'sequelize';

import { Product } from './entities/product.entity';
import { ProductMeta } from './entities/product-meta.entity';
import { InventoryHistory } from './entities/inventory-history.entity';
import { Keyword } from './entities/keyword.entity';
import { ProductKeyword } from './entities/product-keyword.entity';
import { User } from '../users/entities/user.entity';
import { UploadService } from '../../common/upload/upload.service';
import {
  COMPANY_CODE_META_ID,
  cleanKeywordIds,
  enrichProducts,
  generateProductCode,
  getKeywordInclude,
  normalizeKeywords,
  parseJsonSafely,
} from './helpers/product.helpers';
import {
  AddStockDto,
  CreateProductDto,
  RemoveStockDto,
  UpdateFeaturedDto,
  UpdateProductDto,
} from './dto/product.dto';

@Injectable()
export class ProductsService {
  constructor(
    @InjectModel(Product) private readonly productModel: typeof Product,
    @InjectModel(ProductMeta) private readonly productMetaModel: typeof ProductMeta,
    @InjectModel(InventoryHistory)
    private readonly inventoryHistoryModel: typeof InventoryHistory,
    @InjectModel(Keyword) private readonly keywordModel: typeof Keyword,
    @InjectModel(ProductKeyword)
    private readonly productKeywordModel: typeof ProductKeyword,
    @InjectModel(User) private readonly userModel: typeof User,
    @InjectConnection() private readonly sequelize: Sequelize,
    private readonly uploadService: UploadService,
  ) {}

  // ────────────────────────────────────────────────────────────
  // CREATE
  // ────────────────────────────────────────────────────────────
  async create(dto: CreateProductDto, files: Express.Multer.File[] = []) {
    const t = await this.sequelize.transaction();
    try {
      const metaObj = dto.meta ? parseJsonSafely(dto.meta, {}, 'meta') : {};

      const imageUrls: string[] = [];
      for (const file of files) {
        try {
          const url = await this.uploadService.uploadToFtp(
            file.buffer,
            file.originalname,
            { remoteDir: '/product_images' },
          );
          imageUrls.push(url);
        } catch (err) {
          console.error('Image upload failed for:', file.originalname, err);
        }
      }

      const isMaster = dto.isMaster === 'true' || dto.isMaster === true;
      const quantity = Number(dto.quantity) || 0;

      const productData: any = {
        name: dto.name?.trim() || 'Unnamed Product',
        quantity,
        images: imageUrls.length > 0 ? JSON.stringify(imageUrls) : null,
        meta: Object.keys(metaObj).length > 0 ? metaObj : null,
        isFeatured: dto.isFeatured === 'true' || dto.isFeatured === true,
        status: dto.status || (quantity > 0 ? 'active' : 'out_of_stock'),
        description: dto.description?.trim() || null,
        tax: dto.tax ? parseFloat(dto.tax as string) : null,
        alert_quantity: dto.alert_quantity
          ? parseInt(dto.alert_quantity as string, 10)
          : null,
        categoryId: dto.categoryId || null,
        brandId: dto.brandId || null,
        vendorId: dto.vendorId || null,
        brand_parentcategoriesId: dto.brand_parentcategoriesId || null,
      };

      let finalProductCode = (dto.product_code || '').trim();
      if (!finalProductCode) {
        finalProductCode = await generateProductCode({
          brandId: dto.brandId,
          categoryId: dto.categoryId,
          companyCode: metaObj?.[COMPANY_CODE_META_ID] || null,
        });
      }

      let attempt = 0;
      const maxAttempts = 10;
      while (attempt < maxAttempts) {
        const duplicate = await this.productModel.findOne({
          where: { product_code: finalProductCode },
          transaction: t,
        });
        if (!duplicate) break;
        finalProductCode = finalProductCode.replace(/-\d+$/, '') + `-${attempt + 2}`;
        attempt++;
      }
      if (attempt >= maxAttempts) {
        await t.rollback();
        throw new ConflictException(
          'Could not generate a unique product code after multiple attempts',
        );
      }
      productData.product_code = finalProductCode;

      let finalProduct: Product;

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
        if (!master) {
          await t.rollback();
          throw new BadRequestException('Master product not found');
        }

        const variantOpts = parseJsonSafely(dto.variantOptions, {});
        const generatedVariantKey = Object.values(variantOpts).filter(Boolean).join(' ');
        const generatedSkuSuffix = generatedVariantKey
          ? `-${String(generatedVariantKey).toUpperCase().replace(/\s+/g, '-')}`
          : '';

        finalProduct = await this.productModel.create(
          {
            ...productData,
            name: dto.name?.trim() || `${master.name} - ${generatedVariantKey}`.trim(),
            masterProductId: master.productId,
            isMaster: false,
            variantOptions: Object.keys(variantOpts).length ? variantOpts : null,
            variantKey: generatedVariantKey || dto.variantKey || null,
            skuSuffix: generatedSkuSuffix || dto.skuSuffix || null,
            categoryId: dto.categoryId || master.categoryId,
            brandId: dto.brandId || master.brandId,
            vendorId: dto.vendorId || master.vendorId,
            brand_parentcategoriesId:
              dto.brand_parentcategoriesId || master.brand_parentcategoriesId,
            images: imageUrls.length > 0 ? JSON.stringify(imageUrls) : master.images,
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

      const cleanedKeywordIds = cleanKeywordIds(dto.keywordIds);
      if (cleanedKeywordIds.length > 0) {
        await (finalProduct as any).$set('keywords', cleanedKeywordIds, { transaction: t });
      }

      await t.commit();

      const createdProduct = await this.productModel.findByPk(finalProduct.productId, {
        include: [getKeywordInclude() as any],
      });
      const keywords = normalizeKeywords((createdProduct as any).keywords);

      return {
        message: 'Product created successfully',
        product: this.serialize(createdProduct, keywords),
      };
    } catch (error: any) {
      if (t && !(t as any).finished) await t.rollback().catch(() => {});
      if (error instanceof BadRequestException || error instanceof ConflictException) throw error;
      throw new InternalServerErrorException(error.message || 'Failed to create product');
    }
  }

  // ────────────────────────────────────────────────────────────
  // UPDATE
  // ────────────────────────────────────────────────────────────
  async update(
    productId: string,
    dto: UpdateProductDto,
    files: Express.Multer.File[] = [],
  ) {
    const t = await this.sequelize.transaction();
    try {
      const product = await this.productModel.findByPk(productId, { transaction: t });
      if (!product) {
        await t.rollback();
        throw new NotFoundException('Product not found');
      }

      const metaObj = dto.meta ? parseJsonSafely(dto.meta, {}, 'meta') : {};

      let currentImages: string[] = product.images
        ? parseJsonSafely(product.images, [], 'existing images')
        : [];

      let imagesToDelete: string[] = [];
      if (dto.imagesToDelete) {
        imagesToDelete =
          typeof dto.imagesToDelete === 'string'
            ? parseJsonSafely(dto.imagesToDelete, [])
            : dto.imagesToDelete;
      }
      currentImages = currentImages.filter((url) => !imagesToDelete.includes(url));

      for (const file of files) {
        try {
          const url = await this.uploadService.uploadToFtp(file.buffer, file.originalname, {
            remoteDir: '/product_images',
          });
          currentImages.push(url);
        } catch (err) {
          console.error('Image upload failed:', file.originalname, err);
        }
      }

      const isMaster = dto.isMaster === 'true' || dto.isMaster === true;

      const updateData: any = {
        name: dto.name?.trim() || product.name,
        product_code: dto.product_code?.trim() || product.product_code,
        quantity: dto.quantity !== undefined ? Number(dto.quantity) : product.quantity,
        images: JSON.stringify(currentImages),
        meta: Object.keys(metaObj).length > 0 ? metaObj : null,
        isFeatured:
          dto.isFeatured === 'true' || dto.isFeatured === true || product.isFeatured,
        status: dto.status || product.status,
        description: dto.description?.trim() || product.description,
        tax: dto.tax !== undefined ? parseFloat(dto.tax as string) : product.tax,
        alert_quantity:
          dto.alert_quantity !== undefined
            ? parseInt(dto.alert_quantity as string, 10)
            : product.alert_quantity,
        categoryId: dto.categoryId || product.categoryId,
        brandId: dto.brandId || product.brandId,
        vendorId: dto.vendorId || product.vendorId,
        brand_parentcategoriesId:
          dto.brand_parentcategoriesId || product.brand_parentcategoriesId,
      };

      if (isMaster && !product.isMaster) {
        const hasVariants = await this.productModel.count({
          where: { masterProductId: product.productId },
          transaction: t,
        });
        if (hasVariants > 0) {
          await t.rollback();
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
        if (!master) {
          await t.rollback();
          throw new BadRequestException('Master product not found');
        }
        const variantOpts = parseJsonSafely(dto.variantOptions, {});
        const generatedVariantKey = Object.values(variantOpts).filter(Boolean).join(' ');
        const generatedSkuSuffix = generatedVariantKey
          ? `-${String(generatedVariantKey).toUpperCase().replace(/\s+/g, '-')}`
          : '';
        Object.assign(updateData, {
          masterProductId: master.productId,
          isMaster: false,
          variantOptions: Object.keys(variantOpts).length ? variantOpts : null,
          variantKey: generatedVariantKey || dto.variantKey || null,
          skuSuffix: generatedSkuSuffix || dto.skuSuffix || null,
          name: dto.name?.trim() || `${master.name} - ${generatedVariantKey}`.trim(),
          categoryId: dto.categoryId || master.categoryId,
          brandId: dto.brandId || master.brandId,
        });
      } else {
        updateData.isMaster = isMaster;
        if (!isMaster) {
          const finalKey =
            dto.variantKey ||
            (dto.variantOptions
              ? Object.values(parseJsonSafely(dto.variantOptions, {})).filter(Boolean).join(' ')
              : product.variantKey);
          const finalSuffix = finalKey
            ? `-${String(finalKey).toUpperCase().replace(/\s+/g, '-')}`
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

      const cleanedKeywordIds = cleanKeywordIds(dto.keywordIds);
      await (product as any).$set('keywords', cleanedKeywordIds, { transaction: t });

      const updated = await this.productModel.findByPk(productId, {
        transaction: t,
        include: [getKeywordInclude() as any],
      });

      await t.commit();

      const keywords = normalizeKeywords((updated as any).keywords);
      return {
        message: 'Product updated successfully',
        product: this.serialize(updated, keywords),
      };
    } catch (error: any) {
      if (t && !(t as any).finished) await t.rollback().catch(() => {});
      if (error instanceof BadRequestException || error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException(error.message || 'Failed to update product');
    }
  }

  // ────────────────────────────────────────────────────────────
  // READ
  // ────────────────────────────────────────────────────────────
  async findAll(query: any) {
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 50;
    const offset = (page - 1) * limit;
    const searchTerm = query.search?.trim();
    const tab = query.tab || 'all';
    const lowStockThreshold = parseInt(query.lowStockThreshold) || 10;

    const where: any = {};
    if (searchTerm) {
      const pattern = `%${searchTerm.toLowerCase()}%`;
      where[Op.or] = [
        this.sequelize.where(
          this.sequelize.fn('LOWER', this.sequelize.col('Product.name')),
          Op.like,
          pattern,
        ),
        { product_code: { [Op.like]: pattern } },
      ];
    }
    if (tab === 'in-stock') where.quantity = { [Op.gt]: 0 };
    else if (tab === 'out-of-stock') where.quantity = 0;
    else if (tab === 'low-stock') where.quantity = { [Op.gt]: 0, [Op.lte]: lowStockThreshold };

    const { count: total, rows: products } = await this.productModel.findAndCountAll({
      where,
      order: [
        ['updatedAt', 'DESC'],
        ['name', 'ASC'],
      ],
      offset,
      limit,
      distinct: true,
      include: [getKeywordInclude() as any],
    });

    if (total === 0) {
      return { data: [], pagination: { total: 0, page, limit, totalPages: 0 } };
    }

    const data = await enrichProducts(products);
    return { data, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async findOne(productId: string) {
    const product = await this.productModel.findByPk(productId, {
      include: [getKeywordInclude() as any],
    });
    if (!product) throw new NotFoundException('Product not found');

    const raw = product.toJSON() as any;
    const images = parseJsonSafely(raw.images, []);
    const metaObj = parseJsonSafely(raw.meta, {});
    const metaIds = Object.keys(metaObj);
    const metaDefs = metaIds.length
      ? await this.productMetaModel.findAll({
          where: { id: { [Op.in]: metaIds } } as any,
          attributes: ['id', 'title', 'slug', 'fieldType', 'unit'],
        })
      : [];
    const metaMap = Object.fromEntries(metaDefs.map((m) => [m.id, m]));
    const metaDetails = metaIds.map((id) => ({
      id,
      title: (metaMap[id] as any)?.title ?? 'Unknown',
      slug: (metaMap[id] as any)?.slug ?? null,
      value: String(metaObj[id] ?? ''),
      fieldType: (metaMap[id] as any)?.fieldType ?? 'text',
      unit: (metaMap[id] as any)?.unit ?? null,
    }));

    return {
      ...raw,
      images,
      meta: metaObj,
      metaDetails,
      keywords: normalizeKeywords(raw.keywords),
      isMaster: !!raw.isMaster,
      isVariant: !!raw.masterProductId,
    };
  }

  async findByIds(productIds: string[]) {
    const products = await this.productModel.findAll({
      where: { productId: { [Op.in]: productIds } } as any,
      order: [['name', 'ASC']],
      include: [getKeywordInclude() as any],
    });
    const foundIds = products.map((p) => p.productId);
    const missing = productIds.filter((id) => !foundIds.includes(id));
    if (missing.length > 0) {
      throw new NotFoundException(`Products not found for IDs: ${missing.join(', ')}`);
    }
    const data = await enrichProducts(products);
    return { data, pagination: { total: data.length, page: 1, limit: data.length, totalPages: 1 } };
  }

  findByCategory(categoryId: string) {
    return this.productModel.findAll({ where: { categoryId } });
  }

  findByBrand(brandId: string) {
    return this.productModel.findAll({ where: { brandId } });
  }

  async remove(productId: string) {
    const product = await this.productModel.findByPk(productId);
    if (!product) throw new NotFoundException('Product not found');
    await product.destroy();
    return { message: 'Product deleted successfully' };
  }

  async count() {
    const total = await this.productModel.count();
    return { success: true, totalProducts: total };
  }

  async checkCode(code: string) {
    if (!code) throw new BadRequestException('Code is required');
    const existing = await this.productModel.findOne({
      where: { product_code: code.trim() },
      attributes: ['product_code'],
    });
    return { exists: !!existing };
  }

  async updateFeatured(productId: string, dto: UpdateFeaturedDto) {
    const product = await this.productModel.findOne({ where: { productId } });
    if (!product) throw new NotFoundException('Product not found');
    product.isFeatured = dto.isFeatured;
    await product.save();
    return { message: 'Product featured status updated successfully', product };
  }

  // ────────────────────────────────────────────────────────────
  // STOCK MANAGEMENT
  // ────────────────────────────────────────────────────────────
  async addStock(productId: string, dto: AddStockDto) {
    if (!dto.quantity || dto.quantity <= 0) {
      throw new BadRequestException('Valid quantity is required');
    }
    const qty = Number(dto.quantity);

    const result = await this.sequelize.transaction(async (t) => {
      const product = await this.productModel.findByPk(productId, {
        lock: t.LOCK.UPDATE,
        transaction: t,
      });
      if (!product) throw new NotFoundException('Product not found');

      const newQuantity = product.quantity + qty;
      await product.update({ quantity: newQuantity }, { transaction: t });

      let username = 'unknown';
      if (dto.userId) {
        const user = await this.userModel.findByPk(dto.userId, {
          attributes: ['username'],
          transaction: t,
        });
        if (user) username = user.username;
      }

      const finalMessage =
        dto.message?.trim() ||
        `Stock added by ${username}${dto.orderNo ? ` (Order #${dto.orderNo})` : ''}`;

      const history = await this.inventoryHistoryModel.create(
        {
          productId,
          change: qty,
          quantityAfter: newQuantity,
          action: 'add-stock',
          orderNo: dto.orderNo || null,
          userId: dto.userId || null,
          message: finalMessage,
        } as any,
        { transaction: t },
      );

      return { product, history };
    });

    return {
      message: 'Stock added successfully',
      product: result.product,
      inventoryHistory: this.serializeHistory(result.history),
    };
  }

  async removeStock(productId: string, dto: RemoveStockDto) {
    if (!dto.quantity || dto.quantity <= 0) {
      throw new BadRequestException('Valid quantity is required');
    }
    const qty = Number(dto.quantity);

    const result = await this.sequelize.transaction(async (t) => {
      const product = await this.productModel.findByPk(productId, {
        lock: t.LOCK.UPDATE,
        transaction: t,
      });
      if (!product) throw new NotFoundException('Product not found');
      if (product.quantity < qty) throw new BadRequestException('Insufficient stock');

      const newQuantity = product.quantity - qty;
      await product.update({ quantity: newQuantity }, { transaction: t });

      let username = 'unknown';
      if (dto.userId) {
        const user = await this.userModel.findByPk(dto.userId, {
          attributes: ['username'],
          transaction: t,
        });
        if (user) username = user.username;
      }

      const finalMessage =
        dto.message?.trim() ||
        `Stock removed by ${username}${dto.orderNo ? ` (Order #${dto.orderNo})` : ''}`;

      const history = await this.inventoryHistoryModel.create(
        {
          productId,
          change: -qty,
          quantityAfter: newQuantity,
          action: 'remove-stock',
          orderNo: dto.orderNo || null,
          userId: dto.userId || null,
          message: finalMessage,
        } as any,
        { transaction: t },
      );

      return { product, history };
    });

    return {
      message: 'Stock removed successfully',
      product: result.product,
      inventoryHistory: this.serializeHistory(result.history),
    };
  }

  async getHistory(productId: string, query: any) {
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 50;
    const offset = (page - 1) * limit;

    const { count, rows } = await this.inventoryHistoryModel.findAndCountAll({
      where: { productId },
      order: [['createdAt', 'DESC']],
      limit,
      offset,
    });

    return {
      message: 'Inventory history retrieved successfully',
      total: count,
      page,
      pages: Math.ceil(count / limit),
      history: rows.map((h) => this.serializeHistory(h)),
    };
  }

  // ────────────────────────────────────────────────────────────
  // KEYWORDS
  // ────────────────────────────────────────────────────────────
  async addKeywords(productId: string, keywordIds: string[]) {
    const t = await this.sequelize.transaction();
    try {
      const product = await this.productModel.findByPk(productId, { transaction: t });
      if (!product) {
        await t.rollback();
        throw new NotFoundException('Product not found');
      }

      const keywords = await this.keywordModel.findAll({
        where: { id: keywordIds } as any,
        transaction: t,
      });
      if (keywords.length !== keywordIds.length) {
        await t.rollback();
        throw new BadRequestException('One or more keyword IDs are invalid');
      }

      await this.productKeywordModel.bulkCreate(
        keywordIds.map((keywordId) => ({ productId, keywordId })) as any,
        { ignoreDuplicates: true, transaction: t },
      );
      await t.commit();

      return { message: 'Keywords added successfully', keywords };
    } catch (error: any) {
      if (t && !(t as any).finished) await t.rollback().catch(() => {});
      if (error instanceof NotFoundException || error instanceof BadRequestException) throw error;
      throw new InternalServerErrorException(error.message);
    }
  }

  async removeKeyword(productId: string, keywordId: string) {
    const deleted = await this.productKeywordModel.destroy({ where: { productId, keywordId } });
    if (deleted === 0) {
      throw new NotFoundException('Keyword not associated with this product');
    }
    return { message: 'Keyword removed successfully' };
  }

  async removeAllKeywords(productId: string) {
    await this.productKeywordModel.destroy({ where: { productId } });
    return { message: 'All keywords removed' };
  }

  async replaceKeywords(productId: string, keywordIds: string[] | string) {
    const t = await this.sequelize.transaction();
    try {
      const cleanIds = cleanKeywordIds(keywordIds);
      const product = await this.productModel.findByPk(productId, { transaction: t });
      if (!product) {
        await t.rollback();
        throw new NotFoundException('Product not found');
      }
      await (product as any).$set('keywords', cleanIds, { transaction: t });
      await t.commit();

      const updated = await this.productModel.findByPk(productId, {
        include: [getKeywordInclude() as any],
      });
      return { message: 'Keywords updated successfully', keywords: (updated as any).keywords || [] };
    } catch (error: any) {
      if (t && !(t as any).finished) await t.rollback().catch(() => {});
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('Failed to update keywords');
    }
  }

  // ────────────────────────────────────────────────────────────
  // Not yet ported - see docs/MIGRATION_PLAN.md "Products module"
  // ────────────────────────────────────────────────────────────
  searchProducts(): never {
    throw new NotImplementedException(
      'searchProducts: port from product.service.js line ~1491',
    );
  }
  getLowStockProducts(): never {
    throw new NotImplementedException(
      'getLowStockProducts: port from product.service.js line ~1258/1363',
    );
  }
  getTopSellingProducts(): never {
    throw new NotImplementedException(
      'getTopSellingProducts: port from product.service.js line ~2162 (requires Order model)',
    );
  }
  bulkImportProducts(): never {
    throw new NotImplementedException(
      'bulkImportProducts: port from product.service.js line ~2583 + workers/bulkImportWorker.js',
    );
  }
  bulkInventoryUpdate(): never {
    throw new NotImplementedException(
      'bulkInventoryUpdate: port from product.service.js line ~2636',
    );
  }
  getAllProductCodesBrandWise(): never {
    throw new NotImplementedException(
      'getAllProductCodesBrandWise: port from product.service.js line ~1767 (requires Brand model)',
    );
  }
  getAllProductCodes(): never {
    throw new NotImplementedException(
      'getAllProductCodes: port from product.service.js line ~1644',
    );
  }

  // ────────────────────────────────────────────────────────────
  private serialize(product: any, keywords: any[]) {
    return {
      ...product.toJSON(),
      images: product.images ? JSON.parse(product.images) : [],
      meta: product.meta || {},
      keywords,
      variantOptions: product.variantOptions || {},
      variantKey: product.variantKey || null,
      skuSuffix: product.skuSuffix || null,
      isMaster: !!product.isMaster,
      isVariant: !!product.masterProductId,
    };
  }

  private serializeHistory(h: InventoryHistory) {
    return {
      id: h.id,
      action: h.action,
      change: h.change,
      quantityAfter: h.quantityAfter,
      timestamp: (h as any).createdAt,
      orderNo: h.orderNo,
      userId: h.userId,
      message: h.message,
    };
  }
}
