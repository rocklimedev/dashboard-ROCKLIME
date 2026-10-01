import { Injectable, Logger } from '@nestjs/common';
import { InjectModel as InjectSequelizeModel } from '@nestjs/sequelize';
import { InjectModel as InjectMongoModel } from '@nestjs/mongoose';
import { Model as MongoModel } from 'mongoose';
import { Transaction } from 'sequelize';
import { Quotation } from '../entities/quotation.entity';
import { QuotationVersion } from '../schemas/quotation-version.schema';
import { QuotationItem } from '../schemas/quotation-item.schema';

@Injectable()
export class VersioningService {
  private readonly logger = new Logger('QuotationVersioning');

  constructor(
    @InjectSequelizeModel(Quotation) private readonly quotationModel: typeof Quotation,
    @InjectMongoModel(QuotationVersion.name)
    private readonly quotationVersionModel: MongoModel<QuotationVersion>,
    @InjectMongoModel(QuotationItem.name)
    private readonly quotationItemModel: MongoModel<QuotationItem>,
  ) {}

  /**
   * Create a new version snapshot before update. Non-fatal - errors are
   * logged but do not abort the main flow, matching the legacy behaviour.
   */
  async createVersionSnapshot(id: string, userId: string | undefined, transaction: Transaction) {
    let newVersionNumber = 1;
    try {
      const latest = await this.quotationVersionModel
        .findOne({ quotationId: id })
        .sort({ version: -1 })
        .lean();

      if (latest) newVersionNumber = (latest as any).version + 1;

      const currentMongoItems = await this.quotationItemModel.findOne({ quotationId: id }).lean();

      const rawQuotation: any = await this.quotationModel.findOne({
        where: { quotationId: id },
        attributes: [
          'quotationId',
          'reference_number',
          'customerId',
          'products',
          'floors',
          'totalFloors',
          'extraDiscount',
          'extraDiscountType',
          'discountAmount',
          'shippingAmount',
          'gst',
          'gstAmount',
          'roundOff',
          'finalAmount',
          'followupDates',
          'createdAt',
          'updatedAt',
        ],
        raw: true,
        transaction,
      });

      const safeData = {
        ...rawQuotation,
        createdAt: rawQuotation?.createdAt ? new Date(rawQuotation.createdAt).toISOString() : null,
        updatedAt: rawQuotation?.updatedAt ? new Date(rawQuotation.updatedAt).toISOString() : null,
      };

      await this.quotationVersionModel.create({
        quotationId: id,
        version: newVersionNumber,
        quotationData: safeData,
        quotationItems: (currentMongoItems as any)?.items || [],
        floors: safeData.floors || [],
        totalFloors: safeData.totalFloors || 0,
        updatedBy: userId,
        updatedAt: new Date(),
      } as any);
    } catch (err) {
      this.logger.error('Versioning failed:', err as any);
      // non-fatal
    }

    return newVersionNumber;
  }
}
