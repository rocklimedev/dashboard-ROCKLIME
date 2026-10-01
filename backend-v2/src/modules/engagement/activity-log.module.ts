import { Global, Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { ActivityLog } from './entities/activity-log.entity';
import { ActivityLogService } from './activity-log.service';

@Global()
@Module({
  imports: [SequelizeModule.forFeature([ActivityLog])],
  providers: [ActivityLogService],
  exports: [ActivityLogService],
})
export class ActivityLogModule {}
