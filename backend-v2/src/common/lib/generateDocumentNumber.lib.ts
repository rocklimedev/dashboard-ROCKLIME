import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op, Transaction, ModelStatic } from 'sequelize';
import * as moment from 'moment';

import { Quotation } from '../models/quotation.model';
import { Order } from '../models/order.model';
import { PurchaseOrder } from '../models/purchase-order.model';

interface PrefixStyle {
  type: 'QUOTATION' | 'ORDER' | 'PURCHASE_ORDER';
  field: string;
  prefixLike: string;
}

@Injectable()
export class DocumentNumberService {
  constructor(
    @InjectModel(Quotation)
    private readonly quotationModel: typeof Quotation,

    @InjectModel(Order)
    private readonly orderModel: typeof Order,

    @InjectModel(PurchaseOrder)
    private readonly purchaseOrderModel: typeof PurchaseOrder,
  ) {}

  private getModel(style: PrefixStyle): ModelStatic<any> {
    switch (style.type) {
      case 'QUOTATION':
        return this.quotationModel;

      case 'ORDER':
        return this.orderModel;

      case 'PURCHASE_ORDER':
        return this.purchaseOrderModel;

      default:
        throw new Error('Invalid document type');
    }
  }

  async generateDailyNumber(
    style: PrefixStyle,
    transaction?: Transaction,
  ): Promise<string> {
    const model = this.getModel(style);

    const todayStart = moment().startOf('day').toDate();
    const todayEnd = moment().endOf('day').toDate();

    const prefix = moment().format('DDMMYY');

    const MAX_ATTEMPTS = 10;

    let attempt = 0;

    while (attempt < MAX_ATTEMPTS) {
      attempt++;

      const existing = await model.findAll({
        where: {
          [style.field]: {
            [Op.like]: `${style.prefixLike}${prefix}%`,
          },
          createdAt: {
            [Op.between]: [todayStart, todayEnd],
          },
        },
        attributes: [style.field],
        order: [[style.field, 'DESC']],
        limit: 1,
        transaction,
        lock: transaction ? transaction.LOCK.UPDATE : undefined,
      });

      let nextSeq = 101;

      if (existing.length) {
        const lastNo = existing[0].get(style.field) as string;

        const seqPart = lastNo.slice(prefix.length);

        const parsed = parseInt(seqPart, 10);

        if (!isNaN(parsed)) {
          nextSeq = parsed + 1;
        }
      }

      let candidate = '';

      switch (style.type) {
        case 'QUOTATION':
          candidate = `QUO${prefix}${nextSeq}`;
          break;

        case 'ORDER':
          candidate = `${prefix}${nextSeq}`;
          break;

        case 'PURCHASE_ORDER':
          candidate = `PO${prefix}${nextSeq}`;
          break;
      }

      const conflict = await model.findOne({
        where: {
          [style.field]: candidate,
        },
        transaction,
      });

      if (!conflict) {
        return candidate;
      }

      console.warn(
        `Number collision on ${candidate}. Retry ${attempt}/${MAX_ATTEMPTS}`,
      );
    }

    throw new Error(
      `Failed to generate unique document number after ${MAX_ATTEMPTS} attempts`,
    );
  }

  async generateQuotationNumber(transaction?: Transaction) {
    return this.generateDailyNumber(
      {
        type: 'QUOTATION',
        field: 'reference_number',
        prefixLike: 'QUO',
      },
      transaction,
    );
  }

  async generateOrderNumber(transaction?: Transaction) {
    return this.generateDailyNumber(
      {
        type: 'ORDER',
        field: 'orderNo',
        prefixLike: '',
      },
      transaction,
    );
  }

  async generatePurchaseOrderNumber(transaction?: Transaction) {
    return this.generateDailyNumber(
      {
        type: 'PURCHASE_ORDER',
        field: 'poNumber',
        prefixLike: 'PO',
      },
      transaction,
    );
  }
}