// src/modules/addresses/address.module.ts
import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Address } from './entities/address.entity';
import { User } from '@/modules/users/entities/user.entity';
import { Customer } from '@/modules/customers/entities/customer.entity';
import { AddressService } from './services/address.service';
import { AddressController } from './controllers/address.controller';
import { NotificationService } from '@/modules/notifications/services/notification.service';
import { ActivityLoggerService } from '@/common/services/activity-logger.service';

@Module({
  imports: [SequelizeModule.forFeature([Address, User, Customer])],
  controllers: [AddressController],
  providers: [AddressService, NotificationService, ActivityLoggerService],
  exports: [AddressService],
})
export class AddressModule {}
