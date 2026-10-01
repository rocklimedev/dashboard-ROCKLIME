import { Transaction } from 'sequelize';
import { Quotation } from '../entities/quotation.entity';
export declare class QuotationNumberService {
    private readonly quotationModel;
    constructor(quotationModel: typeof Quotation);
    generateQuotationNumber(t: Transaction): Promise<string>;
}
