// src/notifications/notifications.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Notification } from './entity/notification.entity';
import { User } from '../users/entities/user.entity';
import { NotificationsGateway } from './notification.gateway';
@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,

    @InjectRepository(User)
    private userRepository: Repository<User>,

    private notificationsGateway: NotificationsGateway,
  ) {}

  // ─────────────────────────────────────────────────────────────
  // Send Notification (Main function used by other modules)
  // ─────────────────────────────────────────────────────────────
  async sendNotification({
    userId,
    title,
    message,
  }: {
    userId: string;
    title: string;
    message: string;
  }) {
    // Check if user exists (Sequelize → TypeORM)
    const user = await this.userRepository.findOne({
      where: { userId }, // adjust field name if your User uses 'id'
      select: ['userId', 'username'],
    });

    if (!user) {
      console.warn(`Skipping notification to missing user: ${userId}`);
      return null;
    }

    // Create notification
    const notification = this.notificationRepository.create({
      userId,
      title,
      message,
      read: false,
    });

    const savedNotification = await this.notificationRepository.save(notification);

    // Real-time emit via Socket.IO
    if (this.notificationsGateway) {
      this.notificationsGateway.emitToUser(userId, 'newNotification', {
        ...savedNotification,
        userId: {
          _id: user.userId,
          username: user.username,
        },
      });
    }

    return {
      ...savedNotification,
      userId: {
        _id: user.userId,
        username: user.username,
      },
    };
  }

  // ─────────────────────────────────────────────────────────────
  // Get All Notifications for a User
  // ─────────────────────────────────────────────────────────────
  async getNotifications(userId: string) {
    const notifications = await this.notificationRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });

    // Populate user info (same as original)
    const populated = await Promise.all(
      notifications.map(async (notif) => {
        const user = await this.userRepository.findOne({
          where: { userId: notif.userId },
          select: ['userId', 'username'],
        });

        return {
          ...notif,
          userId: {
            _id: user?.userId || notif.userId,
            username: user?.username || 'Unknown User',
          },
        };
      }),
    );

    return populated;
  }

  // ─────────────────────────────────────────────────────────────
  // Mark as Read
  // ─────────────────────────────────────────────────────────────
  async markAsRead(notificationId: string) {
    const notification = await this.notificationRepository.findOneBy({ id: notificationId });
    if (!notification) return null;

    notification.read = true;
    const updated = await this.notificationRepository.save(notification);

    const user = await this.userRepository.findOne({
      where: { userId: updated.userId },
      select: ['userId', 'username'],
    });

    return {
      ...updated,
      userId: {
        _id: user?.userId || updated.userId,
        username: user?.username || 'Unknown User',
      },
    };
  }

  // ─────────────────────────────────────────────────────────────
  // Clear All Notifications for a User
  // ─────────────────────────────────────────────────────────────
  async clearAllNotifications(userId: string) {
    const result = await this.notificationRepository.delete({ userId });

    const user = await this.userRepository.findOne({
      where: { userId },
      select: ['userId', 'username'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Real-time event
    this.notificationsGateway.emitToUser(userId, 'notificationsCleared', {
      userId,
      deletedCount: result.affected,
      message: 'All notifications cleared',
    });

    return {
      userId: {
        _id: user.userId,
        username: user.username,
      },
      deletedCount: result.affected,
      message: 'All notifications cleared successfully',
    };
  }

  // ─────────────────────────────────────────────────────────────
  // Cron Job: Delete notifications older than 7 days (daily at midnight)
  // ─────────────────────────────────────────────────────────────
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async deleteOldNotifications() {
    try {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

      const result = await this.notificationRepository.delete({
        createdAt: { $lt: sevenDaysAgo } as any, // TypeORM supports this
      });

      console.log(`🧹 Deleted ${result.affected} old notifications`);

      // Optional: broadcast to all connected clients
      this.notificationsGateway.emitToAll('notificationsDeleted', {
        message: `${result.affected} old notifications were cleaned up`,
      });
    } catch (error) {
      console.error('Failed to delete old notifications:', error);
    }
  }
}