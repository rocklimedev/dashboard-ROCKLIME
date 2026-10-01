import { Transaction } from 'sequelize';
import { Product } from '../../products/entities/product.entity';
export interface RawPoItemInput {
    productId: string;
    quantity: number | string;
    unitPrice?: number | string;
    mrp?: number | string;
    discount?: number | string;
    discountType?: 'percent' | 'fixed';
    tax?: number | string;
}
export declare function validateAndCalculateItems(productModel: typeof Product, items: RawPoItemInput[], transaction: Transaction): Promise<{
    totalAmount: number;
    preparedItems: any[];
}>;
export declare function generateDailyDocNumber(model: any, numberField: string, prefixLetters: string, transaction: Transaction): Promise<string>;
