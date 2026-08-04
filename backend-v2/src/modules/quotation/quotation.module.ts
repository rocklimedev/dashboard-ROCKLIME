import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { MongooseModule } from '@nestjs/mongoose';
import { Quotation } from '@/modules/quotation/models/quotation.model'; // adjust
import { Product } from '@/modules/product/models/product.model'; // adjust
import { Customer } from '@/modules/customer/models/customer.model'; // adjust
import { User } from '@/modules/users/models/user.model'; // adjust
import {
  QuotationItem,
  QuotationItemSchema,
} from '@/modules/quotation/models/quotation-item.model'; // adjust
import {
  QuotationVersion,
  QuotationVersionSchema,
} from './models/quotation-version.model'; // adjust
import { ActivityLogModule } from '@/modules/engagement/activity-log.module'; // adjust
import { NotificationModule } from '../notifications/notification.module'; // adjust
import { QuotationController } from './quotation.controller';
import { QuotationCrudService } from './services/quotation.service';
import { QuotationCalculationService } from './services/quotation-calculation.service';
import { QuotationNumberService } from './services/quotation-number.service';
import { QuotationProductEnrichmentService } from './services/quotation-product-enrichment.service';
import { QuotationVersionService } from './services/quotation-version.service';
import { QuotationExportService } from './services/quotation-export.service';

@Module({
  imports: [
    SequelizeModule.forFeature([Quotation, Product, Customer, User]),
    MongooseModule.forFeature([
      { name: QuotationItem.name, schema: QuotationItemSchema },
      { name: QuotationVersion.name, schema: QuotationVersionSchema },
    ]),
    ActivityLogModule,
    NotificationModule,
  ],
  controllers: [QuotationController],
  providers: [
    QuotationCrudService,
    QuotationCalculationService,
    QuotationNumberService,
    QuotationProductEnrichmentService,
    QuotationVersionService,
    QuotationExportService,
  ],
  exports: [QuotationCrudService, QuotationExportService],
})
export class QuotationModule {}
