import { Model } from 'sequelize-typescript';
export declare class ProductMeta extends Model<ProductMeta> {
    id: string;
    title: string;
    slug: string;
    fieldType: string;
    unit: string;
    createdAt: Date;
}
