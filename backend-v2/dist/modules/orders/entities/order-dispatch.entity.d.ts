import { Model } from 'sequelize-typescript';
import { Order } from './order.entity';
import { User } from '../../users/entities/user.entity';
export declare class OrderDispatch extends Model<OrderDispatch> {
    id: string;
    orderId: string;
    orderNo: string;
    dispatchNumber: string;
    items: Record<string, any>[];
    dispatchDate: Date;
    courierName: string;
    trackingNumber: string;
    documentLink: string;
    status: string;
    remarks: string;
    createdBy: string;
    order: Order;
    creator: User;
}
