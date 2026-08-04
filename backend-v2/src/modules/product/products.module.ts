import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';

import { Order } from '@/modules/orders/models/order.model'; // TODO: adjust to your models barrel path
import { Quotation } from '../quotation/models/quotation.model';
import { ProductKeyword } from './models/product-keywords.model';
import { User } from '@/modules/users/models/user.model';
import { ProductMeta } from './models/product-meta.model';
import { InventoryHistory } from './models/inventory-history.model';
import { Vendor } from '@/modules/vendor/models/vendor.model';
import { Brand } from '@/modules/brands/models/brand.model';
import { Job } from '@/modules/jobs/models/job.model'; // TODO: adjust to your models barrel path
import { Category } from '@/modules/brands/models/category.model'; // TODO: adjust to your models barrel path
import { Product } from './models/product.model';
import { Keyword } from '@/modules/brands/models/keyword.model';
import { ProductsController } from './controller/product.controller';
import { ProductsService } from './services/products.service';
import { ProductCodeGeneratorService } from './services/product-code-generator.service';
import { ProductQueryService } from './services/product-query.service';
import { InventoryService } from './services/inventory.service';
import { ProductVariantsService } from './services/product-variants.service';
import { ProductKeywordsService } from './services/product-keywords.service';
import { ProductImportService } from './services/product-import.service';
import { ProductAnalyticsService } from './services/product-analytics.service';
import { UploadService } from './services/upload.service';

@Module({
  imports: [
    SequelizeModule.forFeature([
      Product,
      ProductMeta,
      InventoryHistory,
      Brand,
      User,
      ProductKeyword,
      Keyword,
      Category,
      Quotation,
      Order,
      Vendor,
      Job,
    ]),
  ],
  controllers: [ProductsController],
  providers: [
    ProductsService,
    ProductCodeGeneratorService,
    ProductQueryService,
    InventoryService,
    ProductVariantsService,
    ProductKeywordsService,
    ProductImportService,
    ProductAnalyticsService,
    UploadService,
  ],
  exports: [ProductsService, InventoryService, ProductImportService],
})
export class ProductsModule {}
