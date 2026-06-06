import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import {
  Product,
  Customer,
  Quotation,
  Order,
  Brand,
  Category,
  Vendor,
  PurchaseOrder,
} from '../models';
import { SearchService } from './search.service';
import { SearchController } from './search.controller';

@Module({
  imports: [
    SequelizeModule.forFeature([
      Product,
      Customer,
      Quotation,
      Order,
      Brand,
      Category,
      Vendor,
      PurchaseOrder,
    ]),
  ],
  controllers: [SearchController],
  providers: [SearchService],
})
export class SearchModule {}
