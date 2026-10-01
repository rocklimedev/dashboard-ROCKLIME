import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Product } from './entities/product.entity';
import { ProductMeta } from './entities/product-meta.entity';
import { InventoryHistory } from './entities/inventory-history.entity';
import { Keyword } from './entities/keyword.entity';
import { ProductKeyword } from './entities/product-keyword.entity';
import { User } from '../users/entities/user.entity';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { ProductMetaController } from './product-meta.controller';
import { ProductMetaService } from './product-meta.service';

@Module({
  imports: [
    SequelizeModule.forFeature([
      Product,
      ProductMeta,
      InventoryHistory,
      Keyword,
      ProductKeyword,
      User,
    ]),
  ],
  controllers: [ProductsController, ProductMetaController],
  providers: [ProductsService, ProductMetaService],
  exports: [ProductsService],
})
export class ProductsModule {}
