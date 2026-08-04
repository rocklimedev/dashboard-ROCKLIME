import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/sequelize';
import { Sequelize, Transaction } from 'sequelize';
import { Vendor } from '@/modules/vendor/models/vendor.model';
import { Brand } from '@/modules/brands/models/brand.model';
import { Job } from '@/modules/jobs/models/job.model'; // TODO: adjust to your models barrel path
import { Category } from '@/modules/brands/models/category.model'; // TODO: adjust to your models barrel path
import { Product } from '../models/product.model';
import { Keyword } from '@/modules/brands/models/keyword.model';
import { BatchCreateProductsDto } from '../dto/batch-create-products.dto';
import {
  BulkImportProductsDto,
  ImportProductRowDto,
} from '../dto/bulk-import-products.dto';
import { generateSlug } from '../utils/slug.util';

export interface ImportOptions {
  importJobId?: string;
  selectedBrandId: string;
}

@Injectable()
export class ProductImportService {
  constructor(
    @InjectModel(Product) private readonly productModel: typeof Product,
    @InjectModel(Category) private readonly categoryModel: typeof Category,
    @InjectModel(Vendor) private readonly vendorModel: typeof Vendor,
    @InjectModel(Brand) private readonly brandModel: typeof Brand,
    @InjectModel(Keyword) private readonly keywordModel: typeof Keyword,
    @InjectModel(Job) private readonly jobModel: typeof Job,
    @InjectConnection() private readonly sequelize: Sequelize,
  ) {}

  /** Small, synchronous batch create (<=50 rows, single shared category/brand). */
  async batchCreate(dto: BatchCreateProductsDto) {
    const t = await this.sequelize.transaction();
    const results: any[] = [];
    const errors: string[] = [];

    try {
      for (let i = 0; i < dto.products.length; i++) {
        const p = dto.products[i];
        const index = i + 1;

        if (!p.name?.trim() || !p.product_code?.trim()) {
          errors.push(`Row ${index}: Name and Code required`);
          continue;
        }

        try {
          const product = await this.productModel.create(
            {
              name: p.name.trim(),
              product_code: p.product_code.trim(),
              quantity: parseInt(String(p.quantity ?? 0), 10) || 0,
              price: parseFloat(String(p.price ?? 0)) || 0,
              categoryId: dto.categoryId,
              brandId: dto.brandId,
              vendorId: dto.vendorId || null,
              brand_parentcategoriesId: dto.brand_parentcategoriesId || null,
              description: p.description?.trim() || null,
              meta: p.meta && Object.keys(p.meta).length ? p.meta : null,
              images: '[]',
              status: 'active',
              isFeatured: false,
            },
            { transaction: t },
          );

          results.push({
            row: index,
            productId: product.productId,
            name: product.name,
            product_code: product.product_code,
            status: 'success',
          });
        } catch (err: any) {
          errors.push(
            err.name === 'SequelizeUniqueConstraintError'
              ? `Row ${index}: Code ${p.product_code} already exists`
              : `Row ${index}: ${err.message}`,
          );
        }
      }

      if (errors.length > 0 && results.length === 0) {
        await t.rollback();
        throw new BadRequestException({ message: 'All failed', errors });
      }

      if (results.length > 0) await t.commit();
      else await t.rollback();

      return {
        message: `${results.length} products created`,
        successCount: results.length,
        failedCount: errors.length,
        created: results,
        errors,
      };
    } catch (error) {
      if (!t.finished) await t.rollback();
      if (error instanceof BadRequestException) throw error;
      throw new InternalServerErrorException((error as Error).message);
    }
  }

