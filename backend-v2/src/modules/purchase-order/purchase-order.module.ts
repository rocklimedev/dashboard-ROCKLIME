import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { MongooseModule } from '@nestjs/mongoose';
import { FieldGuidedSheet } from './entities/fgs.entity';
import { PurchaseOrder } from './entities/purchase-order.entity';
import { Vendor } from '../vendors/entities/vendor.entity';
import { Product } from '../products/entities/product.entity';
import { User } from '../users/entities/user.entity';
import { FgsItem, FgsItemSchema } from './schemas/fgs-item.schema';
import { PoItem, PoItemSchema } from './schemas/po-item.schema';
import { FgsController } from './fgs.controller';
import { FgsService } from './fgs.service';
import { PurchaseOrderController } from './purchase-order.controller';
import { PurchaseOrderService } from './purchase-order.service';

@Module({
  imports: [
    SequelizeModule.forFeature([FieldGuidedSheet, PurchaseOrder, Vendor, Product, User]),
    MongooseModule.forFeature([
      { name: FgsItem.name, schema: FgsItemSchema },
      { name: PoItem.name, schema: PoItemSchema },
    ]),
  ],
  controllers: [FgsController, PurchaseOrderController],
  providers: [FgsService, PurchaseOrderService],
  exports: [FgsService, PurchaseOrderService],
})
export class PurchaseOrderModule {}
