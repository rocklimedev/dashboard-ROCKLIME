import { Model } from 'sequelize-typescript';
import { Order } from './order.entity';
import { User } from '../../users/entities/user.entity';
export declare class OrderActivity extends Model<OrderActivity> {
    id: string;
    orderId: string;
    orderNo: string;
    action: string;
    description: string;
    oldValue: Record<string, any>;
    newValue: Record<string, any>;
    performedBy: string;
    metadata: Record<string, any>;
    ipAddress: string;
    order: Order;
    performedByUser: User;
}
