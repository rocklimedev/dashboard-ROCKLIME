import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { ProductMeta } from './models/product-meta.model';
import { Product } from './models/product.model';
import { ProductMetaService } from './services/product-meta.service';
import { ProductMetaController } from './controller/product-meta.controller';

@Module({
  imports: [SequelizeModule.forFeature([ProductMeta, Product])],
  controllers: [ProductMetaController],
  providers: [ProductMetaService],
  exports: [ProductMetaService],
})
export class ProductMetaModule {}
