import { Model } from 'sequelize-typescript';
import { Product } from './product.entity';
import { User } from '../../users/entities/user.entity';
export declare class InventoryHistory extends Model<InventoryHistory> {
    id: string;
    productId: string;
    change: number;
    quantityAfter: number;
    action: string;
    orderNo: string;
    userId: string;
    message: string;
    product: Product;
    user: User;
    static assignId(instance: InventoryHistory): void;
    static assignIds(instances: InventoryHistory[]): void;
}
