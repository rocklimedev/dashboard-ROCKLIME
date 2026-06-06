import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Vendor } from './entities/vendor.entity';
import { CreateVendorDto, UpdateVendorDto } from './dto/vendor.dto';
import { LogActivityService } from '../common/services/log-activity.service'; // Adjust path

@Injectable()
export class VendorService {
  constructor(
    @InjectModel(Vendor) private vendorModel: typeof Vendor,
    private readonly logActivityService: LogActivityService,
  ) {}

  async create(createVendorDto: CreateVendorDto, req: any) {
    const safeVendorId = createVendorDto.vendorId?.trim() || null;

    const vendor = await this.vendorModel.create({
      vendorId: safeVendorId,
      vendorName: createVendorDto.vendorName,
      brandSlug: createVendorDto.brandSlug,
      brandId: createVendorDto.brandId,
    });

    await this.logActivityService.log({
      userId: req.user?.userId,
      contextTag: 'PROCUREMENT',
      subContext: 'VENDOR',
      action: 'CREATE_VENDOR',
      entityId: vendor.vendorId || vendor.id.toString(),
      entityName: vendor.vendorName,
      description: `Vendor "${vendor.vendorName}" created`,
      metadata: {
        vendorId: vendor.vendorId,
        vendorName: vendor.vendorName,
        brandId: vendor.brandId,
        brandSlug: vendor.brandSlug,
        createdVia: 'ADMIN_PANEL',
      },
      req,
    });

    return vendor;
  }

  async findAll() {
    return this.vendorModel.findAll();
  }

  async findOne(id: number) {
    const vendor = await this.vendorModel.findByPk(id);
    if (!vendor) throw new NotFoundException('Vendor not found');
    return vendor;
  }

  async update(id: number, updateVendorDto: UpdateVendorDto, req: any) {
    const vendor = await this.findOne(id);

    const oldValues = { ...vendor.get({ plain: true }) };

    await vendor.update({
      vendorId: updateVendorDto.vendorId?.trim() || null,
      vendorName: updateVendorDto.vendorName,
      brandSlug: updateVendorDto.brandSlug,
      brandId: updateVendorDto.brandId,
    });

    await this.logActivityService.log({
      userId: req.user?.userId,
      contextTag: 'PROCUREMENT',
      subContext: 'VENDOR',
      action: 'UPDATE_VENDOR',
      entityId: vendor.id,
      entityName: vendor.vendorName,
      description: `Vendor "${vendor.vendorName}" updated`,
      oldValues: {
        vendorId: oldValues.vendorId,
        vendorName: oldValues.vendorName,
        brandSlug: oldValues.brandSlug,
        brandId: oldValues.brandId,
      },
      newValues: {
        vendorId: vendor.vendorId,
        vendorName: vendor.vendorName,
        brandSlug: vendor.brandSlug,
        brandId: vendor.brandId,
      },
      metadata: {
        changedFields: Object.keys(updateVendorDto),
        vendorId: vendor.id,
      },
      req,
    });

    return vendor;
  }

  async remove(id: number, req: any) {
    const vendor = await this.findOne(id);

    await vendor.destroy();

    await this.logActivityService.log({
      userId: req.user?.userId,
      contextTag: 'PROCUREMENT',
      subContext: 'VENDOR',
      action: 'DELETE_VENDOR',
      entityId: vendor.id,
      entityName: vendor.vendorName,
      description: `Vendor "${vendor.vendorName}" deleted`,
      oldValues: {
        vendorId: vendor.id,
        vendorName: vendor.vendorName,
        brandId: vendor.brandId,
      },
      metadata: {
        deletionType: 'HARD_DELETE',
        warning: 'Vendor removed permanently from system',
      },
      req,
    });

    return { message: 'Vendor deleted successfully' };
  }

  async checkVendorId(vendorId: string) {
    if (!vendorId || vendorId.trim() === '') {
      return { isUnique: true };
    }

    const existing = await this.vendorModel.findOne({ where: { vendorId } });
    return { isUnique: !existing };
  }
}
