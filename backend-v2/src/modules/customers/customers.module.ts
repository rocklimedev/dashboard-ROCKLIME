import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Customer } from './entities/customer.entity';
import { Address } from '../address/entities/address.entity';
import { Quotation } from '../quotations/entities/quotation.entity';
import { Order } from '../orders/entities/order.entity';
import { CustomersController } from './customers.controller';
import { CustomersService } from './customers.service';

@Module({
  imports: [SequelizeModule.forFeature([Customer, Address, Quotation, Order])],
  controllers: [CustomersController],
  providers: [CustomersService],
  exports: [CustomersService],
})
export class CustomersModule {}
