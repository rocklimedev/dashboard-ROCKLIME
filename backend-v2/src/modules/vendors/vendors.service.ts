import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Vendor } from './entities/vendor.entity';
import { ActivityLogService } from '../engagement/activity-log.service';
import { CONTEXT_TAGS, SUB_CONTEXTS } from '../engagement/entities/activity-log.entity';
import { CreateVendorDto, UpdateVendorDto } from './dto/vendor.dto';

@Injectable()
export class VendorsService {
  constructor(
    @InjectModel(Vendor) private readonly vendorModel: typeof Vendor,
    private readonly activityLog: ActivityLogService,
  ) {}

  async create(dto: CreateVendorDto, userId?: string) {
    const vendor = await this.vendorModel.create({
      vendorId: dto.vendorId?.trim() || null,
      vendorName: dto.vendorName,
      brandSlug: dto.brandSlug,
      brandId: dto.brandId,
    } as any);

    this.activityLog
      .logActivity({
        userId: userId ?? null,
        contextTag: CONTEXT_TAGS.PROCUREMENT,
        subContext: SUB_CONTEXTS.VENDOR,
        action: 'CREATE_VENDOR',
        entityId: vendor.vendorId,
        entityName: vendor.vendorName,
        description: `Vendor "${vendor.vendorName}" created`,
        metadata: {
          vendorId: vendor.vendorId,
          vendorName: vendor.vendorName,
          brandId: vendor.brandId || null,
          brandSlug: vendor.brandSlug || null,
          createdVia: 'ADMIN_PANEL',
        },
      })
      .catch(() => {});

    return vendor;
  }

  findAll() {
    return this.vendorModel.findAll();
  }

  async findOne(id: string) {
    const vendor = await this.vendorModel.findByPk(id);
    if (!vendor) throw new NotFoundException('Vendor not found');
    return vendor;
  }

  async update(id: string, dto: UpdateVendorDto, userId?: string) {
    const vendor = await this.vendorModel.findByPk(id);
    if (!vendor) throw new NotFoundException('Vendor not found');

    const oldValues = {
      vendorId: vendor.vendorId,
      vendorName: vendor.vendorName,
      brandSlug: vendor.brandSlug,
      brandId: vendor.brandId,
    };

    await vendor.update({
      vendorId: dto.vendorId?.trim() || null,
      vendorName: dto.vendorName,
      brandSlug: dto.brandSlug,
      brandId: dto.brandId,
    } as any);

    this.activityLog
      .logActivity({
        userId: userId ?? null,
        contextTag: CONTEXT_TAGS.PROCUREMENT,
        subContext: SUB_CONTEXTS.VENDOR,
        action: 'UPDATE_VENDOR',
        entityId: vendor.id,
        entityName: vendor.vendorName,
        description: `Vendor "${vendor.vendorName}" updated`,
        oldValues,
        newValues: {
          vendorId: vendor.vendorId,
          vendorName: vendor.vendorName,
          brandSlug: vendor.brandSlug,
          brandId: vendor.brandId,
        },
        metadata: { changedFields: Object.keys(dto), vendorId: vendor.id },
      })
      .catch(() => {});

    return { message: 'Vendor updated successfully.', vendor };
  }

  async remove(id: string, userId?: string) {
    const vendor = await this.vendorModel.findByPk(id);
    if (!vendor) throw new NotFoundException('Vendor not found');

    await vendor.destroy();

    this.activityLog
      .logActivity({
        userId: userId ?? null,
        contextTag: CONTEXT_TAGS.PROCUREMENT,
        subContext: SUB_CONTEXTS.VENDOR,
        action: 'DELETE_VENDOR',
        entityId: vendor.id,
        entityName: vendor.vendorName,
        description: `Vendor "${vendor.vendorName}" deleted`,
        oldValues: { vendorId: vendor.id, vendorName: vendor.vendorName },
        metadata: {
          deletionType: 'HARD_DELETE',
          warning: 'Vendor removed permanently from system',
        },
      })
      .catch(() => {});

    return { message: 'Vendor deleted successfully' };
  }

  async checkVendorId(vendorId: string) {
    if (!vendorId || vendorId.trim() === '') return { isUnique: true };
    const vendor = await this.vendorModel.findOne({ where: { vendorId } });
    return { isUnique: !vendor };
  }
}
