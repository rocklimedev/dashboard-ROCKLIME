// src/customers/customers.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomersController } from './customers.controller';
import { CustomersService } from './customers.service';
import { Customer } from './entities/customer.entity';
import { NotificationsModule } from '../notification/notification.module';
@Module({
  imports: [
    TypeOrmModule.forFeature([Customer]),
    NotificationsModule, // if NotificationService is in separate module
  ],
  controllers: [CustomersController],
  providers: [CustomersService],
  exports: [CustomersService],
})
export class CustomersModule {}