import {
  Controller,
  Get,
  Delete,
  Param,
  Query,
  ParseIntPipe,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ActivityLogService } from '../services/activity-log.service';
import { PaginationQueryDto } from '../dto/activity-log.dto';

@Controller('activity-logs')
export class ActivityLogController {
  constructor(private readonly activityLogService: ActivityLogService) {}

  @Get()
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  getAllActivities(@Query() query: PaginationQueryDto) {
    return this.activityLogService.findAll(query);
  }

  @Get(':id')
  getActivityById(@Param('id', ParseIntPipe) id: number) {
    return this.activityLogService.findOne(id);
  }

  @Get('user/:userId')
  getActivityByUser(@Param('userId', ParseIntPipe) userId: number) {
    return this.activityLogService.findByUser(userId);
  }

  @Delete(':id')
  deleteLog(@Param('id', ParseIntPipe) id: number) {
    return this.activityLogService.remove(id);
  }
}
