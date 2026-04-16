// src/notifications/notifications.controller.ts
import {
  Controller,
  Get,
  Post,
  Param,
  Delete,
  UseGuards,
  Req,
} from '@nestjs/common';
import { NotificationsService } from './notification.service';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  // @UseGuards(JwtAuthGuard)
  async getNotifications(@Req() req: any) {
    const userId = req.user?.userId || req.query.userId; // adjust based on your auth
    return this.notificationsService.getNotifications(userId);
  }

  @Post(':id/read')
  async markAsRead(@Param('id') id: string) {
    return this.notificationsService.markAsRead(id);
  }

  @Delete('clear')
  async clearAll(@Req() req: any) {
    const userId = req.user?.userId || req.body.userId;
    return this.notificationsService.clearAllNotifications(userId);
  }
}