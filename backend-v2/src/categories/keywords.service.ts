// src/keywords/keywords.service.ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Keyword } from './entities/keywords.entity';
import { Category } from '../categories/entities/category.entity';

@Injectable()
export class KeywordsService {
  constructor(
    @InjectRepository(Keyword)
    private keywordRepo: Repository<Keyword>,

    @InjectRepository(Category)
    private categoryRepo: Repository<Category>,
  ) {}

  async create(dto: { keyword: string; categoryId: string }) {
    const trimmed = dto.keyword?.trim();
    if (!trimmed || !dto.categoryId) {
      throw new BadRequestException('Keyword and categoryId are required');
    }

    // Check case-insensitive duplicate in same category
    const existing = await this.keywordRepo
      .createQueryBuilder('keyword')
      .where('keyword.categoryId = :categoryId', { categoryId: dto.categoryId })
      .andWhere('LOWER(keyword.keyword) = LOWER(:keyword)', { keyword: trimmed })
      .getOne();

    if (existing) {
      return this.keywordRepo.findOne({
        where: { id: existing.id },
        relations: ['category'],
        select: { category: { categoryId: true, name: true, slug: true } },
      });
    }

    const keyword = this.keywordRepo.create({
      keyword: trimmed,
      categoryId: dto.categoryId,
    });

    const saved = await this.keywordRepo.save(keyword);

    return this.keywordRepo.findOne({
      where: { id: saved.id },
      relations: ['category'],
      select: { category: { categoryId: true, name: true, slug: true } },
    });
  }

  async findAll() {
    return this.keywordRepo.find({
      relations: ['category'],
      order: { keyword: 'ASC' },
      select: { category: { categoryId: true, name: true, slug: true } },
    });
  }

  async findByCategory(categoryId: string) {
    return this.keywordRepo.find({
      where: { categoryId },
      order: { keyword: 'ASC' },
    });
  }

  async findOne(id: string) {
    const keyword = await this.keywordRepo.findOne({
      where: { id },
      relations: ['category'],
      select: { category: { categoryId: true, name: true, slug: true } },
    });
    if (!keyword) throw new NotFoundException('Keyword not found');
    return keyword;
  }

  async update(id: string, dto: { keyword?: string; categoryId?: string }) {
    const keyword = await this.keywordRepo.findOneBy({ id });
    if (!keyword) throw new NotFoundException('Keyword not found');

    if (dto.keyword) keyword.keyword = dto.keyword.trim();
    if (dto.categoryId) {
      const category = await this.categoryRepo.findOneBy({ categoryId: dto.categoryId });
      if (!category) throw new BadRequestException('Invalid categoryId');
      keyword.categoryId = dto.categoryId;
    }

    await this.keywordRepo.save(keyword);
    return keyword;
  }

  async remove(id: string) {
    const keyword = await this.keywordRepo.findOneBy({ id });
    if (!keyword) throw new NotFoundException('Keyword not found');
    await this.keywordRepo.remove(keyword);
    return { message: 'Keyword deleted successfully' };
  }
}