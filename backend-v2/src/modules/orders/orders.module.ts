import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { MongooseModule } from '@nestjs/mongoose';
import { Order } from './entities/order.entity';
import { OrderActivity } from './entities/order-activity.entity';
import { OrderDispatch } from './entities/order-dispatch.entity';
import { OrderCreditNote } from './entities/order-credit-note.entity';
import { OrderCreditNoteItem } from './entities/order-credit-note-item.entity';
import { Product } from '../products/entities/product.entity';
import { InventoryHistory } from '../products/entities/inventory-history.entity';
import { User } from '../users/entities/user.entity';
import { Customer } from '../customers/entities/customer.entity';
import { OrderItem, OrderItemSchema } from './schemas/order-item.schema';
import { Comment, CommentSchema } from './schemas/comment.schema';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { OrderActivityLoggerService } from './order-activity-logger.service';

@Module({
  imports: [
    SequelizeModule.forFeature([
      Order,
      OrderActivity,
      OrderDispatch,
      OrderCreditNote,
      OrderCreditNoteItem,
      Product,
      InventoryHistory,
      User,
      Customer,
    ]),
    MongooseModule.forFeature([
      { name: OrderItem.name, schema: OrderItemSchema },
      { name: Comment.name, schema: CommentSchema },
    ]),
  ],
  controllers: [OrdersController],
  providers: [OrdersService, OrderActivityLoggerService],
  exports: [OrdersService],
})
export class OrdersModule {}
