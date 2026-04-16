// src/field-guided-sheets/field-guided-sheets.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FieldGuidedSheetsController } from './field-guided-sheets.controller';
import { FieldGuidedSheetsService } from './field-guided-sheets.service';
import { FieldGuidedSheet } from './entities/field-guided-sheet.entity';
import { FgsItem } from './entities/fgs-item.entity';
import { Product } from '../products/entities/product.entity';
import { Vendor } from '../vendors/entities/vendor.entity';
import { User } from '../users/entities/user.entity';
import { PurchaseOrdersModule } from '../purchase-orders/purchase-orders.module';
import { NotificationsModule } from 'src/notification/notification.module';
@Module({
  imports: [
    TypeOrmModule.forFeature([FieldGuidedSheet, FgsItem, Product, Vendor, User]),
    PurchaseOrdersModule,
    NotificationsModule,
  ],
  controllers: [FieldGuidedSheetsController],
  providers: [FieldGuidedSheetsService],
  exports: [FieldGuidedSheetsService],
})
export class FieldGuidedSheetsModule {}