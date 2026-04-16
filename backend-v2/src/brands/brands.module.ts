// src/brands/brands.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BrandsController } from './brands.controller';
import { BrandsService } from './brands.service';
import { Brand } from './entities/brand.entity';
import { Product } from '../products/entities/product.entity'; // if getTotalProductOfBrand is used
import { NotificationsModule } from '../notification/notification.module';
@Module({
  imports: [
    TypeOrmModule.forFeature([Brand, Product]),
     NotificationsModule,   // Uncomment if NotificationService is in a separate module
  ],
  controllers: [BrandsController],
  providers: [BrandsService],
  exports: [BrandsService],
})
export class BrandsModule {}