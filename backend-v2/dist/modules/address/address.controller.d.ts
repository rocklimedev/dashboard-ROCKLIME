import { Request } from 'express';
import { AddressService } from './address.service';
import { CreateAddressDto, UpdateAddressDto } from './dto/address.dto';
export declare class AddressController {
    private readonly addressService;
    constructor(addressService: AddressService);
    create(dto: CreateAddressDto, actorId: string, req: Request): Promise<import("./entities/address.entity").Address>;
    findAll(): Promise<import("./entities/address.entity").Address[]>;
    findByUser(userId: string): Promise<import("./entities/address.entity").Address[]>;
    findByCustomer(customerId: string): Promise<import("./entities/address.entity").Address[]>;
    findOne(addressId: string): Promise<import("./entities/address.entity").Address>;
    update(addressId: string, dto: UpdateAddressDto, actorId: string, req: Request): Promise<import("./entities/address.entity").Address>;
    remove(addressId: string, actorId: string, req: Request): Promise<{
        message: string;
    }>;
}
