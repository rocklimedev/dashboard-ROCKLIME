// src/modules/brands/brand.module.ts
import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Brand } from '@/modules/brands/models/brand.model';
import { Product } from '@/modules/product/models/product.model';
import { BrandService } from './services/brand.service';
import { BrandController } from './controller/brand.controller';
import { NotificationService } from '@/modules/notifications/services/notification.service';
import { ActivityLogService } from '@/modules/engagement/services/activity-log.service';

@Module({
  imports: [SequelizeModule.forFeature([Brand, Product])],
  controllers: [BrandController],
  providers: [BrandService, NotificationService, ActivityLogService],
  exports: [BrandService],
})
export class BrandModule {}
