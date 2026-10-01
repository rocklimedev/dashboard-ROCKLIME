import { Model } from 'sequelize-typescript';
import { Product } from '../../products/entities/product.entity';
export declare class Vendor extends Model<Vendor> {
    id: string;
    vendorId: string;
    vendorName: string;
    brandId: string;
    brandSlug: string;
    products: Product[];
}
