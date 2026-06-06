// src/modules/categories/services/category.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Category } from '../entities/category.entity';
import { Brand } from '@/modules/brands/entities/brand.entity';
import { ParentCategory } from './parent-category.entity';
import { Keyword } from './keyword.entity';
import { BrandParentCategory } from '@/modules/brands/entities/brand-parent-category.entity';
import { CreateCategoryDto, UpdateCategoryDto } from '../dto';
import * as slugify from 'slugify';
import { Sequelize } from 'sequelize-typescript';
import { Op } from 'sequelize';

@Injectable()
export class CategoryService {
  constructor(
    @InjectModel(Category) private readonly categoryModel: typeof Category,
    @InjectModel(Brand) private readonly brandModel: typeof Brand,
    @InjectModel(ParentCategory)
    private readonly parentCategoryModel: typeof ParentCategory,
    @InjectModel(Keyword) private readonly keywordModel: typeof Keyword,
    @InjectModel(BrandParentCategory)
    private readonly brandParentCategoryModel: typeof BrandParentCategory,
    private readonly sequelize: Sequelize,
  ) {}

  async create(dto: CreateCategoryDto) {
    const t = await this.sequelize.transaction();

    try {
      const { name, brandId, parentCategoryId, keywords = [] } = dto;

      if (!name || !brandId || !parentCategoryId) {
        throw new BadRequestException(
          'name, brandId and parentCategoryId are required',
        );
      }

      const [brand, parent] = await Promise.all([
        this.brandModel.findByPk(brandId, { transaction: t }),
        this.parentCategoryModel.findByPk(parentCategoryId, { transaction: t }),
      ]);

      if (!brand) throw new BadRequestException('Invalid brandId');
      if (!parent) throw new BadRequestException('Invalid parentCategoryId');

      // Ensure Brand-ParentCategory relationship exists
      await this.brandParentCategoryModel.findOrCreate({
        where: { brandId, parentCategoryId },
        defaults: { brandId, parentCategoryId },
        transaction: t,
      });

      const slug = slugify.default(name, { lower: true, strict: true });

      const category = await this.categoryModel.create(
        { name, slug, brandId, parentCategoryId },
        { transaction: t },
      );

      // Create keywords
      if (Array.isArray(keywords) && keywords.length) {
        const cleanKeywords = [
          ...new Set(
            keywords
              .map(String)
              .map((k) => k.trim())
              .filter(Boolean),
          ),
        ];

        for (const k of cleanKeywords) {
          await this.keywordModel.create(
            { keyword: k, categoryId: category.categoryId },
            { transaction: t },
          );
        }
      }

      await t.commit();

      return this.findOne(category.categoryId);
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }

  async findAll() {
    return this.categoryModel.findAll({
      include: [
        {
          model: ParentCategory,
          as: 'parentCategory',
          attributes: ['id', 'name', 'slug'],
        },
        {
          model: Brand,
          as: 'brand',
          attributes: ['id', 'brandName', 'brandSlug'],
        },
        { model: Keyword, as: 'keywords' },
      ],
      order: [
        ['name', 'ASC'],
        [{ model: Keyword, as: 'keywords' }, 'keyword', 'ASC'],
      ],
    });
  }

  async findOne(id: string) {
    const category = await this.categoryModel.findByPk(id, {
      include: [
        {
          model: ParentCategory,
          as: 'parentCategory',
          attributes: ['id', 'name', 'slug'],
        },
        {
          model: Brand,
          as: 'brand',
          attributes: ['id', 'brandName', 'brandSlug'],
        },
        { model: Keyword, as: 'keywords' },
      ],
    });

    if (!category) throw new NotFoundException('Category not found');
    return category;
  }

  async findByBrand(brandId: string) {
    return this.categoryModel.findAll({
      where: { brandId },
      include: [
        {
          model: ParentCategory,
          as: 'parentCategory',
          attributes: ['id', 'name', 'slug'],
        },
        {
          model: Brand,
          as: 'brand',
          attributes: ['id', 'brandName', 'brandSlug'],
        },
        { model: Keyword, as: 'keywords' },
      ],
      order: [
        ['name', 'ASC'],
        [{ model: Keyword, as: 'keywords' }, 'keyword', 'ASC'],
      ],
    });
  }

  async update(id: string, dto: UpdateCategoryDto) {
    const t = await this.sequelize.transaction();

    try {
      const category = await this.categoryModel.findByPk(id, {
        transaction: t,
      });
      if (!category) throw new NotFoundException('Category not found');

      const { name, brandId, parentCategoryId, keywords } = dto;

      if (brandId) {
        const brand = await this.brandModel.findByPk(brandId, {
          transaction: t,
        });
        if (!brand) throw new BadRequestException('Invalid brandId');
        category.brandId = brandId;
      }

      if (parentCategoryId) {
        const parent = await this.parentCategoryModel.findByPk(
          parentCategoryId,
          { transaction: t },
        );
        if (!parent) throw new BadRequestException('Invalid parentCategoryId');

        await this.brandParentCategoryModel.findOrCreate({
          where: { brandId: category.brandId, parentCategoryId },
          defaults: { brandId: category.brandId, parentCategoryId },
          transaction: t,
        });

        category.parentCategoryId = parentCategoryId;
      }

      if (name) {
        category.name = name;
        category.slug = slugify.default(name, { lower: true, strict: true });
      }

      await category.save({ transaction: t });

      // Handle keywords replacement if provided
      if (Array.isArray(keywords)) {
        await this.replaceKeywords(id, keywords, t);
      }

      await t.commit();
      return this.findOne(id);
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }

  private async replaceKeywords(
    categoryId: string,
    incomingKeywords: string[],
    transaction?: any,
  ) {
    const incoming = [
      ...new Set(
        incomingKeywords
          .map(String)
          .map((k) => k.trim())
          .filter(Boolean),
      ),
    ];

    const existing = await this.keywordModel.findAll({
      where: { categoryId },
      transaction,
    });

    const existingSet = new Set(existing.map((k) => k.keyword));
    const toAdd = incoming.filter((k) => !existingSet.has(k));
    const toRemove = existing
      .filter((k) => !incoming.includes(k.keyword))
      .map((k) => k.keyword);

    if (toRemove.length) {
      await this.keywordModel.destroy({
        where: { categoryId, keyword: { [Op.in]: toRemove } },
        transaction,
      });
    }

    for (const k of toAdd) {
      await this.keywordModel.create(
        { keyword: k, categoryId },
        { transaction },
      );
    }
  }

  async replaceKeywordsOnly(id: string, keywords: string[]) {
    const t = await this.sequelize.transaction();
    try {
      const category = await this.categoryModel.findByPk(id, {
        transaction: t,
      });
      if (!category) throw new NotFoundException('Category not found');

      await this.replaceKeywords(id, keywords, t);
      await t.commit();

      return this.findOne(id);
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }

  async remove(id: string) {
    const category = await this.findOne(id);
    await category.destroy();
  }
}
