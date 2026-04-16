// src/vendors/vendors.service.ts
import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Vendor } from './entities/vendor.entity';
import { Brand } from '../brands/entities/brand.entity';
import { CreateVendorDto } from './dto/create-vendor.dto';
import { UpdateVendorDto } from './dto/update-vendor.dto';

@Injectable()
export class VendorsService {
  constructor(
    @InjectRepository(Vendor)
    private vendorRepository: Repository<Vendor>,

    @InjectRepository(Brand)
    private brandRepository: Repository<Brand>,
  ) {}

  async create(dto: CreateVendorDto) {
    // Normalize vendorId: empty string → null
    const safeVendorId = dto.vendorId?.trim() || null;

    // Check uniqueness of vendorId (if provided)
    if (safeVendorId) {
      const existing = await this.vendorRepository.findOneBy({ vendorId: safeVendorId });
      if (existing) throw new ConflictException('vendorId already exists');
    }

    // Validate brand if provided
    if (dto.brandId) {
      const brand = await this.brandRepository.findOneBy({ id: dto.brandId });
      if (!brand) throw new BadRequestException('Invalid brandId');
    }

    const vendor = this.vendorRepository.create({
      vendorId: safeVendorId,
      vendorName: dto.vendorName,
      brandId: dto.brandId || null,
      brandSlug: dto.brandSlug || null,
    });

    return this.vendorRepository.save(vendor);
  }

  async findAll() {
    return this.vendorRepository.find({
      relations: ['brand'],
      order: { vendorName: 'ASC' },
    });
  }

  async findOne(id: string) {
    const vendor = await this.vendorRepository.findOne({
      where: { id },
      relations: ['brand'],
    });
    if (!vendor) throw new NotFoundException('Vendor not found');
    return vendor;
  }

  async update(id: string, dto: UpdateVendorDto) {
    const vendor = await this.findOne(id);

    const safeVendorId = dto.vendorId?.trim() || null;

    // Check uniqueness if vendorId is being changed
    if (safeVendorId && safeVendorId !== vendor.vendorId) {
      const existing = await this.vendorRepository.findOneBy({ vendorId: safeVendorId });
      if (existing) throw new ConflictException('vendorId already exists');
    }

    if (dto.brandId) {
      const brand = await this.brandRepository.findOneBy({ id: dto.brandId });
      if (!brand) throw new BadRequestException('Invalid brandId');
    }

    Object.assign(vendor, {
      vendorId: safeVendorId,
      vendorName: dto.vendorName ?? vendor.vendorName,
      brandId: dto.brandId ?? vendor.brandId,
      brandSlug: dto.brandSlug ?? vendor.brandSlug,
    });

    return this.vendorRepository.save(vendor);
  }

  async remove(id: string) {
    const vendor = await this.findOne(id);
    await this.vendorRepository.remove(vendor);
    return { message: 'Vendor deleted successfully' };
  }

  async checkVendorIdUniqueness(vendorId: string) {
    if (!vendorId || vendorId.trim() === '') {
      return { isUnique: true };
    }

    const existing = await this.vendorRepository.findOneBy({ vendorId: vendorId.trim() });
    return { isUnique: !existing };
  }
}