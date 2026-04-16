// src/parent-categories/parent-categories.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ParentCategory } from './entities/parent-category.entity';
import { Brand } from '../brands/entities/brand.entity';
import { Category } from '../categories/entities/category.entity';

@Injectable()
export class ParentCategoriesService {
  constructor(
    @InjectRepository(ParentCategory)
    private parentRepo: Repository<ParentCategory>,

    @InjectRepository(Brand)
    private brandRepo: Repository<Brand>,

    @InjectRepository(Category)
    private categoryRepo: Repository<Category>,
  ) {}

  async create(name: string, slug?: string) {
    const parent = this.parentRepo.create({ name, slug });
    return this.parentRepo.save(parent);
  }

  async findAll() {
    return this.parentRepo.find();
  }

  async findOne(id: string) {
    const parent = await this.parentRepo.findOneBy({ id });
    if (!parent) throw new NotFoundException('Parent category not found');
    return parent;
  }

  async update(id: string, name?: string, slug?: string) {
    const parent = await this.findOne(id);
    if (name) parent.name = name;
    if (slug) parent.slug = slug;
    return this.parentRepo.save(parent);
  }

  async remove(id: string) {
    const parent = await this.findOne(id);
    await this.parentRepo.remove(parent);
    return { message: 'Parent category deleted successfully' };
  }

  async getWithBrandsAndCounts(id: string) {
    const parent = await this.parentRepo.findOne({
      where: { id },
      relations: ['brands', 'categories'],
    });

    if (!parent) throw new NotFoundException('Parent category not found');

    return {
      id: parent.id,
      name: parent.name,
      slug: parent.slug,
      brands: parent.brands,
      categoriesCount: parent.categories?.length || 0,
    };
  }
}