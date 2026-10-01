import { Model } from 'sequelize-typescript';
import { Product } from './product.entity';
import { Keyword } from './keyword.entity';
export declare class ProductKeyword extends Model<ProductKeyword> {
    productId: string;
    keywordId: string;
    product: Product;
    keyword: Keyword;
}
