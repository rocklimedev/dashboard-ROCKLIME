import { Model } from 'sequelize-typescript';
import { Order } from './order.entity';
import { User } from '../../users/entities/user.entity';
import { OrderCreditNoteItem } from './order-credit-note-item.entity';
export declare class OrderCreditNote extends Model<OrderCreditNote> {
    id: string;
    orderId: string;
    orderNo: string;
    creditNoteNumber: string;
    creditNoteLink: string;
    creditNoteDate: Date;
    totalQuantity: number;
    totalAmount: number;
    reason: string;
    remarks: string;
    status: string;
    createdBy: string;
    order: Order;
    creator: User;
    items: OrderCreditNoteItem[];
}
