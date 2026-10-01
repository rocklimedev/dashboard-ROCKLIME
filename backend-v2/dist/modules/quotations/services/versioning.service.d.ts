import { Model as MongoModel } from 'mongoose';
import { Transaction } from 'sequelize';
import { Quotation } from '../entities/quotation.entity';
import { QuotationVersion } from '../schemas/quotation-version.schema';
import { QuotationItem } from '../schemas/quotation-item.schema';
export declare class VersioningService {
    private readonly quotationModel;
    private readonly quotationVersionModel;
    private readonly quotationItemModel;
    private readonly logger;
    constructor(quotationModel: typeof Quotation, quotationVersionModel: MongoModel<QuotationVersion>, quotationItemModel: MongoModel<QuotationItem>);
    createVersionSnapshot(id: string, userId: string | undefined, transaction: Transaction): Promise<number>;
}
