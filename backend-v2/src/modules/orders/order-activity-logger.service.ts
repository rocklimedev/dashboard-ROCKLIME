import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { OrderActivity } from './entities/order-activity.entity';

export interface LogOrderActivityInput {
  orderId: string;
  orderNo: string;
  action: string;
  description?: string | null;
  oldValue?: Record<string, any> | null;
  newValue?: Record<string, any> | null;
  performedBy?: string | null;
  metadata?: Record<string, any> | null;
  ipAddress?: string | null;
}

/**
 * Port of modules/orders/order-activity-logger.js. Fire-and-forget - call
 * without awaiting, or with `.catch(() => {})`, same as the legacy
 * `.catch(console.error)` pattern.
 */
@Injectable()
export class OrderActivityLoggerService {
  private readonly logger = new Logger('OrderActivity');

  constructor(
    @InjectModel(OrderActivity) private readonly orderActivityModel: typeof OrderActivity,
  ) {}

  async logOrderActivity(input: LogOrderActivityInput): Promise<void> {
    try {
      await this.orderActivityModel.create({
        orderId: input.orderId,
        orderNo: input.orderNo,
        action: input.action,
        description: input.description ?? null,
        oldValue: input.oldValue ?? null,
        newValue: input.newValue ?? null,
        performedBy: input.performedBy ?? null,
        metadata: input.metadata ?? null,
        ipAddress: input.ipAddress ?? null,
      } as any);
    } catch (error) {
      this.logger.error('Order Activity Log Error:', error as any);
    }
  }
}
