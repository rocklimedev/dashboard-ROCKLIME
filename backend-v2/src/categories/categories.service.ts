// src/categories/categories.service.ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Category } from './entities/category.entity';
import { ParentCategory } from './entities/parent-category.entity';
import { Brand } from '../brands/entities/brand.entity';
import { BrandParentCategory } from 'src/brands/entities/brand-parent-category.entity';
import { Keyword } from './entities/keywords.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import slugify from 'slugify';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private categoryRepo: Repository<Category>,

    @InjectRepository(ParentCategory)
    private parentCategoryRepo: Repository<ParentCategory>,

    @InjectRepository(Brand)
    private brandRepo: Repository<Brand>,

    @InjectRepository(BrandParentCategory)
    private brandParentCategoryRepo: Repository<BrandParentCategory>,

    @InjectRepository(Keyword)
    private keywordRepo: Repository<Keyword>,

    private dataSource: DataSource,
  ) {}

  async create(dto: CreateCategoryDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const { name, brandId, parentCategoryId, keywords = [] } = dto;

      // Validate Brand and ParentCategory
      const [brand, parent] = await Promise.all([
        this.brandRepo.findOneBy({ id: brandId }),
        this.parentCategoryRepo.findOneBy({ id: parentCategoryId }),
      ]);

      if (!brand) throw new BadRequestException('Invalid brandId');
      if (!parent) throw new BadRequestException('Invalid parentCategoryId');

      // Ensure Brand-ParentCategory link exists
      await this.brandParentCategoryRepo.findOrCreate({
        where: { brandId, parentCategoryId: parentCategoryId }, // adjust field names if needed
        defaults: { brandId, parentCategoryId: parentCategoryId },
      });

      const slug = slugify(name, { lower: true, strict: true });

      const category = this.categoryRepo.create({
        name,
        slug,
        brandId,
        parentCategoryId,
      });

      const savedCategory = await queryRunner.manager.save(category);

      // Handle keywords
      if (Array.isArray(keywords) && keywords.length) {
        const cleanKeywords = [...new Set(
          keywords.map(String).map(k => k.trim()).filter(Boolean)
        )];

        for (const kw of cleanKeywords) {
          await queryRunner.manager.save(
            this.keywordRepo.create({ keyword: kw, categoryId: savedCategory.categoryId })
          );
        }
      }

      await queryRunner.commitTransaction();

      // Return with relations
      return this.categoryRepo.findOne({
        where: { categoryId: savedCategory.categoryId },
        relations: ['parentCategory', 'brand', 'keywords'],
        select: {
          parentCategory: { id: true, name: true, slug: true },
          brand: { id: true, brandName: true, brandSlug: true },
        },
      });
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async findAll() {
    return this.categoryRepo.find({
      relations: ['parentCategory', 'brand', 'keywords'],
      order: {
        name: 'ASC',
        keywords: { keyword: 'ASC' },
      },
      select: {
        parentCategory: { id: true, name: true, slug: true },
        brand: { id: true, brandName: true, brandSlug: true },
      },
    });
  }

  async findOne(categoryId: string) {
    const category = await this.categoryRepo.findOne({
      where: { categoryId },
      relations: ['parentCategory', 'brand', 'keywords'],
      select: {
        parentCategory: { id: true, name: true, slug: true },
        brand: { id: true, brandName: true, brandSlug: true },
      },
    });

    if (!category) throw new NotFoundException('Category not found');
    return category;
  }

  async update(categoryId: string, dto: UpdateCategoryDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      let category = await this.categoryRepo.findOneBy({ categoryId });
      if (!category) throw new NotFoundException('Category not found');

      const { name, brandId, parentCategoryId, keywords } = dto;

      if (brandId) {
        const brand = await this.brandRepo.findOneBy({ id: brandId });
        if (!brand) throw new BadRequestException('Invalid brandId');
        category.brandId = brandId;
      }

      if (parentCategoryId) {
        const parent = await this.parentCategoryRepo.findOneBy({ id: parentCategoryId });
        if (!parent) throw new BadRequestException('Invalid parentCategoryId');

        await this.brandParentCategoryRepo.findOrCreate({
          where: { brandId: category.brandId, parentCategoryId },
          defaults: { brandId: category.brandId, parentCategoryId },
        });

        category.parentCategoryId = parentCategoryId;
      }

      if (name) {
        category.name = name;
        category.slug = slugify(name, { lower: true, strict: true });
      }

      await queryRunner.manager.save(category);

      // Replace keywords if provided
      if (Array.isArray(keywords)) {
        const incoming = [...new Set(
          keywords.map(String).map(k => k.trim()).filter(Boolean)
        )];

        // Remove old keywords not in new list
        await queryRunner.manager.delete(Keyword, {
          categoryId,
          keyword: { $nin: incoming } as any,
        });

        // Add new keywords
        for (const kw of incoming) {
          const exists = await queryRunner.manager.exists(Keyword, {
            where: { categoryId, keyword: kw },
          });
          if (!exists) {
            await queryRunner.manager.save(
              this.keywordRepo.create({ keyword: kw, categoryId })
            );
          }
        }
      }

      await queryRunner.commitTransaction();

      return this.findOne(categoryId);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async remove(categoryId: string) {
    const category = await this.categoryRepo.findOneBy({ categoryId });
    if (!category) throw new NotFoundException('Category not found');

    await this.categoryRepo.remove(category);
    return { message: 'Category deleted successfully' };
  }

  async findByBrand(brandId: string) {
    if (!brandId) throw new BadRequestException('brandId is required');

    return this.categoryRepo.find({
      where: { brandId },
      relations: ['parentCategory', 'brand', 'keywords'],
      order: { name: 'ASC', keywords: { keyword: 'ASC' } },
      select: {
        parentCategory: { id: true, name: true, slug: true },
        brand: { id: true, brandName: true, brandSlug: true },
      },
    });
  }
}