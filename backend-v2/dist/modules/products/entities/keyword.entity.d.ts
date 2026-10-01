import { Model } from 'sequelize-typescript';
import { Product } from './product.entity';
export declare class Keyword extends Model<Keyword> {
    id: string;
    keyword: string;
    type: string;
    categoryId: string;
    products: Product[];
}
