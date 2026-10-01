import { Address } from './entities/address.entity';
import { CreateAddressDto, UpdateAddressDto } from './dto/address.dto';
import { ActivityLogService } from '../engagement/activity-log.service';
interface RequestContext {
    ip?: string;
    headers?: Record<string, any>;
}
export declare class AddressService {
    private readonly addressModel;
    private readonly activityLog;
    constructor(addressModel: typeof Address, activityLog: ActivityLogService);
    create(dto: CreateAddressDto, actorId?: string, req?: RequestContext): Promise<Address>;
    findAll(): Promise<Address[]>;
    findOne(addressId: string): Promise<Address>;
    findByUser(userId: string): Promise<Address[]>;
    findByCustomer(customerId: string): Promise<Address[]>;
    update(addressId: string, dto: UpdateAddressDto, actorId?: string, req?: RequestContext): Promise<Address>;
    remove(addressId: string, actorId?: string, req?: RequestContext): Promise<{
        message: string;
    }>;
}
export {};
