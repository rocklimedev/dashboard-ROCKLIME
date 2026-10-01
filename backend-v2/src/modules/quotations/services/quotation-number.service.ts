import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op, Transaction } from 'sequelize';
import * as moment from 'moment';
import { Quotation } from '../entities/quotation.entity';

@Injectable()
export class QuotationNumberService {
  constructor(@InjectModel(Quotation) private readonly quotationModel: typeof Quotation) {}

  async generateQuotationNumber(t: Transaction): Promise<string> {
    const today = moment();
    const prefixDate = today.format('DDMMYY');
    const fullPrefix = `QUO${prefixDate}`;
    const todayStart = today.clone().startOf('day').toDate();
    const todayEnd = today.clone().endOf('day').toDate();

    const MAX_ATTEMPTS = 15;
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      const last = await this.quotationModel.findOne({
        where: {
          reference_number: { [Op.like]: `${fullPrefix}%` },
          createdAt: { [Op.between]: [todayStart, todayEnd] },
        } as any,
        attributes: ['reference_number'],
        order: [['reference_number', 'DESC']],
        limit: 1,
        transaction: t,
        lock: t.LOCK.UPDATE,
      });

      let nextSeq = 101;
      if (last) {
        const seqStr = last.reference_number.slice(fullPrefix.length);
        const parsed = parseInt(seqStr, 10);
        if (!isNaN(parsed) && parsed >= 100) nextSeq = parsed + 1;
      }

      const candidate = `${fullPrefix}${nextSeq}`;
      const exists = await this.quotationModel.findOne({
        where: { reference_number: candidate },
        transaction: t,
      });
      if (!exists) return candidate;
    }

    throw new Error(`Could not generate unique quotation number after ${MAX_ATTEMPTS} attempts`);
  }
}
