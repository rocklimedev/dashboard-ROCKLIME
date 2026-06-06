// src/modules/brands/services/brand.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Brand } from '../entities/brand.entity';
import { Product } from '@/modules/products/entities/product.entity';
import { NotificationService } from '@/modules/notifications/services/notification.service';
import { ActivityLoggerService } from '@/common/services/activity-logger.service';
import { CreateBrandDto, UpdateBrandDto } from '../dto';
import { Op } from 'sequelize';

const ADMIN_USER_ID = '2ef0f07a-a275-4fe1-832d-fe9a5d145f60';

@Injectable()
export class BrandService {
  constructor(
    @InjectModel(Brand) private readonly brandModel: typeof Brand,
    @InjectModel(Product) private readonly productModel: typeof Product,
    private readonly notificationService: NotificationService,
    private readonly activityLogger: ActivityLoggerService,
  ) {}

  async createBrand(dto: CreateBrandDto, reqUser: any) {
    const { brandName, brandSlug, logo } = dto;

    // Check for duplicate slug or name
    const existing = await this.brandModel.findOne({
      where: { [Op.or]: [{ brandSlug }, { brandName }] },
    });

    if (existing) {
      throw new ConflictException(
        'Brand with this name or slug already exists',
      );
    }

    const brand = await this.brandModel.create({
      brandName,
      brandSlug,
      logo: logo || null,
    });

    // Activity Log
    this.activityLogger
      .log({
        userId: reqUser?.userId || null,
        contextTag: 'CATALOG',
        subContext: 'BRAND',
        action: 'BRAND_CREATED',
        entityId: brand.brandId,
        entityName: brand.brandName,
        description: `Brand "${brand.brandName}" was created`,
        newValues: brand.get({ plain: true }),
        metadata: { createdBy: reqUser?.userId },
        req,
      })
      .catch(console.error);

    // Notification to Admin
    await this.notificationService.send({
      userId: ADMIN_USER_ID,
      title: 'New Brand Created',
      message: `A new brand "${brandName}" with slug "${brandSlug}" has been created.`,
    });

    return brand;
  }

  async getTotalProductsOfBrand(brandId: string) {
    const totalProducts = await this.productModel.count({ where: { brandId } });
    return { brandId, totalProducts };
  }

  async findAll() {
    return this.brandModel.findAll({
      order: [['brandName', 'ASC']],
    });
  }

  async findOne(id: string) {
    const brand = await this.brandModel.findByPk(id);
    if (!brand) throw new NotFoundException('Brand not found');
    return brand;
  }

  async updateBrand(id: string, dto: UpdateBrandDto, reqUser: any) {
    const brand = await this.brandModel.findByPk(id);
    if (!brand) throw new NotFoundException('Brand not found');

    const oldValues = {
      brandName: brand.brandName,
      brandSlug: brand.brandSlug,
      logo: brand.logo,
    };

    const updateData: any = {};
    if (dto.brandName !== undefined) updateData.brandName = dto.brandName;
    if (dto.brandSlug !== undefined) updateData.brandSlug = dto.brandSlug;
    if (dto.logo !== undefined) updateData.logo = dto.logo;

    await brand.update(updateData);

    // Activity Log
    this.activityLogger
      .log({
        userId: reqUser?.userId,
        contextTag: 'CATALOG',
        subContext: 'BRAND',
        action: 'BRAND_UPDATED',
        entityId: brand.brandId,
        entityName: brand.brandName,
        description: `Brand "${brand.brandName}" was updated`,
        oldValues,
        newValues: brand.get({ plain: true }),
        metadata: { updatedBy: reqUser?.userId },
        req,
      })
      .catch(console.error);

    await this.notificationService.send({
      userId: ADMIN_USER_ID,
      title: 'Brand Updated',
      message: `The brand "${brand.brandName}" has been updated.`,
    });

    return brand;
  }

  async deleteBrand(id: string, reqUser: any) {
    const brand = await this.brandModel.findByPk(id);
    if (!brand) throw new NotFoundException('Brand not found');

    await this.notificationService.send({
      userId: ADMIN_USER_ID,
      title: 'Brand Deleted',
      message: `The brand "${brand.brandName}" with slug "${brand.brandSlug}" has been deleted.`,
    });

    this.activityLogger
      .log({
        userId: reqUser?.userId,
        contextTag: 'CATALOG',
        subContext: 'BRAND',
        action: 'BRAND_DELETED',
        entityId: brand.brandId,
        entityName: brand.brandName,
        description: `Brand "${brand.brandName}" was deleted`,
        oldValues: brand.get({ plain: true }),
        metadata: { deletedBy: reqUser?.userId },
        req,
      })
      .catch(console.error);

    await brand.destroy();
  }
}
