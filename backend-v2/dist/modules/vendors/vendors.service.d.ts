import { Vendor } from './entities/vendor.entity';
import { ActivityLogService } from '../engagement/activity-log.service';
import { CreateVendorDto, UpdateVendorDto } from './dto/vendor.dto';
export declare class VendorsService {
    private readonly vendorModel;
    private readonly activityLog;
    constructor(vendorModel: typeof Vendor, activityLog: ActivityLogService);
    create(dto: CreateVendorDto, userId?: string): Promise<Vendor>;
    findAll(): Promise<Vendor[]>;
    findOne(id: string): Promise<Vendor>;
    update(id: string, dto: UpdateVendorDto, userId?: string): Promise<{
        message: string;
        vendor: Vendor;
    }>;
    remove(id: string, userId?: string): Promise<{
        message: string;
    }>;
    checkVendorId(vendorId: string): Promise<{
        isUnique: boolean;
    }>;
}
