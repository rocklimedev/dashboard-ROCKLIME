import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { MongooseModule } from '@nestjs/mongoose';
import { Quotation } from './entities/quotation.entity';
import { Customer } from '../customers/entities/customer.entity';
import { User } from '../users/entities/user.entity';
import { Product } from '../products/entities/product.entity';
import { QuotationItem, QuotationItemSchema } from './schemas/quotation-item.schema';
import { QuotationVersion, QuotationVersionSchema } from './schemas/quotation-version.schema';
import { QuotationsController } from './quotations.controller';
import { QuotationsService } from './quotations.service';
import { QuotationNumberService } from './services/quotation-number.service';
import { VersioningService } from './services/versioning.service';
import { ProductEnrichmentService } from './services/product-enrichment.service';

@Module({
  imports: [
    SequelizeModule.forFeature([Quotation, Customer, User, Product]),
    MongooseModule.forFeature([
      { name: QuotationItem.name, schema: QuotationItemSchema },
      { name: QuotationVersion.name, schema: QuotationVersionSchema },
    ]),
  ],
  controllers: [QuotationsController],
  providers: [
    QuotationsService,
    QuotationNumberService,
    VersioningService,
    ProductEnrichmentService,
  ],
  exports: [QuotationsService],
})
export class QuotationsModule {}
