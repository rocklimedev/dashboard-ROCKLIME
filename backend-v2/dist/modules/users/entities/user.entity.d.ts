import { Model } from 'sequelize-typescript';
import { Role } from '../../rbac/entities/role.entity';
import { Address } from '../../address/entities/address.entity';
export declare const ROLES: {
    readonly Admin: "ADMIN";
    readonly SuperAdmin: "SUPER_ADMIN";
    readonly Accounts: "ACCOUNTS";
    readonly Developer: "DEVELOPER";
    readonly Users: "USERS";
    readonly Sales: "SALES";
};
export declare class User extends Model<User> {
    userId: string;
    username: string;
    name: string;
    email: string;
    mobileNumber: string;
    dateOfBirth: string;
    shiftFrom: string;
    shiftTo: string;
    bloodGroup: string;
    addressId: string;
    emergencyNumber: string;
    roleId: string;
    roles: string[];
    isEmailVerified: boolean;
    photo_thumbnail: string;
    photo_original: string;
    status: string;
    password: string;
    role: Role;
    address: Address;
    static ROLES: {
        readonly Admin: "ADMIN";
        readonly SuperAdmin: "SUPER_ADMIN";
        readonly Accounts: "ACCOUNTS";
        readonly Developer: "DEVELOPER";
        readonly Users: "USERS";
        readonly Sales: "SALES";
    };
    static assertSingleSuperAdmin(instance: User): Promise<void>;
}
