import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { ProductMeta } from './entities/product-meta.entity';
import { Product } from '../product/entities/product.entity';
import { ProductMetaService } from './product-meta.service';
import { ProductMetaController } from './product-meta.controller';

@Module({
  imports: [SequelizeModule.forFeature([ProductMeta, Product])],
  controllers: [ProductMetaController],
  providers: [ProductMetaService],
  exports: [ProductMetaService],
})
export class ProductMetaModule {}
