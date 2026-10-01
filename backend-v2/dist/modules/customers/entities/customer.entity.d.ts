import { Model } from 'sequelize-typescript';
import { Address } from '../../address/entities/address.entity';
import { Vendor } from '../../vendors/entities/vendor.entity';
export declare class Customer extends Model<Customer> {
    customerId: string;
    name: string;
    email: string;
    mobileNumber: string;
    phone2: string;
    companyName: string;
    customerType: string;
    gender: string;
    address: Record<string, any>;
    isVendor: boolean;
    vendorId: string;
    gstNumber: string;
    addresses: Address[];
    vendor: Vendor;
}
