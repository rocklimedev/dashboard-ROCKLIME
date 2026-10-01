import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { ActivityLog } from './entities/activity-log.entity';

export interface LogActivityInput {
  userId?: string | null;
  contextTag: string;
  subContext: string;
  action: string;
  entityId?: string | null;
  entityName?: string | null;
  description?: string | null;
  oldValues?: Record<string, any> | null;
  newValues?: Record<string, any> | null;
  metadata?: Record<string, any> | null;
  req?: { ip?: string; headers?: Record<string, any> } | null;
}

/**
 * Port of utils/activityLogger.js. Callers should NOT await this in the hot
 * path where the legacy code used `.catch(console.error)` fire-and-forget -
 * call `.catch(() => {})` or just don't await, to preserve latency
 * characteristics. `logActivity()` itself never throws.
 */
@Injectable()
export class ActivityLogService {
  private readonly logger = new Logger('ActivityLog');

  constructor(
    @InjectModel(ActivityLog) private readonly activityLogModel: typeof ActivityLog,
  ) {}

  async logActivity(input: LogActivityInput): Promise<void> {
    try {
      await this.activityLogModel.create({
        userId: input.userId ?? null,
        contextTag: input.contextTag,
        subContext: input.subContext,
        action: input.action,
        entityId: input.entityId ?? null,
        entityName: input.entityName ?? null,
        description: input.description ?? null,
        oldValues: input.oldValues ?? null,
        newValues: input.newValues ?? null,
        metadata: input.metadata ?? null,
        ipAddress: input.req?.ip ?? null,
        userAgent: input.req?.headers?.['user-agent'] ?? null,
      } as any);
    } catch (error) {
      this.logger.error('Activity Log Error:', error as any);
    }
  }
}
