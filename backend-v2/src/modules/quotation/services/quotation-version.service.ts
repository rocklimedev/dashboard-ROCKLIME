import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { InjectModel as InjectMongooseModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Transaction } from 'sequelize';
import { Quotation } from '@/modules/quotation/models/quotation.model'; // adjust to your actual model path
import { QuotationItem } from '@/modules/quotation/models/quotation-item.model'; // adjust: Mongoose schema
import { QuotationVersion } from '@/modules/quotation/models/quotation-version.model'; // adjust: Mongoose schema

@Injectable()
export class QuotationVersionService {
  constructor(
    @InjectModel(Quotation)
    private readonly quotationModel: typeof Quotation,
    @InjectMongooseModel(QuotationItem.name)
    private readonly quotationItemModel: Model<QuotationItem>,
    @InjectMongooseModel(QuotationVersion.name)
    private readonly quotationVersionModel: Model<QuotationVersion>,
  ) {}

  /**
   * Snapshots the current state of a quotation (PG row + Mongo items) into
   * a new version document, before an update is applied. Non-fatal by
   * design: the caller should swallow errors from this so a versioning
   * hiccup never blocks the underlying update.
   */
  async snapshotBeforeUpdate(
    quotationId: string,
    updatedBy: string | undefined,
    transaction: Transaction,
  ): Promise<number> {
    const latest = await this.quotationVersionModel
      .findOne({ quotationId })
      .sort({ version: -1 })
      .lean();

    const newVersionNumber = latest ? latest.version + 1 : 1;

    const currentMongoItems = await this.quotationItemModel
      .findOne({ quotationId })
      .lean();

    const rawQuotation = await this.quotationModel.findOne({
      where: { quotationId },
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
      createdAt: rawQuotation?.createdAt
        ? new Date(rawQuotation.createdAt).toISOString()
        : null,
      updatedAt: rawQuotation?.updatedAt
        ? new Date(rawQuotation.updatedAt).toISOString()
        : null,
    };

    await this.quotationVersionModel.create({
      quotationId,
      version: newVersionNumber,
      quotationData: safeData,
      quotationItems: currentMongoItems?.items || [],
      floors: safeData.floors || [],
      totalFloors: safeData.totalFloors || 0,
      updatedBy,
      updatedAt: new Date(),
    });

    return newVersionNumber;
  }

  async listVersions(quotationId: string) {
    const versions = await this.quotationVersionModel
      .find({ quotationId })
      .sort({ version: -1 })
      .lean();

    if (!versions || versions.length === 0) {
      throw new NotFoundException('No versions found');
    }

    return versions.map((v) => ({
      version: v.version,
      updatedBy: v.updatedBy || 'Unknown',
      updatedAt: v.updatedAt,
      finalAmount: v.quotationData?.finalAmount || 0,
      document_title: v.quotationData?.document_title || 'Untitled Quotation',
      customerId: v.quotationData?.customerId,
      quotation_date: v.quotationData?.quotation_date,
      itemCount: (v.quotationItems || []).length,
      quotationData: v.quotationData,
      quotationItems: v.quotationItems || [],
    }));
  }

  async getVersion(quotationId: string, version: number) {
    const versionData = await this.quotationVersionModel.findOne({
      quotationId,
      version,
    });
    if (!versionData) {
      throw new NotFoundException('Version not found');
    }
    return versionData;
  }

  async restoreVersion(
    quotationId: string,
    version: number,
    transaction: Transaction,
  ): Promise<void> {
    const versionData = await this.getVersion(quotationId, version);

    await this.quotationModel.update(
      {
        ...versionData.quotationData,
        floors: versionData.floors || [],
        totalFloors: versionData.totalFloors || 0,
      },
      { where: { quotationId }, transaction },
    );

    if (versionData.quotationItems?.length > 0) {
      await this.quotationItemModel.updateOne(
        { quotationId },
        { $set: { items: versionData.quotationItems } },
        { upsert: true },
      );
    } else {
      await this.quotationItemModel.deleteOne({ quotationId });
    }
  }
}
