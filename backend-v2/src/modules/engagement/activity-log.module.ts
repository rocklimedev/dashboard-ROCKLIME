import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { ActivityLog } from './models/activity.model';
import { User } from '../users/models/user.model';
import { ActivityLogController } from './controller/activity.controller';
import { ActivityLogService } from './services/activity-log.service';
@Module({
  imports: [SequelizeModule.forFeature([ActivityLog, User])],
  controllers: [ActivityLogController],
  providers: [ActivityLogService],
  exports: [ActivityLogService],
})
export class ActivityLogModule {}
