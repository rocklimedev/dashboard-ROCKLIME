import { Model } from 'sequelize-typescript';
import { User } from '../../users/entities/user.entity';
export declare class Address extends Model<Address> {
    addressId: string;
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    status: string;
    userId: string;
    customerId: string;
    user: User;
}
