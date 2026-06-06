// src/modules/brands/services/brand-parent-category.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { BrandParentCategory } from '../entities/brand-parent-category.entity';
import { Brand } from '../entities/brand.entity';
import { ParentCategory } from '@/modules/categories/entities/parent-category.entity';
import { NotificationService } from '@/modules/notifications/services/notification.service';
import * as slugify from 'slugify';
import {
  CreateBrandParentCategoryDto,
  UpdateBrandParentCategoryDto,
  AttachBrandsDto,
} from '../dto';
import { Sequelize } from 'sequelize-typescript';

const ADMIN_USER_ID = '2ef0f07a-a275-4fe1-832d-fe9a5d145f60';

@Injectable()
export class BrandParentCategoryService {
  constructor(
    @InjectModel(BrandParentCategory)
    private readonly bpcModel: typeof BrandParentCategory,
    @InjectModel(Brand) private readonly brandModel: typeof Brand,
    private readonly notificationService: NotificationService,
    private readonly sequelize: Sequelize,
  ) {}

  async create(dto: CreateBrandParentCategoryDto) {
    const { name } = dto;
    if (!name) throw new BadRequestException('Name is required');

    const slug = slugify.default(name, { lower: true, strict: true });

    const existing = await this.bpcModel.findOne({ where: { slug } });
    if (existing)
      throw new ConflictException(
        'BrandParentCategory with this slug already exists',
      );

    const bpc = await this.bpcModel.create({ name, slug });

    await this.notificationService.send({
      userId: ADMIN_USER_ID,
      title: 'New BrandParentCategory Created',
      message: `A new BrandParentCategory "${name}" with slug "${slug}" has been created.`,
    });

    return bpc;
  }

  async update(id: string, dto: UpdateBrandParentCategoryDto) {
    const bpc = await this.bpcModel.findByPk(id);
    if (!bpc) throw new NotFoundException('BrandParentCategory not found');

    let finalSlug = dto.slug;
    if (dto.name && !dto.slug) {
      finalSlug = slugify.default(dto.name, { lower: true, strict: true });
    }

    await bpc.update({
      name: dto.name ?? bpc.name,
      slug: finalSlug ?? bpc.slug,
    });

    await this.notificationService.send({
      userId: ADMIN_USER_ID,
      title: 'BrandParentCategory Updated',
      message: `BrandParentCategory "${bpc.name}" has been updated successfully.`,
    });

    return bpc;
  }

  async attachBrands(id: string, dto: AttachBrandsDto) {
    const bpc = await this.bpcModel.findByPk(id);
    if (!bpc) throw new NotFoundException('BrandParentCategory not found');

    const results = [];
    const attachedBrandNames: string[] = [];

    for (const brandId of dto.brandIds) {
      const brand = await this.brandModel.findByPk(brandId);
      if (!brand) {
        results.push({ brandId, status: 'skipped', reason: 'Brand not found' });
        continue;
      }

      await this.sequelize.models.BrandParentCategoryBrand.findOrCreate({
        where: { brandParentCategoryId: id, brandId },
      });

      results.push({ brandId, status: 'attached' });
      attachedBrandNames.push(brand.brandName);
    }

    if (attachedBrandNames.length > 0) {
      await this.notificationService.send({
        userId: ADMIN_USER_ID,
        title: 'Brands Attached to BrandParentCategory',
        message: `Brands [${attachedBrandNames.join(', ')}] have been attached to BrandParentCategory "${bpc.name}".`,
      });
    }

    return { success: true, results };
  }

  async detachBrand(bpcId: string, brandId: string) {
    const bpc = await this.bpcModel.findByPk(bpcId);
    const brand = await this.brandModel.findByPk(brandId);

    if (!bpc) throw new NotFoundException('BrandParentCategory not found');
    if (!brand) throw new NotFoundException('Brand not found');

    const deleted =
      await this.sequelize.models.BrandParentCategoryBrand.destroy({
        where: { brandParentCategoryId: bpcId, brandId },
      });

    if (!deleted) throw new NotFoundException('Link not found');

    await this.notificationService.send({
      userId: ADMIN_USER_ID,
      title: 'Brand Detached from BrandParentCategory',
      message: `Brand "${brand.brandName}" has been detached from BrandParentCategory "${bpc.name}".`,
    });

    return { success: true, bpcId, brandId };
  }

  async findAll() {
    return this.bpcModel.findAll({
      include: [
        {
          model: Brand,
          as: 'brands',
          attributes: ['id', 'brandName', 'brandSlug'],
        },
      ],
      order: [['name', 'ASC']],
    });
  }

  async findOne(id: string) {
    const bpc = await this.bpcModel.findByPk(id, {
      include: [
        {
          model: Brand,
          as: 'brands',
          attributes: ['id', 'brandName', 'brandSlug'],
        },
      ],
    });

    if (!bpc) throw new NotFoundException('BrandParentCategory not found');
    return bpc;
  }

  async getTree(id: string) {
    const bpc = await this.bpcModel.findByPk(id, {
      include: [
        {
          model: Brand,
          as: 'brands',
          attributes: ['id', 'brandName', 'brandSlug'],
          through: { attributes: [] },
        },
        {
          model: ParentCategory,
          as: 'parentCategories',
          attributes: ['id', 'name', 'slug'],
        },
      ],
      order: [
        [{ model: Brand, as: 'brands' }, 'brandName', 'ASC'],
        [{ model: ParentCategory, as: 'parentCategories' }, 'name', 'ASC'],
      ],
    });

    if (!bpc) throw new NotFoundException('BrandParentCategory not found');

    return {
      id: bpc.id,
      name: bpc.name,
      slug: bpc.slug,
      brands: bpc.brands || [],
      parentCategories: bpc.parentCategories || [],
    };
  }

  async remove(id: string) {
    const bpc = await this.findOne(id);

    await this.notificationService.send({
      userId: ADMIN_USER_ID,
      title: 'BrandParentCategory Deleted',
      message: `BrandParentCategory "${bpc.name}" with slug "${bpc.slug}" has been deleted.`,
    });

    await bpc.destroy();
  }
}
