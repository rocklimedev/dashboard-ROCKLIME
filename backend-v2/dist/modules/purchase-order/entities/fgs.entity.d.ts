import { Model } from 'sequelize-typescript';
import { Vendor } from '../../vendors/entities/vendor.entity';
import { User } from '../../users/entities/user.entity';
import { PurchaseOrder } from './purchase-order.entity';
export declare const FGS_STATUSES: readonly ["draft", "negotiating", "approved", "converted", "cancelled"];
export declare class FieldGuidedSheet extends Model<FieldGuidedSheet> {
    id: string;
    fgsNumber: string;
    vendorId: string;
    userId: string;
    status: string;
    orderDate: Date;
    expectDeliveryDate: Date;
    totalAmount: number;
    mongoItemsId: string;
    vendor: Vendor;
    createdBy: User;
    purchaseOrder: PurchaseOrder;
}
