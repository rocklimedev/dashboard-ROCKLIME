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
import {
  User,
  Customer,
  Team,
  Address,
  Quotation,
  Product,
  InventoryHistory,
} from '../models';
import { OrderItem, OrderItemSchema } from '../models/order-item.schema';
import { Comment, CommentSchema } from '../models/comment.schema';
import { NotificationModule } from '../common/notification/notification.module';
import { ActivityLogModule } from '../common/activity-log/activity-log.module';
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
