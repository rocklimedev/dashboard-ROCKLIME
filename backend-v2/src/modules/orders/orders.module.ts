import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { MongooseModule } from '@nestjs/mongoose';
import { OrdersController } from './order.controller';
import { OrdersService } from './orders.service';
import { OrderCalculationService } from './order-calculation.service';
import { OrderNumberService } from './order-number.service';
import { InventoryService } from './inventory.service';
import { OrderNotificationService } from './order-notification.service';
import { OrderDocumentService } from './order-document.service';
import { Order } from './models/order.model';
import { InventoryHistory } from '@/modules/product/models/inventory-history.model';
import { Customer } from '@/modules/customer/models/customer.model';
import { Team } from '@/modules/users/models/team.model';
import { User } from '../users/models/user.model';
import { Address } from '@/modules/address/models/address.model';
import { Quotation } from '@/modules/quotation/models/quotation.model';
import { Product } from '@/modules/product/models/product.model';
import { OrderItem, OrderItemSchema } from './models/order-item.model';
import {
  Comment,
  CommentSchema,
} from '@/modules/comments/models/comment.model';
import { NotificationModule } from '../common/notification/notification.module';
import { ActivityLogModule } from '@/modules/engagement/activity-log.module';
import { FtpModule } from '../common/ftp/ftp.module';
import { CommentsModule } from '../comments/comments.module';

@Module({
  imports: [
    SequelizeModule.forFeature([
      Order,
      User,
      Customer,
      Team,
      Address,
      Quotation,
      Product,
      InventoryHistory,
    ]),
    MongooseModule.forFeature([
      { name: OrderItem.name, schema: OrderItemSchema },
      { name: Comment.name, schema: CommentSchema },
    ]),
    NotificationModule,
    ActivityLogModule,
    FtpModule,
    CommentsModule, // for embedded order comments (fetchCommentsWithUsers)
  ],
  controllers: [OrdersController],
  providers: [
    OrdersService,
    OrderCalculationService,
    OrderNumberService,
    InventoryService,
    OrderNotificationService,
    OrderDocumentService,
  ],
  exports: [OrdersService],
})
export class OrdersModule {}
