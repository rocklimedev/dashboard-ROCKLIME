import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Customer } from '../models/customer.model';
import { CustomerController } from './customer.controller';
import { CustomerService } from './customer.service';
import { ActivityLogService } from '../activity-log/activity-log.service';
import { NotificationService } from '../notification/notification.service';

@Module({
  imports: [SequelizeModule.forFeature([Customer])],
  controllers: [CustomerController],
  providers: [CustomerService, ActivityLogService, NotificationService],
  exports: [CustomerService],
})
export class CustomerModule {}
