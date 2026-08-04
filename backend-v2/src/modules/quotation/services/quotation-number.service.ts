import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op, Transaction } from 'sequelize';
import * as moment from 'moment';
import { Quotation } from '@/modules/quotation/models/quotation.model'; // adjust to your actual model path

/**
 * Generates unique, date-scoped quotation reference numbers of the form
 * QUO{DDMMYY}{sequence}, e.g. QUO030826101.
 *
 * Must be called with the same transaction the Quotation row will be
 * created/checked in, so the row lock actually prevents duplicate numbers
 * under concurrent requests.
 */
@Injectable()
export class QuotationNumberService {
  private readonly MAX_ATTEMPTS = 15;

  constructor(
    @InjectModel(Quotation)
    private readonly quotationModel: typeof Quotation,
  ) {}

  async generate(transaction: Transaction): Promise<string> {
    const today = moment();
    const prefixDate = today.format('DDMMYY');
    const fullPrefix = `QUO${prefixDate}`;
    const todayStart = today.clone().startOf('day').toDate();
    const todayEnd = today.clone().endOf('day').toDate();

    let attempt = 0;

    while (attempt < this.MAX_ATTEMPTS) {
      attempt++;

      const last = await this.quotationModel.findOne({
        where: {
          reference_number: { [Op.like]: `${fullPrefix}%` },
          createdAt: { [Op.between]: [todayStart, todayEnd] },
        },
        attributes: ['reference_number'],
        order: [['reference_number', 'DESC']],
        limit: 1,
        transaction,
        lock: transaction.LOCK.UPDATE,
      });

      let nextSeq = 101;
      if (last) {
        const seqStr = last.reference_number.slice(fullPrefix.length);
        const parsed = parseInt(seqStr, 10);
        if (!isNaN(parsed) && parsed >= 100) {
          nextSeq = parsed + 1;
        }
      }

      const candidate = `${fullPrefix}${nextSeq}`;
      const exists = await this.quotationModel.findOne({
        where: { reference_number: candidate },
        transaction,
      });

      if (!exists) return candidate;
    }

    throw new InternalServerErrorException(
      `Could not generate unique quotation number after ${this.MAX_ATTEMPTS} attempts`,
    );
  }
}
