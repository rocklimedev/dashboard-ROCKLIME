// src/brands/brands.service.ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Brand } from './entities/brand.entity';
import { Product } from '../products/entities/product.entity'; // adjust path if needed
import { CreateBrandDto } from './dto/create-brand.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';
import { NotificationsService } from 'src/notification/notification.service';
const ADMIN_USER_ID = '2ef0f07a-a275-4fe1-832d-fe9a5d145f60'; // Move to config/env in production

@Injectable()
export class BrandsService {
  constructor(
    @InjectRepository(Brand)
    private readonly brandRepository: Repository<Brand>,

    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,

    private readonly notificationService: NotificationsService,
  ) {}

  // Get total products of a brand
  async getTotalProductOfBrand(brandId: string): Promise<{ brandId: string; totalProducts: number }> {
    const totalProducts = await this.productRepository.count({
      where: { brandId },
    });

    return { brandId, totalProducts };
  }

  // Create Brand
  async create(createBrandDto: CreateBrandDto): Promise<Brand> {
    const { brandName, brandSlug } = createBrandDto;

    // Optional: Check if brand already exists (unique constraint will also catch it)
    const existing = await this.brandRepository.findOne({
      where: [{ brandName }, { brandSlug }],
    });
    if (existing) {
      throw new BadRequestException('Brand with this name or slug already exists');
    }

    const brand = this.brandRepository.create({
      brandName,
      brandSlug,
    });

    const savedBrand = await this.brandRepository.save(brand);

    // Send notification to admin
    await this.notificationService.sendNotification({
      userId: ADMIN_USER_ID,
      title: 'New Brand Created',
      message: `A new brand "${brandName}" with slug "${brandSlug}" has been created.`,
    });

    return savedBrand;
  }

  // Get all brands
  async findAll(): Promise<Brand[]> {
    return this.brandRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  // Get brand by ID
  async findOne(id: string): Promise<Brand> {
    const brand = await this.brandRepository.findOneBy({ id });
    if (!brand) {
      throw new NotFoundException('Brand not found');
    }
    return brand;
  }

  // Update brand
  async update(id: string, updateBrandDto: UpdateBrandDto): Promise<Brand> {
    const brand = await this.findOne(id); // will throw if not found

    const { brandName, brandSlug } = updateBrandDto;

    // Optional: Check uniqueness if changing name/slug
    if (brandName || brandSlug) {
      const existing = await this.brandRepository.findOne({
        where: [
          { brandName: brandName || brand.brandName, id: Not(id) },
          { brandSlug: brandSlug || brand.brandSlug, id: Not(id) },
        ],
      });
      if (existing) {
        throw new BadRequestException('Brand with this name or slug already exists');
      }
    }

    Object.assign(brand, {
      brandName: brandName ?? brand.brandName,
      brandSlug: brandSlug ?? brand.brandSlug,
    });

    const updatedBrand = await this.brandRepository.save(brand);

    // Send notification
    await this.notificationService.sendNotification({
      userId: ADMIN_USER_ID,
      title: 'Brand Updated',
      message: `The brand "${updatedBrand.brandName}" with slug "${updatedBrand.brandSlug}" has been updated.`,
    });

    return updatedBrand;
  }

  // Delete brand
  async remove(id: string): Promise<void> {
    const brand = await this.findOne(id);

    // Send notification before deletion
    await this.notificationService.sendNotification({
      userId: ADMIN_USER_ID,
      title: 'Brand Deleted',
      message: `The brand "${brand.brandName}" with slug "${brand.brandSlug}" has been deleted.`,
    });

    await this.brandRepository.remove(brand);
  }
}