  /**
   * Reusable batch processor: creates categories/vendors on the fly, then
   * creates each product row, tolerating per-row failures. Exposed publicly
   * so a background worker (e.g. a queue processor) can call it directly
   * with its own transaction, exactly like the original Express version.
   */
  async processProductBatch(
    productsBatch: ImportProductRowDto[],
    t: Transaction,
    options: ImportOptions,
  ) {
    const { importJobId, selectedBrandId } = options;
    if (!selectedBrandId)
      throw new Error('selectedBrandId is required for bulk import');

    const created: any[] = [];
    const failed: any[] = [];
    const newCategories = new Set<string>();
    const newVendors = new Set<string>();

    const categoryNames = [
      ...new Set(
        productsBatch.map((p) => p.categoryName?.trim()).filter(Boolean),
      ),
    ] as string[];
    const vendorNames = [
      ...new Set(
        productsBatch
          .map((p) => p.vendorName?.trim() || 'Unknown')
          .filter(Boolean),
      ),
    ] as string[];

    const [existingCategories, existingVendors, selectedBrand] =
      await Promise.all([
        this.categoryModel.findAll({
          where: { name: categoryNames },
          attributes: ['id', 'name', 'slug'],
          transaction: t,
        }),
        this.vendorModel.findAll({
          where: { name: vendorNames },
          attributes: ['id', 'name'],
          transaction: t,
        }),
        this.brandModel.findByPk(selectedBrandId, {
          attributes: ['id', 'name'],
          transaction: t,
        }),
      ]);

    if (!selectedBrand)
      throw new Error(`Selected brand ID ${selectedBrandId} not found`);

    const categoryMap = new Map(
      existingCategories.map((c: any) => [c.name.trim().toLowerCase(), c]),
    );
    const vendorMap = new Map(
      existingVendors.map((v: any) => [v.name.trim().toLowerCase(), v]),
    );

    // Create any missing categories/vendors first so product rows can reference them.
    for (const p of productsBatch) {
      const catName = p.categoryName?.trim() || 'Uncategorized';
      const catKey = catName.toLowerCase();
      if (!categoryMap.has(catKey)) {
        const slug = generateSlug(catName);
        const [newCat] = await this.categoryModel.findOrCreate({
          where: { name: catName },
          defaults: { name: catName, slug, brandId: (selectedBrand as any).id },
          transaction: t,
        });
        categoryMap.set(catKey, newCat);
        newCategories.add(catName);
      }

      const venName = p.vendorName?.trim() || 'Unknown';
      const venKey = venName.toLowerCase();
      if (!vendorMap.has(venKey)) {
        const [newVen] = await this.vendorModel.findOrCreate({
          where: { name: venName },
          defaults: { name: venName },
          transaction: t,
        });
        vendorMap.set(venKey, newVen);
        newVendors.add(venName);
      }
    }

    for (const [index, p] of productsBatch.entries()) {
      const rowIndex = p.rowIndex || index + 2;

      try {
        if (!p.name?.trim() || !p.product_code?.trim()) {
          throw new Error('Product name and code are required');
        }

        const existing = await this.productModel.findOne({
          where: { product_code: p.product_code.trim() },
          transaction: t,
        });
        if (existing)
          throw new Error(`Product code "${p.product_code}" already exists`);

        const category: any = categoryMap.get(
          (p.categoryName?.trim() || 'Uncategorized').toLowerCase(),
        );
        const vendor: any = vendorMap.get(
          (p.vendorName?.trim() || 'Unknown').toLowerCase(),
        );

        const newProduct = await this.productModel.create(
          {
            name: p.name.trim(),
            product_code: p.product_code.trim(),
            description: p.description?.trim() || null,
            quantity: Number(p.quantity) || 0,
            alert_quantity: p.alert_quantity ? Number(p.alert_quantity) : null,
            tax: p.tax ? Number(p.tax) : null,
            isFeatured: !!p.isFeatured,
            status: Number(p.quantity) > 0 ? 'active' : 'out_of_stock',
            images: Array.isArray(p.images) ? p.images : [],
            meta: p.meta || null,
            categoryId: category?.id || null,
            brandId: (selectedBrand as any).id,
            vendorId: vendor?.id || null,
          },
          { transaction: t },
        );

        if (Array.isArray(p.keywords) && p.keywords.length > 0) {
          const keywords = p.keywords.map((k) => k.trim()).filter(Boolean);
          const keywordRecords = await Promise.all(
            keywords.map(async (kw) => {
              let record = await this.keywordModel.findOne({
                where: { keyword: kw },
                transaction: t,
              });
              if (!record)
                record = await this.keywordModel.create(
                  { keyword: kw },
                  { transaction: t },
                );
              return record;
            }),
          );
          await (newProduct as any).setKeywords(
            keywordRecords.map((k: any) => k.id),
            { transaction: t },
          );
        }

        created.push({
          rowIndex,
          productId: newProduct.productId,
          name: newProduct.name,
          product_code: newProduct.product_code,
        });
      } catch (err: any) {
        failed.push({
          rowIndex,
          product_code: p.product_code || '[missing]',
          name: p.name || '[missing]',
          error: err.message || 'Unknown error',
        });
      }
    }

    if (importJobId) {
      const job = await this.jobModel.findByPk(importJobId, { transaction: t });
      if (job) {
        await job.update(
          {
            progress: {
              ...job.progress,
              processedRows:
                (job.progress?.processedRows || 0) + productsBatch.length,
              successCount: (job.progress?.successCount || 0) + created.length,
              failedCount: (job.progress?.failedCount || 0) + failed.length,
            },
            results: {
              ...job.results,
              newCategoriesCount:
                (job.results?.newCategoriesCount || 0) + newCategories.size,
              newVendorsCount:
                (job.results?.newVendorsCount || 0) + newVendors.size,
            },
            errorLog: [
              ...(job.errorLog || []),
              ...failed.map((f) => ({
                timestamp: new Date().toISOString(),
                row: f.rowIndex,
                message: f.error,
                data: { product_code: f.product_code, name: f.name },
              })),
            ],
          },
          { transaction: t },
        );
      }
    }

    return {
      created,
      failed,
      newCategories: newCategories.size,
      newBrands: 0,
      newVendors: newVendors.size,
    };
  }

  /** Synchronous endpoint for up to 300 rows; larger imports should go through a background job using processProductBatch directly. */
  async bulkImport(dto: BulkImportProductsDto) {
    const t = await this.sequelize.transaction();
    try {
      const result = await this.processProductBatch(dto.products, t, {
        selectedBrandId: dto.selectedBrandId,
      });
      await t.commit();

      return {
        success: true,
        message: `${result.created.length} products created`,
        created: result.created,
        failed: result.failed,
        newCategories: result.newCategories,
        newBrands: result.newBrands,
        newVendors: result.newVendors,
        totalProcessed: dto.products.length,
        successCount: result.created.length,
        failedCount: result.failed.length,
      };
    } catch (error) {
      await t.rollback();
      throw new InternalServerErrorException(
        `Bulk import failed: ${(error as Error).message}`,
      );
    }
  }
}
