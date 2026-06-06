import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { ActivityLog } from '../models/activity.model';
import { User } from 'src/modules/users/models/user.model';
import { PaginationQueryDto } from '../dto/activity-log.dto';
@Injectable()
export class ActivityLogService {
  constructor(
    @InjectModel(ActivityLog) private activityLogModel: typeof ActivityLog,
  ) {}

  async findAll(query: PaginationQueryDto) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const offset = (page - 1) * limit;

    const { count, rows } = await this.activityLogModel.findAndCountAll({
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['userId', 'name', 'email'],
        },
      ],
      order: [['createdAt', 'DESC']],
      limit,
      offset,
    });

    return {
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit),
      activities: rows,
    };
  }

  async findOne(id: number) {
    const activity = await this.activityLogModel.findByPk(id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['userId', 'name', 'email'],
        },
      ],
    });

    if (!activity) {
      throw new NotFoundException('Activity not found');
    }

    return activity;
  }

  async findByUser(userId: number) {
    return this.activityLogModel.findAll({
      where: { userId },
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['userId', 'name', 'email'],
        },
      ],
    });
  }

  async remove(id: number) {
    const activity = await this.activityLogModel.findByPk(id);
    if (!activity) {
      throw new NotFoundException('Activity log not found');
    }

    await activity.destroy();
    return { message: 'Activity log deleted successfully' };
  }
}
