// src/orders/orders.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { Product } from '../products/entities/product.entity';
import { Customer } from '../customers/entities/customer.entity';
import { User } from '../users/entities/user.entity';
import { Address } from 'src/address/entities/address.entity';
import { Quotation } from '../quotations/entities/quotation.entity';
import { InventoryHistory } from 'src/products/entities/inventory-history.entity';
import { NotificationsModule } from 'src/notification/notification.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, OrderItem, Product, Customer, User, Address, Quotation, InventoryHistory]),
    MulterModule.register({ dest: './temp-uploads' }),
    NotificationsModule,
  ],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}