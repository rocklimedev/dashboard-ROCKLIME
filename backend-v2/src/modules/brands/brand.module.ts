// src/modules/brands/brand.module.ts
import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Brand } from './entities/brand.entity';
import { Product } from '@/modules/products/entities/product.entity';
import { BrandService } from './services/brand.service';
import { BrandController } from './controllers/brand.controller';
import { NotificationService } from '@/modules/notifications/services/notification.service';
import { ActivityLoggerService } from '@/common/services/activity-logger.service';

@Module({
  imports: [SequelizeModule.forFeature([Brand, Product])],
  controllers: [BrandController],
  providers: [BrandService, NotificationService, ActivityLoggerService],
  exports: [BrandService],
})
export class BrandModule {}
