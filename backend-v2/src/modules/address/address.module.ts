// src/modules/addresses/address.module.ts
import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Address } from './models/address.model';
import { User } from '../users/models/user.model';
import { Customer } from '../customer/models/customer.model';
import { AddressService } from './address.service';
import { AddressController } from './address.controller';
import { NotificationService } from '@/modules/notifications/services/notification.service';
import { ActivityLogService } from '../engagement/services/activity-log.service';
@Module({
  imports: [SequelizeModule.forFeature([Address, User, Customer])],
  controllers: [AddressController],
  providers: [AddressService, NotificationService, ActivityLogService],
  exports: [AddressService],
})
export class AddressModule {}
