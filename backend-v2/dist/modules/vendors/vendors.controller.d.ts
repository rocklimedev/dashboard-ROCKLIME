import { VendorsService } from './vendors.service';
import { CreateVendorDto, UpdateVendorDto } from './dto/vendor.dto';
export declare class VendorsController {
    private readonly vendorsService;
    constructor(vendorsService: VendorsService);
    create(dto: CreateVendorDto, userId: string): Promise<import("./entities/vendor.entity").Vendor>;
    findAll(): Promise<import("./entities/vendor.entity").Vendor[]>;
    checkVendorId(vendorId: string): Promise<{
        isUnique: boolean;
    }>;
    findOne(id: string): Promise<import("./entities/vendor.entity").Vendor>;
    update(id: string, dto: UpdateVendorDto, userId: string): Promise<{
        message: string;
        vendor: import("./entities/vendor.entity").Vendor;
    }>;
    remove(id: string, userId: string): Promise<{
        message: string;
    }>;
}
