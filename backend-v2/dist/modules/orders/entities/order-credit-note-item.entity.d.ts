import { Model } from 'sequelize-typescript';
import { OrderCreditNote } from './order-credit-note.entity';
import { Order } from './order.entity';
import { Product } from '../../products/entities/product.entity';
export declare class OrderCreditNoteItem extends Model<OrderCreditNoteItem> {
    id: string;
    creditNoteId: string;
    orderId: string;
    productId: string;
    productCode: string;
    name: string;
    quantity: number;
    price: number;
    discount: number;
    discountType: string;
    tax: number;
    total: number;
    reason: string;
    creditNote: OrderCreditNote;
    order: Order;
    product: Product;
}
