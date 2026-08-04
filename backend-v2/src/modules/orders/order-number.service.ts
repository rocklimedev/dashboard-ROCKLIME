import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op, Transaction } from 'sequelize';
import * as moment from 'moment';
import { Order } from './models/order.model';

/**
 * Generates the daily sequential order numbers (DDMMYY101, DDMMYY102, ...)
 * and the draft-order numbers. Extracted so the locking/retry logic isn't
 * buried inside `createOrder`.
 */
@Injectable()
export class OrderNumberService {
  private readonly MAX_ATTEMPTS = 15;

  constructor(@InjectModel(Order) private readonly orderModel: typeof Order) {}

  async generateDailyOrderNumber(transaction: Transaction): Promise<string> {
    const todayStart = moment().startOf('day').toDate();
    const todayEnd = moment().endOf('day').toDate();
    const prefix = moment().format('DDMMYY');

    for (let attempt = 0; attempt < this.MAX_ATTEMPTS; attempt++) {
      const lastOrder = await this.orderModel.findOne({
        where: {
          orderNo: { [Op.like]: `${prefix}%` },
          createdAt: { [Op.between]: [todayStart, todayEnd] },
        },
        attributes: ['orderNo'],
        order: [['orderNo', 'DESC']],
        limit: 1,
        transaction,
        lock: transaction.LOCK.UPDATE,
      });

      let nextSeq = 101;
      if (lastOrder) {
        const lastSeqStr = lastOrder.orderNo.slice(prefix.length);
        const parsed = parseInt(lastSeqStr, 10);
        if (!isNaN(parsed)) nextSeq = parsed + 1;
      }

      const candidate = `${prefix}${nextSeq}`;

      const conflict = await this.orderModel.findOne({
        where: { orderNo: candidate },
        transaction,
      });

      if (!conflict) return candidate;
    }

    throw new InternalServerErrorException(
      `Failed to generate unique order number after ${this.MAX_ATTEMPTS} attempts`,
    );
  }

  async generateDraftOrderNumber(): Promise<number> {
    const today = moment().format('DDMMYYYY');
    const dayCount = await this.orderModel.count({
      where: {
        createdAt: {
          [Op.gte]: moment().startOf('day').toDate(),
          [Op.lte]: moment().endOf('day').toDate(),
        },
      },
    });
    const serial = String(dayCount + 1).padStart(5, '0');
    return parseInt(`${today}${serial}`, 10);
  }
}
