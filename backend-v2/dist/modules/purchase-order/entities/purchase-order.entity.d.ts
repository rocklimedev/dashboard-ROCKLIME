import { Model } from 'sequelize-typescript';
import { Vendor } from '../../vendors/entities/vendor.entity';
import { User } from '../../users/entities/user.entity';
import { FieldGuidedSheet } from './fgs.entity';
export declare const PO_STATUSES: readonly ["pending", "in_negotiation", "confirmed", "partial_delivered", "delivered", "cancelled"];
export declare class PurchaseOrder extends Model<PurchaseOrder> {
    id: string;
    poNumber: string;
    vendorId: string;
    userId: string;
    fgsId: string;
    status: string;
    orderDate: Date;
    expectDeliveryDate: Date;
    totalAmount: number;
    mongoItemsId: string;
    vendor: Vendor;
    fgs: FieldGuidedSheet;
    createdBy: User;
}
