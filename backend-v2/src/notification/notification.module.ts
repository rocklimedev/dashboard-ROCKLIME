// src/notifications/notifications.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { NotificationsService } from './notification.service';
import { NotificationsController } from './notification.controller';
import { NotificationsGateway } from './notification.gateway';
import { Notification } from './entity/notification.entity';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Notification, User]),
    ScheduleModule.forRoot(), // Required for @Cron
  ],
  controllers: [NotificationsController],
  providers: [NotificationsService, NotificationsGateway],
  exports: [NotificationsService, NotificationsGateway], // Export so other modules can use sendNotification
})
export class NotificationsModule {}